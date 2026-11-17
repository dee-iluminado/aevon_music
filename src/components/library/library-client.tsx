"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Disc3,
  Download,
  Heart,
  ListMusic,
  Mic2,
  Plus,
  Upload,
} from "lucide-react";
import { Cover } from "@/components/cover";
import { SongRow } from "@/components/song-row";
import { PlaylistDialog } from "@/components/dialogs/playlist-dialog";
import { Button } from "@/components/ui/button";
import { useLibrary, type UserPlaylist } from "@/stores/library-store";
import { useMounted } from "@/hooks/use-mounted";
import {
  countBackupSongs,
  createBackup,
  describeMerge,
  downloadBackup,
  mergeLibrary,
  parseBackup,
  type LibraryData,
} from "@/lib/library-backup";
import { formatDuration } from "@/lib/utils";
import type { Album, ArtistInfo, Song } from "@/lib/types";

type Notice = { kind: "ok" | "error"; text: string };

/* Stable empties so the prerendered page and the first client render match. */
const EMPTY_SONGS: Song[] = [];
const EMPTY_PLAYLISTS: UserPlaylist[] = [];
const EMPTY_ALBUMS: Album[] = [];
const EMPTY_ARTISTS: ArtistInfo[] = [];
const EMPTY_COUNTS: Record<string, number> = {};

