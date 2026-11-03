import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { RecycleBinModal } from '../tasks/RecycleBinModal';
import { ToastContainer } from '../common/ToastContainer';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeProjectId, undo, redo } = useWorkspace();
  const { toastSuccess, toastInfo } = useToast();

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

  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

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

  const handleOpenNewProject = (parentId = null) => {
    navigate('/project/new', { state: { parentId } });
  };

  const handleOpenEditProject = (project) => {
    if (!project) return;
    const projId = typeof project === 'string' ? project : project.id;
    navigate(`/project/${projId}/edit`);
  };

  const handleOpenNewTask = () => {
    if (activeProjectId) {
      navigate(`/project/${activeProjectId}/tasks/new`);
    } else {
      navigate('/tasks/new');
    }
  };

  const handleOpenEditTask = (task) => {
    if (!task) return;
    const tId = typeof task === 'string' ? task : task.id;
    const pId = task.projectId || activeProjectId;
    if (pId) {
      navigate(`/project/${pId}/tasks/${tId}`);
    } else {
      navigate(`/tasks/${tId}`);
    }
  };

  // Hide the floating action button when on create/edit task screens
  const isTaskScreen =
    location.pathname === '/tasks/new' ||
    location.pathname.endsWith('/tasks/new') ||
    location.pathname.includes('/tasks/');

  // Global Shortcuts:
  // - Cmd+F (and Cmd+K): Search
  // - Cmd+N / ⌥N: New Task
  // - Cmd+Shift+N / ⌥⇧N: New Project
  // - Cmd+T / ⌥T / ⌘B: Toggle Sidebar
  // - Cmd+Z: Global Undo (task moves, creations, deletions, edits)
  // - Cmd+Y / Cmd+Shift+Z: Global Redo
  // - Escape: Dismiss modals
  useKeyboardShortcuts({
    onToggleSearch: () => {
      window.dispatchEvent(new CustomEvent('devorbit:focus-search'));
    },
    onNewTask: handleOpenNewTask,
    onNewProject: () => handleOpenNewProject(null),
    onToggleSidebar: () => handleToggleCollapse(),
    onUndo: () => {
      const res = undo();
      if (res.success) {
        toastSuccess(res.message);
      } else {
        toastInfo(res.message);
      }
    },
    onRedo: () => {
      const res = redo();
      if (res.success) {
        toastSuccess(res.message);
      } else {
        toastInfo(res.message);
      }
    },
    onEscape: () => {
      setIsRecycleBinOpen(false);
    },
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative' }}>
      {/* Left Sidebar (Full or Thin) */}
      <Sidebar
        width={sidebarWidth}
        collapsed={sidebarCollapsed}
        onResize={handleResizeSidebar}
        onToggleCollapse={handleToggleCollapse}
        onAddProject={() => handleOpenNewProject(null)}
        onAddSubproject={(parentId) => handleOpenNewProject(parentId)}
        onEditProject={(p) => handleOpenEditProject(p)}
        onOpenRecycleBin={() => setIsRecycleBinOpen(true)}
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
          onOpenSearch={() => window.dispatchEvent(new CustomEvent('devorbit:focus-search'))}
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
              onOpenEditTask: handleOpenEditTask,
              onOpenRecycleBin: () => setIsRecycleBinOpen(true),
            }}
          />
        </main>
      </div>

      {/* Floating Action Button (FAB) for New Task (Hidden on task screens) */}
      {!isTaskScreen && (
        <button
          type="button"
          className="floating-action-btn"
          onClick={handleOpenNewTask}
          title="Create New Task (⌘N / ⌥N)"
        >
          <Plus size={16} />
          <span>New Task</span>
          <kbd style={{ fontSize: '10px', opacity: 0.85, marginLeft: 4, fontFamily: 'var(--font-mono)' }}>⌘N</kbd>
        </button>
      )}

      {/* Recycle Bin Modal */}
      <RecycleBinModal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
      />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};
