"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ListMusic, Menu, Plus, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { PlaylistDialog } from "@/components/dialogs/playlist-dialog";
import { useLibrary } from "@/stores/library-store";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    key: "home",
    label: "Home",
    href: "/",
    match: (p: string) => p === "/",
  },
  {
    key: "library",
    label: "Favourites",
    href: "/library",
    match: (p: string) => p.startsWith("/library"),
  },
  {
    key: "downloads",
    label: "Downloads",
    href: "/downloads",
    match: (p: string) => p.startsWith("/downloads"),
  },
] as const;

const navLinkClass =
  "relative z-10 inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fg/40";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();
  const playlists = useLibrary((s) => s.playlists);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const navRef = useRef<HTMLDivElement>(null);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  const measure = useCallback(() => {
    const active = NAV_ITEMS.find((l) => l.match(pathname)) ?? NAV_ITEMS[0];
    const el = linkRefs.current[active.key];
    const container = navRef.current;
    if (!el || !container) return;
    setIndicator({
      left: el.offsetLeft,
      width: el.offsetWidth,
      opacity: 1,
    });
  }, [pathname]);

  useEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(measure);
    if (navRef.current) ro.observe(navRef.current);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [measure]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const navItems = NAV_ITEMS.map((item) => (
    <Link
      key={item.key}
      ref={(el) => {
        linkRefs.current[item.key] = el;
      }}
      href={item.href}
      data-nav-key={item.key}
      className={cn(
        navLinkClass,
        item.match(pathname) ? "text-fg" : "text-sub hover:text-fg"
      )}
    >
      {item.label}
    </Link>
  ));

  const iconBtn =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sub transition-colors hover:bg-fg/5 hover:text-fg";

  return (
    <div className="relative min-h-screen bg-bg">
      <header className="sticky top-0 z-40 px-4 pb-2 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center justify-center">
          {/* Desktop pill */}
          <div className="mm-glass-pill hidden items-center gap-1 rounded-full p-1 pl-2 md:flex">
            <Link
              href="/"
              aria-label="AEVON Music home"
              className="flex h-9 items-center rounded-full px-1 transition-opacity hover:opacity-80"
            >
              <Logo className="[&>span]:text-sm" />
            </Link>

            <span aria-hidden className="mx-1 h-5 w-px bg-line/60" />

            <div ref={navRef} className="relative flex items-center gap-1">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 z-0 rounded-full"
                style={{
                  width: indicator.width,
                  transform: `translate3d(${indicator.left}px, 0, 0)`,
                  opacity: indicator.opacity,
                  transition:
                    "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), width 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease",
                  background: "rgb(255 255 255 / 0.1)",
                  boxShadow:
                    "inset 0 0 0 1px rgb(255 255 255 / 0.12), inset 0 1px 0 0 rgb(255 255 255 / 0.1)",
                }}
              />
              {navItems}
            </div>

            <span aria-hidden className="mx-1 h-5 w-px bg-line/60" />

            <button
              onClick={() => setDialogOpen(true)}
              aria-label="New playlist"
              title="New playlist"
              className={iconBtn}
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.push("/search")}
              aria-label="Open search"
              title="Open search"
              className={iconBtn}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile row */}
          <div className="flex w-full items-center justify-between md:hidden">
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <Logo className="[&>span]:text-sm" />
            </Link>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setDialogOpen(true)}
                aria-label="New playlist"
                className={iconBtn}
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => router.push("/search")}
                aria-label="Open search"
                className={iconBtn}
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Open menu"
                className="flex h-10 items-center gap-2 rounded-full border border-line/60 bg-bg/60 px-3 text-sub backdrop-blur-md transition-colors hover:text-fg"
              >
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                Menu
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mm-glass-panel mt-2 w-[min(17rem,calc(100vw-2rem))] animate-scale-in overflow-hidden rounded-lg p-0 md:hidden">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2.5 text-sm text-fg transition-colors hover:bg-fg/5"
              >
                {item.label}
              </Link>
            ))}
            <div className="mx-4 my-1 border-t border-line" />
            <div className="px-4 pb-3 pt-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                Your playlists
              </p>
              <div className="mt-2 space-y-0.5">
                {mounted &&
                  playlists.map((p) => (
                    <Link
                      key={p.id}
                      href={`/library/playlists/${p.id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-fg transition-colors hover:bg-fg/5"
                    >
                      <ListMusic className="h-4 w-4 text-sub" />
                      <span className="truncate">{p.name}</span>
                    </Link>
                  ))}
                {(!mounted || playlists.length === 0) && (
                  <p className="px-2 py-1 text-xs text-sub">
                    No playlists yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="relative">
        <div className="mx-auto w-full max-w-[1600px] px-4 pb-36 pt-2 sm:px-6 lg:px-12 lg:pb-28">
          {children}
        </div>
      </main>

      <Footer />

      <PlaylistDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
