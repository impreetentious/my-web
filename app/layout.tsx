import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Space_Mono, Instrument_Serif } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import site from '@/content/site.json';
import HydrationMarker from '@/components/ui/HydrationMarker';
import '@/styles/globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500'],
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '700'],
});

// C9 — the display voice: name, panel titles, ghost numerals, card titles,
// post titles. A dossier is a printed document, so the display face is a
// sharp archival serif against the instrument sans/mono — one weight + its
// italic, self-hosted by next/font, ~30 kB of woff2 that never touches the
// JS budget.
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-display',
  weight: '400',
  style: ['normal', 'italic'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#05060D',
};

// E2 — every personal fact in the metadata comes from content/site.json;
// this file owns only the metadata STRUCTURE (Rule A).
export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: {
    template: `%s · ${site.name}`,
    default: site.metaTitle,
  },
  description: site.metaDescription,
  keywords: site.keywords,
  authors: [{ name: site.name }],
  openGraph: {
    type: 'website',
    url: site.domain,
    title: site.metaTitle,
    description: site.metaDescription,
    siteName: site.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: site.metaTitle,
    description: site.metaDescription,
  },
  // Keep noindex until the canonical domain serves this build publicly.
  robots: { index: false, follow: false },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
      'application/atom+xml': '/feed.atom',
    },
  },
};

// L2 — Person JSON-LD, built from content/site.json (Rule B: one source per
// fact). Emitted site-wide via layout so every route inherits the identity
// entity; per-route entities (Article on posts) are additive.
const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  url: site.domain,
  email: `mailto:${site.email}`,
  jobTitle: site.proposition,
  description: site.metaDescription,
  sameAs: [site.socials.linkedin, site.socials.github],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} ${instrumentSerif.variable}`}
    >
      <head>
        {/* L3 — iOS status bar sits over the descent's night sky. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />
        {/* Hydration fail-open: JS loaded but React never mounts → same
            reveal as <noscript>. Cleared by HydrationMarker on mount. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;d.setAttribute('data-js','1');setTimeout(function(){if(d.getAttribute('data-hydrated'))return;d.setAttribute('data-hydrate-failed','1');var s=document.createElement('style');s.setAttribute('data-hydrate-failopen','');s.textContent='[data-boot-veil]{display:none!important}.tx-card{opacity:1!important}';document.head.appendChild(s);},6000);})();`,
          }}
        />
      </head>
      <body>
        {/* No-JS fail-open: the boot veil and the cards' decode entrance are
            client-released — without JS the server HTML must not sit behind
            an opaque loader or at opacity 0. */}
        <noscript>
          <style>{`
            [data-boot-veil] { display: none !important; }
            .tx-card { opacity: 1 !important; }
          `}</style>
        </noscript>
        <HydrationMarker />
        {/* B4 — the Lenis scroll system is scoped to the home experience
            (app/page.tsx wraps itself in ScrollProvider); blog routes scroll
            natively and run no rAF loop. */}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
