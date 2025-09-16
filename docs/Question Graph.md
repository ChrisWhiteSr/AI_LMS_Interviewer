# Question Graph

The interview now uses a deterministic graph so we can steer every learner through the baseline signals outlined in the curriculum. Each node below maps 1:1 to the constants in src/lib/question-graph.ts.

## Node Index
| ID | Title | Type | Notes |
| --- | --- | --- | --- |
| consent | Consent & Expectations | single | Must be yes or the interview stops. |
| coding_history | Coding Background | single | Gauges overall fluency: 
one, dabbling, confident. |
| coding_languages | Languages & Tools | multi | Only asked when history is dabbling or confident. |
| research_tools | Research Habits | multi | Captures discovery channels we can lean on later. |
| ai_excites | AI Excitement | text | Seed for motivation hooks in the roadmap. |
| ai_role | AI Mindset | single | Helper vs coworker vs replacement framing. |
| ai_role_reason | Mindset Rationale | text | Always follows i_role and gives coaching context. |
| build_topics | Build Interests | multi | Used to select starter projects. |
| automation_target | Automation Wish | text | Informs the first rapid prototype. |
| learning_style | Learning Preferences | multi | Flags hands-on vs watch/read styles. |
| lesson_structure | Structure Fit | single | Aligns expectations on pacing and guidance. |
| weekly_time | Time Commitment | single | Establishes cadence and mentor bandwidth. |
| success_criteria | Definition of Success | text | Sets the four-week win condition. |

## Branching Rules
- consent must equal yes to unlock the rest of the flow.
- Skip coding_languages when coding_history equals 
one.
- i_role_reason only appears after a valid i_role selection.
- Back navigation trims the stored answer and recomputes the plan so dependent questions refresh accordingly.

## Transcript & Summary
Each recorded answer is stored against its node id. The admin dashboard replays these entries, and the summary generator consumes the normalized JSON to produce:
- levelEstimate
- gentReadiness
- moduleOrder
- ocusTopics
- starterProjects
- 
extSteps

The summary uses heuristics first and optionally enhances them with Gemini (GEMINI_SUMMARY_MODEL).

