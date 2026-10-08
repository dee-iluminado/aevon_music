import { NextRequest, NextResponse } from "next/server";
import { getSongSuggestions, safe } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ songs: [] });
  const songs = await safe(getSongSuggestions(id, 25), []);
  return NextResponse.json({ songs });
}
