'use client';

import { useId, useState } from 'react';
import type { CaseStudy, FigureKind } from '@/types';

// Shared dossier vocabulary for panel contents. Every visible group carries
// data-block (staggered y/opacity entrance) and hairlines carry data-hair
// (scaleX draw) — PanelOverlay's open timeline picks both up by attribute.

// ─── Seeded artifact figures (C4) ───────────────────────────────────────────
// Every row carries an abstract schematic drawn deterministically from its
// id — serial-numbered figures, no photos, no randomness between renders.

function seededRandom(seedStr: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GOLD_STROKE = 'rgba(224, 178, 110, 0.75)';

function figurePaths(kind: FigureKind, rnd: () => number): React.ReactNode {
  switch (kind) {
    case 'network': {
      const hub = { x: 34, y: 32 };
      const sats = Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + rnd() * 0.7;
        const r = 16 + rnd() * 12;
        return { x: hub.x + Math.cos(a) * r * 1.5, y: hub.y + Math.sin(a) * r * 0.8 };
      });
      return (
        <>
          {sats.map((s, i) => (
            <line key={`l${i}`} x1={hub.x} y1={hub.y} x2={s.x} y2={s.y} strokeWidth="0.6" />
          ))}
          {sats.map((s, i) => (
            <circle
              key={`c${i}`}
              cx={s.x}
              cy={s.y}
              r={1.6}
              fill={i === 2 ? GOLD_STROKE : 'currentColor'}
              stroke="none"
            />
          ))}
          <circle cx={hub.x} cy={hub.y} r={3.2} fill="none" strokeWidth="0.8" />
          <circle cx={hub.x} cy={hub.y} r={1.1} fill="currentColor" stroke="none" />
        </>
      );
    }
    case 'bars': {
      const bars = Array.from({ length: 8 }, () => 8 + rnd() * 34);
      const goldIdx = 5;
      return (
        <>
          <line x1={8} y1={54} x2={88} y2={54} strokeWidth="0.6" />
          {bars.map((h, i) => (
            <rect
              key={i}
              x={11 + i * 10}
              y={54 - h}
              width={3.4}
              height={h}
              fill={i === goldIdx ? GOLD_STROKE : 'currentColor'}
              stroke="none"
              opacity={i === goldIdx ? 1 : 0.75}
            />
          ))}
        </>
      );
    }
    case 'stack': {
      return (
        <>
          {Array.from({ length: 4 }, (_, i) => (
            <rect
              key={i}
              x={26 + (rnd() - 0.5) * 10}
              y={10 + i * 11.5}
              width={44}
              height={8}
              fill="none"
              strokeWidth={i === 1 ? 1 : 0.6}
              stroke={i === 1 ? GOLD_STROKE : 'currentColor'}
            />
          ))}
        </>
      );
    }
    case 'flow': {
      const ys = Array.from({ length: 4 }, () => 24 + rnd() * 18);
      const xs = [12, 36, 60, 84];
      return (
        <>
          {xs.slice(0, -1).map((x, i) => (
            <path
              key={`p${i}`}
              d={`M ${x + 3} ${ys[i]} H ${(x + xs[i + 1]) / 2} V ${ys[i + 1]} H ${xs[i + 1] - 3}`}
              fill="none"
              strokeWidth="0.6"
            />
          ))}
          {xs.map((x, i) => (
            <rect
              key={`n${i}`}
              x={x - 3}
              y={ys[i] - 3}
              width={6}
              height={6}
              fill="none"
              strokeWidth={i === 3 ? 1 : 0.7}
              stroke={i === 3 ? GOLD_STROKE : 'currentColor'}
            />
          ))}
        </>
      );
    }
    case 'orbit': {
      const dots = Array.from({ length: 3 }, () => rnd() * Math.PI * 2);
      const radii = [13, 23, 33];
      return (
        <>
          {radii.map((r, i) => (
            <ellipse
              key={`e${i}`}
              cx={48}
              cy={32}
              rx={r}
              ry={r * 0.42}
              fill="none"
              strokeWidth="0.5"
            />
          ))}
          {dots.map((a, i) => (
            <circle
              key={`d${i}`}
              cx={48 + Math.cos(a) * radii[i]}
              cy={32 + Math.sin(a) * radii[i] * 0.42}
              r={1.7}
              fill={i === 1 ? GOLD_STROKE : 'currentColor'}
              stroke="none"
            />
          ))}
          <circle cx={48} cy={32} r={1.4} fill="currentColor" stroke="none" />
        </>
      );
    }
    case 'pulse': {
      const spike = 28 + rnd() * 30;
      const d = `M 6 34 H ${spike - 10} l 3 -5 l 4 16 l 4 -24 l 4 18 l 3 -5 H 90`;
      return (
        <>
          <path d={d} fill="none" strokeWidth="0.8" />
          <circle cx={spike + 1} cy={21} r={1.6} fill={GOLD_STROKE} stroke="none" />
        </>
      );
    }
  }
}

