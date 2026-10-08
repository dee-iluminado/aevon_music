import { NextRequest } from "next/server";
import { fetchAllowedMedia, isAllowedMediaUrl } from "@/lib/api";
import { sanitizeFilename } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const url = sp.get("url");
  const name = sanitizeFilename(sp.get("name") || "song");

  if (!url || !isAllowedMediaUrl(url)) {
    return new Response("Invalid media url", { status: 400 });
  }

  try {
    const upstream = await fetchAllowedMedia(url, {
      signal: AbortSignal.timeout(120000),
    });
    if (!upstream.ok) {
      return new Response("Upstream error", { status: 502 });
    }

    const resHeaders = new Headers();
    const contentType = upstream.headers.get("content-type") || "audio/mp4";
    resHeaders.set("Content-Type", contentType);
    const len = upstream.headers.get("content-length");
    if (len) resHeaders.set("Content-Length", len);
    const ext = contentType.includes("mpeg") ? "mp3" : "m4a";
    resHeaders.set(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(`${name}.${ext}`)}`
    );
    resHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(upstream.body, {
      status: 200,
      headers: resHeaders,
    });
  } catch {
    return new Response("Download failed", { status: 502 });
  }
}
