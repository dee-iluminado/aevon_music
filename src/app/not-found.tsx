import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-28 text-center">
      <p className="text-5xl">🎧</p>
      <h1 className="font-heading text-2xl font-semibold text-fg">
        404 — Page not found
      </h1>
      <p className="max-w-sm text-sm text-zinc-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
      >
        Back to home
      </Link>
    </div>
  );
}
