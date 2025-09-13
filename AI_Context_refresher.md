# AI Context Refresher

This document summarizes the current state of the "AI LMS Interviewer" project.

## Project Goal

The primary objective is to build a text-based AI learning module to assess a user's understanding of **"vibe coding."** The system will be AI-driven, generating questions, providing feedback, and creating a final summary for an administrator.

## Core Architectural Decisions

*   **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
*   **Deployment:** Vercel
*   **Database:** Vercel Postgres
*   **AI Provider:** Google Gemini (Pro for reasoning, Flash for simpler tasks)
*   **Authentication:** None. Users can enter a name or proceed anonymously. A session ID will track individual assessments.
*   **Administrator View:** A protected route (`/admin`) will serve as a dashboard for the administrator to review all user sessions, including the final AI-generated summary.

## Key Feature: Admin Summary

After a user completes a session, the AI will generate a summary for the administrator that includes:
1.  An inferred learning style preference for the user.
2.  A personalized, ordered 5-day course outline for teaching "vibe coding."

## Current Status

1.  **Planning Complete:** The architecture is fully defined in `docs/geminis_architecture.md`.
2.  **Project Scaffolding:** We attempted to run `npx create-next-app` but were blocked because the original repository name (`AI_LMS_Interviewer`) contained capital letters, which is incompatible with npm package naming conventions.
3.  **Resolution:** The user has just renamed the repository to a lowercase-compatible name.

## Next Immediate Step

The very next action is to successfully run the `npx create-next-app` command in the project's root directory to scaffold the Next.js application.
