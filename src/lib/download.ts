"use client";

import { toast } from "sonner";
import { useLibrary } from "@/stores/library-store";
import { sanitizeFilename } from "@/lib/utils";
import type { Song } from "@/lib/types";

/** True when the only available media is a short preview clip (e.g. Deezer). */
export function isPreviewOnly(song: Song): boolean {
  return !song.downloadUrl.some((d) => d.url);
}

export function pickDownloadLink(song: Song, quality = "320kbps"): string | null {
  const exact = song.downloadUrl.find((d) => d.quality === quality)?.url;
  if (exact) return exact;
  const byKbps = song.downloadUrl
    .filter((d) => d.url)
    .map((d) => ({ url: d.url, n: parseInt(d.quality, 10) }))
    .filter((x) => !isNaN(x.n))
    .sort((a, b) => b.n - a.n);
  if (byKbps.length) return byKbps[0].url;
  return song.mediaUrl || null;
}

export async function downloadSong(song: Song): Promise<void> {
  const url = pickDownloadLink(song);
  if (!url) {
    toast.error("No downloadable link available for this song");
    return;
  }
  const previewOnly = isPreviewOnly(song);
  const name = sanitizeFilename(`${song.title} - ${song.artists[0] ?? "AEVON"}`);
  try {
    const res = await fetch(
      `/api/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`
    );
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const ext = (res.headers.get("content-type") || "").includes("mpeg")
      ? "mp3"
      : "m4a";
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `${name}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking in the same tick can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    useLibrary.getState().addDownload(song);
    if (previewOnly) {
      toast.warning(`Only a 30-second preview is available for "${song.title}"`);
    } else {
      toast.success(`Downloaded ${song.title}`);
    }
  } catch {
    toast.error("Could not download this song right now");
  }
}
