import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Ready to add Crow to your product?
        </h1>
        <p className="mt-4 text-gray-600">
          Book a 20-minute integration call with our team. We'll show you how
          to deploy a Crow agent in under a week.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <a
            href="mailto:founders@usecrow.ai?subject=Integration%20call%20request"
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Book a 20-minute call
          </a>
          <Link
            href="/"
            className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400"
          >
            Back to sandbox
          </Link>
        </div>
      </div>
    </div>
  );
}
