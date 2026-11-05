"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Disc3,
  Download,
  Heart,
  ListMusic,
  LogIn,
  LogOut,
  Mic2,
  Music2,
  Play,
  UserPlus,
} from "lucide-react";
import { accountInitial, clearAuth, getAuth } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import { useLibrary } from "@/stores/library-store";
import { useMounted } from "@/hooks/use-mounted";

const primaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-fg px-5 text-[13px] font-semibold text-bg transition-colors hover:bg-white";
const secondaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-5 text-[13px] font-medium text-fg transition-colors hover:bg-white/5";

function formatJoined(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function AccountClient() {
  const router = useRouter();
  const mounted = useMounted();
  const [user, setUser] = useState<AuthUser | null>(null);

  const favourites = useLibrary((s) => s.favourites);
  const playlists = useLibrary((s) => s.playlists);
  const downloads = useLibrary((s) => s.downloads);
  const albums = useLibrary((s) => s.albums);
  const artists = useLibrary((s) => s.artists);
  const playCounts = useLibrary((s) => s.playCounts);

  useEffect(() => {
    setUser(getAuth());
    const onAuth = () => setUser(getAuth());
    window.addEventListener("aevon-auth", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("aevon-auth", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, []);

  const totalPlays = useMemo(
    () => Object.values(playCounts).reduce((sum, n) => sum + n, 0),
    [playCounts]
  );

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-panel-2 text-ember ring-1 ring-white/10">
          <Music2 className="h-7 w-7" />
        </div>
        <h1 className="font-heading text-3xl leading-tight text-fg">
          You&apos;re not signed in
        </h1>
        <p className="mt-3 text-sm text-sub">
          Sign in to keep your favourites, playlists and downloads together on
          this device.
        </p>
        <div className="mt-8 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link href="/login" className={primaryButton}>
            <LogIn className="h-4 w-4" />
            Sign in
          </Link>
          <Link href="/signup" className={secondaryButton}>
            <UserPlus className="h-4 w-4" />
            Create account
          </Link>
        </div>
        <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.24em] text-dim">
          Your account stays on this device
        </p>
      </div>
    );
  }

  const stats = [
    { label: "Favourites", value: favourites.length, icon: Heart },
    { label: "Playlists", value: playlists.length, icon: ListMusic },
    { label: "Downloads", value: downloads.length, icon: Download },
    { label: "Total plays", value: totalPlays, icon: Play },
    { label: "Saved albums", value: albums.length, icon: Disc3 },
    { label: "Artists followed", value: artists.length, icon: Mic2 },
  ];

  return (
    <div className="space-y-8 py-4">
      <section className="relative overflow-hidden rounded-2xl border border-line/80 bg-panel/60 p-6 backdrop-blur-md sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgb(var(--ember-rgb)/0.16),transparent_55%)]"
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-panel-2 text-xl font-semibold text-fg ring-1 ring-white/10">
              {accountInitial(user.name)}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-ember">
                Your account
              </p>
              <h1 className="mt-1 truncate font-heading text-3xl leading-tight text-fg">
                {user.name}
              </h1>
              <p className="mt-1 truncate text-sm text-sub">{user.email}</p>
              <p className="mt-1 font-mono text-[10px] tracking-wide text-dim">
                Member since {formatJoined(user.signedUpAt)}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              clearAuth();
              router.refresh();
            }}
            className={secondaryButton}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-fg sm:text-2xl">
          Your listening
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-line/80 bg-white/[0.03] p-4"
              >
                <Icon className="h-4 w-4 text-ember" />
                <p className="mt-3 font-heading text-2xl leading-none text-fg">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-xs text-sub">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/library"
          className="group flex items-center justify-between gap-4 rounded-xl border border-line/80 bg-white/[0.03] p-5 transition-colors hover:border-ember/40 hover:bg-white/[0.06]"
        >
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-fg">
              <Heart className="h-4 w-4 text-ember" />
              Favourites & playlists
            </p>
            <p className="mt-1 text-xs text-sub">
              {favourites.length} favourites · {playlists.length} playlists
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
        </Link>

        <Link
          href="/downloads"
          className="group flex items-center justify-between gap-4 rounded-xl border border-line/80 bg-white/[0.03] p-5 transition-colors hover:border-ember/40 hover:bg-white/[0.06]"
        >
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-fg">
              <Download className="h-4 w-4 text-ember" />
              Downloads
            </p>
            <p className="mt-1 text-xs text-sub">
              {downloads.length} {downloads.length === 1 ? "song" : "songs"}{" "}
              saved for offline
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
        </Link>
      </section>

      <p className="text-center font-mono text-[9px] uppercase tracking-[0.24em] text-dim">
        Your account stays on this device
      </p>
    </div>
  );
}
