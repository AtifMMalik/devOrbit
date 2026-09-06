import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { ProjectAvatar } from '../common/ProjectAvatar';
import { useWorkspace } from '../../context/WorkspaceContext';

export const ProjectTreeItem = ({
  project,
  onAddSubproject,
  onEditProject,
}) => {
  const { getSubProjects, getProjectTasks, activeProjectId, setActiveProjectId } = useWorkspace();
  const [isOpen, setIsOpen] = useState(true);

  const subProjects = getSubProjects(project.id);
  const hasSubprojects = subProjects.length > 0;
  const tasks = getProjectTasks(project.id, false);
  const isSelected = activeProjectId === project.id;

  const toggleOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 6px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: isSelected ? 'var(--bg-surface-active)' : 'transparent',
          transition: 'background-color var(--transition-fast)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          {hasSubprojects ? (
            <button
              onClick={toggleOpen}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            <span style={{ width: 12 }} />
          )}

          <NavLink
            to={`/project/${project.id}/tasks`}
            onClick={() => setActiveProjectId(project.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flex: 1,
              minWidth: 0,
              color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isSelected ? 'var(--font-weight-medium)' : 'normal',
              fontSize: 'var(--text-xs)',
              textDecoration: 'none',
            }}
          >
            <ProjectAvatar project={project} size={26} />
            <span className="truncate">{project.name}</span>
          </NavLink>
        </div>

        {/* Task count pill & Add subproject */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {tasks.length > 0 && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '0 3px' }}>
              {tasks.length}
            </span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddSubproject(project.id);
            }}
            className="btn-icon"
            style={{ width: 16, height: 16, padding: 0 }}
            title="Add sub-project"
          >
            <Plus size={10} />
          </button>
        </div>
      </div>

      {/* Render child sub-projects */}
      {hasSubprojects && isOpen && (
        <div
          style={{
            paddingLeft: 'var(--space-2-5)',
            marginLeft: 'var(--space-1-5)',
            borderLeft: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            marginTop: 1,
          }}
        >
          {subProjects.map((child) => (
            <ProjectTreeItem
              key={child.id}
              project={child}
              onAddSubproject={onAddSubproject}
              onEditProject={onEditProject}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ProjectTree = ({ onAddProject, onAddSubproject, onEditProject }) => {
  const { getRootProjects } = useWorkspace();
  const rootProjects = getRootProjects();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {rootProjects.map((project) => (
        <ProjectTreeItem
          key={project.id}
          project={project}
          onAddSubproject={onAddSubproject}
          onEditProject={onEditProject}
        />
      ))}

      {rootProjects.length === 0 && (
        <div style={{ padding: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
          No projects yet.
        </div>
      )}
    </div>
  );
};
