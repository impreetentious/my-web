import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import SERIES_DATA from '@/content/series.json';
import type { BlogPost } from '@/types';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

// C8/E4 — series registry: one editable place for anything posts can belong
// to, mastered in content/series.json (post-G: in Sanity). A post joins a
// series via `series: <id>` + `seriesIndex: <n>` frontmatter.
export const SERIES: Record<
  string,
  { title: string; planned: number; description: string }
> = SERIES_DATA;

const WPM = 200;

function readingTimeMin(source: string): number {
  const words = source.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / WPM));
}

function parseFile(filename: string, withContent: boolean): Omit<BlogPost, 'entry'> {
  const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8');
  const { data, content } = matter(raw);
  return {
    slug: data.slug || filename.replace('.mdx', ''),
    title: data.title || 'Untitled',
    date: data.date || '',
    excerpt: data.excerpt || '',
    readingTime: readingTimeMin(content),
    series: typeof data.series === 'string' ? data.series : undefined,
    seriesIndex: typeof data.seriesIndex === 'number' ? data.seriesIndex : undefined,
    ...(withContent ? { content } : {}),
  };
}

/** All posts, newest first. `entry` numbers chronologically (oldest = 01) so
 *  the log reads like a mission record. */
export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'));
  const parsed = files
    .map((f) => parseFile(f, false))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((post, i) => ({ ...post, entry: i + 1 }));

  return parsed.reverse();
}

export function getPostBySlug(slug: string): BlogPost | null {
  const all = getAllPosts();
  const listed = all.find((p) => p.slug === slug);
  if (!listed) return null;

  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  const filename = fs.existsSync(filePath)
    ? `${slug}.mdx`
    : fs.readdirSync(BLOG_DIR).find((f) => parseFile(f, false).slug === slug);
  if (!filename) return null;

  return { ...parseFile(filename, true), entry: listed.entry };
}

/** Published posts of a series, in part order. */
export function getSeriesPosts(seriesId: string): BlogPost[] {
  return getAllPosts()
    .filter((p) => p.series === seriesId)
    .sort((a, b) => (a.seriesIndex ?? 0) - (b.seriesIndex ?? 0));
}

/** Related-next links (C8): the next part of the same series when there is
 *  one, otherwise the chronological neighbours. */
export function getRelatedPosts(post: BlogPost): {
  next: BlogPost | null;
  prev: BlogPost | null;
} {
  const all = getAllPosts(); // newest first
  const idx = all.findIndex((p) => p.slug === post.slug);

  let next: BlogPost | null = idx > 0 ? all[idx - 1] : null;
  const prev: BlogPost | null = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  if (post.series && post.seriesIndex) {
    const inSeries = getSeriesPosts(post.series).find(
      (p) => p.seriesIndex === (post.seriesIndex ?? 0) + 1
    );
    if (inSeries) next = inSeries;
  }

  return { next, prev };
}
