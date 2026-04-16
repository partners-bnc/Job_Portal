import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from datetime import datetime, timezone

import google.auth
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.cloud import storage

PROJECT_ID = "authforpartner"
MODEL = "gemini-2.5-flash-lite"
DEFAULT_GCS_PREFIX = "gs://bnc-resume-pipeline-100/raw/pdf/test/"
DEFAULT_MAX_WORKERS = 5
DEFAULT_SOURCE = "Vertex Import"
DEFAULT_UPLOADED_BY = "Vertex Pipeline"
DEFAULT_STATUS = "In Database"
DEFAULT_RESULTS_OUT = Path("vertex_realtime_results.json")
DEFAULT_SUMMARY_OUT = Path("upsert_summary.json")
DEFAULT_FAILURES_OUT = Path("failed_results.json")
DEFAULT_ARTIFACTS_PREFIX = ""
DEFAULT_MAX_RETRIES = 3
RETRYABLE_STATUS_CODES = {429, 500, 503}
DEFAULT_SUPABASE_RETRIES = 3
SUPABASE_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}

PROMPT = """You are a resume parser. Analyze this resume and return ONLY a valid JSON object that matches this exact schema.

{
  "candidateName": "string or null",
  "email": "string or null",
  "contactNumber": "string or null",
  "currentLocation": "string or null",
  "education": [
    {
      "institution": "string or null",
      "location": "string or null",
      "degree": "string or null",
      "major": "string or null",
      "startDate": "string or null",
      "endDate": "string or null"
    }
  ],
  "totalExperience": "0 | 1 | 2 | 3 | 4 | 5 | 6-10 | 10+ | null",
  "currentCompany": "string or null",
  "currentPosition": "string or null",
  "skills": ["string"],
  "certifications": ["string"],
  "summary": "string or null"
}

Rules:
- Return only JSON, no markdown, no explanation, no code fences.
- Do not add extra keys.
- If a scalar field cannot be determined, use null.
- If no education entries are found, return an empty array.
- If no skills are found, return an empty array.
- If no certifications are found, return an empty array.
- For totalExperience, return only one of these exact string values: "0", "1", "2", "3", "4", "5", "6-10", "10+", or null.
- Internships, traineeships, apprenticeships, and part-time roles count as work experience evidence.
- If the resume only shows internship or trainee experience totaling less than 12 months, return "0" for totalExperience instead of null.
- If there is a clear internship role, still populate currentCompany and currentPosition from the most recent internship even when totalExperience is "0".
- Prefer values explicitly supported by the resume. Do not guess.
- Preserve multiple education entries when present.
- Skills must be short normalized strings, not long phrases when a simpler skill name is clear."""


def get_env(name: str, fallback: str | None = None) -> str:
    value = os.environ.get(name) or fallback
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def get_access_token() -> str:
    env_token = os.environ.get("GCP_TOKEN", "").strip()
    if env_token:
        return env_token

    credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    credentials.refresh(GoogleAuthRequest())
    token = credentials.token.strip()
    if not token:
        raise RuntimeError("Failed to get Google access token from application default credentials.")
    return token


def parse_gcs_uri(gcs_uri: str) -> tuple[str, str]:
    if not gcs_uri.startswith("gs://"):
        raise ValueError(f"Expected a gs:// URI, got: {gcs_uri}")
    without_scheme = gcs_uri[5:]
    bucket_name, _, object_path = without_scheme.partition("/")
    return bucket_name, object_path


def build_run_id() -> str:
    execution_id = os.environ.get("CLOUD_RUN_EXECUTION", "").strip()
    if execution_id:
        return execution_id
    return datetime.now(timezone.utc).strftime("run-%Y%m%d-%H%M%S")


def list_gcs_pdfs(storage_client: storage.Client, gcs_prefix: str) -> list[str]:
    bucket_name, prefix = parse_gcs_uri(gcs_prefix.rstrip("/") + "/")
    bucket = storage_client.bucket(bucket_name)
    uris = []
    for blob in bucket.list_blobs(prefix=prefix):
        if blob.name.lower().endswith(".pdf"):
            uris.append(f"gs://{bucket_name}/{blob.name}")
    return sorted(set(uris))


