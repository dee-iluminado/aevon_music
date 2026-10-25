"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ensureQueueBacklog,
  markProxyUsed,
  restoreSession,
  usePlayer,
} from "@/stores/player-store";
import { useProgress } from "@/stores/progress-store";
import { useLibrary } from "@/stores/library-store";
import { isOverlayOpen } from "@/hooks/use-lock-body";
import { getAudio, mediaSrc, proxiedSrc } from "@/lib/audio";
import {
  initMediaSession,
  syncPlaybackPosition,
  syncPlaybackState,
  updateMediaMetadata,
} from "@/lib/media-session";

const SAVE_EVERY_MS = 5000;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const sleepAt = usePlayer((s) => s.sleepAt);
  const persistedAtRef = useRef(0);

  // Restore the previous session (queue + playhead) and wire OS media controls.
  useEffect(() => {
    restoreSession();

    const initial = usePlayer.getState();
    updateMediaMetadata(initial.queue[initial.currentIndex]);
    syncPlaybackState(initial.isPlaying);

    const unsubscribeSession = initMediaSession();

    return unsubscribeSession;
  }, []);

  // Keep the OS media metadata in sync with the current track.
  useEffect(() => {
    return usePlayer.subscribe((state, prev) => {
      const song = state.queue[state.currentIndex];
      const prevSong = prev.queue[prev.currentIndex];
      if (song?.id !== prevSong?.id) {
        updateMediaMetadata(song);
      }
      if (state.isPlaying !== prev.isPlaying) {
        syncPlaybackState(state.isPlaying);
      }
    });
  }, []);

  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;

    const persistPosition = () => {
      const st = usePlayer.getState();
      const song = st.queue[st.currentIndex];
      if (!song || !Number.isFinite(audio.currentTime)) return;
      usePlayer.setState({
        position: audio.currentTime,
        positionId: song.id,
      });
    };

    const handlePlay = () => usePlayer.setState({ isPlaying: true });
    const handlePause = () => {
      usePlayer.setState({ isPlaying: false });
      persistPosition();
    };

    const handleTimeUpdate = () => {
      const { duration } = useProgress.getState();
      const b =
        audio.buffered.length > 0
          ? audio.buffered.end(audio.buffered.length - 1)
          : 0;
      const d = isFinite(audio.duration) ? audio.duration : duration;
      useProgress.getState().setProgress(audio.currentTime, d, b);
      syncPlaybackPosition(audio.currentTime, d);

      const now = Date.now();
      if (now - persistedAtRef.current > SAVE_EVERY_MS) {
        persistedAtRef.current = now;
        persistPosition();
      }
    };

    const handleLoadedMetadata = () => {
      const d = isFinite(audio.duration) ? audio.duration : 0;
      const st = usePlayer.getState();
      const song = st.queue[st.currentIndex];
      const canResume =
        !st.isPlaying &&
        song &&
        st.positionId === song.id &&
        st.position > 1 &&
        d > 0;

      if (canResume) {
        audio.currentTime = Math.min(st.position, Math.max(d - 1, 0));
        useProgress.getState().setProgress(audio.currentTime, d, 0);
      } else {
        useProgress.getState().setProgress(0, d, 0);
      }
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

    const handlePageHide = () => persistPosition();

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleError);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  // Sleep timer: pause when the clock runs out.
  useEffect(() => {
    if (!sleepAt) return;
    const id = window.setInterval(() => {
      if (Date.now() < sleepAt) return;
      window.clearInterval(id);
      const st = usePlayer.getState();
      st.setPlaying(false);
      st.setSleep(null);
      toast("Sleep timer ended", { icon: "🌙" });
    }, 1000);
    return () => window.clearInterval(id);
  }, [sleepAt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target =
        e.target instanceof HTMLElement ? e.target : null;
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
