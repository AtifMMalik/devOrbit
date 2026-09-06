import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, MoreHorizontal } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useProjectStats } from '../../hooks/useProjectStats';
import { TagBadge } from '../common/Badge';
import { ProjectAvatar } from '../common/ProjectAvatar';

export const ProjectCard = ({
  project,
  onEdit,
  onDelete,
  onAddSubproject,
}) => {
  const navigate = useNavigate();
  const { getSubProjects, getProjectTasks, setActiveProjectId } = useWorkspace();

  const subProjects = getSubProjects(project.id);
  const tasks = getProjectTasks(project.id, true);
  const stats = useProjectStats(tasks);

  const handleCardClick = () => {
    setActiveProjectId(project.id);
    navigate(`/project/${project.id}/overview`);
  };

  return (
    <div
      className="card card-hoverable"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        padding: 'var(--space-3-5)',
        minHeight: '160px',
      }}
      onClick={handleCardClick}
    >
      {/* Top Bar */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-1-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ProjectAvatar project={project} size={24} showGlow />
            <h3 style={{ fontSize: 'var(--text-sm)', margin: 0, fontWeight: 'var(--font-weight-semibold)' }}>
              {project.name}
            </h3>
          </div>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: 2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onAddSubproject(project.id)}
              className="btn-icon"
              style={{ width: 22, height: 22 }}
              title="Add sub-project"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={() => onEdit(project)}
              className="btn-icon"
              style={{ width: 22, height: 22 }}
              title="Edit project"
            >
              <MoreHorizontal size={12} />
            </button>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              margin: '0 0 var(--space-2) 0',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.description}
          </p>
        )}

        {/* Tags and subproject count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)', flexWrap: 'wrap' }}>
          {subProjects.length > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: '10px',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-surface-active)',
                padding: '1px 5px',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <Layers size={10} />
              {subProjects.length} sub-{subProjects.length === 1 ? 'project' : 'projects'}
            </span>
          )}

          {project.tags && project.tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      </div>

      {/* Bottom Progress */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2-5)', marginTop: 'var(--space-2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '11px' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {stats.current} active · {stats.done} done
          </span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
            {stats.completionRate}%
          </span>
        </div>

        {/* Clean Slim Progress Bar */}
        <div
          style={{
            height: 3,
            width: '100%',
            backgroundColor: 'var(--bg-surface-active)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${stats.completionRate}%`,
              backgroundColor: stats.completionRate === 100 ? 'var(--status-done-solid)' : 'var(--color-primary)',
              transition: 'width var(--transition-fast)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
