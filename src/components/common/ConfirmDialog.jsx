import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  onDiscard,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Delete',
  confirmVariant = 'danger',
  cancelText = 'Cancel',
  discardText = 'Discard Changes',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="460px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
          <div
            style={{
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(244, 63, 94, 0.12)',
              color: '#f43f5e',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>

          {onDiscard && (
            <Button
              variant="danger"
              style={{
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                color: '#f43f5e',
                borderColor: 'rgba(244, 63, 94, 0.25)',
              }}
              onClick={() => {
                onDiscard();
                onClose();
              }}
            >
              {discardText}
            </Button>
          )}

          <Button
            variant={confirmVariant}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
