"use client";

import { useEffect, useState } from "react";
import { Section } from "@/components/section";
import { SongCard } from "@/components/cards/song-card";
import { useLibrary } from "@/stores/library-store";
import { useMounted } from "@/hooks/use-mounted";
import type { Song } from "@/lib/types";

const CACHE_PREFIX = "aevon-foryou-v1";
const LIMIT = 14;

/**
 * A lightweight "Made for you" rail. It seeds suggestions from the last song
 * the listener played (or their newest favourite) using the existing free
 * suggestions endpoint, then caches the result per seed for the session.
 */
export function ForYouSection() {
  const mounted = useMounted();
  const recent = useLibrary((s) => s.recentlyPlayed);
  const favourites = useLibrary((s) => s.favourites);
  const [songs, setSongs] = useState<Song[]>([]);

  const seed = recent[0] ?? favourites[0];
  const seedId = seed?.id ?? "";

  useEffect(() => {
    if (!seedId) {
      setSongs([]);
      return;
    }

    const cacheKey = `${CACHE_PREFIX}:${seedId}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setSongs(JSON.parse(cached) as Song[]);
        return;
      }
    } catch {
      /* storage unavailable — just fetch */
    }

    let cancelled = false;
    fetch(`/api/suggestions?id=${encodeURIComponent(seedId)}`)
      .then((res) => (res.ok ? res.json() : { songs: [] }))
      .then((data: { songs?: Song[] }) => {
        if (cancelled) return;
        const library = useLibrary.getState();
        const exclude = new Set([
          ...library.favourites.map((song) => song.id),
          ...library.recentlyPlayed.slice(0, 10).map((song) => song.id),
        ]);
        const list = (data.songs ?? [])
          .filter((song) => song.id && !exclude.has(song.id))
          .slice(0, LIMIT);
        setSongs(list);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(list));
        } catch {
          /* ignore quota errors */
        }
      })
      .catch(() => {
        /* suggestions are optional */
      });

    return () => {
      cancelled = true;
    };
  }, [seedId]);

  if (!mounted || songs.length === 0) return null;

  return (
    <Section
      title="Made for you"
      subtitle={
        seed ? `Because you listened to ${seed.title}` : "Picked from your taste"
      }
    >
      {songs.map((song) => (
        <SongCard key={song.id} song={song} context={songs} />
      ))}
    </Section>
  );
}
