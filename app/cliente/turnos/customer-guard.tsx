'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useCustomerAuth } from '@/components/customer-auth-provider';
import { FullScreenLoader } from '@/components/ui';

/**
 * Session guard for the customer area. Like the business panel, the customer
 * session lives in `localStorage`, so the redirect has to happen on the client.
 */
export function CustomerGuard({ children }: { children: ReactNode }) {
  const { status } = useCustomerAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace('/cliente/login');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <FullScreenLoader
        label={status === 'loading' ? 'Cargando tu cuenta…' : 'Redirigiendo…'}
      />
    );
  }

  return <>{children}</>;
}
