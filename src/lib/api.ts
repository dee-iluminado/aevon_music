import { deezerGetSong, deezerSearchSongs } from "./deezer";
import {
  ALLOWED_MEDIA_HOSTS,
  SAAVN_BASE,
  SAAVN_FALLBACK_BASE,
} from "./constants";
import type {
  Album,
  ArtistInfo,
  DownloadLink,
  Lyrics,
  Playlist,
  Song,
} from "./types";

/* ------------------------------------------------------------------ */
/* Low level fetch with fallback providers                             */
/* ------------------------------------------------------------------ */

interface RequestOptions {
  revalidate?: number;
  noStore?: boolean;
}

interface ApiEnvelope {
  success?: boolean;
  data?: unknown;
}

async function request<T = unknown>(
  path: string,
  params?: Record<string, string | number | undefined>,
  opts?: RequestOptions
): Promise<T> {
  const bases = [SAAVN_BASE];
  if (SAAVN_FALLBACK_BASE && SAAVN_FALLBACK_BASE !== SAAVN_BASE) {
    bases.push(SAAVN_FALLBACK_BASE);
  }

  let lastError: unknown = new Error("Saavn API unreachable");

  for (const base of bases) {
    const url = buildUrl(base, path, params);
    try {
      const init: RequestInit = {};
      if (opts?.revalidate !== undefined) {
        init.next = { revalidate: opts.revalidate };
      } else if (opts?.noStore) {
        init.cache = "no-store";
      }
      init.signal = AbortSignal.timeout(20000);

      const res = await fetch(url, init);
      if (!res.ok) {
        lastError = new Error(`${url} -> HTTP ${res.status}`);
        continue;
      }
      const json = (await res.json()) as T | ApiEnvelope;
      if (
        json &&
        typeof json === "object" &&
        "success" in json &&
        (json as ApiEnvelope).success === false
      ) {
        lastError = new Error(`${url} -> provider error`);
        continue;
      }
      if (
        json &&
        typeof json === "object" &&
        "success" in json &&
        "data" in json
      ) {
        return (json as ApiEnvelope).data as T;
      }
      return json as T;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function buildUrl(
  base: string,
  path: string,
  params?: Record<string, string | number | undefined>
): string {
  let url = base + path;

  // The primary provider reads detail ids from query params for these paths
  const detailPath = /\/api\/(albums|playlists|artists)\/\{id\}$/.test(url);
  if (base === SAAVN_BASE && detailPath && params?.id !== undefined) {
    url = url.replace(/\/\{id\}$/, "");
  }
  url = url.replace(/\{id\}/g, params?.id ? String(params.id) : "");

  const qp = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      if (k === "id" && base === SAAVN_BASE && detailPath) continue;
      qp.set(k, String(v));
    }
  }
  if (base === SAAVN_BASE && detailPath && params?.id !== undefined) {
    qp.set("id", String(params.id));
  }

  const qs = qp.toString();
  return qs ? `${url}?${qs}` : url;
}

/* ------------------------------------------------------------------ */
/* Normalizers                                                         */
/* ------------------------------------------------------------------ */

type Raw = Record<string, unknown>;

function pickImage(raw: Raw | undefined, prefer = "500x500"): string {
  const img = raw?.image;
  if (!img) return "";
  if (typeof img === "string") return img;
  if (Array.isArray(img)) {
    const found = img.find((i) => i?.quality === prefer)?.url;
    if (found) return found;
    for (const q of ["500x500", "150x150", "120x120", "50x50"]) {
      const f = img.find((i) => i?.quality === q);
      if (f?.url) return f.url;
    }
    return img[0]?.url ?? "";
  }
  if (typeof img === "object") {
    const obj = img as { url?: string; high?: string };
    return obj?.url ?? obj?.high ?? "";
  }
  return "";
}

function imageSizes(raw: Raw | undefined): Record<string, string> {
  const img = raw?.image;
  const map: Record<string, string> = {};
  if (Array.isArray(img)) {
    for (const i of img) {
      if (i?.quality && i?.url) map[String(i.quality)] = String(i.url);
    }
  }
  if (!map["500x500"] && typeof raw?.image === "string") {
    map["500x500"] = raw.image;
  }
  return map;
}

function parseArtists(raw: Raw | undefined): string[] {
  const primary = (raw?.artists as { primary?: unknown } | undefined)?.primary;
  if (Array.isArray(primary)) {
    return primary
      .map((a: { name?: unknown }) => String(a?.name ?? "").trim())
      .filter(Boolean);
  }
  const names = raw?.primary_artists;
  if (Array.isArray(names)) return names.map(String).filter(Boolean);
  if (typeof raw?.primary_artists === "string" && raw.primary_artists) {
    return raw.primary_artists.split(/,\s*/).filter(Boolean);
  }
  return [];
}

function bestDownload(downloads: DownloadLink[]): DownloadLink | undefined {
  if (!downloads.length) return undefined;
  const prefer = downloads.find((d) => /320|320kbps/.test(d.quality));
  if (prefer) return prefer;
  const byKbps = downloads
    .map((d) => ({ d, n: parseInt(d.quality, 10) }))
    .filter((x) => !isNaN(x.n))
    .sort((a, b) => b.n - a.n);
  if (byKbps.length) return byKbps[0].d;
  return downloads[0];
}

export function normalizeSong(raw: Raw | undefined): Song {
  const downloads: DownloadLink[] = Array.isArray(raw?.downloadUrl)
    ? raw.downloadUrl.map((d: { quality?: unknown; url?: unknown }) => ({
        quality: String(d?.quality ?? ""),
        url: String(d?.url ?? ""),
      }))
    : [];
  const best = bestDownload(downloads);
  const fallback =
    typeof raw?.previewUrl === "string" ? raw.previewUrl : raw?.media_url;

  const albumName =
    typeof raw?.album === "string"
      ? raw.album
      : (raw?.album as { name?: string } | undefined)?.name ?? raw?.album_name ?? "";

  return {
    id: String(raw?.id ?? raw?.encrypted_media_url ?? ""),
    title: String(raw?.title ?? raw?.name ?? raw?.song ?? ""),
    album: String(albumName),
    albumId: (raw?.album as { id?: string } | undefined)?.id
      ? String((raw?.album as { id?: string }).id)
      : undefined,
    artists: parseArtists(raw),
    image: pickImage(raw),
    imageSizes: imageSizes(raw),
    duration: Number(raw?.duration ?? raw?.song_duration ?? 0),
    language: raw?.language ? String(raw.language) : undefined,
    year: raw?.year ? String(raw.year) : undefined,
    downloadUrl: downloads,
    mediaUrl: best?.url ?? (fallback ? String(fallback) : ""),
    previewUrl:
      typeof raw?.previewUrl === "string" ? String(raw.previewUrl) : undefined,
    hasLyrics: Boolean(raw?.hasLyrics),
    url: raw?.url ? String(raw.url) : undefined,
    playCount: raw?.playCount ? Number(raw.playCount) : undefined,
    explicitContent: Boolean(raw?.explicitContent),
  };
}

export function normalizeAlbum(raw: Raw | undefined): Album {
  return {
    id: String(raw?.id ?? ""),
    name: String(raw?.name ?? raw?.title ?? ""),
    image: pickImage(raw),
    imageSizes: imageSizes(raw),
    artists: parseArtists(raw),
    year: raw?.year ? String(raw.year) : undefined,
    language: raw?.language ? String(raw.language) : undefined,
    songCount: Number(
      raw?.songCount ?? (Array.isArray(raw?.songs) ? raw?.songs.length : 0)
    ),
    description: raw?.description ? String(raw.description) : undefined,
    url: raw?.url ? String(raw.url) : undefined,
    type: String(raw?.type ?? "album"),
    songs: Array.isArray(raw?.songs) ? raw.songs.map(normalizeSong) : undefined,
  };
}

export function normalizePlaylist(raw: Raw | undefined): Playlist {
  return {
    id: String(raw?.id ?? ""),
    name: String(raw?.name ?? raw?.title ?? ""),
    image: pickImage(raw),
    imageSizes: imageSizes(raw),
    subtitle: raw?.subtitle ? String(raw.subtitle) : undefined,
    songCount: Number(
      raw?.songCount ?? (Array.isArray(raw?.songs) ? raw?.songs.length : 0)
    ),
    followerCount: raw?.followerCount
      ? Number(raw.followerCount)
      : undefined,
    language: raw?.language ? String(raw.language) : undefined,
    url: raw?.url ? String(raw.url) : undefined,
    type: String(raw?.type ?? "playlist"),
    songs: Array.isArray(raw?.songs) ? raw.songs.map(normalizeSong) : undefined,
  };
}

export function normalizeArtist(raw: Raw | undefined): ArtistInfo {
  return {
    id: String(raw?.id ?? ""),
    name: String(raw?.name ?? raw?.title ?? ""),
    image: pickImage(raw),
    imageSizes: imageSizes(raw),
    url: raw?.url ? String(raw.url) : undefined,
    type: String(raw?.type ?? "artist"),
  };
}

export function extractList(data: unknown): Raw[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.results)) return d.results;
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.songs)) return d.songs;
    if (Array.isArray(d.albums)) return d.albums;
    if (Array.isArray(d.playlists)) return d.playlists;
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export async function searchSongs(
  query: string,
  page = 1,
  limit = 20,
  opts: RequestOptions = {}
): Promise<Song[]> {
  const data = await request(
    "/api/search/songs",
    { query, page, limit },
    { noStore: true, ...opts }
  );
  const songs = extractList(data).map(normalizeSong);

  if (page === 1 && songs.length < Math.min(limit, 8)) {
    const extra = await deezerSearchSongs(query, 12);
    const key = (s: Song) =>
      `${s.title.toLowerCase()}|${(s.artists[0] ?? "").toLowerCase()}`;
    const seen = new Set(songs.map(key));
    const merged = [
      ...songs,
      ...extra.filter((d) => !seen.has(key(d))),
    ];
    return merged.slice(0, Math.max(limit, 24));
  }

  return songs;
}

