import { generateId } from './idGenerator';

/**
 * Converts a list of tasks for a project into formatted Markdown text.
 */
export const exportTasksToMarkdown = (tasks, projectName = 'Project Tasks') => {
  const categories = [
    { key: 'current', title: 'Current' },
    { key: 'later', title: 'Later' },
    { key: 'done', title: 'Done' },
  ];

  let md = `# Tasks — ${projectName}\n`;
  md += `*Exported from devOrbit on ${new Date().toLocaleDateString()}*\n\n`;

  categories.forEach(({ key, title }) => {
    const groupTasks = tasks.filter((t) => (t.status || 'current').toLowerCase() === key);
    if (groupTasks.length > 0) {
      md += `## ${title}\n\n`;
      groupTasks.forEach((task) => {
        const checkbox = task.status === 'done' ? '[x]' : '[ ]';
        const priorityTag = task.priority && task.priority !== 'medium' ? `[!${task.priority.toUpperCase()}]` : '';
        const tagsStr = (task.tags || []).map((t) => `#${t}`).join(' ');
        
        md += `- ${checkbox} **${task.title}** ${priorityTag} ${tagsStr}\n`;
        if (task.description && task.description.trim()) {
          md += `  > ${task.description.trim().replace(/\n/g, '\n  > ')}\n`;
        }
        if (task.subtasks && task.subtasks.length > 0) {
          task.subtasks.forEach((sub) => {
            const subCheck = sub.completed ? '[x]' : '[ ]';
            md += `  - ${subCheck} ${sub.text}\n`;
          });
        }
        md += `\n`;
      });
    }
  });

  return md;
};

/**
 * Parses markdown text into devOrbit task objects.
 * Supports section headers (## Current, ## Later, ## Done) and inline tags.
 */
export const parseMarkdownToTasks = (markdownText, projectId) => {
  const lines = markdownText.split('\n');
  const tasks = [];
  let currentStatus = 'current';
  let currentTask = null;

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Check for Section Headings (## Current, ## Later, ## Done)
    if (trimmed.startsWith('#')) {
      const headingText = trimmed.replace(/^#+\s*/, '').toLowerCase();
      if (headingText.includes('later') || headingText.includes('queue') || headingText.includes('planned')) {
        currentStatus = 'later';
      } else if (headingText.includes('done') || headingText.includes('completed') || headingText.includes('finished')) {
        currentStatus = 'done';
      } else {
        currentStatus = 'current';
      }
      return;
    }

    // Check for Subtask lines
    if ((line.startsWith('  - [') || line.startsWith('\t- [') || line.startsWith('    - [')) && currentTask) {
      const isChecked = line.includes('[x]') || line.includes('[X]');
      const subText = line.replace(/^\s*-\s*\[[ xX]\]\s*/, '').trim();
      if (subText) {
        currentTask.subtasks.push({
          id: generateId('sub'),
          text: subText,
          completed: isChecked,
        });
      }
      return;
    }

    // Check for Blockquote description line
    if (line.startsWith('  >') || line.startsWith('\t>') || line.startsWith('    >')) {
      const descLine = line.replace(/^\s*>\s*/, '').trim();
      if (currentTask && descLine) {
        currentTask.description = currentTask.description
          ? `${currentTask.description}\n${descLine}`
          : descLine;
      }
      return;
    }

    // Check for main task line
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
      let content = trimmed.replace(/^[-*]\s*(\[[ xX]\])?\s*/, '').replace(/^\d+\.\s*(\[[ xX]\])?\s*/, '').trim();
      if (!content) return;

      let taskStatus = currentStatus;
      if (trimmed.includes('[x]') || trimmed.includes('[X]')) {
        taskStatus = 'done';
      }

      // Detect inline status tags like [Current], [Later], [Done]
      const statusMatch = content.match(/\[(Current|Later|Done|Completed)\]/i);
      if (statusMatch) {
        const rawStatus = statusMatch[1].toLowerCase();
        if (rawStatus === 'completed') taskStatus = 'done';
        else taskStatus = rawStatus;
        content = content.replace(statusMatch[0], '').trim();
      }

      // Detect inline priority tag like [!URGENT], [!HIGH], [!LOW]
      let priority = 'medium';
      const priorityMatch = content.match(/\[!(URGENT|HIGH|MEDIUM|LOW)\]/i);
      if (priorityMatch) {
        priority = priorityMatch[1].toLowerCase();
        content = content.replace(priorityMatch[0], '').trim();
      }

      // Extract hashtags
      const tags = [];
      const hashtagMatches = content.match(/#([a-zA-Z0-9_-]+)/g);
      if (hashtagMatches) {
        hashtagMatches.forEach((tag) => {
          tags.push(tag.replace('#', '').toLowerCase());
          content = content.replace(tag, '');
        });
      }

      // Remove markdown bold from title if present
      const cleanTitle = content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim();

      if (cleanTitle) {
        currentTask = {
          id: generateId('task'),
          projectId: projectId,
          title: cleanTitle,
          description: '',
          status: taskStatus,
          priority: priority,
          tags: tags.length > 0 ? tags : ['feature'],
          dueDate: '',
          subtasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        tasks.push(currentTask);
      }
    }
  });

  return tasks;
};
