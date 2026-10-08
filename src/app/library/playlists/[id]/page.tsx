import type { Metadata } from "next";
import { Suspense } from "react";
import { UserPlaylistClient } from "@/components/library/user-playlist-client";

export const metadata: Metadata = {
  title: "Playlist",
  description: "Your saved playlist.",
};

export default function UserPlaylistPage() {
  return (
    <Suspense fallback={<div className="h-60 animate-pulse rounded-2xl bg-white/5" />}>
      <UserPlaylistClient />
    </Suspense>
  );
}
