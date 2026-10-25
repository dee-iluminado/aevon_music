import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Music2, Sparkles } from "lucide-react";
import { Section } from "@/components/section";
import { PlaylistCard } from "@/components/cards/playlist-card";
import { safe, searchPlaylists } from "@/lib/api";
import { APP_NAME, LANGUAGES } from "@/lib/constants";
import type { Playlist } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Browse",
  description:
    "Browse music by language or mood — English, Punjabi, Tamil, Telugu, Malayalam and more. Free streaming on AEVON Music.",
};

const MOODS = [
  { label: "Romantic", query: "romantic hits" },
  { label: "Party", query: "party hits" },
  { label: "Chill", query: "chill" },
  { label: "Lofi", query: "lofi" },
  { label: "Workout", query: "workout" },
  { label: "Sleep", query: "sleep" },
  { label: "Sad", query: "sad songs" },
  { label: "Devotional", query: "devotional" },
  { label: "Retro", query: "retro hits" },
  { label: "Indie", query: "indie" },
] as const;

const TILE =
  "group relative flex h-24 flex-col justify-end overflow-hidden rounded-xl border border-line/70 bg-gradient-to-br from-panel-2 via-panel to-panel p-4 transition hover:border-accent/40 hover:from-accent/15 hover:to-panel sm:h-28";

export default async function BrowsePage() {
  const lists = await Promise.all(
    ["romantic hits", "party hits", "chill", "lofi"].map((query) =>
      safe(searchPlaylists(query, 1, 10), [])
    )
  );

  const seen = new Set<string>();
  const playlists: Playlist[] = [];
  for (const playlist of lists.flat()) {
    if (!playlist.id || seen.has(playlist.id)) continue;
    seen.add(playlist.id);
    playlists.push(playlist);
  }

  return (
    <div className="space-y-12 pb-6">
      <header className="space-y-2">
        <p className="mm-eyebrow flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-sub">
          <Compass className="h-3.5 w-3.5" />
          Explore
        </p>
        <h1 className="font-heading text-2xl font-semibold text-fg sm:text-3xl">
          Browse {APP_NAME}
        </h1>
        <p className="max-w-xl text-sm text-sub">
          Pick a language or a mood and we&apos;ll take it from there. Everything
          is free to stream.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-fg sm:text-xl">
          <Music2 className="h-4.5 w-4.5 text-accent" />
          Languages
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {LANGUAGES.map((lang) => (
            <Link
              key={lang.value}
              href={`/search?q=${encodeURIComponent(lang.label)}&type=songs`}
              className={TILE}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgb(var(--ember-rgb)/.16),transparent_70%)] opacity-0 transition-opacity group-hover:opacity-100"
              />
              <span className="relative text-base font-semibold text-fg group-hover:text-white">
                {lang.label}
              </span>
              <span className="relative mt-0.5 text-xs text-sub">
                Popular {lang.label} songs
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-fg sm:text-xl">
          <Sparkles className="h-4.5 w-4.5 text-accent" />
          Moods &amp; moments
        </h2>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((mood) => (
            <Link
              key={mood.label}
              href={`/search?q=${encodeURIComponent(mood.label)}&type=songs`}
              className="rounded-full border border-line bg-panel-2/80 px-4 py-2 text-sm text-fg/85 transition hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
            >
              {mood.label}
            </Link>
          ))}
        </div>
      </section>

      {playlists.length > 0 && (
        <Section
          title="Made for these moods"
          subtitle="Playlists picked to match your vibe"
          href="/search?q=playlists&type=playlists"
        >
          {playlists.slice(0, 14).map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </Section>
      )}
    </div>
  );
}
