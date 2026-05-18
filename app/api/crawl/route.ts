import { NextResponse } from 'next/server';

function extractText(html: string): string {
  // Remove script and style tags
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 5000); // Cap at 5KB
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || '';
}

function extractMetaDescription(html: string): string {
  const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  return match?.[1]?.trim() || '';
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const regex = /<h[1-3][^>]*>([^<]*)<\/h[1-3]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[1].trim();
    if (text && text.length > 3) headings.push(text);
    if (headings.length >= 10) break;
  }
  return headings;
}

function inferEntities(text: string): { name: string; count: number }[] {
  const entityPatterns = [
    { pattern: /\b(user|users|member|members|account|accounts)\b/gi, name: 'Users' },
    { pattern: /\b(project|projects|workspace|workspaces)\b/gi, name: 'Projects' },
    { pattern: /\b(task|tasks|issue|issues|ticket|tickets)\b/gi, name: 'Tasks' },
    { pattern: /\b(contact|contacts|lead|leads|customer|customers)\b/gi, name: 'Contacts' },
    { pattern: /\b(deal|deals|opportunity|opportunities|pipeline)\b/gi, name: 'Deals' },
    { pattern: /\b(product|products|item|items|sku)\b/gi, name: 'Products' },
    { pattern: /\b(order|orders|purchase|purchases)\b/gi, name: 'Orders' },
    { pattern: /\b(event|events|log|logs|activity)\b/gi, name: 'Events' },
    { pattern: /\b(feature flag|feature flags|flag|flags|toggle)\b/gi, name: 'Feature Flags' },
    { pattern: /\b(inventory|stock|warehouse|supply)\b/gi, name: 'Inventory' },
  ];

  const counts = new Map<string, number>();
  for (const ep of entityPatterns) {
    const matches = text.match(ep.pattern);
    if (matches && matches.length >= 2) {
      counts.set(ep.name, (counts.get(ep.name) || 0) + matches.length);
    }
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = body.url as string;

    if (!url) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const parsed = new URL(url);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname.startsWith('192.168.') || parsed.hostname.startsWith('10.')) {
      return NextResponse.json({ error: 'Private URLs are not allowed' }, { status: 403 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CrowBot/1.0)',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 502 });
    }

    const html = await res.text();
    const title = extractTitle(html);
    const description = extractMetaDescription(html);
    const headings = extractHeadings(html);
    const text = extractText(html);
    const entities = inferEntities(text);

    return NextResponse.json({
      url,
      title,
      description,
      headings,
      text,
      entities,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
