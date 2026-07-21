import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in rounded-2xl border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <span className="text-3xl font-bold text-text-muted">404</span>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-text-primary">Page not found</h2>
        <p className="mb-6 text-sm leading-relaxed text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl border border-border bg-surface px-6 py-2 text-sm font-medium text-text-primary transition-all hover:bg-surface-hover"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