export async function getEnglishHomeSongs(limit = 20): Promise<Song[]> {
  const queries = ["top charts", "trending now"];
  const lists = await Promise.all(
    queries.map((query) =>
      safe(searchSongs(query, 1, 40, { revalidate: 3600 }), []).then((list) =>
        list.filter((s) => s.language === "english")
      )
    )
  );

  const byTitle = new Map<string, Song>();
  for (const song of lists.flat()) {
    const key = song.title.trim().toLowerCase();
    const existing = byTitle.get(key);
    if (!existing || (song.playCount ?? 0) > (existing.playCount ?? 0)) {
      byTitle.set(key, song);
    }
  }

  return [...byTitle.values()]
    .sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0))
    .slice(0, limit);
}

export async function searchAlbums(
  query: string,
  page = 1,
  limit = 20
): Promise<Album[]> {
  const data = await request(
    "/api/search/albums",
    { query, page, limit },
    { noStore: true }
  );
  return extractList(data).map(normalizeAlbum);
}

export async function searchPlaylists(
  query: string,
  page = 1,
  limit = 20
): Promise<Playlist[]> {
  const data = await request(
    "/api/search/playlists",
    { query, page, limit },
    { noStore: true }
  );
  return extractList(data).map(normalizePlaylist);
}

export async function searchArtists(
  query: string,
  page = 1,
  limit = 20
): Promise<ArtistInfo[]> {
  const data = await request(
    "/api/search/artists",
    { query, page, limit },
    { noStore: true }
  );
  return extractList(data).map(normalizeArtist);
}

