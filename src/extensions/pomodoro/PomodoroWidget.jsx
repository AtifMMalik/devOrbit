import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, CheckCircle, X } from 'lucide-react';

export const PomodoroWidget = ({ compact = false, variant = 'compact' }) => {
  const [mode, setMode] = useState('work'); // 'work' | 'break'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(() => {
    return parseInt(localStorage.getItem('devorbit_pomodoro_completed') || '0', 10);
  });

  const popoverRef = useRef(null);

  useEffect(() => {
    let timer = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'work') {
        const next = completedSessions + 1;
        setCompletedSessions(next);
        localStorage.setItem('devorbit_pomodoro_completed', String(next));
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
      }
      setIsRunning(false);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode, completedSessions]);

  // Click outside to dismiss popover
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Dedicated Animated Floating Card at bottom of Main Sidebar (Item 6)
  if (variant === 'sidebar-card') {
    return (
      <div
        className="pomodoro-sidebar-card card"
        style={{
          margin: 'var(--space-2) var(--space-2-5)',
          padding: 'var(--space-2-5) var(--space-3)',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: isRunning
            ? '1.5px solid var(--color-primary)'
            : '1px solid var(--border-default)',
          boxShadow: isRunning
            ? '0 0 16px rgba(0, 132, 255, 0.25)'
            : 'var(--shadow-sm)',
          transition: 'all var(--transition-normal)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          flexShrink: 0,
        }}
      >
        {/* Animated Accent Bar when running */}
        {isRunning && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2.5,
              background: mode === 'work'
                ? 'linear-gradient(90deg, var(--color-primary), var(--color-accent), var(--color-primary))'
                : 'linear-gradient(90deg, var(--status-done-solid), #34d399, var(--status-done-solid))',
              backgroundSize: '200% 100%',
              animation: 'pulse 1.8s infinite',
            }}
          />
        )}

        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Timer
              size={14}
              style={{
                color: mode === 'work' ? 'var(--color-primary)' : 'var(--status-done-solid)',
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              Focus Timer
            </span>
          </div>

          {/* Mode Pill Toggle */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-surface-active)', borderRadius: 'var(--radius-xs)', padding: 1 }}>
            <button
              type="button"
              onClick={() => { setMode('work'); setTimeLeft(25 * 60); setIsRunning(false); }}
              style={{
                padding: '1px 6px',
                fontSize: '10px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: mode === 'work' ? 'var(--color-primary)' : 'transparent',
                color: mode === 'work' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: mode === 'work' ? 'bold' : 'normal',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Work
            </button>
            <button
              type="button"
              onClick={() => { setMode('break'); setTimeLeft(5 * 60); setIsRunning(false); }}
              style={{
                padding: '1px 6px',
                fontSize: '10px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: mode === 'break' ? 'var(--status-done-solid)' : 'transparent',
                color: mode === 'break' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: mode === 'break' ? 'bold' : 'normal',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Break
            </button>
          </div>
        </div>

        {/* Digital Time & Controls Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <div
            style={{
              fontSize: '22px',
              fontFamily: 'var(--font-mono)',
              fontWeight: '700',
              color: mode === 'work' ? 'var(--color-primary)' : 'var(--status-done-solid)',
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}
          >
            {formattedTime}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={toggleTimer}
              className="btn-icon"
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-xs)',
                backgroundColor: mode === 'work' ? 'var(--color-primary)' : 'var(--status-done-solid)',
                color: '#ffffff',
              }}
              title={isRunning ? 'Pause Timer' : 'Start Focus Session'}
            >
              {isRunning ? <Pause size={13} color="#ffffff" /> : <Play size={13} color="#ffffff" />}
            </button>

            <button
              type="button"
              onClick={resetTimer}
              className="btn-icon"
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-surface-active)',
                color: 'var(--text-primary)',
              }}
              title="Reset Timer"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* Footer: Session Streak */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={11} style={{ color: 'var(--status-done-solid)' }} />
            <span>Completed:</span>
          </div>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{completedSessions} sessions</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        ref={popoverRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setIsHovered(false);
          }}
          className={`btn-icon ${isRunning ? 'active' : ''}`}
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: isRunning ? 'var(--status-current-bg)' : isOpen ? 'var(--bg-surface-active)' : 'transparent',
            color: isRunning ? 'var(--color-primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
          aria-label="Pomodoro Focus Timer"
        >
          <Timer size={18} />
          {isRunning && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                animation: 'pulse 1.5s infinite',
              }}
            />
          )}
        </button>

        {/* Hover Tooltip Bubble */}
        {isHovered && !isOpen && (
          <div
            role="tooltip"
            style={{
              position: 'absolute',
              left: 'calc(100% + 10px)',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'var(--bg-elevated, #161e31)',
              color: 'var(--text-primary)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-medium)',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-default)',
              zIndex: 'var(--z-tooltip, 600)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isRunning ? `Pomodoro (${formattedTime})` : 'Pomodoro Focus Timer'}
            <div
              style={{
                position: 'absolute',
                right: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderTop: '4px solid transparent',
                borderBottom: '4px solid transparent',
                borderRight: '5px solid var(--border-default)',
              }}
            />
          </div>
        )}

        {/* Floating Pomodoro Popover Menu */}
        {isOpen && (
          <div
            className="card"
            style={{
              position: 'absolute',
              left: 'calc(100% + 12px)',
              bottom: 0,
              width: 220,
              padding: 'var(--space-3)',
              backgroundColor: 'var(--bg-elevated, #121829)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 'var(--z-popover, 250)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2-5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Timer size={14} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                  Focus Timer
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-icon"
                style={{ width: 20, height: 20, padding: 0 }}
              >
                <X size={12} />
              </button>
            </div>

            {/* Mode Selector */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--bg-surface-active)',
                borderRadius: 'var(--radius-sm)',
                padding: 2,
                gap: 2,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMode('work');
                  setTimeLeft(25 * 60);
                  setIsRunning(false);
                }}
                style={{
                  flex: 1,
                  fontSize: '11px',
                  padding: '3px 0',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: mode === 'work' ? 'var(--color-primary)' : 'transparent',
                  color: mode === 'work' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: mode === 'work' ? 'var(--font-weight-medium)' : 'normal',
                }}
              >
                Work (25m)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('break');
                  setTimeLeft(5 * 60);
                  setIsRunning(false);
                }}
                style={{
                  flex: 1,
                  fontSize: '11px',
                  padding: '3px 0',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: mode === 'break' ? 'var(--status-done-solid)' : 'transparent',
                  color: mode === 'break' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: mode === 'break' ? 'var(--font-weight-medium)' : 'normal',
                }}
              >
                Break (5m)
              </button>
            </div>

            {/* Large Digital Clock Display */}
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--space-2) 0',
                fontSize: '28px',
                fontWeight: 'bold',
                fontFamily: 'var(--font-mono)',
                color: mode === 'work' ? 'var(--color-primary)' : 'var(--status-done-text)',
                letterSpacing: '0.04em',
              }}
            >
              {formattedTime}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={toggleTimer}
                style={{
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: mode === 'work' ? 'var(--color-primary)' : 'var(--status-done-solid)',
                  color: '#ffffff',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                {isRunning ? <Pause size={12} /> : <Play size={12} />}
                <span>{isRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                type="button"
                onClick={resetTimer}
                className="btn-icon"
                style={{ width: 28, height: 28 }}
                title="Reset Timer"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            {/* Metrics */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 6,
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={12} style={{ color: 'var(--status-done-text)' }} />
                <span>Completed:</span>
              </div>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{completedSessions} sessions</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full card widget layout
  return (
    <div
      className="card"
      style={{
        padding: 'var(--space-3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: mode === 'work' ? 'var(--color-primary-light)' : 'var(--status-done-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: mode === 'work' ? 'var(--color-primary)' : 'var(--status-done-text)',
          }}
        >
          <Timer size={16} />
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
            Pomodoro Focus ({mode.toUpperCase()})
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {completedSessions} sessions completed today
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span
          style={{
            fontSize: 'var(--text-lg)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
          }}
        >
          {formattedTime}
        </span>
        <button
          type="button"
          onClick={toggleTimer}
          className="btn-icon"
          style={{
            width: 28,
            height: 28,
            backgroundColor: 'var(--bg-surface-active)',
            color: isRunning ? 'var(--status-done-text)' : 'var(--color-primary)',
          }}
        >
          {isRunning ? <Pause size={13} /> : <Play size={13} />}
        </button>
        <button
          type="button"
          onClick={resetTimer}
          className="btn-icon"
          style={{ width: 28, height: 28 }}
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
};
