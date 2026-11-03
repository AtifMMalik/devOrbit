import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { loadWorkspaceData, saveWorkspaceData, resetWorkspaceData, sanitizeWorkspaceData, purgeExpiredDeletedTasks } from '../utils/storage';
import { generateId } from '../utils/idGenerator';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const [data, setData] = useState(() => loadWorkspaceData());
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const deletionStackRef = undoStackRef; // Backwards-compatibility alias

  // Sync to LocalStorage whenever data changes
  useEffect(() => {
    saveWorkspaceData(data);
  }, [data]);

  // Trigger celebration confetti
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 45,
        spread: 55,
        origin: { y: 0.8 },
        colors: ['#0084ff', '#38bdf8', '#10b981', '#fbbf24', '#f43f5e']
      });
    } catch (e) {
      // Ignore if confetti fails in headless env
    }
  }, []);

  // =========================================================================
  // Project Management
  // =========================================================================

  const createProject = useCallback((projectData) => {
    const newProject = {
      id: generateId('proj'),
      parentId: projectData.parentId || null,
      name: projectData.name.trim(),
      description: projectData.description?.trim() || '',
      author: projectData.author?.trim() || '',
      readme: projectData.readme || '',
      liveUrl: projectData.liveUrl?.trim() || '',
      githubUrl: projectData.githubUrl?.trim() || '',
      color: projectData.color || '#0084ff',
      logo: projectData.logo || null,
      icon: projectData.icon || 'Folder',
      tags: projectData.tags || [],
      todos: Array.isArray(projectData.todos) ? projectData.todos : [],
      testing: Array.isArray(projectData.testing) ? projectData.testing : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects],
    }));

    return newProject;
  }, []);

  const updateProject = useCallback((id, updates) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === id ? { ...proj, ...updates, updatedAt: new Date().toISOString() } : proj
      ),
    }));
  }, []);

  // Soft-delete project into Recycle Bin (recoverable for 30 days)
  const deleteProject = useCallback((id) => {
    setData((prev) => {
      const targetProject = prev.projects.find((p) => p.id === id);
      if (!targetProject) return prev;

      // Recursively find all child project IDs
      const getChildIds = (parentId) => {
        const children = prev.projects.filter((p) => p.parentId === parentId);
        return [parentId, ...children.flatMap((c) => getChildIds(c.id))];
      };

      const idsToDelete = new Set(getChildIds(id));
      const projectsToDelete = prev.projects.filter((p) => idsToDelete.has(p.id));
      const projectTasks = prev.tasks.filter((t) => idsToDelete.has(t.projectId));
      const projectNotes = prev.notes.filter((n) => idsToDelete.has(n.projectId));

      const deletedTimestamp = new Date().toISOString();
      const deletedBatch = projectsToDelete.map((proj) => ({
        ...proj,
        associatedTasks: projectTasks.filter((t) => t.projectId === proj.id),
        associatedNotes: projectNotes.filter((n) => n.projectId === proj.id),
        deletedAt: deletedTimestamp,
        updatedAt: deletedTimestamp,
      }));

      deletionStackRef.current.push({
        type: 'project',
        id: targetProject.id,
        name: targetProject.name,
        allProjectIds: [...idsToDelete],
      });

      return {
        ...prev,
        projects: prev.projects.filter((p) => !idsToDelete.has(p.id)),
        tasks: prev.tasks.filter((t) => !idsToDelete.has(t.projectId)),
        notes: prev.notes.filter((n) => !idsToDelete.has(n.projectId)),
        deletedProjects: [...deletedBatch, ...(prev.deletedProjects || [])],
      };
    });

    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  }, [activeProjectId]);

  // Restore soft-deleted project from Recycle Bin back into active workspace
  const restoreProject = useCallback((id) => {
    let restoredName = 'Project';
    setData((prev) => {
      const deletedList = prev.deletedProjects || [];
      const projectToRestore = deletedList.find((p) => p.id === id);
      if (!projectToRestore) return prev;

      restoredName = projectToRestore.name;

      // Find project and any sub-projects in deleted list
      const getDeletedFamily = (parentId) => {
        const children = deletedList.filter((p) => p.parentId === parentId);
        return [parentId, ...children.flatMap((c) => getDeletedFamily(c.id))];
      };
      const familyIds = new Set(getDeletedFamily(id));
      const itemsToRestore = deletedList.filter((p) => familyIds.has(p.id));

      const restoredProjects = [];
      const restoredTasks = [];
      const restoredNotes = [];

      for (const dp of itemsToRestore) {
        const { deletedAt: _d, associatedTasks = [], associatedNotes = [], ...cleanProj } = dp;
        restoredProjects.push({ ...cleanProj, updatedAt: new Date().toISOString() });
        if (Array.isArray(associatedTasks)) {
          restoredTasks.push(...associatedTasks);
        }
        if (Array.isArray(associatedNotes)) {
          restoredNotes.push(...associatedNotes);
        }
      }

      return {
        ...prev,
        deletedProjects: deletedList.filter((p) => !familyIds.has(p.id)),
        projects: [...restoredProjects, ...prev.projects],
        tasks: [...restoredTasks, ...prev.tasks],
        notes: [...restoredNotes, ...prev.notes],
      };
    });
    return restoredName;
  }, []);

  // Permanently delete a project from Recycle Bin
  const permanentlyDeleteProject = useCallback((id) => {
    setData((prev) => {
      const deletedList = prev.deletedProjects || [];
      const getDeletedFamily = (parentId) => {
        const children = deletedList.filter((p) => p.parentId === parentId);
        return [parentId, ...children.flatMap((c) => getDeletedFamily(c.id))];
      };
      const familyIds = new Set(getDeletedFamily(id));
      return {
        ...prev,
        deletedProjects: deletedList.filter((p) => !familyIds.has(p.id)),
      };
    });
  }, []);

  const getProject = useCallback((id) => {
    return data.projects.find((p) => p.id === id) || null;
  }, [data.projects]);

  const getSubProjects = useCallback((parentId) => {
    return data.projects.filter((p) => p.parentId === parentId);
  }, [data.projects]);

  const getRootProjects = useCallback(() => {
    return data.projects.filter((p) => !p.parentId);
  }, [data.projects]);

  // Builds breadcrumb array from root down to current project
  const getProjectBreadcrumbs = useCallback((projectId) => {
    const crumbs = [];
    let current = data.projects.find((p) => p.id === projectId);
    while (current) {
      crumbs.unshift(current);
      current = current.parentId ? data.projects.find((p) => p.id === current.parentId) : null;
    }
    return crumbs;
  }, [data.projects]);

  // =========================================================================
  // Task Management
  // =========================================================================

  const createTask = useCallback((taskData) => {
    const cleanDeadline = taskData.deadline?.trim() || (taskData.dueDate?.trim() || '');
    const isHotfix = Boolean(taskData.isHotfix || (taskData.tags && taskData.tags.includes('hotfix')) || taskData.status === 'hotfix');
    const finalStatus = isHotfix && taskData.status !== 'done' ? 'hotfix' : (taskData.status || 'current');

    const newTask = {
      id: generateId('task'),
      projectId: taskData.projectId,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || '',
      status: finalStatus,
      priority: taskData.priority || 'medium',
      tags: taskData.tags || ['feature'],
      dueDate: cleanDeadline,
      deadline: cleanDeadline,
      taskPrompt: taskData.taskPrompt?.trim() || '',
      completionNote: taskData.completionNote?.trim() || '',
      isHotfix,
      subtasks: taskData.subtasks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));

    // Record creation in undo history
    undoStackRef.current.push({
      type: 'CREATE_TASK',
      task: newTask,
      id: newTask.id,
      title: newTask.title,
    });
    redoStackRef.current = [];

    if (newTask.status === 'done') {
      triggerConfetti();
    }

    return newTask;
  }, [triggerConfetti]);

  const updateTask = useCallback((id, updates) => {
    setData((prev) => {
      const oldTask = prev.tasks.find((t) => t.id === id);
      const isNewlyDone = updates.status === 'done' && oldTask?.status !== 'done';
      
      if (isNewlyDone) {
        triggerConfetti();
      }

      let finalUpdates = { ...updates };
      // Every task tagged with hotfix must move to hotfix list
      if (updates.isHotfix === true && updates.status !== 'done' && oldTask?.status !== 'done') {
        finalUpdates.status = 'hotfix';
        if (!finalUpdates.tags?.includes('hotfix')) {
          finalUpdates.tags = [...(oldTask?.tags || []), 'hotfix'];
        }
      } else if (updates.status === 'hotfix') {
        finalUpdates.isHotfix = true;
        if (!finalUpdates.tags?.includes('hotfix')) {
          finalUpdates.tags = [...(oldTask?.tags || []), 'hotfix'];
        }
      } else if (updates.status && updates.status !== 'hotfix' && updates.status !== 'done' && updates.isHotfix === undefined) {
        finalUpdates.isHotfix = false;
        finalUpdates.tags = (oldTask?.tags || []).filter((t) => t.toLowerCase() !== 'hotfix');
      } else if (updates.isHotfix === false) {
        if (finalUpdates.status === 'hotfix') {
          finalUpdates.status = 'current';
        }
        finalUpdates.tags = (oldTask?.tags || []).filter((t) => t.toLowerCase() !== 'hotfix');
      }

      return {
        ...prev,
        tasks: prev.tasks.map((task) =>
          task.id === id ? { ...task, ...finalUpdates, updatedAt: new Date().toISOString() } : task
        ),
      };
    });
  }, [triggerConfetti]);

  const updateTaskStatus = useCallback((id, newStatus) => {
    setData((prev) => {
      const task = prev.tasks.find((t) => t.id === id);
      if (!task) return prev;

      let isHotfix = task.isHotfix;
      let tags = Array.isArray(task.tags) ? [...task.tags] : [];

      if (newStatus === 'hotfix') {
        isHotfix = true;
        if (!tags.includes('hotfix')) tags.push('hotfix');
      } else if (newStatus !== 'done') {
        isHotfix = false;
        tags = tags.filter((t) => t.toLowerCase() !== 'hotfix');
      }

      if (task.status !== newStatus) {
        undoStackRef.current.push({
          type: 'MOVE_TASK',
          taskId: id,
          title: task.title,
          fromStatus: task.status || 'current',
          toStatus: newStatus,
          fromIsHotfix: Boolean(task.isHotfix),
          toIsHotfix: isHotfix,
          fromTags: task.tags || [],
          toTags: tags,
        });
        redoStackRef.current = [];
      }

      const isNewlyDone = newStatus === 'done' && task.status !== 'done';
      if (isNewlyDone) {
        triggerConfetti();
      }

      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id
            ? { ...t, status: newStatus, isHotfix, tags, updatedAt: new Date().toISOString() }
            : t
        ),
      };
    });
  }, [triggerConfetti]);

  const reorderTasks = useCallback((draggedId, targetId, targetStatus, position = 'before') => {
    if (!draggedId) return;

    setData((prev) => {
      const taskIndex = prev.tasks.findIndex((t) => t.id === draggedId);
      if (taskIndex === -1) return prev;

      const draggedTask = { ...prev.tasks[taskIndex] };
      if (targetStatus && targetStatus !== draggedTask.status) {
        if (targetStatus === 'done' && draggedTask.status !== 'done') {
          triggerConfetti();
        }
        const prevStatus = draggedTask.status || 'current';
        const prevIsHotfix = Boolean(draggedTask.isHotfix);
        const prevTags = draggedTask.tags || [];

        draggedTask.status = targetStatus;
        if (targetStatus === 'hotfix') {
          draggedTask.isHotfix = true;
          if (!draggedTask.tags?.includes('hotfix')) {
            draggedTask.tags = [...(draggedTask.tags || []), 'hotfix'];
          }
        } else if (targetStatus !== 'done') {
          draggedTask.isHotfix = false;
          draggedTask.tags = (draggedTask.tags || []).filter((t) => t.toLowerCase() !== 'hotfix');
        }
        draggedTask.updatedAt = new Date().toISOString();

        undoStackRef.current.push({
          type: 'MOVE_TASK',
          taskId: draggedId,
          title: draggedTask.title,
          fromStatus: prevStatus,
          toStatus: targetStatus,
          fromIsHotfix: prevIsHotfix,
          toIsHotfix: draggedTask.isHotfix,
          fromTags: prevTags,
          toTags: draggedTask.tags || [],
        });
        redoStackRef.current = [];
      }

      const remainingTasks = prev.tasks.filter((t) => t.id !== draggedId);

      if (!targetId || targetId === draggedId) {
        return {
          ...prev,
          tasks: [...remainingTasks, draggedTask],
        };
      }

      const targetIndex = remainingTasks.findIndex((t) => t.id === targetId);
      if (targetIndex === -1) {
        return {
          ...prev,
          tasks: [...remainingTasks, draggedTask],
        };
      }

      const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
      const newTasks = [...remainingTasks];
      newTasks.splice(insertIndex, 0, draggedTask);

      return {
        ...prev,
        tasks: newTasks,
      };
    });
  }, [triggerConfetti]);

  // Soft-delete task into Recycle Bin (recoverable for 30 days)
  const deleteTask = useCallback((id) => {
    setData((prev) => {
      const taskToDelete = prev.tasks.find((t) => t.id === id);
      if (!taskToDelete) return prev;
      const deletedTask = {
        ...taskToDelete,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      deletionStackRef.current.push({
        type: 'task',
        id: taskToDelete.id,
        title: taskToDelete.title,
      });

      return {
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
        deletedTasks: [deletedTask, ...(prev.deletedTasks || [])],
      };
    });
  }, []);

  // Soft-delete multiple tasks at once into Recycle Bin
  const deleteMultipleTasks = useCallback((ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const idSet = new Set(ids);
    setData((prev) => {
      const deletedBatch = prev.tasks
        .filter((t) => idSet.has(t.id))
        .map((t) => ({
          ...t,
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

      deletionStackRef.current.push({
        type: 'tasks',
        ids: [...ids],
        count: ids.length,
      });

      return {
        ...prev,
        tasks: prev.tasks.filter((t) => !idSet.has(t.id)),
        deletedTasks: [...deletedBatch, ...(prev.deletedTasks || [])],
      };
    });
  }, []);

  // Restore soft-deleted task from Recycle Bin back into its project
  const restoreTask = useCallback((id) => {
    setData((prev) => {
      const taskToRestore = (prev.deletedTasks || []).find((t) => t.id === id);
      if (!taskToRestore) return prev;
      const { deletedAt: _deletedAt, ...restored } = taskToRestore;
      return {
        ...prev,
        deletedTasks: (prev.deletedTasks || []).filter((t) => t.id !== id),
        tasks: [{ ...restored, updatedAt: new Date().toISOString() }, ...prev.tasks],
      };
    });
  }, []);

  // Restore multiple soft-deleted tasks from Recycle Bin
  const restoreMultipleTasks = useCallback((ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const idSet = new Set(ids);
    setData((prev) => {
      const toRestore = (prev.deletedTasks || [])
        .filter((t) => idSet.has(t.id))
        .map(({ deletedAt: _d, ...rest }) => ({
          ...rest,
          updatedAt: new Date().toISOString(),
        }));
      return {
        ...prev,
        deletedTasks: (prev.deletedTasks || []).filter((t) => !idSet.has(t.id)),
        tasks: [...toRestore, ...prev.tasks],
      };
    });
  }, []);

  // Global Undo Engine (Cmd+Z shortcut: moves task back, undos creation, restores delete, etc.)
  const undo = useCallback(() => {
    if (!undoStackRef.current || undoStackRef.current.length === 0) {
      return { success: false, message: 'Nothing to undo' };
    }

    const action = undoStackRef.current.pop();
    if (!action) {
      return { success: false, message: 'Nothing to undo' };
    }

    switch (action.type) {
      case 'MOVE_TASK': {
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === action.taskId
              ? {
                  ...t,
                  status: action.fromStatus,
                  isHotfix: action.fromIsHotfix,
                  tags: action.fromTags,
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
        redoStackRef.current.push(action);
        return { success: true, message: `Moved "${action.title || 'Task'}" back to ${action.fromStatus}` };
      }

      case 'CREATE_TASK': {
        setData((prev) => {
          const t = prev.tasks.find((task) => task.id === action.task.id) || action.task;
          const softDeleted = {
            ...t,
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return {
            ...prev,
            tasks: prev.tasks.filter((task) => task.id !== action.task.id),
            deletedTasks: [softDeleted, ...(prev.deletedTasks || [])],
          };
        });
        redoStackRef.current.push(action);
        return { success: true, message: `Undid creation of "${action.task.title || 'Task'}"` };
      }

      case 'DELETE_TASK':
      case 'task': {
        const targetId = action.id || action.task?.id;
        restoreTask(targetId);
        redoStackRef.current.push(action);
        return { success: true, message: `Restored task "${action.title || action.task?.title || 'Task'}"` };
      }

      case 'DELETE_TASKS':
      case 'tasks': {
        const targetIds = action.ids || action.tasks?.map((t) => t.id) || [];
        restoreMultipleTasks(targetIds);
        redoStackRef.current.push(action);
        return { success: true, message: `Restored ${action.count || targetIds.length} tasks` };
      }

      case 'DELETE_PROJECT':
      case 'project': {
        const name = restoreProject(action.id);
        redoStackRef.current.push(action);
        return { success: true, message: `Restored project "${name || action.name || 'Project'}"` };
      }

      case 'UPDATE_TASK': {
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === action.taskId ? { ...action.prevTask, updatedAt: new Date().toISOString() } : t)),
        }));
        redoStackRef.current.push(action);
        return { success: true, message: `Reverted changes to "${action.title || 'Task'}"` };
      }

      default:
        return { success: false, message: 'Nothing to undo' };
    }
  }, [restoreTask, restoreMultipleTasks, restoreProject]);

  // Global Redo Engine (Cmd+Y shortcut: re-moves task forward, re-creates, re-deletes, etc.)
  const redo = useCallback(() => {
    if (!redoStackRef.current || redoStackRef.current.length === 0) {
      return { success: false, message: 'Nothing to redo' };
    }

    const action = redoStackRef.current.pop();
    if (!action) {
      return { success: false, message: 'Nothing to redo' };
    }

    switch (action.type) {
      case 'MOVE_TASK': {
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === action.taskId
              ? {
                  ...t,
                  status: action.toStatus,
                  isHotfix: action.toIsHotfix,
                  tags: action.toTags,
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }));
        undoStackRef.current.push(action);
        return { success: true, message: `Moved "${action.title || 'Task'}" to ${action.toStatus}` };
      }

      case 'CREATE_TASK': {
        setData((prev) => {
          const { deletedAt: _d, ...restored } = action.task;
          return {
            ...prev,
            deletedTasks: (prev.deletedTasks || []).filter((t) => t.id !== action.task.id),
            tasks: [{ ...restored, updatedAt: new Date().toISOString() }, ...prev.tasks],
          };
        });
        undoStackRef.current.push(action);
        return { success: true, message: `Re-created task "${action.task.title || 'Task'}"` };
      }

      case 'DELETE_TASK':
      case 'task': {
        const targetId = action.id || action.task?.id;
        deleteTask(targetId);
        return { success: true, message: `Deleted task "${action.title || action.task?.title || 'Task'}"` };
      }

      case 'DELETE_TASKS':
      case 'tasks': {
        const targetIds = action.ids || action.tasks?.map((t) => t.id) || [];
        deleteMultipleTasks(targetIds);
        return { success: true, message: `Deleted ${action.count || targetIds.length} tasks` };
      }

      case 'DELETE_PROJECT':
      case 'project': {
        deleteProject(action.id);
        return { success: true, message: `Deleted project "${action.name || 'Project'}"` };
      }

      case 'UPDATE_TASK': {
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === action.taskId ? { ...action.nextTask, updatedAt: new Date().toISOString() } : t)),
        }));
        undoStackRef.current.push(action);
        return { success: true, message: `Re-applied updates to "${action.title || 'Task'}"` };
      }

      default:
        return { success: false, message: 'Nothing to redo' };
    }
  }, [deleteTask, deleteMultipleTasks, deleteProject]);

  const undoLastDelete = undo;

  // Permanently delete a task from Recycle Bin
  const permanentlyDeleteTask = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      deletedTasks: (prev.deletedTasks || []).filter((t) => t.id !== id),
    }));
  }, []);

  // Permanently delete all tasks & projects in Recycle Bin
  const emptyRecycleBin = useCallback(() => {
    setData((prev) => ({
      ...prev,
      deletedTasks: [],
      deletedProjects: [],
    }));
  }, []);

  // Purge any soft-deleted tasks older than 30 days
  const purgeExpiredTasks = useCallback(() => {
    setData((prev) => {
      const { data: updatedData } = purgeExpiredDeletedTasks(prev);
      return updatedData;
    });
  }, []);

  const getTask = useCallback((id) => {
    return data.tasks.find((t) => t.id === id) || (data.deletedTasks || []).find((t) => t.id === id) || null;
  }, [data.tasks, data.deletedTasks]);

  const getProjectTasks = useCallback((projectId, includeSubprojects = false) => {
    if (!includeSubprojects) {
      return data.tasks.filter((t) => t.projectId === projectId);
    }
    const getProjectAndDescendantIds = (rootId) => {
      const children = data.projects.filter((p) => p.parentId === rootId);
      return [rootId, ...children.flatMap((c) => getProjectAndDescendantIds(c.id))];
    };
    const validIds = new Set(getProjectAndDescendantIds(projectId));
    return data.tasks.filter((t) => validIds.has(t.projectId));
  }, [data.tasks, data.projects]);

  const addSubtask = useCallback((taskId, text) => {
    if (!text.trim()) return;
    const newSubtask = {
      id: generateId('sub'),
      text: text.trim(),
      completed: false,
    };
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: [...(task.subtasks || []), newSubtask], updatedAt: new Date().toISOString() }
          : task
      ),
    }));
  }, []);

  const toggleSubtask = useCallback((taskId, subtaskId) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => {
        if (task.id !== taskId) return task;
        const subtasks = (task.subtasks || []).map((sub) =>
          sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        );
        return { ...task, subtasks, updatedAt: new Date().toISOString() };
      }),
    }));
  }, []);

  const updateSubtask = useCallback((taskId, subtaskId, newText) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => {
        if (task.id !== taskId) return task;
        const subtasks = (task.subtasks || []).map((sub) =>
          sub.id === subtaskId ? { ...sub, text: newText } : sub
        );
        return { ...task, subtasks, updatedAt: new Date().toISOString() };
      }),
    }));
  }, []);

  const removeSubtask = useCallback((taskId, subtaskId) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => {
        if (task.id !== taskId) return task;
        const subtasks = (task.subtasks || []).map((sub) => sub.id !== subtaskId ? sub : null).filter(Boolean);
        return { ...task, subtasks, updatedAt: new Date().toISOString() };
      }),
    }));
  }, []);

  // Import batch tasks (from markdown or bulk create)
  const importTasks = useCallback((newTasks) => {
    setData((prev) => ({
      ...prev,
      tasks: [...newTasks, ...prev.tasks],
    }));
  }, []);

  // =========================================================================
  // Project Notes & Docs Management
  // =========================================================================

  const getProjectNotes = useCallback((projectId) => {
    return data.notes.filter((n) => n.projectId === projectId);
  }, [data.notes]);

  const saveProjectNote = useCallback((projectId, title, content) => {
    setData((prev) => {
      const existing = prev.notes.find((n) => n.projectId === projectId);
      if (existing) {
        return {
          ...prev,
          notes: prev.notes.map((n) =>
            n.id === existing.id
              ? { ...n, title: title.trim(), content, updatedAt: new Date().toISOString() }
              : n
          ),
        };
      } else {
        const newNote = {
          id: generateId('note'),
          projectId,
          title: title.trim() || 'Project Notes',
          content,
          updatedAt: new Date().toISOString(),
        };
        return { ...prev, notes: [newNote, ...prev.notes] };
      }
    });
  }, []);

  // =========================================================================
  // Project Checklists: To Dos & Testing
  // =========================================================================

  const getProjectTodos = useCallback((projectId) => {
    const proj = data.projects.find((p) => p.id === projectId);
    return proj?.todos || [];
  }, [data.projects]);

  const addProjectTodo = useCallback((projectId, text) => {
    const newTodo = {
      id: generateId('todo'),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          todos: [...(p.todos || []), newTodo],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    return newTodo;
  }, []);

  const toggleProjectTodo = useCallback((projectId, todoId) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const todos = (p.todos || []).map((t) =>
          t.id === todoId ? { ...t, completed: !t.completed } : t
        );
        return { ...p, todos, updatedAt: new Date().toISOString() };
      }),
    }));
  }, []);

  const updateProjectTodo = useCallback((projectId, todoId, newText) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const todos = (p.todos || []).map((t) =>
          t.id === todoId ? { ...t, text: newText } : t
        );
        return { ...p, todos, updatedAt: new Date().toISOString() };
      }),
    }));
  }, []);

  const deleteProjectTodo = useCallback((projectId, todoId) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const todos = (p.todos || []).filter((t) => t.id !== todoId);
        return { ...p, todos, updatedAt: new Date().toISOString() };
      }),
    }));
  }, []);

  const getProjectTesting = useCallback((projectId) => {
    const proj = data.projects.find((p) => p.id === projectId);
    return proj?.testing || [];
  }, [data.projects]);

  const addProjectTesting = useCallback((projectId, text) => {
    const newTest = {
      id: generateId('test'),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          testing: [...(p.testing || []), newTest],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    return newTest;
  }, []);

  const toggleProjectTesting = useCallback((projectId, testId) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const testing = (p.testing || []).map((t) =>
          t.id === testId ? { ...t, completed: !t.completed } : t
        );
        return { ...p, testing, updatedAt: new Date().toISOString() };
      }),
    }));
  }, []);

  const updateProjectTesting = useCallback((projectId, testId, newText) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const testing = (p.testing || []).map((t) =>
          t.id === testId ? { ...t, text: newText } : t
        );
        return { ...p, testing, updatedAt: new Date().toISOString() };
      }),
    }));
  }, []);

  const deleteProjectTesting = useCallback((projectId, testId) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const testing = (p.testing || []).filter((t) => t.id !== testId);
        return { ...p, testing, updatedAt: new Date().toISOString() };
      }),
    }));
  }, []);

  // =========================================================================
  // Workspace Backup & Recovery
  // =========================================================================

  const restoreWorkspaceData = useCallback((importedData) => {
    try {
      if (!importedData || typeof importedData !== 'object') {
        return { success: false, error: 'Invalid backup format' };
      }

      const hasProjects = Array.isArray(importedData) || Array.isArray(importedData.projects);
      const hasTasks = Array.isArray(importedData.tasks);
      const hasNotes = Array.isArray(importedData.notes);

      if (!hasProjects && !hasTasks && !hasNotes) {
        return { success: false, error: 'No projects or tasks found in backup file' };
      }

      const clean = sanitizeWorkspaceData(importedData);
      setData(clean);

      // If activeProjectId is not in restored projects, reset it
      setActiveProjectId((prevActive) => {
        if (prevActive && clean.projects.some((p) => p.id === prevActive)) {
          return prevActive;
        }
        return clean.projects[0]?.id || null;
      });

      const rootProjects = clean.projects.filter((p) => !p.parentId).length;
      const subProjects = clean.projects.filter((p) => Boolean(p.parentId)).length;
      const totalTodos = clean.projects.reduce((acc, p) => acc + (p.todos?.length || 0), 0);
      const totalTesting = clean.projects.reduce((acc, p) => acc + (p.testing?.length || 0), 0);

      return {
        success: true,
        count: {
          projects: clean.projects.length,
          rootProjects,
          subProjects,
          tasks: clean.tasks.length,
          notes: clean.notes.length,
          todos: totalTodos,
          testing: totalTesting,
        },
      };
    } catch (err) {
      console.error('Failed to restore workspace data:', err);
      return { success: false, error: err.message || 'Restoration failed' };
    }
  }, []);

  const resetWorkspace = useCallback(() => {
    const defaultData = resetWorkspaceData();
    setData(defaultData);
    setActiveProjectId(null);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        projects: data.projects,
        tasks: data.tasks,
        notes: data.notes,
        deletedTasks: data.deletedTasks || [],
        deletedProjects: data.deletedProjects || [],
        activeProjectId,
        setActiveProjectId,
        isSearchOpen,
        setIsSearchOpen,
        searchKeyword,
        setSearchKeyword,
        // Project methods
        createProject,
        updateProject,
        deleteProject,
        restoreProject,
        permanentlyDeleteProject,
        getProject,
        getSubProjects,
        getRootProjects,
        getProjectBreadcrumbs,
        // Task methods
        createTask,
        updateTask,
        updateTaskStatus,
        reorderTasks,
        deleteTask,
        deleteMultipleTasks,
        restoreTask,
        restoreMultipleTasks,
        permanentlyDeleteTask,
        undo,
        redo,
        undoLastDelete,
        emptyRecycleBin,
        purgeExpiredTasks,
        getTask,
        getProjectTasks,
        addSubtask,
        toggleSubtask,
        updateSubtask,
        removeSubtask,
        importTasks,
        // Checklists methods
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
        // Notes methods
        getProjectNotes,
        saveProjectNote,
        // Workspace tools
        restoreWorkspaceData,
        resetWorkspace,
        triggerConfetti,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
