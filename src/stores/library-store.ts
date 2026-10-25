import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Album, ArtistInfo, Song } from "@/lib/types";
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
  albums: Album[];
  artists: ArtistInfo[];
  playCounts: Record<string, number>;

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
  bumpPlay: (songId: string) => void;
  toggleAlbum: (album: Album) => void;
  isAlbumSaved: (id: string) => boolean;
  toggleArtist: (artist: ArtistInfo) => void;
  isArtistFollowed: (id: string) => boolean;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      favourites: [],
      playlists: [],
      downloads: [],
      recentlyPlayed: [],
      albums: [],
      artists: [],
      playCounts: {},

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

      bumpPlay: (songId) => {
        const counts = get().playCounts;
        set({ playCounts: { ...counts, [songId]: (counts[songId] ?? 0) + 1 } });
      },

      toggleAlbum: (album) => {
        const exists = get().albums.some((a) => a.id === album.id);
        set({
          albums: exists
            ? get().albums.filter((a) => a.id !== album.id)
            : [{ ...album, songs: undefined }, ...get().albums],
        });
      },

      isAlbumSaved: (id) => get().albums.some((a) => a.id === id),

      toggleArtist: (artist) => {
        const exists = get().artists.some((a) => a.id === artist.id);
        set({
          artists: exists
            ? get().artists.filter((a) => a.id !== artist.id)
            : [artist, ...get().artists],
        });
      },

      isArtistFollowed: (id) => get().artists.some((a) => a.id === id),
    }),
    {
      name: "hayasaka-library-v1",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<LibraryState>;
        if (version < 2) {
          return {
            ...state,
            albums: state.albums ?? [],
            artists: state.artists ?? [],
            playCounts: state.playCounts ?? {},
          } as LibraryState;
        }
        return state as LibraryState;
      },
    }
  )
);
