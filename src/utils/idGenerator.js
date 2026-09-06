/**
 * Generates unique IDs for projects, tasks, notes, etc.
 */
export const generateId = (prefix = 'id') => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `${prefix}_${timestamp}_${randomStr}`;
};
