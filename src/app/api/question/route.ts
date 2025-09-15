import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { getSupabaseServer } from '@/lib/supabase-server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function getNewQuestion(history: { role: string, parts: { text: string }[] }[]) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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
    const { sessionId } = await request.json();
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

    const history = session.questions.map((q: string, i: number) => ([
      { role: 'user', parts: [{ text: q }] },
      { role: 'model', parts: [{ text: session.answers[i] || '' }] },
    ])).flat();

    const newQuestion = await getNewQuestion(history);

    const newQuestions = [...(session.questions || []), newQuestion];
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ questions: newQuestions })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({ question: newQuestion });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get question' }, { status: 500 });
  }
}
