export interface NavItem {
  label: string;
  id: string;
}

export interface EntityField {
  key: string;
  label: string;
}

export interface Entity {
  name: string;
  displayName: string;
  fields: EntityField[];
  data: Record<string, string | number>[];
}

export interface Template {
  id: string;
  name: string;
  productName: string;
  color: string;
  navItems: NavItem[];
  entities: Entity[];
  suggestedPrompts: string[];
}

export interface SessionState {
  templateId: string;
  activeNav: string;
  entityData: Record<string, Record<string, string | number>[]>;
  firstActionDone: boolean;
  sandboxCtaShown: boolean;
  agentMisses: number;
  messages: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  action?: Action;
}

export interface Action {
  type: 'navigate' | 'api_call';
  description: string;
  payload?: unknown;
}
