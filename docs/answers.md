Got it—here are concise, build-ready answers you can hand to **Gemini** (the dev), aligned to the attached Vercel/Next.js + Vercel Postgres architecture.

---

## 1) Core Concept — What is “vibe coding”?

**Vibe coding** is an LLM-first, rapid-loop development style that prioritizes:

* **Visual/structural planning before code** (e.g., ASCII/diagram sketches of UI, data flows, states).
* **Tight prompt→scaffold→run→reflect cycles** where the LLM proposes small increments, you test immediately, and then you iterate.
* **Agent-assisted building** (linting, test scaffolds, small refactors) with the human acting as *product director*—maintaining taste, constraints, and scope.
* **Energy management & momentum**: short “wins” (deploys/demos) to keep motivation high, avoiding rabbit holes.
* **Source of truth**: a single living spec (README/spec.md) continuously updated by the loop (decisions, TODOs, open questions, next experiment).
* **Guardrails**: minimal but explicit—coding conventions, directory layout, checklist for PRs, and a 10–20 min “cut loss” rule if a path stalls.

**Typical loop:**

1. Sketch intent (ASCII wireframe / state diagram).
2. Ask LLM for minimal scaffold (component, route, single test).
3. Run locally, fix, and capture learnings in the spec.
4. Repeat in tiny steps; deploy early/often.

This course’s **adaptive interview** is an ideal target: short questions, immediate UI feedback, incremental persistence, then an LLM summary.

---

## 2) LLM Provider — Use Google Gemini (with a fallback)

**Primary:** **Gemini 2.5 Pro** for reasoning, summarization, and adaptive question generation.
**Fallback / cost-saver:** **Gemini 2.5 Flash** for fast/cheap steps (e.g., paraphrase, light scoring).

**Why:** Keeps the stack cohesive for a “Gemini-built” app; strong long-context and tool-use patterns for adaptive interviews.

look at .env for API Keys
```


## 3) Authentication Method — none - ask users their names, also allow anonymous mode



## 4) Database Setup — Supabase

We will use Supabase (Postgres) instead of Edge Config. Add to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."   # server-only
```

Create the table in Supabase:

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

The app uses server-side Supabase with the service role key for writes. See `docs/supabase_migration.md` for details.

### Extra notes

* **Disclaimer:** render on the very first step before collecting anything:
  “This interview is designed to capture your opinions on current topics—there are no right or wrong answers.”
