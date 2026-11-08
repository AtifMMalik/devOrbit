import React from 'react';
import { DevOrbitLogo } from './DevOrbitLogo';

export const BrandFooter = ({
  compact = false,
  tagline = 'Fast, offline-first engineering task orchestration',
  style = {},
  className = '',
}) => {
  const currentYear = new Date().getFullYear();

  if (compact) {
    return (
      <footer
        className={`brand-footer brand-footer-compact ${className}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-3) var(--space-2)',
          opacity: 0.6,
          userSelect: 'none',
          pointerEvents: 'none',
          gap: 3,
          marginTop: 'auto',
          ...style,
        }}
      >
        <DevOrbitLogo variant="horizontal" height={16} />
        <span
          style={{
            fontSize: '9.5px',
            color: 'var(--text-muted)',
            letterSpacing: '0.02em',
            textAlign: 'center',
          }}
        >
          {tagline}
        </span>
        <span
          style={{
            fontSize: '8.5px',
            color: 'var(--text-muted)',
            opacity: 0.8,
          }}
        >
          © {currentYear} devOrbit
        </span>
      </footer>
    );
  }

  return (
    <footer
      className={`brand-footer ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6) var(--space-4)',
        marginTop: 'var(--space-6)',
        marginBottom: 'var(--space-4)',
        opacity: 0.75,
        userSelect: 'none',
        gap: 'var(--space-1-5)',
        textAlign: 'center',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <DevOrbitLogo variant="horizontal" height={22} />
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          fontWeight: 'var(--font-weight-normal)',
          letterSpacing: '0.01em',
        }}
      >
        {tagline}
      </p>

      <span
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          opacity: 0.85,
        }}
      >
        © {currentYear} devOrbit. All rights reserved.
      </span>
    </footer>
  );
};

