import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Mic2 } from "lucide-react";
import { Cover } from "@/components/cover";
import { PlayAll } from "@/components/detail/play-all";
import { SongActions } from "@/components/detail/song-actions";
import { LyricsBlock } from "@/components/detail/lyrics-block";
import { Section } from "@/components/section";
import { SongCard } from "@/components/cards/song-card";
import { getLyrics, getSong, getSongSuggestions, safe } from "@/lib/api";
import { formatCount, formatDuration, joinArtists } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const song = await safe(getSong(id), null);
  if (!song) {
    return { title: "Song not found" };
  }
  return {
    title: `${song.title} — ${joinArtists(song.artists)}`,
    description: `Listen to ${song.title} by ${joinArtists(
      song.artists
    )} on AEVON Music. ${formatDuration(song.duration)} · Free streaming.`,
    openGraph: {
      title: `${song.title} — ${joinArtists(song.artists)}`,
      images: song.image ? [{ url: song.image }] : undefined,
    },
  };
}

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [song, suggestions, lyrics] = await Promise.all([
    safe(getSong(id), null),
    safe(getSongSuggestions(id, 20), []),
    safe(getLyrics(id), null),
  ]);

  if (!song) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-28 text-center">
        <Mic2 className="h-10 w-10 text-zinc-600" />
        <h1 className="font-heading text-xl font-semibold text-fg">Song not found</h1>
        <p className="text-sm text-zinc-500">
          This track may have been removed from the catalog.
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

  const context = suggestions.length ? [song, ...suggestions] : [song];
  const lyricsLines = lyrics?.lines?.length ? lyrics.lines : [];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
        <Cover
          src={song.image}
          alt={song.title}
          priority
          className="h-48 w-48 shrink-0 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,.7)] ring-1 ring-white/10 sm:h-56 sm:w-56"
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {song.language || "Track"}
            {song.hasLyrics && <BadgeCheck className="h-4 w-4" />}
          </p>
          <h1 className="mt-2 break-words font-heading text-3xl font-semibold text-fg sm:text-5xl">
            {song.title}
          </h1>
          <p className="mt-3 text-sm text-zinc-400 sm:text-base">
            {joinArtists(song.artists) || "Various artists"}
            {song.album ? (
              <>
                {" · "}
                {song.albumId ? (
                  <Link
                    href={`/album/${song.albumId}`}
                    className="font-medium text-zinc-200 transition hover:text-accent"
                  >
                    {song.album}
                  </Link>
                ) : (
                  <span className="font-medium text-zinc-200">
                    {song.album}
                  </span>
                )}
              </>
            ) : null}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
            {song.year && <span>{song.year}</span>}
            <span>{formatDuration(song.duration)}</span>
            {song.playCount ? (
              <span>{formatCount(song.playCount)} plays</span>
            ) : null}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PlayAll songs={[song]} label="Play" />
            <SongActions song={song} context={context} />
          </div>
        </div>
      </div>

      {lyricsLines.length > 0 && (
        <LyricsBlock
          lines={lyricsLines}
          title={`${song.title} — ${joinArtists(song.artists)}`}
        />
      )}

      {suggestions.length > 0 && (
        <Section title="Similar songs" subtitle="Tracks you might also like">
          {suggestions.map((s) => (
            <SongCard key={s.id} song={s} context={suggestions} />
          ))}
        </Section>
      )}
    </div>
  );
}
