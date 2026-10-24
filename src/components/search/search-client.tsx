"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, SearchX } from "lucide-react";
import { SongRow } from "@/components/song-row";
import { AlbumCardGrid } from "@/components/cards/album-card";
import { PlaylistCard } from "@/components/cards/playlist-card";
import { ArtistCard } from "@/components/cards/artist-card";
import { RowSkeleton, SongCardSkeleton } from "@/components/ui/skeleton";
import { SearchTabs, isSearchTab, type SearchTabType } from "@/components/search/search-tabs";
import { QUICK_SEARCHES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Album, ArtistInfo, Playlist, Song } from "@/lib/types";

interface Results {
  songs?: Song[];
  albums?: Album[];
  playlists?: Playlist[];
  artists?: ArtistInfo[];
}

interface FetchState {
  q: string;
  tab: SearchTabType;
  results: Results | null;
  error: boolean;
}

interface SearchClientProps {
  initialQuery?: string;
  initialType?: string;
}

export function SearchClient({ initialQuery, initialType }: SearchClientProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? initialQuery ?? "";
  const urlTab = searchParams.get("type") ?? initialType;

  const [query, setQuery] = useState(urlQuery);
  const [debounced, setDebounced] = useState(urlQuery);
  const [tab, setTab] = useState<SearchTabType>(isSearchTab(urlTab) ? urlTab : "all");
  const [focused, setFocused] = useState(false);
  const [state, setState] = useState<FetchState | null>(null);
  const [synced, setSynced] = useState<{ q: string; tab: string | null | undefined }>({
    q: urlQuery,
    tab: urlTab,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep local state in sync when the URL changes underneath us (e.g. navigation or back/forward)
  if (synced.q !== urlQuery || synced.tab !== urlTab) {
    setSynced({ q: urlQuery, tab: urlTab });
    setQuery(urlQuery);
    setDebounced(urlQuery);
    setTab(isSearchTab(urlTab) ? urlTab : "all");
  }

  const handleTabChange = (newTab: SearchTabType) => {
    setTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    const q = (query || debounced).trim();
    if (q) {
      params.set("q", q);
    }
    if (newTab === "all") {
      params.delete("type");
    } else {
      params.set("type", newTab);
    }
    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`, {
      scroll: false,
    });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      const q = query.trim();
      setDebounced(q);
      if (q) {
        const params = new URLSearchParams();
        params.set("q", q);
        if (tab !== "all") {
          params.set("type", tab);
        }
        router.replace(`/search?${params.toString()}`, {
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

  const hasSearched = !!debounced && !loading;
  const hasAnyResults =
    songs.length > 0 || albums.length > 0 || playlists.length > 0 || artists.length > 0;

  const empty =
    hasSearched &&
    !error &&
    (tab === "all"
      ? !hasAnyResults
      : tab === "songs"
      ? songs.length === 0
      : tab === "albums"
      ? albums.length === 0
      : tab === "artists"
      ? artists.length === 0
      : playlists.length === 0);

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

      <div className="flex items-center justify-start overflow-x-auto pb-1 hide-scrollbar">
        <SearchTabs
          currentTab={tab}
          onTabChange={handleTabChange}
          query={debounced || query}
        />
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

      {loading && (
        <div className="space-y-8">
          {tab === "songs" ? (
            <div className="space-y-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : tab === "all" ? (
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="h-6 w-24 animate-pulse rounded bg-white/5" />
                <div className="space-y-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <RowSkeleton key={i} />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-6 w-24 animate-pulse rounded bg-white/5" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SongCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            </div>
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
            {tab === "all"
              ? `No results found for “${debounced}”.`
              : `No ${tab} found for “${debounced}”.`}
          </p>
        </div>
      )}

      {/* "All" tab - show all sections */}
      {hasSearched && !error && tab === "all" && hasAnyResults && (
        <div className="space-y-10">
          {songs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="mm-eyebrow-rule" aria-hidden />
                  <h2 className="font-heading text-lg font-semibold text-fg sm:text-xl">
                    Songs
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("songs")}
                  className="font-mono text-[10px] uppercase tracking-[0.22em] text-sub transition-colors hover:text-fg"
                >
                  See all
                </button>
              </div>
              <div className="space-y-0.5">
                {songs.map((song, i) => (
                  <SongRow key={song.id} song={song} index={i} context={songs} />
                ))}
              </div>
            </div>
          )}

          {albums.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="mm-eyebrow-rule" aria-hidden />
                  <h2 className="font-heading text-lg font-semibold text-fg sm:text-xl">
                    Albums
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("albums")}
                  className="font-mono text-[10px] uppercase tracking-[0.22em] text-sub transition-colors hover:text-fg"
                >
                  See all
                </button>
              </div>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {albums.map((album) => (
                  <AlbumCardGrid key={album.id} album={album} />
                ))}
              </div>
            </div>
          )}

          {artists.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="mm-eyebrow-rule" aria-hidden />
                  <h2 className="font-heading text-lg font-semibold text-fg sm:text-xl">
                    Artists
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("artists")}
                  className="font-mono text-[10px] uppercase tracking-[0.22em] text-sub transition-colors hover:text-fg"
                >
                  See all
                </button>
              </div>
              <div className="flex flex-wrap gap-4">
                {artists.map((artist) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            </div>
          )}

          {playlists.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="mm-eyebrow-rule" aria-hidden />
                  <h2 className="font-heading text-lg font-semibold text-fg sm:text-xl">
                    Playlists
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("playlists")}
                  className="font-mono text-[10px] uppercase tracking-[0.22em] text-sub transition-colors hover:text-fg"
                >
                  See all
                </button>
              </div>
              <div className="flex flex-wrap gap-4">
                {playlists.map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Specific tabs */}
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

      {hasSearched && !error && tab === "artists" && artists.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
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
    </div>
  );
}
