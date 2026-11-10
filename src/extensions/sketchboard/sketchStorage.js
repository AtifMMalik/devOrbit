/**
 * Sketchboard Persistent Storage
 * Saves illustrations associated with tasks and projects
 */

const SKETCH_STORAGE_PREFIX = 'devorbit_extension_sketch_';

export function saveSketchIllustration(entityId, dataUrl) {
  if (!entityId || !dataUrl) return false;
  try {
    localStorage.setItem(`${SKETCH_STORAGE_PREFIX}${entityId}`, dataUrl);
    return true;
  } catch (err) {
    console.error('Failed to save sketch to local extension storage:', err);
    return false;
  }
}

export function getSketchIllustration(entityId) {
  if (!entityId) return null;
  return localStorage.getItem(`${SKETCH_STORAGE_PREFIX}${entityId}`) || null;
}

export function deleteSketchIllustration(entityId) {
  if (!entityId) return false;
  localStorage.removeItem(`${SKETCH_STORAGE_PREFIX}${entityId}`);
  return true;
}

