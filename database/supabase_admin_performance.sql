-- Run this in the Supabase SQL Editor for the production project.
-- These indexes are aligned to the new admin query patterns:
-- applicants, tagged candidates, clients, client jobs, and dashboard rollups.

create extension if not exists pg_trgm;

-- Applicants
create index if not exists idx_applicants_created_on_desc
  on public.applicants (created_on desc);

create index if not exists idx_applicants_status_created_on
  on public.applicants (status, created_on desc);

create index if not exists idx_applicants_uploaded_by_created_on
  on public.applicants (uploaded_by, created_on desc);

create index if not exists idx_applicants_source_created_on
  on public.applicants (source, created_on desc);

create index if not exists idx_applicants_shortlist_decision_created_on
  on public.applicants (shortlist_decision, created_on desc);

create index if not exists idx_applicants_applicant_code
  on public.applicants (applicant_code);

create index if not exists idx_applicants_full_name_trgm
  on public.applicants using gin (full_name gin_trgm_ops);

create index if not exists idx_applicants_email_trgm
  on public.applicants using gin (email gin_trgm_ops);

create index if not exists idx_applicants_mobile_number_trgm
  on public.applicants using gin (mobile_number gin_trgm_ops);

create index if not exists idx_applicants_current_position_trgm
  on public.applicants using gin (current_position gin_trgm_ops);

create index if not exists idx_applicants_job_applied_for_trgm
  on public.applicants using gin (job_applied_for gin_trgm_ops);

create index if not exists idx_applicants_current_company_trgm
  on public.applicants using gin (current_company gin_trgm_ops);

create index if not exists idx_applicants_skills_trgm
  on public.applicants using gin (skills gin_trgm_ops);

-- Tagged candidates
create index if not exists idx_tagged_candidates_job_code_created_at
  on public.tagged_candidates (job_code, created_at desc);

create index if not exists idx_tagged_candidates_applicant_code
  on public.tagged_candidates (applicant_code);

create index if not exists idx_tagged_candidates_current_stage
  on public.tagged_candidates (current_stage);

create index if not exists idx_tagged_candidates_shortlisted_by_created_at
  on public.tagged_candidates (shortlisted_by, created_at desc);

create index if not exists idx_tagged_candidates_name_trgm
  on public.tagged_candidates using gin (name gin_trgm_ops);

create index if not exists idx_tagged_candidates_job_role_trgm
  on public.tagged_candidates using gin (job_role gin_trgm_ops);

create index if not exists idx_tagged_candidates_company_trgm
  on public.tagged_candidates using gin (company gin_trgm_ops);

create index if not exists idx_tagged_candidates_job_code_trgm
  on public.tagged_candidates using gin (job_code gin_trgm_ops);

-- Clients
create index if not exists idx_clients_created_on_desc
  on public.clients (created_on desc);

create index if not exists idx_clients_client_id
  on public.clients (client_id);

create index if not exists idx_clients_client_name_trgm
  on public.clients using gin (client_name gin_trgm_ops);

create index if not exists idx_clients_industry_trgm
  on public.clients using gin (industry gin_trgm_ops);

create index if not exists idx_clients_managed_by_trgm
  on public.clients using gin (managed_by gin_trgm_ops);

create index if not exists idx_clients_business_unit_trgm
  on public.clients using gin (business_unit gin_trgm_ops);

create index if not exists idx_client_reporting_contact_client_id
  on public.client_reporting_contact (client_id);

-- Client jobs
create index if not exists idx_client_jobs_created_on_desc
  on public.client_jobs (created_on desc);

create index if not exists idx_client_jobs_job_code
  on public.client_jobs (job_code);

create index if not exists idx_client_jobs_status_created_on
  on public.client_jobs (status, created_on desc);

create index if not exists idx_client_jobs_client_id
  on public.client_jobs (client_id);

create index if not exists idx_client_jobs_job_title_trgm
  on public.client_jobs using gin (job_title gin_trgm_ops);

create index if not exists idx_client_jobs_client_name_trgm
  on public.client_jobs using gin (client_name gin_trgm_ops);

create index if not exists idx_client_jobs_location_trgm
  on public.client_jobs using gin (location gin_trgm_ops);

create index if not exists idx_client_jobs_recruitment_manager_trgm
  on public.client_jobs using gin (recruitment_manager gin_trgm_ops);

-- Dashboard support
create index if not exists idx_candidates_timestamp_desc
  on public.candidates (timestamp desc);

create index if not exists idx_communication_logs_hr_name_created_at
  on public.communication_logs (hr_name, created_at desc);

-- After running:
-- 1. Open Supabase Table Editor or SQL and confirm the indexes were created.
-- 2. Re-test the admin dashboard and list pages.
-- 3. If some pages are still slow at high volume, the next step is pre-aggregated
--    summary tables/materialized views for the dashboard charts and KPI cards.
