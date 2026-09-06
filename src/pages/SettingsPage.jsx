import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Database,
  Moon,
  Sun,
  Shield,
  CheckCircle2,
  Sparkles,
  Layers,
  Laptop,
  Check,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { exportWorkspaceJSON } from '../utils/storage';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const SettingsPage = () => {
  const { projects, tasks, notes, restoreWorkspaceData, resetWorkspace } = useWorkspace();
  const { theme, setTheme } = useTheme();
  const { toastSuccess, toastError } = useToast();
  const fileInputRef = useRef(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const handleExportJSON = () => {
    exportWorkspaceJSON({
      version: '1.0.0',
      projects,
      tasks,
      notes,
    });
    toastSuccess('devOrbit backup file downloaded');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (restoreWorkspaceData(parsed)) {
          toastSuccess('Workspace successfully restored!');
        } else {
          toastError('Invalid workspace backup format');
        }
      } catch (err) {
        toastError('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetToSample = () => {
    resetWorkspace();
    toastSuccess('Reset to preloaded sample developer data');
  };

  const handleClearWorkspace = () => {
    restoreWorkspaceData({
      version: '1.0.0',
      projects: [],
      tasks: [],
      notes: [],
    });
    toastSuccess('All workspace data cleared');
  };

  return (
    <div style={{ padding: 'var(--space-8)', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', margin: 0 }}>Workspace Settings</h1>
        <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
          Manage your local storage data, themes, backups, and workspace preferences.
        </p>
      </div>

      {/* Workspace Stats Card */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {projects.length}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
            Saved Projects & Sub-projects
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', color: 'var(--status-current-text)' }}>
            {tasks.length}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
            Active & Archived Tasks
          </div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', color: 'var(--status-done-text)' }}>
            {notes.length}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
            Documentation Documents
          </div>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-base)' }}>Theme Preferences</h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
          devOrbit design system powered by CSS variables in <code>theme.css</code>.
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            style={{
              flex: 1,
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#0e121b',
              border: theme === 'dark' ? '2px solid var(--color-primary)' : '1px solid var(--border-default)',
              color: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              cursor: 'pointer',
              boxShadow: theme === 'dark' ? 'var(--shadow-glow)' : 'none',
            }}
          >
            <Moon size={18} />
            <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Dark Glow (Default)</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('light')}
            style={{
              flex: 1,
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#ffffff',
              border: theme === 'light' ? '2px solid var(--color-primary)' : '1px solid var(--border-default)',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              cursor: 'pointer',
              boxShadow: theme === 'light' ? 'var(--shadow-glow)' : 'none',
            }}
          >
            <Sun size={18} />
            <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Crisp Light Mode</span>
          </button>
        </div>
      </div>

      {/* PWA Desktop Application */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Laptop size={18} style={{ color: 'var(--color-primary)' }} />
          <span>Desktop Application (PWA)</span>
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
          Install devOrbit directly onto your macOS, Windows, or Linux desktop as a standalone app with offline caching, high-speed launches, and native window framing.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
          {isInstalled ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '6px 12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--status-done-text)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              <Check size={14} />
              Installed & Running in Standalone Desktop Mode
            </div>
          ) : (
            <Button
              variant="primary"
              icon={Laptop}
              onClick={async () => {
                if (isInstallable) {
                  const res = await promptInstall();
                  if (res.outcome === 'accepted') {
                    toastSuccess('devOrbit desktop app installed!');
                  }
                } else {
                  toastSuccess('You can install devOrbit via the browser URL bar or app menu');
                }
              }}
            >
              {isInstallable ? 'Install Desktop App' : 'Download Desktop App'}
            </Button>
          )}

          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Service Worker: <strong>Active & Cached</strong>
          </span>
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Database size={18} style={{ color: 'var(--color-accent)' }} />
          <span>Local Storage & Backup Management</span>
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
          All workspace data is saved securely in your browser's LocalStorage. You can export a full JSON backup to transfer data to other devices or restore an earlier state anytime.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <Button
            variant="primary"
            icon={Download}
            onClick={handleExportJSON}
          >
            Export JSON Backup
          </Button>

          <label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              style={{ display: 'none' }}
            />
            <Button
              variant="secondary"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
            >
              Restore from JSON Backup
            </Button>
          </label>
        </div>
      </div>

      {/* Reset & Dangerous Zone */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          border: '1px solid var(--status-blocked-border)',
        }}
      >
        <h3 style={{ fontSize: 'var(--text-base)', color: 'var(--status-blocked-text)' }}>
          Reset & Demo Data
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
          Quickly restore the rich sample developer projects or wipe all stored entities.
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={() => setIsResetConfirmOpen(true)}
          >
            Reset to Sample Data
          </Button>

          <Button
            variant="danger"
            icon={Trash2}
            onClick={() => setIsClearConfirmOpen(true)}
          >
            Clear All Data
          </Button>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetToSample}
        title="Reset to Sample Data"
        message="This will replace current workspace projects and tasks with the preloaded sample developer datasets. Are you sure?"
        confirmText="Reset Now"
        confirmVariant="primary"
      />

      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleClearWorkspace}
        title="Clear All Workspace Data"
        message="This will wipe all projects, sub-projects, tasks, and notes permanently. Are you sure?"
        confirmText="Wipe Everything"
        confirmVariant="danger"
      />
    </div>
  );
};
