"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Disc3,
  Download,
  ExternalLink,
  Heart,
  ListMusic,
  ListPlus,
  MoreHorizontal,
  Play,
  Plus,
  Share2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Cover } from "@/components/cover";
import { PlaylistDialog } from "@/components/dialogs/playlist-dialog";
import { usePlayer } from "@/stores/player-store";
import { useLibrary } from "@/stores/library-store";
import { useLockBody } from "@/hooks/use-lock-body";
import { useMounted } from "@/hooks/use-mounted";
import { downloadSong } from "@/lib/download";
import { shareLink } from "@/lib/share";
import { joinArtists } from "@/lib/utils";
import type { Song } from "@/lib/types";

interface SongMenuProps {
  song: Song;
  context?: Song[];
  size?: "sm" | "md";
  className?: string;
}

export function SongMenu({ song, context, size = "md", className }: SongMenuProps) {
  const [open, setOpen] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const mounted = useMounted();

  const playNow = usePlayer((s) => s.playNow);
  const addNext = usePlayer((s) => s.addNext);
  const addToQueue = usePlayer((s) => s.addToQueue);
  const playlists = useLibrary((s) => s.playlists);
  const favourites = useLibrary((s) => s.favourites);
  const toggleFavourite = useLibrary((s) => s.toggleFavourite);
  const addToPlaylist = useLibrary((s) => s.addToPlaylist);

  const isFav = mounted && favourites.some((s) => s.id === song.id);
  useLockBody(open);

  const close = () => {
    setOpen(false);
    setShowPlaylists(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const itemClass =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/8 hover:text-white";

  return (
    <>
      <button
        aria-label="More options"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className={
          className ??
          `flex items-center justify-center rounded-full text-zinc-400 transition hover:text-white ${
            size === "sm" ? "h-7 w-7" : "h-8 w-8"
          }`
        }
      >
        <MoreHorizontal className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 340 }}
              className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-[#16161a] p-3 pb-6 shadow-2xl"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15" />
              <div className="flex items-start gap-3 px-2 pb-3 pt-1">
                <Cover src={song.image} alt={song.title} className="h-14 w-14 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 pr-8">
                  <p className="truncate text-sm font-semibold text-white">{song.title}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {song.album} · {joinArtists(song.artists)}
                  </p>
                </div>
                <button
                  onClick={close}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {showPlaylists ? (
                <div className="mt-1 px-2">
                  <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Add to playlist
                  </p>
                  <div className="max-h-56 overflow-y-auto">
                    {playlists.length === 0 && (
                      <p className="px-3 py-3 text-sm text-zinc-500">
                        No playlists yet — create one below.
                      </p>
                    )}
                    {playlists.map((p) => {
                      const added = p.songs.some((s) => s.id === song.id);
                      return (
                        <button
                          key={p.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!added) {
                              addToPlaylist(p.id, song);
                              toast.success(`Added to "${p.name}"`);
                            }
                            close();
                          }}
                          className={`${itemClass} justify-between`}
                        >
                          <span className="truncate">{p.name}</span>
                          {added && <span className="text-[10px] text-accent">Added</span>}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDialogOpen(true);
                    }}
                    className={`${itemClass} text-accent`}
                  >
                    <Plus className="h-4.5 w-4.5" />
                    Create new playlist
                  </button>
                </div>
              ) : (
                <div className="mt-1 px-2">
                  <button
                    onClick={() => {
                      playNow(song, context);
                      close();
                    }}
                    className={itemClass}
                  >
                    <Play className="h-4.5 w-4.5" /> Play now
                  </button>
                  <button
                    onClick={() => {
                      addNext(song);
                      toast.success("Added to play next");
                      close();
                    }}
                    className={itemClass}
                  >
                    <ListPlus className="h-4.5 w-4.5" /> Play next
                  </button>
                  <button
                    onClick={() => {
                      addToQueue(song);
                      toast.success("Added to queue");
                      close();
                    }}
                    className={itemClass}
                  >
                    <ListMusic className="h-4.5 w-4.5" /> Add to queue
                  </button>
                  <button
                    onClick={() => {
                      toggleFavourite(song);
                      toast.success(
                        isFav ? "Removed from favourites" : "Added to favourites"
                      );
                      close();
                    }}
                    className={itemClass}
                  >
                    <Heart
                      className={`h-4.5 w-4.5 ${
                        isFav ? "fill-accent text-accent" : ""
                      }`}
                    />
                    {isFav ? "Remove from favourites" : "Add to favourites"}
                  </button>
                  <button
                    onClick={() => setShowPlaylists(true)}
                    className={itemClass}
                  >
                    <Plus className="h-4.5 w-4.5" /> Add to playlist
                  </button>
                  <button
                    onClick={() => {
                      void downloadSong(song);
                      close();
                    }}
                    className={itemClass}
                  >
                    <Download className="h-4.5 w-4.5" /> Download
                  </button>
                  <button
                    onClick={() => {
                      void shareLink({
                        title: `${song.title} — ${joinArtists(song.artists)}`,
                        text: `Listen to ${song.title} on AEVON Music`,
                        url: `/song/${song.id}`,
                      });
                      close();
                    }}
                    className={itemClass}
                  >
                    <Share2 className="h-4.5 w-4.5" /> Share song
                  </button>
                  <div className="my-1 h-px bg-white/8" />
                  <Link
                    href={`/song/${song.id}`}
                    onClick={close}
                    className={itemClass}
                  >
                    <ExternalLink className="h-4.5 w-4.5" /> View song details
                  </Link>
                  {song.albumId && (
                    <Link
                      href={`/album/${song.albumId}`}
                      onClick={close}
                      className={itemClass}
                    >
                      <Disc3 className="h-4.5 w-4.5" /> View album
                    </Link>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PlaylistDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setShowPlaylists(true);
        }}
      />
    </>
  );
}
