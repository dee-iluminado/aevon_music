import type { Metadata } from "next";
import Link from "next/link";
import { Disc3 } from "lucide-react";
import { Cover } from "@/components/cover";
import { PlayAll } from "@/components/detail/play-all";
import { SaveAlbumButton, detailPill } from "@/components/detail/entity-buttons";
import { ShareButton } from "@/components/share-button";
import { SongRow } from "@/components/song-row";
import { getAlbum, safe } from "@/lib/api";
import { formatDuration, joinArtists } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const album = await safe(getAlbum(id), null);
  if (!album) return { title: "Album not found" };
  return {
    title: album.name,
    description: `${album.name} by ${joinArtists(album.artists)} — ${
      album.songCount ?? album.songs?.length ?? 0
    } songs. Stream free on AEVON Music.`,
    openGraph: {
      title: album.name,
      images: album.image ? [{ url: album.image }] : undefined,
    },
  };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await safe(getAlbum(id), null);

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-28 text-center">
        <Disc3 className="h-10 w-10 text-zinc-600" />
        <h1 className="font-heading text-xl font-semibold text-fg">Album not found</h1>
        <p className="text-sm text-zinc-500">
          This album may no longer be available.
        </p>
        <Link
          href="/search"
          className="mt-2 text-sm font-medium text-accent transition hover:underline"
        >
          Search for something else
        </Link>
      </div>
    );
  }

  const songs = album.songs ?? [];
  const total = songs.reduce((a, s) => a + (s.duration || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
        <Cover
          src={album.image}
          alt={album.name}
          priority
          className="h-48 w-48 shrink-0 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,.7)] ring-1 ring-white/10 sm:h-56 sm:w-56"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Album
          </p>
          <h1 className="mt-2 break-words font-heading text-3xl font-semibold text-fg sm:text-5xl">
            {album.name}
          </h1>
          <p className="mt-3 text-sm text-zinc-400 sm:text-base">
            {joinArtists(album.artists) || "Various artists"}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
            {album.year && <span>{album.year}</span>}
            <span>{album.language}</span>
            <span>
              {songs.length} songs{total > 0 ? ` · ${formatDuration(total)}` : ""}
            </span>
          </p>
          {album.description && (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500">
              {album.description}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <PlayAll songs={songs} label="Play album" />
            <SaveAlbumButton album={album} />
            <ShareButton
              path={`/album/${album.id}`}
              title={album.name}
              text={`Listen to ${album.name} on AEVON Music`}
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
