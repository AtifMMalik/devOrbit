import { generateId } from './idGenerator.js';

const STORAGE_KEY = 'devorbit_workspace_v1';

export const DEFAULT_WORKSPACE_DATA = {
  version: '1.0.0',
  projects: [],
  tasks: [],
  notes: [],
};

// Legacy sample IDs and dummy names to purge completely
const LEGACY_DEFAULT_PROJECT_IDS = new Set([
  'proj_devorbit',
  'proj_devorbit_core',
  'proj_devorbit_storage',
  'proj_ecommerce',
  'proj_ecommerce_checkout',
  'proj_mobile_app',
]);

const LEGACY_DEFAULT_PROJECT_NAMES = new Set([
  'devorbit platform',
  'core ui & design system',
  'storage & sync engine',
  'e-commerce cloud architecture',
  'checkout & payment service',
  'pulse mobile client',
]);

const LEGACY_DEFAULT_TASK_IDS = new Set([
  'task_1',
  'task_2',
  'task_3',
  'task_4',
  'task_5',
  'task_6',
  'task_7',
  'task_8',
  'task_9',
  'task_10',
  'task_11',
  'task_12',
]);

const LEGACY_DEFAULT_TASK_TITLES = new Set([
  'build markdown task importer & exporter',
  'implement global search (cmd+k)',
  'add drag & drop kanban reordering',
  'confetti celebration on task completion',
  'dark / light theme state switcher',
  'create theme.css design token specifications',
  'responsive collapsible sidebar navigation',
  'full workspace json export & import',
  'indexeddb backend fallback for large attachments',
  'migrate product catalog to graphql mesh',
  'stripe 3d-secure 2.0 webhook verification',
  'push notification sound customized per alert severity',
]);

const LEGACY_DEFAULT_NOTE_IDS = new Set(['note_1', 'note_2']);

const LEGACY_DEFAULT_NOTE_TITLES = new Set([
  'devorbit architecture & tool roadmap',
  'deployment & ci/cd pipelines',
]);

const LEGACY_DEFAULT_CHECKLIST_TEXTS = new Set([
  'audit all api endpoints for rate limiting',
  'verify dark theme contrast ratios',
  'setup sentry error tracking',
  'test drag and drop between columns',
  'test markdown export with nested checklists',
  'verify pwa offline caching',
  'parse #tags and [status] labels from markdown',
  'generate formatted markdown string with categories',
  'add 1-click copy and file download',
  'add keyboard listener for cmd/ctrl + k',
  'highlight matching characters',
  'install canvas-confetti package',
  'trigger confetti on done toggle',
  'define dark & light palette',
  'define tag & status colors',
  'validate schema on file upload',
  'add migration fallback',
  'schema definition and resolver stubs',
  'redis caching layer integration',
  'write end-to-end integration tests',
]);

/**
 * Recursively flattens nested project hierarchies if projects contain subProjects or children.
 */
function flattenProjects(rawProjects, parentId = null) {
  let result = [];
  if (!Array.isArray(rawProjects)) return result;

  for (const proj of rawProjects) {
    if (!proj || typeof proj !== 'object') continue;

    const actualParentId = proj.parentId !== undefined ? (proj.parentId || null) : parentId;
    const { subProjects, children, ...restOfProject } = proj;

    const currentProject = {
      ...restOfProject,
      parentId: actualParentId,
    };
    result.push(currentProject);

    const childList = Array.isArray(subProjects)
      ? subProjects
      : Array.isArray(children)
      ? children
      : [];

    if (childList.length > 0 && currentProject.id) {
      result = result.concat(flattenProjects(childList, currentProject.id));
    }
  }
  return result;
}

/**
 * Normalizes task status to 'current' | 'later' | 'done'.
 */
