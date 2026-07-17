const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const initSqlJs = require('sql.js');
const { AppDatabase } = require('../src/main/database');
const DatabaseTransfer = require('../src/renderer/database-transfer');

global.window = {
  DatabaseTransfer,
  initSqlJs: () => initSqlJs({ locateFile: () => require.resolve('sql.js/dist/sql-wasm.wasm') }),
};
require('../src/renderer/mobile-database');

test('mobile SQLite transfer reads desktop databases and writes compatible files', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-mobile-sqlite-'));
  const desktopPath = path.join(directory, 'desktop.sqlite3');
  const exportedPath = path.join(directory, 'mobile.sqlite3');
  const desktop = new AppDatabase(desktopPath);
  const group = desktop.createTask({ title: 'Study', isGroup: true });
  const task = desktop.createTask({ title: 'Algorithms', parentId: group.id });
  desktop.recordSession({
    taskId: task.id,
    durationSeconds: 1500,
    startedAt: '2026-01-01T09:00:00.000Z',
    note: 'review graph search',
  });
  desktop.close();

  const imported = await window.MobileDatabaseTransfer.readSnapshot(fs.readFileSync(desktopPath));
  assert.equal(imported.tasks.length, 2);
  assert.equal(imported.sessions.length, 1);
  assert.equal(imported.sessions[0].note, 'review graph search');

  const bytes = await window.MobileDatabaseTransfer.writeSnapshot(imported);
  fs.writeFileSync(exportedPath, bytes);
  const roundTrip = AppDatabase.readSnapshot(exportedPath);
  assert.deepEqual(roundTrip, imported);
  fs.rmSync(directory, { recursive: true });
});
