import React, { useEffect, useState } from 'react';
import { Download, Upload, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const EXPORT_STEPS = [
  'Scanning workspace projects & sub-tree hierarchy...',
  'Indexing tasks, priority matrices & due dates...',
  'Compiling checklists (To-Dos & Test cases)...',
  'Packaging encrypted JSON backup snapshot...',
  'Download ready! Backup exported successfully.',
];

const IMPORT_STEPS = [
  'Parsing JSON structure & verifying schema integrity...',
  'Sanitizing data & removing legacy dummy entities...',
  'Restoring projects, sub-modules & task boards...',
  'Hydrating checklist items & documentation notes...',
  'Workspace database restored successfully!',
];

export const DataSyncProgressModal = ({
  isOpen,
  mode = 'export', // 'export' | 'import'
  onComplete,
  stats = null,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const steps = mode === 'export' ? EXPORT_STEPS : IMPORT_STEPS;
  const isImport = mode === 'import';

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setIsFinished(false);
      return;
    }

    // Step progression animation sequence
    const timers = [];
    const stepDuration = isImport ? 400 : 350;

    steps.forEach((_, idx) => {
      if (idx > 0) {
        const timer = setTimeout(() => {
          setCurrentStepIndex(idx);
          if (idx === steps.length - 1) {
            setIsFinished(true);
            if (isImport) {
              try {
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.7 },
                  colors: ['#0084ff', '#38bdf8', '#10b981', '#fbbf24', '#f43f5e'],
                });
              } catch {}
            }
            setTimeout(() => {
              if (onComplete) onComplete();
            }, 600);
          }
        }, idx * stepDuration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isOpen, mode, isImport]);

  if (!isOpen) return null;

  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="animate-pop"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 132, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glowing ambient background circle */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: isImport
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(0, 132, 255, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Orbit Radar Spinner Graphic */}
        <div
          style={{
            position: 'relative',
            width: '84px',
            height: '84px',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer rotating dashed ring */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: isImport ? '2px dashed rgba(16, 185, 129, 0.5)' : '2px dashed rgba(0, 132, 255, 0.5)',
              animation: 'spin 4s linear infinite',
            }}
          />

          {/* Middle pulsing glow ring */}
          <div
            style={{
              position: 'absolute',
              inset: '6px',
              borderRadius: '50%',
              border: isImport ? '2px solid rgba(16, 185, 129, 0.3)' : '2px solid rgba(56, 189, 248, 0.3)',
              borderTopColor: isImport ? '#10b981' : '#0084ff',
              animation: 'spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />

          {/* Center Icon badge */}
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: isImport ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 132, 255, 0.15)',
              color: isImport ? '#10b981' : '#0084ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isImport ? '0 0 15px rgba(16, 185, 129, 0.3)' : '0 0 15px rgba(0, 132, 255, 0.3)',
              transition: 'all 0.3s ease',
              transform: isFinished ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {isFinished ? (
              <CheckCircle2 size={24} style={{ color: '#10b981' }} />
            ) : isImport ? (
              <Upload size={22} className="animate-pulse" />
            ) : (
              <Download size={22} className="animate-pulse" />
            )}
          </div>
        </div>

        {/* Title */}
        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
          {isFinished
            ? isImport
              ? 'Restore Completed!'
              : 'Backup Packaged!'
            : isImport
            ? 'Restoring Workspace...'
            : 'Exporting devOrbit Backup...'}
        </h3>

        {/* Subtitle / Active Step */}
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: isFinished ? 'var(--status-done-text)' : 'var(--text-secondary)',
            marginTop: 'var(--space-2)',
            minHeight: '20px',
            transition: 'all 0.2s ease',
          }}
        >
          {steps[currentStepIndex]}
        </p>

        {/* Progress Bar Container */}
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'var(--bg-surface-active)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            marginTop: 'var(--space-4)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: isImport
                ? 'linear-gradient(90deg, #10b981, #38bdf8)'
                : 'linear-gradient(90deg, #0084ff, #38bdf8)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.35s ease',
              boxShadow: isImport ? '0 0 8px rgba(16, 185, 129, 0.5)' : '0 0 8px rgba(0, 132, 255, 0.5)',
            }}
          />
        </div>

        {/* Multi-step Mini Checklist Progress */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginTop: 'var(--space-2)',
            textAlign: 'left',
          }}
        >
          {steps.map((stepText, idx) => {
            const isStepDone = idx < currentStepIndex || isFinished;
            const isStepCurrent = idx === currentStepIndex && !isFinished;

            return (
              <div
                key={stepText}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: '11px',
                  color: isStepDone
                    ? 'var(--text-primary)'
                    : isStepCurrent
                    ? 'var(--color-primary)'
                    : 'var(--text-muted)',
                  opacity: isStepDone ? 0.9 : isStepCurrent ? 1 : 0.4,
                  transition: 'opacity 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: isStepDone
                      ? 'rgba(16, 185, 129, 0.2)'
                      : isStepCurrent
                      ? 'rgba(0, 132, 255, 0.2)'
                      : 'var(--bg-surface-active)',
                    color: isStepDone
                      ? '#10b981'
                      : isStepCurrent
                      ? '#0084ff'
                      : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  {isStepDone ? '✓' : idx + 1}
                </div>
                <span className="truncate">{stepText}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