/** Serial-numbered abstract schematic — the row's artifact (C4). */
export function DossierFigure({
  kind,
  seed,
  serial,
}: {
  kind: FigureKind;
  seed: string;
  serial: string;
}) {
  const rnd = seededRandom(seed);
  return (
    <div className="dossier-figure" aria-hidden="true">
      <svg viewBox="0 0 96 64" stroke="currentColor" fill="none">
        {figurePaths(kind, rnd)}
      </svg>
      <p className="dossier-figure-serial">{serial}</p>
    </div>
  );
}

// ─── Case file extract (C5) ─────────────────────────────────────────────────

const CASE_BEATS: Array<[keyof CaseStudy, string]> = [
  ['context', 'CONTEXT'],
  ['decision', 'DECISION'],
  ['move', 'ANALYTICAL MOVE'],
  ['model', 'OPERATING MODEL'],
  ['outcome', 'OUTCOME'],
];

/** Redacted artefact — anonymisation made visible. Bar widths are seeded by
 *  the case id; the one legible line is the real outcome metric. */
function RedactedDoc({ seed, metric }: { seed: string; metric: string }) {
  const rnd = seededRandom(seed + ':doc');
  const rows = Array.from({ length: 5 }, (_, i) => ({
    w: 42 + rnd() * 50,
    redacted: i === 1 || i === 3,
  }));
  return (
    <div className="case-doc" aria-hidden="true">
      {rows.map((row, i) =>
        row.redacted ? (
          <span key={i} className="case-doc-redact" style={{ width: `${Math.min(70, row.w)}%` }} />
        ) : (
          <span key={i} className="case-doc-line" style={{ width: `${row.w}%` }} />
        ),
      )}
      <p className="case-doc-metric">{metric}</p>
    </div>
  );
}

/** Anonymised case study rendered as a declassified extract (C5). */
export function CaseFile({ index, id, study }: { index: number; id: string; study: CaseStudy }) {
  const [open, setOpen] = useState(false);
  const regionId = useId();
  const toggleId = `${regionId}-toggle`;
  // the one legible line on the redacted artefact: the outcome's own figure
  const metric = study.outcome.split(/[,—]/)[0].trim().toUpperCase();
  return (
    <div className="case-file" data-open={open}>
      <button
        id={toggleId}
        type="button"
        className="case-file-toggle"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{`CASE FILE ${String(index + 1).padStart(2, '0')} · DECLASSIFIED EXTRACT`}</span>
        <span className="case-file-sign" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      {/* The collapse is a CSS grid-rows clip — the content stays mounted, so
          assistive tech must be told it's gone: inert + aria-hidden track the
          toggle, or browse mode reads "collapsed" case files anyway. */}
      <div
        className="case-file-body"
        id={regionId}
        role="region"
        aria-labelledby={toggleId}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="case-file-inner">
          <div className="case-file-grid">
            <div>
              {CASE_BEATS.map(([key, label]) => (
                <div key={key} className="case-beat">
                  <p className="case-beat-label">{label}</p>
                  <p className="case-beat-text">{study[key]}</p>
                </div>
              ))}
            </div>
            <RedactedDoc seed={id} metric={metric} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Display-serif pull-quote — a stat callout speaking the document voice (C4). */
export function PullQuote({ quote, refLine }: { quote: string; refLine?: string }) {
  return (
    <div data-block style={{ margin: '34px 0 8px' }}>
      <div
        data-hair
        style={{ height: '1px', background: 'rgba(224, 178, 110, 0.35)', transformOrigin: 'left' }}
      />
      <blockquote
        style={{
          fontFamily: 'var(--font-display), Georgia, serif',
          fontStyle: 'italic',
          fontSize: 'clamp(22px, 2.6vw, 28px)',
          lineHeight: 1.32,
          color: 'var(--color-text-primary)',
          padding: '18px 0 14px',
          maxWidth: '540px',
        }}
      >
        {quote}
      </blockquote>
      {refLine && (
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.24em',
            color: 'var(--color-text-muted)',
            paddingBottom: '16px',
          }}
        >
          {refLine}
        </p>
      )}
      <div
        data-hair
        style={{ height: '1px', background: 'rgba(255, 255, 255, 0.10)', transformOrigin: 'left' }}
      />
    </div>
  );
}

