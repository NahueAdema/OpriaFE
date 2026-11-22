import { Suspense } from 'react';
import { Spinner, WakingUpHint } from '@/components/ui';
import { BookingClient } from './booking-client';

/** Public booking funnel: opt into instant-navigation validation explicitly. */
export const instant = true;

async function BookingContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <BookingClient slug={slug} />;
}

export default function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-sm text-subtle-foreground">
          <div className="flex items-center gap-3">
            <Spinner />
            Cargando el negocio…
          </div>
          <WakingUpHint />
        </div>
      }
    >
      <BookingContent params={params} />
    </Suspense>
  );
}
