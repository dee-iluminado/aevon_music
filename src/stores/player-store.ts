import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Song } from "@/lib/types";
import { withoutBlocked } from "@/lib/content-filter";
import { getAudio, mediaSrc, proxiedSrc } from "@/lib/audio";
import { useProgress } from "@/stores/progress-store";
import { useLibrary } from "@/stores/library-store";

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  repeat: RepeatMode;
  shuffle: boolean;
  volume: number;
  muted: boolean;
  autoAddSimilar: boolean;
  queueOpen: boolean;
  lyricsOpen: boolean;
  usedProxyFor: string;
  /** Last known playhead position, used to resume after a reload. */
  position: number;
  positionId: string;
  /** Sleep timer: absolute timestamp for "in N minutes", null otherwise. */
  sleepAt: number | null;
  sleepMode: "time" | "track" | null;
  setSleep: (minutes: number | "track" | null) => void;

  playQueue: (songs: Song[], startIndex?: number) => void;
  playNow: (song: Song, context?: Song[]) => void;
  setPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  handleEnded: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  toggleAutoAdd: () => void;
  setQueueOpen: (open: boolean) => void;
  setLyricsOpen: (open: boolean) => void;
  addNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
  removeAt: (index: number) => void;
  move: (from: number, to: number) => void;
  clearQueue: () => void;
  setIndex: (index: number) => void;
}

function loadCurrent(autoplay = true) {
  const audio = getAudio();
  const state = usePlayer.getState();
  const song = state.queue[state.currentIndex];
  if (!audio) return;
  const src = song ? mediaSrc(song) : "";
  if (!src) {
    // Nothing playable — stop instead of leaving the previous track running.
    audio.pause();
    audio.removeAttribute("src");
    usePlayer.setState({ isPlaying: false });
    useProgress.getState().resetProgress();
    return;
  }
  if (song && state.positionId !== song.id) {
    // New track: forget the previous playhead so we start from zero.
    usePlayer.setState({ position: 0, positionId: song.id });
  }
  audio.src =
    usePlayer.getState().usedProxyFor === song.id
      ? proxiedSrc(src)
      : src;
  audio.preload = autoplay ? "auto" : "metadata";
  audio.volume = usePlayer.getState().muted ? 0 : usePlayer.getState().volume;
  if (autoplay && song) {
    const library = useLibrary.getState();
    library.pushRecent(song);
    library.bumpPlay(song.id);
  }
  if (!autoplay) {
    audio.pause();
    return;
  }
  const p = audio.play();
  if (p) p.catch(() => usePlayer.setState({ isPlaying: false }));
}

