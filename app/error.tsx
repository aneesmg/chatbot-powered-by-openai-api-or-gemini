"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in rounded-2xl border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
          <span className="text-xl text-red-400">!</span>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-text-primary">Something went wrong</h2>
        <p className="mb-6 text-sm leading-relaxed text-text-secondary">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="rounded-xl border border-border bg-surface px-6 py-2 text-sm font-medium text-text-primary transition-all hover:bg-surface-hover"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
