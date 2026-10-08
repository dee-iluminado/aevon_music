import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Song } from "@/lib/types";
import { uid } from "@/lib/utils";

export interface UserPlaylist {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  songs: Song[];
}

interface LibraryState {
  favourites: Song[];
  playlists: UserPlaylist[];
  downloads: Song[];
  recentlyPlayed: Song[];

  toggleFavourite: (song: Song) => void;
  isFavourite: (id: string) => boolean;
  createPlaylist: (name: string, description?: string) => string;
  deletePlaylist: (id: string) => void;
  updatePlaylist: (
    id: string,
    patch: Partial<Pick<UserPlaylist, "name" | "description">>
  ) => void;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  addDownload: (song: Song) => void;
  removeDownload: (songId: string) => void;
  pushRecent: (song: Song) => void;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      favourites: [],
      playlists: [],
      downloads: [],
      recentlyPlayed: [],

      toggleFavourite: (song) => {
        const { favourites } = get();
        const exists = favourites.some((s) => s.id === song.id);
        set({
          favourites: exists
            ? favourites.filter((s) => s.id !== song.id)
            : [song, ...favourites],
        });
      },

      isFavourite: (id) => get().favourites.some((s) => s.id === id),

      createPlaylist: (name, description) => {
        const id = uid();
        const playlist: UserPlaylist = {
          id,
          name,
          description,
          createdAt: Date.now(),
          songs: [],
        };
        set({ playlists: [playlist, ...get().playlists] });
        return id;
      },

      deletePlaylist: (id) => {
        set({ playlists: get().playlists.filter((p) => p.id !== id) });
      },

      updatePlaylist: (id, patch) => {
        set({
          playlists: get().playlists.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        });
      },

      addToPlaylist: (playlistId, song) => {
        set({
          playlists: get().playlists.map((p) => {
            if (p.id !== playlistId) return p;
            if (p.songs.some((s) => s.id === song.id)) return p;
            return { ...p, songs: [...p.songs, song] };
          }),
        });
      },

      removeFromPlaylist: (playlistId, songId) => {
        set({
          playlists: get().playlists.map((p) =>
            p.id === playlistId
              ? { ...p, songs: p.songs.filter((s) => s.id !== songId) }
              : p
          ),
        });
      },

      addDownload: (song) => {
        if (get().downloads.some((s) => s.id === song.id)) return;
        set({ downloads: [song, ...get().downloads] });
      },

      removeDownload: (songId) => {
        set({ downloads: get().downloads.filter((s) => s.id !== songId) });
      },

      pushRecent: (song) => {
        const rest = get().recentlyPlayed.filter((s) => s.id !== song.id);
        set({ recentlyPlayed: [song, ...rest].slice(0, 50) });
      },
    }),
    {
      name: "hayasaka-library-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
