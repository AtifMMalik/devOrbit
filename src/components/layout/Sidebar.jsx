import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Blocks,
} from 'lucide-react';
import { ProjectTree } from './ProjectTree';
import { ProjectAvatar } from '../common/ProjectAvatar';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useExtensions } from '../../extensions/ExtensionContext';
import { PomodoroWidget } from '../../extensions/pomodoro/PomodoroWidget';
import { DevOrbitLogo } from '../common/DevOrbitLogo';
import { ExtensionsSidebarPanel } from './ExtensionsSidebarPanel';

export const Sidebar = ({
  width = 260,
  collapsed = false,
  activePanel = 'projects',
  onResize,
  onToggleCollapse,
  onAddProject,
  onAddSubproject,
  onEditProject,
  onOpenRecycleBin,
  isMobile = false,
}) => {
  const { projects, activeProjectId, setActiveProjectId, deletedTasks, deletedProjects } = useWorkspace();
  const { isExtensionActive } = useExtensions();
  const navigate = useNavigate();
  const location = useLocation();
  const isResizingRef = useRef(false);
  const [isResizing, setIsResizing] = useState(false);

  // VS Code-style sidebar drag resizing
  const handleMouseDown = (e) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = moveEvent.clientX;
      if (newWidth < 140) {
        onToggleCollapse(true);
      } else {
        if (collapsed) onToggleCollapse(false);
        const clampedWidth = Math.max(170, Math.min(500, newWidth));
        if (onResize) onResize(clampedWidth);
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // When collapsed on desktop, the thin ActivityBar remains visible and this secondary sidebar hides
  if (collapsed && !isMobile) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobile && !collapsed && (
        <div
          onClick={() => onToggleCollapse(true)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(2px)',
            zIndex: 'calc(var(--z-modal) - 1)',
          }}
        />
      )}

      <aside
        style={{
          width: isMobile ? '280px' : `${width}px`,
          height: '100vh',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: isMobile ? 'var(--z-modal)' : 'var(--z-sticky)',
          flexShrink: 0,
          transition: isResizing ? 'none' : 'transform var(--transition-fast), width var(--transition-fast)',
          transform: isMobile && collapsed ? 'translateX(-100%)' : 'translateX(0)',
          userSelect: isResizing ? 'none' : 'auto',
          boxShadow: isMobile && !collapsed ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Brand Header - Always shows DevOrbitLogo */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 var(--space-3)',
            borderBottom: '1px solid var(--border-default)',
            flexShrink: 0,
          }}
        >
          <div
            onClick={() => {
              setActiveProjectId(null);
              navigate('/');
              if (isMobile) onToggleCollapse(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
            title="devOrbit Home"
          >
            <DevOrbitLogo variant="horizontal" height={26} />
          </div>
        </div>

        {activePanel === 'extensions' ? (
          <ExtensionsSidebarPanel />
        ) : (
          <>
            {/* Main Navigation Scroll Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--space-3) var(--space-2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              {/* Project Tree Section */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-1)',
                    paddingLeft: 'var(--space-2)',
                    paddingRight: 'var(--space-1)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--text-2xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Projects
                  </span>
                  <button
                    onClick={() => {
                      onAddProject();
                      if (isMobile) onToggleCollapse(true);
                    }}
                    className="btn-icon"
                    style={{ width: 20, height: 20, color: '#ffffff', backgroundColor: 'var(--color-primary)' }}
                    title="Create new project"
                  >
                    <Plus size={12} color="#ffffff" />
                  </button>
                </div>

                <ProjectTree
                  onAddProject={onAddProject}
                  onAddSubproject={(pId) => {
                    onAddSubproject(pId);
                    if (isMobile) onToggleCollapse(true);
                  }}
                  onEditProject={(p) => {
                    onEditProject(p);
                    if (isMobile) onToggleCollapse(true);
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* Animated Floating Pomodoro Timer Card at bottom of main sidebar (Item 6) */}
        {isExtensionActive && isExtensionActive('pomodoro') && (
          <PomodoroWidget variant="sidebar-card" />
        )}

        {/* VS Code-style Draggable Resizer Handle */}
        {!isMobile && (
          <div
            onMouseDown={handleMouseDown}
            className="sidebar-resizer"
            title="Drag to resize sidebar (Drag left to collapse)"
            style={{
              position: 'absolute',
              top: 0,
              right: -3,
              width: 6,
              height: '100%',
              cursor: 'col-resize',
              zIndex: 10,
              backgroundColor: isResizing ? 'var(--color-primary)' : 'transparent',
              transition: 'background-color var(--transition-fast)',
            }}
          />
        )}
      </aside>
    </>
  );
};
