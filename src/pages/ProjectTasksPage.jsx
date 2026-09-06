import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, FileCode, Trash2 } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ProjectHeader } from '../components/projects/ProjectHeader';
import { TaskFilterBar } from '../components/tasks/TaskFilterBar';
import { TaskKanbanBoard } from '../components/tasks/TaskKanbanBoard';
import { TaskListView } from '../components/tasks/TaskListView';
import { TaskModal } from '../components/tasks/TaskModal';
import { MarkdownSyncModal } from '../components/tasks/MarkdownSyncModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/common/Button';

export const ProjectTasksPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { onOpenNewProject, onOpenEditProject, onOpenNewTask } = useOutletContext();
  const { getProject, getProjectTasks, deleteTask, deleteProject } = useWorkspace();

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [includeSubprojects, setIncludeSubprojects] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalDefaultStatus, setTaskModalDefaultStatus] = useState('current');
  const [editingTask, setEditingTask] = useState(null);

  const [isMarkdownSyncOpen, setIsMarkdownSyncOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  const project = getProject(projectId);
  const rawTasks = useMemo(() => {
    return projectId ? getProjectTasks(projectId, includeSubprojects) : [];
  }, [projectId, includeSubprojects, getProjectTasks]);

  // Extract all unique tags
  const availableTags = useMemo(() => {
    const tagsSet = new Set();
    rawTasks.forEach((task) => {
      if (Array.isArray(task.tags)) {
        task.tags.forEach((t) => tagsSet.add(t.toLowerCase()));
      }
    });
    return Array.from(tagsSet);
  }, [rawTasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return rawTasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        const matchesTags = task.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      // Status
      if (statusFilter !== 'all' && (task.status || 'backlog').toLowerCase() !== statusFilter) {
        return false;
      }

      // Priority
      if (priorityFilter !== 'all' && (task.priority || 'medium').toLowerCase() !== priorityFilter) {
        return false;
      }

      // Tag
      if (tagFilter !== 'all' && (!task.tags || !task.tags.map((t) => t.toLowerCase()).includes(tagFilter))) {
        return false;
      }

      return true;
    });
  }, [rawTasks, searchQuery, statusFilter, priorityFilter, tagFilter]);

  if (!project) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <h2>Project not found</h2>
        <Button variant="primary" onClick={() => navigate('/')} style={{ marginTop: 'var(--space-4)' }}>
          Back to Workspace
        </Button>
      </div>
    );
  }

  const handleOpenAddTask = (defaultStatus = 'current') => {
    setEditingTask(null);
    setTaskModalDefaultStatus(defaultStatus);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTaskConfirm = () => {
    if (deletingTaskId) {
      deleteTask(deletingTaskId);
      setDeletingTaskId(null);
    }
  };

  const handleDeleteProject = () => {
    deleteProject(project.id);
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Project Header with Tabs */}
      <ProjectHeader
        project={project}
        onNewTask={() => handleOpenAddTask('current')}
        onNewSubproject={() => onOpenNewProject(project.id)}
        onOpenMarkdownSync={() => setIsMarkdownSyncOpen(true)}
        onEditProject={() => onOpenEditProject(project)}
        onDeleteProject={() => setIsDeleteProjectOpen(true)}
      />

      {/* Main Task Tool Area */}
      <div style={{ padding: 'var(--space-4) var(--space-8)', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Filter Controls Bar */}
        <TaskFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          tagFilter={tagFilter}
          onTagChange={setTagFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          includeSubprojects={includeSubprojects}
          onToggleIncludeSubprojects={() => setIncludeSubprojects(!includeSubprojects)}
          availableTags={availableTags}
          totalTasks={filteredTasks.length}
        />

        {/* View Content (Kanban or List) */}
        <div style={{ marginTop: 'var(--space-4)', flex: 1 }}>
          {viewMode === 'kanban' ? (
            <TaskKanbanBoard
              tasks={filteredTasks}
              onAddTask={(status) => handleOpenAddTask(status)}
              onEditTask={handleOpenEditTask}
              onDeleteTask={(taskId) => setDeletingTaskId(taskId)}
            />
          ) : (
            <TaskListView
              tasks={filteredTasks}
              onEditTask={handleOpenEditTask}
              onDeleteTask={(taskId) => setDeletingTaskId(taskId)}
            />
          )}
        </div>
      </div>

      {/* Task Edit/Create Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        defaultProjectId={project.id}
        defaultStatus={taskModalDefaultStatus}
        editingTask={editingTask}
      />

      {/* Markdown Importer / Exporter */}
      <MarkdownSyncModal
        isOpen={isMarkdownSyncOpen}
        onClose={() => setIsMarkdownSyncOpen(false)}
        project={project}
      />

      {/* Task Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTaskId}
        onClose={() => setDeletingTaskId(null)}
        onConfirm={handleDeleteTaskConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete Task"
      />

      {/* Project Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteProjectOpen}
        onClose={() => setIsDeleteProjectOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}" and all of its tasks?`}
        confirmText="Delete Project"
      />
    </div>
  );
};
