import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import { PostHeader } from '@/components/blog/PostHeader';
import { PostBody } from '@/components/blog/PostBody';

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
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
