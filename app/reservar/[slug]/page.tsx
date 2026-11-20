import { Suspense } from 'react';
import { Spinner } from '@/components/ui';
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
        <div className="flex min-h-screen items-center justify-center gap-3 bg-background text-sm text-subtle-foreground">
          <Spinner />
          Cargando el negocio…
        </div>
      }
    >
      <BookingContent params={params} />
    </Suspense>
  );
}