function suggestIndex(songs: Song[], currentId?: string): number {
  if (!currentId) return 0;
  const i = songs.findIndex((s) => s.id === currentId);
  return i >= 0 ? i : 0;
}

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      repeat: "off",
      shuffle: false,
      volume: 0.8,
      muted: false,
      autoAddSimilar: false,
      queueOpen: false,
      lyricsOpen: false,
      usedProxyFor: "",
      position: 0,
      positionId: "",
      sleepAt: null,
      sleepMode: null,

      setSleep: (minutes) => {
        if (minutes === null) {
          set({ sleepAt: null, sleepMode: null });
          return;
        }
        if (minutes === "track") {
          set({ sleepAt: null, sleepMode: "track" });
          return;
        }
        set({
          sleepAt: Date.now() + minutes * 60_000,
          sleepMode: "time",
        });
      },

  playQueue: (songs, startIndex = 0) => {
    if (!songs.length) return;
    set({ queue: songs, currentIndex: startIndex, isPlaying: true });
    loadCurrent();
  },

  playNow: (song, context) => {
    const songs = context?.length ? context : [song];
    const index = suggestIndex(songs, song.id);
    set({ queue: songs, currentIndex: index, isPlaying: true });
    loadCurrent();
  },

  setPlaying: (playing) => {
    set({ isPlaying: playing });
    const audio = getAudio();
    if (!audio) return;
    if (playing) {
      audio.preload = "auto";
      audio.play().catch(() => set({ isPlaying: false }));
    } else audio.pause();
  },

  togglePlay: () => {
    const { isPlaying, queue, currentIndex } = get();
    if (currentIndex < 0 || !queue.length) return;
    get().setPlaying(!isPlaying);
  },

  next: () => {
    const { queue, currentIndex, shuffle, repeat } = get();
    if (!queue.length || currentIndex < 0) return;
    if (shuffle && queue.length > 1) {
      let n = currentIndex;
      while (n === currentIndex) n = Math.floor(Math.random() * queue.length);
      set({ currentIndex: n, isPlaying: true });
      loadCurrent();
      return;
    }
    const n = currentIndex + 1;
    if (n >= queue.length) {
      if (repeat === "all") {
        set({ currentIndex: 0, isPlaying: true });
        loadCurrent();
      } else if (repeat === "off") {
        get().handleEnded();
      } else {
        const audio = getAudio();
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
        set({ isPlaying: true });
      }
      return;
    }
    set({ currentIndex: n, isPlaying: true });
    loadCurrent();
  },

  prev: () => {
    const { queue, currentIndex, shuffle } = get();
    if (!queue.length || currentIndex < 0) return;
    const audio = getAudio();
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (shuffle && queue.length > 1) {
      let n = currentIndex;
      while (n === currentIndex) n = Math.floor(Math.random() * queue.length);
      set({ currentIndex: n, isPlaying: true });
      loadCurrent();
      return;
    }
    const n = currentIndex - 1;
    if (n < 0) {
      if (get().repeat === "all") {
        set({ currentIndex: queue.length - 1, isPlaying: true });
        loadCurrent();
      } else {
        return;
      }
    } else {
      set({ currentIndex: n, isPlaying: true });
      loadCurrent();
    }
  },

  handleEnded: () => {
    const { repeat, currentIndex, queue, autoAddSimilar, sleepMode } = get();
    if (sleepMode === "track") {
      // Sleep timer set to "end of track": stop here instead of advancing.
      const audio = getAudio();
      if (audio) audio.pause();
      set({ isPlaying: false, sleepMode: null, sleepAt: null });
      useProgress.getState().setProgress(
        useProgress.getState().duration,
        useProgress.getState().duration,
        0
      );
      return;
    }
    if (repeat === "one") {
      const audio = getAudio();
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      set({ isPlaying: true });
      return;
    }
    const last = currentIndex >= queue.length - 1;
    if (last) {
      if (repeat === "all") {
        set({ currentIndex: 0, isPlaying: true });
        loadCurrent();
      } else if (autoAddSimilar) {
        void (async () => {
          await ensureQueueBacklog();
          const st = usePlayer.getState();
          if (st.queue.length - st.currentIndex >= 2) {
            st.next();
          } else {
            const audio = getAudio();
            if (audio) audio.pause();
            usePlayer.setState({ isPlaying: false });
          }
        })();
      } else {
        const audio = getAudio();
        if (audio) audio.pause();
        set({ isPlaying: false, currentIndex: queue.length ? queue.length - 1 : -1 });
      }
    } else {
      get().next();
    }
  },

  seekTo: (time) => {
    const audio = getAudio();
    if (audio && isFinite(time)) audio.currentTime = time;
  },

  setVolume: (volume) => {
    const v = Math.min(1, Math.max(0, volume));
    // Moving the slider off zero must unmute, otherwise the slider appears to
    // do nothing while the player is muted.
    set({ volume: v, muted: v === 0 });
    const audio = getAudio();
    if (audio) audio.volume = v;
  },

  toggleMute: () => {
    const muted = !get().muted;
    set({ muted });
    const audio = getAudio();
    if (audio) audio.volume = muted ? 0 : get().volume;
  },

  cycleRepeat: () => {
    const order: RepeatMode[] = ["off", "all", "one"];
    const idx = order.indexOf(get().repeat);
    set({ repeat: order[(idx + 1) % order.length] });
  },

  toggleShuffle: () => set({ shuffle: !get().shuffle }),

  toggleAutoAdd: () => set({ autoAddSimilar: !get().autoAddSimilar }),

  setQueueOpen: (open) => set({ queueOpen: open }),
  setLyricsOpen: (open) => set({ lyricsOpen: open }),

  addNext: (song) => {
    const { queue, currentIndex } = get();
    if (!queue.length) {
      set({ queue: [song], currentIndex: 0, isPlaying: true });
      loadCurrent();
      return;
    }
    const dup = queue.findIndex((s) => s.id === song.id);
    if (dup >= 0 && dup !== currentIndex) {
      const copy = [...queue];
      copy.splice(dup, 1);
      const insert = currentIndex + 1;
      copy.splice(insert, 0, song);
      let ci = currentIndex;
      if (dup < currentIndex) ci = currentIndex - 1;
      set({ queue: copy, currentIndex: ci });
      return;
    }
    const copy = [...queue];
    copy.splice(currentIndex + 1, 0, song);
    set({ queue: copy });
  },

  addToQueue: (song) => {
    const { queue } = get();
    if (!queue.length) {
      set({ queue: [song], currentIndex: 0, isPlaying: true });
      loadCurrent();
      return;
    }
    if (queue.some((s) => s.id === song.id)) return;
    set({ queue: [...queue, song] });
  },

  removeAt: (index) => {
    const { queue, currentIndex } = get();
    if (index < 0 || index >= queue.length) return;
    const copy = queue.filter((_, i) => i !== index);
    if (!copy.length) {
      const audio = getAudio();
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
      }
      useProgress.getState().resetProgress();
      set({ queue: [], currentIndex: -1, isPlaying: false, usedProxyFor: "" });
      return;
    }
    let ci = currentIndex;
    if (index < currentIndex) ci = currentIndex - 1;
    else if (index === currentIndex) {
      ci = Math.min(currentIndex, copy.length - 1);
    }
    set({ queue: copy, currentIndex: ci });
    // Reload after the state update so the new current song is what loads.
    // When paused we still swap the source (without autoplaying) so pressing
    // play resumes the correct track rather than the removed one.
    if (index === currentIndex) loadCurrent(get().isPlaying);
  },

  move: (from, to) => {
    const { queue, currentIndex } = get();
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= queue.length ||
      to >= queue.length
    ) {
      return;
    }
    const copy = [...queue];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);

    let ci = currentIndex;
    if (from === currentIndex) ci = to;
    else if (from < currentIndex && to >= currentIndex) ci = currentIndex - 1;
    else if (from > currentIndex && to <= currentIndex) ci = currentIndex + 1;

    set({ queue: copy, currentIndex: ci });
  },

  clearQueue: () => {
    const audio = getAudio();
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    useProgress.getState().resetProgress();
    set({
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      usedProxyFor: "",
      position: 0,
      positionId: "",
      sleepAt: null,
      sleepMode: null,
    });
  },

  setIndex: (index) => {
    const { queue } = get();
    if (index < 0 || index >= queue.length) return;
    set({ currentIndex: index, isPlaying: true });
    loadCurrent();
  },
    }),
    {
      name: "aevon-player-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Keep the user's session across reloads, but never persist transient UI
      // state or a stale "playing" flag (nothing is playing right after load).
      partialize: (state) => ({
        queue: state.queue.slice(0, 120),
        currentIndex: Math.min(state.currentIndex, Math.min(state.queue.length, 120) - 1),
        repeat: state.repeat,
        shuffle: state.shuffle,
        volume: state.volume,
        muted: state.muted,
        autoAddSimilar: state.autoAddSimilar,
        position: state.position,
        positionId: state.positionId,
      }),
      // Drop blocked-language tracks that an older session may have stored and
      // keep the playhead pointing at a real song.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PlayerState>;
        const savedQueue = Array.isArray(saved.queue) ? saved.queue : [];
        const queue = withoutBlocked(savedQueue);
        const dropped = queue.length !== savedQueue.length;
        const savedIndex =
          typeof saved.currentIndex === "number" ? saved.currentIndex : 0;
        const playingId = savedQueue[savedIndex]?.id;
        let currentIndex = savedIndex;
        if (!queue.length) currentIndex = -1;
        else if (dropped) {
          const stillThere = playingId
            ? queue.findIndex((song) => song.id === playingId)
            : -1;
          currentIndex = stillThere >= 0 ? stillThere : 0;
        } else if (currentIndex < 0 || currentIndex >= queue.length) {
          currentIndex = 0;
        }
        return {
          ...current,
          ...saved,
          queue,
          currentIndex,
          ...(dropped && currentIndex !== savedIndex
            ? { position: 0, positionId: "" }
            : null),
        };
      },
    }
  )
);

