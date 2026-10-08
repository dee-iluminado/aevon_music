import { NextRequest, NextResponse } from "next/server";
import { getLyrics, safe } from "@/lib/api";
import { getLrclibLyrics } from "@/lib/lrclib";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const title = req.nextUrl.searchParams.get("title");
  const artist = req.nextUrl.searchParams.get("artist");
  const album = req.nextUrl.searchParams.get("album") || undefined;
  const durationParam = req.nextUrl.searchParams.get("duration");

  if (title && artist) {
    const lrclib = await safe(
      getLrclibLyrics({
        title,
        artist,
        album,
        duration: durationParam ? Number(durationParam) : undefined,
      }),
      null
    );
    if (lrclib?.lyrics) return NextResponse.json(lrclib);
  }

  if (!id) {
    return NextResponse.json({ lyrics: "" }, { status: 404 });
  }
  const lyrics = await safe(getLyrics(id), null);
  if (!lyrics || !lyrics.lyrics) {
    return NextResponse.json({ lyrics: "" }, { status: 404 });
  }
  return NextResponse.json(lyrics);
}
