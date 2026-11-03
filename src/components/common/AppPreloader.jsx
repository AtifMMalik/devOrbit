import React, { useState, useEffect } from 'react';
import { DevOrbitLogo } from './DevOrbitLogo';
import { useWorkspace } from '../../context/WorkspaceContext';

export const AppPreloader = ({ onFinish, minDuration = 2200 }) => {
  const { purgeExpiredTasks } = useWorkspace();
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Initializing devOrbit workspace...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 1. Trigger soft-deleted 30-day task purge during the preloader window
    try {
      purgeExpiredTasks();
    } catch (e) {
      console.warn('Preloader purge check encountered error:', e);
    }

    // Stepwise progress animation over ~2 seconds
    const t1 = setTimeout(() => {
      setProgress(45);
      setStatusText('Auditing soft-deleted tasks & 30-day recycle bin...');
    }, 600);

    const t2 = setTimeout(() => {
      setProgress(85);
      setStatusText('Synchronizing offline database & indices...');
    }, 1300);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Workspace ready');
      setIsFadingOut(true);
    }, 1900);

    const tFinish = setTimeout(() => {
      if (onFinish) onFinish();
    }, minDuration);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tFinish);
    };
  }, [minDuration, onFinish, purgeExpiredTasks]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-6)',
        transition: 'opacity 0.35s ease-out, visibility 0.35s ease-out',
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? 'none' : 'auto',
      }}
    >
      {/* Centered Brand & Logo with subtle breathing animation */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-3)',
          animation: 'pulseGlow 2s infinite ease-in-out',
        }}
      >
        <DevOrbitLogo variant="horizontal" height={36} />
      </div>

      {/* Progress Bar & Status Text */}
      <div
        style={{
          width: '260px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: 3,
            backgroundColor: 'var(--border-subtle)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: 'var(--color-primary)',
              borderRadius: 3,
              transition: 'width 0.5s ease-in-out',
              boxShadow: '0 0 8px var(--color-primary)',
            }}
          />
        </div>

        <span
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            textAlign: 'center',
            letterSpacing: '0.02em',
          }}
        >
          {statusText}
        </span>
      </div>
    </div>
  );
};

