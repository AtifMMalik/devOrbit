import { INITIAL_SAMPLE_DATA } from './sampleData';

const STORAGE_KEY = 'devorbit_workspace_v1';

/**
 * Loads workspace data from localStorage or falls back to sample data.
 */
export const loadWorkspaceData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveWorkspaceData(INITIAL_SAMPLE_DATA);
      return INITIAL_SAMPLE_DATA;
    }
    const parsed = JSON.parse(raw);
    // Ensure all expected arrays exist
    return {
      version: parsed.version || '1.0.0',
      projects: Array.isArray(parsed.projects) ? parsed.projects : INITIAL_SAMPLE_DATA.projects,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : INITIAL_SAMPLE_DATA.tasks,
      notes: Array.isArray(parsed.notes) ? parsed.notes : INITIAL_SAMPLE_DATA.notes,
    };
  } catch (error) {
    console.error('Failed to load devOrbit workspace from localStorage:', error);
    return INITIAL_SAMPLE_DATA;
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
 * Resets workspace to the initial rich developer demo data.
 */
export const resetToSampleData = () => {
  saveWorkspaceData(INITIAL_SAMPLE_DATA);
  return INITIAL_SAMPLE_DATA;
};
