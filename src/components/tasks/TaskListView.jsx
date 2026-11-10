import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Flame,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { StatusBadge, PriorityBadge, TagBadge } from '../common/Badge';
import { MarkdownRenderer, toggleChecklistInMarkdown } from '../common/MarkdownRenderer';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

export const TaskListView = ({
  tasks = [],
  onEditTask,
  onDeleteTask,
}) => {
  const navigate = useNavigate();
  const { updateTask, updateTaskStatus, toggleSubtask, reorderTasks, projects, searchKeyword } = useWorkspace();
  const { toastSuccess } = useToast();
  const [activeDropTarget, setActiveDropTarget] = useState({ id: null, position: null });
  const [copiedTaskId, setCopiedTaskId] = useState(null);

  const handleToggleDescChecklist = (task, targetIdx) => {
    if (!task) return;
    const updated = toggleChecklistInMarkdown(task.description || '', targetIdx);
    updateTask(task.id, { description: updated });
  };

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

  const handleCopyPrompt = async (e, promptText, taskId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!promptText) return;
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedTaskId(taskId);
      toastSuccess('Prompt copied to clipboard');
      setTimeout(() => setCopiedTaskId(null), 2000);
    } catch (err) {
      // Fallback
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
        const isHotfix = Boolean(task.isHotfix || (task.tags && task.tags.includes('hotfix')));
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

        const handleDoubleClick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          navigate(`/project/${task.projectId}/tasks/${task.id}`);
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
              onDoubleClick={handleDoubleClick}
              className="task-details card-hoverable"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: isHotfix ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-default)',
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
                    className="btn-status-toggle"
                    style={{
                      color: isDone ? 'var(--status-done-solid)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      backgroundColor: 'transparent',
                      border: 'none',
                      boxShadow: 'none',
                      padding: 0,
                      margin: 0,
                      width: 'auto',
                      height: 'auto',
                      minWidth: 'unset',
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
                    title="Click to view task details. Double-click to open full task screen."
                  >
                    <ChevronRight size={13} className="task-chevron-icon" />
                  </span>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {isHotfix && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 2,
                            fontSize: '9.5px',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            backgroundColor: '#f43f5e',
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-xs)',
                            flexShrink: 0,
                          }}
                        >
                          <Flame size={10} />
                          HOT FIX
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                        className="truncate"
                        title="Double click to open full task screen"
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

                {/* Middle: Prompt pill & Tags */}
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                  {task.taskPrompt && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyPrompt(e, task.taskPrompt, task.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        backgroundColor: 'rgba(0, 132, 255, 0.09)',
                        border: '1px solid rgba(0, 132, 255, 0.25)',
                        borderRadius: 'var(--radius-xs)',
                        padding: '1px 6px',
                        fontSize: '10.5px',
                        color: copiedTaskId === task.id ? 'var(--color-success)' : 'var(--color-primary)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                      }}
                      title="1-Click Copy Task Prompt"
                    >
                      <Terminal size={10} />
                      {copiedTaskId === task.id ? 'Copied!' : 'Prompt'}
                      {copiedTaskId === task.id ? <Check size={10} /> : <Copy size={10} />}
                    </button>
                  )}

                  {task.tags && task.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'nowrap' }}>
                      {task.tags.slice(0, 2).map((t) => (
                        <TagBadge key={t} tag={t} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Subtasks, Deadline, Status, Priority, Edit & Red Delete */}
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

                  {(task.deadline || task.dueDate) && (
                    <span
                      style={{
                        fontSize: '11px',
                        color:
                          !isDone && new Date(task.deadline || task.dueDate).getTime() < Date.now()
                            ? '#f43f5e'
                            : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                      title="Deadline"
                    >
                      <Calendar size={11} />
                      {new Date(task.deadline || task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
                      style={{ width: 24, height: 24, backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
                      title="Edit task (popup)"
                    >
                      <Edit size={12} color="#ffffff" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteClick}
                      className="btn-icon btn-icon-danger"
                      style={{ width: 24, height: 24, backgroundColor: 'var(--color-danger)', color: '#ffffff' }}
                      title="Move task to Recycle Bin"
                    >
                      <Trash2 size={12} color="#ffffff" />
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
                    <MarkdownRenderer
                      content={task.description}
                      compact
                      highlight={searchKeyword}
                      onToggleCheckbox={(idx) => handleToggleDescChecklist(task, idx)}
                    />
                  </div>
                )}

                {/* Prompt in expanded view */}
                {task.taskPrompt && (
                  <div
                    style={{
                      marginBottom: 'var(--space-2)',
                      padding: 'var(--space-2)',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-default)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Task Prompt Specification
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyPrompt(e, task.taskPrompt, task.id)}
                        className="btn-icon"
                        style={{ width: 20, height: 20 }}
                        title="Copy Prompt"
                      >
                        {copiedTaskId === task.id ? <Check size={10} style={{ color: 'var(--color-success)' }} /> : <Copy size={10} />}
                      </button>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                      {task.taskPrompt}
                    </div>
                  </div>
                )}

                {/* Completion Note */}
                {task.completionNote && (
                  <div
                    style={{
                      marginBottom: 'var(--space-2)',
                      padding: 'var(--space-2)',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: 'var(--radius-xs)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '10.5px', fontWeight: 'bold', color: 'var(--status-done-solid)', marginBottom: 2 }}>
                      <CheckCircle2 size={11} />
                      Completion Note:
                    </div>
                    <MarkdownRenderer content={task.completionNote} compact highlight={searchKeyword} />
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
                              padding: 0,
                              background: 'none',
                              border: 'none',
                            }}
                          >
                            {sub.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                          </button>
                          <span
                            style={{
                              fontSize: '11px',
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

                {/* Open full screen action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={handleDoubleClick}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'transparent',
                      color: 'var(--color-primary)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                    title="Open task detail screen (or double-click row)"
                  >
                    Open Full Task Screen
                    <ExternalLink size={10} />
                  </button>
                </div>
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
