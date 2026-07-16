const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function createBridge() {
  const values = new Map();
  const localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
  const window = {
    localStorage,
    location: { reload() {} },
    URL,
    Event,
    Uint8Array,
    console,
    setTimeout,
    clearTimeout,
    dispatchEvent() {},
    open() {},
  };
  const document = {
    documentElement: { classList: { add() {} } },
    visibilityState: 'visible',
    addEventListener() {},
  };
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'renderer', 'mobile-bridge.js'),
    'utf8',
  );
  vm.runInNewContext(source, { window, document, console, URL, Event, setTimeout, clearTimeout });
  return window.pomodoro;
}

test('mobile bridge persists hierarchical tasks and focus sessions', async () => {
  const bridge = createBridge();
  const group = (await bridge.listTasks()).find((task) => task.is_group === 1);
  const parent = await bridge.createTask({ title: 'Study', parentId: group.id });
  const child = await bridge.createTask({ title: 'Algorithms', parentId: parent.id });

  const session = await bridge.recordSession({
    taskId: child.id,
    durationSeconds: 1500,
    startedAt: '2026-07-16T08:00:00.000Z',
    note: '**Graph theory**',
  });
  assert.equal(session.skipped, false);

  const tasks = await bridge.listTasks();
  assert.equal(tasks.find((task) => task.id === parent.id).focused_seconds, 1500);
  assert.equal(tasks.find((task) => task.id === child.id).session_count, 1);

  const history = await bridge.listTaskSessions(parent.id);
  assert.equal(history.length, 1);
  assert.equal(history[0].note, '**Graph theory**');
});

test('mobile bridge enforces sibling names and cascades completion state', async () => {
  const bridge = createBridge();
  const group = (await bridge.listTasks()).find((task) => task.is_group === 1);
  const parent = await bridge.createTask({ title: 'Project', parentId: group.id });
  const child = await bridge.createTask({ title: 'Task', parentId: parent.id });

  await assert.rejects(bridge.createTask({ title: 'task', parentId: parent.id }), /unique names/);

  await bridge.toggleTask(parent.id);
  let tasks = await bridge.listTasks();
  assert.equal(tasks.find((task) => task.id === child.id).status, 'done');

  await bridge.toggleTask(child.id);
  tasks = await bridge.listTasks();
  assert.equal(tasks.find((task) => task.id === parent.id).status, 'active');
});

test('mobile bridge skips interrupted sessions shorter than thirty seconds', async () => {
  const bridge = createBridge();
  const group = (await bridge.listTasks()).find((task) => task.is_group === 1);
  const task = await bridge.createTask({ title: 'Quick task', parentId: group.id });
  const result = await bridge.recordSession({
    taskId: task.id,
    durationSeconds: 12,
    startedAt: new Date().toISOString(),
    countsAsPomodoro: false,
  });

  assert.equal(result.skipped, true);
  assert.equal((await bridge.listTaskSessions(task.id)).length, 0);
});
