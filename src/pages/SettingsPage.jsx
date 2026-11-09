import React, { useRef, useState, useMemo } from 'react';
import {
  Download,
  Upload,
  Trash2,
  Database,
  Copy,
  FileText,
  HardDrive,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { exportWorkspaceJSON } from '../utils/storage';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { DataSyncProgressModal } from '../components/common/DataSyncProgressModal';

export const SettingsPage = () => {
  const { projects, tasks, notes, restoreWorkspaceData, resetWorkspace } = useWorkspace();
  const { toastSuccess, toastError, toastInfo } = useToast();
  const fileInputRef = useRef(null);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncMode, setSyncMode] = useState('export'); // 'export' | 'import'
  const [pendingImportData, setPendingImportData] = useState(null);

  // Recommended Settings: User preferences stored in localStorage
  const [enableConfetti, setEnableConfetti] = useState(() => {
    return localStorage.getItem('devorbit_confetti_pref') !== 'false';
  });
  const [defaultPriority, setDefaultPriority] = useState(() => {
    return localStorage.getItem('devorbit_default_priority_pref') || 'medium';
  });
  const [platformFontSize, setPlatformFontSize] = useState(() => {
    return localStorage.getItem('devorbit_platform_font_size') || '15px';
  });

  const handleToggleConfetti = (val) => {
    setEnableConfetti(val);
    localStorage.setItem('devorbit_confetti_pref', String(val));
    toastInfo(`Task celebration confetti ${val ? 'enabled' : 'disabled'}`);
  };

  const handleChangeDefaultPriority = (val) => {
    setDefaultPriority(val);
    localStorage.setItem('devorbit_default_priority_pref', val);
    toastInfo(`Default task priority set to ${val}`);
  };

  const handleChangePlatformFontSize = (val) => {
    setPlatformFontSize(val);
    localStorage.setItem('devorbit_platform_font_size', val);
    document.documentElement.style.fontSize = val;
    toastInfo(`Platform font size set to ${val}`);
  };

  // Calculate local storage size
  const storageUsageKB = useMemo(() => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          total += (localStorage.getItem(key)?.length || 0) * 2; // UTF-16
        }
      }
      return (total / 1024).toFixed(1);
    } catch {
      return '0';
    }
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

  const handleCopyJSONToClipboard = () => {
    try {
      const data = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        projects,
        tasks,
        notes,
      };
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toastSuccess('Full workspace JSON copied to clipboard!');
    } catch {
      toastError('Failed to copy to clipboard');
    }
  };

  const handleExportMarkdownSummary = () => {
    let md = `# devOrbit Workspace Summary\n\n*Exported on ${new Date().toLocaleString()}*\n\n`;
    md += `## Projects (${projects.length})\n\n`;
    projects.forEach((p) => {
      md += `### ${p.name}\n${p.description || 'No description'}\n\n`;
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      if (pTasks.length > 0) {
        md += `#### Tasks (${pTasks.length})\n`;
        pTasks.forEach((t) => {
          md += `- [${t.status === 'done' ? 'x' : ' '}] **${t.title}** (${t.status}, priority: ${t.priority})\n`;
        });
        md += '\n';
      }
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devorbit-workspace-summary-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toastSuccess('Markdown summary report downloaded!');
  };

  const handleConfirmResetWorkspace = () => {
    if (deleteConfirmationText !== 'DELETE ALL') return;
    resetWorkspace();
    setIsResetModalOpen(false);
    setDeleteConfirmationText('');
    toastSuccess('All workspace data has been completely wiped');
  };

  return (
    <div
      className="page-container"
      style={{
        padding: 'var(--space-8)',
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        boxSizing: 'border-box',
      }}
    >
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', margin: 0, fontWeight: 'var(--font-weight-bold)' }}>
          Workspace Settings
        </h1>
      </div>

      {/* Local Storage & Backup Management */}
      <div className="card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Database size={18} style={{ color: 'var(--color-accent)' }} />
            <span>Local Storage & Backup Management</span>
          </h3>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '11px',
              padding: '3px 8px',
              backgroundColor: 'var(--bg-surface-active)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            <HardDrive size={13} style={{ color: 'var(--color-primary)' }} />
            <span>Storage Used: <strong>{storageUsageKB} KB</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
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

          <Button
            variant="secondary"
            icon={Copy}
            onClick={handleCopyJSONToClipboard}
          >
            Copy JSON to Clipboard
          </Button>

          <Button
            variant="secondary"
            icon={FileText}
            onClick={handleExportMarkdownSummary}
          >
            Export Markdown Summary
          </Button>
        </div>
      </div>

      {/* Workspace Preferences & Developer Experience */}
      <div className="card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Sliders size={18} style={{ color: 'var(--color-primary)' }} />
          <span>Workspace Preferences</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {/* Confetti Celebration */}
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                Task Completion Confetti
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                Celebrate completing tasks with particle confetti
              </div>
            </div>
            <input
              type="checkbox"
              checked={enableConfetti}
              onChange={(e) => handleToggleConfetti(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
            />
          </div>

          {/* Default Task Priority */}
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                Default Task Priority
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                Preset priority for newly drafted tasks
              </div>
            </div>
            <select
              value={defaultPriority}
              onChange={(e) => handleChangeDefaultPriority(e.target.value)}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface-active)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Platform Font Size */}
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                Platform Font Size
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                Scales typography, icons, and UI density across the entire devOrbit platform
              </div>
            </div>
            <select
              value={platformFontSize}
              onChange={(e) => handleChangePlatformFontSize(e.target.value)}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface-active)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="13.5px">Compact (13.5px)</option>
              <option value="15px">Default (15px)</option>
              <option value="16.5px">Comfortable (16.5px)</option>
              <option value="18px">Large (18px)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reset & Dangerous Zone */}
      <div
        className="card"
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          border: '1px solid var(--status-blocked-border)',
        }}
      >
        <h3 style={{ fontSize: 'var(--text-base)', margin: 0, color: 'var(--status-blocked-text)' }}>
          Reset Workspace Data
        </h3>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button
            variant="danger"
            icon={Trash2}
            onClick={() => {
              setDeleteConfirmationText('');
              setIsResetModalOpen(true);
            }}
          >
            Clear All Data
          </Button>
        </div>
      </div>

      {/* Reset Workspace Confirmation Modal with exact DELETE ALL confirmation */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => {
          setIsResetModalOpen(false);
          setDeleteConfirmationText('');
        }}
        title="Confirm Workspace Reset"
        maxWidth="480px"
      >
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
            <div>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                This action is irreversible!
              </p>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
                All projects, sub-projects, tasks, checklists, and notes in your browser storage will be permanently wiped.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5)' }}>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
              Type <strong>DELETE ALL</strong> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="DELETE ALL"
              autoFocus
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              onClick={() => {
                setIsResetModalOpen(false);
                setDeleteConfirmationText('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteConfirmationText !== 'DELETE ALL'}
              onClick={handleConfirmResetWorkspace}
            >
              Wipe Everything
            </Button>
          </div>
        </div>
      </Modal>

      {/* Data Sync Animated Loading Modal */}
      <DataSyncProgressModal
        isOpen={isSyncModalOpen}
        mode={syncMode}
        onComplete={syncMode === 'export' ? handleFinishExport : handleFinishImport}
      />
    </div>
  );
};
