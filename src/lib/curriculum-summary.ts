import { GoogleGenerativeAI } from '@google/generative-ai';
import { getQuestionById, type AnswerMap, type QuestionId } from './question-graph';

type ModuleId =
  | 'primers'
  | 'foundations'
  | 'environment'
  | 'ai_concepts'
  | 'agents'
  | 'future_work'
  | 'rapid_projects'
  | 'architecture'
  | 'databases'
  | 'capstone';

type Module = {
  id: ModuleId;
  label: string;
};

export type StarterProject = {
  title: string;
  description: string;
  whyItMatters: string;
};

export type CurriculumSummary = {
  levelEstimate: string;
  agentReadiness: string;
  moduleOrder: string[];
  focusTopics: string[];
  starterProjects: StarterProject[];
  nextSteps: string[];
  generationNotes?: {
    usedLLM: boolean;
    model?: string;
    rawOutput?: string;
  };
};

type SummaryInput = {
  name?: string | null;
  answers: AnswerMap;
};

const BASE_MODULES: Module[] = [
  { id: 'primers', label: 'Phase 0 · Primers & Baseline Interview' },
  { id: 'foundations', label: 'Phase 1 · Foundations – Build Confidence Fast' },
  { id: 'environment', label: 'Coding Environment Setup (VS Code + Git + Copilot)' },
  { id: 'ai_concepts', label: 'Phase 2 · AI Concepts in Action – Local LLMs' },
  { id: 'agents', label: 'Evolution of Agents & Multi-Agent Systems' },
  { id: 'future_work', label: 'Phase 3 · Connecting to the Real World' },
  { id: 'rapid_projects', label: 'Rapid Iteration Projects (2-hour build sprints)' },
  { id: 'architecture', label: 'Phase 4 · From Prototype to Architecture' },
  { id: 'databases', label: 'Databases & Advanced Infrastructure' },
  { id: 'capstone', label: 'Phase 5 · Capstone Project & Reflection' },
];

const INTEREST_PROJECTS: Record<string, StarterProject> = {
  games: {
    title: 'Game Strategy Scout',
    description: 'Build an agent that scrapes match data and surfaces tactics for a favorite game.',
    whyItMatters: 'Pairs data wrangling with prompting so Drew sees AI impact on a hobby immediately.',
  },
  music: {
    title: 'AI Remix Studio',
    description: 'Use a local model to suggest chord progressions and lyrics, then arrange in a DAW.',
    whyItMatters: 'Connects creative flow with model fine-tuning and eval loops.',
  },
  sports: {
    title: 'Performance Tracker Bot',
    description: 'Aggregate sports APIs and build a dashboard that surfaces training insights.',
    whyItMatters: 'Demonstrates end-to-end data pipelines plus UX polish.',
  },
  finance: {
    title: 'Budget Copilot',
    description: 'Ingest statements, categorize spend, and surface weekly coach-style summaries.',
    whyItMatters: 'Reinforces privacy-minded design and practical automation value.',
  },
  productivity: {
    title: 'Daily Standup Agent',
    description: 'Summarize notes across tools and draft a priorities brief every morning.',
    whyItMatters: 'Shows how AI can remove friction from routine planning.',
  },
  creativity: {
    title: 'Concept Sketch Partner',
    description: 'Combine image prompts with idea boards to iterate on designs rapidly.',
    whyItMatters: 'Links visual ideation with prompt engineering craft.',
  },
  social_impact: {
    title: 'Community Resource Concierge',
    description: 'Route community questions to the right city services with a retrieval-augmented bot.',
    whyItMatters: 'Highlights ethical deployment and inclusive design choices.',
  },
  other: {
    title: 'Personal Passion Project',
    description: 'Co-design a build that matches the topic you listed in the interview.',
    whyItMatters: 'Ensures the roadmap anchors on intrinsic motivation.',
  },
};

