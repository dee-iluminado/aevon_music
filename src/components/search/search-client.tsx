"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, SearchX } from "lucide-react";
import { SongRow } from "@/components/song-row";
import { AlbumCardGrid } from "@/components/cards/album-card";
import { PlaylistCard } from "@/components/cards/playlist-card";
import { ArtistCard } from "@/components/cards/artist-card";
import { RowSkeleton, SongCardSkeleton } from "@/components/ui/skeleton";
import { QUICK_SEARCHES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Album, ArtistInfo, Playlist, Song } from "@/lib/types";

type Tab = "songs" | "albums" | "playlists" | "artists";

const TABS: { id: Tab; label: string }[] = [
  { id: "songs", label: "Songs" },
  { id: "albums", label: "Albums" },
  { id: "playlists", label: "Playlists" },
  { id: "artists", label: "Artists" },
];

interface Results {
  songs?: Song[];
  albums?: Album[];
  playlists?: Playlist[];
  artists?: ArtistInfo[];
}

interface FetchState {
  q: string;
  tab: Tab;
  results: Results | null;
  error: boolean;
}

function isTab(value: string | null): value is Tab {
  return value === "songs" || value === "albums" || value === "playlists" || value === "artists";
}

export function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const urlTab = searchParams.get("type");

  const [query, setQuery] = useState(urlQuery);
  const [debounced, setDebounced] = useState(urlQuery);
  const [tab, setTab] = useState<Tab>(isTab(urlTab) ? urlTab : "songs");
  const [focused, setFocused] = useState(false);
  const [state, setState] = useState<FetchState | null>(null);
  const [synced, setSynced] = useState<{ q: string; tab: string | null }>({
    q: urlQuery,
    tab: urlTab,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep local state in sync when the URL changes underneath us (e.g. the
  // "See all" links on the home page navigate to /search?q=...).
  if (synced.q !== urlQuery || synced.tab !== urlTab) {
    setSynced({ q: urlQuery, tab: urlTab });
    setQuery(urlQuery);
    setDebounced(urlQuery);
    if (isTab(urlTab)) setTab(urlTab);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      const q = query.trim();
      setDebounced(q);
      if (q) {
        router.replace(`/search?q=${encodeURIComponent(q)}&type=${tab}`, {
          scroll: false,
        });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query, tab, router]);

  useEffect(() => {
    if (!debounced) return;
    let cancelled = false;
    fetch(`/api/search?q=${encodeURIComponent(debounced)}&type=${tab}`)
      .then((res) => {
        if (!res.ok) throw new Error("search failed");
        return res.json() as Promise<Results>;
      })
      .then((data) => {
        if (!cancelled) setState({ q: debounced, tab, results: data, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ q: debounced, tab, results: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, tab]);

  const loading = !!debounced && (state?.q !== debounced || state?.tab !== tab);
  const error = !loading && !!state && state.error === true;
  const results =
    !loading && !error && state?.q === debounced && state?.tab === tab
      ? state.results
      : null;

  const songs = results?.songs ?? [];
  const albums = results?.albums ?? [];
  const playlists = results?.playlists ?? [];
  const artists = results?.artists ?? [];

  let list: Song[] | Album[] | Playlist[] | ArtistInfo[];
  switch (tab) {
    case "songs":
      list = songs;
      break;
    case "albums":
      list = albums;
      break;
    case "playlists":
      list = playlists;
      break;
    case "artists":
      list = artists;
      break;
  }

  const hasSearched = !!debounced && !loading;
  const empty = hasSearched && !error && list.length === 0;

  return (
    <div className="space-y-6 pt-4">
      <div className={cn("search-glow mx-auto max-w-2xl", focused && "is-sweeping")} data-active={focused}>
        <div className="search-glow__layer search-glow__halo" aria-hidden />
        <div className="search-glow__layer search-glow__sweep" aria-hidden />
        <div className="search-glow__inner relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sub" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search songs, albums, playlists, artists…"
            className="h-12 w-full rounded-[28px] border border-line bg-panel-2/80 pl-12 pr-11 text-sm text-fg placeholder:text-dim outline-none transition-colors focus:bg-panel-2"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-accent" />
          )}
        </div>
      </div>

      {!debounced && (
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sub">
            Try searching for
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_SEARCHES.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="rounded-full border border-line bg-panel-2/80 px-4 py-1.5 text-sm text-fg/80 transition hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {debounced && (
        <div className="flex gap-1 overflow-x-auto rounded-full bg-panel-2/80 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                tab === t.id
                  ? "bg-accent text-white"
                  : "text-sub hover:text-white"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="space-y-1">
          {tab === "songs" ? (
            Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <SongCardSkeleton key={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <SearchX className="h-10 w-10 text-zinc-600" />
          <p className="text-sm text-zinc-400">Could not search right now.</p>
          <p className="text-xs text-zinc-600">
            The music API may be busy — please try again in a moment.
          </p>
        </div>
      )}

      {empty && !error && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <SearchX className="h-10 w-10 text-zinc-600" />
          <p className="text-sm text-zinc-400">
            No {tab} found for “{debounced}”.
          </p>
        </div>
      )}

      {hasSearched && !error && tab === "songs" && songs.length > 0 && (
        <div className="space-y-0.5">
          {songs.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} context={songs} />
          ))}
        </div>
      )}

      {hasSearched && !error && tab === "albums" && albums.length > 0 && (
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {albums.map((album) => (
            <AlbumCardGrid key={album.id} album={album} />
          ))}
        </div>
      )}

      {hasSearched && !error && tab === "playlists" && playlists.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}

      {hasSearched && !error && tab === "artists" && artists.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      )}
    </div>
  );
}
