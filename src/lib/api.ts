import { deezerCorrectQuery, deezerGetSong, deezerSearchSongs } from "./deezer";
import {
  ALLOWED_MEDIA_HOSTS,
  SAAVN_BASE,
  SAAVN_FALLBACK_BASE,
} from "./constants";
import { isBlockedLanguage, withoutBlocked } from "./content-filter";
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

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#039;": "'",
  "&#39;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

/** The catalog returns HTML-escaped names ("Vishal &amp; Shekhar"). */
export function decodeEntities(value: string): string {
  return value.replace(/&(?:amp|quot|#0?39|apos|lt|gt);/gi, (m) => {
    return ENTITIES[m.toLowerCase()] ?? m;
  });
}

function cleanName(value: unknown): string {
  return decodeEntities(String(value ?? "")).trim();
}

function parseArtists(raw: Raw | undefined): string[] {
  const primary = (raw?.artists as { primary?: unknown } | undefined)?.primary;
  if (Array.isArray(primary)) {
    return primary
      .map((a: { name?: unknown }) => cleanName(a?.name))
      .filter(Boolean);
  }
  const names = raw?.primary_artists;
  if (Array.isArray(names)) return names.map(cleanName).filter(Boolean);
  if (typeof names === "string" && names) {
    return names.split(/,\s*/).map(cleanName).filter(Boolean);
  }
  // The combined search endpoint uses camelCase fields instead.
  const camel = raw?.primaryArtists;
  if (Array.isArray(camel)) return camel.map(cleanName).filter(Boolean);
  if (typeof camel === "string" && camel) {
    return camel.split(/,\s*/).map(cleanName).filter(Boolean);
  }
  const singers = raw?.singers;
  if (typeof singers === "string" && singers) {
    return singers.split(/,\s*/).map(cleanName).filter(Boolean);
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
    title: cleanName(raw?.title ?? raw?.name ?? raw?.song),
    album: cleanName(albumName),
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
    name: cleanName(raw?.name ?? raw?.title),
    image: pickImage(raw),
    imageSizes: imageSizes(raw),
    artists: parseArtists(raw),
    year: raw?.year ? String(raw.year) : undefined,
    language: raw?.language ? String(raw.language) : undefined,
    songCount: Number(
      raw?.songCount ?? (Array.isArray(raw?.songs) ? raw?.songs.length : 0)
    ),
    description: raw?.description ? cleanName(raw.description) : undefined,
    url: raw?.url ? String(raw.url) : undefined,
    type: String(raw?.type ?? "album"),
    songs: Array.isArray(raw?.songs) ? raw.songs.map(normalizeSong) : undefined,
  };
}

export function normalizePlaylist(raw: Raw | undefined): Playlist {
  return {
    id: String(raw?.id ?? ""),
    name: cleanName(raw?.name ?? raw?.title),
    image: pickImage(raw),
    imageSizes: imageSizes(raw),
    subtitle: raw?.subtitle ? cleanName(raw.subtitle) : undefined,
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
    name: cleanName(raw?.name ?? raw?.title),
    image: pickImage(raw),
    imageSizes: imageSizes(raw),
    url: raw?.url ? String(raw.url) : undefined,
    type: String(raw?.type ?? "artist"),
  };
}

/* ------------------------------------------------------------------ */
/* Duplicate cleanup                                                   */
/* ------------------------------------------------------------------ */

function normalizeKey(value: string): string {
  return decodeEntities(value)
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Small Levenshtein helper used to recognise near-miss spellings. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 3) return 4;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = row;
  }
  return prev[b.length];
}

/**
 * Guard for typo corrections: the corrected spelling must share a real word
 * with the query, or a word that is only a letter or two away. This lets
 * "levitaitng" correct to "Levitating" while rejecting random guesses for
 * gibberish like "qzxwvbnmkj".
 */
function sharesToken(a: string, b: string): boolean {
  const words = normalizeKey(a)
    .split(" ")
    .filter((word) => word.length >= 3);
  const candidates = normalizeKey(b)
    .split(" ")
    .filter((word) => word.length >= 3);

  return words.some((word) =>
    candidates.some((candidate) => {
      if (word === candidate) return true;
      const tolerance = Math.min(word.length, candidate.length) >= 6 ? 2 : 1;
      return editDistance(word, candidate) <= tolerance;
    })
  );
}

function baseTitle(title: string): string {
  return normalizeKey(title.replace(/\([^)]*\)/g, " "));
}

function durationClose(a: number, b: number): boolean {
  // Unknown durations cannot be compared, so treat them as the same song.
  if (!a || !b) return true;
  return Math.abs(a - b) <= 4;
}

function songScore(song: Song): number {
  let score = 0;
  if (song.mediaUrl) score += 4;
  if (song.downloadUrl.length) score += 2;
  if (song.hasLyrics) score += 1;
  score += Math.min(2, (song.playCount ?? 0) / 1_000_000);
  return score;
}