const FALLBACK_PROJECTS: StarterProject[] = [
  {
    title: 'Learning Log & Reflection App',
    description: 'Track daily lessons, questions, and AI experiments in one place.',
    whyItMatters: 'Builds the meta-learning muscle that Phase 1 emphasizes.',
  },
  {
    title: 'Agent-Powered Research Assistant',
    description: 'Use NotebookLM or a local model to summarize sources into an actionable brief.',
    whyItMatters: 'Connects Phase 2 concepts to real research workflows.',
  },
  {
    title: 'Automation Blueprint',
    description: 'Document a high-value task, then outline how an agent would complete it.',
    whyItMatters: 'Transforms the automation wish into a scoped build for later weeks.',
  },
];

const GEMINI_MODEL = process.env.GEMINI_SUMMARY_MODEL ?? 'gemini-1.5-pro';

export async function buildCurriculumSummary({ name, answers }: SummaryInput): Promise<CurriculumSummary> {
  const heuristics = buildHeuristicSummary({ name, answers });
  const llmEnhanced = await maybeEnhanceWithLLM({ name, answers }, heuristics);
  return llmEnhanced ?? heuristics;
}

type HeuristicParams = SummaryInput;

type HeuristicModule = Module & { priority: number };

function buildHeuristicSummary({ name, answers }: HeuristicParams): CurriculumSummary {
  const modules = computeModuleOrder(answers);
  const levelEstimate = describeLevel(answers);
  const agentReadiness = describeAgentReadiness(answers);
  const focusTopics = buildFocusTopics(answers);
  const starterProjects = pickStarterProjects(answers);
  const nextSteps = buildNextSteps({ answers, name });

  return {
    levelEstimate,
    agentReadiness,
    moduleOrder: modules.map((module) => module.label),
    focusTopics,
    starterProjects,
    nextSteps,
  };
}

function computeModuleOrder(answers: AnswerMap): Module[] {
  const modules: HeuristicModule[] = BASE_MODULES.map((module, index) => ({
    ...module,
    priority: index,
  }));

  const codingHistory = answers.coding_history as string | undefined;
  const learningStyles = ensureArray(answers.learning_style);
  const aiRole = answers.ai_role as string | undefined;
  const weeklyTime = answers.weekly_time as string | undefined;

  const moveToIndex = (id: ModuleId, index: number) => {
    const currentIndex = modules.findIndex((module) => module.id === id);
    if (currentIndex === -1) return;
    const [module] = modules.splice(currentIndex, 1);
    modules.splice(index, 0, module);
  };

  if (codingHistory === 'confident') {
    moveToIndex('ai_concepts', 2);
    moveToIndex('agents', 3);
    moveToIndex('rapid_projects', 4);
    moveToIndex('environment', 5);
  }

  if (codingHistory === 'dabbling') {
    moveToIndex('environment', 2);
    moveToIndex('ai_concepts', 3);
  }

  if (codingHistory === 'none') {
    moveToIndex('environment', 2);
    moveToIndex('ai_concepts', 5);
  }

  if (learningStyles.includes('hands_on')) {
    moveToIndex('rapid_projects', 3);
  }

  if (aiRole === 'replacement') {
    moveToIndex('future_work', 4);
  }

  if (weeklyTime === 'lt5') {
    moveToIndex('rapid_projects', modules.length - 3);
  }

  return modules.map((module, index) => ({ ...module, priority: index }));
}

function describeLevel(answers: AnswerMap): string {
  const history = answers.coding_history as string | undefined;
  const languages = ensureArray(answers.coding_languages);
  const languageLabels = languages
    .map((value) => getOptionLabel('coding_languages', value))
    .filter(Boolean)
    .join(', ');

  if (history === 'confident') {
    return languageLabels
      ? `Experienced coder with recent work in ${languageLabels}. Ready to move quickly into AI-first projects.`
      : 'Experienced coder. Ready to move quickly into AI-first projects.';
  }

  if (history === 'dabbling') {
    return 'Emerging coder – familiar with basics and ready for guided practice plus project reps.';
  }

  return 'New to coding – focus on foundational skills and confidence loops before heavy automation.';
}

