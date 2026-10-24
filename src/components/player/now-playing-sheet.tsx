"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  Download,
  Heart,
  ListMusic,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Cover } from "@/components/cover";
import { LyricsView } from "@/components/player/lyrics-view";
import { Slider } from "@/components/ui/slider";
import { usePlayer } from "@/stores/player-store";
import { useProgress } from "@/stores/progress-store";
import { useLibrary } from "@/stores/library-store";
import { useMounted } from "@/hooks/use-mounted";
import { useLockBody } from "@/hooks/use-lock-body";
import { useDominantColor } from "@/hooks/use-dominant-color";
import { downloadSong } from "@/lib/download";
import { formatDuration, joinArtists } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function NowPlayingSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const song = usePlayer((s) => s.queue[s.currentIndex]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const repeat = usePlayer((s) => s.repeat);
  const shuffle = usePlayer((s) => s.shuffle);
  const autoAdd = usePlayer((s) => s.autoAddSimilar);
  const current = useProgress((s) => s.current);
  const duration = useProgress((s) => s.duration);
  const mounted = useMounted();

  const dominantColor = useDominantColor(song?.image);

  const st = usePlayer;
  const favs = useLibrary((s) => s.favourites);
  const toggleFav = useLibrary((s) => s.toggleFavourite);
  const isFav = mounted && !!song && favs.some((f) => f.id === song.id);

  const [view, setView] = useState<"player" | "lyrics">("player");
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setView("player");
  }

  useLockBody(open);

  const handleShare = async () => {
    if (!song) return;
    const url = `${window.location.origin}/song/${encodeURIComponent(song.id)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: song.title,
          text: `Listen to ${song.title} on AEVON Music`,
          url,
        });
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  return (
    <AnimatePresence>
      {open && song && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: `linear-gradient(180deg, rgb(${dominantColor}/.18) 0%, var(--color-bg) 45%)`,
          }}
          className="fixed inset-0 z-[55] flex flex-col overflow-y-auto bg-bg/98 backdrop-blur-xl"
        >
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-4">
            <div className="flex items-center justify-between">
              {view === "lyrics" ? (
                <>
                  <button
                    onClick={() => setView("player")}
                    aria-label="Back to player"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Lyrics
                  </p>
                  <button
                    onClick={onClose}
                    aria-label="Close now playing"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    aria-label="Close now playing"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <ChevronDown className="h-6 w-6" />
                  </button>
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Now Playing
                  </p>
                  <div className="w-9" />
                </>
              )}
            </div>

            {view === "lyrics" ? (
              <div className="pb-6 pt-4">
                <LyricsView song={song} />
              </div>
            ) : (
              <>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 22, stiffness: 200, delay: 0.05 }}
              className="mt-8 flex justify-center"
            >
              <Cover
                src={song.image}
                alt={song.title}
                className="aspect-square w-full max-w-[min(24rem,52vh)] rounded-2xl shadow-[0_30px_80px_-20px_rgb(var(--ember-rgb)/.25)]"
              />
            </motion.div>

            <div className="mt-8 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-xl font-bold text-white">{song.title}</p>
                <p className="mt-1 truncate text-sm text-zinc-400">
                  {joinArtists(song.artists)}
                </p>
              </div>
              <button
                aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
                onClick={() => {
                  toggleFav(song);
                  toast.success(isFav ? "Removed from favourites" : "Added to favourites");
                }}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:scale-110",
                  isFav ? "text-accent" : "text-zinc-400"
                )}
              >
                <Heart className={cn("h-5.5 w-5.5", isFav && "fill-accent")} />
              </button>
            </div>

            <div className="mt-6">
              <Slider
                value={current}
                max={duration || 1}
                onChange={(v) => st.getState().seekTo(v)}
                ariaLabel="Seek"
              />
              <div className="mt-1.5 flex justify-between text-xs tabular-nums text-zinc-500">
                <span>{formatDuration(current)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6">
              <button
                aria-label="Toggle shuffle"
                onClick={st.getState().toggleShuffle}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition",
                  shuffle ? "text-accent" : "text-zinc-400"
                )}
              >
                <Shuffle className="h-5 w-5" />
              </button>
              <button
                aria-label="Previous"
                onClick={st.getState().prev}
                className="flex h-12 w-12 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              >
                <SkipBack className="h-7 w-7 fill-current" />
              </button>
              <button
                aria-label={isPlaying ? "Pause" : "Play"}
                onClick={st.getState().togglePlay}
                style={{ boxShadow: `0 15px 40px -10px rgb(${dominantColor}/.55)` }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white transition hover:scale-105 active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="h-7 w-7 fill-current" />
                ) : (
                  <Play className="ml-1 h-7 w-7 fill-current" />
                )}
              </button>
              <button
                aria-label="Next"
                onClick={st.getState().next}
                className="flex h-12 w-12 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              >
                <SkipForward className="h-7 w-7 fill-current" />
              </button>
              <button
                aria-label="Cycle repeat"
                onClick={st.getState().cycleRepeat}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition",
                  repeat !== "off" ? "text-accent" : "text-zinc-400"
                )}
              >
                {repeat === "one" ? (
                  <Repeat1 className="h-5 w-5" />
                ) : (
                  <Repeat className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setView("lyrics")}
                className="flex flex-col items-center gap-1.5 text-zinc-400 transition hover:text-white"
              >
                <Music2 className="h-5 w-5" />
                <span className="text-[10px]">Lyrics</span>
              </button>
              <button
                onClick={() => {
                  st.getState().setQueueOpen(true);
                  onClose();
                }}
                className="flex flex-col items-center gap-1.5 text-zinc-400 transition hover:text-white"
              >
                <ListMusic className="h-5 w-5" />
                <span className="text-[10px]">Queue</span>
              </button>
              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1.5 text-zinc-400 transition hover:text-white"
              >
                <Share2 className="h-5 w-5" />
                <span className="text-[10px]">Share</span>
              </button>
              <button
                onClick={() => void downloadSong(song)}
                className="flex flex-col items-center gap-1.5 text-zinc-400 transition hover:text-white"
              >
                <Download className="h-5 w-5" />
                <span className="text-[10px]">Download</span>
              </button>
              <button
                onClick={st.getState().toggleAutoAdd}
                className={cn(
                  "flex flex-col items-center gap-1.5 transition",
                  autoAdd ? "text-accent" : "text-zinc-400 hover:text-white"
                )}
              >
                <Sparkles className="h-5 w-5" />
                <span className="text-[10px]">Similar</span>
              </button>
            </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
