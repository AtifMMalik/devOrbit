import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Blocks,
  Check,
  Power,
  Trash2,
  Palette,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Code,
  Sparkles,
  Info,
  Clock,
  Folder,
} from 'lucide-react';
import { useExtensions } from '../extensions/ExtensionContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ThemeIcon } from '../extensions/assets';
import { THEME_DEFINITIONS } from '../extensions/themes/themeRegistry';

export const ExtensionDetailsPage = () => {
  const { extensionId } = useParams();
  const navigate = useNavigate();
  const {
    extensions,
    activeThemeId,
    enableExtension,
    disableExtension,
    deleteExtension,
    logs,
  } = useExtensions();
  const { toastSuccess, toastInfo } = useToast();

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const extension = extensions.find((e) => e.id === extensionId || e.slug === extensionId);
  const themeDef = extension?.type === 'theme' ? THEME_DEFINITIONS[extension.id] : null;

  if (!extension) {
    return (
      <div style={{ padding: 'var(--space-6)', maxWidth: 800, margin: '0 auto' }}>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)} style={{ marginBottom: 'var(--space-4)' }}>
          Back
        </Button>
        <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <Blocks size={48} style={{ color: 'var(--text-muted)', margin: '0 auto var(--space-3)' }} />
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>Extension Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            The extension with ID <code>{extensionId}</code> could not be found or has been removed.
          </p>
          <Button variant="primary" onClick={() => navigate('/settings')}>
            Return to Settings
          </Button>
        </div>
      </div>
    );
  }

  const isTheme = extension.type === 'theme';
  const isThemeActive = isTheme && activeThemeId === extension.id;
  const extensionLogs = (logs || []).filter((l) => l.extensionId === extension.id);

  const handleToggle = () => {
    if (extension.enabled) {
      disableExtension(extension.id);
      toastInfo(`${extension.name} disabled`);
    } else {
      enableExtension(extension.id);
      toastSuccess(`${extension.name} enabled`);
    }
  };

  const handleDelete = () => {
    deleteExtension(extension.id);
    toastInfo(`${extension.name} uninstalled`);
    setIsDeleteConfirmOpen(false);
    navigate(-1);
  };

  return (
    <div
      style={{
        padding: 'var(--space-6)',
        maxWidth: 960,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)',
      }}
    >
      {/* Top Back Navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate(-1)}
          style={{ paddingLeft: 0, color: 'var(--text-secondary)' }}
        >
          Back
        </Button>
      </div>

      {/* Hero Header Card */}
      <div
        className="card"
        style={{
          padding: 'var(--space-5)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-active)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-default)',
                flexShrink: 0,
              }}
            >
              {isTheme ? (
                <ThemeIcon themeId={extension.id} size={32} />
              ) : (
                <Blocks size={30} style={{ color: 'var(--color-primary)' }} />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
                  {extension.name}
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-active)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  v{extension.version}
                </span>
                {isThemeActive && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--status-done-bg)',
                      color: 'var(--status-done-text)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    <Check size={12} />
                    Active Theme
                  </span>
                )}
              </div>

              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
                By <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>{extension.author}</span> • Category:{' '}
                <span style={{ color: 'var(--color-primary)' }}>{extension.category}</span> • Type: <code>{extension.type}</code>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {isTheme ? (
              <Button
                variant={isThemeActive ? 'secondary' : 'primary'}
                icon={isThemeActive ? Check : Palette}
                style={
                  isThemeActive
                    ? { backgroundColor: 'var(--status-later-solid, #f59e0b)', color: 'var(--color-white, #ffffff)', borderColor: 'transparent' }
                    : { color: 'var(--color-white, #ffffff)' }
                }
                onClick={() => {
                  if (isThemeActive) {
                    disableExtension(extension.id);
                    toastInfo(`Reverted theme to base default`);
                  } else {
                    enableExtension(extension.id);
                    toastSuccess(`Applied theme "${extension.name}"`);
                  }
                }}
              >
                {isThemeActive ? 'Disable Theme' : 'Apply Theme'}
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={Power}
                style={{
                  backgroundColor: extension.enabled ? 'var(--status-done-solid, #10b981)' : 'var(--text-muted, #64748b)',
                  color: 'var(--color-white, #ffffff)',
                  borderColor: 'transparent',
                }}
                onClick={handleToggle}
              >
                {extension.enabled ? 'Disable' : 'Enable'}
              </Button>
            )}

            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              style={{
                background: 'transparent',
                backgroundColor: 'transparent',
                color: 'var(--color-danger, #f43f5e)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-1-5) var(--space-3-5)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-danger, #f43f5e)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
              title="Uninstall / Delete Extension"
            >
              <Trash2 size={16} />
              <span>Uninstall</span>
            </button>
          </div>
        </div>

        {/* Short Summary Description */}
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {extension.description}
        </p>
      </div>

      {/* Theme Specific Details Card */}
      {isTheme && (
        <div
          className="card"
          style={{
            padding: 'var(--space-5)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Palette size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: 'var(--text-base)', margin: 0, fontWeight: 'var(--font-weight-semibold)' }}>
              Theme Palette & Specifications
            </h3>
          </div>

          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            This theme strictly follows the 7-file Hue &amp; View design system structure. Tokens are dynamically injected to style all application components.
          </p>

          {/* Palette Swatches */}
          {themeDef?.previewColors && (
            <div>
              <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', marginBottom: 8, color: 'var(--text-secondary)' }}>
                Theme Color Palette:
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                {themeDef.previewColors.map((hex, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: '6px 12px',
                      backgroundColor: 'var(--bg-surface-active)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: hex,
                        border: '1px solid var(--border-default)',
                      }}
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{hex}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Included Files */}
          <div>
            <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', marginBottom: 8, color: 'var(--text-secondary)' }}>
              Included 7-File Hue &amp; View Architecture:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
              {['variables.css', 'lightMode.css', 'darkMode.css', 'elements.css', 'components.css', 'theme.css', 'README.md'].map((file) => (
                <div
                  key={file}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-active)',
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <Folder size={12} style={{ color: 'var(--color-primary)' }} />
                  <span>{file}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Technical Manifest & Configuration */}
      <div
        className="card"
        style={{
          padding: 'var(--space-5)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Code size={18} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ fontSize: 'var(--text-base)', margin: 0, fontWeight: 'var(--font-weight-semibold)' }}>
            Technical Metadata & Configuration
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-active)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Storage Location:</span>
            <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{extension.directory}</div>
          </div>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-active)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status:</span>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: extension.enabled ? 'var(--status-done-text)' : 'var(--text-muted)', marginTop: 2 }}>
              {extension.enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface-active)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Built-in Extension:</span>
            <div style={{ fontSize: 'var(--text-xs)', marginTop: 2 }}>{extension.builtIn ? 'Yes (Core)' : 'No (Modular)'}</div>
          </div>
        </div>

        {extension.config && Object.keys(extension.config).length > 0 && (
          <div style={{ marginTop: 'var(--space-2)' }}>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>
              Active Configuration (JSON):
            </span>
            <pre
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-default)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                overflowX: 'auto',
                color: 'var(--text-primary)',
              }}
            >
              {JSON.stringify(extension.config, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Extension Activity Audit Logs */}
      <div
        className="card"
        style={{
          padding: 'var(--space-5)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Clock size={18} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ fontSize: 'var(--text-base)', margin: 0, fontWeight: 'var(--font-weight-semibold)' }}>
            Extension Activity Log ({extensionLogs.length})
          </h3>
        </div>

        {extensionLogs.length === 0 ? (
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            No activity logged yet for this extension.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {extensionLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-surface-active)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span
                    style={{
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor:
                        log.action === 'enable'
                          ? 'var(--status-done-bg)'
                          : log.action === 'disable'
                          ? 'rgba(244, 63, 94, 0.12)'
                          : 'var(--color-primary-light)',
                      color:
                        log.action === 'enable'
                          ? 'var(--status-done-text)'
                          : log.action === 'disable'
                          ? '#f43f5e'
                          : 'var(--color-primary)',
                    }}
                  >
                    {log.action}
                  </span>
                  <span>{log.details || 'Lifecycle action triggered'}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Extension Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title={`Uninstall ${extension.name}`}
        message={`Are you sure you want to uninstall and remove "${extension.name}"? This action will disable its features and update your extensions registry.`}
        confirmText="Uninstall Extension"
        confirmVariant="danger"
      />
    </div>
  );
};

