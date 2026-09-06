/**
 * Generates activity heatmap data (compatible with react-activity-calendar)
 * and calculates developer productivity metrics, streaks, and charts data.
 */

/**
 * Format a Date object to YYYY-MM-DD
 */
export const formatDateToISO = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generates daily activity frequency array for the past N days.
 * @param {Array} tasks - List of tasks
 * @param {Array} projects - List of projects (with todos and testing)
 * @param {Array} notes - List of notes
 * @param {string|null} filterProjectId - Optional project ID filter (or null for all)
 * @param {number} daysCount - Default 365 days
 */
export const generateActivityData = (
  tasks = [],
  projects = [],
  notes = [],
  filterProjectId = null,
  daysCount = 365
) => {
  // Collect all activity timestamps
  const activityMap = new Map();

  const addActivity = (timestamp) => {
    if (!timestamp) return;
    try {
      const dateStr = formatDateToISO(timestamp);
      activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
    } catch {
      // Ignore invalid date
    }
  };

  // Filter entities if filterProjectId is provided
  let filteredProjects = projects;
  let filteredTasks = tasks;
  let filteredNotes = notes;

  if (filterProjectId) {
    // Include the project and any of its subprojects
    const getDescendantIds = (rootId) => {
      const children = projects.filter((p) => p.parentId === rootId);
      return [rootId, ...children.flatMap((c) => getDescendantIds(c.id))];
    };
    const validIds = new Set(getDescendantIds(filterProjectId));

    filteredProjects = projects.filter((p) => validIds.has(p.id));
    filteredTasks = tasks.filter((t) => validIds.has(t.projectId));
    filteredNotes = notes.filter((n) => validIds.has(n.projectId));
  }

  // 1. Task activities (creation, update, completion)
  filteredTasks.forEach((t) => {
    addActivity(t.createdAt);
    if (t.updatedAt && t.updatedAt !== t.createdAt) {
      addActivity(t.updatedAt);
    }
    // Subtask timestamps
    if (Array.isArray(t.subtasks)) {
      t.subtasks.forEach((sub) => {
        if (sub.completed) {
          addActivity(t.updatedAt || t.createdAt);
        }
      });
    }
  });

  // 2. Checklist items (todos & testing)
  filteredProjects.forEach((p) => {
    if (Array.isArray(p.todos)) {
      p.todos.forEach((todo) => {
        addActivity(todo.createdAt || p.updatedAt);
      });
    }
    if (Array.isArray(p.testing)) {
      p.testing.forEach((test) => {
        addActivity(test.createdAt || p.updatedAt);
      });
    }
  });

  // 3. Project notes
  filteredNotes.forEach((n) => {
    addActivity(n.updatedAt);
  });

  // Build continuous array for the last `daysCount` days ending today
  const today = new Date();
  const calendarData = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDateToISO(d);
    const count = activityMap.get(dateStr) || 0;

    // Calculate level (0 to 4)
    let level = 0;
    if (count >= 7) level = 4;
    else if (count >= 4) level = 3;
    else if (count >= 2) level = 2;
    else if (count >= 1) level = 1;

    calendarData.push({
      date: dateStr,
      count,
      level,
    });
  }

  return calendarData;
};

/**
 * Calculates developer productivity stats, streaks, and activity metrics.
 */
export const calculateProductivityStats = (calendarData = []) => {
  let totalContributions = 0;
  let activeDays = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;

  // Compute total and longest streak
  for (let i = 0; i < calendarData.length; i++) {
    const { count } = calendarData[i];
    if (count > 0) {
      totalContributions += count;
      activeDays += 1;
      tempStreak += 1;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  // Compute current active streak counting backwards from today/yesterday
  for (let i = calendarData.length - 1; i >= 0; i--) {
    const { count } = calendarData[i];
    if (count > 0) {
      currentStreak += 1;
    } else {
      // If today has 0 count, allow yesterday's streak to still be active
      if (i === calendarData.length - 1) {
        continue;
      }
      break;
    }
  }

  // Developer Rank based on contributions
  let developerLevel = 'Orbit Apprentice';
  let developerRank = 1;
  let rankColor = '#38bdf8';

  if (totalContributions >= 50) {
    developerLevel = 'Cosmic Architect';
    developerRank = 5;
    rankColor = '#ec4899';
  } else if (totalContributions >= 25) {
    developerLevel = 'Galaxy Engineer';
    developerRank = 4;
    rankColor = '#8b5cf6';
  } else if (totalContributions >= 10) {
    developerLevel = 'Orbit Specialist';
    developerRank = 3;
    rankColor = '#10b981';
  } else if (totalContributions >= 3) {
    developerLevel = 'Code Navigator';
    developerRank = 2;
    rankColor = '#0084ff';
  }

  return {
    totalContributions,
    activeDays,
    currentStreak,
    longestStreak,
    developerLevel,
    developerRank,
    rankColor,
  };
};

/**
 * Computes status flow, priority distribution, and checklist readiness.
 */
export const calculateProjectAnalytics = (project, allTasks = [], subProjects = []) => {
  const getDescendantIds = (rootId) => {
    const children = subProjects.filter((p) => p.parentId === rootId);
    return [rootId, ...children.flatMap((c) => getDescendantIds(c.id))];
  };

  const projectIds = project ? new Set(getDescendantIds(project.id)) : new Set();
  const tasks = project ? allTasks.filter((t) => projectIds.has(t.projectId)) : allTasks;

  const totalTasks = tasks.length;
  const currentCount = tasks.filter((t) => t.status === 'current').length;
  const laterCount = tasks.filter((t) => t.status === 'later').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;

  const completionRate = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  // Priorities
  const priorityCounts = {
    urgent: tasks.filter((t) => t.priority === 'urgent').length,
    high: tasks.filter((t) => t.priority === 'high').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    low: tasks.filter((t) => t.priority === 'low').length,
  };

  // Checklists
  const todos = project?.todos || [];
  const testing = project?.testing || [];
  const doneTodos = todos.filter((t) => t.completed).length;
  const doneTesting = testing.filter((t) => t.completed).length;

  const todoRate = todos.length > 0 ? Math.round((doneTodos / todos.length) * 100) : 0;
  const testRate = testing.length > 0 ? Math.round((doneTesting / testing.length) * 100) : 0;

  // Subtasks
  let totalSubtasks = 0;
  let doneSubtasks = 0;
  tasks.forEach((t) => {
    if (Array.isArray(t.subtasks)) {
      totalSubtasks += t.subtasks.length;
      doneSubtasks += t.subtasks.filter((s) => s.completed).length;
    }
  });

  // Tag distribution
  const tagCounts = {};
  tasks.forEach((t) => {
    if (Array.isArray(t.tags)) {
      t.tags.forEach((tag) => {
        const clean = tag.toLowerCase();
        tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      });
    }
  });

  return {
    totalTasks,
    currentCount,
    laterCount,
    doneCount,
    completionRate,
    priorityCounts,
    todosCount: todos.length,
    doneTodos,
    todoRate,
    testingCount: testing.length,
    doneTesting,
    testRate,
    totalSubtasks,
    doneSubtasks,
    tagCounts,
  };
};
