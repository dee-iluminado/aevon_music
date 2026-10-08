"use client";

import Link from "next/link";
import { Heart, Play } from "lucide-react";
import { useLibrary } from "@/stores/library-store";
import { usePlayer } from "@/stores/player-store";
import { useMounted } from "@/hooks/use-mounted";

export function LikedSongsCard() {
  const mounted = useMounted();
  const favourites = useLibrary((s) => s.favourites);
  const playQueue = usePlayer((s) => s.playQueue);
  const count = mounted ? favourites.length : 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-line/70 bg-gradient-to-br from-panel-2 via-panel to-panel p-5 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(var(--ember-rgb)/.18),transparent_70%)]"
      />
      <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a1014] to-[#2a0a0d] ring-1 ring-line-2 sm:h-20 sm:w-20">
            <Heart className="h-8 w-8 fill-accent text-accent sm:h-9 sm:w-9" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sub">
              Your library
            </p>
            <h2 className="mt-1 font-heading text-2xl font-semibold text-fg sm:text-3xl">
              Liked Songs
            </h2>
            <p className="mt-1 text-sm text-sub">
              {count} {count === 1 ? "song" : "songs"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (favourites.length) playQueue(favourites);
            }}
            disabled={count === 0}
            className="inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2 text-sm font-semibold text-bg transition hover:bg-white disabled:opacity-40"
          >
            <Play className="h-4 w-4 fill-current" />
            Play
          </button>
          <Link
            href="/library"
            className="mm-glass rounded-full px-5 py-2 text-sm font-medium text-fg transition hover:text-white"
          >
            View all
          </Link>
        </div>
      </div>
    </div>
  );
}
