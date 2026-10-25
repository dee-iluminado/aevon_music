import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SearchState {
  recent: string[];
  addRecent: (query: string) => void;
  removeRecent: (query: string) => void;
  clearRecent: () => void;
}

const MAX_RECENT = 8;

export const useSearchHistory = create<SearchState>()(
  persist(
    (set, get) => ({
      recent: [],

      addRecent: (query) => {
        const q = query.trim();
        if (q.length < 2) return;
        const rest = get().recent.filter(
          (item) => item.toLowerCase() !== q.toLowerCase()
        );
        set({ recent: [q, ...rest].slice(0, MAX_RECENT) });
      },

      removeRecent: (query) =>
        set({ recent: get().recent.filter((item) => item !== query) }),

      clearRecent: () => set({ recent: [] }),
    }),
    {
      name: "aevon-search-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
