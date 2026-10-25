"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, X } from "lucide-react";
import { usePlayer } from "@/stores/player-store";
import { useLockBody } from "@/hooks/use-lock-body";
import { cn } from "@/lib/utils";

const MINUTES = [15, 30, 45, 60] as const;

function clockLabel(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function SleepTimer({
  variant = "icon",
  className,
}: {
  variant?: "icon" | "action";
  className?: string;
}) {
  const sleepAt = usePlayer((s) => s.sleepAt);
  const sleepMode = usePlayer((s) => s.sleepMode);
  const setSleep = usePlayer((s) => s.setSleep);
  const [open, setOpen] = useState(false);
  const [, tick] = useState(0);
  // The timer can be opened from the full-screen now-playing sheet, which has
  // a transform/backdrop-filter ancestor. A fixed overlay inside that tree is
  // positioned/clipped by the sheet, so the dialog lives in a portal on <body>.
  const [portalReady, setPortalReady] = useState(false);

  useLockBody(open);

  useEffect(() => setPortalReady(true), []);

  useEffect(() => {
    if (!sleepAt) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [sleepAt]);

  const active = sleepMode !== null;
  const remaining = sleepAt ? clockLabel(sleepAt - Date.now()) : null;

  const choose = (value: number | "track" | null) => {
    setSleep(value);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Sleep timer"
        title="Sleep timer"
        className={cn(
          variant === "action"
            ? "flex flex-col items-center gap-1.5 transition"
            : "flex h-8 items-center justify-center gap-1 rounded-full px-2 transition",
          active
            ? "text-accent"
            : "text-zinc-500 hover:text-white",
          className
        )}
      >
        <Moon className={variant === "action" ? "h-5 w-5" : "h-4.5 w-4.5"} />
        {variant === "action" ? (
          <span className="text-[10px]">
            {sleepMode === "track" ? "End track" : remaining ?? "Sleep"}
          </span>
        ) : active ? (
          <span className="text-[10px] tabular-nums">
            {sleepMode === "track" ? "End" : remaining}
          </span>
        ) : null}
      </button>

      {portalReady &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 340 }}
              className="relative w-full max-w-sm rounded-t-3xl border border-white/10 bg-[#16161a] p-5 pb-7 shadow-2xl sm:rounded-3xl sm:pb-5"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                    <Moon className="h-4.5 w-4.5 text-accent" />
                    Sleep timer
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    {active
                      ? sleepMode === "track"
                        ? "Playback stops when the current track ends."
                        : `Playback pauses in ${remaining}.`
                      : "Pause playback automatically."}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close sleep timer"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {MINUTES.map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => choose(minutes)}
                    className="rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-medium text-zinc-200 transition hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
                  >
                    {minutes} minutes
                  </button>
                ))}
                <button
                  onClick={() => choose("track")}
                  className={cn(
                    "rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-medium text-zinc-200 transition hover:border-accent/40 hover:bg-accent/10 hover:text-accent",
                    sleepMode === "track" && "border-accent/40 bg-accent/10 text-accent"
                  )}
                >
                  End of track
                </button>
                <button
                  onClick={() => choose(null)}
                  disabled={!active}
                  className="rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-medium text-zinc-200 transition hover:border-accent/40 hover:bg-accent/10 hover:text-accent disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-white/[0.03] disabled:hover:text-zinc-200"
                >
                  Off
                </button>
              </div>
            </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
