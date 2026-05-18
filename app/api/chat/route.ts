import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, context, tools } = body as {
      messages: Array<{ role: string; content: string }>;
      context: string;
      tools: Array<{ name: string; description: string; parameters: Record<string, unknown> }>;
    };

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 });
    }

    const systemPrompt = `You are the Crow AI agent running in a sandbox demo. You help users interact with a product called "${context}". You have access to tools that manipulate mock data. Be helpful, direct, and action-oriented. Keep responses under 3 sentences unless explaining something complex.`;

    const openaiMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    const openaiTools = tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      tools: openaiTools.length > 0 ? openaiTools : undefined,
      tool_choice: openaiTools.length > 0 ? 'auto' : undefined,
      max_tokens: 300,
      temperature: 0.2,
    });

    const choice = completion.choices[0];

    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const call = choice.message.tool_calls[0] as { function: { name: string; arguments: string } };
      return NextResponse.json({
        content: '',
        action: {
          tool: call.function.name,
          params: JSON.parse(call.function.arguments),
        },
      });
    }

    return NextResponse.json({
      content: choice.message.content || 'I\'m not sure how to help with that.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
