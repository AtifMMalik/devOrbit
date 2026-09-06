import React, { useState } from 'react';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectModalParentId, setProjectModalParentId] = useState(null);
  const [editingProject, setEditingProject] = useState(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Global Shortcuts
  useKeyboardShortcuts({
    onToggleSearch: () => setIsSearchOpen((prev) => !prev),
    onEscape: () => {
      setIsSearchOpen(false);
      setIsProjectModalOpen(false);
      setIsTaskModalOpen(false);
    },
  });

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
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Left Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onAddProject={() => handleOpenNewProject(null)}
        onAddSubproject={(parentId) => handleOpenNewProject(parentId)}
        onEditProject={(p) => handleOpenEditProject(p)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: 'var(--bg-app)' }}>
        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
          onNewProject={() => handleOpenNewProject(null)}
          onNewTask={handleOpenNewTask}
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
