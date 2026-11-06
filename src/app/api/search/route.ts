import { NextRequest, NextResponse } from "next/server";
import {
  safe,
  searchAll,
  searchAlbums,
  searchArtists,
  searchPlaylists,
  searchSongs,
} from "@/lib/api";
import { isBlockedQuery } from "@/lib/content-filter";

export const dynamic = "force-dynamic";

/* Search responses are safe to reuse for a few minutes: the catalog does not
   change between keystrokes and the upstream provider is slow. Edge caching
   makes repeat/popular searches instant while the Next data cache keeps the
   origin fetch warm. */
const SEARCH_CACHE = "public, max-age=60, s-maxage=300, stale-while-revalidate=86400";

function json(data: unknown) {
  return NextResponse.json(data, {
    headers: { "Cache-Control": SEARCH_CACHE },
  });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim();
  const type = sp.get("type") ?? "all";
  const page = Math.max(1, Number(sp.get("page") ?? 1));

  if (!q) {
    return json({ results: [] });
  }

  if (isBlockedQuery(q)) {
    return json({
      songs: [],
      albums: [],
      playlists: [],
      artists: [],
    });
  }

  const cache = { revalidate: 300 };

  switch (type) {
    case "songs": {
      const results = await safe(searchSongs(q, page, 24, cache), []);
      return json({ songs: results });
    }
    case "albums": {
      const results = await safe(searchAlbums(q, page, 24, cache), []);
      return json({ albums: results });
    }
    case "playlists": {
      const results = await safe(searchPlaylists(q, page, 24, cache), []);
      return json({ playlists: results });
    }
    case "artists": {
      const results = await safe(searchArtists(q, page, 24, cache), []);
      return json({ artists: results });
    }
    default: {
      const results = await safe(searchAll(q, 10, cache), {
        songs: [],
        albums: [],
        playlists: [],
        artists: [],
      });
      return json(results);
    }
  }
}
