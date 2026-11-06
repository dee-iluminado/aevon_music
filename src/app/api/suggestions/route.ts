import { NextRequest, NextResponse } from "next/server";
import { getSongSuggestions, safe } from "@/lib/api";

export const dynamic = "force-dynamic";

/* Suggestions for a song are stable for a long time, so let browsers and the
   edge reuse them instead of asking the slow upstream every time. */
const SUGGESTIONS_CACHE =
  "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ songs: [] });
  const songs = await safe(getSongSuggestions(id, 25), []);
  return NextResponse.json(
    { songs },
    { headers: { "Cache-Control": SUGGESTIONS_CACHE } }
  );
}
