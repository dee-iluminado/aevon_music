import type { Metadata } from "next";
import { DownloadsClient } from "@/components/library/downloads-client";

export const metadata: Metadata = {
  title: "Downloads",
  description: "Songs you have downloaded for offline listening.",
};

export default function DownloadsPage() {
  return <DownloadsClient />;
}
