import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { FolderTree, ArrowRight } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ProjectHeader } from '../components/projects/ProjectHeader';
import { ActivityHeatmap } from '../components/analytics/ActivityHeatmap';
import { ProjectProgressChart } from '../components/analytics/ProjectProgressChart';
import { MarkdownSyncModal } from '../components/tasks/MarkdownSyncModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/common/Button';
import { generateActivityData, calculateProjectAnalytics } from '../utils/activityGenerator';

export const ProjectAnalyticsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { onOpenNewProject, onOpenEditProject, onOpenNewTask } = useOutletContext();
  const { getProject, getSubProjects, getProjectTasks, deleteProject, projects, tasks, notes } = useWorkspace();

  const [isMarkdownSyncOpen, setIsMarkdownSyncOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const project = getProject(projectId);
  const subProjects = getSubProjects(projectId);

  // Generate Activity Data scoped to this project & its sub-projects
  const calendarData = useMemo(() => {
    if (!projectId) return [];
    return generateActivityData(tasks, projects, notes, projectId, 365);
  }, [tasks, projects, notes, projectId]);

  // Project analytics
  const analytics = useMemo(() => {
    if (!project) return null;
    return calculateProjectAnalytics(project, tasks, projects);
  }, [project, tasks, projects]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Project Header with Tabs */}
      <ProjectHeader
        project={project}
        onNewTask={onOpenNewTask}
        onNewSubproject={() => onOpenNewProject(project.id)}
        onOpenMarkdownSync={() => setIsMarkdownSyncOpen(true)}
        onEditProject={() => onOpenEditProject(project)}
        onDeleteProject={() => setIsDeleteConfirmOpen(true)}
      />

      {/* Main Analytics Content */}
      <div className="page-container" style={{ padding: 'var(--space-6) var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1200px' }}>
        {/* Top Activity Heatmap Calendar for this Project */}
        <ActivityHeatmap
          data={calendarData}
          title={`Activity & Velocity: ${project.name}`}
          subtitle="Engineering contribution history of tasks, checklist items, and documentation updates for this project"
          showStats
        />

        {/* Detailed Progress & Quality Metrics */}
        <ProjectProgressChart
          analytics={analytics}
          projectTitle={project.name}
        />

        {/* Sub-Projects Progress Breakdown if any exist */}
        {subProjects.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <FolderTree size={16} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                  Sub-Projects Velocity Breakdown ({subProjects.length})
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-3)' }}>
              {subProjects.map((child) => {
                const childStats = calculateProjectAnalytics(child, tasks, projects);
                return (
                  <div
                    key={child.id}
                    onClick={() => navigate(`/project/${child.id}/analytics`)}
                    className="card card-hoverable"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-3)',
                      cursor: 'pointer',
                      padding: 'var(--space-4)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: child.color || 'var(--color-primary)',
                          }}
                        />
                        <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                          {child.name}
                        </span>
                      </div>
                      <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>
                        <span>{childStats.doneCount}/{childStats.totalTasks} Tasks Done</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{childStats.completionRate}%</span>
                      </div>
                      <div style={{ height: 6, backgroundColor: 'var(--bg-surface-active)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${childStats.completionRate}%`,
                            backgroundColor: child.color || 'var(--color-primary)',
                            borderRadius: 'var(--radius-full)',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)' }}>
                      <span>{childStats.currentCount} current</span>
                      <span>•</span>
                      <span>{childStats.laterCount} later</span>
                      <span>•</span>
                      <span>{childStats.doneCount} done</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
    </div>
  );
};
