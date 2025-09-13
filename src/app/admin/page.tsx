import { getAll } from '@vercel/edge-config';

export default async function AdminPage() {
  const sessions = await getAll();

  // Filter for session data and convert to an array
  const sessionData = Object.entries(sessions)
    .filter(([key]) => key.startsWith('session_'))
    .map(([, value]) => value);

  return (
    <main className="flex min-h-screen flex-col p-12 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      <div className="space-y-6">
        {sessionData.map((session: any) => (
          <div key={session.id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-2">{session.name}</h2>
            <p className="text-sm text-gray-400">Session ID: {session.id}</p>
            <p className="text-sm text-gray-400">Start Time: {new Date(session.startTime).toLocaleString()}</p>
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