/**
 * Rebuilds the player after a reload: restores the queue and playhead but
 * stays paused so the browser never starts audio without a gesture.
 */
export function restoreSession() {
  const st = usePlayer.getState();
  if (!st.queue.length) return;
  if (st.currentIndex < 0 || st.currentIndex >= st.queue.length) return;
  loadCurrent(false);
}

/**
 * Appends similar-song suggestions to the end of the queue (never skips the
 * currently playing track). Used by the "auto-add similar songs" toggle.
 */
export async function ensureQueueBacklog() {
  const st = usePlayer.getState();
  if (!st.autoAddSimilar) return;
  const song = st.queue[st.currentIndex];
  if (!song) return;
  if (st.queue.length - st.currentIndex > 1) return;
  try {
    const res = await fetch(`/api/suggestions?id=${encodeURIComponent(song.id)}`);
    if (!res.ok) throw new Error("suggestions failed");
    const json = (await res.json()) as { songs?: Song[] };
    const fresh = (json.songs ?? []).filter(
      (s) => s.id && s.mediaUrl && !usePlayer.getState().queue.some((q) => q.id === s.id)
    );
    if (fresh.length) {
      const state = usePlayer.getState();
      usePlayer.setState({ queue: [...state.queue, ...fresh] });
    }
  } catch {
    /* silently ignore — player just stops at queue end */
  }
}

/** Try to fall back to the proxy when the direct CDN link fails. */
export function markProxyUsed(songId: string) {
  usePlayer.setState({ usedProxyFor: songId });
}
