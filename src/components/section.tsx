"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  subtitle?: string;
  href?: string;
  children: ReactNode;
}

export function Section({ title, subtitle, href, children }: SectionProps) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: "smooth" });
  };

  return (
    <section data-testid={`rail-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="mm-eyebrow-rule" aria-hidden />
          <div className="flex items-baseline gap-3">
            <h2 className="font-heading text-lg font-semibold text-fg sm:text-xl">
              {title}
            </h2>
            {href && (
              <Link
                href={href}
                className="font-mono text-[10px] uppercase tracking-[0.22em] text-sub transition-colors hover:text-fg"
              >
                See all
              </Link>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Previous"
            className="flex h-7 w-7 items-center justify-center rounded-sm text-sub/70 transition-colors hover:bg-fg/5 hover:text-fg"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Next"
            className="flex h-7 w-7 items-center justify-center rounded-sm text-sub/70 transition-colors hover:bg-fg/5 hover:text-fg"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {subtitle && (
        <p className="-mt-3 mb-4 pl-[42px] text-sm text-sub">{subtitle}</p>
      )}

      <div
        ref={scroller}
        className="hide-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto overscroll-x-contain px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-12 lg:px-12"
      >
        {children}
      </div>
    </section>
  );
}
