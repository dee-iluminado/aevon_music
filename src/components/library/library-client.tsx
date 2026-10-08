"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ListMusic, Plus, Clock } from "lucide-react";
import { SongRow } from "@/components/song-row";
import { PlaylistDialog } from "@/components/dialogs/playlist-dialog";
import { useLibrary } from "@/stores/library-store";
import { useMounted } from "@/hooks/use-mounted";
import { formatDuration } from "@/lib/utils";

export function LibraryClient() {
  const mounted = useMounted();
  const [dialogOpen, setDialogOpen] = useState(false);
  const favourites = useLibrary((s) => s.favourites);
  const playlists = useLibrary((s) => s.playlists);
  const recent = useLibrary((s) => s.recentlyPlayed);

  if (!mounted) return null;

  return (
    <div className="space-y-10">
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
