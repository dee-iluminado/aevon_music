import { NextRequest, NextResponse } from "next/server";
import {
  safe,
  searchAll,
  searchAlbums,
  searchArtists,
  searchPlaylists,
  searchSongs,
} from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim();
  const type = sp.get("type") ?? "all";
  const page = Math.max(1, Number(sp.get("page") ?? 1));

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  switch (type) {
    case "songs": {
      const results = await safe(searchSongs(q, page, 24), []);
      return NextResponse.json({ songs: results });
    }
    case "albums": {
      const results = await safe(searchAlbums(q, page, 24), []);
      return NextResponse.json({ albums: results });
    }
    case "playlists": {
      const results = await safe(searchPlaylists(q, page, 24), []);
      return NextResponse.json({ playlists: results });
    }
    case "artists": {
      const results = await safe(searchArtists(q, page, 24), []);
      return NextResponse.json({ artists: results });
    }
    default: {
      const results = await safe(searchAll(q), {
        songs: [],
        albums: [],
        playlists: [],
        artists: [],
      });
      return NextResponse.json(results);
    }
  }
}
