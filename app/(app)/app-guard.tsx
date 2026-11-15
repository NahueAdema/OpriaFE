'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Shell } from '@/components/shell';
import { FullScreenLoader } from '@/components/ui';

/**
 * Session guard for the panel. The session lives in `localStorage`, so this
 * has to stay on the client; `app/(app)/layout.tsx` is a Server Component only
 * to opt the subtree out of static-shell validation.
 */
export function AppGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <FullScreenLoader
        label={status === 'loading' ? 'Cargando tu panel…' : 'Redirigiendo…'}
      />
    );
  }

  return <Shell>{children}</Shell>;
}
