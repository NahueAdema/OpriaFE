'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { api, setUnauthorizedHandler } from '@/lib/api';
import {
  clearAuth,
  getAuthSnapshot,
  getServerAuthSnapshot,
  readAuth,
  subscribeAuth,
  writeAuth,
} from '@/lib/auth-storage';
import type { AuthResult, LoginInput, RegisterInput } from '@/lib/types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  auth: AuthResult | null;
  status: AuthStatus;
  signIn: (input: LoginInput) => Promise<AuthResult>;
  signUp: (input: RegisterInput) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, hydrated } = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );

  const status: AuthStatus = !hydrated
    ? 'loading'
    : auth
      ? 'authenticated'
      : 'anonymous';

  useEffect(() => {
    setUnauthorizedHandler(() => clearAuth());

    return () => setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback(async (input: LoginInput) => {
    const next = await api.login(input);

    writeAuth(next);

    return next;
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    const next = await api.register(input);

    writeAuth(next);

    return next;
  }, []);

  const signOut = useCallback(async () => {
    const stored = readAuth();

    if (stored) {
      try {
        await api.logout(stored.refreshToken);
      } catch {
        // The local session is cleared even if the server cannot be reached.
      }
    }

    clearAuth();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ auth, status, signIn, signUp, signOut }),
    [auth, status, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
