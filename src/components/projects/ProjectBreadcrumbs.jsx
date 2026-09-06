import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { ProjectAvatar } from '../common/ProjectAvatar';
import { useWorkspace } from '../../context/WorkspaceContext';

export const ProjectBreadcrumbs = ({ projectId }) => {
  const { getProjectBreadcrumbs, setActiveProjectId } = useWorkspace();
  const crumbs = getProjectBreadcrumbs(projectId);

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1-5)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
      }}
    >
      <Link
        to="/"
        onClick={() => setActiveProjectId(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          color: 'var(--text-muted)',
          transition: 'color var(--transition-fast)',
        }}
      >
        <Home size={14} />
        <span>Workspace</span>
      </Link>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <React.Fragment key={crumb.id}>
            <ChevronRight size={12} style={{ opacity: 0.5 }} />
            {isLast ? (
              <span
                style={{
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ProjectAvatar project={crumb} size={14} />
                {crumb.name}
              </span>
            ) : (
              <Link
                to={`/project/${crumb.id}/overview`}
                onClick={() => setActiveProjectId(crumb.id)}
                style={{
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ProjectAvatar project={crumb} size={14} />
                <span>{crumb.name}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
