"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ListMusic,
  Pencil,
  Play,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Cover } from "@/components/cover";
import { PlayingBars } from "@/components/play-button";
import { PlaylistDialog } from "@/components/dialogs/playlist-dialog";
import { usePlayer } from "@/stores/player-store";
import { useLibrary } from "@/stores/library-store";
import { useMounted } from "@/hooks/use-mounted";
import { cn, formatDuration, joinArtists } from "@/lib/utils";

export function UserPlaylistClient() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const mounted = useMounted();
  const [editOpen, setEditOpen] = useState(false);

  const playlists = useLibrary((s) => s.playlists);
  const deletePlaylist = useLibrary((s) => s.deletePlaylist);
  const removeFromPlaylist = useLibrary((s) => s.removeFromPlaylist);
  const playQueue = usePlayer((s) => s.playQueue);
  const current = usePlayer((s) => s.queue[s.currentIndex]);
  const isPlaying = usePlayer((s) => s.isPlaying);

  if (!mounted) return null;

  const playlist = playlists.find((p) => p.id === id);

  if (!playlist) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <ListMusic className="h-10 w-10 text-zinc-600" />
        <h1 className="text-xl font-bold text-white">Playlist not found</h1>
        <Link
          href="/library"
          className="text-sm font-medium text-accent transition hover:underline"
        >
          Back to library
        </Link>
      </div>
    );
  }

  const songs = playlist.songs;
  const total = songs.reduce((a, s) => a + (s.duration || 0), 0);

  return (
    <div className="space-y-8">
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Library
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
        <div className="flex h-48 w-48 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 ring-1 ring-white/10 sm:h-56 sm:w-56">
          <ListMusic className="h-16 w-16 text-accent/70" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Playlist · {songs.length} songs
            {total > 0 ? ` · ${formatDuration(total)}` : ""}
          </p>
          <h1 className="mt-2 break-words text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="mt-3 max-w-xl text-sm text-zinc-400">
              {playlist.description}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              onClick={() => songs.length && playQueue(songs, 0)}
              disabled={!songs.length}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgb(var(--ember-rgb)/.55)] transition hover:bg-accent/90 active:scale-[.98] disabled:opacity-40"
            >
              <Play className="h-4.5 w-4.5 fill-current" />
              Play all
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={() => {
                deletePlaylist(id);
                toast.success("Playlist deleted");
              }}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-medium text-rose-400 transition hover:border-rose-500/40 hover:bg-rose-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <ListMusic className="h-8 w-8 text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-300">This playlist is empty</p>
          <p className="text-xs text-zinc-500">
            Use the “⋯” menu on any song and choose “Add to playlist”.
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {songs.map((song, i) => {
            const isCurrent = current?.id === song.id && isPlaying;
            return (
              <div
                key={`${song.id}-${i}`}
                role="button"
                tabIndex={0}
                onClick={() => playQueue(songs, i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    playQueue(songs, i);
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
                  aria-label="Remove from playlist"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromPlaylist(id, song.id);
                    toast.success("Removed from playlist");
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <PlaylistDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        playlistId={id}
        defaultName={playlist.name}
        defaultDescription={playlist.description}
      />
    </div>
  );
}
