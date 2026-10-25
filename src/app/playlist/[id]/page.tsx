import type { Metadata } from "next";
import Link from "next/link";
import { ListMusic } from "lucide-react";
import { Cover } from "@/components/cover";
import { PlayAll } from "@/components/detail/play-all";
import { detailPill } from "@/components/detail/entity-buttons";
import { ShareButton } from "@/components/share-button";
import { SongRow } from "@/components/song-row";
import { getPlaylist, safe } from "@/lib/api";
import { formatCount, formatDuration } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const playlist = await safe(getPlaylist(id), null);
  if (!playlist) return { title: "Playlist not found" };
  return {
    title: playlist.name,
    description: `${playlist.name} — ${
      playlist.songCount ?? playlist.songs?.length ?? 0
    } songs. Stream free on AEVON Music.`,
    openGraph: {
      title: playlist.name,
      images: playlist.image ? [{ url: playlist.image }] : undefined,
    },
  };
}

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const playlist = await safe(getPlaylist(id), null);

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-28 text-center">
        <ListMusic className="h-10 w-10 text-zinc-600" />
        <h1 className="font-heading text-xl font-semibold text-fg">Playlist not found</h1>
        <p className="text-sm text-zinc-500">
          This playlist may no longer be available.
        </p>
        <Link
          href="/"
          className="mt-2 text-sm font-medium text-accent transition hover:underline"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const songs = playlist.songs ?? [];
  const total = songs.reduce((a, s) => a + (s.duration || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
        <Cover
          src={playlist.image}
          alt={playlist.name}
          priority
          className="h-48 w-48 shrink-0 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,.7)] ring-1 ring-white/10 sm:h-56 sm:w-56"
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            <ListMusic className="h-4 w-4" />
            Playlist
          </p>
          <h1 className="mt-2 break-words font-heading text-3xl font-semibold text-fg sm:text-5xl">
            {playlist.name}
          </h1>
          {playlist.subtitle && (
            <p className="mt-3 text-sm text-zinc-400 sm:text-base">
              {playlist.subtitle}
            </p>
          )}
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
            <span>
              {songs.length} songs{total > 0 ? ` · ${formatDuration(total)}` : ""}
            </span>
            {playlist.followerCount ? (
              <span>{formatCount(playlist.followerCount)} followers</span>
            ) : null}
            {playlist.language && <span>{playlist.language}</span>}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <PlayAll songs={songs} label="Play playlist" />
            <ShareButton
              path={`/playlist/${playlist.id}`}
              title={playlist.name}
              text={`Listen to ${playlist.name} on AEVON Music`}
              label="Share"
              className={detailPill}
            />
          </div>
        </div>
      </div>

      <div className="space-y-0.5">
        {songs.map((song, i) => (
          <SongRow key={song.id} song={song} index={i} context={songs} />
        ))}
      </div>
    </div>
  );
}
