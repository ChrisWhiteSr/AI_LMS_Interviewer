import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { getSupabaseServer } from '@/lib/supabase-server';
import { nanoid } from 'nanoid';
import { getInitialQuestionId, serializeAnswers } from '@/lib/question-graph';

type SessionSummaryState = {
  status: 'in_progress' | 'completed';
  currentQuestionId: string | null;
  result: unknown;
};

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const sessionId = nanoid();
    const firstQuestionId = getInitialQuestionId();

    const supabase = getSupabaseServer();
    const summary: SessionSummaryState = {
      status: 'in_progress',
      currentQuestionId: firstQuestionId,
      result: null,
    };

    const { error: insertError } = await supabase.from('sessions').insert({
      id: sessionId,
      name: name || 'Anonymous',
      questions: [],
      answers: serializeAnswers({}),
      summary,
    });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json({ error: 'Failed to start session', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ sessionId, nextQuestionId: firstQuestionId });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('Failed to start session:', error);
    return NextResponse.json({ error: 'Failed to start session', details: error.message }, { status: 500 });
  }
}



