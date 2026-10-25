/**
 * Catalog policy: Hindi content is not offered anywhere in the app.
 * Everything that comes back from the upstream API passes through these
 * helpers so Hindi songs, albums and playlists can never leak into a rail,
 * search result, suggestion, queue or detail page.
 */
export const BLOCKED_LANGUAGES = ["hindi"] as const;

export function isBlockedLanguage(language?: string | null): boolean {
  if (!language) return false;
  const normalized = language.trim().toLowerCase();
  return (BLOCKED_LANGUAGES as readonly string[]).includes(normalized);
}

export function isBlockedItem(item?: { language?: string } | null): boolean {
  return isBlockedLanguage(item?.language);
}

/** Drops blocked-language items from a list (songs, albums or playlists). */
export function withoutBlocked<T extends { language?: string }>(items: T[]): T[] {
  if (!items.length) return items;
  return items.filter((item) => !isBlockedLanguage(item.language));
}

/**
 * Queries that explicitly ask for a blocked language/industry are answered
 * with an empty result set instead of a filtered subset, so the app never
 * looks like it is still offering that catalogue.
 */
const BLOCKED_QUERY_TERMS = [
  "hindi",
  "bollywood",
  "arijit singh",
  "a.r. rahman",
  "ar rahman",
];

export function isBlockedQuery(query?: string | null): boolean {
  if (!query) return false;
  const normalized = query.trim().toLowerCase();
  return BLOCKED_QUERY_TERMS.some((term) => normalized === term);
}
