export const QUESTION_ORDER = [
  'consent',
  'coding_history',
  'coding_languages',
  'research_tools',
  'ai_excites',
  'ai_role',
  'ai_role_reason',
  'build_topics',
  'automation_target',
  'learning_style',
  'lesson_structure',
  'weekly_time',
  'success_criteria',
] as const;

export type QuestionId = typeof QUESTION_ORDER[number];

export type QuestionType = 'single' | 'multi' | 'text';

export type QuestionOption = {
  value: string;
  label: string;
  description?: string;
};

export type QuestionNode = {
  id: QuestionId;
  title: string;
  prompt: string;
  type: QuestionType;
  helperText?: string;
  placeholder?: string;
  options?: QuestionOption[];
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
};

export type AnswerValue = string | string[];

export type AnswerMap = Partial<Record<QuestionId, AnswerValue>>;

export type StoredAnswerEntry = {
  id: QuestionId;
  value: AnswerValue;
};

const QUESTION_MAP: Record<QuestionId, QuestionNode> = {
  consent: {
    id: 'consent',
    title: 'Consent & Expectations',
    prompt: 'Before we start, do you consent to share these answers with the mentor team so we can personalize your curriculum?',
    type: 'single',
    required: true,
    helperText: 'We use these answers only to design your learning plan. You can pause or request deletion anytime by emailing support.',
    options: [
      { value: 'yes', label: 'I consent' },
      { value: 'no', label: 'I do not consent' },
    ],
  },
  coding_history: {
    id: 'coding_history',
    title: 'Coding Background',
    prompt: 'Have you written code before?',
    type: 'single',
    required: true,
    options: [
      { value: 'none', label: 'No - this is brand new for me' },
      { value: 'dabbling', label: 'A little - tutorials or small scripts' },
      { value: 'confident', label: 'Yes - coursework or shipped projects' },
    ],
  },
  coding_languages: {
    id: 'coding_languages',
    title: 'Languages & Tools',
    prompt: 'Which languages or tools have you used recently? Select all that apply.',
    type: 'multi',
    helperText: 'If you choose "Other", jot the tool in the notes field on the next screen.',
    minSelections: 1,
    options: [
      { value: 'python', label: 'Python' },
      { value: 'javascript', label: 'JavaScript / TypeScript' },
      { value: 'java', label: 'Java' },
      { value: 'csharp', label: 'C#' },
      { value: 'cpp', label: 'C / C++' },
      { value: 'sql', label: 'SQL' },
      { value: 'no_code', label: 'No-code tools (Zapier, Airtable, etc.)' },
      { value: 'other', label: 'Other' },
    ],
  },
  research_tools: {
    id: 'research_tools',
    title: 'Research Habits',
    prompt: 'Which tools do you use for research or learning right now?',
    type: 'multi',
    minSelections: 1,
    options: [
      { value: 'google', label: 'Search engines' },
      { value: 'youtube', label: 'YouTube' },
      { value: 'reddit', label: 'Reddit / community forums' },
      { value: 'twitter', label: 'Twitter / X' },
      { value: 'notebooklm', label: 'NotebookLM' },
      { value: 'podcasts', label: 'Podcasts' },
      { value: 'other', label: 'Other' },
    ],
  },
  ai_excites: {
    id: 'ai_excites',
    title: 'AI Excitement',
    prompt: 'What excites you most about AI right now?',
    type: 'text',
    placeholder: 'Tell us about a breakthrough, product, or workflow that caught your attention...',
    required: true,
  },
  ai_role: {
    id: 'ai_role',
    title: 'AI Mindset',
    prompt: 'Do you see AI more as a helper, coworker, or replacement?',
    type: 'single',
    required: true,
    options: [
      { value: 'helper', label: 'Helper - it boosts what I can do' },
      { value: 'coworker', label: 'Coworker - we build together' },
      { value: 'replacement', label: 'Replacement - it will automate most jobs' },
    ],
  },
  ai_role_reason: {
    id: 'ai_role_reason',
    title: 'Mindset Rationale',
    prompt: 'Why do you feel that way about AI\'s role?',
    type: 'text',
    placeholder: 'Give a quick story or example that shaped your view...',
    required: true,
  },
  build_topics: {
    id: 'build_topics',
    title: 'Build Interests',
    prompt: 'Pick 2-3 topics you would enjoy building around.',
    type: 'multi',
    minSelections: 1,
    options: [
      { value: 'games', label: 'Games' },
      { value: 'music', label: 'Music' },
      { value: 'sports', label: 'Sports' },
      { value: 'finance', label: 'Finance / investing' },
      { value: 'productivity', label: 'Productivity tools' },
      { value: 'creativity', label: 'Creativity & art' },
      { value: 'social_impact', label: 'Social impact / community' },
      { value: 'other', label: 'Other' },
    ],
  },
  automation_target: {
    id: 'automation_target',
    title: 'Automation Wish',
    prompt: 'If you could automate one part of your day, what would it be?',
    type: 'text',
    placeholder: 'Briefly describe the task you would hand off to an agent...',
    required: true,
  },
  learning_style: {
    id: 'learning_style',
    title: 'Learning Preferences',
    prompt: 'How do you prefer to learn?',
    type: 'multi',
    minSelections: 1,
    options: [
      { value: 'watch', label: 'Watch first, then try it' },
      { value: 'read', label: 'Read guides or docs' },
      { value: 'hands_on', label: 'Hands-on - jump into projects' },
      { value: 'pairing', label: 'Paired sessions with a coach' },
    ],
  },
  lesson_structure: {
    id: 'lesson_structure',
    title: 'Structure Fit',
    prompt: 'Do you want structured lessons or a tinker-first approach?',
    type: 'single',
    required: true,
    options: [
      { value: 'structured', label: 'Structured lessons with clear checkpoints' },
      { value: 'tinker_first', label: 'Tinker-first with light guardrails' },
      { value: 'hybrid', label: 'A mix of structured and exploratory' },
    ],
  },
  weekly_time: {
    id: 'weekly_time',
    title: 'Time Commitment',
    prompt: 'How many hours per week can you commit to this program?',
    type: 'single',
    required: true,
    options: [
      { value: 'lt5', label: 'Less than 5 hours' },
      { value: '5_7', label: '5-7 hours' },
      { value: '8_12', label: '8-12 hours' },
      { value: '13_plus', label: '13+ hours' },
    ],
  },
  success_criteria: {
    id: 'success_criteria',
    title: 'Definition of Success',
    prompt: 'What would make this course a win for you in four weeks?',
    type: 'text',
    placeholder: 'Complete the sentence: "Four weeks from now, I want to"',
    required: true,
  },
};

