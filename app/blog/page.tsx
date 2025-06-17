import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px' }}>
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--color-accent)',
            textDecoration: 'none',
          }}
        >
          ← Home
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 300,
            fontSize: '40px',
            color: 'var(--color-text-primary)',
            marginTop: '40px',
          }}
        >
          Writing
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '15px',
            color: 'var(--color-text-secondary)',
            marginTop: '8px',
          }}
        >
          Ideas on strategy, systems, and building.
        </p>

        <hr
          style={{
            border: 'none',
            borderTop: '1px solid var(--color-border-visible)',
            margin: '32px 0 40px',
          }}
        />

        {posts.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
            }}
          >
            Nothing here yet. Come back soon.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {post.date}
                </p>
                <h2
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                    fontSize: '18px',
                    color: 'var(--color-text-primary)',
                    marginTop: '4px',
                  }}
                >
                  {post.title}
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    color: 'var(--color-text-secondary)',
                    marginTop: '4px',
                    lineHeight: 1.7,
                  }}
                >
                  {post.excerpt}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
