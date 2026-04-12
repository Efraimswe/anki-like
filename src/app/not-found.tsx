import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg-page) p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-(--color-accent) heading">404</h1>
        <p className="mt-4 text-lg text-(--color-text-secondary)">Page not found</p>
        <Link href="/decks" className="inline-block mt-6 button-primary px-8 py-3">
          Go Home
        </Link>
      </div>
    </div>
  );
}
