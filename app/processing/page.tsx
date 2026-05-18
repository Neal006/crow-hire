'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getTemplate } from '@/lib/templates';

const steps = [
  { label: 'Crawling your product...', duration: 3000 },
  { label: 'Understanding your features...', duration: 2000 },
  { label: 'Generating agent tools...', duration: 2000 },
  { label: 'Spinning up sandbox...', duration: 1500 },
  { label: 'Your agent is ready', duration: 500 },
];

export default function ProcessingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template') || 'crm';
  const [stepIndex, setStepIndex] = useState(0);
  const template = getTemplate(templateId);

  useEffect(() => {
    if (stepIndex >= steps.length - 1) {
      const timer = setTimeout(() => {
        router.push(`/demo?template=${templateId}`);
      }, steps[steps.length - 1].duration);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setStepIndex((i) => i + 1);
    }, steps[stepIndex].duration);
    return () => clearTimeout(timer);
  }, [stepIndex, templateId, router]);

  if (!template) return <div className="p-8 text-sm text-gray-500">Invalid template</div>;

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-white">
      <div className="w-full max-w-md space-y-6 px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {template.productName}
        </h1>
        <div className="space-y-4">
          {steps.map((step, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 ${
                  active
                    ? 'text-gray-900'
                    : done
                      ? 'text-gray-500'
                      : 'text-gray-300'
                }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                    done
                      ? 'bg-green-500 text-white'
                      : active
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span className="text-sm font-medium">{step.label}</span>
                {active && (
                  <div className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
