import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getSeriesPosts, SERIES } from '@/lib/blog';

// C8 — a series is a numbered mission file: published parts link out,
// unpublished parts hold their slots as TRANSMISSION PENDING.

export async function generateStaticParams() {
  const ids = [
    ...new Set(
      getAllPosts()
        .map((p) => p.series)
        .filter(Boolean),
    ),
  ] as string[];
  return ids.map((series) => ({ series }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ series: string }>;
}): Promise<Metadata> {
  const { series } = await params;
  const meta = SERIES[series];
  if (!meta) return {};
  return { title: meta.title, description: meta.description };
}

export default async function SeriesPage({ params }: { params: Promise<{ series: string }> }) {
  const { series } = await params;
  const meta = SERIES[series];
  if (!meta) notFound();

  const posts = getSeriesPosts(series);
  const slots = Array.from({ length: meta.planned }, (_, i) => {
    const part = i + 1;
    return { part, post: posts.find((p) => p.seriesIndex === part) ?? null };
  });

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div className="log-grain" aria-hidden="true" />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '72px 24px 110px' }}>
        <Link href="/blog" className="log-return">
          ← TRANSMISSION LOG
        </Link>

        <p className="log-kicker">SERIES FILE</p>
        <h1 className="log-title" style={{ fontSize: 'clamp(32px, 5vw, 44px)', lineHeight: 1.15 }}>
          {meta.title}
        </h1>
        <p className="log-sub" style={{ maxWidth: '56ch' }}>
          {meta.description}
        </p>
        <p className="log-meta">
          {String(posts.length).padStart(2, '0')} OF {String(meta.planned).padStart(2, '0')} PARTS
          LOGGED
        </p>

        <div className="log-rule" />

        <div style={{ marginTop: '8px' }}>
          {slots.map(({ part, post }) =>
            post ? (
              <Link key={part} href={`/blog/${post.slug}`} className="log-part">
                <span className="log-part-num">PART {String(part).padStart(2, '0')}</span>
                <span>
                  <span
                    className="log-row-title log-part-title"
                    style={{ fontSize: '21px', display: 'inline-block' }}
                  >
                    {post.title}
                    <span className="log-row-arrow" aria-hidden="true">
                      →
                    </span>
                  </span>
                  <span className="log-row-meta" style={{ display: 'block', marginTop: '6px' }}>
                    LOG {post.date} · {post.readingTime} MIN
                  </span>
                </span>
              </Link>
            ) : (
              <div
                key={part}
                className="log-part log-part-pending"
                aria-label={`Part ${part}: pending`}
              >
                <span className="log-part-num">PART {String(part).padStart(2, '0')}</span>
                <span className="log-row-title log-part-title" style={{ fontSize: '21px' }}>
                  Transmission pending
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </main>
  );
}
