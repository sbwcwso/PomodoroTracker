const Database = require('better-sqlite3');

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) {
    return new Date();
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function normalizedTaskTitle(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('zh-CN');
}

function getDashboardRange(period, anchorDate, weekStartDay) {
  const anchor = parseLocalDate(anchorDate);
  let start = new Date(anchor);
  let end = new Date(anchor);
  if (period === 'week') {
    const startDay = Number.isInteger(weekStartDay) ? weekStartDay : 1;
    const offset = (anchor.getDay() - startDay + 7) % 7;
    start.setDate(anchor.getDate() - offset);
    end = new Date(start);
    end.setDate(start.getDate() + 7);
  } else if (period === 'year') {
    start = new Date(anchor.getFullYear(), 0, 1);
    end = new Date(anchor.getFullYear() + 1, 0, 1);
  } else {
    end.setDate(anchor.getDate() + 1);
  }
  return { startDate: formatLocalDate(start), endDate: formatLocalDate(end) };
}

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
        focus_minutes INTEGER,
        break_minutes INTEGER,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT
      );
      CREATE TABLE IF NOT EXISTS pomodoro_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        duration_seconds INTEGER NOT NULL CHECK(duration_seconds > 0),
        started_at TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        counts_as_pomodoro INTEGER NOT NULL DEFAULT 1,
        note TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_task ON pomodoro_sessions(task_id);
      CREATE TABLE IF NOT EXISTS app_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    const taskColumns = new Set(this.db.pragma('table_info(tasks)').map((column) => column.name));
    if (!taskColumns.has('focus_minutes')) {
      this.db.exec('ALTER TABLE tasks ADD COLUMN focus_minutes INTEGER');
    }
    if (!taskColumns.has('break_minutes')) {
      this.db.exec('ALTER TABLE tasks ADD COLUMN break_minutes INTEGER');
    }
    if (!taskColumns.has('is_group')) {
      this.db.exec('ALTER TABLE tasks ADD COLUMN is_group INTEGER NOT NULL DEFAULT 0');
    }
    if (!taskColumns.has('is_default_group')) {
      this.db.exec('ALTER TABLE tasks ADD COLUMN is_default_group INTEGER NOT NULL DEFAULT 0');
    }
    const sessionColumns = new Set(
      this.db.pragma('table_info(pomodoro_sessions)').map((column) => column.name),
    );
    if (!sessionColumns.has('counts_as_pomodoro')) {
      this.db.exec(
        'ALTER TABLE pomodoro_sessions ADD COLUMN counts_as_pomodoro INTEGER NOT NULL DEFAULT 1',
      );
    }
  }

  listTasks() {
    return this.db
      .prepare(
        `
      WITH RECURSIVE task_tree(root_id, descendant_id) AS (
        SELECT id, id FROM tasks
        UNION ALL
        SELECT task_tree.root_id, child.id
        FROM task_tree
        JOIN tasks child ON child.parent_id = task_tree.descendant_id
      )
      SELECT t.*,
             COALESCE(SUM(CASE WHEN s.counts_as_pomodoro = 1 THEN 1 ELSE 0 END), 0)
               AS session_count,
             COALESCE(SUM(s.duration_seconds), 0) AS focused_seconds
      FROM tasks t
      JOIN task_tree ON task_tree.root_id = t.id
      LEFT JOIN pomodoro_sessions s ON s.task_id = task_tree.descendant_id
      GROUP BY t.id ORDER BY t.status, t.created_at
    `,
      )
      .all();
  }

  createTask({ title, parentId = null, notes = '', isGroup = false }) {
    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) {
      throw new Error('事项名称不能为空');
    }
    if (isGroup && parentId !== null) {
      throw new Error('顶层分组不能拥有父事项');
    }
    if (parentId !== null) {
      const duplicate = this.db
        .prepare('SELECT title FROM tasks WHERE parent_id = ?')
        .all(parentId)
        .some((task) => normalizedTaskTitle(task.title) === normalizedTaskTitle(cleanTitle));
      if (duplicate) {
        throw new Error('同一个父事项下不能存在同名子事项');
      }
    }
    const result = this.db
      .prepare('INSERT INTO tasks (title, parent_id, notes, is_group) VALUES (?, ?, ?, ?)')
      .run(cleanTitle, parentId, String(notes || '').trim(), isGroup ? 1 : 0);
    return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  }

  renameTask(id, title) {
    const task = this.db.prepare('SELECT id, parent_id FROM tasks WHERE id = ?').get(id);
    if (!task) {
      throw new Error('事项不存在');
    }
    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) {
      throw new Error('事项名称不能为空');
    }
    if (task.parent_id !== null) {
      const duplicate = this.db
        .prepare('SELECT id, title FROM tasks WHERE parent_id = ? AND id != ?')
        .all(task.parent_id, id)
        .some((sibling) => normalizedTaskTitle(sibling.title) === normalizedTaskTitle(cleanTitle));
      if (duplicate) {
        throw new Error('同一个父事项下不能存在同名子事项');
      }
    }
    this.db.prepare('UPDATE tasks SET title = ? WHERE id = ?').run(cleanTitle, id);
    return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  }

  migrateUiGroups({ taskGroups = [], taskGroupAssignments = {}, defaultTaskGroupId } = {}) {
    const migrated = this.db
      .prepare("SELECT value FROM app_metadata WHERE key = 'database_groups_v1'")
      .get();
    if (migrated) {
      return JSON.parse(migrated.value);
    }
    const groups =
      Array.isArray(taskGroups) && taskGroups.length > 0
        ? taskGroups
        : [{ id: 'default', name: '默认分组', collapsed: false }];
    const migrate = this.db.transaction(() => {
      const groupTaskIds = {};
      groups.forEach((group, index) => {
        const result = this.db
          .prepare(
            'INSERT INTO tasks (title, parent_id, notes, is_group, is_default_group) VALUES (?, NULL, ?, 1, ?)',
          )
          .run(
            String(group.name || '未命名分组').trim(),
            JSON.stringify({ collapsed: group.collapsed === true }),
            group.id === defaultTaskGroupId || (!defaultTaskGroupId && index === 0) ? 1 : 0,
          );
        groupTaskIds[String(group.id)] = Number(result.lastInsertRowid);
      });
      const defaultConfigId = Object.hasOwn(groupTaskIds, String(defaultTaskGroupId))
        ? String(defaultTaskGroupId)
        : String(groups[0].id);
      const roots = this.db
        .prepare('SELECT id FROM tasks WHERE parent_id IS NULL AND is_group = 0')
        .all();
      const move = this.db.prepare('UPDATE tasks SET parent_id = ? WHERE id = ?');
      roots.forEach((task) => {
        const configuredGroupId = String(taskGroupAssignments[String(task.id)] || defaultConfigId);
        move.run(groupTaskIds[configuredGroupId] || groupTaskIds[defaultConfigId], task.id);
      });
      const metadata = { groupTaskIds, defaultGroupTaskId: groupTaskIds[defaultConfigId] };
      this.db
        .prepare("INSERT INTO app_metadata (key, value) VALUES ('database_groups_v1', ?)")
        .run(JSON.stringify(metadata));
      return metadata;
    });
    return migrate();
  }

  setDefaultGroup(id) {
    const group = this.db.prepare('SELECT id FROM tasks WHERE id = ? AND is_group = 1').get(id);
    if (!group) {
      throw new Error('分组不存在');
    }
    const update = this.db.transaction(() => {
      this.db.prepare('UPDATE tasks SET is_default_group = 0 WHERE is_group = 1').run();
      this.db.prepare('UPDATE tasks SET is_default_group = 1 WHERE id = ?').run(id);
    });
    update();
    return { id };
  }

  setGroupCollapsed(id, collapsed) {
    const group = this.db.prepare('SELECT notes FROM tasks WHERE id = ? AND is_group = 1').get(id);
    if (!group) {
      throw new Error('分组不存在');
    }
    let metadata = {};
    try {
      metadata = JSON.parse(group.notes || '{}');
    } catch {
      metadata = {};
    }
    metadata.collapsed = collapsed === true;
    this.db.prepare('UPDATE tasks SET notes = ? WHERE id = ?').run(JSON.stringify(metadata), id);
    return { id, collapsed: metadata.collapsed };
  }

  moveTasks(taskIds, groupId) {
    const ids = [...new Set((Array.isArray(taskIds) ? taskIds : []).map(Number))];
    const group = this.db
      .prepare('SELECT id FROM tasks WHERE id = ? AND is_group = 1')
      .get(groupId);
    if (!group) {
      throw new Error('目标分组不存在');
    }
    const movingTasks = ids.map((id) =>
      this.db.prepare('SELECT id, title, is_group FROM tasks WHERE id = ?').get(id),
    );
    if (movingTasks.some((task) => !task || task.is_group === 1)) {
      throw new Error('只能移动普通事项');
    }
    const movingSet = new Set(ids);
    const titles = new Set(
      this.db
        .prepare('SELECT id, title FROM tasks WHERE parent_id = ?')
        .all(groupId)
        .filter((task) => !movingSet.has(task.id))
        .map((task) => normalizedTaskTitle(task.title)),
    );
    movingTasks.forEach((task) => {
      const title = normalizedTaskTitle(task.title);
      if (titles.has(title)) {
        throw new Error(`目标分组中已存在“${task.title}”`);
      }
      titles.add(title);
    });
    const move = this.db.transaction(() => {
      const statement = this.db.prepare('UPDATE tasks SET parent_id = ? WHERE id = ?');
      ids.forEach((id) => statement.run(groupId, id));
    });
    move();
    return { taskIds: ids, groupId };
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

  setTaskTimerSettings(id, { focusMinutes = null, breakMinutes = null }) {
    const normalizeMinutes = (value) => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const minutes = Number(value);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
        throw new Error('计时时长必须是 1 到 1440 之间的整数分钟');
      }
      return minutes;
    };
    const result = this.db
      .prepare('UPDATE tasks SET focus_minutes = ?, break_minutes = ? WHERE id = ?')
      .run(normalizeMinutes(focusMinutes), normalizeMinutes(breakMinutes), id);
    if (result.changes === 0) {
      throw new Error('事项不存在');
    }
    return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  }

  recordSession({ taskId, durationSeconds, startedAt, note = '', countsAsPomodoro = true }) {
    const task = this.db.prepare('SELECT is_group FROM tasks WHERE id = ?').get(taskId);
    if (!task || task.is_group === 1) {
      throw new Error('顶层分组不能直接计时');
    }
    const result = this.db
      .prepare(
        `
      INSERT INTO pomodoro_sessions
        (task_id, duration_seconds, started_at, completed_at, counts_as_pomodoro, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        taskId,
        durationSeconds,
        startedAt,
        new Date().toISOString(),
        countsAsPomodoro ? 1 : 0,
        note,
      );
    return { taskId, sessionId: Number(result.lastInsertRowid) };
  }

  updateSessionNote(sessionId, note) {
    const result = this.db.prepare('UPDATE pomodoro_sessions SET note = ? WHERE id = ?').run(
      String(note || '')
        .trim()
        .slice(0, 1000),
      sessionId,
    );
    if (result.changes === 0) {
      throw new Error('专注记录不存在');
    }
    return { sessionId };
  }

  listTaskSessions(taskId) {
    return this.db
      .prepare(
        `
      WITH RECURSIVE descendants(id) AS (
        SELECT ?
        UNION ALL
        SELECT tasks.id
        FROM tasks
        JOIN descendants ON tasks.parent_id = descendants.id
      )
      SELECT s.id, s.task_id, s.duration_seconds, s.started_at, s.completed_at, s.note,
             s.counts_as_pomodoro,
             strftime('%Y-%m-%d', s.completed_at, 'localtime') AS local_date,
             strftime('%H:%M:%S', s.started_at, 'localtime') AS local_start_time,
             strftime('%H:%M:%S', s.completed_at, 'localtime') AS local_end_time
      FROM pomodoro_sessions s
      JOIN descendants ON descendants.id = s.task_id
      ORDER BY datetime(s.completed_at) DESC, s.id DESC
    `,
      )
      .all(taskId);
  }

  getDashboardData({ period = 'day', anchorDate, weekStartDay = 1 } = {}) {
    const safePeriod = ['day', 'week', 'year'].includes(period) ? period : 'day';
    const { startDate, endDate } = getDashboardRange(safePeriod, anchorDate, weekStartDay);
    const taskStats = this.db
      .prepare(
        `
      SELECT t.id, t.parent_id, t.title,
             SUM(s.duration_seconds) AS focused_seconds,
             SUM(CASE WHEN s.counts_as_pomodoro = 1 THEN 1 ELSE 0 END)
               AS completed_pomodoros,
             SUM(CASE WHEN s.counts_as_pomodoro = 0 THEN 1 ELSE 0 END)
               AS interrupted_sessions
      FROM pomodoro_sessions s
      JOIN tasks t ON t.id = s.task_id
      WHERE date(s.completed_at, 'localtime') >= ?
        AND date(s.completed_at, 'localtime') < ?
      GROUP BY t.id
      ORDER BY focused_seconds DESC, t.id
    `,
      )
      .all(startDate, endDate);
    const bucketExpression =
      safePeriod === 'day'
        ? "strftime('%H', completed_at, 'localtime')"
        : safePeriod === 'year'
          ? "strftime('%m', completed_at, 'localtime')"
          : "strftime('%Y-%m-%d', completed_at, 'localtime')";
    const timelineStats = this.db
      .prepare(
        `
      SELECT ${bucketExpression} AS bucket,
             SUM(duration_seconds) AS focused_seconds,
             SUM(CASE WHEN counts_as_pomodoro = 1 THEN 1 ELSE 0 END)
               AS completed_pomodoros
      FROM pomodoro_sessions
      WHERE date(completed_at, 'localtime') >= ?
        AND date(completed_at, 'localtime') < ?
      GROUP BY bucket
      ORDER BY bucket
    `,
      )
      .all(startDate, endDate);
    return { period: safePeriod, startDate, endDate, taskStats, timelineStats };
  }

  getSummary() {
    return this.db
      .prepare(
        `
      SELECT COALESCE(SUM(CASE WHEN counts_as_pomodoro = 1 THEN 1 ELSE 0 END), 0) AS sessions,
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
