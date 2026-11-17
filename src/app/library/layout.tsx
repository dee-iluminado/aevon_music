import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Your Library",
  description: "Your favourites, playlists and recently played songs.",
};

export default function LibraryLayout({ children }: { children: ReactNode }) {
  return children;
}
