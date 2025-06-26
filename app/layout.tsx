import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Space_Mono, Instrument_Serif } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import site from '@/content/site.json';
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
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} ${instrumentSerif.variable}`}
    >
      <body>
        {/* B4 — the Lenis scroll system is scoped to the home experience
            (app/page.tsx wraps itself in ScrollProvider); blog routes scroll
            natively and run no rAF loop. */}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
