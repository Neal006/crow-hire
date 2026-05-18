export interface CrawlResult {
  url: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
  entities: { name: string; count: number }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ChatRequest {
  messages: ChatMessage[];
  context: string;
  tools: AgentTool[];
}

export interface ChatResponse {
  content: string;
  action?: {
    tool: string;
    params: Record<string, unknown>;
  };
}
