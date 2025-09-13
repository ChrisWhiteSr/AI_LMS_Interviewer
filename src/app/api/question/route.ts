import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';
import { updateEdgeConfig } from '@/lib/edge-config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function getNewQuestion(history: { role: string, parts: { text: string }[] }[]) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 100,
    },
  });

  const msg = "Ask the next question about 'vibe coding'. Keep it concise and open-ended.";

  const result = await chat.sendMessage(msg);
  const response = await result.response;
  const text = response.text();
  return text;
}

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    const sessionKey = `session_${sessionId}`;
    const session: any = await get(sessionKey);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const history = session.questions.map((q: string, i: number) => ([
      { role: 'user', parts: [{ text: q }] },
      { role: 'model', parts: [{ text: session.answers[i] || '' }] },
    ])).flat();

    const newQuestion = await getNewQuestion(history);

    session.questions.push(newQuestion);
    await updateEdgeConfig(sessionKey, session);

    return NextResponse.json({ question: newQuestion });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get question' }, { status: 500 });
  }
}
