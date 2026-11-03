import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeWorkspaceData, purgeExpiredDeletedTasks } from '../src/utils/storage.js';

describe('Storage & Data Sanitization', () => {
  it('preserves project author, readme, liveUrl, and githubUrl', () => {
    const rawData = {
      version: '1.0.0',
      projects: [
        {
          id: 'proj_test_1',
          name: 'Awesome Project',
          author: 'Alice Developer',
          readme: '# Architecture\n\nDetailed specifications here.',
          liveUrl: 'https://awesome.dev',
          githubUrl: 'https://github.com/alice/awesome',
        },
      ],
      tasks: [],
      notes: [],
    };

    const sanitized = sanitizeWorkspaceData(rawData);
    assert.strictEqual(sanitized.projects.length, 1);
    const p = sanitized.projects[0];
    assert.strictEqual(p.author, 'Alice Developer');
    assert.strictEqual(p.readme, '# Architecture\n\nDetailed specifications here.');
    assert.strictEqual(p.liveUrl, 'https://awesome.dev');
    assert.strictEqual(p.githubUrl, 'https://github.com/alice/awesome');
  });

  it('preserves task createdAt, updatedAt, taskPrompt, deadline, completionNote, and isHotfix', () => {
    const rawData = {
      version: '1.0.0',
      projects: [
        { id: 'proj_1', name: 'Project 1' },
      ],
      tasks: [
        {
          id: 'task_100',
          projectId: 'proj_1',
          title: 'Implement OAuth with PKCE',
          taskPrompt: 'Generate PKCE code verifier and code challenge using SHA-256 in browser SubtleCrypto.',
          deadline: '2026-11-20',
          completionNote: 'Tested and verified against OAuth2 RFC.',
          isHotfix: true,
          status: 'current',
          priority: 'urgent',
          tags: ['auth', 'hotfix'],
        },
      ],
      notes: [],
    };

    const sanitized = sanitizeWorkspaceData(rawData);
    assert.strictEqual(sanitized.tasks.length, 1);
    const t = sanitized.tasks[0];
    assert.strictEqual(t.title, 'Implement OAuth with PKCE');
    assert.strictEqual(t.taskPrompt, 'Generate PKCE code verifier and code challenge using SHA-256 in browser SubtleCrypto.');
    assert.strictEqual(t.deadline, '2026-11-20');
    assert.strictEqual(t.dueDate, '2026-11-20');
    assert.strictEqual(t.completionNote, 'Tested and verified against OAuth2 RFC.');
    assert.strictEqual(t.isHotfix, true);
    assert.ok(t.createdAt);
    assert.ok(t.updatedAt);
  });

  it('correctly handles soft-deleted tasks in deletedTasks and enforces 30-day purge', () => {
    const now = Date.now();
    const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyFiveDaysAgo = new Date(now - 35 * 24 * 60 * 60 * 1000).toISOString();

    const rawData = {
      version: '1.0.0',
      projects: [{ id: 'proj_1', name: 'Alpha' }],
      tasks: [],
      notes: [],
      deletedTasks: [
        {
          id: 'del_recent',
          projectId: 'proj_1',
          title: 'Recent deleted task',
          deletedAt: tenDaysAgo,
        },
        {
          id: 'del_expired',
          projectId: 'proj_1',
          title: 'Old expired deleted task',
          deletedAt: thirtyFiveDaysAgo,
        },
      ],
    };

    const sanitized = sanitizeWorkspaceData(rawData);
    // Expired task (35 days old) should be purged by sanitizeWorkspaceData
    assert.strictEqual(sanitized.deletedTasks.length, 1);
    assert.strictEqual(sanitized.deletedTasks[0].id, 'del_recent');
  });

  it('purgeExpiredDeletedTasks cleans up tasks older than 30 days', () => {
    const now = Date.now();
    const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyOneDaysAgo = new Date(now - 31 * 24 * 60 * 60 * 1000).toISOString();

    const data = {
      projects: [],
      tasks: [],
      notes: [],
      deletedTasks: [
        { id: 'task_valid', title: 'Valid task', deletedAt: fiveDaysAgo },
        { id: 'task_old', title: 'Old task', deletedAt: thirtyOneDaysAgo },
      ],
    };

    const result = purgeExpiredDeletedTasks(data);
    assert.strictEqual(result.purgedCount, 1);
    assert.strictEqual(result.data.deletedTasks.length, 1);
    assert.strictEqual(result.data.deletedTasks[0].id, 'task_valid');
  });

  it('correctly handles deletedProjects and purges expired projects (> 30 days)', () => {
    const now = Date.now();
    const fourDaysAgo = new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyFourDaysAgo = new Date(now - 34 * 24 * 60 * 60 * 1000).toISOString();

    const rawData = {
      version: '1.0.0',
      projects: [],
      tasks: [],
      notes: [],
      deletedProjects: [
        {
          id: 'proj_del_recent',
          name: 'Recent Project',
          deletedAt: fourDaysAgo,
          associatedTasks: [{ id: 'task_sub_1', title: 'Associated task' }],
        },
        {
          id: 'proj_del_expired',
          name: 'Expired Project',
          deletedAt: thirtyFourDaysAgo,
        },
      ],
    };

    const sanitized = sanitizeWorkspaceData(rawData);
    assert.strictEqual(sanitized.deletedProjects.length, 1);
    assert.strictEqual(sanitized.deletedProjects[0].id, 'proj_del_recent');
    assert.strictEqual(sanitized.deletedProjects[0].associatedTasks.length, 1);

    const purgeResult = purgeExpiredDeletedTasks(sanitized);
    assert.strictEqual(purgeResult.purgedProjectsCount, 0);
    assert.strictEqual(purgeResult.data.deletedProjects.length, 1);
  });

  it('normalizes status hotfix to hotfix', () => {
    const rawData = {
      version: '1.0.0',
      projects: [{ id: 'proj_1', name: 'Project 1' }],
      tasks: [
        {
          id: 'task_hot',
          projectId: 'proj_1',
          title: 'Hotfix Task',
          status: 'hotfix',
        },
      ],
      notes: [],
    };

    const sanitized = sanitizeWorkspaceData(rawData);
    assert.strictEqual(sanitized.tasks[0].status, 'hotfix');
  });
});
