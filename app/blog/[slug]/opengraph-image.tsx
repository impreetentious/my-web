import { ImageResponse } from 'next/og';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import site from '@/content/site.json';

export const alt = 'Transmission';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post?.title ?? site.metaTitle;
  const excerpt = post?.excerpt ?? site.metaDescription;
  const meta = post
    ? `LOG · ${post.date} · ENTRY ${String(post.entry).padStart(2, '0')}`
    : site.name;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background:
            'linear-gradient(165deg, #05060D 0%, #0A1220 42%, #142033 68%, #1A1810 100%)',
          color: '#F2F2F2',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 18,
              letterSpacing: '0.22em',
              color: 'rgba(224,178,110,0.85)',
            }}
          >
            {meta}
          </div>
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              maxWidth: 980,
              fontWeight: 400,
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              fontFamily: 'sans-serif',
              fontSize: 26,
              lineHeight: 1.45,
              color: 'rgba(184,195,208,0.95)',
              maxWidth: 920,
            }}
          >
            {excerpt.length > 160 ? `${excerpt.slice(0, 157)}…` : excerpt}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontFamily: 'monospace',
              fontSize: 16,
              letterSpacing: '0.16em',
              color: 'rgba(127,196,184,0.9)',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 10,
                background: '#E0B26E',
              }}
            />
            {site.name.toUpperCase()}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
