import React, { useState } from 'react';
import { Folder } from 'lucide-react';
import { getProjectInitials } from '../../utils/imageUtils';

const SIZE_MAP = {
  xs: 14,
  sm: 18,
  md: 24,
  lg: 32,
  xl: 40,
  '2xl': 56,
};

export const ProjectAvatar = ({
  project,
  size = 'md',
  shape = 'rounded',
  showGlow = false,
  style = {},
  className = '',
  alt,
}) => {
  const [imgError, setImgError] = useState(false);

  const dim = typeof size === 'number' ? size : SIZE_MAP[size] || 24;
  const projectColor = project?.color || 'var(--color-primary)';
  const projectName = project?.name || 'Project';
  const logoUrl = project?.logo;

  const borderRadius =
    shape === 'circle'
      ? '50%'
      : shape === 'square'
      ? '4px'
      : `${Math.max(4, Math.round(dim * 0.25))}px`;

  const glowShadow = showGlow
    ? `0 0 ${Math.max(6, Math.round(dim * 0.3))}px ${projectColor}55`
    : 'none';

  // If project has an uploaded logo/icon image and hasn't failed to load
  if (logoUrl && !imgError) {
    return (
      <div
        className={className}
        style={{
          width: dim,
          height: dim,
          minWidth: dim,
          minHeight: dim,
          borderRadius,
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-surface-active)',
          border: `1px solid ${projectColor}44`,
          boxShadow: glowShadow,
          flexShrink: 0,
          ...style,
        }}
      >
        <img
          src={logoUrl}
          alt={alt || projectName}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // Fallback: Elegant colored badge with initials or mini icon
  const initials = getProjectInitials(projectName);
  const fontSize = Math.max(8, Math.round(dim * 0.42));

  return (
    <div
      className={className}
      style={{
        width: dim,
        height: dim,
        minWidth: dim,
        minHeight: dim,
        borderRadius,
        backgroundColor: `${projectColor}18`,
        border: `1px solid ${projectColor}44`,
        boxShadow: glowShadow,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: projectColor,
        fontWeight: 'var(--font-weight-bold)',
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
      title={projectName}
    >
      {dim >= 18 ? (
        <span>{initials}</span>
      ) : (
        <span
          style={{
            width: Math.max(5, Math.round(dim * 0.45)),
            height: Math.max(5, Math.round(dim * 0.45)),
            borderRadius: '50%',
            backgroundColor: projectColor,
          }}
        />
      )}
    </div>
  );
};
