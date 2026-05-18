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

  const isList = /show|list|get|find|display|what|give/.test(lower);
  const isCreate = /create|add|new|make/.test(lower);

  let targetEntity: string | undefined;
  let targetNavId: string | undefined;

  for (const entity of template.entities) {
    const singular = entity.name.slice(0, -1);
    if (lower.includes(entity.name) || lower.includes(singular)) {
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
      action = {
        type: 'navigate',
        description: `Listed ${currentData.length} ${entityDef.displayName.toLowerCase()}`,
        payload: { navId: targetNavId || targetEntity, entity: targetEntity, data: currentData },
      };
      return {
        reply: `Here are your ${currentData.length} ${entityDef.displayName.toLowerCase()}.`,
        action,
        newState: { ...newState, firstActionDone: true },
      };
    }

    if (isCreate) {
      const nameMatch = message.match(
        /(?:for|named?)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:at|from|in|with|under)|$)/
      );
      const rawName = nameMatch
        ? nameMatch[1].trim()
        : `New ${entityDef.displayName.slice(0, -1)}`;
      const newItem: Record<string, string | number> = {};
      entityDef.fields.forEach((f) => {
        if (f.key === 'id') newItem[f.key] = `${Date.now()}`;
        else if (f.key === 'name') newItem[f.key] = rawName;
        else if (f.key === 'status') newItem[f.key] = 'New';
        else if (f.key === 'email')
          newItem[f.key] = `${rawName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
        else if (f.key === 'stage') newItem[f.key] = 'Discovery';
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
        description: `Created ${entityDef.displayName.slice(0, -1).toLowerCase()}: ${rawName}`,
        payload: { entity: targetEntity, data: currentData, newItem },
      };
      return {
        reply: `I created a new ${entityDef.displayName
          .slice(0, -1)
          .toLowerCase()} for ${rawName}. It's now at the top of the list.`,
        action,
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
    reply: `I'm not sure how to help with that in ${template.productName}. Try asking me to show your ${template.entities[0].displayName.toLowerCase()} or create a new ${template.entities[0].displayName.slice(0, -1).toLowerCase()}.`,
    newState,
  };
}