/**
 * Collapse copies of the same recording. The catalog (and its fallback
 * providers) often return one song several times under different album ids;
 * without this those copies fill the whole result list and hide genuinely
 * different songs that happen to share a name.
 *
 * Songs with the same base title and artist are only merged when their
 * durations are close, so remixes/live versions with different runtimes stay.
 */
export function dedupeSongs(songs: Song[]): Song[] {
  const groups = new Map<string, Song[]>();
  for (const song of songs) {
    if (!song.id) continue;
    const full = normalizeKey(song.title);
    const base = baseTitle(song.title);
    const artist = normalizeKey(song.artists[0] ?? "");
    // With no title there is nothing safe to compare against.
    const key = base ? `${base}|${artist}` : `id:${song.id}`;
    const bucket = groups.get(key);
    if (!bucket) {
      groups.set(key, [song]);
      continue;
    }
    const match = bucket.find((existing) => {
      // Same exact title (even if the runtime differs by a few seconds) is the
      // same recording listed under another album id.
      if (normalizeKey(existing.title) === full) return true;
      // A parenthetical suffix (remix/live/acoustic) only counts as the same
      // song when the runtime matches too.
      return durationClose(existing.duration, song.duration);
    });
    if (!match) {
      bucket.push(song);
    } else if (songScore(song) > songScore(match)) {
      bucket[bucket.indexOf(match)] = song;
    }
  }
  return [...groups.values()].flat();
}

function dedupeByName<T extends { id: string }>(
  items: T[],
  name: (item: T) => string,
  artist?: (item: T) => string
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (!item.id) continue;
    const key = `${normalizeKey(name(item))}|${
      artist ? normalizeKey(artist(item)) : ""
    }`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
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
  /* Ask for more than we show: the catalog repeats the same recording many
     times, and deduping afterwards is what frees slots for other songs. */
  const fetchLimit = 40;
  const data = await request(
    "/api/search/songs",
    { query, page, limit: fetchLimit },
    { noStore: true, ...opts }
  );
  let songs = dedupeSongs(
    withoutBlocked(extractList(data).map(normalizeSong))
  );

  if (page !== 1) {
    return songs.slice(0, Math.max(limit, 24));
  }

  /* Fewer than a screenful of results usually means the query was mistyped or
     the catalog only returned variants. Both paths below are guarded so they
     never replace good results. */
  const minResults = Math.min(limit, 8);

  if (songs.length < minResults) {
    /* The catalog tolerates some typos but not all ("levitaitng dua lipa"
       returns one live version). Ask Deezer for the canonical spelling, then
       search the catalog again — this keeps full-length catalog tracks while
       still recovering from misspellings. Only do this when the original
       query is nearly empty, so a wrong guess can never outrank good
       results. */
    const corrected = await deezerCorrectQuery(query);
    if (
      corrected &&
      sharesToken(query, corrected) &&
      normalizeKey(corrected) !== normalizeKey(query)
    ) {
      try {
        const retry = await request(
          "/api/search/songs",
          { query: corrected, page: 1, limit: fetchLimit },
          { noStore: true, ...opts }
        );
        /* A broad retry can drag in other tracks from the same album or
           artist. Only keep the ones whose title actually matches the
           corrected name, then put them first. */
        const matches = withoutBlocked(extractList(retry).map(normalizeSong))
          .filter((song) => sharesToken(song.title, baseTitle(corrected)));
        songs = dedupeSongs([...matches, ...songs]);
      } catch {
        // Keep the results we already have.
      }
    }
  }

  if (songs.length < 4) {
    // Last resort: Deezer's short previews still let the user find the track.
    const extra = await deezerSearchSongs(query, 12);
    songs = dedupeSongs([...songs, ...withoutBlocked(extra)]);
  }

  return songs.slice(0, Math.max(limit, 24));
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

  return dedupeSongs(lists.flat())
    .sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0))
    .slice(0, limit);
}

export async function searchAlbums(
  query: string,
  page = 1,
  limit = 20,
  opts: RequestOptions = {}
): Promise<Album[]> {
  const data = await request(
    "/api/search/albums",
    { query, page, limit },
    { noStore: true, ...opts }
  );
  return dedupeByName(
    withoutBlocked(extractList(data).map(normalizeAlbum)),
    (album) => album.name,
    (album) => album.artists[0] ?? ""
  );
}

export async function searchPlaylists(
  query: string,
  page = 1,
  limit = 20,
  opts: RequestOptions = {}
): Promise<Playlist[]> {
  const data = await request(
    "/api/search/playlists",
    { query, page, limit },
    { noStore: true, ...opts }
  );
  return dedupeByName(
    withoutBlocked(extractList(data).map(normalizePlaylist)),
    (playlist) => playlist.name
  );
}

