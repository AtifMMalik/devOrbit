import React, { useRef, useState, useMemo } from 'react';
import {
  Download,
  Upload,
  Trash2,
  Database,
  Moon,
  Sun,
  Laptop,
  Check,
  RotateCw,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { exportWorkspaceJSON } from '../utils/storage';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DataSyncProgressModal } from '../components/common/DataSyncProgressModal';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const SettingsPage = () => {
  const { projects, tasks, notes, restoreWorkspaceData, resetWorkspace } = useWorkspace();
  const { theme, setTheme } = useTheme();
  const { toastSuccess, toastError, toastInfo } = useToast();
  const { isInstallable, isInstalled, hasUpdate, promptInstall, reloadPWA } = usePWAInstall();
  const fileInputRef = useRef(null);

  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncMode, setSyncMode] = useState('export'); // 'export' | 'import'
  const [pendingImportData, setPendingImportData] = useState(null);

  // Compute workspace counts
  const stats = useMemo(() => {
    const rootCount = projects.filter((p) => !p.parentId).length;
    const subCount = projects.filter((p) => Boolean(p.parentId)).length;
    const currentTasks = tasks.filter((t) => t.status === 'current').length;
    const laterTasks = tasks.filter((t) => t.status === 'later').length;
    const doneTasks = tasks.filter((t) => t.status === 'done').length;
    const totalTodos = projects.reduce((acc, p) => acc + (p.todos?.length || 0), 0);
    const totalTesting = projects.reduce((acc, p) => acc + (p.testing?.length || 0), 0);

    return {
      totalProjects: projects.length,
      rootCount,
      subCount,
      totalTasks: tasks.length,
      currentTasks,
      laterTasks,
      doneTasks,
      totalNotes: notes.length,
      totalChecklists: totalTodos + totalTesting,
      totalTodos,
      totalTesting,
    };
  }, [projects, tasks, notes]);

  const handleStartExportJSON = () => {
    setSyncMode('export');
    setIsSyncModalOpen(true);
  };

  const handleFinishExport = () => {
    const exportedStats = exportWorkspaceJSON({
      projects,
      tasks,
      notes,
    });
    const subInfo = exportedStats.subProjectsCount > 0 ? ` (incl. ${exportedStats.subProjectsCount} sub-projects)` : '';
    toastSuccess(
      `devOrbit backup downloaded: ${exportedStats.projectsCount} projects${subInfo}, ${exportedStats.tasksCount} tasks, ${exportedStats.notesCount} docs`
    );
    setTimeout(() => setIsSyncModalOpen(false), 800);
  };

  const handleStartImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (!text || typeof text !== 'string') {
          toastError('Backup file is empty or corrupted');
          return;
        }

        const parsed = JSON.parse(text);
        setPendingImportData(parsed);
        setSyncMode('import');
        setIsSyncModalOpen(true);
      } catch (err) {
        console.error('JSON parse error on import:', err);
        toastError('Failed to parse JSON file — invalid syntax');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFinishImport = () => {
    if (pendingImportData) {
      const res = restoreWorkspaceData(pendingImportData);
      if (res && res.success) {
        const { count } = res;
        const subInfo = count.subProjects > 0 ? ` (${count.rootProjects} root, ${count.subProjects} sub-projects)` : '';
        toastSuccess(
          `Workspace restored: ${count.projects} projects${subInfo}, ${count.tasks} tasks, ${count.notes} docs!`
        );
      } else {
        toastError(res?.error || 'Invalid workspace backup format');
      }
      setPendingImportData(null);
    }
    setTimeout(() => setIsSyncModalOpen(false), 800);
  };

  const handleClearWorkspace = () => {
    resetWorkspace();
    toastSuccess('All workspace data cleared');
  };

  return (
    <div className="page-container" style={{ padding: 'var(--space-8)', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', margin: 0 }}>Workspace Settings</h1>
        <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
          Manage your local storage data, themes, backups, and workspace preferences.
        </p>
      </div>

      {/* Workspace Stats Card */}
      <div className="settings-stats-grid card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {stats.totalProjects}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2, fontWeight: 'var(--font-weight-medium)' }}>
            Projects & Sub-projects
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>
            {stats.rootCount} root • {stats.subCount} sub-projects
          </div>
        </div>

        <div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', color: 'var(--status-current-text)' }}>
            {stats.totalTasks}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2, fontWeight: 'var(--font-weight-medium)' }}>
            Total Tasks
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>
            {stats.currentTasks} current • {stats.laterTasks} later • {stats.doneTasks} done
          </div>
        </div>

        <div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', color: 'var(--status-done-text)' }}>
            {stats.totalNotes}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2, fontWeight: 'var(--font-weight-medium)' }}>
            Documentation Notes
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>
            {stats.totalTodos} to-dos • {stats.totalTesting} test cases
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

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
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

          <Button
            variant="secondary"
            icon={RotateCw}
            onClick={() => {
              toastInfo('Reloading app & refreshing cache...');
              reloadPWA();
            }}
          >
            {hasUpdate ? 'Update Available — Reload' : 'Reload Application'}
          </Button>

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
          All workspace data is saved securely in your browser's LocalStorage. You can export a full JSON backup to transfer all projects, sub-projects, tasks (current, later, done), checklists (todos, testing), and notes to other devices or restore an earlier state anytime.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <Button
            variant="primary"
            icon={Download}
            onClick={handleStartExportJSON}
          >
            Export JSON Backup
          </Button>

          <label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleStartImportJSON}
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
          Reset Workspace Data
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
          Wipe all stored projects, sub-projects, tasks, checklists, and documentation notes permanently.
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
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
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleClearWorkspace}
        title="Clear All Workspace Data"
        message="This will wipe all projects, sub-projects, tasks, and notes permanently. Are you sure?"
        confirmText="Wipe Everything"
        confirmVariant="danger"
      />

      {/* Data Sync Animated Loading Modal */}
      <DataSyncProgressModal
        isOpen={isSyncModalOpen}
        mode={syncMode}
        onComplete={syncMode === 'export' ? handleFinishExport : handleFinishImport}
      />
    </div>
  );
};
