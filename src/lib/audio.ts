import type { Song } from "@/lib/types";

let el: HTMLAudioElement | null = null;

export function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!el) {
    el = new Audio();
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    el.setAttribute("playsinline", "");
    // Keeping the element in the document (invisibly) makes OS media controls
    // and background playback behave consistently, especially on iOS.
    el.setAttribute("aria-hidden", "true");
    el.style.position = "fixed";
    el.style.width = "0";
    el.style.height = "0";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    document.body.appendChild(el);
  }
  return el;
}

export function mediaSrc(song: Song): string {
  return song.mediaUrl || song.previewUrl || "";
}

export function proxiedSrc(url: string): string {
  return `/api/stream?url=${encodeURIComponent(url)}`;
}
