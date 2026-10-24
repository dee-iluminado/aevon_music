import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchClient } from "@/components/search/search-client";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search millions of songs, albums, playlists and artists from the JioSaavn catalog.",
};

interface SearchPageProps {
  searchParams?: Promise<{ q?: string; type?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;

  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchClient
        initialQuery={resolvedParams?.q}
        initialType={resolvedParams?.type}
      />
    </Suspense>
  );
}

function SearchFallback() {
  return <div className="h-40 animate-pulse rounded-2xl bg-white/5" />;
}

