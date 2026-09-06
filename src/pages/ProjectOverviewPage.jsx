import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Layers,
  CheckSquare,
  Plus,
  BookOpen,
  FileCode,
  ArrowRight,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useProjectStats } from '../hooks/useProjectStats';
import { ProjectHeader } from '../components/projects/ProjectHeader';
import { ProjectCard } from '../components/projects/ProjectCard';
import { MarkdownSyncModal } from '../components/tasks/MarkdownSyncModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/common/Button';
import { TagBadge, PriorityBadge } from '../components/common/Badge';

export const ProjectOverviewPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { onOpenNewProject, onOpenEditProject, onOpenNewTask } = useOutletContext();
  const { getProject, getSubProjects, getProjectTasks, deleteProject } = useWorkspace();

  const [isMarkdownSyncOpen, setIsMarkdownSyncOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingSubprojectId, setDeletingSubprojectId] = useState(null);

  const project = getProject(projectId);
  const subProjects = getSubProjects(projectId);
  const rollupTasks = getProjectTasks(projectId, true);
  const stats = useProjectStats(rollupTasks);

  const deletingSubproject = subProjects.find((p) => p.id === deletingSubprojectId);

  if (!project) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <h2>Project not found</h2>
        <Button variant="primary" onClick={() => navigate('/')} style={{ marginTop: 'var(--space-4)' }}>
          Back to Workspace
        </Button>
      </div>
    );
  }

  const handleDeleteProject = () => {
    deleteProject(project.id);
    navigate('/');
  };

  const handleConfirmDeleteSubproject = () => {
    if (deletingSubprojectId) {
      deleteProject(deletingSubprojectId);
      setDeletingSubprojectId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Project Header */}
      <ProjectHeader
        project={project}
        onNewTask={onOpenNewTask}
        onNewSubproject={() => onOpenNewProject(project.id)}
        onOpenMarkdownSync={() => setIsMarkdownSyncOpen(true)}
        onEditProject={() => onOpenEditProject(project)}
        onDeleteProject={() => setIsDeleteConfirmOpen(true)}
      />

      {/* Main Content */}
      <div style={{ padding: 'var(--space-6) var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1200px' }}>
        {/* Metric Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--space-3)',
          }}
        >
          <div className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Progress
            </div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', marginTop: 2 }}>
              {stats.completionRate}%
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              In Progress
            </div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--status-current-text)', marginTop: 2 }}>
              {stats.current}
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Later / Queued
            </div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--status-later-text)', marginTop: 2 }}>
              {stats.later}
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Done
            </div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--status-done-text)', marginTop: 2 }}>
              {stats.done} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'normal', color: 'var(--text-muted)' }}>({stats.total} total)</span>
            </div>
          </div>
        </div>

        {/* Sub-Projects Hierarchy Grid */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-3)',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              Sub-Projects ({subProjects.length})
            </span>

            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => onOpenNewProject(project.id)}
            >
              Add Sub-Project
            </Button>
          </div>

          {subProjects.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 'var(--space-3)',
              }}
            >
              {subProjects.map((child) => (
                <ProjectCard
                  key={child.id}
                  project={child}
                  onEdit={onOpenEditProject}
                  onDelete={(id) => setDeletingSubprojectId(id)}
                  onAddSubproject={(parentId) => onOpenNewProject(parentId)}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 'var(--space-6)',
                textAlign: 'center',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-default)',
              }}
            >
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
                No sub-projects under this project yet.
              </p>
            </div>
          )}
        </div>

        {/* Tools & Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          {/* Quick Tools */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
              Project Tools
            </span>
            
            <div
              onClick={() => navigate(`/project/${project.id}/tasks`)}
              className="card-hoverable"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-2-5) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                cursor: 'pointer',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <CheckSquare size={15} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  Tasks & Issues Manager
                </span>
              </div>
              <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div
              onClick={() => setIsMarkdownSyncOpen(true)}
              className="card-hoverable"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-2-5) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                cursor: 'pointer',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <FileCode size={15} style={{ color: 'var(--color-accent)' }} />
                <span style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  Markdown Task Sync
                </span>
              </div>
              <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div
              onClick={() => navigate(`/project/${project.id}/notes`)}
              className="card-hoverable"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-2-5) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                cursor: 'pointer',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <BookOpen size={15} style={{ color: 'var(--status-done-text)' }} />
                <span style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  Documentation & Notes
                </span>
              </div>
              <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Tags & Categories */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
              Tags & Priorities
            </span>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1-5)' }}>
              {Object.entries(stats.tagCounts).map(([tag, count]) => (
                <div
                  key={tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-surface-active)',
                    fontSize: '11px',
                  }}
                >
                  <TagBadge tag={tag} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{count}</span>
                </div>
              ))}
              {Object.keys(stats.tagCounts).length === 0 && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>No tags yet.</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'var(--text-muted)' }}>
                <PriorityBadge priority="urgent" />
                <span>{stats.priorityCounts.urgent}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'var(--text-muted)' }}>
                <PriorityBadge priority="high" />
                <span>{stats.priorityCounts.high}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'var(--text-muted)' }}>
                <PriorityBadge priority="medium" />
                <span>{stats.priorityCounts.medium}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'var(--text-muted)' }}>
                <PriorityBadge priority="low" />
                <span>{stats.priorityCounts.low}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Markdown Sync Modal */}
      <MarkdownSyncModal
        isOpen={isMarkdownSyncOpen}
        onClose={() => setIsMarkdownSyncOpen(false)}
        project={project}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"?`}
        confirmText="Delete Project"
      />

      {/* Delete Sub-Project Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingSubprojectId}
        onClose={() => setDeletingSubprojectId(null)}
        onConfirm={handleConfirmDeleteSubproject}
        title="Delete Sub-Project"
        message={`Are you sure you want to delete sub-project "${deletingSubproject?.name || 'this sub-project'}"?`}
        confirmText="Delete Sub-Project"
      />
    </div>
  );
};
