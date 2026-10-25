"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, ListMusic, Sparkles, Trash2, X } from "lucide-react";
import { Cover } from "@/components/cover";
import { PlayingBars } from "@/components/play-button";
import { usePlayer } from "@/stores/player-store";
import { useLockBody } from "@/hooks/use-lock-body";
import { cn } from "@/lib/utils";

export function QueuePanel() {
  const open = usePlayer((s) => s.queueOpen);
  const setOpen = usePlayer((s) => s.setQueueOpen);
  const queue = usePlayer((s) => s.queue);
  const currentIndex = usePlayer((s) => s.currentIndex);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const setIndex = usePlayer((s) => s.setIndex);
  const removeAt = usePlayer((s) => s.removeAt);
  const clearQueue = usePlayer((s) => s.clearQueue);
  const autoAdd = usePlayer((s) => s.autoAddSimilar);
  const toggleAutoAdd = usePlayer((s) => s.toggleAutoAdd);
  const move = usePlayer((s) => s.move);

  const listRef = useRef<HTMLDivElement>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);

  useLockBody(open);

  // Escape closes the panel and drag state never lingers across opens.
  useEffect(() => {
    if (!open) {
      setDragFrom(null);
      setDropAt(null);
    }
  }, [open]);

  /** Returns the insertion slot (0..length) for a pointer Y coordinate. */
  const slotAt = (clientY: number) => {
    const rows = listRef.current?.querySelectorAll<HTMLElement>(
      "[data-queue-row]"
    );
    if (!rows) return 0;
    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return rows.length;
  };

  const commitDrop = () => {
    if (dragFrom !== null && dropAt !== null) {
      // `move` inserts after removal, so the slot shifts when moving down.
      const to = dropAt > dragFrom ? dropAt - 1 : dropAt;
      if (to !== dragFrom) move(dragFrom, to);
    }
    setDragFrom(null);
    setDropAt(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[50]">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-[#131317]"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                  <ListMusic className="h-4.5 w-4.5 text-accent" />
                  Queue
                  <span className="text-xs font-normal text-zinc-500">
                    {queue.length} {queue.length === 1 ? "song" : "songs"}
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close queue"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {queue.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-zinc-500">
                  <ListMusic className="h-10 w-10" />
                  <p className="text-sm">Queue is empty.</p>
                  <p className="max-w-[220px] text-xs">
                    Play a song and it will show up here. Songs play automatically in order.
                  </p>
                </div>
              ) : (
                <div ref={listRef} className="space-y-0.5">
                  {queue.map((song, i) => {
                    const active = i === currentIndex;
                    const dragging = dragFrom === i;
                    const showLine = dragFrom !== null && dropAt === i;
                    return (
                      <div key={`${song.id}-${i}`} className="relative">
                        {showLine && (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute -top-0.5 left-2 right-2 z-10 h-0.5 rounded-full bg-accent"
                          />
                        )}
                        <div
                          data-queue-row
                          onClick={() => {
                            if (dragFrom === null) setIndex(i);
                          }}
                          className={cn(
                            "group flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-white/5",
                            active && "bg-white/5",
                            dragging && "opacity-40"
                          )}
                        >
                          <button
                            type="button"
                            aria-label={`Reorder ${song.title}`}
                            title="Drag to reorder"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.currentTarget.setPointerCapture(e.pointerId);
                              setDragFrom(i);
                              setDropAt(i);
                            }}
                            onPointerMove={(e) => {
                              if (dragFrom === null) return;
                              setDropAt(slotAt(e.clientY));
                            }}
                            onPointerUp={commitDrop}
                            onPointerCancel={() => {
                              setDragFrom(null);
                              setDropAt(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "ArrowUp" && i > 0) {
                                e.preventDefault();
                                move(i, i - 1);
                              }
                              if (e.key === "ArrowDown" && i < queue.length - 1) {
                                e.preventDefault();
                                move(i, i + 1);
                              }
                            }}
                            className="flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-zinc-600 transition hover:text-white active:cursor-grabbing"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                          <div className="relative w-10 shrink-0">
                            <Cover src={song.image} alt={song.title} className="aspect-square rounded-md" />
                            {active && isPlaying && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
                                <PlayingBars className="h-3.5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "truncate text-sm font-medium",
                                active ? "text-accent" : "text-zinc-200"
                              )}
                            >
                              {song.title}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {song.artists.join(", ") || song.album}
                            </p>
                          </div>
                          <button
                            aria-label="Remove from queue"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAt(i);
                            }}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-600 opacity-0 transition hover:text-white group-hover:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {dragFrom !== null && dropAt === queue.length && (
                    <span
                      aria-hidden
                      className="mx-2 block h-0.5 rounded-full bg-accent"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-white/5 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Sparkles
                    className={cn(
                      "mt-0.5 h-4 w-4",
                      autoAdd ? "text-accent" : "text-zinc-500"
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      Auto-add similar songs
                    </p>
                    <p className="text-xs text-zinc-500">
                      Automatically keep the queue rolling with similar tracks
                    </p>
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={autoAdd}
                  onClick={toggleAutoAdd}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    autoAdd ? "bg-accent" : "bg-white/15"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                      autoAdd ? "left-[22px]" : "left-0.5"
                    )}
                  />
                </button>
              </div>
              <button
                onClick={clearQueue}
                className="mt-3 w-full rounded-full border border-white/10 py-2 text-xs font-medium text-zinc-400 transition hover:border-white/25 hover:text-white"
              >
                Clear queue
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
