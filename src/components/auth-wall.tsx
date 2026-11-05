"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { Album } from "@/lib/types";

/**
 * Full-screen sign-in shell: form on the left, slowly drifting album covers on
 * the right. Mirrors the AEVON Movies auth wall.
 */
export function AuthWall({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    let cancelled = false;
    const queries = ["hits", "jazz", "latin"];
    Promise.all(
      queries.map((query) =>
        fetch(`/api/search?q=${encodeURIComponent(query)}&type=albums`)
          .then((res) =>
            res.ok ? (res.json() as Promise<{ albums?: Album[] }>) : null
          )
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return;
      const seen = new Set<string>();
      const all: Album[] = [];
      for (const result of results) {
        for (const album of result?.albums ?? []) {
          if (!album.id || !album.image || seen.has(album.id)) continue;
          seen.add(album.id);
          all.push(album);
        }
      }
      setAlbums(all);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const columns = useMemo(() => {
    const cols: Album[][] = [[], [], []];
    albums.forEach((album, index) => cols[index % 3].push(album));
    return cols;
  }, [albums]);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-bg text-fg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgb(var(--ember-rgb)/0.16),transparent_55%)]"
      />

      <Link
        href="/"
        aria-label="Close"
        className="absolute left-4 top-5 z-20 text-white/50 transition-colors hover:text-white md:left-8 md:top-11"
      >
        <X className="h-6 w-6" />
      </Link>

      <div className="relative z-10 flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
        <div className="relative flex w-full flex-col items-center justify-center overflow-y-auto px-6 py-16 lg:w-1/2 lg:px-12">
          <div className="w-full max-w-[380px]">{children}</div>
        </div>

        <div
          aria-hidden
          className="relative hidden flex-1 overflow-hidden lg:block"
        >
          <div className="absolute -inset-x-2 -inset-y-12 grid grid-cols-3 gap-3">
            {columns.map((column, index) => (
              <div
                key={index}
                className="auth-marquee flex flex-col gap-3"
                style={{
                  animationDuration: `${64 + index * 14}s`,
                  animationDelay: `-${index * 9}s`,
                }}
              >
                {[...column, ...column].map((album, itemIndex) => (
                  <div
                    key={`${album.id}-${itemIndex}`}
                    className="relative aspect-square overflow-hidden rounded-lg bg-panel-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={album.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover opacity-75"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-bg via-bg/40 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-bg to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
        </div>
      </div>
    </div>
  );
}
