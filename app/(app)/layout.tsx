import type { ReactNode } from 'react';
import { AppGuard } from './app-guard';

/**
 * The panel is a client-side app stored in `localStorage`: it cannot render a
 * meaningful static shell during prerender (the guard shows a loader). Opting
 * the whole protected subtree out keeps Next's instant-navigation validation
 * from reporting every page as an unrendered segment. Public routes such as
 * `/reservar` are outside this group and keep validating.
 */
export const instant = false;

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppGuard>{children}</AppGuard>;
}
