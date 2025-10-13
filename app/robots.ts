import type { MetadataRoute } from 'next';
import site from '@/content/site.json';

const BASE_URL = site.domain;

export default function robots(): MetadataRoute.Robots {
  return {
    // Pre-launch: disallow crawlers until the canonical domain is live.
    rules: { userAgent: '*', disallow: '/' },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