function normalizeStatus(rawStatus) {
  if (!rawStatus) return 'current';
  const s = String(rawStatus).toLowerCase().trim();
  if (s === 'done' || s === 'completed' || s === 'finished') return 'done';
  if (s === 'later' || s === 'backlog' || s === 'planned' || s === 'queue' || s === 'todo') return 'later';
  return 'current';
}

/**
 * Normalizes task priority to 'urgent' | 'high' | 'medium' | 'low'.
 */
function normalizePriority(rawPriority) {
  if (!rawPriority) return 'medium';
  const p = String(rawPriority).toLowerCase().trim();
  if (['urgent', 'high', 'medium', 'low'].includes(p)) return p;
  return 'medium';
}

/**
 * Sanitizes workspace data, purges sample/dummy items, ensures all sub-projects,
 * tasks (all statuses), checklists (todos & testing), and notes are strictly structured.
 */
export const sanitizeWorkspaceData = (rawData) => {
  if (!rawData || typeof rawData !== 'object') {
    return { ...DEFAULT_WORKSPACE_DATA };
  }

  // Handle direct array or wrapped data object
  const rawProjects = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData.projects)
    ? rawData.projects
    : [];

  const rawTasks = Array.isArray(rawData.tasks) ? rawData.tasks : [];
  const rawNotes = Array.isArray(rawData.notes) ? rawData.notes : [];

  // Flatten nested project hierarchies if any
  const flattenedProjects = flattenProjects(rawProjects);

  // 1. Sanitize projects
  const cleanProjects = [];
  const idMap = new Map(); // In case missing IDs are assigned

  for (const p of flattenedProjects) {
    if (!p || typeof p !== 'object') continue;

    const pId = p.id ? String(p.id).trim() : '';
    const pName = p.name ? String(p.name).trim() : '';
    const pNameLower = pName.toLowerCase();

    // Check if this project is a legacy sample/dummy project
    if (
      LEGACY_DEFAULT_PROJECT_IDS.has(pId) ||
      LEGACY_DEFAULT_PROJECT_NAMES.has(pNameLower) ||
      pId.startsWith('sample_') ||
      pId.startsWith('dummy_') ||
      pId.includes('_sample')
    ) {
      continue;
    }

    const assignedId = pId || generateId('proj');
    if (pId && pId !== assignedId) {
      idMap.set(pId, assignedId);
    }

    // Sanitize todos checklist
    const rawTodos = Array.isArray(p.todos) ? p.todos : [];
    const cleanTodos = rawTodos
      .filter((todo) => {
        if (!todo || typeof todo !== 'object') return false;
        const text = String(todo.text || '').trim();
        const textLower = text.toLowerCase();
        const todoId = String(todo.id || '');
        if (!text) return false;
        if (LEGACY_DEFAULT_CHECKLIST_TEXTS.has(textLower) || todoId.startsWith('todo_sample')) {
          return false;
        }
        return true;
      })
      .map((todo) => ({
        id: todo.id ? String(todo.id) : generateId('todo'),
        text: String(todo.text).trim(),
        completed: Boolean(todo.completed),
        createdAt: todo.createdAt || new Date().toISOString(),
      }));

    // Sanitize testing checklist
    const rawTesting = Array.isArray(p.testing) ? p.testing : [];
    const cleanTesting = rawTesting
      .filter((test) => {
        if (!test || typeof test !== 'object') return false;
        const text = String(test.text || '').trim();
        const textLower = text.toLowerCase();
        const testId = String(test.id || '');
        if (!text) return false;
        if (LEGACY_DEFAULT_CHECKLIST_TEXTS.has(textLower) || testId.startsWith('test_sample')) {
          return false;
        }
        return true;
      })
      .map((test) => ({
        id: test.id ? String(test.id) : generateId('test'),
        text: String(test.text).trim(),
        completed: Boolean(test.completed),
        createdAt: test.createdAt || new Date().toISOString(),
      }));

    // Sanitize tags
    const cleanTags = Array.isArray(p.tags)
      ? p.tags
          .map((t) => String(t).replace('#', '').trim().toLowerCase())
          .filter(Boolean)
      : [];

    cleanProjects.push({
      id: assignedId,
      parentId: p.parentId ? String(p.parentId).trim() : null,
      name: pName || 'Untitled Project',
      description: p.description ? String(p.description).trim() : '',
      color: p.color || '#6366f1',
      logo: typeof p.logo === 'string' && p.logo.trim() ? p.logo.trim() : null,
      icon: p.icon || 'Folder',
      tags: cleanTags,
      todos: cleanTodos,
      testing: cleanTesting,
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString(),
    });
  }

  // Build valid project ID set
  const validProjectIds = new Set(cleanProjects.map((p) => p.id));

  // Fix any parentId that points to an invalid/non-existent or purged project ID
  for (const p of cleanProjects) {
    if (p.parentId && !validProjectIds.has(p.parentId)) {
      // Check if it mapped to an updated ID
      if (idMap.has(p.parentId) && validProjectIds.has(idMap.get(p.parentId))) {
        p.parentId = idMap.get(p.parentId);
      } else {
        p.parentId = null; // Revert to root project if parent no longer exists
      }
    }
  }

  // 2. Sanitize tasks
  const cleanTasks = [];
  for (const t of rawTasks) {
    if (!t || typeof t !== 'object') continue;

    let targetProjectId = t.projectId ? String(t.projectId).trim() : '';
    if (idMap.has(targetProjectId)) {
      targetProjectId = idMap.get(targetProjectId);
    }

    // Task must belong to an existing valid project
    if (!validProjectIds.has(targetProjectId)) continue;

    const tId = t.id ? String(t.id).trim() : '';
    const tTitle = t.title ? String(t.title).trim() : '';
    const tTitleLower = tTitle.toLowerCase();

    // Check if task is dummy/sample
    if (
      LEGACY_DEFAULT_TASK_IDS.has(tId) ||
      LEGACY_DEFAULT_TASK_TITLES.has(tTitleLower) ||
      tId.startsWith('sample_') ||
      tId.startsWith('dummy_')
    ) {
      continue;
    }

    // Sanitize subtasks
    const rawSubtasks = Array.isArray(t.subtasks) ? t.subtasks : [];
    const cleanSubtasks = rawSubtasks
      .filter((sub) => {
        if (!sub || typeof sub !== 'object') return false;
        const text = String(sub.text || '').trim();
        const textLower = text.toLowerCase();
        if (!text) return false;
        if (LEGACY_DEFAULT_CHECKLIST_TEXTS.has(textLower)) return false;
        return true;
      })
      .map((sub) => ({
        id: sub.id ? String(sub.id) : generateId('sub'),
        text: String(sub.text).trim(),
        completed: Boolean(sub.completed),
      }));

    // Sanitize tags
    const cleanTags = Array.isArray(t.tags)
      ? t.tags
          .map((tag) => String(tag).replace('#', '').trim().toLowerCase())
          .filter(Boolean)
      : ['feature'];

    cleanTasks.push({
      id: tId || generateId('task'),
      projectId: targetProjectId,
      title: tTitle || 'Untitled Task',
      description: t.description ? String(t.description).trim() : '',
      status: normalizeStatus(t.status),
      priority: normalizePriority(t.priority),
      tags: cleanTags.length > 0 ? cleanTags : ['feature'],
      dueDate: t.dueDate ? String(t.dueDate).trim() : '',
      subtasks: cleanSubtasks,
      createdAt: t.createdAt || new Date().toISOString(),
      updatedAt: t.updatedAt || new Date().toISOString(),
    });
  }

  // 3. Sanitize notes
  const cleanNotes = [];
  for (const n of rawNotes) {
    if (!n || typeof n !== 'object') continue;

    let targetProjectId = n.projectId ? String(n.projectId).trim() : '';
    if (idMap.has(targetProjectId)) {
      targetProjectId = idMap.get(targetProjectId);
    }

    if (!validProjectIds.has(targetProjectId)) continue;

    const nId = n.id ? String(n.id).trim() : '';
    const nTitle = n.title ? String(n.title).trim() : '';
    const nTitleLower = nTitle.toLowerCase();

    if (
      LEGACY_DEFAULT_NOTE_IDS.has(nId) ||
      LEGACY_DEFAULT_NOTE_TITLES.has(nTitleLower) ||
      nId.startsWith('sample_') ||
      nId.startsWith('dummy_')
    ) {
      continue;
    }

    cleanNotes.push({
      id: nId || generateId('note'),
      projectId: targetProjectId,
      title: nTitle || 'Project Notes',
      content: n.content ? String(n.content) : '',
      updatedAt: n.updatedAt || new Date().toISOString(),
    });
  }

  return {
    version: rawData.version || '1.0.0',
    projects: cleanProjects,
    tasks: cleanTasks,
    notes: cleanNotes,
  };
};

