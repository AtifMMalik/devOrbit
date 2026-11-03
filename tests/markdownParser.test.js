import { describe, it } from 'node:test';
import assert from 'node:assert';
import { exportTasksToMarkdown, parseMarkdownToTasks } from '../src/utils/markdownParser.js';

describe('Markdown Task Parser & Exporter', () => {
  it('exports tasks to formatted markdown with categories', () => {
    const tasks = [
      {
        id: 't1',
        title: 'Build search functionality',
        status: 'current',
        priority: 'high',
        tags: ['search', 'ux'],
        description: 'Implement cmd+f shortcut and highlight matching keywords.',
        subtasks: [
          { text: 'Add search modal', completed: true },
          { text: 'Add highlight span', completed: false },
        ],
      },
      {
        id: 't2',
        title: 'Setup automated tests',
        status: 'done',
        priority: 'medium',
        tags: ['testing'],
      },
    ];

    const md = exportTasksToMarkdown(tasks, 'Test Project');
    assert.ok(md.includes('# Tasks — Test Project'));
    assert.ok(md.includes('## Current'));
    assert.ok(md.includes('**Build search functionality**'));
    assert.ok(md.includes('[!HIGH]'));
    assert.ok(md.includes('#search'));
    assert.ok(md.includes('## Done'));
    assert.ok(md.includes('[x] **Setup automated tests**'));
  });

  it('parses markdown back into task objects with subtasks and descriptions', () => {
    const md = `
# Tasks
## Current
- [ ] **Configure Vitest & Tests** [!URGENT] #testing #ci
  > Run test suite on GitHub Actions
  - [x] Create test files
  - [ ] Configure CI workflow
## Later
- [ ] **Docker containerization** #devops
    `;

    const parsed = parseMarkdownToTasks(md, 'proj_alpha');
    assert.strictEqual(parsed.length, 2);

    const task1 = parsed[0];
    assert.strictEqual(task1.title, 'Configure Vitest & Tests');
    assert.strictEqual(task1.status, 'current');
    assert.strictEqual(task1.priority, 'urgent');
    assert.ok(task1.tags.includes('testing'));
    assert.ok(task1.tags.includes('ci'));
    assert.strictEqual(task1.description, 'Run test suite on GitHub Actions');
    assert.strictEqual(task1.subtasks.length, 2);
    assert.strictEqual(task1.subtasks[0].completed, true);
    assert.strictEqual(task1.subtasks[1].completed, false);

    const task2 = parsed[1];
    assert.strictEqual(task2.title, 'Docker containerization');
    assert.strictEqual(task2.status, 'later');
  });
});

