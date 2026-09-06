import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderPlus,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useProjectStats } from '../hooks/useProjectStats';
import { ProjectCard } from '../components/projects/ProjectCard';
import { Button } from '../components/common/Button';
import { StatusBadge, PriorityBadge, TagBadge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ActivityHeatmap } from '../components/analytics/ActivityHeatmap';
import { generateActivityData } from '../utils/activityGenerator';

export const DashboardOverviewPage = () => {
  const { onOpenNewProject, onOpenEditProject, onOpenNewTask } = useOutletContext();
  const { projects, tasks, notes, getRootProjects, deleteProject } = useWorkspace();
  const stats = useProjectStats(tasks);
  const rootProjects = getRootProjects();
  const navigate = useNavigate();

  const [deletingProjectId, setDeletingProjectId] = useState(null);

  const deletingProject = projects.find((p) => p.id === deletingProjectId);

  const handleConfirmDeleteProject = () => {
    if (deletingProjectId) {
      deleteProject(deletingProjectId);
      setDeletingProjectId(null);
    }
  };

  const calendarData = useMemo(() => {
    return generateActivityData(tasks, projects, notes, null, 365);
  }, [tasks, projects, notes]);

  const recentActiveTasks = tasks
    .filter((t) => t.status === 'current' || t.status === 'later')
    .slice(0, 5);

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1200px' }}>
      {/* Clean Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
            Projects Overview
          </h1>
          <p style={{ marginTop: '2px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Manage projects, nested sub-modules, active task workflows, and developer velocity.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={TrendingUp}
            onClick={() => navigate('/analytics')}
            title="View Developer Profile & Velocity Charts"
          >
            Work Analytics
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={FolderPlus}
            onClick={() => onOpenNewProject(null)}
          >
            New Project
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={onOpenNewTask}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Clean Stat Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
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
      </div>

      {/* GitHub-style Contribution Heatmap */}
      <ActivityHeatmap
        data={calendarData}
        title="Developer Activity & Momentum"
        subtitle="365-day GitHub-style contribution record of workspace activities"
        showStats
      />

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

      {/* Active Focus Tasks */}
      {recentActiveTasks.length > 0 && (
        <div style={{ marginTop: 'var(--space-2)' }}>
          <div style={{ marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              Recent Active Tasks
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {recentActiveTasks.map((task) => {
              const proj = projects.find((p) => p.id === task.projectId);
              return (
                <div
                  key={task.id}
                  onClick={() => proj && navigate(`/project/${proj.id}/tasks`)}
                  className="card-hoverable"
                  style={{
                    padding: 'var(--space-2-5) var(--space-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-3)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0, flex: 1 }}>
                    <StatusBadge status={task.status} />
                    <span style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }} className="truncate">
                      {task.title}
                    </span>
                    {proj && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--bg-surface-active)',
                          padding: '1px 5px',
                          borderRadius: 'var(--radius-xs)',
                          flexShrink: 0,
                        }}
                      >
                        {proj.name}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                    {task.tags && task.tags.slice(0, 2).map((t) => <TagBadge key={t} tag={t} />)}
                    <PriorityBadge priority={task.priority} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingProjectId}
        onClose={() => setDeletingProjectId(null)}
        onConfirm={handleConfirmDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingProject?.name || 'this project'}" and all of its tasks and sub-projects?`}
        confirmText="Delete Project"
      />
    </div>
  );
};
