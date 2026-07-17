(function installMobileBridge() {
  if (window.pomodoro) {
    return;
  }

  const STORAGE_KEY = 'pomodoro-tracker-mobile-v1';
  const TIMER_NOTIFICATION_ID = 25001;
  const COMPLETION_NOTIFICATION_ID = 25002;
  const natureSoundIds = new Set([
    'heavy-rain',
    'forest-rain',
    'stream',
    'thunderstorm',
    'wind',
    'fireplace',
    'ocean-waves',
    'forest-birds',
    'night-crickets',
    'waterfall',
  ]);
  const settingsChangedListeners = new Set();
  const popupVisibilityListeners = new Set();
  const openSettingsListeners = new Set();
  const openAboutListeners = new Set();

  function defaultSettings() {
    return {
      language: 'en-US',
      zoomFactor: 1,
      focusDurations: [25],
      breakDurations: [5],
      timerPopupAlwaysOnTop: false,
      databasePath: 'Android local storage',
      focusEndSoundPath: '',
      breakEndSoundPath: '',
      focusEndSoundUrl: '',
      breakEndSoundUrl: '',
      natureSoundsEnabled: false,
      natureSoundsMasterVolume: 35,
      natureSoundVolumes: {
        'heavy-rain': 45,
        'forest-rain': 0,
        stream: 0,
        thunderstorm: 0,
        wind: 0,
        fireplace: 0,
        'ocean-waves': 0,
        'forest-birds': 0,
        'night-crickets': 0,
        waterfall: 0,
      },
      weekStartDay: 1,
      taskGroups: [],
      defaultTaskGroupId: '',
      taskGroupAssignments: {},
    };
  }

  function initialState() {
    return {
      version: 1,
      nextTaskId: 2,
      nextSessionId: 1,
      tasks: [
        {
          id: 1,
          parent_id: null,
          title: 'Default group',
          notes: JSON.stringify({ collapsed: false }),
          status: 'active',
          focus_minutes: null,
          break_minutes: null,
          sort_order: 0,
          created_at: new Date().toISOString(),
          completed_at: null,
          is_group: 1,
          is_default_group: 1,
        },
      ],
      sessions: [],
      settings: defaultSettings(),
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.sessions)) {
        return initialState();
      }
      return {
        ...initialState(),
        ...parsed,
        settings: { ...defaultSettings(), ...(parsed.settings || {}) },
      };
    } catch {
      return initialState();
    }
  }

  const state = loadState();

  function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function publicSettings() {
    return { ...state.settings, databasePath: 'Android local storage' };
  }

  function notifySettingsChanged() {
    const settings = publicSettings();
    settingsChangedListeners.forEach((listener) => listener(settings));
    return settings;
  }

  function taskById(id) {
    return state.tasks.find((task) => task.id === Number(id));
  }

  function childTasks(parentId) {
    return state.tasks
      .filter((task) => task.parent_id === parentId)
      .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id);
  }

  function descendantIds(id, includeSelf = true) {
    const result = includeSelf ? [Number(id)] : [];
    const queue = [Number(id)];
    while (queue.length > 0) {
      const parentId = queue.shift();
      childTasks(parentId).forEach((task) => {
        result.push(task.id);
        queue.push(task.id);
      });
    }
    return result;
  }

  function ancestorIds(id, includeSelf = true) {
    const result = [];
    let task = taskById(id);
    if (!includeSelf) {
      task = taskById(task?.parent_id);
    }
    while (task) {
      result.push(task.id);
      task = taskById(task.parent_id);
    }
    return result;
  }

  function normalizeTitle(value) {
    return String(value || '')
      .trim()
      .toLocaleLowerCase('zh-CN');
  }

  function validateUniqueTitle(title, parentId, excludedId = null) {
    const normalized = normalizeTitle(title);
    const duplicate = state.tasks.some(
      (task) =>
        task.parent_id === parentId &&
        task.id !== excludedId &&
        normalizeTitle(task.title) === normalized,
    );
    if (duplicate) {
      throw new Error('Items with the same parent must have unique names');
    }
  }

  function nextSortOrder(parentId) {
    return (
      childTasks(parentId).reduce((maximum, task) => Math.max(maximum, task.sort_order), -1) + 1
    );
  }

  function formatLocalDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatLocalTime(value) {
    return new Date(value).toLocaleTimeString('en-GB', { hour12: false });
  }

  function normalizeDurations(value, fallback) {
    const values = Array.isArray(value) ? value : String(value || '').split(',');
    const durations = values
      .map((item) => Number.parseInt(item, 10))
      .filter(
        (item, index, list) => Number.isInteger(item) && item > 0 && list.indexOf(item) === index,
      )
      .slice(0, 6);
    return durations.length > 0 ? durations : [...fallback];
  }

  function dashboardRange(period, anchorDate, weekStartDay) {
    const anchor = /^\d{4}-\d{2}-\d{2}$/.test(String(anchorDate || ''))
      ? new Date(`${anchorDate}T00:00:00`)
      : new Date();
    const start = new Date(anchor);
    let end = new Date(anchor);
    if (period === 'week') {
      const offset = (start.getDay() - weekStartDay + 7) % 7;
      start.setDate(start.getDate() - offset);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    } else if (period === 'year') {
      start.setMonth(0, 1);
      end = new Date(start.getFullYear() + 1, 0, 1);
    } else {
      end.setDate(end.getDate() + 1);
    }
    return { start, end };
  }

  function notificationPlugin() {
    return window.Capacitor?.Plugins?.LocalNotifications || null;
  }

  async function ensureNotificationPermission() {
    const plugin = notificationPlugin();
    if (!plugin) {
      return null;
    }
    try {
      const current = await plugin.checkPermissions();
      if (current.display !== 'granted') {
        await plugin.requestPermissions();
      }
    } catch (error) {
      console.warn('Unable to request notification permission', error);
    }
    return plugin;
  }

  async function cancelNotification(id) {
    const plugin = notificationPlugin();
    if (!plugin) {
      return;
    }
    try {
      await plugin.cancel({ notifications: [{ id }] });
    } catch (error) {
      console.warn('Unable to cancel timer notification', error);
    }
  }

  async function scheduleTimerNotification(timer) {
    const endsAt = Number(timer?.endsAt);
    if (!Number.isFinite(endsAt) || endsAt <= Date.now()) {
      return;
    }
    const plugin = await ensureNotificationPermission();
    if (!plugin) {
      return;
    }
    await cancelNotification(TIMER_NOTIFICATION_ID);
    const chinese = state.settings.language === 'zh-CN';
    const focus = timer.phase === 'focus';
    try {
      await plugin.schedule({
        notifications: [
          {
            id: TIMER_NOTIFICATION_ID,
            title: focus
              ? chinese
                ? '专注结束'
                : 'Focus complete'
              : chinese
                ? '休息结束'
                : 'Break complete',
            body: focus
              ? chinese
                ? '这段专注已经完成，请回到番茄钟记录事项。'
                : 'Your focus session is complete. Return to add a note.'
              : chinese
                ? '可以开始下一个番茄了。'
                : 'You can start the next Pomodoro.',
            schedule: { at: new Date(endsAt), allowWhileIdle: true },
            smallIcon: 'ic_stat_pomodoro',
            iconColor: '#b65239',
          },
        ],
      });
    } catch (error) {
      console.warn('Unable to schedule timer notification', error);
    }
  }

  function listTasks() {
    return state.tasks
      .map((task) => {
        const ids = new Set(descendantIds(task.id));
        const sessions = state.sessions.filter((session) => ids.has(session.task_id));
        return {
          ...task,
          session_count: sessions.filter((session) => session.counts_as_pomodoro === 1).length,
          focused_seconds: sessions.reduce(
            (total, session) => total + Number(session.duration_seconds || 0),
            0,
          ),
        };
      })
      .sort((left, right) => left.sort_order - right.sort_order || left.id - right.id);
  }

  function createTask({ title, parentId = null, notes = '', isGroup = false }) {
    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) {
      throw new Error('Item name cannot be empty');
    }
    const normalizedParentId = parentId === null ? null : Number(parentId);
    if (isGroup && normalizedParentId !== null) {
      throw new Error('Top-level groups cannot have a parent');
    }
    if (normalizedParentId !== null && !taskById(normalizedParentId)) {
      throw new Error('Parent item does not exist');
    }
    validateUniqueTitle(cleanTitle, normalizedParentId);
    const task = {
      id: state.nextTaskId,
      parent_id: normalizedParentId,
      title: cleanTitle,
      notes: String(notes || '').trim(),
      status: 'active',
      focus_minutes: null,
      break_minutes: null,
      sort_order: nextSortOrder(normalizedParentId),
      created_at: new Date().toISOString(),
      completed_at: null,
      is_group: isGroup ? 1 : 0,
      is_default_group: 0,
    };
    state.nextTaskId += 1;
    state.tasks.push(task);
    saveState();
    return { ...task };
  }

  function renameTask(id, title) {
    const task = taskById(id);
    if (!task) {
      throw new Error('Item does not exist');
    }
    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) {
      throw new Error('Item name cannot be empty');
    }
    validateUniqueTitle(cleanTitle, task.parent_id, task.id);
    task.title = cleanTitle;
    saveState();
    return { ...task };
  }

  function setDefaultGroup(id) {
    const group = taskById(id);
    if (!group || group.is_group !== 1) {
      throw new Error('Group does not exist');
    }
    state.tasks.forEach((task) => {
      if (task.is_group === 1) {
        task.is_default_group = task.id === group.id ? 1 : 0;
      }
    });
    saveState();
    return { id: group.id };
  }

  function setGroupCollapsed(id, collapsed) {
    const group = taskById(id);
    if (!group || group.is_group !== 1) {
      throw new Error('Group does not exist');
    }
    let metadata = {};
    try {
      metadata = JSON.parse(group.notes || '{}');
    } catch {
      metadata = {};
    }
    metadata.collapsed = collapsed === true;
    group.notes = JSON.stringify(metadata);
    saveState();
    return { id: group.id, collapsed: metadata.collapsed };
  }

  function reparentTasks(taskIds, parentId) {
    const destination = taskById(parentId);
    if (!destination) {
      throw new Error('Destination item does not exist');
    }
    const requested = [...new Set((Array.isArray(taskIds) ? taskIds : []).map(Number))];
    const requestedSet = new Set(requested);
    const roots = requested.filter((id) => {
      let parent = taskById(id)?.parent_id;
      while (parent !== null && parent !== undefined) {
        if (requestedSet.has(parent)) {
          return false;
        }
        parent = taskById(parent)?.parent_id;
      }
      return true;
    });
    const moving = roots.map(taskById);
    if (moving.some((task) => !task || task.is_group === 1)) {
      throw new Error('Only regular items can be moved');
    }
    moving.forEach((task) => {
      if (descendantIds(task.id).includes(destination.id)) {
        throw new Error('An item cannot be moved into itself or one of its children');
      }
    });
    const movingIds = new Set(moving.map((task) => task.id));
    const titles = new Set(
      childTasks(destination.id)
        .filter((task) => !movingIds.has(task.id))
        .map((task) => normalizeTitle(task.title)),
    );
    moving.forEach((task) => {
      const title = normalizeTitle(task.title);
      if (titles.has(title)) {
        throw new Error(`“${task.title}” already exists at the destination`);
      }
      titles.add(title);
    });
    let order = nextSortOrder(destination.id);
    moving.forEach((task) => {
      task.parent_id = destination.id;
      task.sort_order = order;
      order += 1;
    });
    if (destination.is_group !== 1 && moving.some((task) => task.status === 'active')) {
      ancestorIds(destination.id).forEach((id) => {
        const ancestor = taskById(id);
        ancestor.status = 'active';
        ancestor.completed_at = null;
      });
    }
    saveState();
    return { taskIds: moving.map((task) => task.id), parentId: destination.id };
  }

  function toggleTask(id) {
    const task = taskById(id);
    if (!task) {
      throw new Error('Item does not exist');
    }
    const nextStatus = task.status === 'done' ? 'active' : 'done';
    const ids = nextStatus === 'done' ? descendantIds(task.id) : ancestorIds(task.id);
    const completedAt = nextStatus === 'done' ? new Date().toISOString() : null;
    ids.forEach((taskId) => {
      const current = taskById(taskId);
      current.status = nextStatus;
      current.completed_at = completedAt;
    });
    saveState();
    return { id: task.id, status: nextStatus, changed: ids.length };
  }

  function moveTask(id, direction) {
    const task = taskById(id);
    if (!task) {
      throw new Error('Item does not exist');
    }
    const siblings = childTasks(task.parent_id).filter((sibling) => sibling.status === task.status);
    const index = siblings.findIndex((sibling) => sibling.id === task.id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) {
      return {
        id: task.id,
        direction,
        moved: false,
        boundary: direction === 'up' ? 'top' : 'bottom',
      };
    }
    const target = siblings[targetIndex];
    [task.sort_order, target.sort_order] = [target.sort_order, task.sort_order];
    saveState();
    return { id: task.id, direction, moved: true };
  }

  function deleteTask(id) {
    const ids = new Set(descendantIds(id));
    state.tasks = state.tasks.filter((task) => !ids.has(task.id));
    state.sessions = state.sessions.filter((session) => !ids.has(session.task_id));
    if (!state.tasks.some((task) => task.is_group === 1)) {
      const replacement = initialState().tasks[0];
      replacement.id = state.nextTaskId;
      state.nextTaskId += 1;
      state.tasks.push(replacement);
    }
    if (!state.tasks.some((task) => task.is_default_group === 1)) {
      const firstGroup = state.tasks.find((task) => task.is_group === 1);
      firstGroup.is_default_group = 1;
    }
    saveState();
    return { id: Number(id) };
  }

  function setTaskTimerSettings(id, { focusMinutes = null, breakMinutes = null }) {
    const task = taskById(id);
    if (!task) {
      throw new Error('Item does not exist');
    }
    const normalize = (value) => {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const minutes = Number(value);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
        throw new Error('Timer duration must be an integer from 1 to 1440 minutes');
      }
      return minutes;
    };
    task.focus_minutes = normalize(focusMinutes);
    task.break_minutes = normalize(breakMinutes);
    saveState();
    return { ...task };
  }

  function recordSession({
    taskId,
    durationSeconds,
    startedAt,
    note = '',
    countsAsPomodoro = true,
  }) {
    const task = taskById(taskId);
    if (!task || task.is_group === 1) {
      throw new Error('Top-level groups cannot be timed directly');
    }
    const duration = Math.max(0, Math.floor(Number(durationSeconds) || 0));
    if (!countsAsPomodoro && duration < 30) {
      return { taskId: task.id, sessionId: null, skipped: true };
    }
    const session = {
      id: state.nextSessionId,
      task_id: task.id,
      duration_seconds: duration,
      started_at: startedAt || new Date().toISOString(),
      completed_at: new Date().toISOString(),
      counts_as_pomodoro: countsAsPomodoro ? 1 : 0,
      note: String(note || '')
        .trim()
        .slice(0, 1000),
    };
    state.nextSessionId += 1;
    state.sessions.push(session);
    saveState();
    return { taskId: task.id, sessionId: session.id, skipped: false };
  }

  function updateSessionNote(sessionId, note) {
    const session = state.sessions.find((item) => item.id === Number(sessionId));
    if (!session) {
      throw new Error('Focus record does not exist');
    }
    session.note = String(note || '')
      .trim()
      .slice(0, 1000);
    saveState();
    return { sessionId: session.id };
  }

  function sessionSearchMatcher({ query, useRegex, caseSensitive }) {
    const searchText = String(query || '').trim();
    if (!searchText) {
      return () => true;
    }
    if (useRegex) {
      let expression;
      try {
        expression = new RegExp(searchText, caseSensitive ? 'u' : 'iu');
      } catch (error) {
        throw new Error(`Invalid regular expression: ${error.message}`);
      }
      return (note) => expression.test(note);
    }
    const expected = caseSensitive ? searchText : searchText.toLocaleLowerCase('zh-CN');
    return (note) => (caseSensitive ? note : note.toLocaleLowerCase('zh-CN')).includes(expected);
  }

  function searchSessionNotes(input = {}) {
    const startDate = /^\d{4}-\d{2}-\d{2}$/.test(input.startDate) ? input.startDate : '';
    const endDate = /^\d{4}-\d{2}-\d{2}$/.test(input.endDate) ? input.endDate : '';
    if (startDate && endDate && startDate > endDate) {
      throw new Error('Start date cannot be later than end date');
    }
    const query = String(input.query || '').trim();
    if (!query && !startDate && !endDate) {
      return [];
    }
    const matches = sessionSearchMatcher(input);
    return state.sessions
      .filter((session) => session.note.trim().length > 0)
      .filter((session) => {
        const date = formatLocalDate(session.completed_at);
        return (!startDate || date >= startDate) && (!endDate || date <= endDate);
      })
      .filter((session) => matches(session.note))
      .sort(
        (left, right) => right.completed_at.localeCompare(left.completed_at) || right.id - left.id,
      )
      .slice(0, 300)
      .map((session) => ({ ...session, task_title: taskById(session.task_id)?.title || '' }));
  }

  function listTaskSessions(taskId) {
    const ids = new Set(descendantIds(taskId));
    return state.sessions
      .filter((session) => ids.has(session.task_id))
      .sort(
        (left, right) => right.completed_at.localeCompare(left.completed_at) || right.id - left.id,
      )
      .map((session) => ({
        ...session,
        local_date: formatLocalDate(session.completed_at),
        local_start_time: formatLocalTime(session.started_at),
        local_end_time: formatLocalTime(session.completed_at),
      }));
  }

  function getDashboard(input = {}) {
    const period = ['day', 'week', 'year'].includes(input.period) ? input.period : 'day';
    const { start, end } = dashboardRange(
      period,
      input.anchorDate,
      Number(state.settings.weekStartDay) || 1,
    );
    const sessions = state.sessions.filter((session) => {
      const date = new Date(session.completed_at);
      return date >= start && date < end;
    });
    const taskMap = new Map();
    sessions.forEach((session) => {
      const task = taskById(session.task_id);
      if (!taskMap.has(task.id)) {
        taskMap.set(task.id, {
          id: task.id,
          parent_id: task.parent_id,
          title: task.title,
          focused_seconds: 0,
          completed_pomodoros: 0,
          interrupted_sessions: 0,
        });
      }
      const entry = taskMap.get(task.id);
      entry.focused_seconds += session.duration_seconds;
      if (session.counts_as_pomodoro === 1) {
        entry.completed_pomodoros += 1;
      } else {
        entry.interrupted_sessions += 1;
      }
    });
    const timelineMap = new Map();
    sessions.forEach((session) => {
      const completed = new Date(session.completed_at);
      const bucket =
        period === 'day'
          ? String(completed.getHours()).padStart(2, '0')
          : period === 'year'
            ? String(completed.getMonth() + 1).padStart(2, '0')
            : formatLocalDate(completed);
      if (!timelineMap.has(bucket)) {
        timelineMap.set(bucket, { bucket, focused_seconds: 0, completed_pomodoros: 0 });
      }
      const entry = timelineMap.get(bucket);
      entry.focused_seconds += session.duration_seconds;
      entry.completed_pomodoros += session.counts_as_pomodoro === 1 ? 1 : 0;
    });
    return {
      period,
      startDate: formatLocalDate(start),
      endDate: formatLocalDate(end),
      taskStats: [...taskMap.values()].sort(
        (left, right) => right.focused_seconds - left.focused_seconds || left.id - right.id,
      ),
      timelineStats: [...timelineMap.values()].sort((left, right) =>
        left.bucket.localeCompare(right.bucket),
      ),
    };
  }

  function getSummary() {
    const today = formatLocalDate(new Date());
    const sessions = state.sessions.filter(
      (session) => formatLocalDate(session.completed_at) === today,
    );
    return {
      sessions: sessions.filter((session) => session.counts_as_pomodoro === 1).length,
      seconds: sessions.reduce((total, session) => total + session.duration_seconds, 0),
    };
  }

  function setZoomFactor(value) {
    state.settings.zoomFactor = Math.min(2, Math.max(0.5, Math.round(Number(value) * 10) / 10));
    saveState();
    return notifySettingsChanged();
  }

  function setLanguage(value) {
    state.settings.language = value === 'zh-CN' ? 'zh-CN' : 'en-US';
    saveState();
    return notifySettingsChanged();
  }

  function setDurations({ focusDurations, breakDurations }) {
    state.settings.focusDurations = normalizeDurations(focusDurations, [25]);
    state.settings.breakDurations = normalizeDurations(breakDurations, [5]);
    saveState();
    return notifySettingsChanged();
  }

  function setNatureSounds({ enabled, masterVolume, volumes }) {
    state.settings.natureSoundsEnabled = enabled === true;
    state.settings.natureSoundsMasterVolume = Math.min(
      100,
      Math.max(0, Math.round(Number(masterVolume) || 0)),
    );
    state.settings.natureSoundVolumes = Object.fromEntries(
      [...natureSoundIds].map((id) => [
        id,
        Math.min(100, Math.max(0, Math.round(Number(volumes?.[id]) || 0))),
      ]),
    );
    saveState();
    return notifySettingsChanged();
  }

  async function loadNatureSound(id) {
    if (!natureSoundIds.has(String(id))) {
      throw new Error('Unknown nature sound');
    }
    const response = await window.fetch(`assets/sounds/nature/${id}.ogg`);
    if (!response.ok) {
      throw new Error('Unable to load nature sound');
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  async function showTimerPopup(timer) {
    await scheduleTimerNotification(timer);
    popupVisibilityListeners.forEach((listener) => listener(false));
    return false;
  }

  async function hideTimerPopup() {
    await cancelNotification(TIMER_NOTIFICATION_ID);
    popupVisibilityListeners.forEach((listener) => listener(false));
    return false;
  }

  async function notifyTimerCompletion(payload = {}) {
    await cancelNotification(TIMER_NOTIFICATION_ID);
    const plugin = await ensureNotificationPermission();
    if (plugin) {
      try {
        await plugin.schedule({
          notifications: [
            {
              id: COMPLETION_NOTIFICATION_ID,
              title: String(payload.title || 'Timer finished'),
              body: String(payload.body || ''),
              schedule: { at: new Date(Date.now() + 250) },
              smallIcon: 'ic_stat_pomodoro',
              iconColor: '#b65239',
            },
          ],
        });
      } catch (error) {
        console.warn('Unable to show completion notification', error);
      }
    }
    if (payload.timer) {
      await scheduleTimerNotification(payload.timer);
    }
    return true;
  }

  async function openExternalLink(value) {
    try {
      const url = new window.URL(String(value || ''));
      if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
        return false;
      }
      const browser = window.Capacitor?.Plugins?.Browser;
      if (browser) {
        await browser.open({ url: url.href });
      } else {
        window.open(url.href, '_blank', 'noopener');
      }
      return true;
    } catch {
      return false;
    }
  }

  window.pomodoro = {
    platform: 'android',
    listTasks: async () => listTasks(),
    createTask: async (input) => createTask(input),
    renameTask: async (id, title) => renameTask(id, title),
    moveTask: async (id, direction) => moveTask(id, direction),
    setDefaultGroup: async (id) => setDefaultGroup(id),
    setGroupCollapsed: async (id, collapsed) => setGroupCollapsed(id, collapsed),
    moveTasksToGroup: async (taskIds, groupId) => reparentTasks(taskIds, groupId),
    reparentTasks: async (taskIds, parentId) => reparentTasks(taskIds, parentId),
    toggleTask: async (id) => toggleTask(id),
    deleteTask: async (id) => deleteTask(id),
    setTaskTimerSettings: async (id, input) => setTaskTimerSettings(id, input),
    recordSession: async (input) => recordSession(input),
    updateSessionNote: async (sessionId, note) => updateSessionNote(sessionId, note),
    listTaskSessions: async (taskId) => listTaskSessions(taskId),
    searchSessionNotes: async (input) => searchSessionNotes(input),
    getSummary: async () => getSummary(),
    getDashboard: async (input) => getDashboard(input),
    getSettings: async () => publicSettings(),
    setLanguage: async (value) => setLanguage(value),
    loadNatureSound,
    setZoomFactor: async (value) => setZoomFactor(value),
    setDurations: async (value) => setDurations(value),
    setTimerPopupAlwaysOnTop: async () => publicSettings(),
    setNatureSounds: async (value) => setNatureSounds(value),
    setWeekStartDay: async (value) => {
      const day = Number(value);
      state.settings.weekStartDay = Number.isInteger(day) && day >= 0 && day <= 6 ? day : 1;
      saveState();
      return notifySettingsChanged();
    },
    setTaskGrouping: async () => publicSettings(),
    chooseDatabasePath: async () => publicSettings(),
    chooseSoundPath: async () => publicSettings(),
    clearSoundPath: async () => publicSettings(),
    showTimerPopup,
    updateTimerPopup: async () => false,
    hideTimerPopup,
    resizeTimerPopup: async () => false,
    showMainWindow: async () => true,
    openExternalLink,
    notifyTimerCompletion,
    onTimerPopupUpdate: () => {},
    onTimerPopupVisibility: (callback) => popupVisibilityListeners.add(callback),
    onSettingsChanged: (callback) => settingsChangedListeners.add(callback),
    onOpenSettings: (callback) => openSettingsListeners.add(callback),
    onOpenAbout: (callback) => openAboutListeners.add(callback),
    performAppAction: async (action) => {
      if (action === 'reload') {
        window.location.reload();
      } else if (action === 'fullscreen') {
        await document.documentElement.requestFullscreen?.();
      }
    },
  };

  document.documentElement.classList.add('capacitor-platform');
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      window.dispatchEvent(new window.Event('focus'));
    }
  });
  const appPlugin = window.Capacitor?.Plugins?.App;
  appPlugin?.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      window.dispatchEvent(new window.Event('focus'));
    }
  });
})();
