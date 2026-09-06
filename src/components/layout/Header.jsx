import React, { useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Download,
  FolderPlus,
  Laptop,
  RotateCw,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';
import { exportWorkspaceJSON } from '../../utils/storage';
import { useToast } from '../../context/ToastContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { DataSyncProgressModal } from '../common/DataSyncProgressModal';

export const Header = ({ onOpenSearch, onNewProject }) => {
  const { theme, toggleTheme } = useTheme();
  const { projects, tasks, notes, activeProjectId, getProject } = useWorkspace();
  const { toastSuccess, toastInfo } = useToast();
  const { isInstallable, isInstalled, isReloading, hasUpdate, promptInstall, reloadPWA } = usePWAInstall();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const activeProject = activeProjectId ? getProject(activeProjectId) : null;

  const handleStartExport = () => {
    setIsExportModalOpen(true);
  };

  const handleFinishExport = () => {
    const stats = exportWorkspaceJSON({
      projects,
      tasks,
      notes,
    });
    const subInfo = stats.subProjectsCount > 0 ? ` (incl. ${stats.subProjectsCount} sub-projects)` : '';
    toastSuccess(`devOrbit backup downloaded: ${stats.projectsCount} projects${subInfo}, ${stats.tasksCount} tasks, ${stats.notesCount} docs`);
    setTimeout(() => setIsExportModalOpen(false), 800);
  };

  const handleInstallApp = async () => {
    if (isInstalled) {
      toastInfo('devOrbit is already running as a desktop app');
      return;
    }

    if (isInstallable) {
      const res = await promptInstall();
      if (res.outcome === 'accepted') {
        toastSuccess('devOrbit desktop app installed!');
      }
    } else {
      toastInfo('To install devOrbit: click the install icon in your browser URL bar or Settings menu');
    }
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-6)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
      }}
    >
      {/* Left: Quick Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button
          type="button"
          onClick={onOpenSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 10px',
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            width: '240px',
            cursor: 'pointer',
            transition: 'border-color var(--transition-fast)',
          }}
          title="Search workspace (Cmd+K)"
        >
          <Search size={13} />
          <span style={{ flex: 1, textAlign: 'left' }}>Search...</span>
          <kbd
            style={{
              fontSize: '10px',
              padding: '1px 4px',
              backgroundColor: 'var(--bg-surface-active)',
              border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-muted)',
            }}
          >
            ⌘K
          </kbd>
        </button>

        {activeProject && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: activeProject.color || 'var(--color-primary)',
              }}
            />
            <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
              {activeProject.name}
            </span>
          </div>
        )}
      </div>

      {/* Right: + New Project button, Install App, & Theme toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {!isInstalled && (
          <Button
            variant="secondary"
            size="sm"
            icon={Laptop}
            onClick={handleInstallApp}
            title="Download / Install devOrbit as a Desktop App (PWA)"
            style={{
              borderColor: isInstallable ? 'var(--color-primary)' : 'var(--border-default)',
              backgroundColor: isInstallable ? 'var(--color-primary-light)' : 'transparent',
              color: isInstallable ? 'var(--color-primary)' : 'var(--text-secondary)',
            }}
          >
            {isInstallable ? 'Install App' : 'Download App'}
          </Button>
        )}

        {isInstalled && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-active)',
              color: 'var(--color-primary)',
              border: '1px solid var(--border-subtle)',
            }}
            title="Running as Desktop App"
          >
            <Laptop size={12} />
            Desktop App
          </span>
        )}

        <Button
          variant="primary"
          size="sm"
          icon={FolderPlus}
          onClick={() => onNewProject(null)}
        >
          New Project
        </Button>

        {/* Reload PWA Button */}
        <button
          onClick={() => {
            toastInfo('Reloading devOrbit...');
            reloadPWA();
          }}
          className="btn-icon"
          title={hasUpdate ? 'Update available! Click to reload' : 'Reload App & Refresh PWA Cache'}
          style={{
            position: 'relative',
            color: hasUpdate ? 'var(--color-primary)' : 'var(--text-secondary)',
          }}
        >
          <RotateCw
            size={14}
            style={{
              transition: 'transform 0.5s ease',
              transform: isReloading ? 'rotate(360deg)' : 'none',
            }}
          />
          {hasUpdate && (
            <span
              style={{
                position: 'absolute',
                top: 3,
                right: 3,
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
              }}
            />
          )}
        </button>

        <button
          onClick={handleStartExport}
          className="btn-icon"
          title="Export JSON Backup"
        >
          <Download size={14} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-icon"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* Animated Export Modal */}
      <DataSyncProgressModal
        isOpen={isExportModalOpen}
        mode="export"
        onComplete={handleFinishExport}
      />
    </header>
  );
};
