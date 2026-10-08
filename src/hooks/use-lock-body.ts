"use client";

import { useEffect } from "react";

let openOverlays = 0;

/** True while any modal overlay (dialog, sheet, panel) is open. */
export function isOverlayOpen(): boolean {
  return openOverlays > 0;
}

export function useLockBody(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    openOverlays += 1;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      openOverlays = Math.max(0, openOverlays - 1);
      document.body.style.overflow = openOverlays > 0 ? "hidden" : original;
    };
  }, [locked]);
}