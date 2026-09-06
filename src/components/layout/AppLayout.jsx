import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { ProjectModal } from '../projects/ProjectModal';
import { TaskModal } from '../tasks/TaskModal';
import { ToastContainer } from '../common/ToastContainer';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const AppLayout = () => {
  const { isSearchOpen, setIsSearchOpen, activeProjectId } = useWorkspace();

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('devorbit_sidebar_width');
    return saved ? Math.max(180, Math.min(500, parseInt(saved, 10))) : 260;
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('devorbit_sidebar_collapsed') === 'true';
  });

  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  // Track window resize for responsive mobile view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarCollapsed]);

  const handleResizeSidebar = (newWidth) => {
    setSidebarWidth(newWidth);
    localStorage.setItem('devorbit_sidebar_width', String(newWidth));
  };

  const handleToggleCollapse = (force) => {
    setSidebarCollapsed((prev) => {
      const next = force !== undefined ? force : !prev;
      localStorage.setItem('devorbit_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectModalParentId, setProjectModalParentId] = useState(null);
  const [editingProject, setEditingProject] = useState(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Global Shortcuts: Cmd+K for search, Cmd+B to toggle sidebar
  useKeyboardShortcuts({
    onToggleSearch: () => setIsSearchOpen((prev) => !prev),
    onEscape: () => {
      setIsSearchOpen(false);
      setIsProjectModalOpen(false);
      setIsTaskModalOpen(false);
    },
  });

  // Cmd/Ctrl+B shortcut for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenNewProject = (parentId = null) => {
    setEditingProject(null);
    setProjectModalParentId(parentId);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (project) => {
    setEditingProject(project);
    setProjectModalParentId(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative' }}>
      {/* Left Sidebar */}
      <Sidebar
        width={sidebarWidth}
        collapsed={sidebarCollapsed}
        onResize={handleResizeSidebar}
        onToggleCollapse={handleToggleCollapse}
        onAddProject={() => handleOpenNewProject(null)}
        onAddSubproject={(parentId) => handleOpenNewProject(parentId)}
        onEditProject={(p) => handleOpenEditProject(p)}
        isMobile={isMobile}
      />

      {/* Main Content Area with CSS Container Query */}
      <div
        className="app-main-content-container"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          backgroundColor: 'var(--bg-app)',
          containerType: 'inline-size',
          containerName: 'maincontent',
        }}
      >
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => handleToggleCollapse()}
          onOpenSearch={() => setIsSearchOpen(true)}
          onNewProject={() => handleOpenNewProject(null)}
          onNewTask={handleOpenNewTask}
          isMobile={isMobile}
        />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Outlet
            context={{
              onOpenNewProject: handleOpenNewProject,
              onOpenEditProject: handleOpenEditProject,
              onOpenNewTask: handleOpenNewTask,
            }}
          />
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        initialParentId={projectModalParentId}
        editingProject={editingProject}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        defaultProjectId={activeProjectId}
        editingTask={editingTask}
      />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};
