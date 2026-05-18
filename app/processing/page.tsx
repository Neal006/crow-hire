'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getTemplate } from '@/lib/templates';
import { generateTemplateFromUrl } from '@/lib/crawl';
import { generateTemplateFromSpec } from '@/lib/openapi';
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

const specSteps = [
  { label: 'Parsing OpenAPI spec...', duration: 2000 },
  { label: 'Extracting endpoints...', duration: 2000 },
  { label: 'Mapping schemas to entities...', duration: 2000 },
  { label: 'Generating agent tools...', duration: 2000 },
  { label: 'Spinning up sandbox...', duration: 1500 },
  { label: 'Your agent is ready', duration: 500 },
];

function generateTemplateFromCrawl(url: string, crawlResult: { title: string; description: string; headings: string[]; entities: { name: string }[] }): Template {
  const hostname = new URL(url).hostname.replace(/^www\./, '');
  const domain = hostname.split('.')[0];
  const productName = crawlResult.title || domain.charAt(0).toUpperCase() + domain.slice(1);

  const colors = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];
  const color = colors[domain.length % colors.length];

  const entityNames = crawlResult.entities.length > 0
    ? crawlResult.entities.map((e) => e.name.toLowerCase().replace(/\s+/g, ''))
    : ['items', 'users', 'tasks', 'projects'];

  const entities = entityNames.map((name) => ({
    name,
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    fields: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
    ],
    data: [
      { id: '1', name: 'Alpha', status: 'Active' },
      { id: '2', name: 'Beta', status: 'Pending' },
      { id: '3', name: 'Gamma', status: 'Active' },
    ] as Record<string, string | number>[],
  }));

  const navItems = [
    { label: 'Dashboard', id: 'dashboard' },
    ...entities.map((e) => ({ label: e.displayName, id: e.name })),
    { label: 'Settings', id: 'settings' },
  ];

  const suggestedPrompts = [
    `Show all ${entities[0]?.displayName.toLowerCase() || 'items'}`,
    `Create a new ${entities[0]?.displayName.slice(0, -1).toLowerCase() || 'item'}`,
    `List ${entities[1]?.displayName.toLowerCase() || 'records'}`,
    'What can this product do?',
  ];

  return {
    id: `url-${Date.now()}`,
    name: productName,
    productName,
    color,
    navItems,
    entities,
    suggestedPrompts,
  };
}

function ProcessingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template');
  const url = searchParams.get('url');
  const spec = searchParams.get('spec');

  const steps = spec ? specSteps : url ? urlSteps : templateSteps;
  const [stepIndex, setStepIndex] = useState(0);
  const [productName, setProductName] = useState<string>('');
  const [error, setError] = useState('');
  const [crawlResult, setCrawlResult] = useState<{ title: string; description: string; headings: string[]; entities: { name: string }[] } | null>(null);

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
    } else if (spec) {
      try {
        const doc = JSON.parse(spec);
        const title = doc.info?.title || 'API Product';
        setProductName(title.replace(/API|Docs|Specification/gi, '').trim() || 'Your API');
      } catch {
        setProductName('Your API');
      }
    }
  }, [templateId, url, spec]);

  // Real crawl during early steps
  useEffect(() => {
    if (!url || stepIndex > 0) return;
    fetch('/api/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setCrawlResult({
          title: data.title || '',
          description: data.description || '',
          headings: data.headings || [],
          entities: data.entities || [],
        });
      })
      .catch(() => {
        // Silent fail — will use simulated crawl
      });
  }, [url, stepIndex]);

  useEffect(() => {
    if (stepIndex >= steps.length - 1) {
      const timer = setTimeout(() => {
        if (url) {
          const generated = crawlResult
            ? generateTemplateFromCrawl(url, crawlResult)
            : generateTemplateFromUrl(url);
          localStorage.setItem(`crow-template-${generated.id}`, JSON.stringify(generated));
          router.push(`/demo?template=${generated.id}`);
        } else if (spec) {
          const decoded = decodeURIComponent(spec);
          const generated = generateTemplateFromSpec(decoded);
          if (!generated) {
            setError('No endpoints found in this OpenAPI spec. Please check the JSON and try again, or pick a template.');
            return;
          }
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
  }, [stepIndex, templateId, url, spec, router, steps, crawlResult]);

  if (!templateId && !url && !spec) {
    return <div className="p-8 text-sm text-gray-500">Invalid input</div>;
  }

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-white px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Back to start
          </button>
        </div>
      </div>
    );
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
