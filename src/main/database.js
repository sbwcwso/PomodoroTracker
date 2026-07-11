const Database = require('better-sqlite3');

class AppDatabase {
  constructor(filePath) {
    this.db = new Database(filePath);
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('journal_mode = WAL');
    this.initialize();
  }

  initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        title TEXT NOT NULL CHECK(length(trim(title)) > 0),
        notes TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'done')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT
      );
      CREATE TABLE IF NOT EXISTS pomodoro_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        duration_seconds INTEGER NOT NULL CHECK(duration_seconds > 0),
        started_at TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_task ON pomodoro_sessions(task_id);
    `);
  }

  listTasks() {
    return this.db
      .prepare(
        `
      SELECT t.*, COUNT(s.id) AS session_count,
             COALESCE(SUM(s.duration_seconds), 0) AS focused_seconds
      FROM tasks t LEFT JOIN pomodoro_sessions s ON s.task_id = t.id
      GROUP BY t.id ORDER BY t.status, t.created_at
    `,
      )
      .all();
  }

  createTask({ title, parentId = null, notes = '' }) {
    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) {
      throw new Error('事项名称不能为空');
    }
    const result = this.db
      .prepare('INSERT INTO tasks (title, parent_id, notes) VALUES (?, ?, ?)')
      .run(cleanTitle, parentId, String(notes || '').trim());
    return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  }

  toggleTask(id) {
    const task = this.db.prepare('SELECT status FROM tasks WHERE id = ?').get(id);
    if (!task) {
      throw new Error('事项不存在');
    }
    const next = task.status === 'done' ? 'active' : 'done';
    this.db
      .prepare(`UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?`)
      .run(next, next === 'done' ? new Date().toISOString() : null, id);
    return { id, status: next };
  }

  deleteTask(id) {
    this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return { id };
  }

  recordSession({ taskId, durationSeconds, startedAt, note = '' }) {
    this.db
      .prepare(
        `
      INSERT INTO pomodoro_sessions
        (task_id, duration_seconds, started_at, completed_at, note)
      VALUES (?, ?, ?, ?, ?)
    `,
      )
      .run(taskId, durationSeconds, startedAt, new Date().toISOString(), note);
    return { taskId };
  }

  getSummary() {
    return this.db
      .prepare(
        `
      SELECT COUNT(*) AS sessions,
             COALESCE(SUM(duration_seconds), 0) AS seconds
      FROM pomodoro_sessions
      WHERE date(completed_at, 'localtime') = date('now', 'localtime')
    `,
      )
      .get();
  }

  close() {
    this.db.pragma('wal_checkpoint(TRUNCATE)');
    this.db.close();
  }
}

module.exports = { AppDatabase };
