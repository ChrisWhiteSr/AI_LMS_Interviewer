"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { QuestionNode } from '@/lib/question-graph';
import type { CurriculumSummary, StarterProject } from '@/lib/curriculum-summary';

type TranscriptEntry = {
  id: string;
  title: string;
  prompt: string;
  answer: string;
};

type QuestionResponse = {
  status: 'in_progress' | 'completed';
  question?: QuestionNode;
  previousAnswer?: string | string[];
  progress: {
    step: number;
    total: number;
  };
  transcript: TranscriptEntry[];
  summary?: CurriculumSummary | null;
};

type AnswerState = string | string[];

type FetchOptions = {
  direction?: 'back';
  showSpinner?: boolean;
};

function isQuestionResponse(value: unknown): value is QuestionResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.status === 'string' && typeof candidate.progress === 'object';
}

export default function Interview() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [questionState, setQuestionState] = useState<QuestionResponse | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<AnswerState>('');
  const [summary, setSummary] = useState<CurriculumSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('sessionId');
    setSessionId(stored);
    setSessionChecked(true);
  }, []);

  const initializeAnswer = useCallback((question: QuestionNode, value: unknown): AnswerState => {
    if (!value) {
      return question.type === 'multi' ? [] : '';
    }

    if (question.type === 'multi') {
      if (Array.isArray(value)) {
        return value.map((item) => String(item));
      }
      return [String(value)];
    }

    return typeof value === 'string' ? value : String(value);
  }, []);

  const loadQuestion = useCallback(
    async ({ direction, showSpinner = true }: FetchOptions = {}) => {
      if (!sessionId) return;
      if (showSpinner) setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, ...(direction ? { direction } : {}) }),
        });

        const payload = await response.json();

        if (!response.ok) {
          const message = payload && typeof payload === 'object' && 'error' in payload ? payload.error : null;
          setError(typeof message === 'string' && message.length ? message : 'Failed to load interview question.');
          console.error('Question fetch error:', payload);
          return;
        }

        if (!isQuestionResponse(payload)) {
          setError('Interview response was not recognized.');
          console.error('Question fetch payload mismatch:', payload);
          return;
        }

        const data = payload;

        if (data.status === 'completed') {
          setQuestionState(data);
          setSummary(data.summary ?? null);
          setCurrentAnswer('');
          return;
        }

        if (!data.question) {
          setError('Interview is waiting for the next question.');
          return;
        }

        setQuestionState(data);
        setSummary(null);
        setCurrentAnswer(initializeAnswer(data.question, data.previousAnswer));
      } catch (requestError) {
        console.error('Unexpected error while loading question:', requestError);
        setError('Unexpected error while loading question.');
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    },
    [initializeAnswer, sessionId],
  );

  useEffect(() => {
    if (sessionId) {
      loadQuestion();
    }
  }, [sessionId, loadQuestion]);

  const handleBack = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    await loadQuestion({ direction: 'back', showSpinner: false });
    setLoading(false);
  }, [loadQuestion, sessionId]);

  const prepareAnswerPayload = useCallback(
    (question: QuestionNode, answer: AnswerState): { valid: boolean; payload: string | string[] | null; message?: string } => {
      if (question.type === 'multi') {
        const values = Array.isArray(answer) ? answer : ([answer].filter(Boolean) as string[]);
        if (question.required && values.length === 0) {
          return { valid: false, payload: null, message: 'Please select at least one option.' };
        }
        if (question.minSelections && values.length < question.minSelections) {
          return { valid: false, payload: null, message: `Select at least ${question.minSelections} option(s).` };
        }
        return { valid: true, payload: values };
      }

      const value = Array.isArray(answer) ? answer[0] ?? '' : answer;
      if (question.type === 'text') {
        if (question.required && value.trim().length === 0) {
          return { valid: false, payload: null, message: 'Please share a short response.' };
        }
        return { valid: true, payload: value.trim() };
      }

      if (question.required && (!value || value.toString().trim().length === 0)) {
        return { valid: false, payload: null, message: 'Please select an option.' };
      }

      return { valid: true, payload: value };
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!sessionId || !questionState?.question) return;

    const { valid, payload, message } = prepareAnswerPayload(questionState.question, currentAnswer);
    if (!valid || payload === null) {
      setError(message ?? 'Please provide an answer before continuing.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId: questionState.question.id, answer: payload }),
      });

      const data = await response.json();

      if (!response.ok) {
        const messageText = data?.error ?? 'Failed to record answer.';
        setError(messageText);
        return;
      }

      await loadQuestion({ showSpinner: false });
    } catch (requestError) {
      console.error('Failed to submit answer:', requestError);
      setError('Failed to submit answer.');
    } finally {
      setLoading(false);
    }
  }, [currentAnswer, loadQuestion, prepareAnswerPayload, questionState, sessionId]);

  const isCompleted = questionState?.status === 'completed';
  const progress = questionState?.progress ?? { step: 0, total: 0 };
  const question = questionState?.question;
  const transcript = questionState?.transcript ?? [];

  const isBackEnabled = !isCompleted && transcript.length > 0;

  const isAnswerValid = useMemo(() => {
    if (!question) return false;
    if (question.type === 'multi') {
      const values = Array.isArray(currentAnswer) ? currentAnswer : ([currentAnswer].filter(Boolean) as string[]);
      if (question.required && values.length === 0) return false;
      if (question.minSelections && values.length < question.minSelections) return false;
      return true;
    }
    const value = Array.isArray(currentAnswer) ? currentAnswer[0] ?? '' : currentAnswer;
    if (question.required) {
      return value.trim().length > 0;
    }
    return value !== undefined;
  }, [currentAnswer, question]);

  const progressPercent = useMemo(() => {
    if (!progress.total) return 0;
    return Math.min(100, Math.round((progress.step / progress.total) * 100));
  }, [progress.step, progress.total]);

  const handleOptionSelect = useCallback(
    (value: string) => {
      if (!question) return;
      if (question.type === 'multi') {
        setCurrentAnswer((prev) => {
          const existing = Array.isArray(prev) ? prev : ([prev].filter(Boolean) as string[]);
          return existing.includes(value)
            ? existing.filter((item) => item !== value)
            : [...existing, value];
        });
      } else {
        setCurrentAnswer(value);
      }
    },
    [question],
  );

  const renderQuestionBody = () => {
    if (!question) {
      return <p className="text-gray-300">Loading interview...</p>;
    }

    if (question.type === 'text') {
      const value = Array.isArray(currentAnswer) ? currentAnswer.join(' ') : currentAnswer;
      return (
        <textarea
          value={value}
          onChange={(event) => setCurrentAnswer(event.target.value)}
          placeholder={question.placeholder ?? 'Type your response here...'}
          className="w-full rounded border border-gray-700 bg-gray-800 p-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={6}
          disabled={loading}
        />
      );
    }

    if (question.type === 'multi') {
      const selectedValues = new Set(Array.isArray(currentAnswer) ? currentAnswer : []);
      return (
        <div className="flex flex-wrap gap-3">
          {question.options?.map((option) => {
            const isActive = selectedValues.has(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionSelect(option.value)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}
                disabled={loading}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      );
    }

    const value = Array.isArray(currentAnswer) ? currentAnswer[0] ?? '' : currentAnswer;
    return (
      <div className="flex flex-col gap-3">
        {question.options?.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionSelect(option.value)}
              className={`w-full rounded border px-4 py-3 text-left transition-colors ${
                isActive
                  ? 'border-blue-500 bg-blue-600/20 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-blue-500 hover:text-white'
              }`}
              disabled={loading}
            >
              <span className="block font-medium">{option.label}</span>
              {option.description && <span className="mt-1 block text-xs text-gray-400">{option.description}</span>}
            </button>
          );
        })}
      </div>
    );
  };

  const renderSummary = (summaryData: CurriculumSummary) => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Level Estimate</h2>
          <p className="mt-2 text-gray-300">{summaryData.levelEstimate}</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Agent Readiness</h2>
          <p className="mt-2 text-gray-300">{summaryData.agentReadiness}</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Module Order</h2>
          <ol className="mt-3 space-y-2 text-gray-300">
            {summaryData.moduleOrder.map((module) => (
              <li key={module} className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>{module}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Focus Topics</h2>
          <ul className="mt-3 space-y-2 text-gray-300">
            {summaryData.focusTopics.map((topic) => (
              <li key={topic} className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>{topic}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Starter Projects</h2>
          <div className="mt-3 space-y-3 text-gray-200">
            {summaryData.starterProjects.map((project: StarterProject) => (
              <div key={project.title} className="rounded border border-gray-700 bg-gray-800 p-4">
                <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                <p className="mt-2 text-sm text-gray-300">{project.description}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-blue-300">Why it matters: {project.whyItMatters}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Next Steps</h2>
          <ul className="mt-3 space-y-2 text-gray-300">
            {summaryData.nextSteps.map((step) => (
              <li key={step} className="flex gap-2">
                <span className="text-blue-400">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  if (sessionChecked && !sessionId) {
    return (
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-3xl font-bold">Session not found</h1>
          <p className="mt-4 text-sm text-gray-400">Start a new interview from the home page.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Technical Readiness Interview</h1>
            <p className="mt-2 text-sm text-gray-400">We use your answers to craft a personalized curriculum.</p>
          </div>
          <div className="text-sm text-gray-400">
            {progress.total > 0 && !isCompleted ? (
              <span>
                Step {progress.step} of {progress.total} ({progressPercent}% complete)
              </span>
            ) : (
              <span>{isCompleted ? 'Interview complete' : 'Preparing interview...'}</span>
            )}
          </div>
        </div>

        {!isCompleted && progress.total > 0 && (
          <div className="mb-8 h-2 w-full rounded-full bg-gray-800">
            <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        )}

        {error && (
          <div className="mb-6 rounded border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section className="rounded-lg border border-gray-800 bg-gray-900 p-8 shadow-xl">
            {isCompleted && summary ? (
              renderSummary(summary)
            ) : question ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-wide text-blue-300">{question.title}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{question.prompt}</h2>
                  {question.helperText && <p className="mt-2 text-sm text-gray-400">{question.helperText}</p>}
                </div>
                {renderQuestionBody()}
                <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={!isBackEnabled || loading}
                    className="w-full rounded border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !isAnswerValid}
                    className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-900/40 sm:w-auto"
                  >
                    {loading ? 'Saving...' : 'Save & Continue'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-300">Initializing interview...</p>
            )}
          </section>

          <aside className="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Interview Notes</h2>
            <p className="mt-1 text-xs text-gray-400">Snapshot of answers captured so far.</p>
            <div className="mt-4 space-y-4 text-sm text-gray-200">
              {transcript.length === 0 ? (
                <p className="text-gray-500">Your responses will appear here after each step.</p>
              ) : (
                transcript.map((entry) => (
                  <div key={entry.id} className="rounded border border-gray-800 bg-gray-950/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-blue-300">{entry.title}</p>
                    <p className="mt-1 font-semibold text-white">{entry.prompt}</p>
                    <p className="mt-2 text-sm text-gray-300">{entry.answer || '--'}</p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

