import Link from 'next/link';
import { SERIES } from '@/lib/blog';
import type { BlogPost } from '@/types';

export function PostHeader({ post }: { post: BlogPost }) {
  const series = post.series ? SERIES[post.series] : null;

  return (
    <header>
      <Link href="/blog" className="log-return">
        ← TRANSMISSION LOG
      </Link>

      <p className="log-kicker" style={{ marginTop: '42px' }}>
        LOG {post.date} · ENTRY {String(post.entry).padStart(2, '0')} · {post.readingTime} MIN
      </p>

      <h1
        className="log-title"
        style={{ fontSize: 'clamp(34px, 5.4vw, 46px)', lineHeight: 1.12 }}
      >
        {post.title}
      </h1>

      {series && post.seriesIndex && (
        <Link
          href={`/blog/series/${post.series}`}
          className="log-series-strip"
          style={{ marginTop: '18px' }}
        >
          PART {post.seriesIndex} OF {series.planned} · {series.title.toUpperCase()}{' '}
          <span aria-hidden="true">→</span>
        </Link>
      )}

      <div className="log-rule" style={{ margin: '28px 0 36px' }} />
    </header>
  );
}
