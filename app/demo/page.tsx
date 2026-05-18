'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { getTemplate, createInitialState } from '@/lib/templates';
import { processMessage } from '@/lib/agent';
import { SessionState, Message } from '@/lib/types';
import MockProduct from '@/components/MockProduct';
import ChatPanel from '@/components/ChatPanel';

export default function DemoPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template') || 'crm';
  const urlSession = searchParams.get('session');
  const [sessionId, setSessionId] = useState(urlSession || `s-${Math.random().toString(36).slice(2, 9)}`);
  const [state, setState] = useState<SessionState | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    window.history.replaceState({}, '', url.toString());
  }, [sessionId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(`crow-session-${sessionId}`);
    if (saved) {
      try {
        setState(JSON.parse(saved));
        return;
      } catch {}
    }
    setState(createInitialState(templateId));
  }, [sessionId, templateId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !state) return;
    localStorage.setItem(`crow-session-${sessionId}`, JSON.stringify(state));
  }, [state, sessionId]);

  const handleSend = useCallback((content: string) => {
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setState((prev) => (prev ? { ...prev, messages: [...prev.messages, userMsg] } : prev));

    setTimeout(() => {
      setState((prev) => {
        if (!prev) return prev;
        const result = processMessage(content, prev);
        const agentMsg: Message = {
          id: `a-${Date.now()}`,
          role: 'agent',
          content: result.reply,
          timestamp: Date.now(),
          action: result.action,
        };
        return {
          ...result.newState,
          messages: [...result.newState.messages, agentMsg],
        };
      });
    }, 600);
  }, []);

  const handleNavChange = useCallback((id: string) => {
    setState((prev) => (prev ? { ...prev, activeNav: id } : prev));
  }, []);

  if (!state) return null;

  const template = getTemplate(state.templateId);
  if (!template)
    return (
      <div className="p-8 text-sm text-gray-500">Invalid demo</div>
    );

  return (
    <div className="flex h-screen w-full flex-col md:flex-row">
      <div className="order-2 h-1/2 w-full border-t border-gray-200 md:order-1 md:h-full md:w-1/2 md:border-t-0 md:border-r">
        <MockProduct
          template={template}
          activeNav={state.activeNav}
          entityData={state.entityData}
          onNavChange={handleNavChange}
        />
      </div>
      <div className="order-1 h-1/2 w-full md:order-2 md:h-full md:w-1/2">
        <ChatPanel
          template={template}
          messages={state.messages}
          onSend={handleSend}
          firstActionDone={state.firstActionDone}
        />
      </div>
    </div>
  );
}
