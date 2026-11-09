import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  FolderPlus,
  TrendingUp,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useProjectStats } from '../hooks/useProjectStats';
import { ProjectCard } from '../components/projects/ProjectCard';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LandingWelcomeScreen } from '../components/landing/LandingWelcomeScreen';
import { BrandFooter } from '../components/common/BrandFooter';

export const DashboardOverviewPage = () => {
  const { onOpenNewProject, onOpenEditProject, onOpenNewTask } = useOutletContext();
  const { projects, tasks, notes, getRootProjects, deleteProject } = useWorkspace();
  const stats = useProjectStats(tasks);
  const rootProjects = getRootProjects();
  const navigate = useNavigate();

  const hotfixTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.status === 'hotfix' || ((t.isHotfix || (t.tags && t.tags.includes('hotfix'))) && t.status !== 'done')
    ).length;
  }, [tasks]);

  const [deletingProjectId, setDeletingProjectId] = useState(null);

  const deletingProject = projects.find((p) => p.id === deletingProjectId);

  const handleConfirmDeleteProject = () => {
    if (deletingProjectId) {
      deleteProject(deletingProjectId);
      setDeletingProjectId(null);
    }
  };

  // If no projects exist yet, display the landing / welcome screen!
  if (projects.length === 0) {
    return <LandingWelcomeScreen onNewProject={onOpenNewProject} />;
  }

  return (
    <div className="page-container" style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1200px' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', margin: 0, fontWeight: 'var(--font-weight-semibold)' }}>
            Workspace Dashboard
          </h1>
        </div>
      </div>

      {/* Clean Stat Strip */}
      <div
        className="dashboard-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Projects
          </div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', marginTop: 2 }}>
            {projects.length}
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
            {stats.done} <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'normal', color: 'var(--text-muted)' }}>({stats.completionRate}%)</span>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Hot Fixes
          </div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: '#f43f5e', marginTop: 2 }}>
            {hotfixTasks}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div>
        <div style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
            Root Projects ({rootProjects.length})
          </span>
        </div>

        {rootProjects.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            {rootProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={onOpenEditProject}
                onDelete={(id) => setDeletingProjectId(id)}
                onAddSubproject={(parentId) => onOpenNewProject(parentId)}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: 'var(--space-8) var(--space-4)',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(0, 132, 255, 0.1)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderPlus size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                No projects yet
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Create your first project to start organizing tasks, checklists, and documentation.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={FolderPlus}
              onClick={() => onOpenNewProject(null)}
            >
              Create Project
            </Button>
          </div>
        )}
      </div>

      {/* Brand Footer at end of home overview screen (Requirement 6) */}
      <BrandFooter tagline="Orbit your development workflow with clarity and speed" />

      {/* Delete Project Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingProjectId}
        onClose={() => setDeletingProjectId(null)}
        onConfirm={handleConfirmDeleteProject}
        title="Move Project to Recycle Bin"
        message={`Are you sure you want to move "${deletingProject?.name || 'this project'}" and all of its tasks to the Recycle Bin? It can be recovered within 30 days.`}
        confirmText="Move to Recycle Bin"
      />
    </div>
  );
};
