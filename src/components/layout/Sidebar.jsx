import React, { useState, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Settings,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { ProjectTree } from './ProjectTree';
import { ProjectAvatar } from '../common/ProjectAvatar';
import { useWorkspace } from '../../context/WorkspaceContext';
import { DevOrbitLogo } from '../common/DevOrbitLogo';

export const Sidebar = ({
  width = 260,
  collapsed = false,
  onResize,
  onToggleCollapse,
  onAddProject,
  onAddSubproject,
  onEditProject,
  onOpenRecycleBin,
  isMobile = false,
}) => {
  const { projects, activeProjectId, getProject, setActiveProjectId, deletedTasks, deletedProjects } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const isResizingRef = useRef(false);
  const [isResizing, setIsResizing] = useState(false);

  const activeProject = activeProjectId ? getProject(activeProjectId) : null;

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

  // When collapsed on desktop, render a thin 56px sidebar including logo, toggle button, and project icons
  if (collapsed && !isMobile) {
    return (
      <aside
        style={{
          width: '56px',
          height: '100vh',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 'var(--z-sticky)',
          flexShrink: 0,
          padding: 'var(--space-2) 0',
          gap: 'var(--space-2)',
        }}
      >
        {/* DevOrbit Logo */}
        <div
          onClick={() => {
            setActiveProjectId(null);
            navigate('/');
          }}
          style={{
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="devOrbit Home"
        >
          <DevOrbitLogo variant="icon" height={24} />
        </div>

        {/* Toggle button below devorbit icon */}
        <button
          type="button"
          onClick={() => onToggleCollapse(false)}
          className="btn-icon"
          style={{ width: 30, height: 30 }}
          title="Expand Sidebar (⌘T / ⌥T / [)"
        >
          <PanelLeftOpen size={16} />
        </button>

        <div style={{ width: '32px', height: '1px', backgroundColor: 'var(--border-default)', margin: '2px 0' }} />

        {/* Project Overview & Work Analysis Navigation Icons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '100%' }}>
          <button
            type="button"
            onClick={() => {
              setActiveProjectId(null);
              navigate('/');
            }}
            className={`btn-icon ${location.pathname === '/' && !activeProjectId ? 'active' : ''}`}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: location.pathname === '/' && !activeProjectId ? 'var(--bg-surface-active)' : 'transparent',
              color: location.pathname === '/' && !activeProjectId ? 'var(--color-primary)' : 'var(--text-secondary)',
            }}
            title="Projects Overview"
          >
            <LayoutDashboard size={15} />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveProjectId(null);
              navigate('/analytics');
            }}
            className={`btn-icon ${location.pathname === '/analytics' ? 'active' : ''}`}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: location.pathname === '/analytics' ? 'var(--bg-surface-active)' : 'transparent',
              color: location.pathname === '/analytics' ? 'var(--color-primary)' : 'var(--text-secondary)',
            }}
            title="Work Analytics & Velocity"
          >
            <TrendingUp size={15} />
          </button>
        </div>

        <div style={{ width: '32px', height: '1px', backgroundColor: 'var(--border-default)', margin: '2px 0' }} />

        {/* Projects' icons vertical scroll area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '4px 0',
          }}
        >
          {projects.map((proj) => {
            const isActive = activeProjectId === proj.id;
            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => {
                  setActiveProjectId(proj.id);
                  navigate(`/project/${proj.id}/tasks`);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: isActive ? '0 0 0 2px var(--color-primary)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform var(--transition-fast)',
                }}
                title={`${proj.name} (Click to open)`}
              >
                <ProjectAvatar project={proj} size={28} />
              </button>
            );
          })}

          {/* Quick Add Project */}
          <button
            type="button"
            onClick={onAddProject}
            className="btn-icon"
            style={{ width: 28, height: 28, border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-sm)', marginTop: 2 }}
            title="Create New Project (⌘⇧N / ⌥⇧N)"
          >
            <Plus size={14} />
          </button>
        </div>

        <div style={{ width: '32px', height: '1px', backgroundColor: 'var(--border-default)', margin: '2px 0' }} />

        {/* Bottom icon actions: Recycle Bin & Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
          <button
            type="button"
            onClick={onOpenRecycleBin}
            className="btn-icon"
            style={{ width: 32, height: 32, position: 'relative' }}
            title="Recycle Bin (30-day task and project recovery)"
          >
            <Trash2 size={15} />
            {((deletedTasks?.length || 0) + (deletedProjects?.length || 0)) > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#f43f5e',
                }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className={`btn-icon ${location.pathname === '/settings' ? 'active' : ''}`}
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: location.pathname === '/settings' ? 'var(--bg-surface-active)' : 'transparent',
              color: location.pathname === '/settings' ? 'var(--color-primary)' : 'var(--text-secondary)',
            }}
            title="Settings & Backup"
          >
            <Settings size={15} />
          </button>
        </div>
      </aside>
    );
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
        {/* Brand Header with Close button */}
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--space-3)',
            borderBottom: '1px solid var(--border-default)',
            gap: 'var(--space-2)',
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

          {/* Close Sidebar button */}
          <button
            onClick={() => onToggleCollapse(true)}
            className="btn-icon"
            style={{ width: 26, height: 26 }}
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={15} />
          </button>
        </div>

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
          {/* Top Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <NavLink
              to="/"
              onClick={() => {
                setActiveProjectId(null);
                if (isMobile) onToggleCollapse(true);
              }}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                color: isActive && !activeProjectId ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive && !activeProjectId ? 'var(--bg-surface-active)' : 'transparent',
                fontWeight: isActive && !activeProjectId ? 'var(--font-weight-medium)' : 'normal',
                fontSize: 'var(--text-xs)',
                textDecoration: 'none',
                transition: 'background-color var(--transition-fast)',
              })}
              title="Projects Overview"
            >
              <LayoutDashboard size={15} />
              <span>Projects Overview</span>
            </NavLink>

            <NavLink
              to="/analytics"
              onClick={() => {
                setActiveProjectId(null);
                if (isMobile) onToggleCollapse(true);
              }}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--bg-surface-active)' : 'transparent',
                fontWeight: isActive ? 'var(--font-weight-medium)' : 'normal',
                fontSize: 'var(--text-xs)',
                textDecoration: 'none',
                transition: 'background-color var(--transition-fast)',
              })}
              title="Engineering Analytics & Velocity"
            >
              <TrendingUp size={15} />
              <span>Work Analytics</span>
            </NavLink>
          </div>

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
                style={{ width: 18, height: 18 }}
                title="Create new project"
              >
                <Plus size={12} />
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

          {/* Active Project Tools */}
          {activeProject && (
            <div
              style={{
                paddingTop: 'var(--space-3)',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 'var(--space-1)',
                  paddingLeft: 'var(--space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <ProjectAvatar project={activeProject} size={24} showGlow />
                <span className="truncate">{activeProject.name}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <NavLink
                  to={`/project/${activeProject.id}/tasks`}
                  onClick={() => isMobile && onToggleCollapse(true)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--bg-surface-active)' : 'transparent',
                    fontWeight: isActive ? 'var(--font-weight-medium)' : 'normal',
                    fontSize: 'var(--text-xs)',
                    textDecoration: 'none',
                  })}
                >
                  <CheckSquare size={14} />
                  <span>Tasks & Issues</span>
                </NavLink>

                <NavLink
                  to={`/project/${activeProject.id}/overview`}
                  onClick={() => isMobile && onToggleCollapse(true)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--bg-surface-active)' : 'transparent',
                    fontWeight: isActive ? 'var(--font-weight-medium)' : 'normal',
                    fontSize: 'var(--text-xs)',
                    textDecoration: 'none',
                  })}
                >
                  <LayoutDashboard size={14} />
                  <span>Overview</span>
                </NavLink>

                <NavLink
                  to={`/project/${activeProject.id}/analytics`}
                  onClick={() => isMobile && onToggleCollapse(true)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--bg-surface-active)' : 'transparent',
                    fontWeight: isActive ? 'var(--font-weight-medium)' : 'normal',
                    fontSize: 'var(--text-xs)',
                    textDecoration: 'none',
                  })}
                >
                  <TrendingUp size={14} />
                  <span>Analytics</span>
                </NavLink>

                <NavLink
                  to={`/project/${activeProject.id}/notes`}
                  onClick={() => isMobile && onToggleCollapse(true)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--bg-surface-active)' : 'transparent',
                    fontWeight: isActive ? 'var(--font-weight-medium)' : 'normal',
                    fontSize: 'var(--text-xs)',
                    textDecoration: 'none',
                  })}
                >
                  <BookOpen size={14} />
                  <span>Docs</span>
                </NavLink>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Recycle Bin & Settings */}
        <div
          style={{
            padding: 'var(--space-2) var(--space-2)',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (onOpenRecycleBin) onOpenRecycleBin();
              if (isMobile) onToggleCollapse(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              border: 'none',
              width: '100%',
              textAlign: 'left',
              transition: 'background-color var(--transition-fast)',
            }}
            title="Recycle Bin (30-day task and project recovery)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Trash2 size={15} />
              <span>Recycle Bin</span>
            </div>
            {((deletedTasks?.length || 0) + (deletedProjects?.length || 0)) > 0 && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '1px 5px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  color: '#f43f5e',
                }}
              >
                {(deletedTasks?.length || 0) + (deletedProjects?.length || 0)}
              </span>
            )}
          </button>

          <NavLink
            to="/settings"
            onClick={() => isMobile && onToggleCollapse(true)}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--bg-surface-active)' : 'transparent',
              fontSize: 'var(--text-xs)',
              textDecoration: 'none',
            })}
            title="Settings & Backup"
          >
            <Settings size={15} />
            <span>Settings</span>
          </NavLink>
        </div>

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
