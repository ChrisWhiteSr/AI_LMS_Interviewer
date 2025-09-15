import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { getSupabaseServer } from '@/lib/supabase-server';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const sessionId = nanoid();

    const supabase = getSupabaseServer();
    await supabase.from('sessions').insert({
      id: sessionId,
      name: name || 'Anonymous',
      // start_time uses default now()
      questions: [],
      answers: [],
      summary: null,
    });

    return NextResponse.json({ sessionId });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error('!!!!!!!!!!!!! DETAILED ERROR START !!!!!!!!!!!!!');
    console.error('Full Error Object:', err);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('!!!!!!!!!!!!!! DETAILED ERROR END !!!!!!!!!!!!!!');
    return NextResponse.json({ error: 'Failed to start session', details: error.message }, { status: 500 });
  }
}