def build_request_body(pdf_uri: str) -> bytes:
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "fileData": {
                            "mimeType": "application/pdf",
                            "fileUri": pdf_uri,
                        }
                    },
                    {"text": PROMPT},
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        },
    }
    return json.dumps(payload).encode("utf-8")


def parse_resume(pdf_uri: str, token: str, project_id: str, model: str) -> dict:
    url = (
        f"https://aiplatform.googleapis.com/v1/projects/{project_id}"
        f"/locations/global/publishers/google/models/{model}:generateContent"
    )
    request = urllib.request.Request(
        url=url,
        data=build_request_body(pdf_uri),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8",
        },
        method="POST",
    )

    started_at = time.time()
    with urllib.request.urlopen(request, timeout=120) as response:
        raw = response.read().decode("utf-8")
    elapsed = round(time.time() - started_at, 2)

    response_json = json.loads(raw)
    candidate_text = response_json["candidates"][0]["content"]["parts"][0]["text"]
    parsed_resume = json.loads(candidate_text)

    return {
        "pdfUri": pdf_uri,
        "elapsedSeconds": elapsed,
        "modelVersion": response_json.get("modelVersion"),
        "usageMetadata": response_json.get("usageMetadata", {}),
        "parsedResume": parsed_resume,
        "status": "success",
    }


def parse_resume_safe(pdf_uri: str, token: str, project_id: str, model: str, max_retries: int) -> dict:
    attempt = 0
    while True:
        try:
            result = parse_resume(pdf_uri, token, project_id, model)
            result["attempts"] = attempt + 1
            return result
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            if error.code in RETRYABLE_STATUS_CODES and attempt < max_retries:
                delay_seconds = 5 * (2**attempt)
                print(
                    f"Retrying {pdf_uri} after HTTP {error.code}. "
                    f"Attempt {attempt + 1}/{max_retries + 1}. Sleeping {delay_seconds}s."
                )
                time.sleep(delay_seconds)
                attempt += 1
                continue
            return {
                "pdfUri": pdf_uri,
                "status": "error",
                "errorType": "HTTPError",
                "statusCode": error.code,
                "errorBody": body,
                "attempts": attempt + 1,
            }
        except Exception as error:  # noqa: BLE001
            return {
                "pdfUri": pdf_uri,
                "status": "error",
                "errorType": type(error).__name__,
                "errorBody": str(error),
                "attempts": attempt + 1,
            }


def run_parallel(
    pdf_uris: list[str],
    token: str,
    project_id: str,
    model: str,
    max_workers: int,
    max_retries: int,
) -> list[dict]:
    results: list[dict] = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(parse_resume_safe, uri, token, project_id, model, max_retries): uri
            for uri in pdf_uris
        }
        for future in as_completed(futures):
            result = future.result()
            results.append(result)
            print(f"[{result['status']}] {result['pdfUri']}")
    return sorted(results, key=lambda item: item["pdfUri"])


def normalize_email(value: str | None) -> str:
    text = (value or "").strip().lower()
    if not text:
        return ""

    matches = re.findall(r"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}", text)
    if matches:
        return matches[0]
    return text


def normalize_phone(value: str | None) -> str:
    return "".join(ch for ch in (value or "") if ch.isdigit())


def normalize_string(value: str | None) -> str:
    return (value or "").strip()


