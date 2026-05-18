import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Template, Message } from '@/lib/types';

interface Props {
  template: Template;
  messages: Message[];
  onSend: (msg: string) => void;
  firstActionDone: boolean;
  sandboxCtaShown: boolean;
  rateError?: string;
}

function formatContent(content: string): React.ReactNode {
  // Check if it looks like JSON
  const trimmed = content.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const parsed = JSON.parse(trimmed);
      return (
        <pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-2 text-xs text-green-300">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      // Not valid JSON, render as text
    }
  }
  return content;
}

export default function ChatPanel({ template, messages, onSend, firstActionDone, sandboxCtaShown, rateError }: Props) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <span className="text-sm font-medium text-gray-900">Crow Agent</span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          Sandbox
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {typeof formatContent(msg.content) === 'string' ? msg.content : formatContent(msg.content)}
              {msg.action && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs opacity-70">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  {msg.action.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {firstActionDone && !rateError && !sandboxCtaShown && (
        <Link
          href="/contact"
          className="mx-4 mb-2 block rounded-md border border-green-200 bg-green-50 px-3 py-2 transition-colors hover:bg-green-100"
        >
          <p className="text-xs text-green-800">
            This is running on real Crow infrastructure. Add it to your product
            in under a week →
          </p>
        </Link>
      )}

      {sandboxCtaShown && !rateError && (
        <Link
          href="/contact"
          className="mx-4 mb-2 block rounded-md border border-blue-200 bg-blue-50 px-3 py-2 transition-colors hover:bg-blue-100"
        >
          <p className="text-xs text-blue-800">
            This is a sandbox — in a full Crow integration, this would execute against your real API. See how →
          </p>
        </Link>
      )}

      {rateError && (
        <div className="mx-4 mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-800">{rateError}</p>
        </div>
      )}

      <div className="px-4 pb-2">
        <div className="flex flex-wrap gap-2">
          {template.suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSend(prompt)}
              disabled={!!rateError}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900 disabled:opacity-40"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={rateError ? 'Limit reached' : 'Ask the agent...'}
            disabled={!!rateError}
            className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || !!rateError}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
