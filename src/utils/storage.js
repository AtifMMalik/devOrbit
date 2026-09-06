const STORAGE_KEY = 'devorbit_workspace_v1';

export const DEFAULT_WORKSPACE_DATA = {
  version: '1.0.0',
  projects: [],
  tasks: [],
  notes: [],
};

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

/**
 * Loads workspace data from localStorage or falls back to empty workspace.
 */
export const loadWorkspaceData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveWorkspaceData(DEFAULT_WORKSPACE_DATA);
      return DEFAULT_WORKSPACE_DATA;
    }
    const parsed = JSON.parse(raw);

    const rawProjects = Array.isArray(parsed.projects) ? parsed.projects : [];
    // Remove any default sample projects
    const purgedProjects = rawProjects.filter(
      (p) => !LEGACY_DEFAULT_PROJECT_IDS.has(p.id) && !LEGACY_DEFAULT_PROJECT_NAMES.has((p.name || '').toLowerCase().trim())
    );

    const validProjectIds = new Set(purgedProjects.map((p) => p.id));

    const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const purgedTasks = rawTasks.filter(
      (t) => validProjectIds.has(t.projectId) && !LEGACY_DEFAULT_PROJECT_IDS.has(t.projectId)
    );

    const rawNotes = Array.isArray(parsed.notes) ? parsed.notes : [];
    const purgedNotes = rawNotes.filter(
      (n) => validProjectIds.has(n.projectId) && !LEGACY_DEFAULT_PROJECT_IDS.has(n.projectId)
    );

    const cleanData = {
      version: parsed.version || '1.0.0',
      projects: purgedProjects,
      tasks: purgedTasks,
      notes: purgedNotes,
    };

    saveWorkspaceData(cleanData);
    return cleanData;
  } catch (error) {
    console.error('Failed to load devOrbit workspace from localStorage:', error);
    return DEFAULT_WORKSPACE_DATA;
  }
};

/**
 * Saves workspace data to localStorage.
 */
export const saveWorkspaceData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save devOrbit workspace to localStorage:', error);
    return false;
  }
};

/**
 * Exports data as a JSON file download.
 */
export const exportWorkspaceJSON = (data) => {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `devorbit_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

/**
 * Resets workspace to clean empty data.
 */
export const resetWorkspaceData = () => {
  saveWorkspaceData(DEFAULT_WORKSPACE_DATA);
  return DEFAULT_WORKSPACE_DATA;
};
