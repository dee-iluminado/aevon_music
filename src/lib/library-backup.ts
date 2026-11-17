/**
 * Portable JSON backups for the on-device library.
 *
 * Accounts are local to a device, so the only way to move favourites,
 * playlists and listening history to another phone/browser is a file the user
 * carries over. Downloads are included as metadata only — the audio itself is
 * streamed, not stored, so there is nothing to transfer.
 */

import type { Album, ArtistInfo, Song } from "@/lib/types";
import type { UserPlaylist } from "@/stores/library-store";
import { isBlockedItem } from "@/lib/content-filter";

export const BACKUP_APP = "aevon-music";
export const BACKUP_VERSION = 1;

export interface LibraryData {
  favourites: Song[];
  playlists: UserPlaylist[];
  downloads: Song[];
  recentlyPlayed: Song[];
  albums: Album[];
  artists: ArtistInfo[];
  playCounts: Record<string, number>;
}

export interface LibraryBackup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  data: LibraryData;
}

export interface MergeSummary {
  favourites: number;
  playlists: number;
  downloads: number;
  recentlyPlayed: number;
  albums: number;
  artists: number;
}

export type LibraryBackupSource = LibraryData;

/* ------------------------------------------------------------------ */
/* Sanitising                                                          */
/* ------------------------------------------------------------------ */

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasId(value: unknown): value is { id: string } {
  return isRecord(value) && typeof value.id === "string" && value.id.length > 0;
}

function isSong(value: unknown): value is Song {
  return hasId(value) && typeof (value as Partial<Song>).title === "string";
}

function isAlbum(value: unknown): value is Album {
  return hasId(value) && typeof (value as Partial<Album>).name === "string";
}

function isArtist(value: unknown): value is ArtistInfo {
  return hasId(value) && typeof (value as Partial<ArtistInfo>).name === "string";
}

function isPlaylist(value: unknown): value is UserPlaylist {
  return hasId(value) && typeof (value as Partial<UserPlaylist>).name === "string";
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function cleanSongs(value: unknown): Song[] {
  return dedupeById(asArray(value).filter(isSong).filter((s) => !isBlockedItem(s)));
}

function cleanAlbums(value: unknown): Album[] {
  return dedupeById(asArray(value).filter(isAlbum).filter((a) => !isBlockedItem(a)));
}

function cleanArtists(value: unknown): ArtistInfo[] {
  return dedupeById(asArray(value).filter(isArtist));
}

function cleanPlaylists(value: unknown): UserPlaylist[] {
  return dedupeById(
    asArray(value)
      .filter(isPlaylist)
      .map((playlist) => ({
        ...playlist,
        songs: cleanSongs(playlist.songs),
        createdAt:
          typeof playlist.createdAt === "number" ? playlist.createdAt : Date.now(),
      }))
  );
}

function cleanPlayCounts(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const out: Record<string, number> = {};
  for (const [id, count] of Object.entries(value)) {
    if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) continue;
    out[id] = Math.round(count);
  }
  return out;
}

function cleanData(raw: unknown): LibraryData {
  const source = isRecord(raw) ? raw : {};
  return {
    favourites: cleanSongs(source.favourites),
    playlists: cleanPlaylists(source.playlists),
    downloads: cleanSongs(source.downloads),
    recentlyPlayed: cleanSongs(source.recentlyPlayed).slice(0, 50),
    albums: cleanAlbums(source.albums),
    artists: cleanArtists(source.artists),
    playCounts: cleanPlayCounts(source.playCounts),
  };
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export function createBackup(source: LibraryBackupSource): LibraryBackup {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: cleanData(source),
  };
}

export function serializeBackup(backup: LibraryBackup): string {
  return JSON.stringify(backup, null, 2);
}

export function backupFilename(date = new Date()): string {
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  return `aevon-music-backup-${stamp}.json`;
}

