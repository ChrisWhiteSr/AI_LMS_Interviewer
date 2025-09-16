import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { getSupabaseServer } from '@/lib/supabase-server';

import {
  computeInterviewPlan,
  getInitialQuestionId,
  getQuestionById,
  serializeAnswers,
  deserializeAnswers,
  type AnswerMap,
  type QuestionId,
  type QuestionNode,
} from '@/lib/question-graph';
import type { CurriculumSummary } from '@/lib/curriculum-summary';

type SessionRecord = {
  id: string;
  name?: string | null;
  questions: string[] | null;
  answers: Record<string, unknown> | unknown[] | null;
  summary: SessionSummaryPayload | null;
};

type SessionSummaryPayload = {
  status?: 'in_progress' | 'completed';
  currentQuestionId?: string | null;
  result?: CurriculumSummary | null;
};

type QuestionResponse = {
  status: 'in_progress' | 'completed';
  question?: QuestionNode & { id: QuestionId };
  previousAnswer?: unknown;
  progress: {
    step: number;
    total: number;
  };
  transcript: TranscriptEntry[];
  summary?: CurriculumSummary | null;
};

type TranscriptEntry = {
  id: QuestionId;
  title: string;
  prompt: string;
  answer: string;
};

type RequestPayload = {
  sessionId?: string;
  direction?: 'back';
};

type SessionState = {
  answers: AnswerMap;
  completedQuestionIds: QuestionId[];
  remainingQuestionIds: QuestionId[];
  nextQuestionId: QuestionId | null;
};

type SessionSummaryState = {
  status: 'in_progress' | 'completed';
  currentQuestionId: QuestionId | null;
  result: CurriculumSummary | null;
};

export async function POST(request: Request) {
  try {
    const { sessionId, direction }: RequestPayload = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single<SessionRecord>();

    if (error) {
      const code = (error as { code?: string }).code;
      if (code === 'PGRST116') {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      console.error('Supabase session fetch error:', error);
      return NextResponse.json({ error: 'Failed to load question' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const normalized = normalizeSessionState(session);

    if (direction === 'back') {
      return handleStepBack({ session, normalized, supabase });
    }

    if (normalized.summary.status === 'completed') {
      return NextResponse.json<QuestionResponse>({
        status: 'completed',
        progress: {
          step: normalized.plan.completedQuestionIds.length,
          total: normalized.plan.completedQuestionIds.length,
        },
        transcript: buildTranscript(normalized.plan.answers),
        summary: normalized.summary.result,
      });
    }

    const currentQuestionId =
      normalized.summary.currentQuestionId ?? normalized.plan.nextQuestionId ?? getInitialQuestionId();

    if (normalized.summary.currentQuestionId !== currentQuestionId) {
      await supabase
        .from('sessions')
        .update({
          summary: {
            ...normalized.summary,
            currentQuestionId,
          },
        })
        .eq('id', sessionId);
    }

    const questionNode = getQuestionById(currentQuestionId);

    return NextResponse.json<QuestionResponse>({
      status: 'in_progress',
      question: questionNode,
      previousAnswer: normalized.plan.answers[currentQuestionId],
      progress: buildProgress(normalized.plan),
      transcript: buildTranscript(normalized.plan.answers),
    });
  } catch (error) {
    console.error('Failed to resolve next question:', error);
    return NextResponse.json({ error: 'Failed to load question' }, { status: 500 });
  }
}

type NormalizedState = {
  plan: SessionState;
  summary: SessionSummaryState;
};

function normalizeSessionState(session: SessionRecord): NormalizedState {
  const questions = Array.isArray(session.questions) ? (session.questions as QuestionId[]) : [];
  const answers = normalizeAnswers(session.answers, questions);
  const plan = computeInterviewPlan(answers);
  const summary = normalizeSummary(session.summary, plan.nextQuestionId);

  return { plan, summary };
}

function normalizeAnswers(raw: SessionRecord['answers'], order?: QuestionId[] | null): AnswerMap {
  return deserializeAnswers(raw, order ?? []);
}

function normalizeSummary(summary: SessionRecord['summary'], fallback: QuestionId | null): SessionSummaryState {
  if (summary && typeof summary === 'object') {
    const status = summary.status === 'completed' ? 'completed' : 'in_progress';
    const currentQuestionId = (summary.currentQuestionId as QuestionId | null | undefined) ?? fallback ?? null;
    const result = (summary.result as CurriculumSummary | null | undefined) ?? null;

    if (!currentQuestionId && status === 'in_progress' && fallback) {
      return { status, currentQuestionId: fallback, result };
    }

    if (!currentQuestionId && status === 'completed') {
      return { status: 'completed', currentQuestionId: null, result };
    }

    return {
      status,
      currentQuestionId: currentQuestionId ?? null,
      result,
    };
  }

  return {
    status: 'in_progress',
    currentQuestionId: fallback ?? getInitialQuestionId(),
    result: null,
  };
}

async function handleStepBack({
  session,
  normalized,
  supabase,
}: {
  session: SessionRecord;
  normalized: NormalizedState;
  supabase: ReturnType<typeof getSupabaseServer>;
}) {
  const completed = normalized.plan.completedQuestionIds;
  if (!completed.length) {
    return NextResponse.json({ error: 'No previous question to revisit.' }, { status: 400 });
  }

  const targetQuestionId = completed[completed.length - 1];
  const existingAnswers = normalizeAnswers(session.answers, completed);
  const previousAnswer = existingAnswers[targetQuestionId];

  const trimmedAnswers: AnswerMap = { ...normalized.plan.answers };
  delete trimmedAnswers[targetQuestionId];
  const updatedPlan = computeInterviewPlan(trimmedAnswers);
  const updatedSummary: SessionSummaryState = {
    status: 'in_progress',
    currentQuestionId: targetQuestionId,
    result: session.summary?.result ?? null,
  };

  await supabase
    .from('sessions')
    .update({
      questions: updatedPlan.completedQuestionIds,
      answers: serializeAnswers(updatedPlan.answers),
      summary: updatedSummary,
    })
    .eq('id', session.id);

  const questionNode = getQuestionById(targetQuestionId);

  return NextResponse.json<QuestionResponse>({
    status: 'in_progress',
    question: questionNode,
    previousAnswer,
    progress: buildProgress(updatedPlan),
    transcript: buildTranscript(updatedPlan.answers),
  });
}

function buildProgress(plan: SessionState) {
  const completedCount = plan.completedQuestionIds.length;
  const totalCount = plan.completedQuestionIds.length + plan.remainingQuestionIds.length;
  const step = Math.min(completedCount + 1, totalCount || completedCount + 1);

  return {
    step,
    total: Math.max(totalCount, step),
  };
}

function buildTranscript(answers: AnswerMap): TranscriptEntry[] {
  return Object.entries(answers).map(([id, value]) => {
    const question = getQuestionById(id as QuestionId);
    return {
      id: question.id,
      title: question.title,
      prompt: question.prompt,
      answer: formatAnswer(question, value),
    };
  });
}

function formatAnswer(question: QuestionNode, value: unknown): string {
  if (question.type === 'multi') {
    const values = ensureArray(value);
    const labels = question.options?.length
      ? values
          .map((item) => question.options?.find((option) => option.value === item)?.label ?? item)
          .filter(Boolean)
      : values;
    return labels.join(', ');
  }

  if (typeof value === 'string') {
    return value;
  }

  return Array.isArray(value) ? value.join(', ') : '';
}

function ensureArray(value: unknown): string[] {
  if (!value) return [];
  return Array.isArray(value) ? (value as string[]) : [String(value)];
}










