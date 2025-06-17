import type { ReactNode } from 'react';

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
  font-size: 22px;
  color: var(--color-text-primary);
  margin-top: 40px;
  margin-bottom: 16px;
}
.post-body h3 {
  font-size: 18px;
  color: var(--color-text-primary);
  margin-top: 40px;
  margin-bottom: 12px;
}
.post-body p {
  margin-bottom: 24px;
  color: var(--color-text-secondary);
}
.post-body pre {
  font-family: var(--font-mono);
  font-size: 13px;
  background: var(--color-elevated);
  padding: 16px;
  border-radius: 4px;
  border: 1px solid var(--color-border-subtle);
  overflow-x: auto;
  margin-bottom: 24px;
}
.post-body code {
  font-family: var(--font-mono);
  font-size: 13px;
  background: var(--color-elevated);
  padding: 2px 6px;
  border-radius: 2px;
}
.post-body pre code {
  padding: 0;
  background: transparent;
}
.post-body a {
  color: var(--color-accent);
  text-decoration: none;
}
.post-body a:hover {
  text-decoration: underline;
}
.post-body blockquote {
  border-left: 2px solid var(--color-accent-dim);
  padding-left: 16px;
  color: var(--color-text-muted);
  font-style: italic;
  margin-bottom: 24px;
}
`;

export function PostBody({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{postBodyCss}</style>
      <div className="post-body">{children}</div>
    </>
  );
}