export interface SearchAll {
  songs: Song[];
  albums: Album[];
  playlists: Playlist[];
  artists: ArtistInfo[];
}

export async function searchAll(query: string, limit = 10): Promise<SearchAll> {
  const data = await request(
    "/api/search",
    { query, limit },
    { noStore: true }
  );
  const d = (data ?? {}) as Record<string, unknown>;
  return {
    songs: extractList(d.songs ?? []).map(normalizeSong),
    albums: extractList(d.albums ?? []).map(normalizeAlbum),
    playlists: extractList(d.playlists ?? []).map(normalizePlaylist),
    artists: extractList(d.artists ?? []).map(normalizeArtist),
  };
}

export async function getSong(id: string): Promise<Song | null> {
  if (id.startsWith("dz-")) return deezerGetSong(id);
  const data = await request<Raw | Raw[]>("/api/songs/{id}", { id });
  const item = Array.isArray(data) ? data[0] : data;
  return item && typeof item === "object" ? normalizeSong(item) : null;
}

export async function getSongs(ids: string[]): Promise<Song[]> {
  if (!ids.length) return [];
  const data = await request("/api/songs", { ids: ids.join(",") }, { noStore: true });
  return extractList(data).map(normalizeSong);
}

export async function getAlbum(id: string): Promise<Album | null> {
  const data = await request<Raw>("/api/albums/{id}", { id });
  return data && typeof data === "object" ? normalizeAlbum(data) : null;
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  const data = await request<Raw>("/api/playlists/{id}", { id });
  return data && typeof data === "object" ? normalizePlaylist(data) : null;
}