export async function searchArtists(
  query: string,
  page = 1,
  limit = 20,
  opts: RequestOptions = {}
): Promise<ArtistInfo[]> {
  const data = await request(
    "/api/search/artists",
    { query, page, limit },
    { noStore: true, ...opts }
  );
  return dedupeByName(
    extractList(data).map(normalizeArtist),
    (artist) => artist.name
  );
}

export interface SearchAll {
  songs: Song[];
  albums: Album[];
  playlists: Playlist[];
  artists: ArtistInfo[];
}

export async function searchAll(
  query: string,
  limit = 10,
  opts: RequestOptions = {}
): Promise<SearchAll> {
  const data = await request(
    "/api/search",
    { query, limit },
    { noStore: true, ...opts }
  );
  const d = (data ?? {}) as Record<string, unknown>;
  return {
    songs: dedupeSongs(
      withoutBlocked(extractList(d.songs ?? []).map(normalizeSong))
    ),
    albums: dedupeByName(
      withoutBlocked(extractList(d.albums ?? []).map(normalizeAlbum)),
      (album) => album.name,
      (album) => album.artists[0] ?? ""
    ),
    playlists: dedupeByName(
      withoutBlocked(extractList(d.playlists ?? []).map(normalizePlaylist)),
      (playlist) => playlist.name
    ),
    artists: dedupeByName(
      extractList(d.artists ?? []).map(normalizeArtist),
      (artist) => artist.name
    ),
  };
}

export async function getSong(id: string): Promise<Song | null> {
  if (id.startsWith("dz-")) {
    const song = await deezerGetSong(id);
    return song && !isBlockedLanguage(song.language) ? song : null;
  }
  const data = await request<Raw | Raw[]>("/api/songs/{id}", { id }, { revalidate: 3600 });
  const item = Array.isArray(data) ? data[0] : data;
  if (!item || typeof item !== "object") return null;
  const song = normalizeSong(item);
  return isBlockedLanguage(song.language) ? null : song;
}

export async function getSongs(ids: string[]): Promise<Song[]> {
  if (!ids.length) return [];
  const data = await request("/api/songs", { ids: ids.join(",") }, { revalidate: 3600 });
  return withoutBlocked(extractList(data).map(normalizeSong));
}

export async function getAlbum(id: string): Promise<Album | null> {
  const data = await request<Raw>("/api/albums/{id}", { id }, { revalidate: 3600 });
  if (!data || typeof data !== "object") return null;
  const album = normalizeAlbum(data);
  if (isBlockedLanguage(album.language)) return null;
  if (album.songs) {
    return { ...album, songs: withoutBlocked(album.songs) };
  }
  return album;
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  const data = await request<Raw>("/api/playlists/{id}", { id }, { revalidate: 3600 });
  if (!data || typeof data !== "object") return null;
  const playlist = normalizePlaylist(data);
  if (isBlockedLanguage(playlist.language)) return null;
  if (playlist.songs) {
    return { ...playlist, songs: withoutBlocked(playlist.songs) };
  }
  return playlist;
}

export async function getArtist(id: string): Promise<ArtistInfo | null> {
  const data = await request<Raw>("/api/artists/{id}", { id }, { revalidate: 3600 });
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
        { revalidate: 3600 }
      )
    )
  );
  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const song of withoutBlocked(extractList(r.value).map(normalizeSong))) {
      if (!seen.has(song.id)) {
        seen.add(song.id);
        all.push(song);
      }
    }
  }
  return dedupeSongs(all);
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
  const data = await request("/api/artists/{id}/albums", { id, ...params }, { revalidate: 3600 });
  return withoutBlocked(extractList(data).map(normalizeAlbum));
}

export async function getSongSuggestions(
  id: string,
  limit = 25
): Promise<Song[]> {
  const data = await request(
    "/api/songs/{id}/suggestions",
    { id, limit },
    { revalidate: 3600 }
  );
  return dedupeSongs(
    withoutBlocked(extractList(data).map(normalizeSong))
  );
}

export async function getLyrics(id: string): Promise<Lyrics | null> {
  const data = await request<Raw>("/api/lyrics/{id}", { id }, { revalidate: 3600 });
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
  return withoutBlocked(extractList(data).map(normalizeSong));
}

export async function getTrendingAlbums(limit = 20): Promise<Album[]> {
  const data = await request("/api/trending/albums", { limit }, { revalidate: 3600 });
  return withoutBlocked(extractList(data).map(normalizeAlbum));
}

export async function getTrendingPlaylists(limit = 20): Promise<Playlist[]> {
  const data = await request("/api/trending/playlists", { limit }, { revalidate: 3600 });
  return withoutBlocked(extractList(data).map(normalizePlaylist));
}

export async function getCharts(): Promise<Playlist[]> {
  const data = await request("/api/charts", undefined, { revalidate: 3600 });
  return withoutBlocked(extractList(data).map(normalizePlaylist));
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
