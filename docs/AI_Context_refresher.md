# AI Context Refresher

Status: Paused

We paused the migration after wiring the app to Supabase and adding the schema/docs. Local runs still show an Internal Server Error during API calls. Pending actions for next session:
- Confirm `public.sessions` table exists with constraints (run docs/supabase_schema.sql).
- Restart dev server to pick up `.env.local` changes.
- Reproduce via curl/PowerShell and capture server logs from `npm run dev`.
- If error is Gemini-related, temporarily stub question generation to isolate storage.

This document summarizes the current state of the "AI LMS Interviewer" project.

## Project Goal

The primary objective is to build a text-based AI learning module to assess a user's understanding of **"vibe coding."** The system will be AI-driven, generating questions, providing feedback, and creating a final summary for an administrator.

## Core Architectural Decisions

*   **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
*   **Deployment:** Vercel
*   **Database:** Supabase (Postgres)
*   **AI Provider:** Google Gemini (Pro for reasoning, Flash for simpler tasks)
*   **Authentication:** None. Users can enter a name or proceed anonymously. A session ID will track individual assessments.
*   **Administrator View:** A protected route (`/admin`) will serve as a dashboard for the administrator to review all user sessions, including the final AI-generated summary.

## Key Feature: Admin Summary

After a user completes a session, the AI will generate a summary for the administrator that includes:
1.  An inferred learning style preference for the user.
2.  A personalized, ordered 5-day course outline for teaching "vibe coding."

## Current Status & Blockers

The Next.js application has been scaffolded, and the basic UI for the interview and admin pages is in place. We will persist sessions in Supabase (Postgres) instead of Edge Config.

## Next Steps: Migrate to Supabase

We will migrate storage to Supabase (hosted Postgres with JS SDK) to gain robust SQL, better querying for the admin dashboard, and straightforward server-side writes.

1.  **Schema:** Create `public.sessions` with JSONB arrays for `questions` and `answers`, and a `summary` JSONB column.
2.  **Server-side access:** Use the Supabase service role key in API routes for inserts/updates/reads (bypasses RLS on the server). Keep the key server-only.
3.  **Routes mapping:**
    - `/api/session/start`: insert new session row.
    - `/api/question`: select by `id`, append to `questions`, update.
    - `/api/answer`: select by `id`, append to `answers`, update.
4.  **Admin:** Query sessions via server, enable pagination later.
