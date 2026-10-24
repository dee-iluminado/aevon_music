"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type SearchTabType = "all" | "songs" | "albums" | "artists" | "playlists";

export const SEARCH_TABS: { id: SearchTabType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "songs", label: "Songs" },
  { id: "albums", label: "Albums" },
  { id: "artists", label: "Artists" },
  { id: "playlists", label: "Playlists" },
];

export function isSearchTab(value: string | null | undefined): value is SearchTabType {
  return (
    value === "all" ||
    value === "songs" ||
    value === "albums" ||
    value === "artists" ||
    value === "playlists"
  );
}

interface SearchTabsProps {
  currentTab: SearchTabType;
  onTabChange?: (tab: SearchTabType) => void;
  query?: string;
  className?: string;
}

export function SearchTabs({
  currentTab,
  onTabChange,
  query,
  className,
}: SearchTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (tabId: SearchTabType) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
    const params = new URLSearchParams(searchParams.toString());
    const q = (query !== undefined ? query : params.get("q") ?? "").trim();
    if (q) {
      params.set("q", q);
    }
    if (tabId === "all") {
      params.delete("type");
    } else {
      params.set("type", tabId);
    }
    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  return (
    <div
      role="tablist"
      aria-label="Search filter tabs"
      className={cn(
        "mm-glass-pill inline-flex items-center gap-1 rounded-full p-1 overflow-x-auto max-w-full hide-scrollbar",
        className
      )}
    >
      {SEARCH_TABS.map((t) => {
        const active = currentTab === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => handleSelect(t.id)}
            className={cn(
              "relative z-10 inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-sm font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fg/40",
              active
                ? "bg-white/10 text-fg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                : "text-sub hover:text-fg hover:bg-white/5"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
