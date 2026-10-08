import { NextRequest } from "next/server";
import { fetchAllowedMedia, isAllowedMediaUrl } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !isAllowedMediaUrl(url)) {
    return new Response("Invalid media url", { status: 400 });
  }

  const range = req.headers.get("range");
  const headers: Record<string, string> = {};
  if (range) headers["Range"] = range;

  try {
    const upstream = await fetchAllowedMedia(url, {
      headers,
      signal: AbortSignal.timeout(60000),
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response("Upstream error", { status: 502 });
    }

    const resHeaders = new Headers();
    const contentType =
      upstream.headers.get("content-type") || "audio/mpeg";
    resHeaders.set("Content-Type", contentType);
    resHeaders.set("Accept-Ranges", "bytes");
    resHeaders.set("Access-Control-Allow-Origin", "*");

    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    if (contentLength) resHeaders.set("Content-Length", contentLength);
    if (contentRange) resHeaders.set("Content-Range", contentRange);
    resHeaders.set("Cache-Control", "public, max-age=86400");

    return new Response(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch {
    return new Response("Stream unavailable", { status: 502 });
  }
}
