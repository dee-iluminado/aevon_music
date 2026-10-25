"use client";

import { useState } from "react";
import {
  ListPlus,
  ListMusic,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
} from "lucide-react";
import { toast } from "sonner";
import { Cover } from "@/components/cover";
import { FavButton } from "@/components/fav-button";
import { Slider } from "@/components/ui/slider";
import { NowPlayingSheet } from "@/components/player/now-playing-sheet";
import { QueuePanel } from "@/components/player/queue-panel";
import { LyricsPanel } from "@/components/player/lyrics-panel";
import { SleepTimer } from "@/components/player/sleep-timer";
import { usePlayer } from "@/stores/player-store";
import { useProgress } from "@/stores/progress-store";
import { formatDuration, joinArtists, cn } from "@/lib/utils";

export function PlayerBar() {
  const song = usePlayer((s) => s.queue[s.currentIndex]);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const repeat = usePlayer((s) => s.repeat);
  const shuffle = usePlayer((s) => s.shuffle);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const queueOpen = usePlayer((s) => s.queueOpen);
  const lyricsOpen = usePlayer((s) => s.lyricsOpen);

  const togglePlay = usePlayer((s) => s.togglePlay);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const setQueueOpen = usePlayer((s) => s.setQueueOpen);
  const setLyricsOpen = usePlayer((s) => s.setLyricsOpen);
  const addNext = usePlayer((s) => s.addNext);
  const seekTo = usePlayer((s) => s.seekTo);

  const current = useProgress((s) => s.current);
  const duration = useProgress((s) => s.duration);

  const [npOpen, setNpOpen] = useState(false);
  const [scrub, setScrub] = useState<number | null>(null);

  if (!song) return null;

  const effectiveVolume = muted ? 0 : volume;
  const pct = duration > 0 ? (current / duration) * 100 : 0;
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40" data-player-surface>
        <div className="relative overflow-hidden border-t border-line/80 mm-glass-dock">
          <div
            className="mm-dock-aurora pointer-events-none absolute inset-0"
            aria-hidden
          />
          <div className="relative">
            {/* thin mobile progress line */}
            <div className="h-[3px] w-full bg-white/5 lg:hidden">
              <div
                className="h-full bg-accent transition-[width] duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-3 sm:h-[76px] sm:px-6 md:gap-4">
              {/* left: track info */}
              <button
                onClick={() => setNpOpen(true)}
                className="group flex min-w-0 flex-1 items-center gap-3 text-left md:flex-none md:w-[260px]"
              >
                <Cover
                  src={song.image}
                  alt={song.title}
                  className="h-11 w-11 shrink-0 rounded-sm sm:h-12 sm:w-12"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg transition group-hover:underline">
                    {song.title}
                  </p>
                  <p className="truncate text-xs text-sub">
                    {joinArtists(song.artists, 2) || song.album}
                  </p>
                </div>
              </button>

              {/* left actions (desktop) */}
              <div className="hidden shrink-0 items-center gap-0.5 md:flex">
                <FavButton song={song} />
                <button
                  aria-label="Play next"
                  onClick={() => {
                    addNext(song);
                    toast.success("Queued next");
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sub transition hover:scale-110 hover:text-white"
                >
                  <ListPlus className="h-4.5 w-4.5" />
                </button>
              </div>

            {/* center: controls + seek (desktop) */}
            <div className="hidden flex-1 flex-col items-center gap-1 md:flex">
              <div className="flex items-center gap-4">
                <button
                  aria-label="Toggle shuffle"
                  onClick={toggleShuffle}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition",
                    shuffle ? "text-accent" : "text-zinc-500 hover:text-white"
                  )}
                >
                  <Shuffle className="h-4 w-4" />
                </button>
                <button
                  aria-label="Previous"
                  onClick={prev}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 transition hover:text-white"
                >
                  <SkipBack className="h-5 w-5 fill-current" />
                </button>
                <button
                  aria-label={isPlaying ? "Pause" : "Play"}
                  onClick={togglePlay}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-950 shadow-lg transition hover:scale-105 hover:bg-accent active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 fill-current" />
                  ) : (
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  )}
                </button>
                <button
                  aria-label="Next"
                  onClick={next}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 transition hover:text-white"
                >
                  <SkipForward className="h-5 w-5 fill-current" />
                </button>
                <button
                  aria-label="Toggle repeat"
                  onClick={cycleRepeat}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition",
                    repeat !== "off" ? "text-accent" : "text-zinc-500 hover:text-white"
                  )}
                >
                  {repeat === "one" ? (
                    <Repeat1 className="h-4 w-4" />
                  ) : (
                    <Repeat className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="flex w-full max-w-2xl items-center gap-2">
                <span className="w-10 text-right text-[11px] tabular-nums text-zinc-500">
                  {formatDuration(scrub ?? current)}
                </span>
                <Slider
                  value={scrub ?? current}
                  max={duration || 1}
                  onChange={(v) => setScrub(v)}
                  onCommit={(v) => {
                    seekTo(v);
                    setScrub(null);
                  }}
                  ariaLabel="Seek"
                />
                <span className="w-10 text-[11px] tabular-nums text-zinc-500">
                  {formatDuration(duration)}
                </span>
              </div>
            </div>

            {/* right: volume + panels (desktop) */}
            <div className="hidden shrink-0 items-center justify-end gap-1 md:flex md:w-[260px]">
              <SleepTimer />
              <button
                aria-label="Toggle lyrics"
                onClick={() => setLyricsOpen(!lyricsOpen)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition",
                  lyricsOpen ? "text-accent" : "text-zinc-500 hover:text-white"
                )}
              >
                <Music2 className="h-4.5 w-4.5" />
              </button>
              <button
                aria-label="Toggle queue"
                onClick={() => setQueueOpen(!queueOpen)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition",
                  queueOpen ? "text-accent" : "text-zinc-500 hover:text-white"
                )}
              >
                <ListMusic className="h-4.5 w-4.5" />
              </button>
              <div className="ml-1 flex items-center gap-2">
                <button
                  aria-label="Toggle mute"
                  onClick={toggleMute}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:text-white"
                >
                  <VolumeIcon className="h-4.5 w-4.5" />
                </button>
                <div className="hidden w-24 xl:block">
                  <Slider
                    value={effectiveVolume}
                    max={1}
                    onChange={(v) => setVolume(v)}
                    ariaLabel="Volume"
                    thumbClassName="opacity-100"
                  />
                </div>
              </div>
            </div>

            {/* mobile controls */}
            <div className="flex shrink-0 items-center gap-1 md:hidden">
              <button
                aria-label="Previous"
                onClick={prev}
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-200"
              >
                <SkipBack className="h-5 w-5 fill-current" />
              </button>
              <button
                aria-label={isPlaying ? "Pause" : "Play"}
                onClick={togglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                )}
              </button>
              <button
                aria-label="Next"
                onClick={next}
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-200"
              >
                <SkipForward className="h-5 w-5 fill-current" />
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>

      <NowPlayingSheet open={npOpen} onClose={() => setNpOpen(false)} />
      <QueuePanel />
      <LyricsPanel />
    </>
  );
}
