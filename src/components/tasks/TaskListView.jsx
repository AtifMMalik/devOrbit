import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Calendar,
  CheckSquare,
  Square,
  ChevronRight,
  Edit,
  Trash2,
  Layers,
  GripVertical,
} from 'lucide-react';
import { StatusBadge, PriorityBadge, TagBadge } from '../common/Badge';
import { useWorkspace } from '../../context/WorkspaceContext';

export const TaskListView = ({
  tasks = [],
  onEditTask,
  onDeleteTask,
}) => {
  const { updateTaskStatus, toggleSubtask, reorderTasks, projects } = useWorkspace();
  const [activeDropTarget, setActiveDropTarget] = useState({ id: null, position: null });

  if (tasks.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--space-8) var(--space-4)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px dashed var(--border-default)',
          fontSize: 'var(--text-xs)',
        }}
      >
        No tasks found matching your filters.
      </div>
    );
  }

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e, taskId) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';
    setActiveDropTarget({ id: taskId, position });
  };

  const handleDragLeave = () => {
    setActiveDropTarget({ id: null, position: null });
  };

  const handleDrop = (e, targetTaskId) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const position = activeDropTarget.position || 'before';
    setActiveDropTarget({ id: null, position: null });
    if (draggedId && draggedId !== targetTaskId) {
      reorderTasks(draggedId, targetTaskId, null, position);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1-5)',
      }}
    >
      {tasks.map((task) => {
        const isDone = task.status === 'done';
        const project = projects.find((p) => p.id === task.projectId);
        const subtasks = task.subtasks || [];
        const completedSubtasks = subtasks.filter((s) => s.completed).length;

        const isDropTargetBefore = activeDropTarget.id === task.id && activeDropTarget.position === 'before';
        const isDropTargetAfter = activeDropTarget.id === task.id && activeDropTarget.position === 'after';

        const handleStatusToggle = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isDone) {
            updateTaskStatus(task.id, 'current');
          } else {
            updateTaskStatus(task.id, 'done');
          }
        };

        const handleSubtaskToggle = (e, subId) => {
          e.preventDefault();
          e.stopPropagation();
          toggleSubtask(task.id, subId);
        };

        const handleEditClick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onEditTask) onEditTask(task);
        };

        const handleDeleteClick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onDeleteTask) onDeleteTask(task.id);
        };

        return (
          <div key={task.id} style={{ position: 'relative' }}>
            {/* Top drop line indicator */}
            {isDropTargetBefore && (
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: 2,
                  zIndex: 10,
                }}
              />
            )}

            <details
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDragOver={(e) => handleDragOver(e, task.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, task.id)}
              className="task-details card-hoverable"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                transition: 'border-color var(--transition-fast)',
              }}
            >
              <summary
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-2-5) var(--space-3)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {/* Left: Drag Handle + Checkbox + Chevron + Title + Subproject */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: 0 }}>
                  <span
                    style={{ color: 'var(--text-muted)', cursor: 'grab', display: 'flex', alignItems: 'center' }}
                    title="Drag to rearrange"
                  >
                    <GripVertical size={13} />
                  </span>

                  <button
                    type="button"
                    onClick={handleStatusToggle}
                    style={{
                      color: isDone ? 'var(--status-done-solid)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={isDone ? 'Mark as current' : 'Mark as done'}
                  >
                    {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </button>

                  <span
                    style={{
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Click to view task details & subtasks"
                  >
                    <ChevronRight size={13} className="task-chevron-icon" />
                  </span>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                        className="truncate"
                      >
                        {task.title}
                      </span>
                      {project?.parentId && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 2,
                            fontSize: '10px',
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--bg-surface-active)',
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-xs)',
                            flexShrink: 0,
                          }}
                        >
                          <Layers size={9} />
                          {project.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Tags (first 2) */}
                {task.tags && task.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'nowrap', flexShrink: 0 }}>
                    {task.tags.slice(0, 2).map((t) => (
                      <TagBadge key={t} tag={t} />
                    ))}
                  </div>
                )}

                {/* Right: Subtasks, Due Date, Status, Priority, Edit & Red Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                  {subtasks.length > 0 && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: completedSubtasks === subtasks.length ? 'var(--status-done-solid)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <CheckSquare size={11} />
                      {completedSubtasks}/{subtasks.length}
                    </span>
                  )}

                  {task.dueDate && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Calendar size={11} />
                      {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}

                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />

                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 2 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={handleEditClick}
                      className="btn-icon"
                      style={{ width: 24, height: 24 }}
                      title="Edit task (opens popup)"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteClick}
                      className="btn-icon btn-icon-danger"
                      style={{ width: 24, height: 24, color: '#f43f5e' }}
                      title="Delete task"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </summary>

              {/* Dropdown Details Body */}
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderTop: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-card-subtle)',
                  cursor: 'default',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Description */}
                {task.description && (
                  <div style={{ marginBottom: 'var(--space-2)' }}>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.45,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {task.description}
                    </p>
                  </div>
                )}

                {/* Subtask checklist */}
                {subtasks.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-2)' }}>
                    <div
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: '4px',
                      }}
                    >
                      Subtasks Checklist ({completedSubtasks}/{subtasks.length})
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          onClick={(e) => handleSubtaskToggle(e, sub.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            padding: '6px 10px',
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-xs)',
                            cursor: 'pointer',
                            border: '1px solid var(--border-subtle)',
                            width: '100%',
                            boxSizing: 'border-box',
                            transition: 'background-color var(--transition-fast)',
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleSubtaskToggle(e, sub.id)}
                            style={{
                              color: sub.completed ? 'var(--status-done-solid)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {sub.completed ? <CheckSquare size={13} /> : <Square size={13} />}
                          </button>
                          <span
                            style={{
                              fontSize: '11.5px',
                              color: sub.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: sub.completed ? 'line-through' : 'none',
                              flex: 1,
                            }}
                          >
                            {sub.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Tags (if more than 2) */}
                {task.tags && task.tags.length > 2 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 'var(--space-1-5)' }}>
                    {task.tags.map((tag) => (
                      <TagBadge key={tag} tag={tag} />
                    ))}
                  </div>
                )}

                {!task.description && subtasks.length === 0 && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No description or subtasks. Click edit button to add details.
                  </div>
                )}
              </div>
            </details>

            {/* Bottom drop line indicator */}
            {isDropTargetAfter && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: 2,
                  zIndex: 10,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
