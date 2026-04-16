import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


DEFAULT_INPUT = Path("vertex_realtime_results.json")
DEFAULT_SOURCE = "Vertex Import"
DEFAULT_UPLOADED_BY = "Vertex Pipeline"
DEFAULT_STATUS = "In Database"
DEFAULT_SUPABASE_RETRIES = 3
SUPABASE_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


def get_env(name: str, fallback: str | None = None) -> str:
    value = os.environ.get(name) or fallback
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


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


def load_results(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))


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


def parse_args():
    parser = argparse.ArgumentParser(description="Upsert Vertex resume parsing results into Supabase applicants.")
    parser.add_argument("--input", default=str(DEFAULT_INPUT), help="Path to the Vertex results JSON file.")
    parser.add_argument("--source", default=DEFAULT_SOURCE, help="Value for applicants.source.")
    parser.add_argument("--uploaded-by", default=DEFAULT_UPLOADED_BY, help="Value for applicants.uploaded_by.")
    parser.add_argument("--status", default=DEFAULT_STATUS, help="Value for applicants.status.")
    parser.add_argument("--summary-out", default="", help="Optional path to write the upsert summary JSON.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        base_url = get_env("SUPABASE_URL", os.environ.get("VITE_SUPABASE_URL"))
        service_key = get_env("SUPABASE_SERVICE_ROLE_KEY")
    except Exception as error:  # noqa: BLE001
        print(str(error), file=sys.stderr)
        return 1

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Input file not found: {input_path}", file=sys.stderr)
        return 1

    results = load_results(input_path)
    summary = upsert_results(
        results=results,
        base_url=base_url,
        service_key=service_key,
        source=args.source,
        uploaded_by=args.uploaded_by,
        status=args.status,
    )

    print(json.dumps(summary, indent=2))

    if args.summary_out:
        Path(args.summary_out).write_text(json.dumps(summary, indent=2), encoding="utf-8")

    return 0 if summary["failed"] == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
