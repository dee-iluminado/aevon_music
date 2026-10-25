"use client";

import { Bookmark, BookmarkCheck, UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useLibrary } from "@/stores/library-store";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import type { Album, ArtistInfo } from "@/lib/types";

const pill =
  "inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/5 active:scale-[.98]";

/** Shared "secondary action" pill used on album/artist/playlist pages. */
export const detailPill = pill;

const activePill =
  "border-accent/40 bg-accent/10 text-accent hover:border-accent/60 hover:bg-accent/15";

export function SaveAlbumButton({
  album,
  className,
}: {
  album: Album;
  className?: string;
}) {
  const mounted = useMounted();
  const saved = useLibrary((s) => s.albums.some((a) => a.id === album.id));
  const toggleAlbum = useLibrary((s) => s.toggleAlbum);
  const active = mounted && saved;

  return (
    <button
      type="button"
      onClick={() => {
        toggleAlbum(album);
        toast.success(active ? "Removed from your library" : "Album saved");
      }}
      aria-pressed={active}
      className={cn(pill, active && activePill, className)}
    >
      {active ? (
        <BookmarkCheck className="h-4.5 w-4.5 fill-current" />
      ) : (
        <Bookmark className="h-4.5 w-4.5" />
      )}
      {active ? "Saved" : "Save"}
    </button>
  );
}

export function FollowArtistButton({
  artist,
  className,
}: {
  artist: ArtistInfo;
  className?: string;
}) {
  const mounted = useMounted();
  const following = useLibrary((s) =>
    s.artists.some((a) => a.id === artist.id)
  );
  const toggleArtist = useLibrary((s) => s.toggleArtist);
  const active = mounted && following;

  return (
    <button
      type="button"
      onClick={() => {
        toggleArtist(artist);
        toast.success(active ? `Unfollowed ${artist.name}` : `Following ${artist.name}`);
      }}
      aria-pressed={active}
      className={cn(pill, active && activePill, className)}
    >
      {active ? (
        <UserCheck className="h-4.5 w-4.5" />
      ) : (
        <UserPlus className="h-4.5 w-4.5" />
      )}
      {active ? "Following" : "Follow"}
    </button>
  );
}
