import { Template, SessionState } from './types';

export const templates: Template[] = [
  {
    id: 'crm',
    name: 'CRM / Sales Tool',
    productName: 'Orbit',
    color: '#4f46e5',
    navItems: [
      { label: 'Dashboard', id: 'dashboard' },
      { label: 'Contacts', id: 'contacts' },
      { label: 'Deals', id: 'deals' },
      { label: 'Tasks', id: 'tasks' },
      { label: 'Analytics', id: 'analytics' },
    ],
    entities: [
      {
        name: 'contacts',
        displayName: 'Contacts',
        fields: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'company', label: 'Company' },
          { key: 'email', label: 'Email' },
          { key: 'status', label: 'Status' },
        ],
        data: [
          { id: '1', name: 'Sarah Chen', company: 'Acme Corp', email: 'sarah@acme.com', status: 'Qualified' },
          { id: '2', name: 'Marcus Johnson', company: 'Stripe', email: 'marcus@stripe.com', status: 'Customer' },
          { id: '3', name: 'Priya Patel', company: 'Linear', email: 'priya@linear.app', status: 'Lead' },
        ],
      },
      {
        name: 'deals',
        displayName: 'Deals',
        fields: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'value', label: 'Value' },
          { key: 'stage', label: 'Stage' },
          { key: 'closeDate', label: 'Close Date' },
        ],
        data: [
          { id: 'D1', name: 'Stripe Integration', value: 25000, stage: 'Negotiation', closeDate: 'May 30' },
          { id: 'D2', name: 'Enterprise Renewal', value: 120000, stage: 'Closed Won', closeDate: 'June 15' },
          { id: 'D3', name: 'SMB Expansion', value: 8000, stage: 'Discovery', closeDate: 'June 22' },
        ],
      },
    ],
    suggestedPrompts: [
      'Show me all deals closing this month',
      'Create a new contact for Sarah Chen at Acme Corp',
      "What's the status of the Stripe integration deal?",
      'List all qualified contacts',
    ],
  },
  {
    id: 'erp',
    name: 'ERP / Operations',
    productName: 'Nexus',
    color: '#059669',
    navItems: [
      { label: 'Dashboard', id: 'dashboard' },
      { label: 'Inventory', id: 'inventory' },
      { label: 'Orders', id: 'orders' },
      { label: 'Suppliers', id: 'suppliers' },
      { label: 'Reports', id: 'reports' },
    ],
    entities: [
      {
        name: 'inventory',
        displayName: 'Inventory',
        fields: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'sku', label: 'SKU' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'location', label: 'Location' },
        ],
        data: [
          { id: '1', name: 'Office Chairs', sku: 'CHR-001', quantity: 120, location: 'Warehouse A' },
          { id: '2', name: 'Standing Desks', sku: 'DSK-002', quantity: 45, location: 'Warehouse B' },
          { id: '3', name: 'Monitors 27in', sku: 'MON-003', quantity: 200, location: 'Warehouse A' },
        ],
      },
      {
        name: 'orders',
        displayName: 'Orders',
        fields: [
          { key: 'id', label: 'ID' },
          { key: 'customer', label: 'Customer' },
          { key: 'status', label: 'Status' },
          { key: 'total', label: 'Total' },
        ],
        data: [
          { id: '101', customer: 'Acme Corp', status: 'Shipped', total: 4500 },
          { id: '102', customer: 'Globex', status: 'Processing', total: 1200 },
          { id: '103', customer: 'Hooli', status: 'Pending', total: 8900 },
        ],
      },
    ],
    suggestedPrompts: [
      'Show low stock items',
      'List orders from this month',
      'Create a new supplier record for FastTrack Logistics',
      'What inventory is in Warehouse A?',
    ],
  },
  {
    id: 'devtools',
    name: 'Developer Tool',
    productName: 'Telemetry',
    color: '#d97706',
    navItems: [
      { label: 'Events', id: 'events' },
      { label: 'Feature Flags', id: 'flags' },
      { label: 'Dashboards', id: 'dashboards' },
      { label: 'Sessions', id: 'sessions' },
      { label: 'Settings', id: 'settings' },
    ],
    entities: [
      {
        name: 'events',
        displayName: 'Events',
        fields: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'volume', label: 'Volume' },
          { key: 'lastSeen', label: 'Last Seen' },
        ],
        data: [
          { id: 'e1', name: 'user_signed_up', volume: 12400, lastSeen: '2 min ago' },
          { id: 'e2', name: 'checkout_completed', volume: 8300, lastSeen: '5 min ago' },
          { id: 'e3', name: 'feature_flag_evaluated', volume: 456000, lastSeen: 'now' },
        ],
      },
      {
        name: 'flags',
        displayName: 'Feature Flags',
        fields: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'status', label: 'Status' },
          { key: 'rollout', label: 'Rollout' },
        ],
        data: [
          { id: 'ff1', name: 'new-checkout-flow', status: 'Active', rollout: '50%' },
          { id: 'ff2', name: 'dark-mode', status: 'Active', rollout: '100%' },
          { id: 'ff3', name: 'beta-api-v2', status: 'Inactive', rollout: '0%' },
        ],
      },
    ],
    suggestedPrompts: [
      'Show events with high volume',
      'List active feature flags',
      'Create a new event called user_invited',
      "What's the rollout for dark mode?",
    ],
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    productName: 'Market',
    color: '#dc2626',
    navItems: [
      { label: 'Dashboard', id: 'dashboard' },
      { label: 'Products', id: 'products' },
      { label: 'Orders', id: 'orders' },
      { label: 'Customers', id: 'customers' },
      { label: 'Discounts', id: 'discounts' },
    ],
    entities: [
      {
        name: 'products',
        displayName: 'Products',
        fields: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'price', label: 'Price' },
          { key: 'stock', label: 'Stock' },
          { key: 'category', label: 'Category' },
        ],
        data: [
          { id: 'p1', name: 'Ergonomic Keyboard', price: 129, stock: 45, category: 'Electronics' },
          { id: 'p2', name: 'Wireless Mouse', price: 59, stock: 120, category: 'Electronics' },
          { id: 'p3', name: 'Laptop Stand', price: 89, stock: 30, category: 'Accessories' },
        ],
      },
      {
        name: 'orders',
        displayName: 'Orders',
        fields: [
          { key: 'id', label: 'ID' },
          { key: 'customer', label: 'Customer' },
          { key: 'total', label: 'Total' },
          { key: 'status', label: 'Status' },
          { key: 'items', label: 'Items' },
        ],
        data: [
          { id: 'o1', customer: 'Alex Rivera', total: 387, status: 'Pending', items: 3 },
          { id: 'o2', customer: 'Sam Kim', total: 129, status: 'Shipped', items: 1 },
          { id: 'o3', customer: 'Jordan Lee', total: 218, status: 'Delivered', items: 2 },
        ],
      },
    ],
    suggestedPrompts: [
      'Show products out of stock',
      'List pending orders',
      'Create a new product called Gaming Chair',
      "What's the total for Alex Rivera's order?",
    ],
  },
];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function createInitialState(templateId: string): SessionState {
  const template = getTemplate(templateId);
  if (!template) throw new Error(`Unknown template: ${templateId}`);
  const entityData: Record<string, Record<string, string | number>[]> = {};
  for (const entity of template.entities) {
    entityData[entity.name] = JSON.parse(JSON.stringify(entity.data));
  }
  return {
    templateId,
    activeNav: template.navItems[0].id,
    entityData,
    firstActionDone: false,
    messages: [
      {
        id: 'welcome',
        role: 'agent',
        content: `Welcome to the ${template.productName} sandbox. I'm your Crow agent — ask me anything about this product.`,
        timestamp: Date.now(),
      },
    ],
  };
}
