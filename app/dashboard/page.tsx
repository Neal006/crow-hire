'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getRecentSessions,
  getStats,
  getCommonQueries,
  recordSignup,
  getSignupCount,
} from '@/lib/analytics';
import type { SessionMeta } from '@/lib/analytics';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [stats, setStats] = useState({ total: 0, avgMessages: 0, signups: 0, conversion: 0, byInput: {} as Record<string, number> });
  const [queries, setQueries] = useState<{ query: string; count: number }[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSessions(getRecentSessions());
    setStats(getStats());
    setQueries(getCommonQueries());
  }, []);

  const handleSimulateSignup = () => {
    recordSignup();
    setStats(getStats());
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Crow Sandbox Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Session analytics and conversion metrics
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400"
          >
            Back to site
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium uppercase text-gray-500">Total Sessions</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium uppercase text-gray-500">Avg Messages</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.avgMessages}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium uppercase text-gray-500">Signups</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.signups}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium uppercase text-gray-500">Conversion</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.conversion}%</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex gap-3">
            {Object.entries(stats.byInput).map(([type, count]) => (
              <div key={type} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 border border-gray-200">
                {type}: {count}
              </div>
            ))}
          </div>
          <button
            onClick={handleSimulateSignup}
            className="ml-auto rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Simulate signup
          </button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Recent Sessions
            </h2>
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-500">Session</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Input</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Product</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Messages</th>
                    <th className="px-4 py-3 font-medium text-gray-500">First Action</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        No sessions yet. Generate a demo to see data here.
                      </td>
                    </tr>
                  )}
                  {sessions.map((s) => (
                    <tr key={s.sessionId}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.sessionId}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {s.inputType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{s.templateName}</td>
                      <td className="px-4 py-3 text-gray-700">{s.messageCount}</td>
                      <td className="px-4 py-3">
                        {s.firstActionDone ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(s.lastActivity).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Common Queries
            </h2>
            <div className="mt-4 rounded-lg border border-gray-200 bg-white">
              {queries.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-gray-400">
                  No queries yet.
                </p>
              )}
              {queries.map((q) => (
                <div
                  key={q.query}
                  className="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0"
                >
                  <span className="truncate text-sm text-gray-700" title={q.query}>
                    {q.query}
                  </span>
                  <span className="ml-4 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {q.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
