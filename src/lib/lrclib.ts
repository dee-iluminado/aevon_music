import type { Lyrics } from "./types";

interface LrclibResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

export interface LyricLookup {
  title: string;
  artist: string;
  album?: string;
  duration?: number;
}

const LRCLIB_BASE = "https://lrclib.net/api";

async function lrclibFetch(
  path: string
): Promise<LrclibResponse | LrclibResponse[] | null> {
  try {
    const res = await fetch(`${LRCLIB_BASE}${path}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "music-app/1.0 (lyrics lookup)",
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as LrclibResponse | LrclibResponse[];
  } catch {
    return null;
  }
}

function parseSynced(synced: string): { time: number; text: string }[] {
  return synced
    .split("\n")
    .map((line) => {
      const m = line.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\](.*)/);
      if (!m) return null;
      const minutes = Number(m[1]);
      const seconds = Number(m[2]);
      const ms = m[3] ? Number((m[3] + "00").slice(0, 3)) : 0;
      const text = m[4].trim();
      if (!text) return null;
      return { time: minutes * 60 + seconds + ms / 1000, text };
    })
    .filter((x): x is { time: number; text: string } => x !== null)
    .sort((a, b) => a.time - b.time);
}

function stripTimestamps(synced: string): string {
  return synced
    .split("\n")
    .map((line) =>
      line
        .replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, "")
        .trim()
    )
    .filter(Boolean)
    .join("\n");
}

function bestMatch(
  results: LrclibResponse[],
  duration?: number
): LrclibResponse | null {
  if (!results.length) return null;
  const scored = results
    .map((r, i) => {
      let score = i;
      if (r.plainLyrics && r.syncedLyrics) score -= 10;
      else if (r.plainLyrics) score -= 8;
      else if (r.syncedLyrics) score -= 6;
      if (duration && r.duration) {
        const diff = Math.abs(r.duration - duration);
        if (diff <= 1) score -= 20;
        else if (diff <= 3) score -= 10;
      }
      return { r, score };
    })
    .sort((a, b) => a.score - b.score);
  return scored[0]?.r ?? null;
}

function toLyrics(res: LrclibResponse): Lyrics | null {
  if (res.instrumental) return null;
  const synced = res.syncedLyrics ? parseSynced(res.syncedLyrics) : undefined;
  const text = (res.plainLyrics || (res.syncedLyrics ? stripTimestamps(res.syncedLyrics) : "")).trim();
  if (!text && !synced?.length) return null;
  return {
    id: `${res.artistName} - ${res.trackName}`,
    lyrics: text,
    lines: text.split("\n").map((l) => l.trim()).filter(Boolean),
    synced: synced?.length ? synced : undefined,
    copyright: "Lyrics provided by LRC Lib contributors",
  };
}

export async function getLrclibLyrics(
  lookup: LyricLookup
): Promise<Lyrics | null> {
  const q = new URLSearchParams({
    track_name: lookup.title,
    artist_name: lookup.artist,
  });
  if (lookup.album) q.set("album_name", lookup.album);
  if (lookup.duration) q.set("duration", String(Math.round(lookup.duration)));

  const exact = await lrclibFetch(`/get?${q.toString()}`);
  if (exact && !Array.isArray(exact)) {
    const lyrics = toLyrics(exact);
    if (lyrics) return lyrics;
  }

  const search = await lrclibFetch(`/search?${q.toString()}`);
  if (Array.isArray(search) && search.length) {
    const res = bestMatch(search, lookup.duration);
    const lyrics = res ? toLyrics(res) : null;
    if (lyrics) return lyrics;
  }

  return null;
}
