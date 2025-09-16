# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives in `src/app`, with route groups such as `admin`, `api`, and `interview`; keep new UI flows there and share utilities through `src/lib`. Assets stay in `public`, long-form references in `docs/`, and edge behavior sits in `middleware.js`. Build artifacts are emitted to `.next/`--never commit that directory.

## Build, Test, and Development Commands
Use `npm run dev` for the local development server at http://localhost:3000. Ship-ready bundles come from `npm run build`, and `npm run start` serves that build in production mode for smoke tests. Run `npm run lint` before every push; it executes the project-wide ESLint ruleset defined in `eslint.config.mjs`.

## Coding Style & Naming Conventions
Author components and server handlers in TypeScript with 2-space indentation and single quotes, mirroring `src/app/interview/page.tsx`. Name React components and data models in PascalCase, hooks and helpers in camelCase, and async Supabase utilities under `src/lib` with the suffix `-server`. Tailwind classes live inline; extract shared styles to `globals.css` only when necessary. Respect the path aliases and strict null checks configured in `tsconfig.json`.

## Testing Guidelines
An automated test runner is not yet wired up. Until one is introduced, document manual verification steps in your PR and include scripts or fixtures in `docs/` when they help exercise Supabase flows. If you add a testing toolchain, collocate specs beside the code they cover (for example `src/lib/question-graph.test.ts`) and register the command in `package.json` so teammates can run it consistently.

## Commit & Pull Request Guidelines
Recent commits are short free-form messages; move toward an imperative, type-prefixed style such as `feat: add interview summary exporter`. Each pull request should link to its tracking issue, list the key changes, call out environment or schema updates, and attach screenshots or terminal output for UI or API adjustments.

## Interview System Notes
- The question graph is defined in `src/lib/question-graph.ts`; update `docs/Question Graph.md` whenever you add or reorder nodes.
- Session summaries are generated in `src/lib/curriculum-summary.ts`. Keep heuristics deterministic and wrap optional Gemini calls so the flow works without an API key.
- Supabase rows store answers as a JSON map keyed by question id. When you change that shape, update the SQL snippet in `README.md` and any admin renderers.

## Security & Configuration Tips
Secrets live in `.env.local`; never check in Supabase service keys or Gemini API tokens. Follow `docs/Curriculum.md` and the README when updating database schemas, and coordinate environment changes with the admin route owners before deploying.


