import { Template } from '@/lib/types';

interface Props {
  template: Template;
  activeNav: string;
  entityData: Record<string, Record<string, string | number>[]>;
  onNavChange?: (id: string) => void;
}

export default function MockProduct({ template, activeNav, entityData, onNavChange }: Props) {
  const activeEntity = template.entities.find((e) => e.name === activeNav);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: template.color }}
          />
          <span className="text-sm font-semibold text-gray-900">
            {template.productName}
          </span>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
          Sandbox — mock data
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 border-r border-gray-200 bg-gray-50">
          <nav className="px-2 py-2">
            {template.navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavChange?.(item.id)}
                className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                  activeNav === item.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeNav === 'dashboard' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {template.entities.map((entity) => (
                <div
                  key={entity.name}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <p className="text-xs font-medium uppercase text-gray-500">
                    {entity.displayName}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {(entityData[entity.name] || entity.data).length}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeEntity && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {activeEntity.displayName}
              </h2>
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {activeEntity.fields.map((f) => (
                        <th
                          key={f.key}
                          className="px-4 py-2 font-medium text-gray-500"
                        >
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(entityData[activeEntity.name] || activeEntity.data).map(
                      (row, i) => (
                        <tr key={`${row.id}-${i}`}>
                          {activeEntity.fields.map((f) => (
                            <td
                              key={f.key}
                              className="px-4 py-2 text-gray-700"
                            >
                              {row[f.key]}
                            </td>
                          ))}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!activeEntity && activeNav !== 'dashboard' && (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">
              Select a section from the sidebar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
