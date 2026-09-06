import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { loadWorkspaceData, saveWorkspaceData, resetWorkspaceData } from '../utils/storage';
import { generateId } from '../utils/idGenerator';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const [data, setData] = useState(() => loadWorkspaceData());
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
      color: projectData.color || '#0084ff',
      icon: projectData.icon || 'Folder',
      tags: projectData.tags || [],
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

  const deleteProject = useCallback((id) => {
    setData((prev) => {
      // Recursively find all child project IDs
      const getChildIds = (parentId) => {
        const children = prev.projects.filter((p) => p.parentId === parentId);
        return [parentId, ...children.flatMap((c) => getChildIds(c.id))];
      };

      const idsToDelete = new Set(getChildIds(id));

      return {
        ...prev,
        projects: prev.projects.filter((p) => !idsToDelete.has(p.id)),
        tasks: prev.tasks.filter((t) => !idsToDelete.has(t.projectId)),
        notes: prev.notes.filter((n) => !idsToDelete.has(n.projectId)),
      };
    });

    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  }, [activeProjectId]);

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
    const newTask = {
      id: generateId('task'),
      projectId: taskData.projectId,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || '',
      status: taskData.status || 'current',
      priority: taskData.priority || 'medium',
      tags: taskData.tags || ['feature'],
      dueDate: taskData.dueDate || '',
      subtasks: taskData.subtasks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));

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

      return {
        ...prev,
        tasks: prev.tasks.map((task) =>
          task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
        ),
      };
    });
  }, [triggerConfetti]);

  const updateTaskStatus = useCallback((id, newStatus) => {
    updateTask(id, { status: newStatus });
  }, [updateTask]);

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
        draggedTask.status = targetStatus;
        draggedTask.updatedAt = new Date().toISOString();
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

  const deleteTask = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  }, []);

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
    if (importedData && Array.isArray(importedData.projects) && Array.isArray(importedData.tasks)) {
      setData({
        version: importedData.version || '1.0.0',
        projects: importedData.projects,
        tasks: importedData.tasks,
        notes: Array.isArray(importedData.notes) ? importedData.notes : [],
      });
      return true;
    }
    return false;
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
        activeProjectId,
        setActiveProjectId,
        isSearchOpen,
        setIsSearchOpen,
        // Project methods
        createProject,
        updateProject,
        deleteProject,
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
