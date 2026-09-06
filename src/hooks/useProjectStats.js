import { useMemo } from 'react';

/**
 * Calculates project task statistics (counts, completion percentage, priority breakdown, tag counts)
 */
export const useProjectStats = (tasks = []) => {
  return useMemo(() => {
    const total = tasks.length;
    let current = 0;
    let later = 0;
    let done = 0;

    const tagCounts = {};
    const priorityCounts = { urgent: 0, high: 0, medium: 0, low: 0 };

    let totalSubtasks = 0;
    let completedSubtasks = 0;

    tasks.forEach((task) => {
      const status = (task.status || 'current').toLowerCase();
      if (status === 'current') current++;
      else if (status === 'later') later++;
      else if (status === 'done') done++;
      else current++; // Default fallback to current

      // Priority
      const priority = (task.priority || 'medium').toLowerCase();
      if (priorityCounts[priority] !== undefined) {
        priorityCounts[priority]++;
      }

      // Tags
      if (Array.isArray(task.tags)) {
        task.tags.forEach((tag) => {
          const t = tag.toLowerCase();
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      }

      // Subtasks
      if (Array.isArray(task.subtasks)) {
        totalSubtasks += task.subtasks.length;
        completedSubtasks += task.subtasks.filter((s) => s.completed).length;
      }
    });

    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    const subtaskCompletionRate =
      totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    return {
      total,
      current,
      later,
      done,
      completionRate,
      tagCounts,
      priorityCounts,
      totalSubtasks,
      completedSubtasks,
      subtaskCompletionRate,
    };
  }, [tasks]);
};
