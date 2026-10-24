"use client";

import { useMemo } from "react";
import { useLibrary } from "@/stores/library-store";
import { useMounted } from "@/hooks/use-mounted";
import { Section } from "@/components/section";
import { SongCard } from "@/components/cards/song-card";

export function TopTracksSection() {
  const mounted = useMounted();
  const recentlyPlayed = useLibrary((s) => s.recentlyPlayed);
  const playCounts = useLibrary((s) => s.playCounts);

  const topTracks = useMemo(() => {
    return [...recentlyPlayed]
      .filter((s) => playCounts?.[s.id])
      .sort((a, b) => (playCounts?.[b.id] ?? 0) - (playCounts?.[a.id] ?? 0))
      .slice(0, 14);
  }, [recentlyPlayed, playCounts]);

  if (!mounted || topTracks.length < 3) return null;
  return (
    <Section title="Your Top Tracks" subtitle="Songs you keep coming back to">
      {topTracks.map((song) => (
        <SongCard key={song.id} song={song} context={topTracks} />
      ))}
    </Section>
  );
}
