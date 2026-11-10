import React, { useState } from 'react';
import { Plus, Flame, FileDown } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { BrandFooter } from '../common/BrandFooter';

export const TaskKanbanColumn = ({
  status,
  title,
  tasks = [],
  selectedTaskIds,
  onSelectToggle,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onDropTask,
  onDragStart,
  onExportColumn,
  onContextMenu,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const statusDots = {
    hotfix: 'var(--status-hotfix-solid)',
    current: 'var(--status-current-solid)',
    later: 'var(--status-later-solid)',
    done: 'var(--status-done-solid)',
  };

  const dotColor = statusDots[status] || 'var(--text-muted)';

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDropOnColumn = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const dragJson = e.dataTransfer.getData('application/json');
    const plainId = e.dataTransfer.getData('text/plain');

    if (dragJson) {
      try {
        const ids = JSON.parse(dragJson);
        if (Array.isArray(ids) && onDropTask) {
          onDropTask(ids, null, status, 'after');
          return;
        }
      } catch (err) {
        // Fallback
      }
    }

    if (plainId && onDropTask) {
      onDropTask(plainId, null, status, 'after');
    }
  };

  const handleDragStartInternal = (e, taskId) => {
    if (onDragStart) {
      onDragStart(e, taskId);
    } else {
      e.dataTransfer.setData('text/plain', taskId);
    }
  };

  const handleDropOnTask = (draggedId, targetId, _targetStatus, position) => {
    if (onDropTask) {
      onDropTask(draggedId, targetId, status, position);
    }
  };

  return (
    <div
      className="task-kanban-column"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropOnColumn}
      style={{
        flex: 1,
        width: '100%',
        minWidth: '240px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isDragOver ? 'var(--bg-surface-active)' : 'var(--bg-surface)',
        border: `1px solid ${isDragOver ? 'var(--color-primary)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-2-5)',
        transition: 'background-color var(--transition-fast)',
        maxHeight: 'calc(100vh - 190px)',
      }}
    >
      {/* Column Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 'var(--space-2)',
          borderBottom: '1px solid var(--border-default)',
          marginBottom: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
          {status === 'hotfix' ? (
            <Flame size={13} style={{ color: 'var(--status-hotfix-solid)' }} />
          ) : (
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: dotColor,
              }}
            />
          )}
          <span style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--text-xs)', color: status === 'hotfix' ? 'var(--status-hotfix-text)' : 'var(--text-primary)' }}>
            {title}
          </span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              padding: '0 4px',
            }}
          >
            {tasks.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {onExportColumn && (
            <button
              type="button"
              onClick={() => onExportColumn(status)}
              className="btn-icon"
              style={{ width: 20, height: 20, backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
              title={`Copy / Export ${title} issues (Markdown or JSON)`}
            >
              <FileDown size={12} color="#ffffff" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onAddTask(status)}
            className="btn-icon"
            style={{ width: 20, height: 20, backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
            title={`Add task to ${title}`}
          >
            <Plus size={12} color="#ffffff" />
          </button>
        </div>
      </div>

      {/* Column Task Cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          overflowY: 'auto',
          flex: 1,
          padding: '2px',
        }}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isSelected={selectedTaskIds && selectedTaskIds.has(task.id)}
            onSelectToggle={onSelectToggle}
            onContextMenu={onContextMenu}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onDragStart={handleDragStartInternal}
            onDropOnTask={handleDropOnTask}
          />
        ))}

        {tasks.length === 0 && (
          <div
            style={{
              padding: 'var(--space-6) var(--space-2)',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '11px',
              border: '1px dashed var(--border-default)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Empty
          </div>
        )}

        {/* Brand Footer below every list */}
        <BrandFooter compact tagline="orbit your issues" style={{ marginTop: 'auto', paddingTop: 'var(--space-3)' }} />
      </div>
    </div>
  );
};