/**
 * Loads workspace data from localStorage and returns sanitized data.
 */
export const loadWorkspaceData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveWorkspaceData(DEFAULT_WORKSPACE_DATA);
      return DEFAULT_WORKSPACE_DATA;
    }
    const parsed = JSON.parse(raw);
    const cleanData = sanitizeWorkspaceData(parsed);

    // Save cleaned data back to ensure localStorage is purged of legacy dummy data
    saveWorkspaceData(cleanData);
    return cleanData;
  } catch (error) {
    console.error('Failed to load devOrbit workspace from localStorage:', error);
    return DEFAULT_WORKSPACE_DATA;
  }
};

/**
 * Saves sanitized workspace data to localStorage.
 */
export const saveWorkspaceData = (data) => {
  try {
    const cleanData = sanitizeWorkspaceData(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
    return true;
  } catch (error) {
    console.error('Failed to save devOrbit workspace to localStorage:', error);
    return false;
  }
};

/**
 * Exports data as a complete, sanitized JSON backup file download.
 * Uses modern Blob URL for reliable large-file downloads without URI limits.
 */
export const exportWorkspaceJSON = (data) => {
  const cleanData = sanitizeWorkspaceData(data);

  const rootProjectsCount = cleanData.projects.filter((p) => !p.parentId).length;
  const subProjectsCount = cleanData.projects.filter((p) => Boolean(p.parentId)).length;
  const currentTasksCount = cleanData.tasks.filter((t) => t.status === 'current').length;
  const laterTasksCount = cleanData.tasks.filter((t) => t.status === 'later').length;
  const doneTasksCount = cleanData.tasks.filter((t) => t.status === 'done').length;
  const totalTodosCount = cleanData.projects.reduce((acc, p) => acc + (p.todos?.length || 0), 0);
  const totalTestingCount = cleanData.projects.reduce((acc, p) => acc + (p.testing?.length || 0), 0);

  const payload = {
    version: cleanData.version || '1.0.0',
    exportedAt: new Date().toISOString(),
    app: 'devOrbit',
    stats: {
      projectsCount: cleanData.projects.length,
      rootProjectsCount,
      subProjectsCount,
      tasksCount: cleanData.tasks.length,
      currentTasksCount,
      laterTasksCount,
      doneTasksCount,
      todosCount: totalTodosCount,
      testingCount: totalTestingCount,
      notesCount: cleanData.notes.length,
    },
    projects: cleanData.projects,
    tasks: cleanData.tasks,
    notes: cleanData.notes,
  };

  const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const blobUrl = URL.createObjectURL(jsonBlob);
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.href = blobUrl;
  downloadAnchor.download = `devorbit_backup_${dateStr}.json`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(blobUrl);

  return payload.stats;
};

/**
 * Resets workspace to clean empty data.
 */
export const resetWorkspaceData = () => {
  saveWorkspaceData(DEFAULT_WORKSPACE_DATA);
  return DEFAULT_WORKSPACE_DATA;
};
