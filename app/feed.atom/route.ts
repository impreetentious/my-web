import { getAllPosts } from '@/lib/blog';
import site from '@/content/site.json';

export const dynamic = 'force-static';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Atom requires RFC 3339 timestamps, not RFC 822 like RSS.
function rfc3339(value: string): string {
  return new Date(value).toISOString();
}

export async function GET() {
  const posts = getAllPosts();
  // `<updated>` on the feed is the newest entry's date, so a reader can tell
  // the feed changed without diffing every entry.
  const newest = posts.reduce<string | null>((latest, post) => {
    const at = new Date(post.date).getTime();
    return latest === null || at > new Date(latest).getTime() ? post.date : latest;
  }, null);

  const entries = posts
    .map((post) => {
      const url = `${site.domain}/blog/${post.slug}`;
      return `  <entry>
    <title>${escapeXml(post.title)}</title>
    <link rel="alternate" type="text/html" href="${escapeXml(url)}"/>
    <id>${escapeXml(url)}</id>
    <updated>${rfc3339(post.date)}</updated>
    <published>${rfc3339(post.date)}</published>
    <summary type="text">${escapeXml(post.excerpt)}</summary>
  </entry>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-us">
  <title>${escapeXml(site.name)} · Transmission Log</title>
  <subtitle>${escapeXml(site.metaDescription)}</subtitle>
  <link rel="self" type="application/atom+xml" href="${escapeXml(`${site.domain}/feed.atom`)}"/>
  <link rel="alternate" type="text/html" href="${escapeXml(site.domain)}"/>
  <id>${escapeXml(`${site.domain}/`)}</id>
  <updated>${rfc3339(newest ?? new Date(0).toISOString())}</updated>
  <author>
    <name>${escapeXml(site.name)}</name>
  </author>
${entries}
</feed>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
