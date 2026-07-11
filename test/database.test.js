const assert = require('node:assert/strict');
const { test } = require('node:test');
const { AppDatabase } = require('../src/main/database');

test('creates hierarchical tasks and records a session', () => {
  const database = new AppDatabase(':memory:');
  const parent = database.createTask({ title: 'CS188' });
  const child = database.createTask({ title: 'Project 1', parentId: parent.id });
  database.recordSession({
    taskId: child.id,
    durationSeconds: 1500,
    startedAt: new Date().toISOString(),
  });
  const tasks = database.listTasks();
  assert.equal(tasks.length, 2);
  assert.equal(tasks.find((item) => item.id === child.id).focused_seconds, 1500);
  database.close();
});
