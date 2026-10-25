"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-28 text-center">
      <p className="text-5xl">🎵</p>
      <h1 className="font-heading text-2xl font-semibold text-fg">
        Something went wrong
      </h1>
      <p className="max-w-sm text-sm text-zinc-500">
        This page hit an unexpected error. Trying again usually fixes it.
      </p>
      {error.digest ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sub/60">
          Ref {error.digest}
        </p>
      ) : null}
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-line/70 px-6 py-3 text-sm font-semibold text-sub transition hover:text-fg"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
