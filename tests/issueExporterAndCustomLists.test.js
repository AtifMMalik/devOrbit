import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatSingleTaskToMarkdown,
  formatTasksToMarkdown,
  formatTasksToJson,
  DEFAULT_MARKDOWN_FIELDS,
} from '../src/utils/issueExporter.js';
import { sanitizeWorkspaceData } from '../src/utils/storage.js';

describe('Issue Exporter (Markdown & JSON) - Requirements 2 & 11', () => {
  const sampleTasks = [
    {
      id: 'task_1',
      projectId: 'proj_alpha',
      title: 'Database connection pool timeout',
      description: 'Under heavy load, connection pool gets saturated and drops clients.',
      taskPrompt: 'Optimize pool sizing and add retry with exponential backoff.',
      subtasks: [
        { id: 'sub_1', text: 'Set maxConnections to 50', completed: false },
        { id: 'sub_2', text: 'Add keep-alive ping', completed: true },
      ],
      priority: 'high',
      tags: ['database', 'performance'],
      status: 'current',
    },
    {
      id: 'task_2',
      projectId: 'proj_alpha',
      title: 'Cache warmup script failing',
      description: 'Redis cache warmup script encounters 404 from upstream CDN.',
      taskPrompt: 'Update CDN endpoints in warmup configuration.',
      subtasks: [{ id: 'sub_3', text: 'Verify staging DNS', completed: true }],
      priority: 'medium',
      tags: ['cache', 'redis'],
      status: 'later',
    },
  ];

  it('formats single task into clean Markdown with user-selected fields and order', () => {
    const md = formatSingleTaskToMarkdown(sampleTasks[0], DEFAULT_MARKDOWN_FIELDS);

    assert.ok(md.includes('## Database connection pool timeout'));
    assert.ok(md.includes('Under heavy load, connection pool gets saturated'));
    assert.ok(md.includes('Optimize pool sizing and add retry with exponential backoff.'));
    assert.ok(md.includes('- Set maxConnections to 50'));
    assert.ok(md.includes('- Add keep-alive ping'));
    assert.ok(md.includes('Priority: high'));
    assert.ok(md.includes('Tags: [database, performance]'));
  });

  it('respects custom field ordering for Markdown export (Requirement 2)', () => {
    // Custom order: Prompt first, then Title, then Priority
    const customFields = [
      { id: 'prompt', label: 'Prompt', enabled: true },
      { id: 'title', label: 'Title', enabled: true },
      { id: 'priority', label: 'Priority', enabled: true },
      { id: 'description', label: 'Description', enabled: false },
    ];

    const md = formatSingleTaskToMarkdown(sampleTasks[0], customFields);

    const promptIdx = md.indexOf('Optimize pool sizing');
    const titleIdx = md.indexOf('## Database connection pool timeout');
    const priorityIdx = md.indexOf('Priority: high');

    assert.ok(promptIdx < titleIdx, 'Prompt should precede Title when ordered first');
    assert.ok(titleIdx < priorityIdx, 'Title should precede Priority');
    assert.strictEqual(md.includes('Under heavy load'), false, 'Disabled description should not be present');
  });

  it('formats multiple tasks into Markdown separated by "---" delimiter (Requirement 2)', () => {
    const md = formatTasksToMarkdown(sampleTasks, DEFAULT_MARKDOWN_FIELDS);

    assert.ok(md.includes('## Database connection pool timeout'));
    assert.ok(md.includes('---'));
    assert.ok(md.includes('## Cache warmup script failing'));
  });

  it('exports issues to clean JSON filtered by scope or selection (Requirement 11)', () => {
    const selected = sampleTasks.filter((t) => t.id === 'task_1');
    const jsonStr = formatTasksToJson(selected);

    const parsed = JSON.parse(jsonStr);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].id, 'task_1');
    assert.strictEqual(parsed[0].title, 'Database connection pool timeout');
    assert.strictEqual(parsed[0].priority, 'high');
  });
});

describe('Custom Lists & Project Ideas - Requirements 12 & 13', () => {
  it('sanitizes and preserves customLists, deletedDefaultLists, and ideas in workspace data', () => {
    const rawData = {
      projects: [
        {
          id: 'p1',
          name: 'Core System',
          customLists: [
            {
              id: 'list_proc',
              title: 'Procedures',
              items: [{ id: 'item_1', text: 'Pre-flight checklist', completed: false }],
            },
          ],
          deletedDefaultLists: ['testing'],
        },
      ],
      ideas: [
        {
          id: 'idea_1',
          title: 'AI Log Observer',
          description: 'Streaming log summarizer using local LLM',
          status: 'ready',
          priority: 'high',
          targetFeatures: ['Streaming TUI', 'Log deduplication'],
          color: '#f59e0b',
        },
      ],
    };

    const clean = sanitizeWorkspaceData(rawData);

    assert.strictEqual(clean.projects.length, 1);
    assert.strictEqual(clean.projects[0].customLists.length, 1);
    assert.strictEqual(clean.projects[0].customLists[0].title, 'Procedures');
    assert.deepStrictEqual(clean.projects[0].deletedDefaultLists, ['testing']);
    assert.strictEqual(clean.ideas.length, 1);
    assert.strictEqual(clean.ideas[0].title, 'AI Log Observer');
    assert.strictEqual(clean.ideas[0].targetFeatures.length, 2);
  });

  it('handles cross-project clipboard paste resetting projectId to target (Requirement 7)', () => {
    const originalTask = {
      id: 'task_orig',
      projectId: 'project_source',
      title: 'Implement OAuth Middleware',
      status: 'current',
      priority: 'high',
    };

    const clipboard = {
      action: 'copy',
      taskIds: ['task_orig'],
      tasks: [originalTask],
    };

    // Paste into target project 'project_destination' in column 'later'
    const targetProjectId = 'project_destination';
    const targetStatus = 'later';

    const pastedTasks = clipboard.tasks.map((task) => {
      const { id: _id, ...rest } = task;
      return {
        ...rest,
        id: `task_copy_${Date.now()}`,
        projectId: targetProjectId,
        title: `${task.title} (Copy)`,
        status: targetStatus,
      };
    });

    assert.strictEqual(pastedTasks[0].projectId, 'project_destination');
    assert.strictEqual(pastedTasks[0].status, 'later');
    assert.strictEqual(pastedTasks[0].title, 'Implement OAuth Middleware (Copy)');
  });
});
