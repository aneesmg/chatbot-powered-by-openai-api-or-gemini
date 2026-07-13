import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="glass w-full max-w-md animate-fade-in rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <span className="text-3xl font-bold text-gray-500">404</span>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">Page not found</h2>
        <p className="mb-6 text-sm leading-relaxed text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="glass inline-block rounded-xl px-6 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
