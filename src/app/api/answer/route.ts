import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { getSupabaseServer } from '@/lib/supabase-server';
import {
  computeInterviewPlan,
  getQuestionById,
  serializeAnswers,
  deserializeAnswers,
  type AnswerMap,
  type QuestionId,
  type QuestionNode,
} from '@/lib/question-graph';
import { buildCurriculumSummary } from '@/lib/curriculum-summary';

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
  result?: unknown;
};

type AnswerRequest = {
  sessionId?: string;
  questionId?: QuestionId;
  answer?: unknown;
};

type SessionSummaryState = {
  status: 'in_progress' | 'completed';
  currentQuestionId: QuestionId | null;
  result: unknown;
};

export async function POST(request: Request) {
  try {
    const { sessionId, questionId, answer }: AnswerRequest = await request.json();

    if (!sessionId || !questionId) {
      return NextResponse.json({ error: 'sessionId and questionId are required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Failed to load session data' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const question = getQuestionById(questionId);

    let validatedAnswer: string | string[];
    try {
      validatedAnswer = validateAnswer(question, answer);
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : 'Invalid answer';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (questionId === 'consent' && validatedAnswer !== 'yes') {
      return NextResponse.json(
        {
          status: 'consent_required',
          message: 'Consent is required to continue. Please select “I consent” to move forward.',
        },
        { status: 400 },
      );
    }

    const previousAnswers = normalizeAnswers(session.answers, session.questions);
    const mergedAnswers: AnswerMap = {
      ...previousAnswers,
      [questionId]: validatedAnswer,
    };

    const plan = computeInterviewPlan(mergedAnswers);

    if (!plan.completedQuestionIds.includes(questionId)) {
      console.warn('Question was not marked as completed after answer, ignoring update.', questionId);
      return NextResponse.json({ error: 'Failed to record answer' }, { status: 409 });
    }

    const isComplete = !plan.nextQuestionId;
    let summary: SessionSummaryState;

    if (isComplete) {
      const summaryResult = await buildCurriculumSummary({ name: session.name, answers: plan.answers });
      summary = {
        status: 'completed',
        currentQuestionId: null,
        result: summaryResult,
      };
    } else {
      summary = {
        status: 'in_progress',
        currentQuestionId: plan.nextQuestionId,
        result: session.summary?.result ?? null,
      };
    }

    await supabase
      .from('sessions')
      .update({
        questions: plan.completedQuestionIds,
        answers: serializeAnswers(plan.answers),
        summary,
      })
      .eq('id', sessionId);

    return NextResponse.json({
      status: summary.status,
      nextQuestionId: summary.currentQuestionId,
      summary: summary.result,
    });
  } catch (error) {
    console.error('Failed to record answer:', error);
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
  }
}

function validateAnswer(question: QuestionNode, raw: unknown): string | string[] {
  switch (question.type) {
    case 'single':
      if (typeof raw !== 'string' || raw.trim().length === 0) {
        throw new Error('Please select an option.');
      }
      if (question.options && !question.options.some((option) => option.value === raw)) {
        throw new Error('Selected option is not valid.');
      }
      return raw;
    case 'multi': {
      const values = Array.isArray(raw)
        ? (raw as unknown[]).map((item) => String(item))
        : typeof raw === 'string'
        ? [raw]
        : [];
      const unique = Array.from(new Set(values));
      const valid = question.options?.length
        ? unique.filter((item) => question.options?.some((option) => option.value === item))
        : unique;

      if (question.required && valid.length === 0) {
        throw new Error('Select at least one option.');
      }

      if (question.minSelections && valid.length < question.minSelections) {
        throw new Error(`Select at least ${question.minSelections} option(s).`);
      }

      if (question.maxSelections && valid.length > question.maxSelections) {
        return valid.slice(0, question.maxSelections);
      }

      return valid;
    }
    case 'text': {
      const value = typeof raw === 'string' ? raw.trim() : '';
      if (question.required && value.length === 0) {
        throw new Error('Please provide a short response.');
      }
      return value;
    }
    default:
      throw new Error(`Unsupported question type: ${question.type}`);
  }
}

function normalizeAnswers(raw: SessionRecord['answers'], order: SessionRecord['questions']): AnswerMap {
  const orderedIds = Array.isArray(order) ? (order as QuestionId[]) : [];
  return deserializeAnswers(raw, orderedIds);
}





