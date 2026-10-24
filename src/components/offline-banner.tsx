"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return !navigator.onLine;
}

function getServerSnapshot() {
  return false;
}

export function OfflineBanner() {
  const offline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-center gap-2 bg-amber-500/90 px-4 py-2 text-sm font-medium text-zinc-900 backdrop-blur-sm"
        >
          <WifiOff className="h-4 w-4" />
          {"You're offline — downloads still available"}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
