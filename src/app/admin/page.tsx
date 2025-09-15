export const dynamic = 'force-dynamic';
import { getSupabaseServer } from '@/lib/supabase-server';

type Session = {
  id: string;
  name: string;
  start_time?: string;
  questions: string[];
  answers: string[];
  summary: unknown | null;
};

export default async function AdminPage() {
  const supabase = getSupabaseServer();
  const { data: sessionData, error } = await supabase
    .from('sessions')
    .select('*')
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Supabase admin fetch error:', error);
  }

  return (
    <main className="flex min-h-screen flex-col p-12 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      <div className="space-y-6">
        {(sessionData || []).map((session: Session) => (
          <div key={session.id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-2">{session.name}</h2>
            <p className="text-sm text-gray-400">Session ID: {session.id}</p>
            <p className="text-sm text-gray-400">Start Time: {session.start_time ? new Date(session.start_time).toLocaleString() : ''}</p>
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-2">Interview</h3>
              {session.questions.map((q: string, i: number) => (
                <div key={i} className="mb-4">
                  <p className="font-medium text-gray-300">Q: {q}</p>
                  <p className="text-gray-400">A: {session.answers[i] || 'No answer'}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
