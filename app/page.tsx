'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { templates } from '@/lib/templates';
import {
  isValidUrl,
  isPrivateIp,
  normalizeUrl,
  checkRateLimit,
  recordSessionStart,
} from '@/lib/validation';

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<'url' | 'spec' | 'templates'>('url');
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [spec, setSpec] = useState('');
  const [specError, setSpecError] = useState('');

  const rate = checkRateLimit();

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');
    if (!rate.allowed) {
      const mins = Math.ceil((rate.resetAt - Date.now()) / 60000);
      setUrlError(`Rate limit reached. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`);
      return;
    }
    const trimmed = url.trim();
    if (!isValidUrl(trimmed)) {
      setUrlError('Please enter a valid URL like example.com or https://example.com');
      return;
    }
    const normalized = normalizeUrl(trimmed);
    if (isPrivateIp(normalized)) {
      setUrlError('Private and internal URLs are not allowed.');
      return;
    }
    recordSessionStart();
    router.push(`/processing?url=${encodeURIComponent(normalized)}`);
  };

  const handleSpecSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSpecError('');
    if (!rate.allowed) {
      const mins = Math.ceil((rate.resetAt - Date.now()) / 60000);
      setSpecError(`Rate limit reached. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`);
      return;
    }
    const trimmed = spec.trim();
    if (!trimmed) return;
    if (trimmed.length > 1000000) {
      setSpecError('Spec too large (max 1MB). Please upload a smaller spec or use a template.');
      return;
    }
    try {
      JSON.parse(trimmed);
    } catch {
      setSpecError('Invalid JSON. Please paste a valid OpenAPI spec.');
      return;
    }
    const encoded = encodeURIComponent(trimmed);
    if (encoded.length > 50000) {
      setSpecError('Spec too large for URL. Please upload a smaller spec or use a template.');
      return;
    }
    recordSessionStart();
    router.push(`/processing?spec=${encoded}`);
  };

  const tabs = [
    { id: 'url' as const, label: 'URL' },
    { id: 'spec' as const, label: 'OpenAPI Spec' },
    { id: 'templates' as const, label: 'Templates' },
  ];

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
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'url' && (
          <div className="mt-4">
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
                disabled={!url.trim() || !rate.allowed}
                className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
              >
                Demo
              </button>
            </form>
            {urlError && <p className="mt-2 text-sm text-red-600">{urlError}</p>}
            <p className="mt-2 text-xs text-gray-400">
              We crawl public pages only. No login required.
            </p>
          </div>
        )}

        {tab === 'spec' && (
          <div className="mt-4">
            <form onSubmit={handleSpecSubmit}>
              <textarea
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                placeholder="Paste your OpenAPI JSON here..."
                rows={6}
                className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-400"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Paste the raw JSON. We parse endpoints and generate tools automatically.
                </p>
                <button
                  type="submit"
                  disabled={!spec.trim() || !rate.allowed}
                  className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
                >
                  Demo
                </button>
              </div>
            </form>
            {specError && <p className="mt-2 text-sm text-red-600">{specError}</p>}
          </div>
        )}

        {tab === 'templates' && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/processing?template=${t.id}`}
                className="group flex flex-col rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-900 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  <h2 className="text-sm font-medium text-gray-900">{t.name}</h2>
                </div>
                <p className="mt-1 text-xs text-gray-500">{t.productName}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
