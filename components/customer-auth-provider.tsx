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
import { customerApi, setCustomerUnauthorizedHandler } from '@/lib/api';
import {
  clearCustomerAuth,
  getCustomerAuthSnapshot,
  getServerCustomerAuthSnapshot,
  readCustomerAuth,
  subscribeCustomerAuth,
  writeCustomerAuth,
} from '@/lib/customer-auth-storage';
import type {
  CustomerAuthResult,
  CustomerLoginInput,
  CustomerRegisterInput,
} from '@/lib/types';

type CustomerAuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface CustomerAuthContextValue {
  auth: CustomerAuthResult | null;
  customer: CustomerAuthResult['customer'] | null;
  status: CustomerAuthStatus;
  signIn: (input: CustomerLoginInput) => Promise<CustomerAuthResult>;
  signUp: (input: CustomerRegisterInput) => Promise<CustomerAuthResult>;
  signOut: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(
  null,
);

/**
 * Customer session store, independent from the business panel. Both can coexist
 * in the same browser: they use different keys and different refresh chains.
 */
export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const { auth, hydrated } = useSyncExternalStore(
    subscribeCustomerAuth,
    getCustomerAuthSnapshot,
    getServerCustomerAuthSnapshot,
  );

  const status: CustomerAuthStatus = !hydrated
    ? 'loading'
    : auth
      ? 'authenticated'
      : 'anonymous';

  useEffect(() => {
    setCustomerUnauthorizedHandler(() => clearCustomerAuth());

    return () => setCustomerUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback(async (input: CustomerLoginInput) => {
    const next = await customerApi.login(input);

    writeCustomerAuth(next);

    return next;
  }, []);

  const signUp = useCallback(async (input: CustomerRegisterInput) => {
    const next = await customerApi.register(input);

    writeCustomerAuth(next);

    return next;
  }, []);

  const signOut = useCallback(async () => {
    const stored = readCustomerAuth();

    if (stored) {
      try {
        await customerApi.logout(stored.refreshToken);
      } catch {
        // Clear locally even if the server is unreachable.
      }
    }

    clearCustomerAuth();
  }, []);

  const value = useMemo<CustomerAuthContextValue>(
    () => ({
      auth,
      customer: auth?.customer ?? null,
      status,
      signIn,
      signUp,
      signOut,
    }),
    [auth, status, signIn, signUp, signOut],
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const context = useContext(CustomerAuthContext);

  if (!context) {
    throw new Error('useCustomerAuth must be used inside CustomerAuthProvider');
  }

  return context;
}
