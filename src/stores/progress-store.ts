import { create } from "zustand";

interface ProgressState {
  current: number;
  duration: number;
  buffered: number;
  setProgress: (current: number, duration: number, buffered: number) => void;
  resetProgress: () => void;
}

export const useProgress = create<ProgressState>((set) => ({
  current: 0,
  duration: 0,
  buffered: 0,
  setProgress: (current, duration, buffered) =>
    set({ current, duration, buffered }),
  resetProgress: () => set({ current: 0, duration: 0, buffered: 0 }),
}));
