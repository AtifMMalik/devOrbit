import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Recycle Bin & Soft Delete Logic', () => {
  it('soft deletes active task and preserves all task attributes', () => {
    const tasks = [
      {
        id: 'task_1',
        projectId: 'proj_1',
        title: 'Task to be soft deleted',
        taskPrompt: 'Prompt text',
        isHotfix: true,
        priority: 'urgent',
        deadline: '2026-12-01',
      },
    ];
    let deletedTasks = [];

    // Soft delete operation
    const taskToDelete = tasks.find((t) => t.id === 'task_1');
    const deletedTimestamp = new Date().toISOString();
    deletedTasks = [{ ...taskToDelete, deletedAt: deletedTimestamp }, ...deletedTasks];
    const remainingTasks = tasks.filter((t) => t.id !== 'task_1');

    assert.strictEqual(remainingTasks.length, 0);
    assert.strictEqual(deletedTasks.length, 1);
    assert.strictEqual(deletedTasks[0].title, 'Task to be soft deleted');
    assert.strictEqual(deletedTasks[0].isHotfix, true);
    assert.strictEqual(deletedTasks[0].deletedAt, deletedTimestamp);
  });

  it('restores soft-deleted task back to tasks list', () => {
    let tasks = [];
    let deletedTasks = [
      {
        id: 'task_1',
        projectId: 'proj_1',
        title: 'Recovered task',
        deletedAt: new Date().toISOString(),
      },
    ];

    // Restore operation
    const taskToRestore = deletedTasks.find((t) => t.id === 'task_1');
    const { deletedAt: _deletedAt, ...restored } = taskToRestore;
    deletedTasks = deletedTasks.filter((t) => t.id !== 'task_1');
    tasks = [{ ...restored, updatedAt: new Date().toISOString() }, ...tasks];

    assert.strictEqual(deletedTasks.length, 0);
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].id, 'task_1');
    assert.strictEqual(tasks[0].deletedAt, undefined);
  });

  it('calculates remaining days correctly within 30-day window', () => {
    const getRemainingDays = (deletedAt) => {
      const deletedTime = new Date(deletedAt).getTime();
      const elapsedDays = Math.floor((Date.now() - deletedTime) / (1000 * 60 * 60 * 24));
      return Math.max(0, 30 - elapsedDays);
    };

    const justDeleted = new Date().toISOString();
    assert.strictEqual(getRemainingDays(justDeleted), 30);

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    assert.strictEqual(getRemainingDays(twoDaysAgo), 28);

    const twentyNineDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString();
    assert.strictEqual(getRemainingDays(twentyNineDaysAgo), 1);
  });

  it('soft deletes active project, stores associated tasks and notes, and restores it', () => {
    const projects = [
      { id: 'p1', name: 'Billing Service', author: 'Dev Team', color: '#6366f1' },
    ];
    const tasks = [
      { id: 't1', projectId: 'p1', title: 'Fix stripe webhook' },
    ];
    const notes = [
      { id: 'n1', projectId: 'p1', title: 'API Specs', content: 'Secret key docs' },
    ];

    let deletedProjects = [];

    // Soft delete project
    const deletedTimestamp = new Date().toISOString();
    const projToDelete = projects.find((p) => p.id === 'p1');
    const associatedTasks = tasks.filter((t) => t.projectId === 'p1');
    const associatedNotes = notes.filter((n) => n.projectId === 'p1');

    deletedProjects = [
      {
        ...projToDelete,
        associatedTasks,
        associatedNotes,
        deletedAt: deletedTimestamp,
      },
      ...deletedProjects,
    ];

    const remainingProjects = projects.filter((p) => p.id !== 'p1');
    const remainingTasks = tasks.filter((t) => t.projectId !== 'p1');
    const remainingNotes = notes.filter((n) => n.projectId !== 'p1');

    assert.strictEqual(remainingProjects.length, 0);
    assert.strictEqual(remainingTasks.length, 0);
    assert.strictEqual(remainingNotes.length, 0);
    assert.strictEqual(deletedProjects.length, 1);
    assert.strictEqual(deletedProjects[0].name, 'Billing Service');

    // Restore project
    const toRestore = deletedProjects.find((p) => p.id === 'p1');
    const { deletedAt: _d, associatedTasks: restoredTasks, associatedNotes: restoredNotes, ...cleanProj } = toRestore;
    deletedProjects = deletedProjects.filter((p) => p.id !== 'p1');

    const restoredProjects = [cleanProj, ...remainingProjects];
    const restoredAllTasks = [...restoredTasks, ...remainingTasks];
    const restoredAllNotes = [...restoredNotes, ...remainingNotes];

    assert.strictEqual(deletedProjects.length, 0);
    assert.strictEqual(restoredProjects.length, 1);
    assert.strictEqual(restoredAllTasks.length, 1);
    assert.strictEqual(restoredAllNotes.length, 1);
    assert.strictEqual(restoredAllTasks[0].title, 'Fix stripe webhook');
  });

  it('supports Cmd+Z deletion stack tracking and instant recovery', () => {
    const deletionStack = [];
    const tasks = [{ id: 'task_undo_1', title: 'Accidental delete' }];
    let deletedTasks = [];

    // User deletes task
    const t = tasks[0];
    deletedTasks.push({ ...t, deletedAt: new Date().toISOString() });
    deletionStack.push({ type: 'task', id: t.id, title: t.title });

    assert.strictEqual(deletionStack.length, 1);

    // Cmd+Z pressed
    const lastAction = deletionStack.pop();
    assert.strictEqual(lastAction.type, 'task');
    assert.strictEqual(lastAction.id, 'task_undo_1');

    // Undo restores the task
    const restoredTask = deletedTasks.find((item) => item.id === lastAction.id);
    deletedTasks = deletedTasks.filter((item) => item.id !== lastAction.id);
    const recoveredTasks = [restoredTask];

    assert.strictEqual(deletedTasks.length, 0);
    assert.strictEqual(recoveredTasks.length, 1);
    assert.strictEqual(recoveredTasks[0].id, 'task_undo_1');
  });

  it('separates hotfix tasks into distinct hotfix list and moves tagged tasks there', () => {
    const allTasks = [
      { id: '1', title: 'Regular task', status: 'current', isHotfix: false },
      { id: '2', title: 'Critical crash', status: 'current', isHotfix: true },
      { id: '3', title: 'Later task', status: 'later', isHotfix: false },
      { id: '4', title: 'Completed hotfix', status: 'done', isHotfix: true },
    ];

    const getTasksForColumn = (colKey) => {
      return allTasks.filter((t) => {
        const isDone = (t.status || '').toLowerCase() === 'done';
        if (isDone) return colKey === 'done';
        if (colKey === 'done') return false;

        const isHot = Boolean(t.isHotfix || (t.tags && t.tags.includes('hotfix')) || t.status === 'hotfix');
        if (colKey === 'hotfix') return isHot;
        if (isHot) return false;

        const normStatus = (t.status || 'current').toLowerCase();
        if (colKey === 'later') return normStatus === 'later';
        return normStatus === 'current';
      });
    };

    const hotfixCol = getTasksForColumn('hotfix');
    const currentCol = getTasksForColumn('current');
    const laterCol = getTasksForColumn('later');
    const doneCol = getTasksForColumn('done');

    assert.strictEqual(hotfixCol.length, 1);
    assert.strictEqual(hotfixCol[0].id, '2');
    assert.strictEqual(currentCol.length, 1);
    assert.strictEqual(currentCol[0].id, '1');
    assert.strictEqual(laterCol.length, 1);
    assert.strictEqual(laterCol[0].id, '3');
    assert.strictEqual(doneCol.length, 1);
    assert.strictEqual(doneCol[0].id, '4');
  });

  it('moves hotfix tasks out to current and later columns cleanly without getting trapped', () => {
    let task = {
      id: 'hotfix_1',
      title: 'Production 500 error',
      status: 'hotfix',
      isHotfix: true,
      tags: ['hotfix', 'bug', 'backend'],
    };

    // Move to 'current' column
    const targetStatus = 'current';
    const isMovingOutOfHotfix = targetStatus !== 'hotfix';
    const updatedTask = {
      ...task,
      status: targetStatus,
      isHotfix: isMovingOutOfHotfix ? false : task.isHotfix,
      tags: isMovingOutOfHotfix && Array.isArray(task.tags)
        ? task.tags.filter((t) => t.toLowerCase() !== 'hotfix')
        : task.tags,
    };

    assert.strictEqual(updatedTask.status, 'current');
    assert.strictEqual(updatedTask.isHotfix, false);
    assert.deepStrictEqual(updatedTask.tags, ['bug', 'backend']);
    assert.strictEqual(updatedTask.tags.includes('hotfix'), false);

    // Verify it evaluates to current column now
    const normStatus = (updatedTask.status || 'current').toLowerCase();
    const isHot = Boolean(updatedTask.isHotfix || (updatedTask.tags && updatedTask.tags.includes('hotfix')) || normStatus === 'hotfix');
    assert.strictEqual(isHot, false);
    assert.strictEqual(normStatus === 'current', true);
  });
});