function describeAgentReadiness(answers: AnswerMap): string {
  const role = answers.ai_role as string | undefined;
  const excitement = typeof answers.ai_excites === 'string' ? answers.ai_excites : '';

  if (role === 'coworker') {
    return 'Sees AI as a collaborative coworker. Great candidate for rapid delegation exercises and agent playbooks.';
  }

  if (role === 'replacement') {
    return 'Views AI as a potential replacement. Spend time on responsible rollout, change management, and future-of-work discussions.';
  }

  if (role === 'helper') {
    return 'Treats AI as a helper. Emphasize copilot techniques and fast idea-to-prototype loops.';
  }

  return excitement
    ? `Open to AI exploration. Anchor the plan on what excites them: ${truncate(excitement, 120)}.`
    : 'Still forming an AI mindset. Use early wins to build trust and curiosity.';
}

function buildFocusTopics(answers: AnswerMap): string[] {
  const topics = new Set<string>();
  const history = answers.coding_history as string | undefined;
  const excitement = typeof answers.ai_excites === 'string' ? answers.ai_excites : '';
  const automation = typeof answers.automation_target === 'string' ? answers.automation_target : '';
  const learning = ensureArray(answers.learning_style);
  const aiRole = answers.ai_role as string | undefined;
  const interests = ensureArray(answers.build_topics)
    .map((value) => getOptionLabel('build_topics', value))
    .filter(Boolean);

  if (history === 'none') {
    topics.add('Build fluency with core programming patterns and debugging rituals.');
  }

  if (history === 'dabbling') {
    topics.add('Reinforce fundamentals through coached mini-projects.');
  }

  if (learning.includes('hands_on')) {
    topics.add('Weekly hands-on sprints with a mentor for rapid feedback.');
  }

  if (aiRole === 'replacement') {
    topics.add('Responsibly evaluate automation impact and career positioning.');
  }

  if (automation) {
    topics.add(`Scope an automation prototype for "${truncate(automation, 80)}".`);
  }

  if (excitement) {
    topics.add(`Channel excitement around ${truncate(excitement, 80)} into the first project.`);
  }

  interests.forEach((interest) => topics.add(`Tailor starter builds around ${interest?.toLowerCase()}.`));

  if (topics.size === 0) {
    topics.add('Establish a shared language for AI capabilities and limits.');
  }

  return Array.from(topics);
}

function pickStarterProjects(answers: AnswerMap): StarterProject[] {
  const interests = ensureArray(answers.build_topics);
  const uniqueInterests = interests.length ? [...new Set(interests)] : [];

  const projects: StarterProject[] = [];
  uniqueInterests.forEach((interest) => {
    const project = INTEREST_PROJECTS[interest];
    if (project) {
      projects.push(project);
    }
  });

  if (projects.length === 0) {
    projects.push(...FALLBACK_PROJECTS);
  }

  while (projects.length < 3) {
    const fallback = FALLBACK_PROJECTS[projects.length % FALLBACK_PROJECTS.length];
    projects.push(fallback);
  }

  return projects.slice(0, 3);
}

type NextStepParams = {
  answers: AnswerMap;
  name?: string | null;
};

function buildNextSteps({ answers, name }: NextStepParams): string[] {
  const steps: string[] = [];
  const weeklyTime = answers.weekly_time as string | undefined;
  const timeLabel = weeklyTime ? getOptionLabel('weekly_time', weeklyTime) : null;
  const success = typeof answers.success_criteria === 'string' ? answers.success_criteria : '';
  const automation = typeof answers.automation_target === 'string' ? answers.automation_target : '';

  steps.push('Share these notes with the mentor team and schedule the kickoff debrief.');

  if (timeLabel) {
    steps.push(`Block recurring time (~${timeLabel.toLowerCase()}) on the calendar for build sessions.`);
  }

  if (automation) {
    steps.push(`Document the workflow you want to automate ("${truncate(automation, 60)}") for the Rapid Projects phase.`);
  }

  if (success) {
    steps.push(`Translate the success statement ("${truncate(success, 60)}") into a measurable milestone.`);
  }

  if (name) {
    steps.push(`Send ${name} the priming pack with 1-2 framing resources before Phase 1.`);
  }

  return Array.from(new Set(steps)).slice(0, 5);
}