export function LibraryClient() {
  const mounted = useMounted();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const storedFavourites = useLibrary((s) => s.favourites);
  const storedPlaylists = useLibrary((s) => s.playlists);
  const storedDownloads = useLibrary((s) => s.downloads);
  const storedRecent = useLibrary((s) => s.recentlyPlayed);
  const storedAlbums = useLibrary((s) => s.albums);
  const storedArtists = useLibrary((s) => s.artists);
  const storedPlayCounts = useLibrary((s) => s.playCounts);

  /*
   * The page is prerendered before the browser has any saved library, so the
   * first paint has to show the same empty state on the server and in the
   * browser. Rendering `null` until mount used to leave /library blank on a
   * cold load (the prerendered page segment was empty), so the shell always
   * renders and the saved data appears on the frame after hydration.
   */
  const favourites = mounted ? storedFavourites : EMPTY_SONGS;
  const playlists = mounted ? storedPlaylists : EMPTY_PLAYLISTS;
  const recent = mounted ? storedRecent : EMPTY_SONGS;
  const albums = mounted ? storedAlbums : EMPTY_ALBUMS;
  const artists = mounted ? storedArtists : EMPTY_ARTISTS;
  const playCounts = mounted ? storedPlayCounts : EMPTY_COUNTS;

  function currentLibrary(): LibraryData {
    return {
      favourites: storedFavourites,
      playlists: storedPlaylists,
      downloads: storedDownloads,
      recentlyPlayed: storedRecent,
      albums: storedAlbums,
      artists: storedArtists,
      playCounts: storedPlayCounts,
    };
  }

  function handleExport() {
    const backup = createBackup(currentLibrary());
    const filename = downloadBackup(backup);
    setNotice({
      kind: "ok",
      text: `Backup saved as ${filename}.`,
    });
  }

  async function handleImport(file: File) {
    setBusy(true);
    setNotice(null);
    try {
      const backup = parseBackup(await file.text());
      const { data, added } = mergeLibrary(currentLibrary(), backup.data);
      useLibrary.setState(data);

      const summary = describeMerge(added);
      const total = countBackupSongs(backup);
      setNotice({
        kind: "ok",
        text: summary
          ? `Imported ${summary}.`
          : total === 0
            ? "That backup is empty — nothing to import."
            : `Nothing new — all ${total} songs from that file are already in your library.`,
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not read that backup file.",
      });
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const stats = useMemo(() => {
    const byId = new Map<string, Song>();
    for (const song of [
      ...favourites,
      ...recent,
      ...playlists.flatMap((p) => p.songs),
    ]) {
      if (!byId.has(song.id)) byId.set(song.id, song);
    }

    const entries = Object.entries(playCounts)
      .filter(([id]) => byId.has(id))
      .sort((a, b) => b[1] - a[1]);

    return {
      totalPlays: Object.values(playCounts).reduce((sum, n) => sum + n, 0),
      uniqueTracks: Object.keys(playCounts).length,
      top: entries
        .slice(0, 5)
        .map(([id, count]) => ({ song: byId.get(id) as Song, count })),
    };
  }, [favourites, recent, playlists, playCounts]);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-line/70 bg-panel/60 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold text-fg sm:text-xl">
              Move your library
            </h2>
            <p className="mt-1 text-xs text-sub sm:text-sm">
              Save your favourites, playlists and history as a JSON file, then
              import it on another device. Downloads copy across as entries only
              — the audio itself stays streamed.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
            >
              <Upload className="h-4 w-4" />
              {busy ? "Importing…" : "Import JSON"}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImport(file);
              }}
            />
          </div>
        </div>
        {notice && (
          <p
            role="status"
            className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs sm:text-sm ${
              notice.kind === "ok"
                ? "border-success/25 bg-success/10 text-success"
                : "border-danger/30 bg-danger/10 text-danger"
            }`}
          >
            {notice.kind === "ok" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span className="min-w-0 break-words">{notice.text}</span>
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-fg sm:text-2xl">
            <Heart className="h-5 w-5 fill-accent text-accent" />
            Favourites
            {favourites.length > 0 && (
              <span className="text-sm font-normal text-zinc-500">
                {favourites.length} songs
              </span>
            )}
          </h2>
          {favourites.length > 0 && (
            <Link
              href="/downloads"
              className="text-sm font-medium text-zinc-400 transition hover:text-accent"
            >
              Downloads →
            </Link>
          )}
        </div>
        {favourites.length === 0 ? (
          <EmptyLibrary
            icon={<Heart className="h-8 w-8 text-zinc-600" />}
            title="No favourites yet"
            subtitle="Tap the heart on any song to save it here."
          />
        ) : (
          <div className="space-y-0.5">
            {favourites.map((song, i) => (
              <SongRow key={song.id} song={song} index={i} context={favourites} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-fg sm:text-2xl">
            <ListMusic className="h-5 w-5 text-accent" />
            Your playlists
            {playlists.length > 0 && (
              <span className="text-sm font-normal text-zinc-500">
                {playlists.length} playlists
              </span>
            )}
          </h2>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
          >
            <Plus className="h-4 w-4" />
            New playlist
          </button>
        </div>
        {playlists.length === 0 ? (
          <EmptyLibrary
            icon={<ListMusic className="h-8 w-8 text-zinc-600" />}
            title="No playlists yet"
            subtitle="Create a playlist to start curating your own mixes."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {playlists.map((p) => {
              const total = p.songs.reduce((a, s) => a + (s.duration || 0), 0);
              return (
                <Link
                  key={p.id}
                  href={`/library/playlists/${p.id}`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-accent/40 hover:bg-white/[0.06]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 text-accent">
                    <ListMusic className="h-6 w-6" />
                  </div>
                  <p className="mt-3 truncate text-sm font-semibold text-white group-hover:text-accent">
                    {p.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {p.songs.length} songs{total > 0 ? ` · ${formatDuration(total)}` : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {albums.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-fg sm:text-2xl">
            <Disc3 className="h-5 w-5 text-accent" />
            Saved albums
            <span className="text-sm font-normal text-zinc-500">
              {albums.length}
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/album/${album.id}`}
                className="group block"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl border border-line/60 bg-panel">
                  <Cover
                    src={album.image}
                    alt={album.name}
                    className="absolute inset-0 transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-2 truncate text-sm font-medium text-fg group-hover:text-accent">
                  {album.name}
                </p>
                <p className="truncate text-xs text-sub">
                  {album.artists.join(", ")}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {artists.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-fg sm:text-2xl">
            <Mic2 className="h-5 w-5 text-accent" />
            Artists you follow
            <span className="text-sm font-normal text-zinc-500">
              {artists.length}
            </span>
          </h2>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artist/${artist.id}`}
                className="group flex flex-col items-center text-center"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-full border border-line/60 bg-panel">
                  <Cover
                    src={artist.image}
                    alt={artist.name}
                    className="absolute inset-0 transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-2 w-full truncate text-sm font-medium text-fg group-hover:text-accent">
                  {artist.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {stats.totalPlays > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-fg sm:text-2xl">
            <BarChart3 className="h-5 w-5 text-accent" />
            Listening stats
          </h2>
          <div className="grid gap-4 rounded-2xl border border-line/70 bg-panel/60 p-5 sm:grid-cols-[auto_1fr] sm:gap-8">
            <div className="flex gap-8 sm:flex-col sm:gap-4">
              <div>
                <p className="font-heading text-2xl font-semibold text-fg">
                  {stats.totalPlays.toLocaleString()}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sub">
                  Plays
                </p>
              </div>
              <div>
                <p className="font-heading text-2xl font-semibold text-fg">
                  {stats.uniqueTracks.toLocaleString()}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sub">
                  Tracks
                </p>
              </div>
            </div>
            {stats.top.length > 0 && (
              <div className="min-w-0 space-y-1.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sub">
                  Most played
                </p>
                {stats.top.map(({ song, count }, i) => (
                  <div key={song.id} className="flex items-center gap-3">
                    <span className="w-4 shrink-0 text-right font-mono text-xs text-dim">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-fg">{song.title}</p>
                      <p className="truncate text-xs text-sub">
                        {song.artists.join(", ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-sub">
                      {count}×
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-fg sm:text-2xl">
            <Clock className="h-5 w-5 text-accent" />
            Recently played
          </h2>
          <div className="space-y-0.5">
            {recent.slice(0, 20).map((song, i) => (
              <SongRow key={song.id} song={song} index={i} context={recent} showIndex={false} />
            ))}
          </div>
        </section>
      )}

      <PlaylistDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}

function EmptyLibrary({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 py-16 text-center">
      {icon}
      <p className="mt-1 text-sm font-semibold text-zinc-300">{title}</p>
      <p className="max-w-xs text-xs text-zinc-500">{subtitle}</p>
    </div>
  );
}
