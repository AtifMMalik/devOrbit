/**
 * Default field order and configuration for Markdown issue export.
 */
export const DEFAULT_MARKDOWN_FIELDS = [
  { id: 'title', label: 'Title', enabled: true },
  { id: 'description', label: 'Description', enabled: true },
  { id: 'prompt', label: 'Prompt', enabled: true },
  { id: 'subtasks', label: 'Subtasks', enabled: true },
  { id: 'priority', label: 'Priority', enabled: true },
  { id: 'tags', label: 'Tags', enabled: true },
];

/**
 * Formats a single task into Markdown following the field order and selection.
 * @param {Object} task
 * @param {Array<{ id: string, enabled: boolean }>} fieldConfig
 * @returns {string}
 */
export const formatSingleTaskToMarkdown = (task, fieldConfig = DEFAULT_MARKDOWN_FIELDS) => {
  if (!task) return '';
  const sections = [];

  const activeFields = fieldConfig.filter((f) => f.enabled);

  for (const field of activeFields) {
    switch (field.id) {
      case 'title':
        if (task.title) {
          sections.push(`## ${task.title}`);
        }
        break;

      case 'description':
        if (task.description && task.description.trim()) {
          sections.push(task.description.trim());
        }
        break;

      case 'prompt':
        if (task.taskPrompt && task.taskPrompt.trim()) {
          sections.push(task.taskPrompt.trim());
        }
        break;

      case 'subtasks':
        if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
          const subLines = task.subtasks
            .map((s) => `- ${s.text || s}`)
            .join('\n');
          if (subLines) {
            sections.push(subLines);
          }
        }
        break;

      case 'priority':
        if (task.priority) {
          sections.push(`Priority: ${task.priority}`);
        }
        break;

      case 'tags':
        if (Array.isArray(task.tags) && task.tags.length > 0) {
          sections.push(`Tags: [${task.tags.join(', ')}]`);
        }
        break;

      default:
        break;
    }
  }

  return sections.join('\n\n');
};

/**
 * Formats an array of tasks into a combined Markdown document separated by "---".
 * @param {Array<Object>} tasks
 * @param {Array<{ id: string, enabled: boolean }>} fieldConfig
 * @returns {string}
 */
export const formatTasksToMarkdown = (tasks = [], fieldConfig = DEFAULT_MARKDOWN_FIELDS) => {
  if (!Array.isArray(tasks) || tasks.length === 0) return '';
  return tasks
    .map((task) => formatSingleTaskToMarkdown(task, fieldConfig))
    .filter(Boolean)
    .join('\n\n---\n\n');
};

/**
 * Exports tasks as clean, formatted JSON.
 * @param {Array<Object>} tasks
 * @returns {string}
 */
export const formatTasksToJson = (tasks = []) => {
  const cleanTasks = tasks.map((t) => ({
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    description: t.description || '',
    taskPrompt: t.taskPrompt || '',
    status: t.status || 'current',
    priority: t.priority || 'medium',
    tags: Array.isArray(t.tags) ? t.tags : [],
    subtasks: Array.isArray(t.subtasks)
      ? t.subtasks.map((s) => ({
          id: s.id,
          text: s.text,
          completed: Boolean(s.completed),
        }))
      : [],
    deadline: t.deadline || t.dueDate || '',
    completionNote: t.completionNote || '',
    isHotfix: Boolean(t.isHotfix),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  return JSON.stringify(cleanTasks, null, 2);
};

