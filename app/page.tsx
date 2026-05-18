import Link from 'next/link';
import { templates } from '@/lib/templates';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          See Crow running on your product.
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          No code, no signup. Try a pre-built demo in 60 seconds.
        </p>
      </div>

      <div className="mt-12 grid w-full max-w-4xl gap-4 sm:grid-cols-2">
        {templates.map((t) => (
          <Link
            key={t.id}
            href={`/processing?template=${t.id}`}
            className="group flex flex-col rounded-lg border border-gray-200 p-6 transition-colors hover:border-gray-900 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              <h2 className="text-lg font-medium text-gray-900">{t.name}</h2>
            </div>
            <p className="mt-2 text-sm text-gray-500">{t.productName}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
