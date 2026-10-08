"use client";

import { Pause, Play, Shuffle } from "lucide-react";
import { usePlayer } from "@/stores/player-store";
import { cn } from "@/lib/utils";
import type { Song } from "@/lib/types";

interface PlayAllProps {
  songs: Song[];
  label?: string;
  variant?: "play" | "shuffle";
  className?: string;
}

export function PlayAll({ songs, label, variant = "play", className }: PlayAllProps) {
  const playQueue = usePlayer((s) => s.playQueue);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const queue = usePlayer((s) => s.queue);
  const current = usePlayer((s) => s.queue[s.currentIndex]);
  const isPlaying = usePlayer((s) => s.isPlaying);

  const sameContext =
    queue.length === songs.length &&
    songs.length > 0 &&
    queue.some((q) => q.id === songs[0].id);

  const handleClick = () => {
    if (!songs.length) return;
    if (sameContext) {
      togglePlay();
      return;
    }
    if (variant === "shuffle") {
      const copy = [...songs];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      playQueue(copy, 0);
      return;
    }
    playQueue(songs, 0);
  };

  const isCurrentContextPlaying = sameContext && isPlaying && current;

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-accent font-semibold text-white shadow-[0_10px_30px_-8px_rgb(var(--ember-rgb)/.55)] transition hover:bg-accent/90 active:scale-[.98]",
        label ? "h-11 px-6 text-sm" : "h-11 w-11 justify-center",
        className
      )}
    >
      {isCurrentContextPlaying ? (
        <Pause className="h-5 w-5 fill-current" />
      ) : variant === "shuffle" ? (
        <Shuffle className="h-5 w-5" />
      ) : (
        <Play className="ml-0.5 h-5 w-5 fill-current" />
      )}
      {label}
    </button>
  );
}
