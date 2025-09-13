import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';
import { updateEdgeConfig } from '@/lib/edge-config';

export async function POST(request: Request) {
  try {
    const { sessionId, answer } = await request.json();
    const sessionKey = `session_${sessionId}`;
    const session: any = await get(sessionKey);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    session.answers.push(answer);
    await updateEdgeConfig(sessionKey, session);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
  }
}
