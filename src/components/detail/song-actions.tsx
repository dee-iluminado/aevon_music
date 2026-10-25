"use client";

import { Download, Heart } from "lucide-react";
import { SongMenu } from "@/components/menus/song-menu";
import { ShareButton } from "@/components/share-button";
import { useLibrary } from "@/stores/library-store";
import { useMounted } from "@/hooks/use-mounted";
import { downloadSong } from "@/lib/download";
import { cn, joinArtists } from "@/lib/utils";
import type { Song } from "@/lib/types";

interface SongActionsProps {
  song: Song;
  context?: Song[];
}

const pill =
  "inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/5 active:scale-[.98]";

export function SongActions({ song, context }: SongActionsProps) {
  const mounted = useMounted();
  const isFav = useLibrary((s) => s.isFavourite(song.id));
  const toggle = useLibrary((s) => s.toggleFavourite);

  const active = mounted && isFav;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => toggle(song)}
        className={cn(
          pill,
          active &&
            "border-accent/40 bg-accent/10 text-accent hover:border-accent/60 hover:bg-accent/15"
        )}
        aria-pressed={active}
      >
        <Heart className={cn("h-4.5 w-4.5", active && "fill-accent")} />
        {active ? "Liked" : "Like"}
      </button>
      <button onClick={() => void downloadSong(song)} className={pill}>
        <Download className="h-4.5 w-4.5" />
        Download
      </button>
      <ShareButton
        path={`/song/${song.id}`}
        title={`${song.title} — ${joinArtists(song.artists)}`}
        text={`Listen to ${song.title} on AEVON Music`}
        label="Share"
        className={pill}
      />
      <SongMenu song={song} context={context} size="md" className="h-10 w-10 rounded-full border border-white/15 text-zinc-200 transition hover:border-white/30 hover:bg-white/5" />
    </div>
  );
}
