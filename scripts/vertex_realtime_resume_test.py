import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


PROJECT_ID = "authforpartner"
MODEL = "gemini-2.5-flash-lite"
DEFAULT_OUTPUT = Path("vertex_realtime_results.json")
DEFAULT_MAX_WORKERS = 5
GCLOUD_FALLBACK_PATHS = [
    "gcloud",
    r"C:\Users\rohan\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
]

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

DEFAULT_PDF_URIS = [
    # "gs://bnc-resume-pipeline-100/raw/pdf/test/Abhay Singh_Data Analyst.pdf",
    # "gs://bnc-resume-pipeline-100/raw/pdf/test/Abhishek Negi_Data Analyst.pdf",
    # "gs://bnc-resume-pipeline-100/raw/pdf/test/Abhishek Sharma_Data Analyst.pdf",
    "gs://bnc-resume-pipeline-100/raw/pdf/test/Ankit Kumar _Data Analyst.pdf",
    # "gs://bnc-resume-pipeline-100/raw/pdf/test/Ankur Pal_Data Analyst.pdf",
]


def get_access_token() -> str:
    env_token = os.environ.get("GCP_TOKEN", "").strip()
    if env_token:
        return env_token

    for gcloud_path in GCLOUD_FALLBACK_PATHS:
        try:
            result = subprocess.run(
                [gcloud_path, "auth", "print-access-token"],
                capture_output=True,
                text=True,
                check=True,
            )
            token = result.stdout.strip()
            if token:
                return token
        except FileNotFoundError:
            continue
        except subprocess.CalledProcessError as error:
            stderr = error.stderr.strip() if error.stderr else str(error)
            raise RuntimeError(f"gcloud failed to print an access token: {stderr}") from error

    raise RuntimeError(
        "Could not find gcloud. Set GCP_TOKEN in your environment or install/add gcloud to PATH."
    )


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


def extract_candidate_text(response_json: dict) -> str:
    return response_json["candidates"][0]["content"]["parts"][0]["text"]


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
    candidate_text = extract_candidate_text(response_json)
    parsed_resume = json.loads(candidate_text)

    return {
        "pdfUri": pdf_uri,
        "elapsedSeconds": elapsed,
        "modelVersion": response_json.get("modelVersion"),
        "usageMetadata": response_json.get("usageMetadata", {}),
        "parsedResume": parsed_resume,
    }


def parse_resume_safe(pdf_uri: str, token: str, project_id: str, model: str) -> dict:
    try:
        result = parse_resume(pdf_uri, token, project_id, model)
        result["status"] = "success"
        return result
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        return {
            "pdfUri": pdf_uri,
            "status": "error",
            "errorType": "HTTPError",
            "statusCode": error.code,
            "errorBody": body,
        }
    except Exception as error:  # noqa: BLE001
        return {
            "pdfUri": pdf_uri,
            "status": "error",
            "errorType": type(error).__name__,
            "errorBody": str(error),
        }


def run_parallel(pdf_uris: list[str], token: str, project_id: str, model: str, max_workers: int) -> list[dict]:
    results: list[dict] = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(parse_resume_safe, uri, token, project_id, model): uri
            for uri in pdf_uris
        }
        for future in as_completed(futures):
            result = future.result()
            results.append(result)
            status = result["status"]
            uri = result["pdfUri"]
            print(f"[{status}] {uri}")
    return sorted(results, key=lambda item: item["pdfUri"])


def save_results(results: list[dict], output_path: Path) -> None:
    output_path.write_text(json.dumps(results, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Send resume PDFs in GCS to Vertex Gemini realtime in parallel."
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
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="Path to write the parsed results JSON file.",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=DEFAULT_MAX_WORKERS,
        help="Number of parallel requests.",
    )
    parser.add_argument(
        "pdf_uris",
        nargs="*",
        help="Optional list of GCS PDF URIs. If omitted, the 5 test PDFs are used.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    pdf_uris = args.pdf_uris or DEFAULT_PDF_URIS

    try:
        token = get_access_token()
    except Exception as error:  # noqa: BLE001
        print(f"Failed to get access token: {error}", file=sys.stderr)
        return 1

    print(f"Processing {len(pdf_uris)} PDF(s) with model {args.model}...")
    results = run_parallel(
        pdf_uris=pdf_uris,
        token=token,
        project_id=args.project_id,
        model=args.model,
        max_workers=args.max_workers,
    )

    output_path = Path(args.output)
    save_results(results, output_path)
    success_count = sum(result["status"] == "success" for result in results)
    print(f"Saved {len(results)} result(s) to {output_path}")
    print(f"Successful parses: {success_count}/{len(results)}")
    return 0 if success_count == len(results) else 2


if __name__ == "__main__":
    raise SystemExit(main())
