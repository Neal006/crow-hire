import { Template } from './types';

function titleCase(str: string): string {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function randomColor(): string {
  const colors = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function generateEntity(name: string): {
  name: string;
  displayName: string;
  fields: { key: string; label: string }[];
  data: Record<string, string | number>[];
} {
  const idField = { key: 'id', label: 'ID' };
  const nameField = { key: 'name', label: 'Name' };
  const statusField = { key: 'status', label: 'Status' };

  if (name === 'items' || name === 'products' || name === 'assets') {
    return {
      name,
      displayName: titleCase(name),
      fields: [idField, nameField, { key: 'type', label: 'Type' }, { key: 'count', label: 'Count' }],
      data: [
        { id: '1', name: 'Alpha', type: 'Standard', count: 12 },
        { id: '2', name: 'Beta', type: 'Premium', count: 5 },
        { id: '3', name: 'Gamma', type: 'Standard', count: 8 },
      ],
    };
  }

  if (name === 'users' || name === 'members' || name === 'contacts') {
    return {
      name,
      displayName: titleCase(name),
      fields: [idField, nameField, { key: 'role', label: 'Role' }, { key: 'email', label: 'Email' }],
      data: [
        { id: '1', name: 'Alice Nguyen', role: 'Admin', email: 'alice@example.com' },
        { id: '2', name: 'Bob Smith', role: 'Editor', email: 'bob@example.com' },
        { id: '3', name: 'Carol White', role: 'Viewer', email: 'carol@example.com' },
      ],
    };
  }

  if (name === 'tasks' || name === 'issues' || name === 'tickets') {
    return {
      name,
      displayName: titleCase(name),
      fields: [idField, nameField, statusField, { key: 'priority', label: 'Priority' }],
      data: [
        { id: '1', name: 'Review onboarding flow', status: 'Open', priority: 'High' },
        { id: '2', name: 'Update pricing page', status: 'In Progress', priority: 'Medium' },
        { id: '3', name: 'Fix login redirect', status: 'Closed', priority: 'Low' },
      ],
    };
  }

  if (name === 'projects' || name === 'workspaces' || name === 'campaigns') {
    return {
      name,
      displayName: titleCase(name),
      fields: [idField, nameField, statusField, { key: 'owner', label: 'Owner' }],
      data: [
        { id: '1', name: 'Q2 Launch', status: 'Active', owner: 'Alice Nguyen' },
        { id: '2', name: 'Design System', status: 'Planning', owner: 'Bob Smith' },
        { id: '3', name: 'API Migration', status: 'Active', owner: 'Carol White' },
      ],
    };
  }

  // Default
  return {
    name,
    displayName: titleCase(name),
    fields: [idField, nameField, statusField],
    data: [
      { id: '1', name: 'Alpha', status: 'Active' },
      { id: '2', name: 'Beta', status: 'Pending' },
      { id: '3', name: 'Gamma', status: 'Active' },
    ],
  };
}

export function generateTemplateFromUrl(url: string): Template {
  let hostname = '';
  try {
    hostname = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    hostname = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }

  const parts = hostname.split('.');
  const domain = parts[0];
  const productName = titleCase(domain);

  const entityNames = ['items', 'users', 'tasks', 'projects'];
  const entities = entityNames.map((e) => generateEntity(e));

  const navItems = [
    { label: 'Dashboard', id: 'dashboard' },
    ...entities.map((e) => ({ label: e.displayName, id: e.name })),
    { label: 'Settings', id: 'settings' },
  ];

  const suggestedPrompts = [
    `Show all ${entities[0].displayName.toLowerCase()}`,
    `Create a new ${entities[1].displayName.slice(0, -1).toLowerCase()} called Dana Lee`,
    `List ${entities[2].displayName.toLowerCase()} that are open`,
    `What ${entities[3].displayName.toLowerCase()} are active?`,
  ];

  return {
    id: `url-${Date.now()}`,
    name: productName,
    productName,
    color: randomColor(),
    navItems,
    entities,
    suggestedPrompts,
  };
}
