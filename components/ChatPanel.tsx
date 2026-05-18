import { useState, useRef, useEffect } from 'react';
import { Template, Message } from '@/lib/types';

interface Props {
  template: Template;
  messages: Message[];
  onSend: (msg: string) => void;
  firstActionDone: boolean;
}

export default function ChatPanel({ template, messages, onSend, firstActionDone }: Props) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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
              {msg.content}
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

      {firstActionDone && (
        <div className="mx-4 mb-2 rounded-md border border-green-200 bg-green-50 px-3 py-2">
          <p className="text-xs text-green-800">
            This is running on real Crow infrastructure. Add it to your product
            in under a week →
          </p>
        </div>
      )}

      <div className="px-4 pb-2">
        <div className="flex flex-wrap gap-2">
          {template.suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSend(prompt)}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent..."
            className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