export function DossierBlock({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div data-block style={style}>
      {children}
    </div>
  );
}

/** Mono section head with a drawn hairline underneath. Rendered as a real h3
 *  (panel title is the h2) so the dossier outline is navigable by heading —
 *  fontWeight 400 keeps it pixel-identical to the old <p>. */
export function DossierHead({ children }: { children: React.ReactNode }) {
  return (
    <div data-block style={{ marginTop: '52px', marginBottom: '20px' }}>
      <h3
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          fontWeight: 400,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        {children}
      </h3>
      <div
        data-hair
        style={{
          height: '1px',
          background: 'rgba(255, 255, 255, 0.12)',
          marginTop: '10px',
          transformOrigin: 'left',
        }}
      />
    </div>
  );
}

/** Bordered mono chip. */
export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        padding: '4px 10px',
        borderRadius: '2px',
        fontSize: '11px',
        letterSpacing: '0.06em',
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-text-secondary)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{children}</div>;
}

// ─── Channel CTA (C6/F1) ─────────────────────────────────────────────────────
// The recruiter-path link, on-fiction: a bordered gold affordance with a
// departing arrow. Shared by AboutPanel (channels block) and ContactPanel so
// both speak the same language (F1 extracted it here).

const channelLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: '9px',
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  letterSpacing: '0.16em',
  color: 'var(--color-gold)',
  textDecoration: 'none',
  border: '1px solid rgba(224, 178, 110, 0.28)',
  padding: '11px 16px',
  transition: 'border-color 0.25s ease, background 0.25s ease',
};

export function ChannelLink({
  href,
  children,
  download,
  onSelect,
}: {
  href: string;
  children: React.ReactNode;
  download?: boolean;
  /** Fired on activation — the call site names the conversion (analytics). */
  onSelect?: () => void;
}) {
  return (
    <a
      href={href}
      download={download}
      onClick={onSelect}
      style={channelLinkStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(224, 178, 110, 0.6)';
        e.currentTarget.style.background = 'rgba(224, 178, 110, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(224, 178, 110, 0.28)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
      <span aria-hidden="true">→</span>
    </a>
  );
}

/** Full-width interactive row — hover choreography lives in globals.css
 *  (.dossier-row): hairline brightens, title nudges, arrow slides. */
export function DossierRow({
  href,
  meta,
  title,
  description,
  chips,
  arrowLabel,
  figure,
  onSelect,
  children,
}: {
  href?: string | null;
  meta: React.ReactNode;
  title: string;
  description: string;
  chips: string[];
  arrowLabel?: string;
  /** Row artifact (C4) — rendered in the meta column under the meta text. */
  figure?: React.ReactNode;
  /** Fired when the row link is activated — the call site names the
   *  conversion (analytics). Only meaningful when `href` is set. */
  onSelect?: () => void;
  /** Extras below the row (C5 case files) — rendered OUTSIDE the link so an
   *  interactive extract never nests inside an <a>. */
  children?: React.ReactNode;
}) {
  const inner = (
    <>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.12em',
          color: 'var(--color-text-muted)',
          paddingTop: '4px',
        }}
      >
        <span style={{ whiteSpace: 'nowrap' }}>{meta}</span>
        {figure}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
          <h3
            className="dossier-row-title"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '20px',
              fontWeight: 400,
              color: 'var(--color-text-primary)',
            }}
          >
            {title}
          </h3>
          {/* The arrow is affordance language — only rows that actually go
              somewhere may speak it */}
          {href && (
            <span
              className="dossier-row-arrow"
              aria-hidden="true"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--color-accent)',
              }}
            >
              {arrowLabel ?? '→'}
            </span>
          )}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            fontWeight: 400,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.7,
            marginTop: '8px',
            maxWidth: '520px',
          }}
        >
          {description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
          {chips.map((chip) => (
            <Chip key={chip}>{chip}</Chip>
          ))}
        </div>
      </div>
    </>
  );

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(72px, 96px) 1fr',
    gap: '20px',
    padding: '28px 12px 30px 4px',
    textDecoration: 'none',
    color: 'inherit',
  };

  return (
    <div data-block>
      <div
        data-hair
        style={{
          height: '1px',
          background: 'rgba(255, 255, 255, 0.10)',
          transformOrigin: 'left',
        }}
      />
      {href ? (
        <a
          className="dossier-row"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onSelect}
          style={rowStyle}
        >
          {inner}
        </a>
      ) : (
        // No .dossier-row class: hover choreography implies clickability,
        // and these rows don't go anywhere
        <div style={rowStyle}>{inner}</div>
      )}
      {children && <div className="dossier-row-extra">{children}</div>}
    </div>
  );
}
