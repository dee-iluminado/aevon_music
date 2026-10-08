import type { Song } from "./types";

export const DEEZER_API = "https://api.deezer.com";

interface DeezerTrack {
  id: number;
  title: string;
  link: string;
  duration: number;
  preview: string;
  explicit_lyrics: boolean;
  artist: { name: string };
  album: { title: string; cover_xl?: string; cover_medium?: string };
}

function toSong(track: DeezerTrack): Song {
  return {
    id: `dz-${track.id}`,
    title: track.title,
    album: track.album?.title ?? "",
    artists: track.artist?.name ? [track.artist.name] : [],
    image: track.album?.cover_xl ?? track.album?.cover_medium ?? "",
    imageSizes: {},
    duration: Number(track.duration ?? 0),
    mediaUrl: track.preview ?? "",
    previewUrl: track.preview ?? undefined,
    downloadUrl: [],
    hasLyrics: false,
    url: track.link,
  };
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${DEEZER_API}${path}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as T | { error?: unknown };
    if (json && typeof json === "object" && "error" in json) return null;
    return json as T;
  } catch {
    return null;
  }
}

export async function deezerSearchSongs(
  q: string,
  limit = 12
): Promise<Song[]> {
  const data = await fetchJson<{ data?: DeezerTrack[] }>(
    `/search?q=${encodeURIComponent(q)}&limit=${limit}`
  );
  return (data?.data ?? []).map(toSong);
}

export async function deezerGetSong(id: string): Promise<Song | null> {
  const num = id.replace(/^dz-/, "");
  const track = await fetchJson<DeezerTrack>(`/track/${num}`);
  return track ? toSong(track) : null;
}