def sanitize_storage_component(value: str | None, fallback: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", normalize_string(value))
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return cleaned or fallback


def normalize_string_list(values) -> list[str]:
    if not isinstance(values, list):
        return []
    cleaned = []
    seen = set()
    for value in values:
        item = normalize_string(value)
        if item and item.lower() not in seen:
            cleaned.append(item)
            seen.add(item.lower())
    return cleaned


def format_education(education) -> str:
    if not isinstance(education, list):
        return ""

    lines = []
    for item in education:
        if not isinstance(item, dict):
            continue
        parts = [
            normalize_string(item.get("degree")),
            normalize_string(item.get("major")),
            normalize_string(item.get("institution")),
            normalize_string(item.get("location")),
            normalize_string(item.get("startDate")),
            normalize_string(item.get("endDate")),
        ]
        parts = [part for part in parts if part]
        if parts:
            lines.append(" | ".join(parts))
    return "\n".join(lines)


def build_candidate_payload(result: dict, source: str, uploaded_by: str, status: str) -> dict:
    parsed = result.get("parsedResume", {})
    skills = normalize_string_list(parsed.get("skills"))
    certifications = normalize_string_list(parsed.get("certifications"))

    return {
        "source": source,
        "full_name": normalize_string(parsed.get("candidateName")),
        "email": normalize_email(parsed.get("email")),
        "mobile_number": normalize_phone(parsed.get("contactNumber")),
        "current_location": normalize_string(parsed.get("currentLocation")),
        "current_company": normalize_string(parsed.get("currentCompany")),
        "current_position": normalize_string(parsed.get("currentPosition")),
        "total_experience": normalize_string(parsed.get("totalExperience")),
        "education": format_education(parsed.get("education")),
        "skills": ", ".join(skills),
        "cv_summary": normalize_string(parsed.get("summary")),
        "certification": ", ".join(certifications),
        "uploaded_by": uploaded_by,
        "status": status,
    }


def supabase_request(
    base_url: str,
    service_key: str,
    method: str,
    path: str,
    payload=None,
    max_retries: int = DEFAULT_SUPABASE_RETRIES,
):
    url = f"{base_url.rstrip('/')}/rest/v1/{path.lstrip('/')}"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    attempt = 0
    while True:
        request = urllib.request.Request(url=url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                body = response.read().decode("utf-8")
                return json.loads(body) if body else []
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            if error.code in SUPABASE_RETRYABLE_STATUS_CODES and attempt < max_retries:
                delay_seconds = 3 * (2**attempt)
                print(
                    f"Retrying Supabase {method} {url} after HTTP {error.code}. "
                    f"Attempt {attempt + 1}/{max_retries + 1}. Sleeping {delay_seconds}s."
                )
                time.sleep(delay_seconds)
                attempt += 1
                continue
            raise RuntimeError(f"Supabase {method} {url} failed: {error.code} {body}") from error


def find_existing_applicant(base_url: str, service_key: str, email: str, phone: str):
    if not email and not phone:
        return None

    query = "select=id,applicant_code,email,mobile_number&limit=1"
    if email and phone:
        email_filter = urllib.parse.quote(f"email.ilike.{email}", safe="")
        phone_filter = urllib.parse.quote(f"mobile_number.eq.{phone}", safe="")
        path = f"applicants?{query}&or=({email_filter},{phone_filter})"
    elif email:
        path = f"applicants?{query}&email=ilike.{urllib.parse.quote(email, safe='')}"
    else:
        path = f"applicants?{query}&mobile_number=eq.{urllib.parse.quote(phone, safe='')}"

    rows = supabase_request(base_url, service_key, "GET", path)
    return rows[0] if rows else None


def insert_applicant(base_url: str, service_key: str, payload: dict):
    rows = supabase_request(base_url, service_key, "POST", "applicants", payload)
    return rows[0] if rows else None


def update_applicant(base_url: str, service_key: str, row_id: str, payload: dict):
    path = f"applicants?id=eq.{urllib.parse.quote(str(row_id), safe='')}"
    rows = supabase_request(base_url, service_key, "PATCH", path, payload)
    return rows[0] if rows else None


def build_resume_storage_path(applicant_code: str, candidate_name: str) -> str:
    safe_code = sanitize_storage_component(applicant_code, "unknown_code")
    safe_name = sanitize_storage_component(candidate_name, "Resume")
    return f"resumes/{safe_code}_{safe_name}.pdf"


def build_resume_public_url(base_url: str, storage_path: str) -> str:
    encoded_path = urllib.parse.quote(storage_path, safe="/")
    return f"{base_url.rstrip('/')}/storage/v1/object/public/resumes/{encoded_path}"


def download_gcs_file_bytes(storage_client: storage.Client, gcs_uri: str) -> bytes:
    bucket_name, object_path = parse_gcs_uri(gcs_uri)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(object_path)
    return blob.download_as_bytes()


def upload_resume_to_supabase_storage(
    base_url: str,
    service_key: str,
    storage_path: str,
    file_bytes: bytes,
) -> str:
    encoded_path = urllib.parse.quote(storage_path, safe="/")
    url = f"{base_url.rstrip('/')}/storage/v1/object/resumes/{encoded_path}"
    request = urllib.request.Request(
        url=url,
        data=file_bytes,
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/pdf",
            "x-upsert": "true",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            response.read()
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase storage upload failed: {error.code} {body}") from error
    return build_resume_public_url(base_url, storage_path)


def upsert_results(results: list[dict], base_url: str, service_key: str, source: str, uploaded_by: str, status: str):
    summary = {
        "inserted": 0,
        "updated": 0,
        "skipped": 0,
        "failed": 0,
        "items": [],
    }

    for result in results:
        pdf_uri = result.get("pdfUri", "")
        if result.get("status") != "success":
            summary["failed"] += 1
            summary["items"].append({
                "pdfUri": pdf_uri,
                "status": "failed",
                "reason": result.get("errorBody", "Non-success parse result"),
            })
            continue

        payload = build_candidate_payload(result, source, uploaded_by, status)
        if not (payload["email"] or payload["mobile_number"] or payload["full_name"]):
            summary["skipped"] += 1
            summary["items"].append({
                "pdfUri": pdf_uri,
                "status": "skipped",
                "reason": "Missing name, email, and phone after normalization.",
            })
            continue

        try:
            existing = find_existing_applicant(
                base_url=base_url,
                service_key=service_key,
                email=payload["email"],
                phone=payload["mobile_number"],
            )
            if existing:
                update_applicant(
                    base_url=base_url,
                    service_key=service_key,
                    row_id=existing["id"],
                    payload=payload,
                )
                summary["updated"] += 1
                summary["items"].append({
                    "pdfUri": pdf_uri,
                    "status": "updated",
                    "rowId": existing.get("id"),
                    "applicantCode": existing.get("applicant_code"),
                })
            else:
                inserted = insert_applicant(
                    base_url=base_url,
                    service_key=service_key,
                    payload=payload,
                )
                summary["inserted"] += 1
                summary["items"].append({
                    "pdfUri": pdf_uri,
                    "status": "inserted",
                    "rowId": (inserted or {}).get("id"),
                    "applicantCode": (inserted or {}).get("applicant_code"),
                })
        except Exception as error:  # noqa: BLE001
            summary["failed"] += 1
            summary["items"].append({
                "pdfUri": pdf_uri,
                "status": "failed",
                "reason": str(error),
            })

    return summary


def attach_resume_files(
    results: list[dict],
    summary: dict,
    base_url: str,
    service_key: str,
    storage_client: storage.Client,
) -> dict:
    summary_by_uri = {item["pdfUri"]: item for item in summary["items"]}

    for result in results:
        if result.get("status") != "success":
            continue

        pdf_uri = result.get("pdfUri", "")
        summary_item = summary_by_uri.get(pdf_uri)
        if not summary_item or summary_item["status"] not in {"inserted", "updated"}:
            continue

        applicant_code = summary_item.get("applicantCode")
        candidate_name = result.get("parsedResume", {}).get("candidateName")
        if not applicant_code:
            summary_item["resumeUploadStatus"] = "skipped"
            summary_item["resumeUploadReason"] = "Missing applicant code."
            continue

        try:
            file_bytes = download_gcs_file_bytes(storage_client, pdf_uri)
            storage_path = build_resume_storage_path(applicant_code, candidate_name or "Resume")
            public_url = upload_resume_to_supabase_storage(
                base_url=base_url,
                service_key=service_key,
                storage_path=storage_path,
                file_bytes=file_bytes,
            )
            update_applicant(
                base_url=base_url,
                service_key=service_key,
                row_id=summary_item.get("rowId"),
                payload={"resume_link": public_url},
            )
            summary_item["resumeUploadStatus"] = "uploaded"
            summary_item["resumeStoragePath"] = storage_path
            summary_item["resumeLink"] = public_url
        except Exception as error:  # noqa: BLE001
            summary["failed"] += 1
            summary_item["status"] = "failed"
            summary_item["resumeUploadStatus"] = "failed"
            summary_item["reason"] = str(error)

    return summary


def write_json(path: Path, payload) -> None:
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def upload_json_to_gcs(storage_client: storage.Client, gcs_uri: str, payload) -> None:
    bucket_name, object_path = parse_gcs_uri(gcs_uri)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(object_path)
    blob.upload_from_string(
        json.dumps(payload, indent=2),
        content_type="application/json",
    )


def upload_artifacts_to_gcs(
    storage_client: storage.Client,
    artifacts_gcs_prefix: str,
    run_id: str,
    results: list[dict],
    summary: dict,
    failures: list[dict],
) -> dict[str, str]:
    prefix = artifacts_gcs_prefix.rstrip("/")
    destinations = {
        "results": f"{prefix}/{run_id}/results.json",
        "summary": f"{prefix}/{run_id}/summary.json",
        "failures": f"{prefix}/{run_id}/failures.json",
    }
    upload_json_to_gcs(storage_client, destinations["results"], results)
    upload_json_to_gcs(storage_client, destinations["summary"], summary)
    upload_json_to_gcs(storage_client, destinations["failures"], failures)
    return destinations


def emit_failure_logs(summary: dict) -> None:
    failed_items = [item for item in summary["items"] if item["status"] in {"failed", "skipped"}]
    if not failed_items:
        print("No failed or skipped items in this run.")
        return

    print(f"Failure details count: {len(failed_items)}")
    for item in failed_items:
        print(
            "FAILURE_DETAIL "
            + json.dumps(
                {
                    "pdfUri": item.get("pdfUri"),
                    "status": item.get("status"),
                    "reason": item.get("reason") or item.get("resumeUploadReason"),
                    "applicantCode": item.get("applicantCode"),
                },
                ensure_ascii=True,
            )
        )


def parse_args():
    parser = argparse.ArgumentParser(
        description="Parse resume PDFs from GCS with Vertex realtime and upsert them into Supabase."
    )
    parser.add_argument(
        "--project-id",
        default=PROJECT_ID,
        help="Google Cloud project id.",
    )
    parser.add_argument(
        "--model",
        default=MODEL,
        help="Vertex model id.",
    )
    parser.add_argument(
        "--gcs-prefix",
        default=DEFAULT_GCS_PREFIX,
        help="GCS prefix to scan for PDFs when no explicit URIs are provided.",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=DEFAULT_MAX_WORKERS,
        help="Number of parallel Vertex requests.",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=DEFAULT_MAX_RETRIES,
        help="Retries for retryable Vertex/API failures such as 429, 500, and 503.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Optional max number of PDFs to process from the prefix. 0 means no limit.",
    )
    parser.add_argument(
        "--source",
        default=DEFAULT_SOURCE,
        help="Value for applicants.source.",
    )
    parser.add_argument(
        "--uploaded-by",
        default=DEFAULT_UPLOADED_BY,
        help="Value for applicants.uploaded_by.",
    )
    parser.add_argument(
        "--status",
        default=DEFAULT_STATUS,
        help="Value for applicants.status.",
    )
    parser.add_argument(
        "--results-out",
        default=str(DEFAULT_RESULTS_OUT),
        help="Path to write the raw parse results JSON.",
    )
    parser.add_argument(
        "--summary-out",
        default=str(DEFAULT_SUMMARY_OUT),
        help="Path to write the upsert summary JSON.",
    )
    parser.add_argument(
        "--failures-out",
        default=str(DEFAULT_FAILURES_OUT),
        help="Path to write failed parse/upsert items.",
    )
    parser.add_argument(
        "--artifacts-gcs-prefix",
        default=DEFAULT_ARTIFACTS_PREFIX,
        help="Optional gs:// prefix to upload results.json, summary.json, and failures.json.",
    )
    parser.add_argument(
        "pdf_uris",
        nargs="*",
        help="Optional explicit GCS PDF URIs. If omitted, the script scans --gcs-prefix.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    run_id = build_run_id()
    print(
        f"Starting worker with project_id={args.project_id}, "
        f"gcs_prefix={args.gcs_prefix}, limit={args.limit}, max_workers={args.max_workers}, model={args.model}, run_id={run_id}"
    )

    try:
        token = get_access_token()
        storage_client = storage.Client(project=args.project_id)
        base_url = get_env("SUPABASE_URL", os.environ.get("VITE_SUPABASE_URL"))
        service_key = get_env("SUPABASE_SERVICE_ROLE_KEY")
    except Exception as error:  # noqa: BLE001
        print(str(error), file=sys.stderr)
        return 1

    pdf_uris = args.pdf_uris
    if not pdf_uris:
        try:
            pdf_uris = list_gcs_pdfs(storage_client, args.gcs_prefix)
            print(f"Discovered {len(pdf_uris)} PDF(s) under {args.gcs_prefix}")
        except Exception as error:  # noqa: BLE001
            print(f"Failed to list GCS PDFs: {error}", file=sys.stderr)
            return 1

    if args.limit and args.limit > 0:
        pdf_uris = pdf_uris[: args.limit]

    if not pdf_uris:
        print("No PDF URIs found to process.", file=sys.stderr)
        return 1

    print(f"Processing {len(pdf_uris)} PDF(s) with model {args.model}...")
    results = run_parallel(
        pdf_uris=pdf_uris,
        token=token,
        project_id=args.project_id,
        model=args.model,
        max_workers=args.max_workers,
        max_retries=args.max_retries,
    )
    write_json(Path(args.results_out), results)

    summary = upsert_results(
        results=results,
        base_url=base_url,
        service_key=service_key,
        source=args.source,
        uploaded_by=args.uploaded_by,
        status=args.status,
    )
    summary = attach_resume_files(
        results=results,
        summary=summary,
        base_url=base_url,
        service_key=service_key,
        storage_client=storage_client,
    )
    write_json(Path(args.summary_out), summary)

    failures = [
        item for item in summary["items"] if item["status"] in {"failed", "skipped"}
    ]
    write_json(Path(args.failures_out), failures)
    emit_failure_logs(summary)

    if args.artifacts_gcs_prefix:
        try:
            uploaded_artifacts = upload_artifacts_to_gcs(
                storage_client=storage_client,
                artifacts_gcs_prefix=args.artifacts_gcs_prefix,
                run_id=run_id,
                results=results,
                summary=summary,
                failures=failures,
            )
            print(
                "Uploaded artifacts to GCS: "
                + json.dumps(uploaded_artifacts, ensure_ascii=True)
            )
        except Exception as error:  # noqa: BLE001
            print(f"Failed to upload artifacts to GCS: {error}", file=sys.stderr)
            return 1

    success_count = sum(result["status"] == "success" for result in results)
    print(f"Parsed successfully: {success_count}/{len(results)}")
    print(
        f"Upserts -> inserted: {summary['inserted']}, updated: {summary['updated']}, "
        f"skipped: {summary['skipped']}, failed: {summary['failed']}"
    )
    print(f"Saved parse results to {args.results_out}")
    print(f"Saved upsert summary to {args.summary_out}")
    print(f"Saved failures to {args.failures_out}")

    return 0 if summary["failed"] == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
