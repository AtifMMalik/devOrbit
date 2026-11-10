import React from 'react';

/**
 * SVG Theme Icon components
 * Provides unique visual icons for each theme exported from Hue & View
 */

export const ThemeIcon = ({ themeId, size = 20, className = '' }) => {
  switch (themeId) {
    case 'theme-aggressive-red':
    case 'aggressive-red':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="12" cy="12" r="10" fill="#140404" stroke="#d50000" strokeWidth="2" />
          <path d="M12 6L14.5 10.5L19.5 11.2L15.9 14.7L16.8 19.7L12 17.2L7.2 19.7L8.1 14.7L4.5 11.2L9.5 10.5L12 6Z" fill="#ff1744" />
        </svg>
      );

    case 'theme-black-forest':
    case 'black-forest':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#102027" stroke="#37474f" strokeWidth="2" />
          <path d="M12 4L6 14H10V19H14V14H18L12 4Z" fill="#8bc34a" />
        </svg>
      );

    case 'theme-classy-kimono':
    case 'classy-kimono':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#4a148c" stroke="#7b1fa2" strokeWidth="2" />
          <path d="M7 6L12 14L17 6" stroke="#f06292" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="2.5" fill="#f06292" />
        </svg>
      );

    case 'theme-cyberpunk-neon':
    case 'cyberpunk-neon':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#0b0014" stroke="#00f0ff" strokeWidth="2" />
          <path d="M5 16L9 8L13 14L16 10L19 16" stroke="#ff007f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="16" cy="10" r="1.5" fill="#ffe600" />
        </svg>
      );

    case 'theme-devorbit-default':
    case 'devorbit-default':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="12" cy="12" r="10" fill="#090d16" stroke="#0084ff" strokeWidth="2" />
          <circle cx="12" cy="12" r="4.5" fill="#0084ff" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" transform="rotate(-25 12 12)" />
        </svg>
      );

    case 'theme-emerald-forest':
    case 'emerald-forest':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#0d1f11" stroke="#2e7d32" strokeWidth="2" />
          <path d="M12 5L7 11H10V18H14V11H17L12 5Z" fill="#c0ca33" />
        </svg>
      );

    case 'theme-german-engineering':
    case 'german-engineering':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#14191c" stroke="#37474f" strokeWidth="2" />
          <circle cx="12" cy="12" r="5" stroke="#fbc02d" strokeWidth="2" strokeDasharray="2 2" />
          <path d="M12 9V15M9 12H15" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'theme-nordic-frost':
    case 'nordic-frost':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#0b1720" stroke="#0284c7" strokeWidth="2" />
          <path d="M12 4V20M4 12H20M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2" fill="#d97706" />
        </svg>
      );

    case 'theme-ocean-breeze':
    case 'ocean-breeze':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#00181d" stroke="#00bcd4" strokeWidth="2" />
          <path d="M4 13C6 11 8 11 10 13C12 15 14 15 16 13C18 11 19 11 20 12" stroke="#ff4081" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 9C6 7 8 7 10 9C12 11 14 11 16 9C18 7 19 7 20 8" stroke="#00bcd4" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'theme-paper-pen':
    case 'paper-pen':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#18181b" stroke="#475569" strokeWidth="2" />
          <path d="M6 18L15 9L18 12L9 21H6V18Z" fill="#1e3a8a" stroke="#b91c1c" strokeWidth="1.5" />
          <circle cx="17" cy="7" r="2" fill="#b91c1c" />
        </svg>
      );

    case 'theme-precision-blueprint':
    case 'precision-blueprint':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#0c1729" stroke="#3b82f6" strokeWidth="2" />
          <path d="M4 8H20M4 16H20M8 4V20M16 4V20" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1" />
          <circle cx="12" cy="12" r="4" stroke="#f43f5e" strokeWidth="1.5" fill="none" />
        </svg>
      );

    case 'theme-professional-blue':
    case 'professional-blue':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#07172c" stroke="#1e88e5" strokeWidth="2" />
          <rect x="6" y="7" width="12" height="10" rx="2" stroke="#42a5f5" strokeWidth="1.5" />
          <path d="M10 7V5C10 4.4 10.4 4 11 4H13C13.6 4 14 4.4 14 5V7" stroke="#42a5f5" strokeWidth="1.5" />
        </svg>
      );

    case 'theme-solar-sunset':
    case 'solar-sunset':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#1c0904" stroke="#ff5722" strokeWidth="2" />
          <circle cx="12" cy="14" r="5" fill="#ff9800" />
          <path d="M4 17H20" stroke="#f4511e" strokeWidth="2" />
          <path d="M12 4V7M6 6L8 8M18 6L16 8" stroke="#ff9800" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'theme-soothing-green':
    case 'soothing-green':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#091c0e" stroke="#43a047" strokeWidth="2" />
          <path d="M12 5C7 8 7 14 12 18C17 14 17 8 12 5Z" fill="#81c784" stroke="#2e7d32" strokeWidth="1.5" />
        </svg>
      );

    case 'theme-tokyo-vibes':
    case 'tokyo-vibes':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#13082a" stroke="#ff4081" strokeWidth="2" />
          <circle cx="12" cy="12" r="5" fill="#ff4081" />
          <path d="M6 18L18 6" stroke="#448aff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="8" r="1.5" fill="#ffd740" />
        </svg>
      );

    case 'theme-winter-crystals':
    case 'winter-crystals':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#031626" stroke="#0288d1" strokeWidth="2" />
          <path d="M12 4V20M4 12H20M7 7L17 17M17 7L7 17" stroke="#ff80ab" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.5" fill="#0288d1" stroke="#ffffff" strokeWidth="1" />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="12" cy="12" r="9" stroke="var(--color-primary)" strokeWidth="2" fill="none" />
          <path d="M12 7V17M7 12H17" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
};