export function getQuestionById(id: QuestionId): QuestionNode {
  const question = QUESTION_MAP[id];
  if (!question) {
    throw new Error(`Unknown question id: ${id}`);
  }
  return question;
}

export function getInitialQuestionId(): QuestionId {
  return QUESTION_ORDER[0];
}

export function shouldAskQuestion(id: QuestionId, answers: AnswerMap): boolean {
  if (id !== 'consent' && answers.consent !== 'yes') {
    return false;
  }

  switch (id) {
    case 'consent':
      return true;
    case 'coding_languages': {
      const history = answers.coding_history;
      return history === 'dabbling' || history === 'confident';
    }
    case 'ai_role_reason':
      return typeof answers.ai_role === 'string' && answers.ai_role.length > 0;
    default:
      return true;
  }
}

export type InterviewPlan = {
  answers: AnswerMap;
  completedQuestionIds: QuestionId[];
  nextQuestionId: QuestionId | null;
  remainingQuestionIds: QuestionId[];
};

export function computeInterviewPlan(rawAnswers: AnswerMap): InterviewPlan {
  const normalizedAnswers: AnswerMap = {};
  const completed: QuestionId[] = [];
  const remaining: QuestionId[] = [];
  let next: QuestionId | null = null;

  for (const questionId of QUESTION_ORDER) {
    if (!shouldAskQuestion(questionId, { ...normalizedAnswers, ...rawAnswers })) {
      continue;
    }

    const value = rawAnswers[questionId];
    if (value !== undefined) {
      normalizedAnswers[questionId] = value;
      completed.push(questionId);
      continue;
    }

    if (!next) {
      next = questionId;
    }
    remaining.push(questionId);
  }

  return {
    answers: normalizedAnswers,
    completedQuestionIds: completed,
    nextQuestionId: next,
    remainingQuestionIds: remaining,
  };
}

export function isConsentGranted(answers: AnswerMap): boolean {
  return answers.consent === 'yes';
}

export function serializeAnswers(map: AnswerMap): StoredAnswerEntry[] {
  const entries: StoredAnswerEntry[] = [];
  const seen = new Set<QuestionId>();

  for (const questionId of QUESTION_ORDER) {
    const value = map[questionId];
    if (value !== undefined) {
      entries.push({
        id: questionId,
        value: Array.isArray(value) ? [...value] : value,
      });
      seen.add(questionId);
    }
  }

  for (const [id, value] of Object.entries(map)) {
    const questionId = id as QuestionId;
    if (seen.has(questionId) || value === undefined) {
      continue;
    }
    entries.push({
      id: questionId,
      value: Array.isArray(value) ? [...value] : value,
    });
  }

  return entries;
}

export function deserializeAnswers(raw: unknown, order?: QuestionId[] | null): AnswerMap {
  if (!raw) return {};

  if (Array.isArray(raw)) {
    const map: AnswerMap = {};
    let parsedEntryShape = false;

    for (const item of raw) {
      if (item && typeof item === 'object' && 'id' in (item as Record<string, unknown>)) {
        parsedEntryShape = true;
        const entry = item as { id?: unknown; value?: unknown };
        if (typeof entry.id === 'string') {
          const normalized = normalizeAnswerValue(entry.value);
          if (normalized !== undefined) {
            map[entry.id as QuestionId] = normalized;
          }
        }
      }
    }

    if (parsedEntryShape) {
      return map;
    }

    if (Array.isArray(order)) {
      raw.forEach((value, index) => {
        const questionId = order[index];
        if (!questionId) return;
        const normalized = normalizeAnswerValue(value);
        if (normalized !== undefined) {
          map[questionId] = normalized;
        }
      });
    }

    return map;
  }

  if (typeof raw === 'object') {
    return raw as AnswerMap;
  }

  return {};
}

function normalizeAnswerValue(value: unknown): AnswerValue | undefined {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  return String(value);
}




