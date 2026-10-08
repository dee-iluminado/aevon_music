"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Music2, X } from "lucide-react";
import { usePlayer } from "@/stores/player-store";
import { useLockBody } from "@/hooks/use-lock-body";
import { LyricsView } from "@/components/player/lyrics-view";

export function LyricsPanel() {
  const open = usePlayer((s) => s.lyricsOpen);
  const setOpen = usePlayer((s) => s.setLyricsOpen);
  const song = usePlayer((s) => s.queue[s.currentIndex]);

  useLockBody(open);

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
              <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                <Music2 className="h-4.5 w-4.5 text-accent" />
                Lyrics
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close lyrics"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <LyricsView song={song} />
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
