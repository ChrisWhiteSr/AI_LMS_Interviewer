# AI Context Refresher

This document summarizes the current state of the "AI LMS Interviewer" project.

## Project Goal

The primary objective is to build a text-based AI learning module to assess a user's understanding of **"vibe coding."** The system will be AI-driven, generating questions, providing feedback, and creating a final summary for an administrator.

## Core Architectural Decisions

*   **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
*   **Deployment:** Vercel
*   **Database:** Vercel Edge Config
*   **AI Provider:** Google Gemini (Pro for reasoning, Flash for simpler tasks)
*   **Authentication:** None. Users can enter a name or proceed anonymously. A session ID will track individual assessments.
*   **Administrator View:** A protected route (`/admin`) will serve as a dashboard for the administrator to review all user sessions, including the final AI-generated summary.

## Key Feature: Admin Summary

After a user completes a session, the AI will generate a summary for the administrator that includes:
1.  An inferred learning style preference for the user.
2.  A personalized, ordered 5-day course outline for teaching "vibe coding."

## Current Status & Blockers

The Next.js application has been scaffolded, and the basic UI for the interview and admin pages is in place. We have implemented the core logic for creating user sessions, generating questions with the Gemini API, and storing the results in Vercel Edge Config.

**Current Blocker: Unresolved Vercel Edge Config Write Failure**

The project is currently blocked by a persistent and difficult-to-diagnose error. While our standalone Node.js test script proved we can successfully write to the Vercel Edge Config using the Vercel API, the exact same logic fails when executed from within a Next.js serverless function. This points to a subtle, environment-specific issue that is preventing the application from creating new user sessions.

Despite extensive debugging, including detailed server-side logging, the root cause within the serverless environment remains elusive. The current architectural choice of using Edge Config as a primary database is proving to be fragile and is impeding progress.

## Recommended Next Steps: Pivot to Vercel Postgres

Continuing to debug the current issue is not a productive use of time. It is recommended to **pivot back to a more robust and standard database solution**.

1.  **Re-architect to Vercel Postgres:** I will revert the necessary code to use Vercel Postgres for data storage. This is a more conventional and reliable solution for this type of application data (structured session objects).
2.  **Update Data Logic:** I will replace the Edge Config API calls (`get`, `updateEdgeConfig`) with the Vercel Postgres SDK (`@vercel/postgres`) to handle creating, reading, and updating session data.
3.  **Test and Verify:** We will test the application again. This approach is much more likely to succeed without the environment-specific issues we are currently facing.
