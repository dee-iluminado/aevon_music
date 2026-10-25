"use client";

import { toast } from "sonner";

interface SharePayload {
  title: string;
  text?: string;
  /** Absolute URL or path — paths are resolved against the current origin. */
  url: string;
}

function absoluteUrl(url: string) {
  if (typeof window === "undefined") return url;
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for insecure contexts where the async clipboard API is blocked.
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
}

/**
 * Uses the native share sheet when available (mobile) and falls back to
 * copying the link. Never throws so callers can fire-and-forget.
 */
export async function shareLink({ title, text, url }: SharePayload) {
  const href = absoluteUrl(url);
  const payload = { title, text: text ?? title, url: href };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(payload);
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Fall through to clipboard on unsupported/failed native shares.
    }
  }

  try {
    await copyText(href);
    toast.success("Link copied", { description: "Paste it anywhere to share." });
  } catch {
    toast.error("Could not share this link");
  }
}
