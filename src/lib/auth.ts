/*
 * Minimal client-side accounts (localStorage, no backend). This mirrors the
 * AEVON Movies sign-in: one account per device, passwords hashed with a
 * per-account salt so the stored record is never plaintext. The point is to
 * remember the listener and keep their library separate, not to secure a
 * server — there isn't one.
 */

import {
  AUTH_ACCOUNT_KEY,
  AUTH_SESSION_KEY,
  adoptGuestLibrary,
  normalizeEmail,
} from "./local-data";

export const AUTH_EVENT = "aevon-auth";

export interface AuthUser {
  name: string;
  email: string;
  signedUpAt: number;
}

interface StoredAccount {
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
  createdAt: number;
}

interface AuthResult {
  ok: boolean;
  user?: AuthUser;
  error?: string;
}

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < bytes; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* WebCrypto needs a secure context (https / localhost). Fall back to a
   non-cryptographic hash on plain-http LAN so the page never crashes. */
async function hashPassword(password: string, salt: string): Promise<string> {
  const input = `${salt}:${password}`;
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(input)
    );
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

function readAccount(): StoredAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_ACCOUNT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAccount;
    if (!parsed?.email || !parsed?.salt || !parsed?.passwordHash) return null;
    return parsed;
  } catch {
    return null;
  }
}

function announce(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasAccount(): boolean {
  return readAccount() !== null;
}

export function accountInitial(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?";
}

export function saveAuth(user: AuthUser): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    announce();
  } catch {
    /* ignore — private mode can block writes */
  }
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    announce();
  } catch {
    /* ignore */
  }
}

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  if (typeof window === "undefined") return { ok: false, error: "Not available" };
  const normalized = normalizeEmail(email);
  if (!name.trim()) return { ok: false, error: "Enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: "That email address doesn't look right." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  const existing = readAccount();
  if (existing) {
    return {
      ok: false,
      error:
        existing.email === normalized
          ? "An account with this email already exists on this device. Sign in instead."
          : "This device already has an account. Sign in with it instead.",
    };
  }

  const salt = randomHex(16);
  const passwordHash = await hashPassword(password, salt);
  const createdAt = Date.now();
  const account: StoredAccount = {
    name: name.trim(),
    email: normalized,
    salt,
    passwordHash,
    createdAt,
  };
  try {
    window.localStorage.setItem(AUTH_ACCOUNT_KEY, JSON.stringify(account));
  } catch {
    return { ok: false, error: "Could not save the account on this device." };
  }
  // Carry over anything saved before the account existed.
  adoptGuestLibrary(normalized);
  const user: AuthUser = {
    name: account.name,
    email: account.email,
    signedUpAt: createdAt,
  };
  saveAuth(user);
  return { ok: true, user };
}

export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  if (typeof window === "undefined") return { ok: false, error: "Not available" };
  const account = readAccount();
  if (!account) {
    return {
      ok: false,
      error: "No account found on this device. Create one to get started.",
    };
  }
  const normalized = normalizeEmail(email);
  if (normalized !== account.email) {
    return {
      ok: false,
      error: "That email doesn't match the account on this device.",
    };
  }
  const passwordHash = await hashPassword(password, account.salt);
  if (passwordHash !== account.passwordHash) {
    return { ok: false, error: "Incorrect password. Try again." };
  }
  const user: AuthUser = {
    name: account.name,
    email: account.email,
    signedUpAt: account.createdAt,
  };
  saveAuth(user);
  return { ok: true, user };
}
