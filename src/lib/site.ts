/**
 * Canonical site origin, used for metadata, robots.txt and the sitemap.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_SITE_URL      — explicit override (recommended in Vercel)
 *  2. VERCEL_PROJECT_PRODUCTION_URL — the project's production domain
 *  3. VERCEL_URL                — the current deployment URL (preview builds)
 *  4. localhost                 — local development
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3001";
}

export const SITE_URL = resolveSiteUrl().replace(/\/+$/, "");
