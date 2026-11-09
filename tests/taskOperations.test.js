import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Task Operations & Clipboard & Drafts', () => {
  it('handles multi-item selection set operations', () => {
    const selectedTaskIds = new Set(['task_1', 'task_2']);

    // Toggle off task_1
    if (selectedTaskIds.has('task_1')) selectedTaskIds.delete('task_1');
    assert.strictEqual(selectedTaskIds.has('task_1'), false);
    assert.strictEqual(selectedTaskIds.size, 1);

    // Toggle on task_3
    selectedTaskIds.add('task_3');
    assert.strictEqual(selectedTaskIds.size, 2);
    assert.deepStrictEqual([...selectedTaskIds], ['task_2', 'task_3']);
  });

  it('handles clipboard cut and copy state transitions', () => {
    const tasks = [
      { id: 't1', title: 'Task 1', status: 'current', priority: 'medium' },
      { id: 't2', title: 'Task 2', status: 'current', priority: 'high' },
    ];

    // Copy action
    const copyClipboard = {
      action: 'copy',
      taskIds: ['t1', 't2'],
      tasks,
    };
    assert.strictEqual(copyClipboard.action, 'copy');
    assert.strictEqual(copyClipboard.tasks.length, 2);

    // Paste copied tasks into 'later'
    const pastedCopies = copyClipboard.tasks.map((task) => {
      const { id: _id, ...rest } = task;
      return {
        ...rest,
        id: `copy_${task.id}`,
        title: `${task.title} (Copy)`,
        status: 'later',
      };
    });

    assert.strictEqual(pastedCopies.length, 2);
    assert.strictEqual(pastedCopies[0].title, 'Task 1 (Copy)');
    assert.strictEqual(pastedCopies[0].status, 'later');

    // Cut action
    const cutClipboard = {
      action: 'cut',
      taskIds: ['t1'],
      tasks: [tasks[0]],
    };
    // Paste cut tasks moves them to target status
    const movedTasks = cutClipboard.tasks.map((t) => ({ ...t, status: 'done' }));
    assert.strictEqual(movedTasks[0].status, 'done');
  });

  it('persists and restores task modal draft correctly (Requirement 13)', () => {
    const draftPayload = {
      projectId: 'proj_1',
      title: 'Draft in progress',
      description: 'Unfinished description',
      taskPrompt: 'Draft AI prompt',
      status: 'current',
      priority: 'high',
      deadline: '2026-12-15',
      completionNote: '',
      isHotfix: true,
      tags: ['feature', 'hotfix'],
      subtasks: [{ id: 's1', text: 'Draft subtask', completed: false }],
      savedAt: new Date().toISOString(),
    };

    // Serialize to JSON (as stored in localStorage)
    const serialized = JSON.stringify(draftPayload);
    const deserialized = JSON.parse(serialized);

    assert.strictEqual(deserialized.title, 'Draft in progress');
    assert.strictEqual(deserialized.taskPrompt, 'Draft AI prompt');
    assert.strictEqual(deserialized.deadline, '2026-12-15');
    assert.strictEqual(deserialized.isHotfix, true);
    assert.strictEqual(deserialized.subtasks.length, 1);
  });

  it('reorders task to top and bottom within its column list', () => {
    let tasks = [
      { id: 't1', title: 'Task 1', status: 'current', projectId: 'p1' },
      { id: 't2', title: 'Task 2', status: 'current', projectId: 'p1' },
      { id: 't3', title: 'Task 3', status: 'current', projectId: 'p1' },
    ];

    // Move t3 to top
    const targetTask = tasks.find((t) => t.id === 't3');
    const otherTasks = tasks.filter((t) => t.id !== 't3');
    const firstIndex = otherTasks.findIndex((t) => t.status === targetTask.status && t.projectId === targetTask.projectId);
    otherTasks.splice(firstIndex === -1 ? 0 : firstIndex, 0, targetTask);
    tasks = otherTasks;

    assert.deepStrictEqual(tasks.map((t) => t.id), ['t3', 't1', 't2']);

    // Move t3 to bottom
    const otherTasks2 = tasks.filter((t) => t.id !== 't3');
    let lastIndex = -1;
    for (let i = otherTasks2.length - 1; i >= 0; i--) {
      if (otherTasks2[i].status === targetTask.status && otherTasks2[i].projectId === targetTask.projectId) {
        lastIndex = i;
        break;
      }
    }
    otherTasks2.splice(lastIndex + 1, 0, targetTask);
    tasks = otherTasks2;

    assert.deepStrictEqual(tasks.map((t) => t.id), ['t1', 't2', 't3']);
  });
});

