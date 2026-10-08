import type { Metadata } from "next";
import Link from "next/link";
import { Mic2 } from "lucide-react";
import { Cover } from "@/components/cover";
import { Section } from "@/components/section";
import { SongRow } from "@/components/song-row";
import { AlbumCard } from "@/components/cards/album-card";
import { PlayAll } from "@/components/detail/play-all";
import {
  getArtist,
  getArtistAlbums,
  getArtistSongs,
  safe,
  searchSongs,
} from "@/lib/api";
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const artist = await safe(getArtist(id), null);
  if (!artist) return { title: "Artist not found" };
  return {
    title: artist.name,
    description: `Stream songs and albums by ${artist.name} — free on AEVON Music.`,
    openGraph: {
      title: artist.name,
      images: artist.image ? [{ url: artist.image }] : undefined,
    },
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artist = await safe(getArtist(id), null);

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-28 text-center">
        <Mic2 className="h-10 w-10 text-zinc-600" />
        <h1 className="font-heading text-xl font-semibold text-fg">Artist not found</h1>
        <p className="text-sm text-zinc-500">
          This artist may no longer be available.
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

  const [songs, albums] = await Promise.all([
    safe(getArtistSongs(id, 1, "latest", 3), []).then(async (list) =>
      list.length ? list : searchSongs(artist.name, 1, 20)
    ),
    safe(getArtistAlbums(id, 1, 30), []),
  ]);

  return (
    <div className="space-y-12">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:gap-8">
        <Cover
          src={artist.image}
          alt={artist.name}
          priority
          className="h-44 w-44 shrink-0 rounded-full shadow-[0_25px_60px_-15px_rgba(0,0,0,.7)] ring-2 ring-white/10 sm:h-52 sm:w-52"
          imgClassName="rounded-full"
        />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Artist
          </p>
          <h1 className="mt-2 break-words font-heading text-3xl font-semibold text-fg sm:text-5xl">
            {artist.name}
          </h1>
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-xs text-zinc-500 sm:justify-start">
            <span>{songs.length} songs</span>
            {albums.length > 0 && <span>{albums.length} albums</span>}
          </p>
          <div className="mt-6 flex justify-center sm:justify-start">
            <PlayAll songs={songs} label="Play top songs" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-fg sm:text-2xl">
          Popular songs
        </h2>
        <div className="space-y-0.5">
          {songs.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} context={songs} />
          ))}
        </div>
      </div>

      {albums.length > 0 && (
        <Section title="Albums" subtitle="Latest releases and classics">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </Section>
      )}
    </div>
  );
}
