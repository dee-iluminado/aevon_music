"use client";

import Link from "next/link";
import { Disc3, Play } from "lucide-react";
import { Cover } from "@/components/cover";
import { cn } from "@/lib/utils";
import type { Album } from "@/lib/types";

export function AlbumCard({ album }: { album: Album }) {
  return (
    <Link
      href={`/album/${album.id}`}
      className="group block w-36 shrink-0 snap-start sm:w-44"
    >
      <div className="relative aspect-square overflow-hidden border border-line/60 bg-panel">
        <Cover src={album.image} alt={album.name} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/25 to-bg/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="inline-flex h-12 w-12 scale-90 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </div>
      </div>
      <div className="mt-2.5 space-y-0.5 pr-1">
        <p className="truncate text-sm font-medium text-fg group-hover:text-white">
          {album.name}
        </p>
        <p className="flex items-center gap-1 truncate text-xs text-sub">
          <Disc3 className="h-3 w-3 shrink-0" />
          {album.songCount ? `${album.songCount} songs` : "Album"}
          {album.year ? ` · ${album.year}` : ""}
        </p>
      </div>
    </Link>
  );
}

export function AlbumCardGrid({ album, className }: { album: Album; className?: string }) {
  return (
    <Link
      href={`/album/${album.id}`}
      className={cn(
        "group flex w-full items-center gap-3 rounded-sm p-2 transition hover:bg-fg/5",
        className
      )}
    >
      <Cover
        src={album.image}
        alt={album.name}
        className="h-12 w-12 shrink-0 rounded-sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{album.name}</p>
        <p className="truncate text-xs text-sub">{album.artists.join(", ")}</p>
      </div>
    </Link>
  );
}
