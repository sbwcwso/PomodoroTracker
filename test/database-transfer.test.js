const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { AppDatabase } = require('../src/main/database');
const { mergeSnapshots } = require('../src/renderer/database-transfer');

function task(id, parentId, title, isGroup = false) {
  return {
    id,
    parent_id: parentId,
    title,
    notes: '',
    status: 'active',
    focus_minutes: null,
    break_minutes: null,
    sort_order: id,
    created_at: '2026-01-01T00:00:00.000Z',
    completed_at: null,
    is_group: isGroup ? 1 : 0,
    is_default_group: isGroup ? 1 : 0,
  };
}

function session(id, taskId, start, end, note) {
  return {
    id,
    task_id: taskId,
    duration_seconds: (Date.parse(end) - Date.parse(start)) / 1000,
    started_at: start,
    completed_at: end,
    counts_as_pomodoro: 1,
    note,
  };
}

test('merges task paths, skips duplicates, and exposes overlapping sessions', () => {
  const currentSession = session(
    1,
    2,
    '2026-01-01T09:00:00.000Z',
    '2026-01-01T09:25:00.000Z',
    'local note',
  );
  const current = {
    tasks: [task(1, null, 'Work', true), task(2, 1, 'Project')],
    sessions: [currentSession],
  };
  const imported = {
    tasks: [task(10, null, 'work', true), task(11, 10, 'Project'), task(12, 10, 'Reading')],
    sessions: [
      { ...currentSession, id: 20, task_id: 11 },
      session(21, 12, '2026-01-01T09:10:00.000Z', '2026-01-01T09:20:00.000Z', 'phone conflict'),
      session(22, 12, '2026-01-01T10:00:00.000Z', '2026-01-01T10:25:00.000Z', 'phone record'),
    ],
  };

  const keepCurrent = mergeSnapshots(current, imported, 'keep-current');
  assert.equal(keepCurrent.summary.importedTaskCount, 1);
  assert.equal(keepCurrent.summary.matchedTaskCount, 2);
  assert.equal(keepCurrent.summary.duplicateSessionCount, 1);
  assert.equal(keepCurrent.summary.conflictCount, 1);
  assert.equal(keepCurrent.summary.importedSessionCount, 1);
  assert.equal(keepCurrent.snapshot.sessions.length, 2);
  assert.equal(keepCurrent.conflicts[0].imported.task_path, 'work / Reading');

  const keepImported = mergeSnapshots(current, imported, 'keep-imported');
  assert.equal(keepImported.summary.removedLocalSessionCount, 1);
  assert.equal(keepImported.summary.importedSessionCount, 2);
  assert.equal(keepImported.snapshot.sessions.length, 2);
  assert.ok(keepImported.snapshot.sessions.some((entry) => entry.note === 'phone conflict'));
  assert.ok(!keepImported.snapshot.sessions.some((entry) => entry.note === 'local note'));
});

test('merges another SQLite database into the active database', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-merge-'));
  const currentPath = path.join(directory, 'current.sqlite3');
  const importedPath = path.join(directory, 'imported.sqlite3');
  const current = new AppDatabase(currentPath);
  const currentGroup = current.createTask({ title: 'Work', isGroup: true });
  const currentTask = current.createTask({ title: 'Coding', parentId: currentGroup.id });
  current.recordSession({
    taskId: currentTask.id,
    durationSeconds: 1500,
    startedAt: '2026-01-01T09:00:00.000Z',
    note: 'desktop',
  });
  current.db
    .prepare('UPDATE pomodoro_sessions SET completed_at = ?')
    .run('2026-01-01T09:25:00.000Z');
  const imported = new AppDatabase(importedPath);
  const importedGroup = imported.createTask({ title: 'Work', isGroup: true });
  const importedTask = imported.createTask({ title: 'Reading', parentId: importedGroup.id });
  imported.recordSession({
    taskId: importedTask.id,
    durationSeconds: 1200,
    startedAt: '2026-01-02T09:00:00.000Z',
    note: 'mobile',
  });
  imported.db
    .prepare('UPDATE pomodoro_sessions SET completed_at = ?')
    .run('2026-01-02T09:20:00.000Z');
  imported.close();

  const preview = current.previewMerge(importedPath);
  assert.equal(preview.summary.importedTaskCount, 1);
  assert.equal(preview.summary.conflictCount, 0);
  const result = current.mergeFromFile(importedPath);
  assert.equal(result.importedSessionCount, 1);
  assert.deepEqual(
    current
      .listTasks()
      .filter((entry) => entry.is_group !== 1)
      .map((entry) => entry.title)
      .sort(),
    ['Coding', 'Reading'],
  );
  assert.equal(current.searchSessionNotes({ query: 'mobile' }).length, 1);
  current.close();
  fs.rmSync(directory, { recursive: true });
});
