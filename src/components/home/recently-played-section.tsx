"use client";

import { useLibrary } from "@/stores/library-store";
import { useMounted } from "@/hooks/use-mounted";
import { Section } from "@/components/section";
import { SongCard } from "@/components/cards/song-card";

export function RecentlyPlayedSection() {
  const mounted = useMounted();
  const recent = useLibrary((s) => s.recentlyPlayed);
  if (!mounted || recent.length === 0) return null;
  return (
    <Section title="Recently Played" subtitle="Pick up where you left off">
      {recent.slice(0, 14).map((song) => (
        <SongCard key={song.id} song={song} context={recent} />
      ))}
    </Section>
  );
}
