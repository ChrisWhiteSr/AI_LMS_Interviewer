# Personalized Curriculum Blueprint

This repository now generates a tailored learning plan after every interview session. The roadmap pulls directly from these phases; keep them current when the program evolves.

## Phase Overview
1. **Primers & Baseline (Phase 0)** - Send the interview recap plus 1-2 framing resources before the first meeting.
2. **Foundations (Phase 1)** - Build confidence fast with meta-learning habits and quick wins.
3. **Environment Setup** - Ship a Copilot-ready workspace (VS Code, GitHub, CLI hygiene).
4. **AI Concepts in Action (Phase 2)** - Run a local model, compare against API workflows, and practice prompt evals.
5. **Agents & Orchestration** - Explore LangGraph/CrewAI patterns via planner + executor lab.
6. **Future of Work (Phase 3)** - Discuss automation impact, change management, and career positioning.
7. **Rapid Iteration Projects** - Two-hour sprints with a mentor; publish demos fast.
8. **Architecture & Deployment (Phase 4)** - Cover full-stack lifecycle, Vercel deploys, custom domains.
9. **Databases & Infrastructure** - Supabase + persistence patterns; extend to Firebase/DO as needed.
10. **Capstone (Phase 5)** - Learner-driven build, launch, reflection, and presentation.

## How Answers Influence the Plan
- **Coding history & languages**: confident anchors the plan on AI concepts, agents, and rapid projects earlier; 
one keeps Foundations, Environment, and pacing at the top.
- **Learning style**: hands_on floats Rapid Iteration Projects toward the front; watch/read modes keep Foundations resources in focus.
- **AI mindset**: viewing AI as eplacement boosts Future of Work conversations; coworker promotes delegation drills.
- **Time available**: lt5 shifts projects later and recommends tighter mentor check-ins; higher availability keeps the default cadence.
- **Automation wish & excitement** feed focus topics and the first prototype brief.
- **Interests** map directly to the starter-project catalog in src/lib/curriculum-summary.ts.

## Maintaining the Mapping
Whenever you add a module or change the interview graph:
- Update the question definitions in src/lib/question-graph.ts and reflect new ids here.
- Extend the heuristics in src/lib/curriculum-summary.ts so signals adjust moduleOrder, focus topics, and next steps.
- Document any new branching logic in docs/Question Graph.md to keep future contributors aligned.


