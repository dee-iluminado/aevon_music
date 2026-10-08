"use client";

import Link from "next/link";
import { Download, Trash2 } from "lucide-react";
import { Cover } from "@/components/cover";
import { PlayingBars } from "@/components/play-button";
import { useLibrary } from "@/stores/library-store";
import { usePlayer } from "@/stores/player-store";
import { useMounted } from "@/hooks/use-mounted";
import { cn, formatDuration, joinArtists } from "@/lib/utils";

export function DownloadsClient() {
  const mounted = useMounted();
  const downloads = useLibrary((s) => s.downloads);
  const removeDownload = useLibrary((s) => s.removeDownload);
  const playQueue = usePlayer((s) => s.playQueue);
  const current = usePlayer((s) => s.queue[s.currentIndex]);
  const isPlaying = usePlayer((s) => s.isPlaying);

  if (!mounted) return null;

  const total = downloads.reduce((a, s) => a + (s.duration || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-fg sm:text-3xl">
            Downloads
          </h1>
          <p className="mt-1 text-sm text-sub">
            {downloads.length} songs saved on this device
            {total > 0 ? ` · ${formatDuration(total)}` : ""}
          </p>
        </div>
      </div>

      {downloads.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-20 text-center">
          <Download className="h-10 w-10 text-zinc-600" />
          <p className="mt-1 text-sm font-semibold text-zinc-300">
            Nothing downloaded yet
          </p>
          <p className="max-w-xs text-xs text-zinc-500">
            Use the Download button on any song to save high-quality audio here.
          </p>
          <Link
            href="/"
            className="mt-3 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            Find music
          </Link>
        </div>
      ) : (
        <div className="space-y-0.5">
          {downloads.map((song, i) => {
            const isCurrent = current?.id === song.id && isPlaying;
            return (
              <div
                key={song.id}
                role="button"
                tabIndex={0}
                onClick={() => playQueue(downloads, i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    playQueue(downloads, i);
                  }
                }}
                className="group flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/5"
              >
                <div className="flex w-7 shrink-0 items-center justify-center">
                  {isCurrent ? (
                    <PlayingBars className="h-3.5" />
                  ) : (
                    <span className="text-sm tabular-nums text-zinc-600">
                      {i + 1}
                    </span>
                  )}
                </div>
                <Cover
                  src={song.image}
                  alt={song.title}
                  className="h-10 w-10 shrink-0 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      isCurrent ? "text-accent" : "text-zinc-100"
                    )}
                  >
                    {song.title}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {joinArtists(song.artists) || song.album}
                  </p>
                </div>
                <span className="hidden w-14 shrink-0 text-right text-sm tabular-nums text-zinc-500 sm:block">
                  {formatDuration(song.duration)}
                </span>
                <button
                  aria-label="Remove download"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDownload(song.id);
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
