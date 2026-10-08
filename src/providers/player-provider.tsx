"use client";

import { useEffect, type ReactNode } from "react";
import { ensureQueueBacklog, markProxyUsed, usePlayer } from "@/stores/player-store";
import { useProgress } from "@/stores/progress-store";
import { useLibrary } from "@/stores/library-store";
import { isOverlayOpen } from "@/hooks/use-lock-body";
import { getAudio, mediaSrc, proxiedSrc } from "@/lib/audio";

export function PlayerProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;

    const handlePlay = () => usePlayer.setState({ isPlaying: true });
    const handlePause = () => usePlayer.setState({ isPlaying: false });

    const handleTimeUpdate = () => {
      const { duration } = useProgress.getState();
      const b =
        audio.buffered.length > 0
          ? audio.buffered.end(audio.buffered.length - 1)
          : 0;
      const d = isFinite(audio.duration) ? audio.duration : duration;
      useProgress.getState().setProgress(audio.currentTime, d, b);
    };

    const handleLoadedMetadata = () => {
      useProgress.getState().setProgress(0, isFinite(audio.duration) ? audio.duration : 0, 0);
    };

    const handleEnded = () => {
      usePlayer.getState().handleEnded();
    };

    const handlePlaying = () => {
      void ensureQueueBacklog();
    };

    const handleError = () => {
      const st = usePlayer.getState();
      const song = st.queue[st.currentIndex];
      if (!song) return;
      const src = mediaSrc(song);
      if (!src) return;
      if (st.usedProxyFor !== song.id) {
        markProxyUsed(song.id);
        audio.src = proxiedSrc(src);
        audio.play().catch(() => usePlayer.setState({ isPlaying: false }));
      } else {
        usePlayer.setState({ isPlaying: false });
      }
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable;

      // Never steal keys while a dialog/sheet/panel is open or the user is typing.
      if (isOverlayOpen()) return;

      if (e.code === "Space") {
        if (typing || target?.closest("button,a,audio,video,label")) return;
        e.preventDefault();
        usePlayer.getState().togglePlay();
        return;
      }
      if (typing) return;

      // Arrow keys only drive the player when the player itself has focus, so
      // they keep working for normal page scrolling and slider seeking.
      const inSlider = !!target?.closest('input[type="range"]');
      const playerFocused = !!target?.closest("[data-player-surface]");
      if (inSlider) return;

      const st = usePlayer.getState();
      switch (e.code) {
        case "ArrowRight":
          if (!playerFocused) return;
          e.preventDefault();
          st.next();
          break;
        case "ArrowLeft":
          if (!playerFocused) return;
          e.preventDefault();
          st.prev();
          break;
        case "ArrowUp":
          if (!playerFocused) return;
          e.preventDefault();
          st.setVolume(Math.min(1, st.volume + 0.05));
          break;
        case "ArrowDown":
          if (!playerFocused) return;
          e.preventDefault();
          st.setVolume(Math.max(0, st.volume - 0.05));
          break;
        case "KeyM":
          if (e.shiftKey) return;
          st.toggleMute();
          break;
        case "KeyL":
          if (e.shiftKey) return;
          st.setLyricsOpen(!st.lyricsOpen);
          break;
        case "KeyQ":
          if (e.shiftKey) return;
          st.setQueueOpen(!st.queueOpen);
          break;
        case "KeyA":
          if (e.shiftKey) return;
          st.toggleAutoAdd();
          break;
        case "KeyF":
          if (e.shiftKey) return;
          {
            const song = st.queue[st.currentIndex];
            if (song) useLibrary.getState().toggleFavourite(song);
          }
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return <>{children}</>;
}
