import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  FileCode,
  ArrowRight,
  TrendingUp,
  User,
  Globe,
  ExternalLink,
  Edit3,
  CheckSquare,
  Check,
  X,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useProjectStats } from '../hooks/useProjectStats';
import { ProjectHeader } from '../components/projects/ProjectHeader';
import { ProjectCard } from '../components/projects/ProjectCard';
import { MarkdownSyncModal } from '../components/tasks/MarkdownSyncModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/common/Button';
import { GithubIcon } from '../components/common/Icons';
import { BrandFooter } from '../components/common/BrandFooter';

export const ProjectOverviewPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { onOpenNewProject, onOpenNewTask } = useOutletContext();
  const {
    getProject,
    getSubProjects,
    getProjectTasks,
    deleteProject,
    updateProject,
  } = useWorkspace();
  const { toastSuccess } = useToast();

  const [isMarkdownSyncOpen, setIsMarkdownSyncOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingSubprojectId, setDeletingSubprojectId] = useState(null);

  // In-place editing state
  const [isEditingInPlace, setIsEditingInPlace] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editLiveUrl, setEditLiveUrl] = useState('');
  const [editGithubUrl, setEditGithubUrl] = useState('');

  const project = getProject(projectId);
  const subProjects = getSubProjects(projectId);
  const rollupTasks = getProjectTasks(projectId, true);
  const stats = useProjectStats(rollupTasks);

  const hotfixTasksCount = useMemo(() => {
    return rollupTasks.filter(
      (t) => t.status === 'hotfix' || ((t.isHotfix || (t.tags && t.tags.includes('hotfix'))) && t.status !== 'done')
    ).length;
  }, [rollupTasks]);

  const deletingSubproject = subProjects.find((p) => p.id === deletingSubprojectId);

  useEffect(() => {
    if (project) {
      setEditName(project.name || '');
      setEditDescription(project.description || '');
      setEditAuthor(project.author || '');
      setEditLiveUrl(project.liveUrl || '');
      setEditGithubUrl(project.githubUrl || '');
    }
  }, [project?.id, project?.name, project?.description, project?.author, project?.liveUrl, project?.githubUrl]);

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

  const handleStartInPlaceEdit = () => {
    setEditName(project.name || '');
    setEditDescription(project.description || '');
    setEditAuthor(project.author || '');
    setEditLiveUrl(project.liveUrl || '');
    setEditGithubUrl(project.githubUrl || '');
    setIsEditingInPlace(true);
  };

  const handleSaveInPlaceEdit = () => {
    if (!editName.trim()) return;
    updateProject(project.id, {
      name: editName.trim(),
      description: editDescription.trim(),
      author: editAuthor.trim(),
      liveUrl: editLiveUrl.trim(),
      githubUrl: editGithubUrl.trim(),
    });
    setIsEditingInPlace(false);
    toastSuccess('Project details updated!');
  };

  const handleCancelInPlaceEdit = () => {
    setEditName(project.name || '');
    setEditDescription(project.description || '');
    setEditAuthor(project.author || '');
    setEditLiveUrl(project.liveUrl || '');
    setEditGithubUrl(project.githubUrl || '');
    setIsEditingInPlace(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Project Header */}
      <ProjectHeader
        project={project}
        onNewTask={onOpenNewTask}
        onNewSubproject={() => onOpenNewProject(project.id)}
        onOpenMarkdownSync={() => setIsMarkdownSyncOpen(true)}
        onEditProject={handleStartInPlaceEdit}
        onDeleteProject={() => setIsDeleteConfirmOpen(true)}
      />

      {/* Main Content */}
      <div className="page-container" style={{ padding: 'var(--space-6) var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1200px' }}>
        {/* Metric Strip (includes hotfix matrix) */}
        <div
          className="metric-strip-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
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
              Completed
            </div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--status-done-text)', marginTop: 2 }}>
              {stats.done} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'normal', color: 'var(--text-muted)' }}>({stats.total} total)</span>
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Hot Fixes
            </div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: '#f43f5e', marginTop: 2 }}>
              {hotfixTasksCount}
            </div>
          </div>
        </div>

        {/* Project Details & In-Place Editing */}
        {isEditingInPlace ? (
          <div
            className="card"
            style={{
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--color-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary)' }}>
                Edit Project Details
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="secondary" size="sm" icon={X} onClick={handleCancelInPlaceEdit}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" icon={Check} onClick={handleSaveInPlaceEdit}>
                  Save Changes
                </Button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface-active)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Author
                </label>
                <input
                  type="text"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  placeholder="e.g. atifmalik"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface-active)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Live Site URL
                </label>
                <input
                  type="url"
                  value={editLiveUrl}
                  onChange={(e) => setEditLiveUrl(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface-active)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>
                  GitHub Repo URL
                </label>
                <input
                  type="url"
                  value={editGithubUrl}
                  onChange={(e) => setEditGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface-active)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder="What is this project about?"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-surface-active)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-xs)',
                  lineHeight: 1.5,
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        ) : (
          <div
            className="card"
            style={{
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 'var(--text-xs)',
                    color: project.author ? 'var(--text-secondary)' : 'var(--text-muted)',
                    backgroundColor: 'var(--bg-surface-active)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <User size={13} style={{ color: project.author ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                  Author: {project.author ? <strong style={{ color: 'var(--text-primary)' }}>{project.author}</strong> : <span style={{ fontStyle: 'italic' }}>not available</span>}
                </span>

                {project.liveUrl ? (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-primary)',
                      backgroundColor: 'rgba(0, 132, 255, 0.08)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(0, 132, 255, 0.25)',
                      textDecoration: 'none',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    <Globe size={13} />
                    Live Site
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-surface-active)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <Globe size={13} style={{ color: 'var(--text-muted)' }} />
                    Live Site: <span style={{ fontStyle: 'italic' }}>not available</span>
                  </span>
                )}

                {project.githubUrl ? (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-surface-active)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      textDecoration: 'none',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    <GithubIcon size={13} />
                    GitHub Repo
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-surface-active)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <GithubIcon size={13} style={{ color: 'var(--text-muted)' }} />
                    GitHub: <span style={{ fontStyle: 'italic' }}>not available</span>
                  </span>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                icon={Edit3}
                onClick={handleStartInPlaceEdit}
              >
                Edit Details
              </Button>
            </div>

            {/* Description Section with explicit title */}
            <div style={{ marginTop: 'var(--space-1)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Description
              </span>
              <p style={{ margin: '6px 0 0 0', fontSize: 'var(--text-xs)', color: project.description ? 'var(--text-secondary)' : 'var(--text-muted)', lineHeight: 1.6, fontStyle: project.description ? 'normal' : 'italic' }}>
                {project.description || 'not available'}
              </p>
            </div>
          </div>
        )}

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
                  onEdit={(p) => {
                    navigate(`/project/${p.id}/overview`);
                  }}
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

        {/* Project Tools */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
            Project Tools
          </span>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-2-5)' }}>
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

            <div
              onClick={() => navigate(`/project/${project.id}/analytics`)}
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
                <TrendingUp size={15} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  Progress Charts & Velocity
                </span>
              </div>
              <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Brand Footer */}
      <BrandFooter tagline="Orbit your development workflow with clarity and speed" />

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
        title="Move Project to Recycle Bin"
        message={`Are you sure you want to move "${project.name}" to the Recycle Bin? It can be recovered within 30 days.`}
        confirmText="Move to Recycle Bin"
      />

      {/* Delete Sub-Project Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingSubprojectId}
        onClose={() => setDeletingSubprojectId(null)}
        onConfirm={handleConfirmDeleteSubproject}
        title="Move Sub-Project to Recycle Bin"
        message={`Are you sure you want to move sub-project "${deletingSubproject?.name || 'this sub-project'}" to the Recycle Bin? It can be recovered within 30 days.`}
        confirmText="Move to Recycle Bin"
      />
    </div>
  );
};