export async function getArtist(id: string): Promise<ArtistInfo | null> {
  const data = await request<Raw>("/api/artists/{id}", { id });
  return data && typeof data === "object" ? normalizeArtist(data) : null;
}

export async function getArtistSongs(
  id: string,
  page = 1,
  category = "latest",
  pages = 3
): Promise<Song[]> {
  const all: Song[] = [];
  const seen = new Set<string>();
  const settled = await Promise.allSettled(
    Array.from({ length: Math.max(1, pages) }, (_, i) =>
      request(
        "/api/artists/{id}/songs",
        { id, page: page + i, category },
        { noStore: true }
      )
    )
  );
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const song of extractList(r.value).map(normalizeSong)) {
      if (!seen.has(song.id)) {
        seen.add(song.id);
        all.push(song);
      }
    }
  }
  return all;
}

export async function getArtistAlbums(
  id: string,
  page = 1,
  limit?: number
): Promise<Album[]> {
  const params: Record<string, string | number> = {};
  if (limit) params.limit = limit;
  // The primary provider returns an empty list when `page` is present for
  // some artists, so only send it when actually paginating.
  if (page > 1) params.page = page;
  const data = await request("/api/artists/{id}/albums", { id, ...params }, { noStore: true });
  return extractList(data).map(normalizeAlbum);
}

export async function getSongSuggestions(
  id: string,
  limit = 25
): Promise<Song[]> {
  const data = await request(
    "/api/songs/{id}/suggestions",
    { id, limit },
    { noStore: true }
  );
  return extractList(data).map(normalizeSong);
}

export async function getLyrics(id: string): Promise<Lyrics | null> {
  const data = await request<Raw>("/api/lyrics/{id}", { id }, { noStore: true });
  if (!data || typeof data !== "object") return null;
  return {
    id: String(data.id ?? id),
    lyrics: String(data.lyrics ?? ""),
    lines: Array.isArray(data.lines)
      ? data.lines.map((l) => String(l))
      : String(data.lyrics ?? "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
    snippet: data.snippet ? String(data.snippet) : undefined,
    copyright: data.copyright ? String(data.copyright) : undefined,
  };
}

export async function getTrendingSongs(limit = 20): Promise<Song[]> {
  const data = await request("/api/trending/songs", { limit }, { revalidate: 3600 });
  return extractList(data).map(normalizeSong);
}

export async function getTrendingAlbums(limit = 20): Promise<Album[]> {
  const data = await request("/api/trending/albums", { limit }, { revalidate: 3600 });
  return extractList(data).map(normalizeAlbum);
}

export async function getTrendingPlaylists(limit = 20): Promise<Playlist[]> {
  const data = await request("/api/trending/playlists", { limit }, { revalidate: 3600 });
  return extractList(data).map(normalizePlaylist);
}

export async function getCharts(): Promise<Playlist[]> {
  const data = await request("/api/charts", undefined, { revalidate: 3600 });
  return extractList(data).map(normalizePlaylist);
}

export async function safe<T>(
  promise: Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export function isAllowedMediaUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") return false;
    return (
      ALLOWED_MEDIA_HOSTS.includes(hostname) ||
      hostname.endsWith(".saavncdn.com") ||
      hostname.endsWith(".saavncdn.io") ||
      hostname.endsWith(".dzcdn.net")
    );
  } catch {
    return false;
  }
}

/**
 * Follows a small number of redirects, re-validating the host on every hop so
 * an allowlisted CDN cannot bounce the proxy at an internal address.
 */
export async function fetchAllowedMedia(
  url: string,
  init: RequestInit & { maxRedirects?: number } = {}
): Promise<Response> {
  const { maxRedirects = 5, ...rest } = init;
  let current = url;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (!isAllowedMediaUrl(current)) {
      throw new Error(`Blocked redirect to disallowed host: ${current}`);
    }
    const res = await fetch(current, { ...rest, redirect: "manual" });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return res;
      current = new URL(location, current).toString();
      continue;
    }
    return res;
  }

  throw new Error("Too many redirects");
}
