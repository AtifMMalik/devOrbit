import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Plus,
  Copy,
  Scissors,
  ClipboardPaste,
  Pencil,
  Trash2,
  FileText,
  FileCode,
  Terminal,
  ArrowUpToLine,
  ArrowDownToLine,
} from 'lucide-react';
import { TaskKanbanColumn } from './TaskKanbanColumn';
import { TaskCard } from './TaskCard';
import { ExportIssuesModal } from './ExportIssuesModal';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';
import { formatTasksToMarkdown, formatTasksToJson } from '../../utils/issueExporter';

const TOP_COLUMNS = [
  { key: 'hotfix', title: 'Hot Fix' },
  { key: 'current', title: 'Current' },
  { key: 'later', title: 'Later' },
];

export const TaskKanbanBoard = ({
  tasks = [],
  onAddTask,
  onEditTask,
  onDeleteTask,
}) => {
  const {
    reorderTasks,
    moveTaskToTop,
    moveTaskToBottom,
    updateTaskStatus,
    createTask,
    deleteMultipleTasks,
    triggerConfetti,
    clipboard,
    cutTasks,
    copyTasks,
    pasteTasks,
    clearClipboard,
    activeProjectId,
  } = useWorkspace();

  const { toastSuccess, toastInfo } = useToast();

  const [isDoneExpanded, setIsDoneExpanded] = useState(false);
  const [isDoneDragOver, setIsDoneDragOver] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [focusedTaskId, setFocusedTaskId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, task }
  const [exportModalState, setExportModalState] = useState({ isOpen: false, list: 'all' });
  const [hoveredColumn, setHoveredColumn] = useState('current');

  const boardRef = useRef(null);

  // Close context menu on outside click or scroll
  useEffect(() => {
    if (!contextMenu) return;
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('scroll', handleCloseMenu, true);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('scroll', handleCloseMenu, true);
    };
  }, [contextMenu]);

  const getTasksForColumn = (colKey) => {
    return tasks.filter((t) => {
      const normStatus = (t.status || 'current').toLowerCase();
      if (normStatus === 'done') return colKey === 'done';
      if (colKey === 'done') return false;

      if (colKey === 'hotfix') {
        return normStatus === 'hotfix' || (Boolean(t.isHotfix) && normStatus !== 'current' && normStatus !== 'later');
      }

      if (colKey === 'later') {
        return normStatus === 'later';
      }

      // Default to current column
      return normStatus === 'current';
    });
  };

  const doneTasks = getTasksForColumn('done');

  // Toggle selection with Cmd+Click or single click
  const handleSelectToggle = (e, taskId, options = {}) => {
    if (options.isMulti) {
      setSelectedTaskIds((prev) => {
        const next = new Set(prev);
        if (next.has(taskId)) {
          next.delete(taskId);
        } else {
          next.add(taskId);
        }
        return next;
      });
    } else {
      setSelectedTaskIds(new Set([taskId]));
    }
    setFocusedTaskId(taskId);
  };

  // Get active targets for cut/copy/actions (either multi-selected or single-clicked/focused card)
  const getActiveTaskIds = () => {
    if (selectedTaskIds.size > 0) return [...selectedTaskIds];
    if (focusedTaskId) return [focusedTaskId];
    return [];
  };

  // Right-click context menu handler on task cards (Requirement 7)
  const handleContextMenu = (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedTaskIds.has(task.id)) {
      setSelectedTaskIds(new Set([task.id]));
      setFocusedTaskId(task.id);
    }
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      task,
    });
  };

  const handleCopyFromMenu = () => {
    if (!contextMenu) return;
    const ids = getActiveTaskIds();
    copyTasks(ids.length > 0 ? ids : [contextMenu.task.id]);
    toastSuccess(`Copied task to clipboard`);
    setContextMenu(null);
  };

  const handleCutFromMenu = () => {
    if (!contextMenu) return;
    const ids = getActiveTaskIds();
    cutTasks(ids.length > 0 ? ids : [contextMenu.task.id]);
    toastInfo(`Cut task`);
    setContextMenu(null);
  };

  const handlePasteFromMenu = () => {
    if (!contextMenu) return;
    const count = pasteTasks(contextMenu.task.projectId, contextMenu.task.status);
    toastSuccess(`Pasted ${count} task(s)`);
    setContextMenu(null);
  };

  const handleMoveToTopFromMenu = () => {
    if (!contextMenu?.task) return;
    moveTaskToTop(contextMenu.task.id);
    toastSuccess(`Moved "${contextMenu.task.title}" to top`);
    setContextMenu(null);
  };

  const handleMoveToBottomFromMenu = () => {
    if (!contextMenu?.task) return;
    moveTaskToBottom(contextMenu.task.id);
    toastSuccess(`Moved "${contextMenu.task.title}" to bottom`);
    setContextMenu(null);
  };

  const handleExportMarkdownFromMenu = async () => {
    if (!contextMenu) return;
    const targetTasks = selectedTaskIds.size > 0
      ? tasks.filter((t) => selectedTaskIds.has(t.id))
      : [contextMenu.task];
    const md = formatTasksToMarkdown(targetTasks);
    try {
      await navigator.clipboard.writeText(md);
      toastSuccess(`Exported ${targetTasks.length} issue(s) to Markdown (copied to clipboard)`);
    } catch (_e) {
      toastInfo('Markdown export generated');
    }
    setContextMenu(null);
  };

  const handleExportJsonFromMenu = async () => {
    if (!contextMenu) return;
    const targetTasks = selectedTaskIds.size > 0
      ? tasks.filter((t) => selectedTaskIds.has(t.id))
      : [contextMenu.task];
    const jsonStr = formatTasksToJson(targetTasks);
    try {
      await navigator.clipboard.writeText(jsonStr);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = targetTasks.length === 1 ? `issue-${targetTasks[0].id}.json` : 'exported-issues.json';
      a.click();
      URL.revokeObjectURL(url);
      toastSuccess(`Exported ${targetTasks.length} issue(s) as JSON`);
    } catch (_e) {
      toastInfo('JSON export generated');
    }
    setContextMenu(null);
  };

  const handleEditFromMenu = () => {
    if (!contextMenu) return;
    if (onEditTask) {
      onEditTask(contextMenu.task);
    }
    setContextMenu(null);
  };

  const handleDeleteFromMenu = () => {
    if (!contextMenu) return;
    const ids = getActiveTaskIds();
    if (ids.length > 1) {
      deleteMultipleTasks(ids);
      toastSuccess(`Moved ${ids.length} tasks to Recycle Bin`);
    } else {
      if (onDeleteTask) {
        onDeleteTask(contextMenu.task.id);
      } else {
        deleteMultipleTasks([contextMenu.task.id]);
      }
    }
    setContextMenu(null);
    setSelectedTaskIds(new Set());
    setFocusedTaskId(null);
  };

  // Keyboard shortcut listener for Cmd+C, Cmd+X, Cmd+V, Cmd+A, Delete/Backspace
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input, textarea, or contentEditable
      const target = e.target;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('input, textarea, [contenteditable="true"]')
      ) {
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Escape: close context menu & clear selection
      if (e.key === 'Escape') {
        setContextMenu(null);
        setSelectedTaskIds(new Set());
        setFocusedTaskId(null);
        return;
      }

      // Cmd+A: Select all tasks in currently hovered/focused column (or all tasks)
      if (isCmdOrCtrl && key === 'a') {
        e.preventDefault();
        const targetTasks = getTasksForColumn(hoveredColumn);
        const tasksToSelect = targetTasks.length > 0 ? targetTasks : tasks;
        const allIds = new Set(tasksToSelect.map((t) => t.id));
        setSelectedTaskIds(allIds);
        toastInfo(`Selected ${allIds.size} task(s)`);
        return;
      }

      // Cmd+C: Copy selected or focused tasks to global cross-tab clipboard (Requirement 4)
      if (isCmdOrCtrl && key === 'c') {
        const idsToCopy = getActiveTaskIds();
        if (idsToCopy.length > 0) {
          e.preventDefault();
          copyTasks(idsToCopy);
          toastSuccess(`Copied ${idsToCopy.length} task(s)`);
        }
        return;
      }

      // Cmd+X: Cut selected or focused tasks with visual indication (Requirement 4)
      if (isCmdOrCtrl && key === 'x') {
        const idsToCut = getActiveTaskIds();
        if (idsToCut.length > 0) {
          e.preventDefault();
          cutTasks(idsToCut);
          toastInfo(`Cut ${idsToCut.length} task(s)`);
        }
        return;
      }

      // Cmd+V: Paste items into target column and project
      if (isCmdOrCtrl && key === 'v') {
        if (clipboard && clipboard.tasks?.length > 0) {
          e.preventDefault();
          const targetStatus = hoveredColumn || 'current';
          const targetProjectId = tasks[0]?.projectId || activeProjectId;
          const count = pasteTasks(targetProjectId, targetStatus);
          if (clipboard.action === 'cut') {
            toastSuccess(`Moved ${count} task(s) to ${targetStatus}`);
          } else {
            toastSuccess(`Pasted ${count} task(s) into ${targetStatus}`);
          }
          setSelectedTaskIds(new Set());
        }
        return;
      }

      // Delete or Backspace: Move selected or focused tasks to Recycle Bin
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const idsToDelete = getActiveTaskIds();
        if (idsToDelete.length > 0) {
          e.preventDefault();
          deleteMultipleTasks(idsToDelete);
          setSelectedTaskIds(new Set());
          setFocusedTaskId(null);
          toastSuccess(`Moved ${idsToDelete.length} task(s) to Recycle Bin`);
        }
      }

      // Escape: clear selection
      if (e.key === 'Escape') {
        setSelectedTaskIds(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskIds, clipboard, hoveredColumn, tasks, updateTaskStatus, createTask, deleteMultipleTasks, copyTasks, cutTasks, pasteTasks, activeProjectId, toastSuccess, toastInfo]);

  // Handle multi-drag start
  const handleDragStart = (e, taskId) => {
    let idsToDrag = [taskId];
    if (selectedTaskIds.has(taskId)) {
      idsToDrag = [...selectedTaskIds];
    } else {
      setSelectedTaskIds(new Set([taskId]));
    }
    e.dataTransfer.setData('application/json', JSON.stringify(idsToDrag));
    e.dataTransfer.setData('text/plain', taskId);
  };

  // Drop handler supporting batch task movements
  const handleDropTasks = (draggedInput, targetId, targetStatus, position) => {
    let idsToMove = [];
    if (Array.isArray(draggedInput)) {
      idsToMove = draggedInput;
    } else if (typeof draggedInput === 'string') {
      try {
        const parsed = JSON.parse(draggedInput);
        idsToMove = Array.isArray(parsed) ? parsed : [draggedInput];
      } catch (e) {
        idsToMove = [draggedInput];
      }
    }

    idsToMove.forEach((id) => {
      reorderTasks(id, targetId, targetStatus, position);
    });

    if (targetStatus === 'done') {
      triggerConfetti();
    }
  };

  // Drop handler on Done collapsible section
  const handleDoneSectionDrop = (e) => {
    e.preventDefault();
    setIsDoneDragOver(false);

    let ids = [];
    const dragJson = e.dataTransfer.getData('application/json');
    const plainId = e.dataTransfer.getData('text/plain');

    if (dragJson) {
      try {
        ids = JSON.parse(dragJson);
      } catch (err) {
        // Fallback
      }
    }
    if (!ids.length && plainId) {
      ids = [plainId];
    }

    if (ids.length > 0) {
      ids.forEach((id) => updateTaskStatus(id, 'done'));
      triggerConfetti();
      toastSuccess(`Marked ${ids.length} task(s) completed`);
      setIsDoneExpanded(true);
    }
  };

  return (
    <div
      ref={boardRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        width: '100%',
      }}
      onClick={(e) => {
        // Clear selection if clicking blank canvas outside cards
        if (e.target === e.currentTarget) {
          setSelectedTaskIds(new Set());
        }
      }}
    >
      {/* Selection & Clipboard Floating Pill (If any items are selected or cut) */}
      {(selectedTaskIds.size > 0 || clipboard) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 14px',
            backgroundColor: 'var(--bg-surface-active)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11.5px',
            color: 'var(--text-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {selectedTaskIds.size > 0 && (
              <span>
                <strong>{selectedTaskIds.size}</strong> task(s) selected (
                <kbd style={{ fontSize: '10px' }}>⌘C</kbd> Copy, <kbd style={{ fontSize: '10px' }}>⌘X</kbd> Cut, <kbd style={{ fontSize: '10px' }}>Del</kbd> Delete)
              </span>
            )}
            {clipboard && (
              <span style={{ color: 'var(--color-primary)' }}>
                Clipboard: {clipboard.tasks?.length} task(s) ({clipboard.action}) — <kbd style={{ fontSize: '10px' }}>⌘V</kbd> Paste into current column
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedTaskIds(new Set());
              clearClipboard();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '11px',
              textDecoration: 'underline',
            }}
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Top Row: Current & Later Columns (Taking full horizontal space) */}
      <div
        className="task-kanban-board-container"
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          overflowX: 'auto',
          alignItems: 'flex-start',
        }}
      >
        {TOP_COLUMNS.map((col) => {
          const colTasks = getTasksForColumn(col.key);
          return (
            <div
              key={col.key}
              onMouseEnter={() => setHoveredColumn(col.key)}
              style={{ flex: 1, minWidth: '260px', display: 'flex', width: '100%' }}
            >
              <TaskKanbanColumn
                status={col.key}
                title={col.title}
                tasks={colTasks}
                selectedTaskIds={selectedTaskIds}
                onSelectToggle={handleSelectToggle}
                onContextMenu={handleContextMenu}
                onAddTask={onAddTask}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onDropTask={handleDropTasks}
                onDragStart={handleDragStart}
                onExportColumn={(colKey) => setExportModalState({ isOpen: true, list: colKey })}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom Collapsible Section: Done Tasks (Collapsed by default, similar to ToDo checklist) */}
      <div
        onMouseEnter={() => setHoveredColumn('done')}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDoneDragOver(true);
        }}
        onDragLeave={() => setIsDoneDragOver(false)}
        onDrop={handleDoneSectionDrop}
        style={{
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${isDoneDragOver ? 'var(--status-done-solid)' : 'var(--border-default)'}`,
          backgroundColor: isDoneDragOver ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
          transition: 'all var(--transition-fast)',
          overflow: 'hidden',
          marginTop: 'var(--space-2)',
        }}
      >
        {/* Accordion Header */}
        <div
          onClick={() => setIsDoneExpanded(!isDoneExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-2-5) var(--space-4)',
            cursor: 'pointer',
            userSelect: 'none',
            backgroundColor: isDoneExpanded ? 'var(--bg-surface-active)' : 'transparent',
            borderBottom: isDoneExpanded ? '1px solid var(--border-default)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ color: 'var(--status-done-solid)', display: 'flex', alignItems: 'center' }}>
              <CheckCircle2 size={16} />
            </span>
            <span style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
              Completed / Done Tasks
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--status-done-solid)',
                fontWeight: 'bold',
              }}
            >
              {doneTasks.length}
            </span>
            {isDoneDragOver && (
              <span style={{ fontSize: '11px', color: 'var(--status-done-solid)', fontStyle: 'italic' }}>
                Drop here to mark done!
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddTask('done');
              }}
              className="btn-icon"
              style={{ width: 22, height: 22 }}
              title="Add task directly to Done"
            >
              <Plus size={12} />
            </button>
            <span style={{ color: 'var(--text-muted)' }}>
              {isDoneExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          </div>
        </div>

        {/* Accordion Expanded Content */}
        {isDoneExpanded && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {doneTasks.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 'var(--space-2-5)',
                }}
              >
                {doneTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={selectedTaskIds.has(task.id)}
                    onSelectToggle={handleSelectToggle}
                    onContextMenu={handleContextMenu}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onDragStart={handleDragStart}
                    onDropOnTask={(draggedId, targetId, status, pos) => handleDropTasks(draggedId, targetId, 'done', pos)}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: 'var(--space-6)',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '11.5px',
                  fontStyle: 'italic',
                }}
              >
                No completed tasks yet. Drag tasks here or toggle checkboxes to mark them done.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right-Click Custom Context Menu (Requirement 7 & Left-Aligned) */}
      {contextMenu && (
        <div
          className="glass-panel animate-pop"
          style={{
            position: 'fixed',
            top: Math.min(window.innerHeight - 320, Math.max(10, contextMenu.y)),
            left: Math.min(window.innerWidth - 220, Math.max(10, contextMenu.x)),
            zIndex: 'var(--z-popover)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl), 0 8px 32px rgba(0,0,0,0.4)',
            padding: '4px',
            minWidth: '200px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            fontSize: 'var(--text-xs)',
            textAlign: 'left',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Menu Header with Task Title */}
          <div
            style={{
              padding: '6px 8px',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 2,
              textAlign: 'left',
            }}
            className="truncate"
          >
            {contextMenu.task.title}
          </div>

          {/* Copy Option */}
          <button
            type="button"
            onClick={handleCopyFromMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              padding: '6px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              textAlign: 'left',
              gap: 8,
            }}
            className="context-menu-item"
          >
            <Copy size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ textAlign: 'left' }}>Copy Issue</span>
            <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>⌘C</span>
          </button>

          {/* Cut Option */}
          <button
            type="button"
            onClick={handleCutFromMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              padding: '6px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              textAlign: 'left',
              gap: 8,
            }}
            className="context-menu-item"
          >
            <Scissors size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <span style={{ textAlign: 'left' }}>Cut Issue</span>
            <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>⌘X</span>
          </button>

          {/* Paste Option */}
          {clipboard && clipboard.tasks?.length > 0 && (
            <button
              type="button"
              onClick={handlePasteFromMenu}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: '100%',
                padding: '6px 8px',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                textAlign: 'left',
                gap: 8,
              }}
              className="context-menu-item"
            >
              <ClipboardPaste size={13} style={{ color: '#10b981', flexShrink: 0 }} />
              <span style={{ textAlign: 'left' }}>Paste Issue</span>
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>⌘V</span>
            </button>
          )}

          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '3px 0' }} />

          {/* Move to Top Option */}
          <button
            type="button"
            onClick={handleMoveToTopFromMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              padding: '6px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              textAlign: 'left',
              gap: 8,
            }}
            className="context-menu-item"
          >
            <ArrowUpToLine size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ textAlign: 'left' }}>Move to Top</span>
          </button>

          {/* Move to Bottom Option */}
          <button
            type="button"
            onClick={handleMoveToBottomFromMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              padding: '6px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              textAlign: 'left',
              gap: 8,
            }}
            className="context-menu-item"
          >
            <ArrowDownToLine size={13} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <span style={{ textAlign: 'left' }}>Move to Bottom</span>
          </button>

          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '3px 0' }} />

          {/* Export to Markdown */}
          <button
            type="button"
            onClick={handleExportMarkdownFromMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 8,
              width: '100%',
              padding: '6px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            className="context-menu-item"
          >
            <FileText size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ textAlign: 'left' }}>Export to Markdown</span>
          </button>

          {/* Export to JSON */}
          <button
            type="button"
            onClick={handleExportJsonFromMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 8,
              width: '100%',
              padding: '6px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            className="context-menu-item"
          >
            <FileCode size={13} style={{ color: '#06b6d4', flexShrink: 0 }} />
            <span style={{ textAlign: 'left' }}>Export to JSON</span>
          </button>

          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '3px 0' }} />

          {/* Edit Task */}
          <button
            type="button"
            onClick={handleEditFromMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 8,
              width: '100%',
              padding: '6px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            className="context-menu-item"
          >
            <Pencil size={13} style={{ flexShrink: 0 }} />
            <span style={{ textAlign: 'left' }}>Edit Details</span>
          </button>

          {/* Delete Task */}
          <button
            type="button"
            onClick={handleDeleteFromMenu}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 8,
              width: '100%',
              padding: '6px 8px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              background: 'transparent',
              color: '#f43f5e',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            className="context-menu-item"
          >
            <Trash2 size={13} style={{ flexShrink: 0 }} />
            <span style={{ textAlign: 'left' }}>Delete to Recycle Bin</span>
          </button>
        </div>
      )}

      {/* Export / Copy Issues Modal (Markdown & JSON) */}
      <ExportIssuesModal
        isOpen={exportModalState.isOpen}
        onClose={() => setExportModalState({ isOpen: false, list: 'all' })}
        initialList={exportModalState.list}
        tasks={tasks}
      />
    </div>
  );
};
