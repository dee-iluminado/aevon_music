"use client";

import { useEffect } from "react";
import { AUTH_EVENT } from "@/lib/auth";
import { AUTH_SESSION_KEY } from "@/lib/local-data";
import { rehydrateLibraryForUser } from "@/stores/library-store";

/**
 * Keeps the library store in step with the signed-in account. Signing in or
 * out swaps the persisted library; a change in another tab does the same.
 */
export function AuthSync() {
  useEffect(() => {
    const sync = () => {
      void rehydrateLibraryForUser();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === AUTH_SESSION_KEY) sync();
    };
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
