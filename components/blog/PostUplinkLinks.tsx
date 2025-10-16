'use client';

import Link from 'next/link';
import site from '@/content/site.json';
import { trackConversion } from '@/lib/analytics';

// The end-of-post uplink links, split into a client island so each channel can
// record a `blog_uplink` conversion (the surrounding post page is a static
// Server Component). Markup + copy are unchanged from the inline version;
// facts still come only from site.json (Rule B).
export default function PostUplinkLinks() {
  return (
    <div className="log-uplink__links">
      <a
        href={`mailto:${site.email}`}
        onClick={() => trackConversion('blog_uplink', { channel: 'email' })}
      >
        EMAIL
      </a>
      <a
        href={site.socials.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackConversion('blog_uplink', { channel: 'linkedin' })}
      >
        LINKEDIN
      </a>
      <a
        href={site.socials.github}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackConversion('blog_uplink', { channel: 'github' })}
      >
        GITHUB
      </a>
      <Link
        href="/?dossier=contact"
        onClick={() => trackConversion('blog_uplink', { channel: 'contact_dossier' })}
      >
        CONTACT DOSSIER
      </Link>
    </div>
  );
}
