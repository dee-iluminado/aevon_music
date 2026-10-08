import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { Logo } from "@/components/logo";

const columns = [
  {
    title: "Browse",
    links: [
      { label: "Home", href: "/" },
      { label: "Search", href: "/search" },
      { label: "Disclaimer", href: "/disclaimer" },
    ],
  },
  {
    title: "Library",
    links: [
      { label: "Favourites", href: "/library" },
      { label: "Downloads", href: "/downloads" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line/60">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-10 px-6 py-14 lg:flex-row lg:items-start lg:justify-between lg:px-12">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-sub">
            A fast, clean, ad-free personal music hub. Search, stream and keep
            listening.
          </p>
        </div>

        <div className="flex gap-14">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-sub">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-fg/80 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line/60 py-5">
        <p className="mx-auto max-w-[1600px] px-6 font-mono text-[10px] uppercase tracking-[0.22em] text-sub/70 lg:px-12">
          © {new Date().getFullYear()} {APP_NAME} · Powered by the public
          JioSaavn API. Not affiliated.
        </p>
      </div>
    </footer>
  );
}
