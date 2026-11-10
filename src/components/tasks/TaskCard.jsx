import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Circle,
  CheckSquare,
  Square,
  ChevronRight,
  Edit,
  Trash2,
  Copy,
  Check,
  Terminal,
  Flame,
  ChevronDown,
  Edit3,
  ExternalLink,
} from 'lucide-react';
import { PriorityBadge, TagBadge } from '../common/Badge';
import { MarkdownRenderer, toggleChecklistInMarkdown } from '../common/MarkdownRenderer';
import { highlightText } from '../../utils/searchHighlight';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

export const TaskCard = ({
  task,
  isSelected = false,
  onSelectToggle,
  onContextMenu,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDropOnTask,
}) => {
  const navigate = useNavigate();
  const { updateTask, updateTaskStatus, toggleSubtask, searchKeyword, clipboard } = useWorkspace();
  const { toastSuccess } = useToast();

  const [dropIndicator, setDropIndicator] = useState(null); // 'before' | 'after' | null
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState(task.taskPrompt || '');
  const [isCopied, setIsCopied] = useState(false);
  const [isDescCopied, setIsDescCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isDone = task.status === 'done';
  const isHotfix = Boolean(task.isHotfix || (task.tags && task.tags.includes('hotfix')));
  const isCut = clipboard?.action === 'cut' && Array.isArray(clipboard?.taskIds) && clipboard.taskIds.includes(task.id);
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

  const descChecklist = React.useMemo(() => {
    if (!task.description) return { total: 0, completed: 0, items: [] };
    const regex = /(?:^|\n)[ \t]*(?:[-*]\s*)?\[([.xX\s]*)\]\s*([^\n]+)/g;
    let match;
    const items = [];
    let completed = 0;
    while ((match = regex.exec(task.description)) !== null) {
      const isDone = match[1] === '.' || match[1].toLowerCase() === 'x';
      if (isDone) completed++;
      items.push({ text: match[2].trim(), completed: isDone });
    }
    return { total: items.length, completed, items };
  }, [task.description]);

  const totalChecklists = descChecklist.total > 0 ? descChecklist.total : subtasks.length;
  const completedChecklists = descChecklist.total > 0 ? descChecklist.completed : completedSubtasks;

  const handleToggleDescChecklist = (arg1, arg2) => {
    const targetItemIdx = typeof arg1 === 'number' ? arg1 : arg2;
    if (arg1 && arg1.preventDefault) {
      arg1.preventDefault();
      arg1.stopPropagation();
    }
    if (!task.description) return;
    const newDesc = toggleChecklistInMarkdown(task.description, targetItemIdx);
    updateTask(task.id, { description: newDesc });
  };

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

  const handleCardClick = (e) => {
    if (e.target.closest('button, input, textarea, a')) {
      return;
    }
    if (onSelectToggle) {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        onSelectToggle(e, task.id, { isMulti: true });
      } else {
        onSelectToggle(e, task.id, { isMulti: false });
      }
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e, task);
    }
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/project/${task.projectId}/tasks/${task.id}`);
  };

  const handleCopyPrompt = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!task.taskPrompt) return;
    try {
      await navigator.clipboard.writeText(task.taskPrompt);
      setIsCopied(true);
      toastSuccess('Prompt copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (_err) {
      // Fallback
    }
  };

  const handleCopyDescription = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!task.description) return;
    try {
      await navigator.clipboard.writeText(task.description);
      setIsDescCopied(true);
      toastSuccess('Description copied to clipboard');
      setTimeout(() => setIsDescCopied(false), 2000);
    } catch (_err) {
      // Fallback
    }
  };

  const handleDragStartInternal = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';

    // Create a crisp, clean drag preview so adjacent or below issues are not captured
    try {
      const cardElement = e.currentTarget;
      const rect = cardElement.getBoundingClientRect();
      const ghost = cardElement.cloneNode(true);
      ghost.style.position = 'fixed';
      ghost.style.top = '-9999px';
      ghost.style.left = '-9999px';
      ghost.style.width = `${rect.width}px`;
      ghost.style.maxWidth = '320px';
      ghost.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.35)';
      ghost.style.borderRadius = 'var(--radius-sm)';
      ghost.style.overflow = 'hidden';
      ghost.style.zIndex = '99999';
      ghost.style.pointerEvents = 'none';
      ghost.style.opacity = '0.92';
      ghost.style.backgroundColor = 'var(--bg-surface)';
      ghost.style.border = '1px solid var(--color-primary)';

      document.body.appendChild(ghost);
      const offsetX = Math.min(Math.max(20, (e.clientX || 0) - rect.left), rect.width - 20);
      const offsetY = Math.min(Math.max(15, (e.clientY || 0) - rect.top), 40);
      e.dataTransfer.setDragImage(ghost, offsetX, offsetY);

      setTimeout(() => {
        if (document.body.contains(ghost)) {
          document.body.removeChild(ghost);
        }
      }, 0);
    } catch (_err) {
      // Fallback
    }

    if (onDragStart) {
      onDragStart(e, task.id);
    }
  };

  const handleDragEndInternal = (e) => {
    setIsDragging(false);
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  const handleSavePrompt = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateTask(task.id, { taskPrompt: promptDraft });
    setIsEditingPrompt(false);
    toastSuccess('Prompt updated');
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(task);
    } else {
      navigate(`/project/${task.projectId}/tasks/${task.id}`);
    }
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
    const position = dropIndicator || 'before';
    setDropIndicator(null);

    const dragJson = e.dataTransfer.getData('application/json');
    const plainId = e.dataTransfer.getData('text/plain');

    if (dragJson) {
      try {
        const ids = JSON.parse(dragJson);
        if (Array.isArray(ids) && onDropOnTask) {
          onDropOnTask(ids, task.id, task.status, position);
          return;
        }
      } catch (_err) {
        // Fallback
      }
    }

    if (plainId && onDropOnTask) {
      onDropOnTask(plainId, task.id, task.status, position);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: isSelected ? 2 : 1 }}>
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
        onDragStart={handleDragStartInternal}
        onDragEnd={handleDragEndInternal}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleCardClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        tabIndex={0}
        onFocus={() => {
          if (onSelectToggle) {
            onSelectToggle(null, task.id, { isMulti: false });
          }
        }}
        className="task-details card card-hoverable"
        style={{
          padding: 'var(--space-2-5) var(--space-3)',
          backgroundColor: isSelected ? 'var(--bg-surface-active)' : 'var(--bg-card)',
          borderRadius: 'var(--radius-sm)',
          border: isCut
            ? '1.5px dashed var(--color-primary)'
            : isHotfix
            ? '1px solid rgba(244, 63, 94, 0.45)'
            : isSelected
            ? '1px solid var(--color-primary)'
            : '1px solid var(--border-default)',
          outline: isSelected ? '2px solid var(--color-primary)' : 'none',
          outlineOffset: isSelected ? '-1px' : '0px',
          boxShadow: isSelected
            ? '0 0 10px rgba(0, 132, 255, 0.25)'
            : isHotfix
            ? '0 0 8px rgba(244, 63, 94, 0.15)'
            : 'none',
          opacity: isDragging ? 0.35 : isCut ? 0.55 : 1,
          cursor: 'grab',
          userSelect: 'none',
          transition: 'border-color var(--transition-fast), outline var(--transition-fast), background-color var(--transition-fast), opacity var(--transition-fast)',
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
            {/* Status toggle checkbox without any button container (Item 3) */}
            <button
              type="button"
              onClick={handleStatusToggle}
              className="btn-status-toggle"
              style={{
                color: isDone ? 'var(--status-done-solid)' : 'var(--text-muted)',
                cursor: 'pointer',
                flexShrink: 0,
                marginTop: '2px',
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
              title={isDone ? 'Mark in progress' : 'Mark completed'}
            >
              {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
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
              title="Click to expand / collapse details. Double-click to open full task screen."
            >
              <ChevronRight size={13} className="task-chevron-icon" />
            </span>

            {/* Task Title & Badges (Hotfix & Cut) */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                {isCut && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                      fontSize: '9.5px',
                      fontWeight: 'bold',
                      color: 'var(--color-primary)',
                      backgroundColor: 'rgba(0, 132, 255, 0.12)',
                      border: '1px dashed var(--color-primary)',
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-xs)',
                      letterSpacing: '0.04em',
                    }}
                    title="This task is cut and ready to be pasted elsewhere"
                  >
                    CUT
                  </span>
                )}
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
                      letterSpacing: '0.04em',
                    }}
                    title="Critical Hot Fix issue"
                  >
                    <Flame size={10} />
                    HOT FIX
                  </span>
                )}
                <h4
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: isDone ? 'line-through' : 'none',
                    lineHeight: 1.35,
                    margin: 0,
                  }}
                  title="Double-click to open full task screen"
                >
                  {highlightText(task.title, searchKeyword)}
                </h4>
              </div>
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
                style={{ width: 22, height: 22, padding: 0, backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
                title="Edit task"
              >
                <Edit size={12} color="#ffffff" />
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="btn-icon btn-icon-danger"
                style={{ width: 22, height: 22, padding: 0, backgroundColor: 'var(--color-danger)', color: '#ffffff' }}
                title="Move task to Recycle Bin"
              >
                <Trash2 size={12} color="#ffffff" />
              </button>
            </div>
          </div>

          {/* Card Summary Line: Prompt Pill, Tags, Subtasks, Deadline */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: '32px',
              marginTop: '4px',
              flexWrap: 'wrap',
              gap: 'var(--space-1-5)',
            }}
          >
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Task Prompt 1-Click Copy / Expand Button */}
              {task.taskPrompt && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: 'rgba(0, 132, 255, 0.09)',
                    border: '1px solid rgba(0, 132, 255, 0.25)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '1px 6px',
                    fontSize: '10.5px',
                    color: 'var(--color-primary)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Terminal size={10} />
                  <span style={{ fontFamily: 'var(--font-mono)' }}>Prompt</span>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0 2px',
                      cursor: 'pointer',
                      color: isCopied ? 'var(--color-success)' : 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="1-Click Copy Task Prompt"
                  >
                    {isCopied ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0 1px',
                      cursor: 'pointer',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={isPromptExpanded ? 'Collapse prompt' : 'Expand & view prompt'}
                  >
                    <ChevronDown size={10} style={{ transform: isPromptExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                </div>
              )}

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
              {totalChecklists > 0 && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    color: completedChecklists === totalChecklists ? 'var(--status-done-solid)' : 'var(--text-muted)',
                  }}
                >
                  <CheckSquare size={11} />
                  {completedChecklists}/{totalChecklists}
                </span>
              )}

              {(task.deadline || task.dueDate) && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    color:
                      !isDone && new Date(task.deadline || task.dueDate).getTime() < Date.now()
                        ? '#f43f5e'
                        : 'var(--text-muted)',
                  }}
                  title="Deadline"
                >
                  <Calendar size={11} />
                  {new Date(task.deadline || task.dueDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Expanded Prompt View (If prompt toggle is clicked on card) */}
          {isPromptExpanded && task.taskPrompt && (
            <div
              style={{
                marginTop: 'var(--space-2)',
                marginLeft: '32px',
                padding: 'var(--space-2)',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-default)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Prompt Specification
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="btn-icon"
                    style={{ width: 20, height: 20 }}
                    title="Copy Prompt"
                  >
                    {isCopied ? <Check size={10} style={{ color: 'var(--color-success)' }} /> : <Copy size={10} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPromptDraft(task.taskPrompt || '');
                      setIsEditingPrompt(!isEditingPrompt);
                    }}
                    className="btn-icon"
                    style={{ width: 20, height: 20 }}
                    title="Edit Prompt inline"
                  >
                    <Edit3 size={10} />
                  </button>
                </div>
              </div>

              {isEditingPrompt ? (
                <div>
                  <textarea
                    rows={3}
                    value={promptDraft}
                    onChange={(e) => setPromptDraft(e.target.value)}
                    style={{ width: '100%', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                    spellCheck={true}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => setIsEditingPrompt(false)}
                      style={{ fontSize: '10px', padding: '2px 6px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--text-muted)' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePrompt}
                      style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 3 }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {highlightText(task.taskPrompt, searchKeyword)}
                </div>
              )}
            </div>
          )}
        </summary>

        {/* Dropdown Revealed Content (Markdown Description, Subtasks, Completion Note) */}
        <div
          style={{
            marginTop: 'var(--space-2)',
            paddingTop: 'var(--space-2)',
            borderTop: '1px solid var(--border-default)',
            cursor: 'default',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Rich Text Markdown Description */}
          {task.description && (
            <div
              style={{
                marginBottom: 'var(--space-2)',
                padding: 'var(--space-2-5) var(--space-3)',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Description
                </span>
                <button
                  type="button"
                  onClick={handleCopyDescription}
                  className="btn-icon"
                  style={{ width: 18, height: 18 }}
                  title="Copy Description"
                >
                  {isDescCopied ? (
                    <Check size={11} style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <Copy size={11} />
                  )}
                </button>
              </div>
              <MarkdownRenderer
                content={task.description}
                compact
                highlight={searchKeyword}
                onToggleCheckbox={handleToggleDescChecklist}
              />
            </div>
          )}

          {/* Completion Note (if task is completed) */}
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

          {/* Legacy Subtasks Checklist if no description checklist */}
          {descChecklist.total === 0 && subtasks.length > 0 && (
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
                      className="btn-status-toggle"
                      style={{
                        color: sub.completed ? 'var(--status-done-solid)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        margin: 0,
                        background: 'transparent',
                        backgroundColor: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={sub.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {sub.completed ? <CheckSquare size={13} /> : <Square size={13} />}
                    </button>
                    <span
                      style={{
                        fontSize: '11px',
                        color: sub.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: sub.completed ? 'line-through' : 'none',
                        lineHeight: 1.3,
                        flex: 1,
                      }}
                    >
                      {highlightText(sub.text, searchKeyword)}
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

          {/* Timestamps & Open Full Screen Action */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 'var(--space-1-5)',
              marginTop: 'var(--space-1-5)',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '10px',
              color: 'var(--text-muted)',
            }}
          >
            <span>Updated: {new Date(task.updatedAt || Date.now()).toLocaleDateString()}</span>
            <button
              type="button"
              onClick={handleDoubleClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                background: 'transparent',
                color: 'var(--color-primary)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '10.5px',
              }}
              title="Open full task detail screen (or double-click anywhere on this card)"
            >
              Open Full Screen
              <ExternalLink size={10} />
            </button>
          </div>
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
