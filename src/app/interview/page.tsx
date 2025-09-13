"use client";

import { useState, useEffect } from 'react';

export default function Interview() {
  const [question, setQuestion] = useState('Loading...');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    const fetchQuestion = async () => {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        // Handle case where session ID is missing
        setQuestion('Error: No session ID found.');
        return;
      }
      
      const response = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await response.json();
      if (data.question) {
        setQuestion(data.question);
      } else {
        setQuestion('Failed to load question.');
      }
    };
    fetchQuestion();
  }, []);

  const submitAnswer = async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId || !answer) return;

    setQuestion('Loading...');

    // Save the answer
    await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, answer }),
    });

    setAnswer('');

    // Fetch the next question
    const response = await fetch('/api/question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    const data = await response.json();
    if (data.question) {
      setQuestion(data.question);
    } else {
      setQuestion('Thank you for your answers!');
      // Optionally, redirect or show a completion message
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="w-full max-w-2xl">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-4">
          <p className="text-lg">{question}</p>
        </div>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer..."
          className="w-full p-4 rounded bg-gray-800 border border-gray-700 mb-4 h-40"
        />
        <button
          onClick={submitAnswer}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
        >
          Submit Answer
        </button>
      </div>
    </main>
  );
}