async function maybeEnhanceWithLLM(
  input: SummaryInput,
  heuristics: CurriculumSummary,
): Promise<CurriculumSummary | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = buildSummaryPrompt(input, heuristics);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeParseSummaryJSON(text);
    if (!parsed) {
      return {
        ...heuristics,
        generationNotes: {
          usedLLM: true,
          model: GEMINI_MODEL,
          rawOutput: text,
        },
      };
    }

    const merged = mergeSummaries(heuristics, parsed);
    return {
      ...merged,
      generationNotes: {
        usedLLM: true,
        model: GEMINI_MODEL,
        rawOutput: text,
      },
    };
  } catch (error) {
    console.error('Failed to generate curriculum summary with Gemini:', error);
    return null;
  }
}

type LlmSummary = {
  level_estimate?: string;
  agent_readiness?: string;
  module_order?: string[];
  focus_topics?: string[];
  starter_projects?: { title: string; description: string; why_it_matters?: string }[];
  next_steps?: string[];
};

function mergeSummaries(base: CurriculumSummary, llm: LlmSummary): CurriculumSummary {
  const merged: CurriculumSummary = {
    ...base,
    levelEstimate: llm.level_estimate ?? base.levelEstimate,
    agentReadiness: llm.agent_readiness ?? base.agentReadiness,
    moduleOrder: validateStringArray(llm.module_order) ?? base.moduleOrder,
    focusTopics: validateStringArray(llm.focus_topics) ?? base.focusTopics,
    starterProjects: llm.starter_projects
      ? llm.starter_projects.map((project, index) => ({
          title: project.title ?? base.starterProjects[index]?.title ?? FALLBACK_PROJECTS[index]?.title ?? 'Project Idea',
          description:
            project.description ??
            base.starterProjects[index]?.description ??
            FALLBACK_PROJECTS[index % FALLBACK_PROJECTS.length].description,
          whyItMatters:
            project.why_it_matters ??
            base.starterProjects[index]?.whyItMatters ??
            FALLBACK_PROJECTS[index % FALLBACK_PROJECTS.length].whyItMatters,
        }))
      : base.starterProjects,
    nextSteps: validateStringArray(llm.next_steps) ?? base.nextSteps,
    generationNotes: base.generationNotes,
  };

  return merged;
}

function validateStringArray(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const filtered = input.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return filtered.length ? filtered : null;
}

function safeParseSummaryJSON(text: string): LlmSummary | null {
  const jsonMatch = text.match(/```json([\s\S]*?)```/);
  const jsonPayload = jsonMatch ? jsonMatch[1] : text;
  try {
    const parsed = JSON.parse(jsonPayload);
    return parsed as LlmSummary;
  } catch (error) {
    console.warn('Unable to parse Gemini summary JSON:', error);
    return null;
  }
}

function buildSummaryPrompt(input: SummaryInput, heuristics: CurriculumSummary): string {
  const { name, answers } = input;
  return `You are an AI mentor designing a personalized AI learning curriculum for a student.
Student name: ${name ?? 'Learner'}
Interview answers (raw JSON): ${JSON.stringify(answers, null, 2)}
Existing heuristic plan: ${JSON.stringify(heuristics, null, 2)}

Return a short JSON object that refines the heuristic plan.
Respond with:
{
  "level_estimate": string,
  "agent_readiness": string,
  "module_order": string[],
  "focus_topics": string[],
  "starter_projects": [
    { "title": string, "description": string, "why_it_matters": string }
  ],
  "next_steps": string[]
}
Keep module_order to 10 entries or fewer. Make the tone supportive and actionable. Do not add commentary outside JSON.`;
}

function ensureArray(value: AnswerValue | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

type AnswerValue = AnswerMap[keyof AnswerMap];

function getOptionLabel(questionId: QuestionId, value: string): string | null {
  try {
    const question = getQuestionById(questionId);
    const option = question.options?.find((item) => item.value === value);
    return option?.label ?? null;
  } catch (error) {
    console.error('Failed to resolve option label for question:', questionId, error);
    return null;
  }
}

function truncate(value: string, limit: number): string {
  if (value.length <= limit) return value.trim();
  return `${value.substring(0, limit - 1).trim()}...`;
}




