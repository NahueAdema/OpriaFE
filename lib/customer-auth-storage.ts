import type { CustomerAuthResult } from './types';

const STORAGE_KEY = 'opria.customer.v1';

export interface CustomerAuthSnapshot {
  auth: CustomerAuthResult | null;
  hydrated: boolean;
}

const SERVER_SNAPSHOT: CustomerAuthSnapshot = { auth: null, hydrated: false };
let snapshot: CustomerAuthSnapshot = SERVER_SNAPSHOT;
let initialized = false;
const listeners = new Set<() => void>();

function parse(raw: string | null): CustomerAuthResult | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CustomerAuthResult;

    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.customer) {
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

export function subscribeCustomerAuth(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getCustomerAuthSnapshot(): CustomerAuthSnapshot {
  ensureInitialized();

  return snapshot;
}

export function getServerCustomerAuthSnapshot(): CustomerAuthSnapshot {
  return SERVER_SNAPSHOT;
}

export function readCustomerAuth(): CustomerAuthResult | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return parse(window.localStorage.getItem(STORAGE_KEY));
}

export function writeCustomerAuth(auth: CustomerAuthResult): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  initialized = true;
  snapshot = { auth, hydrated: true };
  emit();
}

export function clearCustomerAuth(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  initialized = true;
  snapshot = { auth: null, hydrated: true };
  emit();
}
