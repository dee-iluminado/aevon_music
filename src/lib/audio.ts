import type { Song } from "@/lib/types";

let el: HTMLAudioElement | null = null;

export function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!el) {
    el = new Audio();
    el.preload = "auto";
    el.crossOrigin = "anonymous";
  }
  return el;
}

export function mediaSrc(song: Song): string {
  return song.mediaUrl || song.previewUrl || "";
}

export function proxiedSrc(url: string): string {
  return `/api/stream?url=${encodeURIComponent(url)}`;
}
