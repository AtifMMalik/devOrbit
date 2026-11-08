import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, FileCode, Trash2, ListPlus } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ProjectHeader } from '../components/projects/ProjectHeader';
import { TaskFilterBar } from '../components/tasks/TaskFilterBar';
import { TaskKanbanBoard } from '../components/tasks/TaskKanbanBoard';
import { TaskListView } from '../components/tasks/TaskListView';
import { MarkdownSyncModal } from '../components/tasks/MarkdownSyncModal';
import { ExportIssuesModal } from '../components/tasks/ExportIssuesModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/common/Button';
import { BrandFooter } from '../components/common/BrandFooter';
import { ProjectChecklistSection } from '../components/tasks/ProjectChecklistSection';

const COMMON_LIST_SUGGESTIONS = [
  'Procedures',
  'QA & Verification',
  'Deployment & Release',
  'Sprint Goals',
  'Design Review',
  'Documentation',
  'Security Audit',
  'Performance Checklist',
];

export const ProjectTasksPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { onOpenNewProject, onOpenEditProject, onOpenNewTask } = useOutletContext();
  const {
    getProject,
    getProjectTasks,
    deleteTask,
    deleteProject,
    getProjectTodos,
    addProjectTodo,
    toggleProjectTodo,
    updateProjectTodo,
    deleteProjectTodo,
    getProjectTesting,
    addProjectTesting,
    toggleProjectTesting,
    updateProjectTesting,
    deleteProjectTesting,
    getProjectCustomLists,
    addCustomList,
    deleteCustomList,
    addCustomListItem,
    toggleCustomListItem,
    updateCustomListItem,
    deleteCustomListItem,
    deleteDefaultList,
    restoreDefaultList,
  } = useWorkspace();

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [includeSubprojects, setIncludeSubprojects] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [hotfixFilter, setHotfixFilter] = useState(false);

  // Modals
  const [isMarkdownSyncOpen, setIsMarkdownSyncOpen] = useState(false);
  const [isExportIssuesOpen, setIsExportIssuesOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [deletingChecklistItem, setDeletingChecklistItem] = useState(null);
  const [deletingList, setDeletingList] = useState(null);

  // Custom List Creator State (Requirement 12)
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState('');

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
      if (statusFilter !== 'all') {
        const norm = (task.status || 'current').toLowerCase();
        const isHot = Boolean(task.isHotfix || (task.tags && task.tags.includes('hotfix')) || norm === 'hotfix');
        if (statusFilter === 'hotfix') {
          if (!isHot) return false;
        } else if (statusFilter === 'current') {
          if (isHot || norm !== 'current') return false;
        } else if (statusFilter === 'later') {
          if (isHot || norm !== 'later') return false;
        } else if (norm !== statusFilter) {
          return false;
        }
      }

      // Priority
      if (priorityFilter !== 'all' && (task.priority || 'medium').toLowerCase() !== priorityFilter) {
        return false;
      }

      // Tag
      if (tagFilter !== 'all' && (!task.tags || !task.tags.map((t) => t.toLowerCase()).includes(tagFilter))) {
        return false;
      }

      // Hot fix filter
      if (hotfixFilter && !task.isHotfix && (!task.tags || !task.tags.includes('hotfix'))) {
        return false;
      }

      return true;
    });
  }, [rawTasks, searchQuery, statusFilter, priorityFilter, tagFilter, hotfixFilter]);

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

  const handleOpenAddTask = (defaultStatus = 'current', isHotfix = false) => {
    navigate(`/project/${projectId}/tasks/new`, {
      state: { status: defaultStatus, isHotfix },
    });
  };

  const handleOpenEditTask = (task) => {
    const targetTaskId = typeof task === 'string' ? task : task?.id;
    if (targetTaskId) {
      navigate(`/project/${projectId}/tasks/${targetTaskId}`);
    }
  };

  const handleDeleteTaskConfirm = () => {
    if (deletingTaskId) {
      deleteTask(deletingTaskId);
      setDeletingTaskId(null);
    }
  };

  const handleConfirmDeleteChecklist = () => {
    if (deletingChecklistItem && project) {
      if (deletingChecklistItem.type === 'todos') {
        deleteProjectTodo(project.id, deletingChecklistItem.id);
      } else if (deletingChecklistItem.type === 'testing') {
        deleteProjectTesting(project.id, deletingChecklistItem.id);
      } else if (deletingChecklistItem.type === 'custom') {
        deleteCustomListItem(project.id, deletingChecklistItem.listId, deletingChecklistItem.id);
      }
      setDeletingChecklistItem(null);
    }
  };

  const handleCreateListSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanTitle = (newListTitle || selectedSuggestion).trim();
    if (!cleanTitle || !project) return;

    if (cleanTitle.toLowerCase() === 'to dos' || cleanTitle.toLowerCase() === 'todos') {
      restoreDefaultList(project.id, 'todos');
    } else if (cleanTitle.toLowerCase() === 'testing') {
      restoreDefaultList(project.id, 'testing');
    } else {
      addCustomList(project.id, cleanTitle);
    }

    setNewListTitle('');
    setSelectedSuggestion('');
    setIsAddingList(false);
  };

  const handleConfirmDeleteList = () => {
    if (!deletingList || !project) return;
    if (deletingList.type === 'default') {
      deleteDefaultList(project.id, deletingList.id);
    } else {
      deleteCustomList(project.id, deletingList.id);
    }
    setDeletingList(null);
  };

  const handleDeleteProject = () => {
    deleteProject(project.id);
    navigate('/');
  };

  const deletedDefaultLists = project.deletedDefaultLists || [];
  const showTodos = !deletedDefaultLists.includes('todos');
  const showTesting = !deletedDefaultLists.includes('testing');
  const customLists = getProjectCustomLists(project.id);

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
      <div className="page-container" style={{ padding: 'var(--space-4) var(--space-8)', display: 'flex', flexDirection: 'column', flex: 1 }}>
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
          hotfixFilter={hotfixFilter}
          onToggleHotfix={() => setHotfixFilter(!hotfixFilter)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          includeSubprojects={includeSubprojects}
          onToggleIncludeSubprojects={() => setIncludeSubprojects(!includeSubprojects)}
          availableTags={availableTags}
          totalTasks={filteredTasks.length}
          onOpenExport={() => setIsExportIssuesOpen(true)}
        />

        {/* Checklists Sections: To Dos, Testing, and Custom Lists (Requirement 12) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2-5)', marginTop: 'var(--space-3)' }}>
          {/* 1. To Dos Section (Default - can be deleted) */}
          {showTodos && (
            <ProjectChecklistSection
              title="To Dos"
              type="todos"
              items={getProjectTodos(project.id)}
              onAdd={(text) => addProjectTodo(project.id, text)}
              onToggle={(todoId) => toggleProjectTodo(project.id, todoId)}
              onUpdate={(todoId, newText) => updateProjectTodo(project.id, todoId, newText)}
              onDelete={(todoId) => setDeletingChecklistItem({ id: todoId, type: 'todos' })}
              onDeleteList={() => setDeletingList({ type: 'default', id: 'todos', title: 'To Dos' })}
              placeholder="Add a to-do item (e.g. review PR, check schema migration)..."
            />
          )}

          {/* 2. Testing Section (Default - can be deleted) */}
          {showTesting && (
            <ProjectChecklistSection
              title="Testing"
              type="testing"
              items={getProjectTesting(project.id)}
              onAdd={(text) => addProjectTesting(project.id, text)}
              onToggle={(testId) => toggleProjectTesting(project.id, testId)}
              onUpdate={(testId, newText) => updateProjectTesting(project.id, testId, newText)}
              onDelete={(testId) => setDeletingChecklistItem({ id: testId, type: 'testing' })}
              onDeleteList={() => setDeletingList({ type: 'default', id: 'testing', title: 'Testing' })}
              placeholder="Add a test case item (e.g. Test cart JSON formatting, Test responsive slider)..."
            />
          )}

          {/* 3. Custom Lists (Shown below TODO list and Testing lists - Requirement 12) */}
          {customLists.map((cl) => (
            <ProjectChecklistSection
              key={cl.id}
              title={cl.title}
              type="custom"
              items={cl.items || []}
              onAdd={(text) => addCustomListItem(project.id, cl.id, text)}
              onToggle={(itemId) => toggleCustomListItem(project.id, cl.id, itemId)}
              onUpdate={(itemId, newText) => updateCustomListItem(project.id, cl.id, itemId, newText)}
              onDelete={(itemId) => setDeletingChecklistItem({ id: itemId, type: 'custom', listId: cl.id })}
              onDeleteList={() => setDeletingList({ type: 'custom', id: cl.id, title: cl.title })}
              placeholder={`Add item to ${cl.title}...`}
            />
          ))}

          {/* Add Custom List Control with Suggestions Dropdown (Requirement 12) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: '2px' }}>
            {isAddingList ? (
              <form
                onSubmit={handleCreateListSubmit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  flexWrap: 'wrap',
                  backgroundColor: 'var(--bg-surface)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: '220px' }}>
                  <select
                    value={selectedSuggestion}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedSuggestion(val);
                      if (val) setNewListTitle(val);
                    }}
                    style={{ fontSize: 'var(--text-xs)', padding: '5px 8px', maxWidth: '200px' }}
                  >
                    <option value="">Suggestions / Templates...</option>
                    {!showTodos && <option value="To Dos">To Dos (Default)</option>}
                    {!showTesting && <option value="Testing">Testing (Default)</option>}
                    {COMMON_LIST_SUGGESTIONS.map((sug) => (
                      <option key={sug} value={sug}>
                        {sug}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="List name (e.g. Procedures)..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    spellCheck={true}
                    style={{ fontSize: 'var(--text-xs)', padding: '5px 8px', flex: 1 }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Button type="submit" variant="primary" size="sm" disabled={!newListTitle.trim() && !selectedSuggestion}>
                    Create List
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsAddingList(false);
                      setNewListTitle('');
                      setSelectedSuggestion('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingList(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px dashed var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Plus size={14} style={{ color: 'var(--color-primary)' }} />
                <span>Add List (e.g. Procedures, QA, Deployment)</span>
              </button>
            )}
          </div>
        </div>

        {/* View Content (Current, Later, Done - Kanban or List) */}
        <div style={{ marginTop: 'var(--space-3)', flex: 1, width: '100%' }}>
          {viewMode === 'kanban' ? (
            <TaskKanbanBoard
              tasks={filteredTasks}
              onAddTask={(status) => handleOpenAddTask(status)}
              onEditTask={handleOpenEditTask}
              onDeleteTask={(taskId) => setDeletingTaskId(taskId)}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <TaskListView
                tasks={filteredTasks}
                onEditTask={handleOpenEditTask}
                onDeleteTask={(taskId) => setDeletingTaskId(taskId)}
              />
            </div>
          )}
        </div>

        {/* Brand Footer at end of Workspace screen */}
        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-6)', width: '100%' }}>
          <BrandFooter />
        </div>
      </div>

      {/* Markdown Importer / Exporter */}
      <MarkdownSyncModal
        isOpen={isMarkdownSyncOpen}
        onClose={() => setIsMarkdownSyncOpen(false)}
        project={project}
      />

      {/* Export / Copy Issues Modal (Markdown & JSON - Requirements 2 & 11) */}
      <ExportIssuesModal
        isOpen={isExportIssuesOpen}
        onClose={() => setIsExportIssuesOpen(false)}
        currentProject={project}
        tasks={filteredTasks}
      />

      {/* Task Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTaskId}
        onClose={() => setDeletingTaskId(null)}
        onConfirm={handleDeleteTaskConfirm}
        title="Move Task to Recycle Bin"
        message="Are you sure you want to move this task to the Recycle Bin? You can recover it anytime within 30 days."
        confirmText="Move to Recycle Bin"
      />

      {/* Checklist Item Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingChecklistItem}
        onClose={() => setDeletingChecklistItem(null)}
        onConfirm={handleConfirmDeleteChecklist}
        title="Delete Checklist Item"
        message="Are you sure you want to delete this checklist item?"
        confirmText="Delete Item"
      />

      {/* List Delete Confirmation (Requirement 12) */}
      <ConfirmDialog
        isOpen={!!deletingList}
        onClose={() => setDeletingList(null)}
        onConfirm={handleConfirmDeleteList}
        title={`Delete "${deletingList?.title || 'List'}"?`}
        message={`Are you sure you want to delete the "${deletingList?.title}" list and all of its checklist items?`}
        confirmText="Delete List"
        confirmVariant="danger"
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
