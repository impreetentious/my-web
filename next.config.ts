import type { NextConfig } from 'next';

const securityHeaders = [
  {
    // `'unsafe-inline'` in script-src is load-bearing, not laziness. The App
    // Router ships the RSC Flight payload as a run of inline
    // `self.__next_f.push(...)` scripts whose bodies ARE the page data, so
    // their hashes change with every content edit — a pinned hash list breaks
    // the site on the next copy change. Nonces are the supported alternative
    // but require middleware, which forces every matched route to render
    // dynamically and forfeits the static rendering the perf budget depends on.
    //
    // Note that a hash or nonce in the same directive makes browsers IGNORE
    // `'unsafe-inline'` entirely (CSP3), so the two cannot be combined as a
    // belt-and-braces measure — that is what previously blocked all nine
    // inline scripts. `npm run budget:lighthouse` fails on console CSP
    // violations, which is what caught it.
    //
    // Every other executable script stays external, and JSON-LD tags are inert
    // data that need no execution allowance.
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://*.vercel-insights.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
