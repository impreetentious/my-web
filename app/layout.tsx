import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import { ScrollProvider } from '@/components/providers/ScrollProvider';
import { Analytics } from '@vercel/analytics/react';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://sidakpreet.in'),
  title: {
    template: '%s · Sidakpreet Singh',
    default: 'Sidakpreet Singh · Strategy & GTM',
  },
  description:
    'Strategy and GTM professional. Manager at HCLSoftware. MBA from IIM Indore (top 2%). ' +
    'Building at the intersection of commercial strategy, product thinking, and analytical rigour.',
  keywords: [
    'strategy consulting', 'GTM strategy', 'product strategy', 'go-to-market',
    'IIM Indore', 'Sidakpreet Singh', 'HCLSoftware', 'business strategy',
  ],
  authors: [{ name: 'Sidakpreet Singh' }],
  openGraph: {
    type: 'website',
    url: 'https://sidakpreet.in',
    title: 'Sidakpreet Singh · Strategy & GTM',
    description: 'Strategy and GTM professional. Manager at HCLSoftware. MBA from IIM Indore.',
    siteName: 'Sidakpreet Singh',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sidakpreet Singh · Strategy & GTM',
    description: 'Strategy and GTM professional. Manager at HCLSoftware. MBA from IIM Indore.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body>
        <ScrollProvider>
          {children}
        </ScrollProvider>
        <Analytics />
      </body>
    </html>
  );
}
