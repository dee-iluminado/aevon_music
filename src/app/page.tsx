import type { Metadata } from "next";
import { Section } from "@/components/section";
import { SongCard } from "@/components/cards/song-card";
import { PlaylistCard } from "@/components/cards/playlist-card";
import { AlbumCard } from "@/components/cards/album-card";
import { SongCardSkeleton } from "@/components/ui/skeleton";
import { LikedSongsCard } from "@/components/home/liked-songs-card";
import { RecentlyPlayedSection } from "@/components/home/recently-played-section";
import { TopTracksSection } from "@/components/home/top-tracks-section";
import {
  getEnglishHomeSongs,
  safe,
  searchAlbums,
  searchPlaylists,
} from "@/lib/api";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${APP_NAME} — Free Music Streaming`,
  description:
    "Stream and download high-quality songs from the JioSaavn catalog. Trending now, top charts, new releases and editorial playlists.",
};

export const revalidate = 3600;

export default async function HomePage() {
  const [
    songs,
    albums,
    playlists,
    chillPlaylists,
    partyPlaylists,
    focusPlaylists,
  ] = await Promise.all([
    safe(getEnglishHomeSongs(14), []),
    safe(searchAlbums("english", 1, 24), [])
      .then((list) => list.filter((a) => a.language === "english")),
    safe(searchPlaylists("english", 1, 24), [])
      .then((list) => list.filter((p) => p.language === "english")),
    safe(searchPlaylists("chill lofi", 1, 14), []),
    safe(searchPlaylists("party hits", 1, 14), []),
    safe(searchPlaylists("focus study", 1, 14), []),
  ]);

  const loading =
    !songs.length &&
    !albums.length &&
    !playlists.length &&
    !chillPlaylists.length &&
    !partyPlaylists.length &&
    !focusPlaylists.length;

  return (
    <div className="space-y-14 pb-6">
      <RecentlyPlayedSection />
      <TopTracksSection />
      <LikedSongsCard />

      {loading ? (
        <div className="space-y-12">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-4">
              <div className="h-7 w-48 animate-pulse rounded-lg bg-white/5" />
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 5 }).map((_, j) => (
                  <SongCardSkeleton key={j} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {songs.length > 0 && (
            <Section
              title="Trending English songs"
              subtitle="What English listeners are streaming"
              href="/search?q=top%20charts&type=songs"
            >
              {songs.slice(0, 14).map((song) => (
                <SongCard key={song.id} song={song} context={songs} />
              ))}
            </Section>
          )}

          {albums.length > 0 && (
            <Section
              title="New English albums"
              subtitle="Latest English album releases"
              href="/search?q=english&type=albums"
            >
              {albums.slice(0, 14).map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </Section>
          )}

          {playlists.length > 0 && (
            <Section
              title="English playlists"
              subtitle="Curated English mixes"
              href="/search?q=english&type=playlists"
            >
              {playlists.slice(0, 14).map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </Section>
          )}

          {chillPlaylists.length > 0 && (
            <Section
              title="Chill & Lofi"
              subtitle="Laid-back beats and relaxing vibes"
              href="/search?q=chill%20lofi&type=playlists"
            >
              {chillPlaylists.slice(0, 14).map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </Section>
          )}

          {partyPlaylists.length > 0 && (
            <Section
              title="Party Hits"
              subtitle="High-energy tracks for your celebration"
              href="/search?q=party%20hits&type=playlists"
            >
              {partyPlaylists.slice(0, 14).map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </Section>
          )}

          {focusPlaylists.length > 0 && (
            <Section
              title="Focus & Study"
              subtitle="Deep concentration and ambient sounds"
              href="/search?q=focus%20study&type=playlists"
            >
              {focusPlaylists.slice(0, 14).map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </Section>
          )}

          {songs.length === 0 && (
            <p className="py-10 text-center text-sm text-zinc-500">
              Could not load English music right now — try again in a moment.
            </p>
          )}
        </>
      )}
    </div>
  );
}
