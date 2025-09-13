import { NextResponse } from 'next/server';
import { updateEdgeConfig } from '@/lib/edge-config';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const sessionId = nanoid();

    const session = {
      id: sessionId,
      name: name || 'Anonymous',
      startTime: new Date().toISOString(),
      questions: [],
      answers: [],
      summary: null,
    };

    await updateEdgeConfig(`session_${sessionId}`, session);

    return NextResponse.json({ sessionId });
  } catch (error: any) {
    console.error('!!!!!!!!!!!!! DETAILED ERROR START !!!!!!!!!!!!!');
    console.error('Full Error Object:', error);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('!!!!!!!!!!!!!! DETAILED ERROR END !!!!!!!!!!!!!!');
    return NextResponse.json({ error: 'Failed to start session', details: error.message }, { status: 500 });
  }
}
