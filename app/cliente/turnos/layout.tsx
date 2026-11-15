import type { ReactNode } from 'react';
import { CustomerGuard } from './customer-guard';

/**
 * The customer appointments page depends on a `localStorage` session and shows
 * a loader while it hydrates, so it opts out of instant-navigation validation.
 */
export const instant = false;

export default function CustomerAppointmentsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <CustomerGuard>{children}</CustomerGuard>;
}
