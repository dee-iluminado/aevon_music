"use client";

import { useEffect, useState } from "react";

/**
 * True once the component has mounted in the browser.
 *
 * Used to keep the server-rendered markup (which cannot see localStorage)
 * identical to the first client render, then swap in the saved library on the
 * next paint. This deliberately uses a plain effect instead of
 * requestAnimationFrame: rAF is paused in background/occluded tabs, which left
 * pages stuck on their empty state until the tab was focused again.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
