import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Plus,
  FileCode,
  Edit2,
  Trash2,
  CheckSquare,
  LayoutDashboard,
  BookOpen,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { ProjectBreadcrumbs } from './ProjectBreadcrumbs';
import { Button } from '../common/Button';

export const ProjectHeader = ({
  project,
  onNewTask,
  onNewSubproject,
  onOpenMarkdownSync,
  onEditProject,
  onDeleteProject,
}) => {
  if (!project) return null;

  return (
    <div
      style={{
        padding: 'var(--space-4) var(--space-8) 0',
        borderBottom: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      {/* Top Breadcrumb & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <ProjectBreadcrumbs projectId={project.id} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={FileCode}
            onClick={onOpenMarkdownSync}
            title="Import or Export tasks via Markdown"
          >
            Markdown Sync
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Layers}
            onClick={onNewSubproject}
            title="Create a child sub-project"
          >
            Sub-Project
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={onNewTask}
          >
            New Task
          </Button>
          <button
            onClick={onEditProject}
            className="btn-icon"
            style={{ width: 26, height: 26 }}
            title="Edit Project Details"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={onDeleteProject}
            className="btn-icon btn-icon-danger"
            style={{ width: 26, height: 26, color: '#f43f5e' }}
            title="Delete Project"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Project Title & Description */}
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: project.color || 'var(--color-primary)',
            }}
          />
          <h1 style={{ fontSize: 'var(--text-lg)', margin: 0, fontWeight: 'var(--font-weight-semibold)' }}>
            {project.name}
          </h1>
        </div>
        {project.description && (
          <p style={{ marginTop: '2px', maxWidth: '750px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            {project.description}
          </p>
        )}
      </div>

      {/* Navigation Tool Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-5)',
        }}
      >
        <NavLink
          to={`/project/${project.id}/overview`}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: 'var(--space-2) 0',
            fontSize: 'var(--text-xs)',
            fontWeight: isActive ? 'var(--font-weight-medium)' : 'normal',
            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: '-1px',
            textDecoration: 'none',
          })}
        >
          <LayoutDashboard size={13} />
          <span>Overview</span>
        </NavLink>

        <NavLink
          to={`/project/${project.id}/tasks`}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: 'var(--space-2) 0',
            fontSize: 'var(--text-xs)',
            fontWeight: isActive ? 'var(--font-weight-medium)' : 'normal',
            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: '-1px',
            textDecoration: 'none',
          })}
        >
          <CheckSquare size={13} />
          <span>Tasks & Issues</span>
        </NavLink>

        <NavLink
          to={`/project/${project.id}/notes`}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: 'var(--space-2) 0',
            fontSize: 'var(--text-xs)',
            fontWeight: isActive ? 'var(--font-weight-medium)' : 'normal',
            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: '-1px',
            textDecoration: 'none',
          })}
        >
          <BookOpen size={13} />
          <span>Docs & Notes</span>
        </NavLink>

        <NavLink
          to={`/project/${project.id}/analytics`}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: 'var(--space-2) 0',
            fontSize: 'var(--text-xs)',
            fontWeight: isActive ? 'var(--font-weight-medium)' : 'normal',
            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: '-1px',
            textDecoration: 'none',
          })}
        >
          <TrendingUp size={13} />
          <span>Analytics & Progress</span>
        </NavLink>
      </div>
    </div>
  );
};
