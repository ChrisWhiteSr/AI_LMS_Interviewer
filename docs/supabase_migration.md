# Supabase Migration Plan

This document describes the migration from Vercel Edge Config to Supabase (Postgres) for all application storage.

## Goals

- Replace all reads/writes that currently hit Edge Config with Supabase.
- Keep the current JSON-first session model to minimize code churn.
- Maintain server-only access for privileged operations via the Supabase service role key.

## Environment Variables

Set these in `.env.local` (local dev) and Vercel Project Settings (Preview/Production):

```
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."     # client reads (if needed)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."         # server-only, never exposed to the browser
GEMINI_API_KEY="your-gemini-api-key"
```

## Database Schema

Run in the Supabase SQL editor:

```
create table if not exists public.sessions (
  id text primary key,
  name text,
  start_time timestamptz not null default now(),
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  summary jsonb
);

alter table public.sessions enable row level security;
```

Notes:
- For V1, we will not expose direct client writes. All writes go through Next.js API routes using the service role key.
- We can add RLS policies later for read-only client access if needed.

## Route Mapping

- `POST /api/session/start`
  - Insert new row into `public.sessions` with `{ id, name, start_time, questions: [], answers: [], summary: null }`.

- `POST /api/question`
  - Select session by `id`.
  - Generate next question via Gemini.
  - Append question to `questions` array and update the row.
  - Return the new question.

- `POST /api/answer`
  - Select session by `id`.
  - Append answer to `answers` array and update the row.

- `GET /admin` (server-rendered)
  - Query `public.sessions` for all rows (or recent N), ordered by `start_time` desc.
  - Render list; no client-side Supabase needed in V1.

## Library and Client Usage

- Use `@supabase/supabase-js`.
- Create a server client with the service role key inside API routes.
- Do not ship the service role key to the browser.

Example server client (pseudo):

```
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
```

## Rollout Steps

1. Add env vars in local and Vercel.
2. Create `public.sessions` table via SQL above.
3. Swap the storage implementation in API routes to Supabase.
4. Update `/admin` to read from Supabase via server.
5. Smoke test locally and on Vercel Preview.
6. Remove Edge Config references after verification.

## Post-Migration Enhancements (Optional)

- Normalize `questions`/`answers` into separate tables for analytics.
- Add pagination and filters to `/admin` using SQL.
- Add RLS policies for limited client-side reads if required.
- Add indexes if querying on additional fields.

