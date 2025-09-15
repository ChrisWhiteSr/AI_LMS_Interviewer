import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { getSupabaseServer } from '@/lib/supabase-server';

type Session = {
  id: string;
  name: string;
  start_time?: string;
  questions: string[];
  answers: string[];
  summary: unknown | null;
};

export async function POST(request: Request) {
  try {
    const { sessionId, answer } = await request.json();
    const supabase = getSupabaseServer();
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single<Session>();

    if (error) {
      console.error('Supabase select error:', error);
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const newAnswers = [...(session.answers || []), answer];
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ answers: newAnswers })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
  }
}
