(function initializeMobileDatabaseTransfer() {
  let sqlPromise = null;

  function getSql() {
    if (!sqlPromise) {
      if (typeof window.initSqlJs !== 'function') {
        throw new Error('SQLite engine is unavailable');
      }
      sqlPromise = window.initSqlJs({
        locateFile: (file) => `vendor/sql.js/${file}`,
      });
    }
    return sqlPromise;
  }

  function rows(result) {
    const table = result?.[0];
    if (!table) {
      return [];
    }
    return table.values.map((values) =>
      Object.fromEntries(table.columns.map((column, index) => [column, values[index]])),
    );
  }

  async function readSnapshot(bytes) {
    const SQL = await getSql();
    const database = new SQL.Database(bytes);
    try {
      const tables = new Set(
        rows(database.exec("SELECT name FROM sqlite_master WHERE type = 'table'")).map(
          (entry) => entry.name,
        ),
      );
      if (!tables.has('tasks') || !tables.has('pomodoro_sessions')) {
        throw new Error('所选文件不是番茄钟数据库');
      }
      return window.DatabaseTransfer.normalizeSnapshot({
        tasks: rows(database.exec('SELECT * FROM tasks ORDER BY id')),
        sessions: rows(database.exec('SELECT * FROM pomodoro_sessions ORDER BY id')),
      });
    } finally {
      database.close();
    }
  }

  async function writeSnapshot(snapshot) {
    const SQL = await getSql();
    const normalized = window.DatabaseTransfer.normalizeSnapshot(snapshot);
    const database = new SQL.Database();
    try {
      database.run(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          parent_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          notes TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'active',
          focus_minutes INTEGER,
          break_minutes INTEGER,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          completed_at TEXT,
          is_group INTEGER NOT NULL DEFAULT 0,
          is_default_group INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE pomodoro_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          duration_seconds INTEGER NOT NULL,
          started_at TEXT NOT NULL,
          completed_at TEXT NOT NULL,
          counts_as_pomodoro INTEGER NOT NULL DEFAULT 1,
          note TEXT NOT NULL DEFAULT ''
        );
        CREATE INDEX idx_tasks_parent ON tasks(parent_id);
        CREATE INDEX idx_sessions_task ON pomodoro_sessions(task_id);
        CREATE TABLE app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      `);
      const taskStatement = database.prepare(`
        INSERT INTO tasks
          (id, parent_id, title, notes, status, focus_minutes, break_minutes, sort_order,
           created_at, completed_at, is_group, is_default_group)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      normalized.tasks.forEach((task) => {
        taskStatement.run([
          task.id,
          task.parent_id,
          task.title,
          task.notes,
          task.status,
          task.focus_minutes,
          task.break_minutes,
          task.sort_order,
          task.created_at,
          task.completed_at,
          task.is_group,
          task.is_default_group,
        ]);
      });
      taskStatement.free();
      const sessionStatement = database.prepare(`
        INSERT INTO pomodoro_sessions
          (id, task_id, duration_seconds, started_at, completed_at, counts_as_pomodoro, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      normalized.sessions.forEach((session) => {
        sessionStatement.run([
          session.id,
          session.task_id,
          session.duration_seconds,
          session.started_at,
          session.completed_at,
          session.counts_as_pomodoro,
          session.note,
        ]);
      });
      sessionStatement.free();
      return database.export();
    } finally {
      database.close();
    }
  }

  function pickDatabaseFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.sqlite3,.sqlite,.db,application/vnd.sqlite3,application/octet-stream';
      input.hidden = true;
      document.body.append(input);
      let settled = false;
      const finish = (file) => {
        if (settled) {
          return;
        }
        settled = true;
        window.removeEventListener('focus', handleFocus);
        input.remove();
        resolve(file || null);
      };
      const handleFocus = () => window.setTimeout(() => finish(input.files?.[0]), 500);
      input.addEventListener('change', () => finish(input.files?.[0]), { once: true });
      window.addEventListener('focus', handleFocus, { once: true });
      input.click();
    });
  }

  function bytesToBase64(bytes) {
    const chunks = [];
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + chunkSize)));
    }
    return window.btoa(chunks.join(''));
  }

  async function exportSnapshot(snapshot) {
    const bytes = await writeSnapshot(snapshot);
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `pomodoro-mobile-${date}.sqlite3`;
    const filesystem = window.Capacitor?.Plugins?.Filesystem;
    const share = window.Capacitor?.Plugins?.Share;
    if (filesystem && share) {
      const result = await filesystem.writeFile({
        path: fileName,
        data: bytesToBase64(bytes),
        directory: 'CACHE',
      });
      await share.share({
        title: window.i18n?.t('导出番茄钟数据库') || 'Export Pomodoro database',
        dialogTitle: window.i18n?.t('保存或分享数据库') || 'Save or share database',
        files: [result.uri],
      });
      return { canceled: false, fileName };
    }
    const link = document.createElement('a');
    link.download = fileName;
    link.href = URL.createObjectURL(new window.Blob([bytes], { type: 'application/vnd.sqlite3' }));
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    return { canceled: false, fileName };
  }

  window.MobileDatabaseTransfer = {
    readSnapshot,
    writeSnapshot,
    exportSnapshot,
    pickAndReadSnapshot: async () => {
      const file = await pickDatabaseFile();
      if (!file) {
        return null;
      }
      const snapshot = await readSnapshot(new Uint8Array(await file.arrayBuffer()));
      return { fileName: file.name, snapshot };
    },
  };
})();
