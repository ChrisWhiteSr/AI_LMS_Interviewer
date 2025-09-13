import { NextResponse } from 'next/server';
import { updateEdgeConfig } from '@/lib/edge-config';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  console.log('Attempting to start a new session...');
  console.log('EDGE_CONFIG_ID:', process.env.EDGE_CONFIG_ID ? `...${process.env.EDGE_CONFIG_ID.slice(-4)}` : 'Not Set');
  console.log('VERCEL_API_TOKEN:', process.env.VERCEL_API_TOKEN ? `...${process.env.VERCEL_API_TOKEN.slice(-4)}` : 'Not Set');

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
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to start session' }, { status: 500 });
  }
}