/** Triggers a browser download and returns the filename used. */
export function downloadBackup(backup: LibraryBackup): string {
  if (typeof window === "undefined") return backupFilename();
  const filename = backupFilename();
  const blob = new Blob([serializeBackup(backup)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  return filename;
}

/* ------------------------------------------------------------------ */
/* Import                                                              */
/* ------------------------------------------------------------------ */

export function countBackupSongs(backup: LibraryBackup): number {
  const ids = new Set<string>();
  for (const song of [
    ...backup.data.favourites,
    ...backup.data.downloads,
    ...backup.data.recentlyPlayed,
    ...backup.data.playlists.flatMap((p) => p.songs),
  ]) {
    ids.add(song.id);
  }
  return ids.size;
}

export class BackupParseError extends Error {}

/**
 * Accepts our own backup format, a raw Zustand-persisted snapshot, or a plain
 * object with the library arrays at the top level. Anything else is rejected
 * with a message that is safe to show the user.
 */
export function parseBackup(text: string): LibraryBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupParseError("That file isn't valid JSON.");
  }

  if (!isRecord(raw)) {
    throw new BackupParseError("That file doesn't contain a library backup.");
  }

  if (typeof raw.app === "string" && raw.app !== BACKUP_APP) {
    throw new BackupParseError("That backup was made by a different app.");
  }

  const looksLikeLibrary = (value: unknown): boolean =>
    isRecord(value) &&
    ["favourites", "playlists", "downloads", "recentlyPlayed", "albums", "artists"].some(
      (key) => Array.isArray(value[key])
    );

  let data: unknown;
  if (isRecord(raw.data) && looksLikeLibrary(raw.data)) {
    data = raw.data;
  } else if (isRecord(raw.state) && looksLikeLibrary(raw.state)) {
    data = raw.state;
  } else if (looksLikeLibrary(raw)) {
    data = raw;
  } else {
    throw new BackupParseError(
      "That file doesn't look like an AEVON Music backup."
    );
  }

  return {
    app: BACKUP_APP,
    version: typeof raw.version === "number" ? raw.version : BACKUP_VERSION,
    exportedAt:
      typeof raw.exportedAt === "string"
        ? raw.exportedAt
        : new Date().toISOString(),
    data: cleanData(data),
  };
}

/* ------------------------------------------------------------------ */
/* Merge                                                               */
/* ------------------------------------------------------------------ */

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const ids = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !ids.has(item.id))];
}

function mergePlaylists(
  current: UserPlaylist[],
  incoming: UserPlaylist[]
): { playlists: UserPlaylist[]; added: number } {
  const byId = new Map(current.map((p) => [p.id, p] as const));
  const byName = new Map(
    current.map((p) => [p.name.trim().toLowerCase(), p] as const)
  );
  const out = [...current];
  let added = 0;

  for (const playlist of incoming) {
    const match =
      byId.get(playlist.id) ?? byName.get(playlist.name.trim().toLowerCase());

    if (!match) {
      const copy = { ...playlist };
      out.push(copy);
      byId.set(copy.id, copy);
      byName.set(copy.name.trim().toLowerCase(), copy);
      added += 1;
      continue;
    }

    // Same playlist on both devices: fold in any songs it doesn't have yet.
    const songs = mergeById(match.songs, playlist.songs);
    if (songs.length !== match.songs.length) {
      match.songs = songs;
    }
  }

  return { playlists: out, added };
}

/**
 * Merges a backup into the current library. Existing items win, so importing
 * the same file twice (or into a device that already has data) never creates
 * duplicates or wipes anything.
 */
export function mergeLibrary(
  current: LibraryData,
  incoming: LibraryData
): { data: LibraryData; added: MergeSummary } {
  const favourites = mergeById(current.favourites, incoming.favourites);
  const downloads = mergeById(current.downloads, incoming.downloads);
  const recentlyPlayed = mergeById(
    current.recentlyPlayed,
    incoming.recentlyPlayed
  ).slice(0, 50);
  const albums = mergeById(current.albums, incoming.albums);
  const artists = mergeById(current.artists, incoming.artists);
  const { playlists, added: addedPlaylists } = mergePlaylists(
    current.playlists.map((p) => ({ ...p, songs: [...p.songs] })),
    incoming.playlists
  );

  const playCounts: Record<string, number> = { ...current.playCounts };
  for (const [id, count] of Object.entries(incoming.playCounts)) {
    playCounts[id] = Math.max(playCounts[id] ?? 0, count);
  }

  return {
    data: {
      favourites,
      playlists,
      downloads,
      recentlyPlayed,
      albums,
      artists,
      playCounts,
    },
    added: {
      favourites: favourites.length - current.favourites.length,
      playlists: addedPlaylists,
      downloads: downloads.length - current.downloads.length,
      recentlyPlayed: recentlyPlayed.length - current.recentlyPlayed.length,
      albums: albums.length - current.albums.length,
      artists: artists.length - current.artists.length,
    },
  };
}

/** "3 favourites, 2 playlists" — used for the success message. */
export function describeMerge(added: MergeSummary): string {
  const parts: string[] = [];
  const push = (count: number, singular: string, plural: string) => {
    if (count > 0) parts.push(`${count} ${count === 1 ? singular : plural}`);
  };
  push(added.favourites, "favourite", "favourites");
  push(added.playlists, "playlist", "playlists");
  push(added.downloads, "download", "downloads");
  push(added.recentlyPlayed, "recent song", "recent songs");
  push(added.albums, "album", "albums");
  push(added.artists, "artist", "artists");
  return parts.join(", ");
}
