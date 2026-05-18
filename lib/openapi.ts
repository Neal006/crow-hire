import { Template, Entity, NavItem } from './types';

interface OpenApiDoc {
  openapi?: string;
  swagger?: string;
  info?: { title?: string; version?: string };
  paths?: Record<string, Record<string, unknown>>;
  components?: { schemas?: Record<string, unknown> };
  definitions?: Record<string, unknown>;
}

function randomColor(): string {
  const colors = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function inferFieldsFromSchema(
  schema: unknown,
  schemas: Record<string, unknown>
): { key: string; label: string }[] {
  const fields: { key: string; label: string }[] = [{ key: 'id', label: 'ID' }];

  const resolved = resolveRef(schema, schemas);
  if (!resolved || typeof resolved !== 'object') return fields;

  const obj = resolved as Record<string, unknown>;
  const props = (obj.properties || obj['x-properties']) as Record<string, unknown> | undefined;
  if (!props) return fields;

  for (const [key, val] of Object.entries(props)) {
    if (key === 'id') continue;
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    fields.push({ key, label });
    if (fields.length >= 6) break;
  }

  return fields;
}

function resolveRef(schema: unknown, schemas: Record<string, unknown>): unknown {
  if (!schema || typeof schema !== 'object') return schema;
  const obj = schema as Record<string, unknown>;
  if (obj.$ref && typeof obj.$ref === 'string') {
    const parts = obj.$ref.split('/');
    const name = parts[parts.length - 1];
    return schemas[name] || schema;
  }
  return schema;
}

function generateMockRow(fields: { key: string; label: string }[], index: number): Record<string, string | number> {
  const row: Record<string, string | number> = { id: `${index + 1}` };
  const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'];
  const statuses = ['Active', 'Pending', 'Closed', 'Draft', 'Archived'];
  const types = ['Standard', 'Premium', 'Basic', 'Enterprise'];

  for (const f of fields) {
    if (f.key === 'id') continue;
    const lower = f.key.toLowerCase();
    if (lower.includes('name')) row[f.key] = names[index % names.length];
    else if (lower.includes('status')) row[f.key] = statuses[index % statuses.length];
    else if (lower.includes('type') || lower.includes('role')) row[f.key] = types[index % types.length];
    else if (lower.includes('email')) row[f.key] = `user${index + 1}@example.com`;
    else if (lower.includes('count') || lower.includes('quantity') || lower.includes('total')) row[f.key] = (index + 1) * 10;
    else if (lower.includes('price') || lower.includes('value')) row[f.key] = (index + 1) * 25;
    else row[f.key] = `Value ${index + 1}`;
  }

  return row;
}

export function generateTemplateFromSpec(specJson: string): Template | null {
  let doc: OpenApiDoc;
  try {
    doc = JSON.parse(specJson);
  } catch {
    return null;
  }

  const schemas = {
    ...(doc.components?.schemas || {}),
    ...(doc.definitions || {}),
  };

  const paths = doc.paths || {};
  const entityMap = new Map<
    string,
    { methods: string[]; schema: unknown; path: string }
  >();

  for (const [path, methods] of Object.entries(paths)) {
    const segments = path.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last) continue;

    const entityName = last.replace(/\{.*?\}/g, '').replace(/s$/, '') || 'resource';
    const pluralName = entityName.endsWith('s') ? entityName : `${entityName}s`;

    let schema: unknown = null;
    for (const [method, op] of Object.entries(methods)) {
      if (method === 'get') {
        const operation = op as Record<string, unknown>;
        const responses = operation.responses as Record<string, unknown>;
        const ok = responses?.['200'] as Record<string, unknown>;
        const content = ok?.content as Record<string, unknown>;
        const json = content?.['application/json'] as Record<string, unknown>;
        schema = json?.schema || ok?.schema;
        if (schema) break;
      }
    }

    const existing = entityMap.get(pluralName);
    if (existing) {
      existing.methods.push(...Object.keys(methods));
    } else {
      entityMap.set(pluralName, { methods: Object.keys(methods), schema, path });
    }
  }

  if (entityMap.size === 0) return null;

  const entities: Entity[] = [];
  const navItems: NavItem[] = [{ label: 'Dashboard', id: 'dashboard' }];

  let idx = 0;
  for (const [name, info] of entityMap) {
    const fields = inferFieldsFromSchema(info.schema, schemas);
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    const data = Array.from({ length: 3 }, (_, i) => generateMockRow(fields, i));

    entities.push({
      name,
      displayName,
      fields,
      data,
    });

    navItems.push({ label: displayName, id: name });
    idx++;
    if (idx >= 4) break;
  }

  navItems.push({ label: 'Settings', id: 'settings' });

  const title = doc.info?.title || 'API Product';
  const productName = title.replace(/API|Docs|Specification/gi, '').trim() || 'Your API';

  const suggestedPrompts = [
    `List all ${entities[0]?.displayName.toLowerCase() || 'items'}`,
    `Create a new ${entities[0]?.displayName.slice(0, -1).toLowerCase() || 'item'}`,
    entities[1] ? `Show ${entities[1].displayName.toLowerCase()}` : 'Show details',
    `What can this API do?`,
  ];

  return {
    id: `spec-${Date.now()}`,
    name: productName,
    productName,
    color: randomColor(),
    navItems,
    entities,
    suggestedPrompts,
  };
}
