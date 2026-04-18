-- Run this in the Supabase SQL Editor before using the new fields in production.
-- Adds Job Type and Job Mode support to the client_jobs table.

alter table public.client_jobs
  add column if not exists job_type text;

alter table public.client_jobs
  add column if not exists job_mode text;

update public.client_jobs
set
  job_type = coalesce(nullif(job_type, ''), 'Full Time'),
  job_mode = coalesce(nullif(job_mode, ''), 'Onsite')
where job_type is null
   or job_type = ''
   or job_mode is null
   or job_mode = '';

alter table public.client_jobs
  alter column job_type set default 'Full Time';

alter table public.client_jobs
  alter column job_mode set default 'Onsite';

create index if not exists idx_client_jobs_job_type
  on public.client_jobs (job_type);

create index if not exists idx_client_jobs_job_mode
  on public.client_jobs (job_mode);
