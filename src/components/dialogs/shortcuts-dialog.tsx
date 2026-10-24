"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { key: "Space", description: "Play / Pause" },
  { key: "← / →", description: "Previous / Next track" },
  { key: "↑ / ↓", description: "Volume up / down" },
  { key: "M", description: "Toggle mute" },
  { key: "L", description: "Toggle lyrics" },
  { key: "Q", description: "Toggle queue" },
  { key: "A", description: "Toggle auto-add similar" },
  { key: "F", description: "Favourite current track" },
  { key: "?", description: "Show this shortcut list" },
  { key: "Ctrl + K", description: "Focus search" },
];

export function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1f] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4.5 w-4.5 text-accent" />
                <h2 className="text-base font-semibold text-white">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close shortcuts dialog"
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {SHORTCUTS.map(({ key, description }) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg px-2 py-2 transition hover:bg-white/5"
                >
                  <span className="text-sm text-zinc-300">{description}</span>
                  <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-mono text-zinc-300">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-[11px] text-zinc-600">
              Arrow key shortcuts require player focus
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
