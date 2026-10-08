"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Music2 } from "lucide-react";
import { Cover } from "@/components/cover";
import { useProgress } from "@/stores/progress-store";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Lyrics, Song } from "@/lib/types";

interface LyricsState {
  key: string;
  lyrics: Lyrics | null;
  error: boolean;
}

export function LyricsView({ song }: { song: Song | undefined }) {
  const current = useProgress((s) => s.current);
  const duration = useProgress((s) => s.duration);

  const [state, setState] = useState<LyricsState | null>(null);

  const songId = song?.id;
  const songTitle = song?.title;
  const songArtist = song?.artists?.[0];
  const songAlbum = song?.album;

  useEffect(() => {
    if (!songId) return;
    let cancelled = false;
    const q = new URLSearchParams({ id: songId });
    if (songTitle) q.set("title", songTitle);
    if (songArtist) q.set("artist", songArtist);
    if (songAlbum) q.set("album", songAlbum);
    if (duration) q.set("duration", String(Math.round(duration)));
    fetch(`/api/lyrics?${q.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("lyrics not found");
        return res.json() as Promise<Lyrics>;
      })
      .then((data) => {
        if (cancelled) return;
        setState({
          key: songId,
          lyrics: data && data.lyrics ? data : null,
          error: !(data && data.lyrics),
        });
      })
      .catch(() => !cancelled && setState({ key: songId, lyrics: null, error: true }));
    return () => {
      cancelled = true;
    };
  }, [songId, songTitle, songArtist, songAlbum, duration]);

  const currentKey = songId ?? "";
  const loading = !!songId && state?.key !== currentKey;
  const error = !loading && state?.error === true;
  const lyrics = !loading && !error ? (state?.lyrics ?? null) : null;

  const synced = lyrics?.synced;
  const displayLines = useMemo(() => {
    if (synced?.length) return synced.map((l) => l.text);
    const raw = lyrics?.lines?.length ? lyrics.lines : (lyrics?.lyrics ?? "").split("\n");
    return raw.map((l) => l.trim()).filter(Boolean);
  }, [synced, lyrics]);

  const activeIndex = useMemo(() => {
    if (!synced?.length) return -1;
    let idx = -1;
    for (let i = 0; i < synced.length; i++) {
      if (synced[i].time <= current) idx = i;
      else break;
    }
    return idx;
  }, [synced, current]);

  const activeRef = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex]);

  if (!song) return null;

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <Cover src={song.image} alt={song.title} className="h-10 w-10 shrink-0 rounded-md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{song.title}</p>
          <p className="truncate text-xs text-zinc-500">
            {song.artists.join(", ") || song.album}
          </p>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-3/4" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-zinc-500">
          <Music2 className="h-10 w-10" />
          <p className="text-sm">Lyrics are not available for this track.</p>
          <p className="text-xs">No matching lyrics found on LRC Lib or JioSaavn.</p>
        </div>
      )}

      {!loading && lyrics && (
        <div className="space-y-3">
          {displayLines.map((line, i) => (
            <p
              key={i}
              ref={i === activeIndex ? activeRef : undefined}
              className={cn(
                "text-[15px] leading-relaxed transition-colors duration-300",
                i === activeIndex ? "text-white" : "text-zinc-400"
              )}
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {line}
            </p>
          ))}
          {lyrics.copyright && (
            <p className="pt-4 text-xs text-zinc-600">{lyrics.copyright}</p>
          )}
        </div>
      )}
    </>
  );
}
