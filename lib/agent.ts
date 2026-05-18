import { SessionState, Action } from './types';
import { getTemplate } from './templates';

export function processMessage(
  message: string,
  state: SessionState
): { reply: string; action?: Action; newState: SessionState } {
  const template = getTemplate(state.templateId);
  if (!template) {
    return { reply: "I don't recognize this demo environment.", newState: state };
  }

  const lower = message.toLowerCase();
  let newState = { ...state, messages: [...state.messages] };
  let action: Action | undefined;

  const isList = /\b(show|list|get|find|display|what|give|see|view)\b/.test(lower);
  const isCreate = /\b(create|add|new|make|insert)\b/.test(lower);
  const isDelete = /\b(delete|remove|drop|clear|archive)\b/.test(lower);
  const isUpdate = /\b(update|change|edit|modify|set|rename)\b/.test(lower);
  const isHelp = /\b(help|what can you do|what do you do|capabilities|commands)\b/.test(lower);
  const isSandbox = /\b(production|real data|live|write to|actual api|external)\b/.test(lower);

  if (isHelp) {
    const entityNames = template.entities.map((e) => e.displayName.toLowerCase()).join(', ');
    return {
      reply: `I can help you with ${template.productName}. I can list or search your ${entityNames}, create new records, update existing ones, or navigate the UI. Try: "Show all ${template.entities[0].displayName.toLowerCase()}" or "Create a new ${template.entities[0].displayName.slice(0, -1).toLowerCase()}".`,
      newState: { ...newState, firstActionDone: true },
    };
  }

  if (isSandbox) {
    return {
      reply: `This is a sandbox — I'm working with mock data only. In a full Crow integration, I'd execute against your real API with your actual permissions. Want to see how that works?`,
      newState: { ...newState, firstActionDone: true },
    };
  }

  let targetEntity: string | undefined;
  let targetNavId: string | undefined;

  for (const entity of template.entities) {
    const singular = entity.name.replace(/s$/, '');
    const plural = entity.name;
    if (lower.includes(plural) || lower.includes(singular)) {
      targetEntity = entity.name;
      targetNavId = entity.name;
      break;
    }
  }

  if (!targetEntity) {
    for (const nav of template.navItems) {
      if (lower.includes(nav.label.toLowerCase())) {
        targetNavId = nav.id;
        targetEntity = template.entities.find((e) => e.name === nav.id)?.name;
        break;
      }
    }
  }

  if (targetEntity) {
    const entityDef = template.entities.find((e) => e.name === targetEntity)!;
    const currentData = [...(newState.entityData[targetEntity] || entityDef.data)];

    if (isList) {
      newState = {
        ...newState,
        activeNav: targetNavId || targetEntity,
        entityData: { ...newState.entityData, [targetEntity]: currentData },
      };

      const statusFilter = extractStatusFilter(lower);
      let filteredData = currentData;
      if (statusFilter) {
        filteredData = currentData.filter((row) => {
          const val = String(row.status || row.type || row.role || '').toLowerCase();
          return val.includes(statusFilter.toLowerCase());
        });
      }

      action = {
        type: 'navigate',
        description: filteredData.length < currentData.length
          ? `Filtered ${filteredData.length} of ${currentData.length} ${entityDef.displayName.toLowerCase()}`
          : `Listed ${currentData.length} ${entityDef.displayName.toLowerCase()}`,
        payload: { navId: targetNavId || targetEntity, entity: targetEntity, data: filteredData },
      };

      const count = filteredData.length;
      const total = currentData.length;
      const reply = filteredData.length < currentData.length
        ? `Found ${count} matching ${entityDef.displayName.toLowerCase()} out of ${total}.`
        : `Here are your ${count} ${entityDef.displayName.toLowerCase()}.`;

      return {
        reply,
        action,
        newState: { ...newState, firstActionDone: true },
      };
    }

    if (isCreate) {
      const rawName = extractName(message) || `New ${entityDef.displayName.replace(/s$/, '')}`;
      const newItem: Record<string, string | number> = {};
      entityDef.fields.forEach((f) => {
        if (f.key === 'id') newItem[f.key] = `${Date.now()}`;
        else if (f.key === 'name') newItem[f.key] = rawName;
        else if (f.key === 'status') newItem[f.key] = 'New';
        else if (f.key === 'email')
          newItem[f.key] = `${rawName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
        else if (f.key === 'stage') newItem[f.key] = 'Discovery';
        else if (f.key === 'type') newItem[f.key] = 'Standard';
        else if (f.key === 'role') newItem[f.key] = 'Member';
        else if (typeof currentData[0]?.[f.key] === 'number') newItem[f.key] = 0;
        else newItem[f.key] = '—';
      });
      currentData.unshift(newItem);
      newState = {
        ...newState,
        entityData: { ...newState.entityData, [targetEntity]: currentData },
        activeNav: targetNavId || targetEntity,
      };
      action = {
        type: 'api_call',
        description: `Created ${entityDef.displayName.replace(/s$/, '').toLowerCase()}: ${rawName}`,
        payload: { entity: targetEntity, data: currentData, newItem },
      };
      return {
        reply: `I created a new ${entityDef.displayName
          .replace(/s$/, '')
          .toLowerCase()} for ${rawName}. It's now at the top of the list.`,
        action,
        newState: { ...newState, firstActionDone: true },
      };
    }

    if (isDelete) {
      const nameToDelete = extractName(message);
      if (nameToDelete) {
        const idx = currentData.findIndex((row) =>
          String(row.name || '').toLowerCase().includes(nameToDelete.toLowerCase())
        );
        if (idx >= 0) {
          const removed = currentData.splice(idx, 1)[0];
          newState = {
            ...newState,
            entityData: { ...newState.entityData, [targetEntity]: currentData },
            activeNav: targetNavId || targetEntity,
          };
          action = {
            type: 'api_call',
            description: `Deleted ${entityDef.displayName.replace(/s$/, '').toLowerCase()}: ${removed.name}`,
            payload: { entity: targetEntity, data: currentData },
          };
          return {
            reply: `I deleted ${removed.name} from ${entityDef.displayName.toLowerCase()}.`,
            action,
            newState: { ...newState, firstActionDone: true },
          };
        }
      }
      return {
        reply: `Which ${entityDef.displayName.replace(/s$/, '').toLowerCase()} would you like to delete? Give me a name.`,
        newState: { ...newState, firstActionDone: true },
      };
    }

    if (isUpdate) {
      const nameToUpdate = extractName(message);
      if (nameToUpdate) {
        const idx = currentData.findIndex((row) =>
          String(row.name || '').toLowerCase().includes(nameToUpdate.toLowerCase())
        );
        if (idx >= 0) {
          const updated = { ...currentData[idx] };
          const statusChange = extractStatusChange(message);
          if (statusChange) {
            updated.status = statusChange;
          } else {
            updated.name = `${updated.name} (updated)`;
          }
          currentData[idx] = updated;
          newState = {
            ...newState,
            entityData: { ...newState.entityData, [targetEntity]: currentData },
            activeNav: targetNavId || targetEntity,
          };
          action = {
            type: 'api_call',
            description: `Updated ${entityDef.displayName.replace(/s$/, '').toLowerCase()}: ${updated.name}`,
            payload: { entity: targetEntity, data: currentData },
          };
          return {
            reply: `I updated ${updated.name} in ${entityDef.displayName.toLowerCase()}.`,
            action,
            newState: { ...newState, firstActionDone: true },
          };
        }
      }
      return {
        reply: `Which ${entityDef.displayName.replace(/s$/, '').toLowerCase()} would you like to update? Give me a name.`,
        newState: { ...newState, firstActionDone: true },
      };
    }
  }

  if (targetNavId && !targetEntity) {
    newState = { ...newState, activeNav: targetNavId };
    return {
      reply: `I navigated to the ${template.navItems.find((n) => n.id === targetNavId)?.label} section. What would you like to do?`,
      action: {
        type: 'navigate',
        description: `Opened ${template.navItems.find((n) => n.id === targetNavId)?.label}`,
        payload: { navId: targetNavId },
      },
      newState: { ...newState, firstActionDone: true },
    };
  }

  return {
    reply: `I'm not sure how to help with that in ${template.productName}. Try asking me to show your ${template.entities[0].displayName.toLowerCase()}, create a new ${template.entities[0].displayName.replace(/s$/, '').toLowerCase()}, or ask "what can you do?"`,
    newState,
  };
}

function extractName(message: string): string | null {
  const patterns = [
    /(?:for|named?|called)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:at|from|in|with|under|to|as)|$)/,
    /(?:\b[a-z]+\s+)([A-Z][a-zA-Z\s]+?)(?:\s+(?:to|as|from|at)|$)/,
    /'([^']+)'/,
    /"([^"]+)"/,
  ];
  for (const p of patterns) {
    const m = message.match(p);
    if (m && m[1] && m[1].trim().length > 1) {
      return m[1].trim();
    }
  }
  return null;
}

function extractStatusFilter(lower: string): string | null {
  const m = lower.match(/\b(active|open|closed|pending|new|draft|archived|high|low|medium|standard|premium)\b/);
  return m ? m[1] : null;
}

function extractStatusChange(message: string): string | null {
  const lower = message.toLowerCase();
  const m = lower.match(/\bto\s+(active|open|closed|pending|new|draft|archived|high|low|medium)\b/);
  return m ? m[1] : null;
}
