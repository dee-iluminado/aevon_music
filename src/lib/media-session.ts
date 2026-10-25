import type { Song } from "@/lib/types";
import { getAudio } from "@/lib/audio";
import { usePlayer } from "@/stores/player-store";

/**
 * OS-level playback integration (lock screen, notification shade, headset
 * buttons, car displays, media keys). Everything is feature-detected so older
 * browsers simply keep working.
 */

const ARTWORK_SIZES = new Set([
  "50x50",
  "150x150",
  "96x96",
  "128x128",
  "192x192",
  "256x256",
  "384x384",
  "500x500",
  "512x512",
]);

function artworkFor(song: Song) {
  const map = song.imageSizes ?? {};
  const list = Object.entries(map)
    .filter(([size, url]) => !!url && ARTWORK_SIZES.has(size))
    .map(([size, url]) => ({ src: url, sizes: size, type: "image/png" }));

  if (!list.length && song.image) {
    list.push({ src: song.image, sizes: "500x500", type: "image/png" });
  }
  return list;
}

function supported() {
  return (
    typeof navigator !== "undefined" &&
    "mediaSession" in navigator &&
    typeof MediaMetadata !== "undefined"
  );
}

export function updateMediaMetadata(song?: Song) {
  if (!supported()) return;
  if (!song) {
    navigator.mediaSession.metadata = null;
    return;
  }
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title || "AEVON Music",
      artist: song.artists.join(", ") || "AEVON Music",
      album: song.album || "AEVON Music",
      artwork: artworkFor(song),
    });
  } catch {
    /* metadata is a nice-to-have, never break playback for it */
  }
}

export function syncPlaybackState(isPlaying: boolean) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  } catch {
    /* ignore */
  }
}

let lastPositionSync = 0;

export function syncPlaybackPosition(current: number, duration: number) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  if (!Number.isFinite(duration) || duration <= 0) return;

  const now = Date.now();
  if (now - lastPositionSync < 1000) return;
  lastPositionSync = now;

  const position = Math.min(Math.max(current, 0), duration);
  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: 1,
      position,
    });
  } catch {
    /* ignore */
  }
}

export function initMediaSession() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
    return () => {};
  }

  const session = navigator.mediaSession;
  const audio = getAudio();

  const handlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
    ["play", () => usePlayer.getState().setPlaying(true)],
    ["pause", () => usePlayer.getState().setPlaying(false)],
    ["previoustrack", () => usePlayer.getState().prev()],
    ["nexttrack", () => usePlayer.getState().next()],
    ["stop", () => {
      usePlayer.getState().setPlaying(false);
      if (audio) audio.currentTime = 0;
    }],
    ["seekbackward", (details) => {
      if (!audio) return;
      audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset ?? 10));
    }],
    ["seekforward", (details) => {
      if (!audio) return;
      audio.currentTime = audio.currentTime + (details.seekOffset ?? 10);
    }],
    ["seekto", (details) => {
      if (!audio || details.seekTime === undefined) return;
      audio.currentTime = details.seekTime;
    }],
  ];

  for (const [action, handler] of handlers) {
    try {
      session.setActionHandler(action, handler);
    } catch {
      /* action not supported by this browser */
    }
  }

  return () => {
    for (const [action] of handlers) {
      try {
        session.setActionHandler(action, null);
      } catch {
        /* ignore */
      }
    }
  };
}
