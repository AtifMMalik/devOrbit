import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import logoIconDark from '../../assets/logo-icon-dark.png';
import logoIconLight from '../../assets/logo-icon-light.png';
import logoHorizontalDark from '../../assets/logo-horizontal-dark.png';
import logoHorizontalLight from '../../assets/logo-horizontal-light.png';
import logoStackedDark from '../../assets/logo-dark.png';
import logoStackedLight from '../../assets/logo-light.png';

export const DevOrbitLogo = ({
  variant = 'horizontal', // 'horizontal' | 'icon' | 'stacked'
  height,
  className = '',
  style = {},
  alt = 'devOrbit Logo',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'icon') {
    const iconSrc = isDark ? logoIconDark : logoIconLight;
    const defaultHeight = height || 28;
    // Aspect ratio of icon is 364 / 285 ~ 1.277
    const calculatedWidth = Math.round(defaultHeight * 1.277);

    return (
      <img
        src={iconSrc}
        alt={alt}
        className={`devorbit-logo-icon ${className}`}
        style={{
          height: defaultHeight,
          width: calculatedWidth,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  if (variant === 'stacked') {
    const stackedSrc = isDark ? logoStackedDark : logoStackedLight;
    const defaultHeight = height || 72;
    // Aspect ratio of stacked logo is 521 / 420 ~ 1.24
    const calculatedWidth = Math.round(defaultHeight * 1.24);

    return (
      <img
        src={stackedSrc}
        alt={alt}
        className={`devorbit-logo-stacked ${className}`}
        style={{
          height: defaultHeight,
          width: calculatedWidth,
          objectFit: 'contain',
          display: 'block',
          ...style,
        }}
      />
    );
  }

  // Default: horizontal (icon + text side-by-side)
  const horizSrc = isDark ? logoHorizontalDark : logoHorizontalLight;
  const defaultHeight = height || 30;
  // Aspect ratio is 501 / 100 ~ 5.01
  const calculatedWidth = Math.round(defaultHeight * 5.01);

  return (
    <img
      src={horizSrc}
      alt={alt}
      className={`devorbit-logo-horizontal ${className}`}
      style={{
        height: defaultHeight,
        width: calculatedWidth,
        maxWidth: '100%',
        objectFit: 'contain',
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
    />
  );
};
