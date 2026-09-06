import React from 'react';
import { TaskKanbanColumn } from './TaskKanbanColumn';
import { useWorkspace } from '../../context/WorkspaceContext';

const COLUMNS = [
  { key: 'current', title: 'Current' },
  { key: 'later', title: 'Later' },
  { key: 'done', title: 'Done' },
];

export const TaskKanbanBoard = ({
  tasks = [],
  onAddTask,
  onEditTask,
  onDeleteTask,
}) => {
  const { reorderTasks } = useWorkspace();

  const handleDropTask = (draggedId, targetId, targetStatus, position) => {
    reorderTasks(draggedId, targetId, targetStatus, position);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-4)',
        overflowX: 'auto',
        paddingBottom: 'var(--space-4)',
        alignItems: 'flex-start',
      }}
    >
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => (t.status || 'current').toLowerCase() === col.key);
        return (
          <TaskKanbanColumn
            key={col.key}
            status={col.key}
            title={col.title}
            tasks={colTasks}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onDropTask={handleDropTask}
          />
        );
      })}
    </div>
  );
};
