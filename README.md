# Crow Sandbox Demo Generator

A self-serve demo tool that lets prospects paste their product URL or OpenAPI spec and instantly chat with an AI agent that understands their product — no signup, no sales call, no engineering time.

## What it is

Crow's sales pitch is "deploy an AI agent in under a week," but today a VP of Product has to trust that claim without seeing it on their own product. This tool collapses that trust gap. A prospect lands, pastes a URL, and within seconds they're watching an agent navigate a mock of their UI, list their entities, and execute simulated CRUD operations.

Built as a portfolio project for Crow (YC W26), this is a functional frontend prototype with real backend API routes for URL crawling and LLM-powered agent reasoning.

## How it works

**Input layer:** Three paths — URL crawl, OpenAPI spec paste, or pre-built industry templates (CRM, ERP, Dev Tool, E-commerce).

**Processing pipeline:** A live step indicator shows exactly what's happening — crawling pages, extracting features, generating agent tools, spinning up the sandbox. The pipeline completes in ~9 seconds for templates, longer for real crawls.

**Sandbox experience:** Split-screen layout. Left: a mock product UI with the prospect's actual product name, inferred entities, and realistic mock data. Right: a working chat agent powered by OpenAI function calling (with a regex fallback when no key is set).

**Handoff:** Three contextual CTAs surface at natural moments — after the first successful action, when the user hits a sandbox limitation, and on session inactivity — all linking to a contact page for integration calls.

**Analytics dashboard:** Crow's team gets a view of all sessions, message counts, input types, first-action conversion, agent miss rate, and most common user queries.

## Tech stack

- **Next.js 16** (App Router) with TypeScript
- **Tailwind CSS** for minimal, typography-driven UI
- **OpenAI API** (`gpt-4o-mini` with function calling) for the agent reasoning layer
- **Client-side state** via React + localStorage with per-user session isolation
- **Next.js API routes** for `/api/crawl` (real HTML fetching) and `/api/chat` (LLM tool selection)

## What's real

- **URL crawling** fetches real HTML, extracts title, meta description, headings, and infers domain-specific entities (users, contacts, deals, orders, etc.).
- **OpenAI agent** reasons about natural language, picks the correct tool (`list_contacts`, `create_deal`, `update_task`, `navigate`), and the client executes it against mock data.
- **Session management** with shareable links, 30-minute inactivity expiry, 7-day hard expiry, and per-user isolation so two people on the same link don't share state.
- **Rate limiting** (client-side), prompt injection guards, profanity filtering, and 50-message-per-session caps.
- **Full analytics** tracking input type, message count, first-action completion, agent miss rate, and common queries.

## What's simulated

This is a frontend prototype, not production infrastructure. What's missing:

- **No JavaScript execution in crawls.** We use `fetch()`, not Playwright. JS-rendered SPAs return only the static HTML shell.
- **No persistent backend database.** Sessions live in `localStorage` with TTL logic. A real version needs Redis or DynamoDB.
- **No actual HTTP mock server.** State mutations happen client-side. A production version would spin up ephemeral Node.js mock servers per session.
- **Client-side rate limiting only.** Easily bypassed with dev tools. Production needs IP-based limiting via a proxy or edge function.
- **No PII stripping.** The crawl doesn't filter emails or phone numbers from crawled content. Production needs a content sanitization layer.

## Running locally

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000`. Without an `OPENAI_API_KEY`, the agent falls back to a keyword-based parser that still handles list, create, delete, update, and navigate operations correctly — just without LLM reasoning.

To enable the real agent, add your key to `.env.local`:

```
OPENAI_API_KEY=sk-...
```

## Deploying

```bash
npx vercel --prod
```

Vercel auto-detects the Next.js setup and deploys both static pages and API routes. Add `OPENAI_API_KEY` in your Vercel project settings under Environment Variables if you want the LLM layer live.

## Why this exists

Every tool Crow builds should either close customers or attract developers. The demo generator does both: it removes the top-of-funnel trust gap for buyers, and the auto-generated agent-from-spec is genuinely impressive engineering that developers will share.

This prototype scopes the real work so Crow can decide which backend pieces to build (Redis, Playwright cluster, mock server provisioning) and which to defer.
