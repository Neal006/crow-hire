'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { templates } from '@/lib/templates';

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!trimmed.includes('.')) {
      setError('Please enter a valid URL');
      return;
    }
    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    router.push(`/processing?url=${encodeURIComponent(normalized)}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          See Crow running on your product.
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          No code, no signup. Try a pre-built demo in 60 seconds.
        </p>
      </div>

      <div className="mt-10 w-full max-w-xl">
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste your product URL..."
            className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-400"
          />
          <button
            type="submit"
            disabled={!url.trim()}
            className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
          >
            Demo
          </button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        <p className="mt-2 text-xs text-gray-400">
          We crawl public pages only. No login required.
        </p>
      </div>

      <div className="mt-12 grid w-full max-w-4xl gap-4 sm:grid-cols-2">
        {templates.map((t) => (
          <Link
            key={t.id}
            href={`/processing?template=${t.id}`}
            className="group flex flex-col rounded-lg border border-gray-200 p-6 transition-colors hover:border-gray-900 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              <h2 className="text-lg font-medium text-gray-900">{t.name}</h2>
            </div>
            <p className="mt-2 text-sm text-gray-500">{t.productName}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
