-- Supabase schema for AI LMS Interviewer

-- Create sessions table
create table if not exists public.sessions (
  id text primary key,
  name text,
  start_time timestamptz not null default now(),
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  summary jsonb
);

-- Ensure questions/answers are JSON arrays
-- Recreate constraints idempotently (IF NOT EXISTS not supported for constraints)
alter table public.sessions
  drop constraint if exists sessions_questions_is_array,
  drop constraint if exists sessions_answers_is_array;

alter table public.sessions
  add constraint sessions_questions_is_array
    check (jsonb_typeof(questions) = 'array'),
  add constraint sessions_answers_is_array
    check (jsonb_typeof(answers) = 'array');

-- Index for recent-first reads in admin
create index if not exists sessions_start_time_idx
  on public.sessions (start_time desc);

-- Enable Row Level Security (service role bypasses RLS)
alter table public.sessions enable row level security;

-- Optional: allow authenticated users to read sessions (not required for server-only access)
-- create policy if not exists "allow authenticated read sessions"
--   on public.sessions for select
--   to authenticated
--   using (true);

-- Smoke test (optional)
-- insert into public.sessions (id, name) values ('test-session', 'Test User')
-- on conflict (id) do nothing;
-- select * from public.sessions order by start_time desc limit 1;
