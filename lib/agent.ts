import { SessionState } from './types';
import { processMessageRegex } from './agent-regex';

interface ChatApiRequest {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  context: string;
  tools: { name: string; description: string; parameters: Record<string, unknown> }[];
}

interface ChatApiResponse {
  content: string;
  action?: {
    tool: string;
    params: Record<string, unknown>;
  };
  error?: string;
}

function buildTools(state: SessionState) {
  const entities = Object.keys(state.entityData);
  const tools: ChatApiRequest['tools'] = [];

  for (const entityName of entities) {
    tools.push({
      name: `list_${entityName}`,
      description: `List all ${entityName} records`,
      parameters: {
        type: 'object',
        properties: {
          filter: { type: 'string', description: 'Optional status or type filter' },
        },
      },
    });
    tools.push({
      name: `create_${entityName}`,
      description: `Create a new ${entityName} record`,
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the new record' },
        },
        required: ['name'],
      },
    });
    tools.push({
      name: `delete_${entityName}`,
      description: `Delete a ${entityName} record by name`,
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the record to delete' },
        },
        required: ['name'],
      },
    });
    tools.push({
      name: `update_${entityName}`,
      description: `Update a ${entityName} record`,
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the record to update' },
          status: { type: 'string', description: 'New status value' },
        },
        required: ['name'],
      },
    });
  }

  tools.push({
    name: 'navigate',
    description: 'Navigate to a different section of the product UI',
    parameters: {
      type: 'object',
      properties: {
        section: { type: 'string', description: 'Section name like Dashboard, Settings, etc.' },
      },
      required: ['section'],
    },
  });

  return tools;
}

async function callChatApi(body: ChatApiRequest): Promise<ChatApiResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { content: '', error: data.error || `API error ${res.status}` };
  }
  return res.json();
}

function buildMessages(state: SessionState, latestUserMessage: string) {
  const msgs: ChatApiRequest['messages'] = [];
  for (const m of state.messages) {
    if (m.role === 'agent') {
      msgs.push({ role: 'assistant', content: m.content });
    } else {
      msgs.push({ role: 'user', content: m.content });
    }
  }
  msgs.push({ role: 'user', content: latestUserMessage });
  return msgs;
}

export async function processMessage(
  message: string,
  state: SessionState
): Promise<{ reply: string; action?: import('./types').Action; newState: SessionState }> {
  // Try the LLM API first
  try {
    const apiResult = await callChatApi({
      messages: buildMessages(state, message),
      context: 'Crow Sandbox Demo',
      tools: buildTools(state),
    });

    if (apiResult.error) {
      // Fall back to regex
      return processMessageRegex(message, state);
    }

    if (apiResult.action) {
      // Execute the action locally
      return executeToolCall(apiResult.action.tool, apiResult.action.params, state, message);
    }

    return {
      reply: apiResult.content,
      newState: { ...state, firstActionDone: true },
    };
  } catch {
    // Network or other error — fall back to regex
    return processMessageRegex(message, state);
  }
}

function executeToolCall(
  toolName: string,
  params: Record<string, unknown>,
  state: SessionState,
  originalMessage: string
): { reply: string; action?: import('./types').Action; newState: SessionState } {
  const newState = { ...state, messages: [...state.messages] };

  if (toolName.startsWith('list_')) {
    const entityName = toolName.replace('list_', '');
    const data = newState.entityData[entityName] || [];
    const filter = (params.filter as string)?.toLowerCase();
    const filtered = filter
      ? data.filter((row) =>
          Object.values(row).some((v) => String(v).toLowerCase().includes(filter))
        )
      : data;

    return {
      reply: filter
        ? `Found ${filtered.length} matching ${entityName}.`
        : `Here are your ${filtered.length} ${entityName}.`,
      action: {
        type: 'navigate',
        description: `Listed ${filtered.length} ${entityName}`,
        payload: { entity: entityName, data: filtered },
      },
      newState: {
        ...newState,
        activeNav: entityName,
        firstActionDone: true,
      },
    };
  }

  if (toolName.startsWith('create_')) {
    const entityName = toolName.replace('create_', '');
    const name = (params.name as string) || 'New Item';
    const data = [...(newState.entityData[entityName] || [])];
    const newItem: Record<string, string | number> = { id: `${Date.now()}`, name };
    data.unshift(newItem);
    return {
      reply: `I created a new ${entityName.slice(0, -1)}: ${name}.`,
      action: {
        type: 'api_call',
        description: `Created ${entityName.slice(0, -1)}: ${name}`,
        payload: { entity: entityName, data, newItem },
      },
      newState: {
        ...newState,
        entityData: { ...newState.entityData, [entityName]: data },
        activeNav: entityName,
        firstActionDone: true,
      },
    };
  }

  if (toolName.startsWith('delete_')) {
    const entityName = toolName.replace('delete_', '');
    const name = (params.name as string) || '';
    const data = [...(newState.entityData[entityName] || [])];
    const idx = data.findIndex((row) =>
      String(row.name || '').toLowerCase().includes(name.toLowerCase())
    );
    if (idx >= 0) {
      const removed = data.splice(idx, 1)[0];
      return {
        reply: `I deleted ${removed.name} from ${entityName}.`,
        action: {
          type: 'api_call',
          description: `Deleted ${entityName.slice(0, -1)}: ${removed.name}`,
          payload: { entity: entityName, data },
        },
        newState: {
          ...newState,
          entityData: { ...newState.entityData, [entityName]: data },
          activeNav: entityName,
          firstActionDone: true,
        },
      };
    }
    return {
      reply: `I couldn't find a ${entityName.slice(0, -1)} named ${name}.`,
      newState: { ...newState, firstActionDone: true },
    };
  }

  if (toolName.startsWith('update_')) {
    const entityName = toolName.replace('update_', '');
    const name = (params.name as string) || '';
    const newStatus = params.status as string | undefined;
    const data = [...(newState.entityData[entityName] || [])];
    const idx = data.findIndex((row) =>
      String(row.name || '').toLowerCase().includes(name.toLowerCase())
    );
    if (idx >= 0) {
      const updated = { ...data[idx] };
      if (newStatus) updated.status = newStatus;
      else updated.name = `${updated.name} (updated)`;
      data[idx] = updated;
      return {
        reply: `I updated ${updated.name} in ${entityName}.`,
        action: {
          type: 'api_call',
          description: `Updated ${entityName.slice(0, -1)}: ${updated.name}`,
          payload: { entity: entityName, data },
        },
        newState: {
          ...newState,
          entityData: { ...newState.entityData, [entityName]: data },
          activeNav: entityName,
          firstActionDone: true,
        },
      };
    }
    return {
      reply: `I couldn't find a ${entityName.slice(0, -1)} named ${name}.`,
      newState: { ...newState, firstActionDone: true },
    };
  }

  if (toolName === 'navigate') {
    const section = (params.section as string) || 'Dashboard';
    const navId = section.toLowerCase().replace(/\s+/g, '');
    return {
      reply: `I navigated to the ${section} section.`,
      action: {
        type: 'navigate',
        description: `Opened ${section}`,
        payload: { navId },
      },
      newState: {
        ...newState,
        activeNav: navId,
        firstActionDone: true,
      },
    };
  }

  // Unknown tool — fall back
  return processMessageRegex(originalMessage, state);
}
