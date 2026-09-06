import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        right: 'var(--space-6)',
        zIndex: 'var(--z-toast)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2-5)',
        pointerEvents: 'none',
        maxWidth: '380px',
        width: '100%',
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Info;
        const iconColor = isSuccess
          ? 'var(--status-done-text)'
          : isError
          ? 'var(--status-blocked-text)'
          : 'var(--color-accent)';

        return (
          <div
            key={toast.id}
            className="animate-fade-in"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              padding: 'var(--space-3-5) var(--space-4)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl), 0 8px 30px rgba(0,0,0,0.3)',
              backdropFilter: 'var(--glass-blur)',
            }}
          >
            <div style={{ color: iconColor, marginTop: 2 }}>
              <Icon size={18} />
            </div>

            <div style={{ flex: 1 }}>
              {toast.title && (
                <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  {toast.title}
                </div>
              )}
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
                {toast.message}
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              style={{
                color: 'var(--text-muted)',
                padding: 2,
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
              }}
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
