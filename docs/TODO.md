# TODO – Supabase Migration Pause Checklist

- Supabase schema
  - Run `docs/supabase_schema.sql` in the Supabase SQL editor.
  - Confirm `public.sessions` exists and constraints are created.

- Environment variables
  - Verify `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`.
  - Add the same keys to Vercel Project Settings for Preview/Production later.

- Dev server
  - Restart `npm run dev` after any `.env.local` changes.

- Local smoke tests (PowerShell)
  - Start session: `$s = irm http://localhost:3000/api/session/start -Method POST -Body (@{name='Test'} | ConvertTo-Json) -ContentType 'application/json'`
  - Next question: `irm http://localhost:3000/api/question -Method POST -Body (@{sessionId=$s.sessionId} | ConvertTo-Json) -ContentType 'application/json'`
  - Submit answer: `irm http://localhost:3000/api/answer -Method POST -Body (@{sessionId=$s.sessionId; answer='Hello'} | ConvertTo-Json) -ContentType 'application/json'`
  - Watch the terminal running `npm run dev` for errors.

- If errors persist
  - Capture server log lines from `npm run dev` while reproducing.
  - If Gemini errors, temporarily skip the model call to isolate storage.

- After validation
  - Remove Edge Config code and dependency (`@vercel/edge-config`).
  - Add simple pagination to `/admin` (order by `start_time`, limit, offset).
  - Consider retries for Supabase writes and structured error responses.
