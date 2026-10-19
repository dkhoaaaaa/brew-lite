"use client";

import { useSyncExternalStore } from "react";
import { StoredUser, getAccessToken, getUser } from "./auth-token";

const listeners = new Set<() => void>();

export function notifyAuthChange(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", callback);
    }
  };
}

export function useAuth() {
  const user = useSyncExternalStore<StoredUser | null>(
    subscribe,
    getUser,
    () => null,
  );

  const token = useSyncExternalStore<string | null>(
    subscribe,
    getAccessToken,
    () => null,
  );

  return {
    user,
    token,
    isAuthenticated: Boolean(token && user),
  };
}
