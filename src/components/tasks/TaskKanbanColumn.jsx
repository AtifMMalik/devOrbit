import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';

export const TaskKanbanColumn = ({
  status,
  title,
  tasks = [],
  onAddTask,
  onEditTask,
  onDeleteTask,
  onDropTask,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const statusDots = {
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
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && onDropTask) {
      // Append to the end of this status column
      onDropTask(draggedId, null, status, 'after');
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDropOnTask = (draggedId, targetId, targetStatus, position) => {
    if (onDropTask) {
      onDropTask(draggedId, targetId, targetStatus, position);
    }
  };

  return (
    <div
      className="task-kanban-column"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropOnColumn}
      style={{
        flex: '1 1 260px',
        minWidth: '240px',
        maxWidth: '360px',
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
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: dotColor,
            }}
          />
          <span style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
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

        <button
          type="button"
          onClick={() => onAddTask(status)}
          className="btn-icon"
          style={{ width: 20, height: 20 }}
          title={`Add task to ${title}`}
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Column Task Cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          overflowY: 'auto',
          flex: 1,
          paddingRight: '2px',
        }}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onDragStart={handleDragStart}
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
      </div>
    </div>
  );
};
