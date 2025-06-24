import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import { PostHeader } from '@/components/blog/PostHeader';
import { PostBody } from '@/components/blog/PostBody';

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
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px' }}>
        <PostHeader post={post} />
        <PostBody>
          <MDXRemote source={post.content ?? ''} />
        </PostBody>
      </div>
    </main>
  );
}
