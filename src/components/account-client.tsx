"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Disc3,
  Download,
  Heart,
  ListMusic,
  Loader2,
  LogIn,
  LogOut,
  Mic2,
  Music2,
  Play,
  UserPlus,
} from "lucide-react";
import { clearAuth, getAuth, updateAvatar } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import { fileToAvatar } from "@/lib/avatar";
import { UserAvatar } from "@/components/user-avatar";
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
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    event.target.value = "";
    if (!file) return;
    setPhotoError(null);
    setPhotoBusy(true);
    try {
      const dataUrl = await fileToAvatar(file);
      const next = updateAvatar(dataUrl);
      if (!next) throw new Error("Could not save the photo on this device.");
      setUser(next);
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : "Could not use that image."
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoError(null);
    const next = updateAvatar(null);
    if (next) setUser(next);
  };

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
            <div className="flex flex-col items-center gap-1.5">
              <UserAvatar
                name={user.name}
                avatar={user.avatar}
                className="h-20 w-20 ring-1 ring-white/15"
                textClassName="text-2xl"
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhoto}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={photoBusy}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-sub transition-colors hover:text-fg disabled:opacity-60"
              >
                {photoBusy ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
                {photoBusy ? "Saving…" : user.avatar ? "Change photo" : "Add photo"}
              </button>
              {user.avatar && !photoBusy && (
                <button
                  onClick={handleRemovePhoto}
                  className="text-[11px] text-dim transition-colors hover:text-fg"
                >
                  Remove photo
                </button>
              )}
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

        {photoError && (
          <p className="relative mt-4 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">
            {photoError}
          </p>
        )}
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
