'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getTemplate } from '@/lib/templates';
import { generateTemplateFromUrl } from '@/lib/crawl';
import { Template } from '@/lib/types';

const templateSteps = [
  { label: 'Crawling your product...', duration: 3000 },
  { label: 'Understanding your features...', duration: 2000 },
  { label: 'Generating agent tools...', duration: 2000 },
  { label: 'Spinning up sandbox...', duration: 1500 },
  { label: 'Your agent is ready', duration: 500 },
];

const urlSteps = [
  { label: 'Crawling your product...', duration: 4000 },
  { label: 'Analyzing pages found...', duration: 2500 },
  { label: 'Extracting features and entities...', duration: 2000 },
  { label: 'Generating agent tools...', duration: 2000 },
  { label: 'Spinning up sandbox...', duration: 1500 },
  { label: 'Your agent is ready', duration: 500 },
];

function ProcessingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template');
  const url = searchParams.get('url');
  const steps = url ? urlSteps : templateSteps;
  const [stepIndex, setStepIndex] = useState(0);
  const [productName, setProductName] = useState<string>('');

  useEffect(() => {
    if (templateId) {
      const template = getTemplate(templateId);
      if (template) setProductName(template.productName);
    } else if (url) {
      try {
        const hostname = new URL(url).hostname.replace(/^www\./, '');
        const name = hostname.split('.')[0];
        setProductName(name.charAt(0).toUpperCase() + name.slice(1));
      } catch {
        setProductName('Your Product');
      }
    }
  }, [templateId, url]);

  useEffect(() => {
    if (stepIndex >= steps.length - 1) {
      const timer = setTimeout(() => {
        if (url) {
          const generated = generateTemplateFromUrl(url);
          localStorage.setItem(`crow-template-${generated.id}`, JSON.stringify(generated));
          router.push(`/demo?template=${generated.id}`);
        } else if (templateId) {
          router.push(`/demo?template=${templateId}`);
        } else {
          router.push('/');
        }
      }, steps[steps.length - 1].duration);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setStepIndex((i) => i + 1);
    }, steps[stepIndex].duration);
    return () => clearTimeout(timer);
  }, [stepIndex, templateId, url, router, steps]);

  if (!templateId && !url) {
    return <div className="p-8 text-sm text-gray-500">Invalid input</div>;
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-white">
      <div className="w-full max-w-md space-y-6 px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {productName || 'Loading...'}
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

export default function ProcessingPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-white" />}>
      <ProcessingContent />
    </Suspense>
  );
}
