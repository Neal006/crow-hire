'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { getTemplate, createInitialState } from '@/lib/templates';
import { processMessage } from '@/lib/agent';
import { SessionState, Message } from '@/lib/types';
import { trackSession } from '@/lib/analytics';
import { checkSessionExpired, getSessionState, setSessionState } from '@/lib/session';
import { checkMessageLimit } from '@/lib/validation';
import MockProduct from '@/components/MockProduct';
import ChatPanel from '@/components/ChatPanel';

function inferInputType(templateId: string): 'url' | 'spec' | 'template' {
  if (templateId.startsWith('url-')) return 'url';
  if (templateId.startsWith('spec-')) return 'spec';
  return 'template';
}

function DemoContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template') || 'crm';
  const urlSession = searchParams.get('session');
  const [sessionId] = useState(urlSession || `s-${Math.random().toString(36).slice(2, 9)}`);
  const [state, setState] = useState<SessionState | null>(null);
  const [expired, setExpired] = useState<{ reason: 'inactivity' | 'hard' } | null>(null);
  const [rateError, setRateError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionId);
    window.history.replaceState({}, '', url.toString());
  }, [sessionId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const expiredCheck = checkSessionExpired(sessionId);
    if (expiredCheck.expired) {
      setExpired({ reason: expiredCheck.reason! });
      return;
    }
    const saved = getSessionState(sessionId);
    if (saved) {
      setState(saved as SessionState);
      return;
    }
    setState(createInitialState(templateId));
  }, [sessionId, templateId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !state) return;
    setSessionState(sessionId, state);

    const template = getTemplate(state.templateId);
    const saved = localStorage.getItem(`crow-template-${state.templateId}`);
    let templateName = template?.productName || 'Unknown';
    if (!template && saved) {
      try {
        const t = JSON.parse(saved);
        templateName = t.productName || t.name || 'Custom';
      } catch {}
    }

    const userQueries = state.messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content);

    trackSession({
      sessionId,
      templateId: state.templateId,
      templateName,
      inputType: inferInputType(state.templateId),
      createdAt: state.messages[0]?.timestamp || Date.now(),
      lastActivity: Date.now(),
      messageCount: state.messages.length,
      firstActionDone: state.firstActionDone,
      userQueries,
    });
  }, [state, sessionId]);

  const handleSend = useCallback((content: string) => {
    setRateError('');
    const limit = checkMessageLimit(sessionId);
    if (!limit.allowed) {
      setRateError('Session message limit reached (50). Start a new demo to continue.');
      return;
    }

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
  }, [sessionId]);

  const handleNavChange = useCallback((id: string) => {
    setState((prev) => (prev ? { ...prev, activeNav: id } : prev));
  }, []);

  if (expired) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-white px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Session expired</h1>
          <p className="mt-2 text-sm text-gray-600">
            {expired.reason === 'inactivity'
              ? 'This session expired after 30 minutes of inactivity.'
              : 'This session link expired after 7 days.'}
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Start a new demo
          </a>
        </div>
      </div>
    );
  }

  if (!state) return null;

  let template = getTemplate(state.templateId);
  if (!template && typeof window !== 'undefined') {
    const saved = localStorage.getItem(`crow-template-${state.templateId}`);
    if (saved) {
      try {
        template = JSON.parse(saved);
      } catch {}
    }
  }
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
          rateError={rateError}
        />
      </div>
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-white" />}>
      <DemoContent />
    </Suspense>
  );
}
