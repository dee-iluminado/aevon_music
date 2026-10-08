import type { Metadata } from "next";
import { LibraryClient } from "@/components/library/library-client";

export const metadata: Metadata = {
  title: "Your Library",
  description: "Your favourites, playlists and recently played songs.",
};

export default function LibraryPage() {
  return <LibraryClient />;
}
