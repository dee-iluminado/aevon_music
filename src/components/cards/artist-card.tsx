"use client";

import Link from "next/link";
import { Cover } from "@/components/cover";
import type { ArtistInfo } from "@/lib/types";

export function ArtistCard({ artist }: { artist: ArtistInfo }) {
  return (
    <Link
      href={`/artist/${artist.id}`}
      className="group block w-32 shrink-0 snap-start sm:w-40"
    >
      <div className="relative aspect-square overflow-hidden rounded-full border border-line/60 bg-panel">
        <Cover src={artist.image} alt={artist.name} className="absolute inset-0" />
        <div className="absolute inset-0 rounded-full bg-black/0 transition-colors duration-200 group-hover:bg-black/30" />
      </div>
      <div className="mt-2.5 pr-1 text-center">
        <p className="truncate text-sm font-medium text-fg group-hover:text-white">
          {artist.name}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sub">
          Artist
        </p>
      </div>
    </Link>
  );
}
