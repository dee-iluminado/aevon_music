"use client";

import { ListMusic, Play } from "lucide-react";
import { Cover } from "@/components/cover";
import { FavButton } from "@/components/fav-button";
import { SongMenu } from "@/components/menus/song-menu";
import { PlayingBars } from "@/components/play-button";
import { downloadSong } from "@/lib/download";
import { usePlayer } from "@/stores/player-store";
import { formatDuration, joinArtists } from "@/lib/utils";
import type { Song } from "@/lib/types";

interface SongRowProps {
  song: Song;
  index: number;
  context?: Song[];
  showAlbum?: boolean;
  showIndex?: boolean;
  dense?: boolean;
}

export function SongRow({
  song,
  index,
  context,
  showAlbum = true,
  showIndex = true,
  dense = false,
}: SongRowProps) {
  const playNow = usePlayer((s) => s.playNow);
  const current = usePlayer((s) => s.queue[s.currentIndex]);
  const isCurrent = current?.id === song.id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => playNow(song, context)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          playNow(song, context);
        }
      }}
      className={`group flex cursor-pointer items-center gap-3 rounded-lg px-2 transition-colors hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none ${
        dense ? "py-1.5" : "py-2"
      }`}
    >
      <div className="relative flex w-7 shrink-0 items-center justify-center">
        {isCurrent ? (
          <span className="group-hover:hidden">
            <PlayingBars className="h-3.5" />
          </span>
        ) : (
          <span className="text-sm tabular-nums text-zinc-600 group-hover:hidden">
            {showIndex ? index + 1 : <ListMusic className="h-3.5 w-3.5" />}
          </span>
        )}
        <button
          aria-label={`Play ${song.title}`}
          onClick={(e) => {
            e.stopPropagation();
            playNow(song, context);
          }}
          className="hidden group-hover:flex group-focus-within:flex"
        >
          <Play className="h-4 w-4 fill-current text-white" />
        </button>
      </div>

      <Cover
        src={song.image}
        alt={song.title}
        className="h-10 w-10 shrink-0 rounded-lg"
      />

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            isCurrent ? "text-accent" : "text-zinc-100"
          }`}
        >
          {song.title}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {song.artists.length ? joinArtists(song.artists, 3) : song.album}
        </p>
      </div>

      {showAlbum && (
        <div className="hidden w-2/5 min-w-0 truncate text-sm text-zinc-500 md:block">
          {song.album}
        </div>
      )}

      <span className="hidden w-14 shrink-0 text-right text-sm tabular-nums text-zinc-500 sm:block">
        {formatDuration(song.duration)}
      </span><div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:opacity-0">
        <FavButton song={song} />
        <SongMenu song={song} context={context} size="sm" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            downloadSong(song);
          }}
          aria-label="Download"
          className="h-4 w-4 text-zinc-400 rounded-full p-1 transition hover:bg-white/5"
        >
          <svg
            width="1"
            height="1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="size-full"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
      </div>
</div>
  );
}
