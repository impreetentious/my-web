import type { MetadataRoute } from 'next';
import { getAllPosts, getSeriesPosts } from '@/lib/blog';
import site from '@/content/site.json';

const BASE_URL = site.domain;

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Series pages — same derivation as the series route's generateStaticParams
  // (a series exists once a published post references it); lastModified is
  // the newest post in the series.
  const seriesIds = [...new Set(posts.map((p) => p.series).filter(Boolean))] as string[];
  const seriesRoutes: MetadataRoute.Sitemap = seriesIds.map((id) => {
    const dates = getSeriesPosts(id)
      .map((p) => new Date(p.date).getTime())
      .filter((t) => Number.isFinite(t));
    return {
      url: `${BASE_URL}/blog/series/${id}`,
      lastModified: dates.length ? new Date(Math.max(...dates)) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    };
  });

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogRoutes,
    ...seriesRoutes,
  ];
}
