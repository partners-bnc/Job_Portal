# BnC Recruitment Portal

This project uses React 19, React Router v7, Vite 7, and Tailwind CSS v4.

## Scripts
- npm run dev
- npm run build
- npm run lint
- npm run preview

## Resume Ingest Pipeline
- `python scripts/process_gcs_resumes_to_supabase.py` keeps the existing batch-oriented Cloud Run job flow.
- `python scripts/enqueue_gcs_resumes_to_cloud_tasks.py --gcs-prefix ... --drop-id ... --queue resume-ingest --service-url ... --service-account-email ...` lists PDFs in GCS and enqueues one Cloud Task per resume for backfills.
- `scripts/deploy_resume_enqueue_launcher.ps1` builds and deploys `resume-enqueue-launcher`, a Cloud Run job that runs the enqueue command inside GCP instead of on a laptop.
- `scripts/publish_resume_backfill.ps1` now executes the `resume-enqueue-launcher` Cloud Run job with batch-specific args so a full enqueue keeps running even if your machine sleeps.
- `scripts/resume_queue_worker.py` is the Cloud Run service entrypoint for authenticated HTTP task delivery. It processes one resume per request, writes a status record to `INGEST_STATUS_GCS_PREFIX`, and safely no-ops on already-successful messages.
- `scripts/deploy_resume_queue_worker.ps1` builds and deploys the queue worker with Cloud Run `concurrency=1`, `min-instances=3`, and `max-instances=3` to match the current safe Gemini throughput envelope.
- `scripts/setup_resume_ingest_cloud_tasks.ps1` creates or updates the Cloud Tasks queue with rate-controlled dispatch settings (`max-concurrent-dispatches=3`, `max-dispatches-per-second=1`).
- `python scripts/summarize_ingest_run.py --drop-id backfill-batch-test` prints a clean run summary from the cached `_summary.json` in GCS when available, so large runs return quickly.
- Add `--write-summary` to `summarize_ingest_run.py` to persist `_summary.json` back into the run folder in GCS for console inspection.
- Add `--rebuild` if you need a full deep scan of all per-file status JSON records for detailed failure lists.
