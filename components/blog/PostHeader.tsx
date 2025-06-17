import Link from 'next/link';
import type { BlogPost } from '@/types';

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function PostHeader({ post }: { post: BlogPost }) {
  return (
    <header>
      <Link
        href="/blog"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--color-accent)',
          textDecoration: 'none',
        }}
      >
        ← Writing
      </Link>
      <h1
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 300,
          fontSize: '36px',
          color: 'var(--color-text-primary)',
          marginTop: '40px',
        }}
      >
        {post.title}
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          marginTop: '12px',
        }}
      >
        {formatDate(post.date)}
      </p>
      <hr
        style={{
          border: 'none',
          borderTop: '1px solid var(--color-border-visible)',
          margin: '32px 0',
        }}
      />
    </header>
  );
}
