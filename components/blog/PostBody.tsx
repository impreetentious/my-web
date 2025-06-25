import type { ReactNode } from 'react';

// C8 — dossier vocabulary for the reading surface: serif display headings,
// gold accents, mono code. Body text stays the instrument sans for length.
const postBodyCss = `
.post-body {
  max-width: 68ch;
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: 16px;
  line-height: 1.85;
  color: var(--color-text-primary);
}
.post-body h2 {
  font-family: var(--font-display), Georgia, serif;
  font-weight: 400;
  font-size: 26px;
  color: var(--color-text-primary);
  margin-top: 44px;
  margin-bottom: 16px;
}
.post-body h3 {
  font-family: var(--font-display), Georgia, serif;
  font-weight: 400;
  font-size: 21px;
  color: var(--color-text-primary);
  margin-top: 40px;
  margin-bottom: 12px;
}
.post-body p {
  margin-bottom: 24px;
  color: var(--color-text-secondary);
}
.post-body strong { color: var(--color-text-primary); font-weight: 500; }
.post-body pre {
  font-family: var(--font-mono);
  font-size: 13px;
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
  border: 1px solid var(--color-border-subtle);
  overflow-x: auto;
  margin-bottom: 24px;
}
.post-body code {
  font-family: var(--font-mono);
  font-size: 13px;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
}
.post-body pre code {
  padding: 0;
  background: transparent;
}
.post-body a {
  color: var(--color-gold);
  text-decoration: none;
  border-bottom: 1px solid rgba(224, 178, 110, 0.35);
  transition: border-color 0.2s ease;
}
.post-body a:hover {
  border-bottom-color: rgba(224, 178, 110, 0.9);
}
.post-body blockquote {
  border-left: 2px solid rgba(224, 178, 110, 0.5);
  padding-left: 18px;
  color: var(--color-text-secondary);
  font-family: var(--font-display), Georgia, serif;
  font-style: italic;
  font-size: 19px;
  line-height: 1.6;
  margin-bottom: 24px;
}
.post-body ul, .post-body ol {
  margin: 0 0 24px 22px;
  color: var(--color-text-secondary);
}
.post-body li { margin-bottom: 8px; }
`;

export function PostBody({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{postBodyCss}</style>
      <div className="post-body">{children}</div>
    </>
  );
}
