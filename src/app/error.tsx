'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg-page) p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-(--color-danger) heading">Something went wrong</h1>
        <p className="mt-4 text-sm text-(--color-text-secondary)">{error.message}</p>
        <button onClick={reset} className="mt-6 button-primary px-8 py-3">
          Try Again
        </button>
      </div>
    </div>
  );
}
