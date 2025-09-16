"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [name, setName] = useState('');
  const router = useRouter();

  const startSession = async () => {
    try {
      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (data.sessionId) {
        localStorage.setItem('sessionId', data.sessionId);
        router.push('/interview');
      } else {
        console.error('Failed to start session', data);
        alert('Sorry, something went wrong. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to the Vibe Coding Interview</h1>
        <p className="text-lg mb-8">This interview is designed to capture your opinions on current topics - there are no right or wrong answers.</p>
        <div className="flex flex-col items-center">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name (optional)"
            className="p-2 rounded bg-gray-800 border border-gray-700 mb-4 w-80 text-center"
          />
          <button
            onClick={startSession}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-80"
          >
            {name ? `Start as ${name}` : 'Start Anonymously'}
          </button>
        </div>
      </div>
    </main>
  );
}
