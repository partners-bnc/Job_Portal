import argparse

from resume_pipeline import (
    DEFAULT_ARTIFACTS_PREFIX,
    DEFAULT_FAILURES_OUT,
    DEFAULT_GCS_PREFIX,
    DEFAULT_MAX_RETRIES,
    DEFAULT_MAX_WORKERS,
    DEFAULT_RESULTS_OUT,
    DEFAULT_SOURCE,
    DEFAULT_STATUS,
    DEFAULT_SUMMARY_OUT,
    DEFAULT_UPLOADED_BY,
    MODEL,
    PROJECT_ID,
    run_batch,
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
    return run_batch(
        project_id=args.project_id,
        model=args.model,
        gcs_prefix=args.gcs_prefix,
        max_workers=args.max_workers,
        max_retries=args.max_retries,
        limit=args.limit,
        source=args.source,
        uploaded_by=args.uploaded_by,
        status=args.status,
        results_out=args.results_out,
        summary_out=args.summary_out,
        failures_out=args.failures_out,
        artifacts_gcs_prefix=args.artifacts_gcs_prefix,
        pdf_uris=args.pdf_uris,
    )


if __name__ == "__main__":
    raise SystemExit(main())
