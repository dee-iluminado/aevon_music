"use client";

import { Cover } from "@/components/cover";
import { useLibrary } from "@/stores/library-store";
import { downloadSong } from "@/lib/download";
import { joinArtists } from "@/lib/utils";

export default function DownloadsPage() {
  const downloads = useLibrary((s) => s.downloads);
  const count = downloads.length;

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="font-heading text-3xl font-semibold text-fg">
          Your Downloads {count > 0 ? `(${count})` : ""}
        </h1>

        {count === 0 ? (
          <div className="text-center text-zinc-500">
            <p className="text-lg">No downloads yet</p>
            <p className="mt-2">
              Tap the download icon on any song to save it offline
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {downloads.map((song) => (
              <div
                key={song.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/20"
              >
                <div className="flex items-center gap-3">
                  <Cover
                    src={song.image}
                    alt={song.title}
                    className="h-12 w-12 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {song.title}
                    </p>
                    <p className="truncate text-xs text-zinc-400">
                      {song.album || joinArtists(song.artists)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {song.year || "Unknown year"}
                  </span>
                  <button
                    onClick={() => void downloadSong(song)}
                    className="h-6 w-6 text-zinc-400 rounded-full p-1 transition hover:bg-white/5"
                    aria-label="Download"
                  >
                    <svg
                      width="1"
                      height="1"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="size-full"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}