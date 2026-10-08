"use client";

import Link from "next/link";
import { Cover } from "@/components/cover";
import { FavButton } from "@/components/fav-button";
import { SongMenu } from "@/components/menus/song-menu";
import { PlayCircle, PlayingBars } from "@/components/play-button";
import { usePlayer } from "@/stores/player-store";
import { joinArtists } from "@/lib/utils";
import type { Song } from "@/lib/types";

interface SongCardProps {
  song: Song;
  context?: Song[];
}

export function SongCard({ song, context }: SongCardProps) {
  const playNow = usePlayer((s) => s.playNow);
  const current = usePlayer((s) => s.queue[s.currentIndex]);
  const isCurrent = current?.id === song.id;

  return (
    <div className="group relative w-36 shrink-0 snap-start sm:w-44">
      <Link
        href={`/song/${song.id}`}
        className="relative block aspect-square overflow-hidden border border-line/60 bg-panel"
      >
        <Cover src={song.image} alt={song.title} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/25 to-bg/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {isCurrent && (
          <div className="absolute bottom-2 left-2 flex h-9 items-center rounded-sm bg-black/60 px-2.5 backdrop-blur">
            <PlayingBars className="h-4" />
          </div>
        )}
        <div className="absolute inset-0 flex scale-90 items-center justify-center opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
          <PlayCircle onClick={() => playNow(song, context)} />
        </div>
      </Link>
      <div className="mt-2.5 flex items-start gap-1 pr-1">
        <Link href={`/song/${song.id}`} className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg transition-colors group-hover:text-white">
            {song.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-sub">
            {song.album || joinArtists(song.artists)}
          </p>
        </Link>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <FavButton song={song} />
          <SongMenu song={song} context={context} size="sm" />
        </div>
      </div>
    </div>
  );
}
