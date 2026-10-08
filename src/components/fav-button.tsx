"use client";

import { Heart } from "lucide-react";
import { useLibrary } from "@/stores/library-store";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import type { Song } from "@/lib/types";

interface FavButtonProps {
  song: Song;
  className?: string;
  iconClassName?: string;
  showOnHover?: boolean;
}

export function FavButton({ song, className, iconClassName, showOnHover }: FavButtonProps) {
  const mounted = useMounted();
  const isFav = useLibrary((s) => s.isFavourite(song.id));
  const toggle = useLibrary((s) => s.toggleFavourite);

  const active = mounted && isFav;

  return (
    <button
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(song);
      }}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-all hover:scale-110 hover:text-zinc-100",
        showOnHover &&
          "opacity-0 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100",
        active && "text-accent opacity-100 hover:text-accent",
        className
      )}
    >
      <Heart
        className={cn("h-4.5 w-4.5", active && "fill-accent", iconClassName)}
      />
    </button>
  );
}
