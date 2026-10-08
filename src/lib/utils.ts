import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds?: number | null): string {
  const s = Number(seconds ?? 0);
  if (!isFinite(s) || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function formatCount(n?: number | null): string {
  const v = Number(n ?? 0);
  if (!isFinite(v) || v <= 0) return "";
  if (v >= 1e9) return trim((v / 1e9).toFixed(1)) + "B";
  if (v >= 1e6) return trim((v / 1e6).toFixed(1)) + "M";
  if (v >= 1e3) return trim((v / 1e3).toFixed(1)) + "K";
  return String(v);
}

function trim(str: string) {
  return str.replace(/\.0$/, "");
}

export function joinArtists(artists: string[], max = 4): string {
  const list = [...artists];
  const shown = list.slice(0, max);
  const rest = list.length - shown.length;
  if (rest > 0) shown.push(`+${rest} more`);
  return shown.join(", ");
}

export function sanitizeFilename(name: string): string {
  const clean = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return clean || "song";
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
