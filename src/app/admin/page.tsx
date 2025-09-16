export const dynamic = 'force-dynamic';


import { getSupabaseServer } from '@/lib/supabase-server';
import { getQuestionById, deserializeAnswers, type QuestionId } from '@/lib/question-graph';
import type { CurriculumSummary } from '@/lib/curriculum-summary';
type SessionSummaryPayload = {
  status?: 'in_progress' | 'completed';
  currentQuestionId?: string | null;
  result?: CurriculumSummary | null;
};

type SessionRecord = {
  id: string;
  name?: string | null;
  start_time?: string | null;
  questions: QuestionId[] | null;
  answers: Record<string, unknown> | unknown[] | null;
  summary: SessionSummaryPayload | null;
};

type TranscriptEntry = {
  id: QuestionId;
  title: string;
  prompt: string;
  answer: string;
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

  const sessions = (sessionData ?? []) as SessionRecord[];

  return (
    <main className="flex min-h-screen flex-col bg-gray-950 p-12 text-white">
      <h1 className="mb-8 text-4xl font-bold">Admin Dashboard</h1>
      <div className="space-y-6">
        {sessions.map((session) => {
          const transcript = buildTranscript(session);
          const summary = session.summary?.result ?? null;

          return (
            <div key={session.id} className="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
              <header className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-800 pb-4">
                <div>
                  <h2 className="text-2xl font-semibold">{session.name || 'Anonymous learner'}</h2>
                  <p className="text-xs uppercase tracking-wide text-blue-300">Session ID - {session.id}</p>
                </div>
                <div className="text-sm text-gray-400">
                  {session.start_time ? new Date(session.start_time).toLocaleString() : 'Pending start time'}
                </div>
              </header>

              <section className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-blue-200">Interview Transcript</h3>
                {transcript.length === 0 ? (
                  <p className="text-sm text-gray-500">No answers recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {transcript.map((entry) => (
                      <div key={entry.id} className="rounded border border-gray-800 bg-gray-950/40 p-4">
                        <p className="text-xs uppercase tracking-wide text-blue-300">{entry.title}</p>
                        <p className="mt-1 font-semibold text-white">{entry.prompt}</p>
                        <p className="mt-2 text-sm text-gray-300">{entry.answer || '--'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {summary && (
                <section className="mt-8 space-y-4">
                  <h3 className="text-lg font-semibold text-blue-200">Curriculum Summary</h3>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2 rounded border border-gray-800 bg-gray-950/40 p-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-300">Level Estimate</h4>
                      <p className="text-sm text-gray-200">{summary.levelEstimate}</p>
                    </div>
                    <div className="space-y-2 rounded border border-gray-800 bg-gray-950/40 p-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-300">Agent Readiness</h4>
                      <p className="text-sm text-gray-200">{summary.agentReadiness}</p>
                    </div>
                    <div className="rounded border border-gray-800 bg-gray-950/40 p-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-300">Module Order</h4>
                      <ol className="mt-2 space-y-1 text-sm text-gray-200">
                        {summary.moduleOrder.map((module) => (
                          <li key={module} className="flex gap-2">
                            <span className="text-blue-400">•</span>
                            <span>{module}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="rounded border border-gray-800 bg-gray-950/40 p-4">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-300">Focus Topics</h4>
                      <ul className="mt-2 space-y-1 text-sm text-gray-200">
                        {summary.focusTopics.map((topic) => (
                          <li key={topic} className="flex gap-2">
                            <span className="text-blue-400">•</span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="rounded border border-gray-800 bg-gray-950/40 p-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-300">Starter Projects</h4>
                    <div className="mt-3 space-y-3">
                      {summary.starterProjects.map((project) => (
                        <div key={project.title} className="rounded border border-gray-800 bg-gray-900 p-4">
                          <p className="text-base font-semibold text-white">{project.title}</p>
                          <p className="mt-1 text-sm text-gray-300">{project.description}</p>
                          <p className="mt-2 text-xs uppercase tracking-wide text-blue-300">Why it matters: {project.whyItMatters}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded border border-gray-800 bg-gray-950/40 p-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-300">Next Steps</h4>
                    <ul className="mt-2 space-y-1 text-sm text-gray-200">
                      {summary.nextSteps.map((step) => (
                        <li key={step} className="flex gap-2">
                          <span className="text-blue-400">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}

function buildTranscript(session: SessionRecord): TranscriptEntry[] {
  const answers = deserializeAnswers(session.answers, session.questions);
  const orderFromQuestions = Array.isArray(session.questions) ? session.questions : [];
  const orderFromAnswers = Object.keys(answers) as QuestionId[];
  const uniqueOrder = Array.from(new Set([...orderFromQuestions, ...orderFromAnswers]));
 
  return uniqueOrder
    .map((id) => {
      try {
        const value = answers[id];
        const question = getQuestionById(id);
        return {
          id: question.id,
          title: question.title,
          prompt: question.prompt,
          answer: formatAnswer(question, value),
        };
      } catch (error) {
        console.warn('Unknown question id in transcript:', id, error);
        return null;
      }
    })
    .filter((entry): entry is TranscriptEntry => Boolean(entry));
}

function formatAnswer(question: ReturnType<typeof getQuestionById>, rawValue: unknown): string {
  if (!rawValue) return '';

  if (question.type === 'multi') {
    const values = Array.isArray(rawValue) ? (rawValue as string[]) : [String(rawValue)];
    return values
      .map((value) => question.options?.find((option) => option.value === value)?.label ?? value)
      .join(', ');
  }

  if (typeof rawValue === 'string') {
    return rawValue;
  }

  return Array.isArray(rawValue) ? (rawValue as string[]).join(', ') : String(rawValue);
}


