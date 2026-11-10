import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  FolderPlus,
  RotateCw,
  Menu,
  Maximize,
  Minimize,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useWorkspace } from '../../context/WorkspaceContext';
import { exportWorkspaceJSON } from '../../utils/storage';
import { useToast } from '../../context/ToastContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { DataSyncProgressModal } from '../common/DataSyncProgressModal';
import { ProjectAvatar } from '../common/ProjectAvatar';
import { HeaderSearchBar } from './HeaderSearchBar';

export const Header = ({
  onOpenSearch,
  onNewProject,
  sidebarCollapsed = false,
  onToggleSidebar,
  isMobile = false,
}) => {
  const { projects, tasks, notes, activeProjectId, getProject } = useWorkspace();
  const { toastSuccess, toastInfo } = useToast();
  const { isInstallable, isInstalled, isReloading, hasUpdate, promptInstall, reloadPWA } = usePWAInstall();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

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

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 var(--space-3)' : '0 var(--space-6)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        gap: 'var(--space-2)',
      }}
    >
      {/* Left: Quick Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {isMobile && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="btn-icon"
            style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
            title="Open Menu"
          >
            <Menu size={16} />
          </button>
        )}

        <HeaderSearchBar isMobile={isMobile} />

        {activeProject && !isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              marginLeft: 'var(--space-1)',
            }}
          >
            <ProjectAvatar project={activeProject} size={26} showGlow />
            <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }} className="truncate">
              {activeProject.name}
            </span>
          </div>
        )}
      </div>

      {/* Right: + New Project button, Backup Export, Reload app, Theme toggle, Fullscreen */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {/* New Project Button with Theme Primary Color */}
        <Button
          variant="primary"
          size="sm"
          icon={FolderPlus}
          onClick={() => onNewProject(null)}
          title="Create New Project (⌘⇧N)"
        >
          New Project
        </Button>

        <button
          onClick={handleStartExport}
          className="btn-icon"
          title="Export JSON Backup"
          style={{ color: '#ffffff' }}
        >
          <Download size={14} />
        </button>

        {/* Reload App / Refresh PWA Cache */}
        <button
          onClick={() => {
            toastInfo('Reloading devOrbit...');
            reloadPWA();
          }}
          className="btn-icon"
          title={hasUpdate ? 'Update available! Click to reload' : 'Reload App & Refresh PWA Cache'}
          style={{
            position: 'relative',
            color: '#ffffff',
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
                backgroundColor: 'var(--color-accent)',
              }}
            />
          )}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="btn-icon"
          title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          style={{ color: '#ffffff' }}
        >
          {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
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
