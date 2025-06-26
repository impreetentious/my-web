import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllPosts, getPostBySlug, getRelatedPosts } from '@/lib/blog';
import { PostHeader } from '@/components/blog/PostHeader';
import { PostBody } from '@/components/blog/PostBody';
import site from '@/content/site.json';

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

// B13 — only pre-rendered slugs are valid: anything else 404s before it can
// reach getPostBySlug with an unsanitised path segment.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [site.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { next, prev } = getRelatedPosts(post);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div className="log-grain" aria-hidden="true" />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '72px 24px 110px' }}>
        <PostHeader post={post} />
        <PostBody>
          <MDXRemote source={post.content ?? ''} />
        </PostBody>

        {/* Related-next (C8): the log continues */}
        {(next || prev) && (
          <nav aria-label="Adjacent transmissions" style={{ marginTop: '70px' }}>
            <div className="log-rule" style={{ marginBottom: '22px' }} />
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              {prev && (
                <Link href={`/blog/${prev.slug}`} className="log-next">
                  <p className="log-next-label">PREVIOUS TRANSMISSION</p>
                  <p className="log-next-title">{prev.title}</p>
                </Link>
              )}
              {next && (
                <Link href={`/blog/${next.slug}`} className="log-next">
                  <p className="log-next-label">
                    {next.series && next.series === post.series
                      ? 'NEXT IN SERIES'
                      : 'NEXT TRANSMISSION'}
                  </p>
                  <p className="log-next-title">{next.title}</p>
                </Link>
              )}
            </div>
          </nav>
        )}

        <p style={{ marginTop: '56px' }}>
          <Link href="/" className="log-return">
            ← RETURN TO DESCENT
          </Link>
        </p>
      </div>
    </main>
  );
}
