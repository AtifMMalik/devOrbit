import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { TaskKanbanColumn } from './TaskKanbanColumn';
import { TaskCard } from './TaskCard';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

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
    updateTaskStatus,
    createTask,
    deleteMultipleTasks,
    triggerConfetti,
  } = useWorkspace();

  const { toastSuccess, toastInfo } = useToast();

  const [isDoneExpanded, setIsDoneExpanded] = useState(false);
  const [isDoneDragOver, setIsDoneDragOver] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [clipboard, setClipboard] = useState(null); // { action: 'cut' | 'copy', taskIds: string[], tasks: Task[] }
  const [hoveredColumn, setHoveredColumn] = useState('current');

  const boardRef = useRef(null);

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

  // Toggle selection with Cmd+Click or Ctrl+Click
  const handleSelectToggle = (e, taskId) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
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

      // Cmd+C: Copy selected tasks
      if (isCmdOrCtrl && key === 'c') {
        if (selectedTaskIds.size > 0) {
          e.preventDefault();
          const selectedList = tasks.filter((t) => selectedTaskIds.has(t.id));
          setClipboard({ action: 'copy', taskIds: [...selectedTaskIds], tasks: selectedList });
          toastSuccess(`Copied ${selectedTaskIds.size} task(s)`);
        }
        return;
      }

      // Cmd+X: Cut selected tasks
      if (isCmdOrCtrl && key === 'x') {
        if (selectedTaskIds.size > 0) {
          e.preventDefault();
          const selectedList = tasks.filter((t) => selectedTaskIds.has(t.id));
          setClipboard({ action: 'cut', taskIds: [...selectedTaskIds], tasks: selectedList });
          toastInfo(`Cut ${selectedTaskIds.size} task(s)`);
        }
        return;
      }

      // Cmd+V: Paste items into target column
      if (isCmdOrCtrl && key === 'v') {
        if (clipboard && clipboard.tasks?.length > 0) {
          e.preventDefault();
          const targetStatus = hoveredColumn || 'current';

          if (clipboard.action === 'cut') {
            clipboard.tasks.forEach((task) => {
              updateTaskStatus(task.id, targetStatus);
            });
            toastSuccess(`Moved ${clipboard.tasks.length} task(s) to ${targetStatus}`);
            setClipboard(null);
            setSelectedTaskIds(new Set());
          } else if (clipboard.action === 'copy') {
            clipboard.tasks.forEach((task) => {
              const { id: _id, createdAt: _created, updatedAt: _updated, ...rest } = task;
              createTask({
                ...rest,
                title: `${task.title} (Copy)`,
                status: targetStatus,
              });
            });
            toastSuccess(`Pasted ${clipboard.tasks.length} task(s) into ${targetStatus}`);
          }
        }
        return;
      }

      // Delete or Backspace: Move selected tasks to Recycle Bin
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTaskIds.size > 0) {
        e.preventDefault();
        const idsToDelete = [...selectedTaskIds];
        deleteMultipleTasks(idsToDelete);
        setSelectedTaskIds(new Set());
        toastSuccess(`Moved ${idsToDelete.length} task(s) to Recycle Bin`);
      }

      // Escape: clear selection
      if (e.key === 'Escape') {
        setSelectedTaskIds(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskIds, clipboard, hoveredColumn, tasks, updateTaskStatus, createTask, deleteMultipleTasks, toastSuccess, toastInfo]);

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
              setClipboard(null);
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
                onAddTask={onAddTask}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onDropTask={handleDropTasks}
                onDragStart={handleDragStart}
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
    </div>
  );
};
