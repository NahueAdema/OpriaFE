import type { AuthResult } from './types';

const STORAGE_KEY = 'opria.auth.v1';

export interface AuthSnapshot {
  auth: AuthResult | null;
  hydrated: boolean;
}

const SERVER_SNAPSHOT: AuthSnapshot = { auth: null, hydrated: false };
let snapshot: AuthSnapshot = SERVER_SNAPSHOT;
let initialized = false;
const listeners = new Set<() => void>();

function parse(raw: string | null): AuthResult | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthResult;

    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.tenant) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function ensureInitialized(): void {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  initialized = true;
  snapshot = {
    auth: parse(window.localStorage.getItem(STORAGE_KEY)),
    hydrated: true,
  };
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getAuthSnapshot(): AuthSnapshot {
  ensureInitialized();

  return snapshot;
}

export function getServerAuthSnapshot(): AuthSnapshot {
  return SERVER_SNAPSHOT;
}

export function readAuth(): AuthResult | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return parse(window.localStorage.getItem(STORAGE_KEY));
}

export function writeAuth(auth: AuthResult): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  initialized = true;
  snapshot = { auth, hydrated: true };
  emit();
}

export function clearAuth(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  initialized = true;
  snapshot = { auth: null, hydrated: true };
  emit();
}
