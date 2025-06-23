'use client';

// Shared dossier vocabulary for panel contents. Every visible group carries
// data-block (staggered y/opacity entrance) and hairlines carry data-hair
// (scaleX draw) — PanelOverlay's open timeline picks both up by attribute.

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

/** Mono section head with a drawn hairline underneath. */
export function DossierHead({ children }: { children: React.ReactNode }) {
  return (
    <div data-block style={{ marginTop: '52px', marginBottom: '20px' }}>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        {children}
      </p>
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
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{children}</div>
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
}: {
  href?: string | null;
  meta: React.ReactNode;
  title: string;
  description: string;
  chips: string[];
  arrowLabel?: string;
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
          whiteSpace: 'nowrap',
        }}
      >
        {meta}
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
          style={rowStyle}
        >
          {inner}
        </a>
      ) : (
        // No .dossier-row class: hover choreography implies clickability,
        // and these rows don't go anywhere
        <div style={rowStyle}>
          {inner}
        </div>
      )}
    </div>
  );
}
