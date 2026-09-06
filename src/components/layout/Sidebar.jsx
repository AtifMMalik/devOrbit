import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Orbit,
} from 'lucide-react';
import { ProjectTree } from './ProjectTree';
import { useWorkspace } from '../../context/WorkspaceContext';
import { DevOrbitLogo } from '../common/DevOrbitLogo';

export const Sidebar = ({
  collapsed,
  onToggleCollapse,
  onAddProject,
  onAddSubproject,
  onEditProject,
}) => {
  const { activeProjectId, getProject, setActiveProjectId } = useWorkspace();
  const navigate = useNavigate();

  const activeProject = activeProjectId ? getProject(activeProjectId) : null;

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        height: '100vh',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
        transition: 'width var(--transition-fast)',
        flexShrink: 0,
      }}
    >
      {/* Brand Header with Close and Open button AT THE TOP */}
      <div
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0 var(--space-1)' : '0 var(--space-3)',
          borderBottom: '1px solid var(--border-default)',
          gap: 'var(--space-2)',
        }}
      >
        <div
          onClick={() => {
            setActiveProjectId(null);
            navigate('/');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
          title="devOrbit Home"
        >
          {collapsed ? (
            <DevOrbitLogo variant="icon" height={24} />
          ) : (
            <DevOrbitLogo variant="horizontal" height={26} />
          )}
        </div>

        {/* Top Toggle Button (Both Close & Open are here at the top) */}
        <button
          onClick={onToggleCollapse}
          className="btn-icon"
          style={{ width: 24, height: 24 }}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: collapsed ? 'var(--space-2) var(--space-1)' : 'var(--space-3) var(--space-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        {/* Workspace Overview Link */}
        <div>
          <NavLink
            to="/"
            onClick={() => setActiveProjectId(null)}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
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
            {!collapsed && <span>Projects Overview</span>}
          </NavLink>
        </div>

        {/* Project Tree Section */}
        {!collapsed && (
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
                onClick={onAddProject}
                className="btn-icon"
                style={{ width: 18, height: 18 }}
                title="Create new project"
              >
                <Plus size={12} />
              </button>
            </div>

            <ProjectTree
              onAddProject={onAddProject}
              onAddSubproject={onAddSubproject}
              onEditProject={onEditProject}
            />
          </div>
        )}

        {/* Active Project Tools */}
        {activeProject && !collapsed && (
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
                gap: 5,
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
              <span className="truncate">{activeProject.name}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <NavLink
                to={`/project/${activeProject.id}/overview`}
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
                to={`/project/${activeProject.id}/tasks`}
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
                to={`/project/${activeProject.id}/notes`}
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

      {/* Footer / Settings (Clean, no expand button here) */}
      <div
        style={{
          padding: collapsed ? 'var(--space-2) 0' : 'var(--space-2) var(--space-2)',
          borderTop: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: collapsed ? 'center' : 'stretch',
        }}
      >
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
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
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
};
