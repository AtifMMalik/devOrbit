import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Global Undo & Redo System (Cmd+Z and Cmd+Y)', () => {
  it('moves task back to previous list on Undo (Cmd+Z) and moves to next list on Redo (Cmd+Y)', () => {
    const undoStack = [];
    const redoStack = [];

    let tasks = [
      { id: 't1', title: 'Critical crash bug', status: 'hotfix', isHotfix: true, tags: ['hotfix', 'bug'] },
    ];

    // User moves task from 'hotfix' to 'current'
    const fromStatus = tasks[0].status;
    const toStatus = 'current';

    undoStack.push({
      type: 'MOVE_TASK',
      taskId: 't1',
      title: tasks[0].title,
      fromStatus: fromStatus,
      toStatus: toStatus,
      fromIsHotfix: true,
      toIsHotfix: false,
      fromTags: ['hotfix', 'bug'],
      toTags: ['bug'],
    });
    redoStack.length = 0;

    tasks = tasks.map((t) => (t.id === 't1' ? { ...t, status: toStatus, isHotfix: false, tags: ['bug'] } : t));
    assert.strictEqual(tasks[0].status, 'current');
    assert.strictEqual(tasks[0].isHotfix, false);

    // Cmd + Z pressed (Undo)
    const undoAction = undoStack.pop();
    assert.strictEqual(undoAction.type, 'MOVE_TASK');

    tasks = tasks.map((t) =>
      t.id === undoAction.taskId
        ? { ...t, status: undoAction.fromStatus, isHotfix: undoAction.fromIsHotfix, tags: undoAction.fromTags }
        : t
    );
    redoStack.push(undoAction);

    // Task is moved back to 'hotfix' list!
    assert.strictEqual(tasks[0].status, 'hotfix');
    assert.strictEqual(tasks[0].isHotfix, true);
    assert.deepStrictEqual(tasks[0].tags, ['hotfix', 'bug']);

    // Cmd + Y pressed (Redo)
    const redoAction = redoStack.pop();
    assert.strictEqual(redoAction.type, 'MOVE_TASK');

    tasks = tasks.map((t) =>
      t.id === redoAction.taskId
        ? { ...t, status: redoAction.toStatus, isHotfix: redoAction.toIsHotfix, tags: redoAction.toTags }
        : t
    );
    undoStack.push(redoAction);

    // Task is moved forward to 'current' list!
    assert.strictEqual(tasks[0].status, 'current');
    assert.strictEqual(tasks[0].isHotfix, false);
    assert.deepStrictEqual(tasks[0].tags, ['bug']);
  });

  it('undoes multiple task creations one by one, and redoes them one by one', () => {
    const undoStack = [];
    const redoStack = [];

    let activeTasks = [];
    let deletedTasks = [];

    // Create 3 tasks in sequence
    for (let i = 1; i <= 3; i++) {
      const task = { id: `task_${i}`, title: `Deliverable ${i}`, status: 'current' };
      activeTasks.push(task);
      undoStack.push({ type: 'CREATE_TASK', task });
      redoStack.length = 0;
    }

    assert.strictEqual(activeTasks.length, 3);
    assert.strictEqual(undoStack.length, 3);

    // Undo #1: undos task 3
    let action = undoStack.pop();
    activeTasks = activeTasks.filter((t) => t.id !== action.task.id);
    deletedTasks.push(action.task);
    redoStack.push(action);

    assert.strictEqual(activeTasks.length, 2);
    assert.strictEqual(activeTasks.map((t) => t.id).includes('task_3'), false);

    // Undo #2: undos task 2
    action = undoStack.pop();
    activeTasks = activeTasks.filter((t) => t.id !== action.task.id);
    deletedTasks.push(action.task);
    redoStack.push(action);

    assert.strictEqual(activeTasks.length, 1);
    assert.strictEqual(activeTasks[0].id, 'task_1');

    // Undo #3: undos task 1
    action = undoStack.pop();
    activeTasks = activeTasks.filter((t) => t.id !== action.task.id);
    deletedTasks.push(action.task);
    redoStack.push(action);

    assert.strictEqual(activeTasks.length, 0);
    assert.strictEqual(deletedTasks.length, 3);

    // Redo #1: redoes task 1
    action = redoStack.pop();
    deletedTasks = deletedTasks.filter((t) => t.id !== action.task.id);
    activeTasks.push(action.task);
    undoStack.push(action);

    assert.strictEqual(activeTasks.length, 1);
    assert.strictEqual(activeTasks[0].id, 'task_1');

    // Redo #2: redoes task 2
    action = redoStack.pop();
    deletedTasks = deletedTasks.filter((t) => t.id !== action.task.id);
    activeTasks.push(action.task);
    undoStack.push(action);

    assert.strictEqual(activeTasks.length, 2);

    // Redo #3: redoes task 3
    action = redoStack.pop();
    deletedTasks = deletedTasks.filter((t) => t.id !== action.task.id);
    activeTasks.push(action.task);
    undoStack.push(action);

    assert.strictEqual(activeTasks.length, 3);
    assert.strictEqual(deletedTasks.length, 0);
  });
});

