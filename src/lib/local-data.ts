/**
 * Keys and helpers for data that lives in this browser only.
 * Accounts are local to the device (no backend), so the library is stored
 * under a per-account key while signed in and under the plain key as a guest.
 */

export const AUTH_SESSION_KEY = "aevon-music.auth";
export const AUTH_ACCOUNT_KEY = "aevon-music.account";
export const LIBRARY_STORAGE_KEY = "hayasaka-library-v1";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Appends the signed-in email to a storage key; guests keep the bare key. */
export function userScopedKey(base: string, email?: string | null): string {
  const normalized = email ? normalizeEmail(email) : "";
  return normalized ? `${base}::${normalized}` : base;
}

/**
 * First sign-up on a device inherits whatever was saved as a guest, so the
 * favourites/playlists a visitor built before creating an account carry over.
 */
export function adoptGuestLibrary(email: string): void {
  if (typeof window === "undefined") return;
  try {
    const target = userScopedKey(LIBRARY_STORAGE_KEY, email);
    if (window.localStorage.getItem(target) !== null) return;
    const guest = window.localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (guest !== null) window.localStorage.setItem(target, guest);
  } catch {
    /* storage full or blocked — the account still works without the copy */
  }
}
