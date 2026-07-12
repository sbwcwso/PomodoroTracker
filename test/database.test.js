const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const Database = require('better-sqlite3');
const { AppDatabase } = require('../src/main/database');

test('creates hierarchical tasks and records a session', () => {
  const database = new AppDatabase(':memory:');
  const parent = database.createTask({ title: 'CS188' });
  const child = database.createTask({ title: 'Project 1', parentId: parent.id });
  const completedSession = database.recordSession({
    taskId: child.id,
    durationSeconds: 1500,
    startedAt: new Date().toISOString(),
  });
  database.updateSessionNote(completedSession.sessionId, '完成了课程笔记和练习题');
  database.recordSession({
    taskId: child.id,
    durationSeconds: 300,
    startedAt: new Date().toISOString(),
    countsAsPomodoro: false,
  });
  const tasks = database.listTasks();
  assert.equal(tasks.length, 2);
  assert.equal(tasks.find((item) => item.id === parent.id).focused_seconds, 1800);
  assert.equal(tasks.find((item) => item.id === parent.id).session_count, 1);
  assert.equal(tasks.find((item) => item.id === child.id).focused_seconds, 1800);
  assert.equal(tasks.find((item) => item.id === child.id).session_count, 1);
  const sessions = database.listTaskSessions(child.id);
  assert.equal(sessions.length, 2);
  assert.equal(sessions.filter((session) => session.counts_as_pomodoro === 1).length, 1);
  assert.equal(sessions.filter((session) => session.counts_as_pomodoro === 0).length, 1);
  assert.ok(sessions.every((session) => session.local_date));
  const parentSessions = database.listTaskSessions(parent.id);
  assert.equal(parentSessions.length, 2);
  assert.ok(parentSessions.every((session) => session.task_id === child.id));
  assert.equal(
    sessions.find((session) => session.id === completedSession.sessionId).note,
    '完成了课程笔记和练习题',
  );
  const dashboard = database.getDashboardData();
  assert.equal(dashboard.taskStats.length, 1);
  assert.equal(dashboard.taskStats[0].id, child.id);
  assert.equal(dashboard.taskStats[0].focused_seconds, 1800);
  assert.equal(dashboard.taskStats[0].completed_pomodoros, 1);
  assert.equal(dashboard.taskStats[0].interrupted_sessions, 1);
  assert.equal(dashboard.timelineStats.length, 1);
  assert.equal(dashboard.timelineStats[0].focused_seconds, 1800);
  const now = new Date();
  const anchorDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const weeklyDashboard = database.getDashboardData({
    period: 'week',
    anchorDate,
    weekStartDay: 1,
  });
  assert.equal(weeklyDashboard.period, 'week');
  assert.equal(weeklyDashboard.taskStats[0].focused_seconds, 1800);
  database.setTaskTimerSettings(child.id, { focusMinutes: 40, breakMinutes: 8 });
  const configuredTask = database.listTasks().find((item) => item.id === child.id);
  assert.equal(configuredTask.focus_minutes, 40);
  assert.equal(configuredTask.break_minutes, 8);
  database.setTaskTimerSettings(child.id, { focusMinutes: null, breakMinutes: null });
  const inheritedTask = database.listTasks().find((item) => item.id === child.id);
  assert.equal(inheritedTask.focus_minutes, null);
  assert.equal(inheritedTask.break_minutes, null);
  database.close();
});

test('adds task timer settings to an existing database', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-database-'));
  const filePath = path.join(directory, 'legacy.sqlite3');
  const legacyDatabase = new Database(filePath);
  legacyDatabase.exec(`
    CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER,
      title TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    );
    INSERT INTO tasks (title) VALUES ('Existing task');
    CREATE TABLE pomodoro_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      duration_seconds INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT ''
    );
    INSERT INTO pomodoro_sessions
      (task_id, duration_seconds, started_at, completed_at)
    VALUES (1, 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  `);
  legacyDatabase.close();

  const database = new AppDatabase(filePath);
  const task = database.listTasks()[0];
  assert.equal(task.title, 'Existing task');
  assert.equal(task.focus_minutes, null);
  assert.equal(task.break_minutes, null);
  assert.equal(task.session_count, 1);
  assert.equal(task.focused_seconds, 60);
  database.close();
  fs.rmSync(directory, { recursive: true });
});

test('renames tasks and rejects duplicate direct children', () => {
  const database = new AppDatabase(':memory:');
  const parent = database.createTask({ title: 'CS' });
  const first = database.createTask({ title: 'Algorithms', parentId: parent.id });
  const second = database.createTask({ title: 'Systems', parentId: parent.id });
  const grandchild = database.createTask({ title: 'Algorithms', parentId: first.id });

  assert.throws(
    () => database.createTask({ title: ' algorithms ', parentId: parent.id }),
    /同一个父事项/,
  );
  assert.throws(() => database.renameTask(second.id, 'ALGORITHMS'), /同一个父事项/);
  assert.equal(database.renameTask(second.id, 'Operating Systems').title, 'Operating Systems');
  assert.equal(database.renameTask(parent.id, 'Computer Science').title, 'Computer Science');
  assert.equal(database.renameTask(grandchild.id, 'Algorithms').title, 'Algorithms');
  database.close();
});

test('migrates UI groups into database hierarchy once', () => {
  const database = new AppDatabase(':memory:');
  const first = database.createTask({ title: 'CS' });
  const second = database.createTask({ title: 'Life' });
  const migration = database.migrateUiGroups({
    taskGroups: [
      { id: 'default', name: '学习', collapsed: false },
      { id: 'personal', name: '生活', collapsed: true },
    ],
    defaultTaskGroupId: 'default',
    taskGroupAssignments: { [second.id]: 'personal' },
  });
  const tasks = database.listTasks();
  const groups = tasks.filter((task) => task.is_group === 1);
  assert.equal(groups.length, 2);
  assert.equal(
    tasks.find((task) => task.id === first.id).parent_id,
    migration.groupTaskIds.default,
  );
  assert.equal(
    tasks.find((task) => task.id === second.id).parent_id,
    migration.groupTaskIds.personal,
  );
  assert.equal(
    groups.find((group) => group.id === migration.defaultGroupTaskId).is_default_group,
    1,
  );
  assert.deepEqual(database.migrateUiGroups(), migration);
  assert.equal(database.listTasks().filter((task) => task.is_group === 1).length, 2);
  assert.throws(
    () =>
      database.recordSession({
        taskId: migration.defaultGroupTaskId,
        durationSeconds: 60,
        startedAt: new Date().toISOString(),
      }),
    /不能直接计时/,
  );
  database.setDefaultGroup(migration.groupTaskIds.personal);
  assert.equal(
    database.listTasks().find((task) => task.id === migration.groupTaskIds.personal)
      .is_default_group,
    1,
  );
  database.moveTasks([first.id], migration.groupTaskIds.personal);
  assert.equal(
    database.listTasks().find((task) => task.id === first.id).parent_id,
    migration.groupTaskIds.personal,
  );
  database.close();
});
