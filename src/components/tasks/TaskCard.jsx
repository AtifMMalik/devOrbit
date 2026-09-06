import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  CheckSquare,
  Square,
  ChevronRight,
  Edit,
  Trash2,
  Tag,
  Clock,
} from 'lucide-react';
import { PriorityBadge, TagBadge } from '../common/Badge';
import { useWorkspace } from '../../context/WorkspaceContext';

export const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDropOnTask,
}) => {
  const { updateTaskStatus, toggleSubtask } = useWorkspace();
  const [dropIndicator, setDropIndicator] = useState(null); // 'before' | 'after' | null

  const isDone = task.status === 'done';
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

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
    if (onEdit) onEdit(task);
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) onDelete(task.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
      setDropIndicator('before');
    } else {
      setDropIndicator('after');
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropIndicator(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('text/plain');
    const position = dropIndicator || 'before';
    setDropIndicator(null);
    if (draggedId && onDropOnTask) {
      onDropOnTask(draggedId, task.id, task.status, position);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Top drop line indicator */}
      {dropIndicator === 'before' && (
        <div
          style={{
            position: 'absolute',
            top: -4,
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
        onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="task-details card card-hoverable"
        style={{
          padding: 'var(--space-2-5) var(--space-3)',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-default)',
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <summary style={{ outline: 'none' }}>
          {/* Top row: Status Checkbox + Dropdown Chevron + Title + Priority + Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-1-5)',
              marginBottom: '4px',
            }}
          >
            {/* Status toggle checkbox */}
            <button
              type="button"
              onClick={handleStatusToggle}
              style={{
                color: isDone ? 'var(--status-done-solid)' : 'var(--text-muted)',
                cursor: 'pointer',
                flexShrink: 0,
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title={isDone ? 'Mark in progress' : 'Mark completed'}
            >
              {isDone ? <CheckCircle2 size={15} /> : <Circle size={15} />}
            </button>

            {/* Subtle chevron indicating dropdown */}
            <span
              style={{
                color: 'var(--text-muted)',
                flexShrink: 0,
                marginTop: '3px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Click to view task details & subtasks"
            >
              <ChevronRight size={13} className="task-chevron-icon" />
            </span>

            {/* Task Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  lineHeight: 1.35,
                  margin: 0,
                }}
              >
                {task.title}
              </h4>
            </div>

            <PriorityBadge priority={task.priority} />

            {/* Action buttons: Edit & Red Delete */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexShrink: 0,
                marginLeft: 2,
              }}
            >
              <button
                type="button"
                onClick={handleEditClick}
                className="btn-icon"
                style={{ width: 22, height: 22, padding: 0 }}
                title="Edit task (opens popup)"
              >
                <Edit size={12} />
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="btn-icon btn-icon-danger"
                style={{ width: 22, height: 22, padding: 0, color: '#f43f5e' }}
                title="Delete task"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Card Summary Line: Tags & Subtask count / Date */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: '32px',
              marginTop: '2px',
              flexWrap: 'wrap',
              gap: 'var(--space-1)',
            }}
          >
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {task.tags &&
                task.tags.slice(0, 2).map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}
            >
              {subtasks.length > 0 && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    color: completedSubtasks === subtasks.length ? 'var(--status-done-solid)' : 'var(--text-muted)',
                  }}
                >
                  <CheckSquare size={11} />
                  {completedSubtasks}/{subtasks.length}
                </span>
              )}

              {task.dueDate && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Calendar size={11} />
                  {new Date(task.dueDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>
        </summary>

        {/* Dropdown Revealed Content */}
        <div
          style={{
            marginTop: 'var(--space-2)',
            paddingTop: 'var(--space-2)',
            borderTop: '1px solid var(--border-default)',
            cursor: 'default',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Description */}
          {task.description && (
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <p
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {task.description}
              </p>
            </div>
          )}

          {/* Subtasks Checklist */}
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Subtasks ({completedSubtasks}/{subtasks.length})</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={(e) => handleSubtaskToggle(e, sub.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 8px',
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
                        color: sub.completed
                          ? 'var(--status-done-solid)'
                          : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={sub.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {sub.completed ? (
                        <CheckSquare size={13} />
                      ) : (
                        <Square size={13} />
                      )}
                    </button>
                    <span
                      style={{
                        fontSize: '11px',
                        color: sub.completed
                          ? 'var(--text-muted)'
                          : 'var(--text-primary)',
                        textDecoration: sub.completed ? 'line-through' : 'none',
                        lineHeight: 1.3,
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
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 'var(--space-1-5)' }}>
              {task.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}

          {!task.description && subtasks.length === 0 && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No description or subtasks. Click edit to add details.
            </div>
          )}
        </div>
      </details>

      {/* Bottom drop line indicator */}
      {dropIndicator === 'after' && (
        <div
          style={{
            position: 'absolute',
            bottom: -4,
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
};
