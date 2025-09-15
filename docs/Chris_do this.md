Hello Chris,

We are moving storage from Vercel Edge Config to Supabase (Postgres). Please set the following environment variables in `.env.local` (local) and in Vercel Project Settings (Preview/Production). Do NOT expose the service role key to the browser.

Required env vars:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."   # client reads (if any)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."       # server-only writes/reads (bypass RLS)

# Google Gemini API Key
GEMINI_API_KEY="your-api-key-here"
```

Database schema (run in Supabase SQL editor):
```
create table if not exists public.sessions (
  id text primary key,
  name text,
  start_time timestamptz not null default now(),
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  summary jsonb
);

-- Enable Row Level Security (we will use the service role in server routes)
alter table public.sessions enable row level security;
```

Notes:
- We will use the Supabase service role key inside Next.js server route handlers (`/api/*`) for all writes and privileged reads.
- The admin page will read sessions via server-side code, not directly from the browser.
- Keep the service role key ONLY in server environments (Vercel env vars, not exposed to client).

Thanks!
Gemini
