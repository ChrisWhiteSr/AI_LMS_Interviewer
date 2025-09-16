# AI LMS Interviewer

This app runs a structured technical readiness interview, stores each session in Supabase, and generates a personalized learning plan aligned with the curriculum in docs/Curriculum.md.

## Getting Started
1. Install dependencies: 
pm install.
2. Copy .env.local.example (if present) or create .env.local with the variables below.
3. Run the dev server: 
pm run dev and open http://localhost:3000.

### Required Environment Variables
`
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
# Optional: override summary model
GEMINI_SUMMARY_MODEL=gemini-1.5-pro
`
Edge Config settings (EDGE_CONFIG_ID, VERCEL_API_TOKEN) are only needed if you keep the /welcome middleware route.

## Data Model
Create the sessions table shown below if it does not exist:
`
create table if not exists public.sessions (
  id text primary key,
  name text,
  start_time timestamptz not null default now(),
  questions text[] default '{}',
  answers jsonb default '{}'::jsonb,
  summary jsonb
);
`
The application stores answers keyed by the question ids defined in src/lib/question-graph.ts. When a session completes, the plan summary is persisted in summary.result.

## Interview Flow
- /api/session/start seeds a session and records the first question id.
- /api/question reads the deterministic graph, returns the next node, and streams a transcript for the UI side bar.
- /api/answer validates the payload, updates Supabase, and triggers the curriculum summary once all questions are answered.
- The finish state combines heuristic logic with optional Gemini refinement (see src/lib/curriculum-summary.ts).

## Admin Dashboard
Navigate to /admin to review session transcripts and summaries in chronological order. The dashboard calls Supabase directly on the server, so ensure the service role key is available at build time.

## Contributing
See AGENTS.md for repository conventions, coding style, and PR expectations. When you change the interview graph or curriculum mapping, update the docs under docs/ so the summary logic stays in sync.

