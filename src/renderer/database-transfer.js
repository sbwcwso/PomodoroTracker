(function initializeDatabaseTransfer(globalObject, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    globalObject.DatabaseTransfer = api;
  }
})(typeof globalThis === 'object' ? globalThis : this, () => {
  const TASK_FIELDS = [
    'id',
    'parent_id',
    'title',
    'notes',
    'status',
    'focus_minutes',
    'break_minutes',
    'sort_order',
    'created_at',
    'completed_at',
    'is_group',
    'is_default_group',
  ];
  const SESSION_FIELDS = [
    'id',
    'task_id',
    'duration_seconds',
    'started_at',
    'completed_at',
    'counts_as_pomodoro',
    'note',
  ];

  function integer(value, fallback = 0) {
    const result = Number(value);
    return Number.isInteger(result) ? result : fallback;
  }

  function optionalInteger(value) {
    return value === null || value === undefined || value === '' ? null : integer(value, null);
  }

  function normalizedTitle(value) {
    return String(value || '')
      .trim()
      .toLocaleLowerCase('zh-CN');
  }

  function normalizeTask(task) {
    const id = integer(task?.id, -1);
    const title = String(task?.title || '').trim();
    if (id < 1 || !title) {
      throw new Error('Invalid task in database');
    }
    return {
      id,
      parent_id: optionalInteger(task.parent_id),
      title,
      notes: String(task.notes || ''),
      status: task.status === 'done' ? 'done' : 'active',
      focus_minutes: optionalInteger(task.focus_minutes),
      break_minutes: optionalInteger(task.break_minutes),
      sort_order: integer(task.sort_order, id),
      created_at: String(task.created_at || new Date(0).toISOString()),
      completed_at: task.completed_at ? String(task.completed_at) : null,
      is_group: task.is_group === 1 || task.is_group === true ? 1 : 0,
      is_default_group: task.is_default_group === 1 || task.is_default_group === true ? 1 : 0,
    };
  }

  function normalizeSession(session) {
    const id = integer(session?.id, -1);
    const taskId = integer(session?.task_id, -1);
    const duration = integer(session?.duration_seconds, 0);
    if (id < 1 || taskId < 1 || duration < 1 || !session.started_at || !session.completed_at) {
      throw new Error('Invalid focus session in database');
    }
    return {
      id,
      task_id: taskId,
      duration_seconds: duration,
      started_at: String(session.started_at),
      completed_at: String(session.completed_at),
      counts_as_pomodoro:
        session.counts_as_pomodoro === 0 || session.counts_as_pomodoro === false ? 0 : 1,
      note: String(session.note || ''),
    };
  }

  function topologicalTasks(tasks) {
    const remaining = new Map(tasks.map((task) => [task.id, task]));
    const result = [];
    const added = new Set();
    while (remaining.size > 0) {
      let progressed = false;
      for (const [id, task] of remaining) {
        if (task.parent_id === null || added.has(task.parent_id)) {
          result.push(task);
          added.add(id);
          remaining.delete(id);
          progressed = true;
        }
      }
      if (!progressed) {
        throw new Error('Database contains an orphaned or circular task hierarchy');
      }
    }
    return result;
  }

  function normalizeSnapshot(snapshot) {
    const tasks = (Array.isArray(snapshot?.tasks) ? snapshot.tasks : []).map(normalizeTask);
    const ids = new Set();
    tasks.forEach((task) => {
      if (ids.has(task.id)) {
        throw new Error('Database contains duplicate task identifiers');
      }
      ids.add(task.id);
    });
    const orderedTasks = topologicalTasks(tasks);
    const sessionIds = new Set();
    const sessions = (Array.isArray(snapshot?.sessions) ? snapshot.sessions : []).map(
      normalizeSession,
    );
    sessions.forEach((session) => {
      if (sessionIds.has(session.id)) {
        throw new Error('Database contains duplicate focus-session identifiers');
      }
      if (!ids.has(session.task_id)) {
        throw new Error('Database contains a focus session without a task');
      }
      sessionIds.add(session.id);
    });
    return { tasks: orderedTasks, sessions };
  }

  function sessionInterval(session) {
    const start = Date.parse(session.started_at);
    const end = Date.parse(session.completed_at);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return null;
    }
    return { start: Math.min(start, end), end: Math.max(start, end) };
  }

  function sessionsOverlap(left, right) {
    const leftInterval = sessionInterval(left);
    const rightInterval = sessionInterval(right);
    if (!leftInterval || !rightInterval) {
      return false;
    }
    if (leftInterval.start === leftInterval.end || rightInterval.start === rightInterval.end) {
      return leftInterval.start === rightInterval.start;
    }
    return leftInterval.start < rightInterval.end && rightInterval.start < leftInterval.end;
  }

  function sessionsEqual(left, right) {
    return (
      left.task_id === right.task_id &&
      left.duration_seconds === right.duration_seconds &&
      left.started_at === right.started_at &&
      left.completed_at === right.completed_at &&
      left.counts_as_pomodoro === right.counts_as_pomodoro &&
      left.note === right.note
    );
  }

  function taskPath(taskId, taskMap) {
    const titles = [];
    const visited = new Set();
    let current = taskMap.get(taskId);
    while (current && !visited.has(current.id)) {
      titles.unshift(current.title);
      visited.add(current.id);
      current = current.parent_id === null ? null : taskMap.get(current.parent_id);
    }
    return titles.join(' / ');
  }

  function mergeSnapshots(currentSnapshot, importedSnapshot, conflictPolicy = 'keep-current') {
    if (!['keep-current', 'keep-imported'].includes(conflictPolicy)) {
      throw new Error('Unknown database conflict policy');
    }
    const current = normalizeSnapshot(currentSnapshot);
    const imported = normalizeSnapshot(importedSnapshot);
    const tasks = current.tasks.map((task) => ({ ...task }));
    const taskMap = new Map(tasks.map((task) => [task.id, task]));
    const importedTaskMap = new Map(imported.tasks.map((task) => [task.id, task]));
    const mappedTaskIds = new Map();
    let nextTaskId = Math.max(0, ...tasks.map((task) => task.id)) + 1;
    let importedTaskCount = 0;
    let matchedTaskCount = 0;

    imported.tasks.forEach((sourceTask) => {
      const parentId =
        sourceTask.parent_id === null ? null : (mappedTaskIds.get(sourceTask.parent_id) ?? null);
      const match = tasks.find(
        (task) =>
          task.parent_id === parentId &&
          task.is_group === sourceTask.is_group &&
          normalizedTitle(task.title) === normalizedTitle(sourceTask.title),
      );
      if (match) {
        mappedTaskIds.set(sourceTask.id, match.id);
        matchedTaskCount += 1;
        return;
      }
      const task = {
        ...sourceTask,
        id: nextTaskId,
        parent_id: parentId,
        is_default_group: tasks.some((entry) => entry.is_default_group === 1)
          ? 0
          : sourceTask.is_default_group,
      };
      nextTaskId += 1;
      tasks.push(task);
      taskMap.set(task.id, task);
      mappedTaskIds.set(sourceTask.id, task.id);
      importedTaskCount += 1;
    });

    let sessions = current.sessions.map((session) => ({ ...session, source: 'current' }));
    let nextSessionId = Math.max(0, ...sessions.map((session) => session.id)) + 1;
    const conflicts = [];
    let importedSessionCount = 0;
    let duplicateSessionCount = 0;
    let removedLocalSessionCount = 0;

    imported.sessions.forEach((sourceSession) => {
      const candidate = {
        ...sourceSession,
        id: nextSessionId,
        task_id: mappedTaskIds.get(sourceSession.task_id),
        source: 'imported',
      };
      if (sessions.some((session) => sessionsEqual(session, candidate))) {
        duplicateSessionCount += 1;
        return;
      }
      const localConflicts = sessions.filter(
        (session) => session.source === 'current' && sessionsOverlap(session, candidate),
      );
      if (localConflicts.length > 0) {
        const importedTask = importedTaskMap.get(sourceSession.task_id);
        conflicts.push({
          imported: {
            ...sourceSession,
            task_path: taskPath(importedTask.id, importedTaskMap),
          },
          current: localConflicts.map((session) => ({
            ...session,
            task_path: taskPath(session.task_id, taskMap),
          })),
        });
        if (conflictPolicy === 'keep-current') {
          return;
        }
        const conflictIds = new Set(localConflicts.map((session) => session.id));
        sessions = sessions.filter(
          (session) => session.source !== 'current' || !conflictIds.has(session.id),
        );
        removedLocalSessionCount += conflictIds.size;
      }
      sessions.push(candidate);
      nextSessionId += 1;
      importedSessionCount += 1;
    });

    return {
      snapshot: {
        tasks: tasks.map((task) =>
          Object.fromEntries(TASK_FIELDS.map((field) => [field, task[field]])),
        ),
        sessions: sessions.map((session) =>
          Object.fromEntries(SESSION_FIELDS.map((field) => [field, session[field]])),
        ),
      },
      summary: {
        sourceTaskCount: imported.tasks.length,
        sourceSessionCount: imported.sessions.length,
        importedTaskCount,
        matchedTaskCount,
        importedSessionCount,
        duplicateSessionCount,
        conflictCount: conflicts.length,
        removedLocalSessionCount,
      },
      conflicts,
    };
  }

  return {
    normalizeSnapshot,
    mergeSnapshots,
    sessionsOverlap,
  };
});
