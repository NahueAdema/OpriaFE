import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Playwright y el entorno local acceden por 127.0.0.1.
  allowedDevOrigins: ['127.0.0.1'],
  experimental: {
    agentFeedback: true,
    // The panel is a client-side app (session in localStorage, data fetched
    // after mount), so no segment inside `app/(app)` can promise an instant
    // UI. Validate only the segments that explicitly opt in with `instant`.
    instantInsights: {
      validationLevel: 'manual-warning',
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
