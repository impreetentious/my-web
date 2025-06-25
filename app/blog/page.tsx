import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts, SERIES } from '@/lib/blog';

// C8 — the blog is the mission's transmission log: same fiction, no Lenis,
// server-rendered and fast. Entries are numbered chronologically; series
// membership reads as PART n/planned.

export const metadata: Metadata = {
  title: 'Transmission Log',
  description: 'Writing on strategy, systems, and building.',
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const seriesIds = [...new Set(posts.map((p) => p.series).filter(Boolean))] as string[];

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div className="log-grain" aria-hidden="true" />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '72px 24px 110px' }}>
        <Link href="/" className="log-return">
          ← RETURN TO DESCENT
        </Link>

        <p className="log-kicker">TRANSMISSION LOG</p>
        <h1 className="log-title">Writing</h1>
        <p className="log-sub">Ideas on strategy, systems, and building.</p>
        <p className="log-meta">
          {String(posts.length).padStart(2, '0')} ENTRIES LOGGED
          {posts[0] ? ` · LAST ${posts[0].date}` : ''}
        </p>

        <div className="log-rule" />

        {seriesIds.map((id) => {
          const s = SERIES[id];
          if (!s) return null;
          const logged = posts.filter((p) => p.series === id).length;
          return (
            <Link key={id} href={`/blog/series/${id}`} className="log-series-strip">
              ACTIVE SERIES — {s.title.toUpperCase()} · {logged} OF {s.planned} LOGGED{' '}
              <span aria-hidden="true">→</span>
            </Link>
          );
        })}

        {posts.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              marginTop: '40px',
            }}
          >
            No transmissions logged yet.
          </p>
        ) : (
          <div style={{ marginTop: '10px' }}>
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="log-row">
                <p className="log-row-meta">
                  LOG {post.date} · ENTRY {String(post.entry).padStart(2, '0')} ·{' '}
                  {post.readingTime} MIN
                  {post.series && post.seriesIndex
                    ? ` · PART ${post.seriesIndex}/${SERIES[post.series]?.planned ?? '?'}`
                    : ''}
                </p>
                <h2 className="log-row-title">
                  {post.title}
                  <span className="log-row-arrow" aria-hidden="true">→</span>
                </h2>
                <p className="log-row-excerpt">{post.excerpt}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
