const state = {
  tasks: [],
  selectedRootId: null,
  collapsedTaskIds: new Set(),
  focusDurations: [],
  breakDurations: [],
  timerMode: 'focus',
  focusDuration: 25,
  breakDuration: 5,
  activeTaskId: null,
  duration: 25 * 60,
  remaining: 25 * 60,
  running: false,
  interval: null,
  startedAt: null,
  focusEndSoundUrl: 'assets/sounds/focus-end.mp3',
  breakEndSoundUrl: 'assets/sounds/break-end.mp3',
};
const elements = {
  rootList: document.querySelector('#root-list'),
  tree: document.querySelector('#task-tree'),
  contextMenu: document.querySelector('#task-context-menu'),
  board: document.querySelector('#task-board'),
  empty: document.querySelector('#empty-state'),
  dialog: document.querySelector('#task-dialog'),
  form: document.querySelector('#task-form'),
  parentId: document.querySelector('#parent-id'),
  title: document.querySelector('#task-title'),
  notes: document.querySelector('#task-notes'),
  settingsDialog: document.querySelector('#settings-dialog'),
  settingsForm: document.querySelector('#settings-dialog form'),
  zoomRange: document.querySelector('#zoom-range'),
  zoomValue: document.querySelector('#zoom-value'),
  focusDurations: document.querySelector('#focus-durations'),
  breakDurations: document.querySelector('#break-durations'),
  timerPopupTopmost: document.querySelector('#timer-popup-topmost'),
  databasePath: document.querySelector('#database-path'),
  chooseDatabasePath: document.querySelector('#choose-database-path'),
  focusEndSound: document.querySelector('#focus-end-sound'),
  breakEndSound: document.querySelector('#break-end-sound'),
};

function showSettings(config) {
  const percent = Math.round(config.zoomFactor * 100);
  elements.zoomRange.value = percent;
  elements.zoomValue.textContent = `${percent}%`;
  elements.focusDurations.value = config.focusDurations.join(', ');
  elements.breakDurations.value = config.breakDurations.join(', ');
  elements.timerPopupTopmost.checked = config.timerPopupAlwaysOnTop;
  elements.databasePath.value = config.databasePath || '';
  elements.focusEndSound.value = config.focusEndSoundPath || '默认提示音';
  elements.breakEndSound.value = config.breakEndSoundPath || '默认提示音';
  state.focusEndSoundUrl = config.focusEndSoundUrl || 'assets/sounds/focus-end.mp3';
  state.breakEndSoundUrl = config.breakEndSoundUrl || 'assets/sounds/break-end.mp3';
  if (!elements.settingsDialog.open) {
    elements.settingsDialog.showModal();
  }
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}
function formatMinutes(seconds) {
  return Math.round(seconds / 60);
}
function orderedTasks() {
  const children = new Map();
  state.tasks.forEach((task) => {
    const key = task.parent_id || 0;
    children.set(key, [...(children.get(key) || []), task]);
  });
  const result = [];
  function walk(parentId, depth) {
    (children.get(parentId) || []).forEach((task) => {
      result.push({ ...task, depth });
      walk(task.id, depth + 1);
    });
  }
  walk(0, 0);
  return result;
}

function childMap() {
  const children = new Map();
  state.tasks.forEach((task) => {
    const key = task.parent_id || 0;
    children.set(key, [...(children.get(key) || []), task]);
  });
  return children;
}

function flattenDescendants(parentId, children, depth = 0) {
  return (children.get(parentId) || []).flatMap((task) => [
    { ...task, depth },
    ...flattenDescendants(task.id, children, depth + 1),
  ]);
}

function flattenVisibleDescendants(parentId, children, depth = 0) {
  return (children.get(parentId) || []).flatMap((task) => {
    const descendants = state.collapsedTaskIds.has(task.id)
      ? []
      : flattenVisibleDescendants(task.id, children, depth + 1);
    return [
      { ...task, depth, hasChildren: (children.get(task.id) || []).length > 0 },
      ...descendants,
    ];
  });
}

function descendantIds(parentId, children) {
  return (children.get(parentId) || []).flatMap((task) => [
    task.id,
    ...descendantIds(task.id, children),
  ]);
}

function sameDurations(first, second) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function renderTasks() {
  const tasks = orderedTasks();
  const roots = tasks.filter((task) => task.depth === 0);
  const children = childMap();
  if (!roots.some((task) => task.id === state.selectedRootId)) {
    state.selectedRootId = roots[0]?.id || null;
  }
  elements.board.hidden = false;
  elements.rootList.innerHTML = roots
    .map(
      (
        task,
      ) => `<div class="root-item ${task.id === state.selectedRootId ? 'selected' : ''} ${task.status === 'done' ? 'done' : ''}" data-root-id="${task.id}">
    <button class="root-select" data-root-select="${task.id}">
      <span>${escapeHtml(task.title)}</span>
      <small>${task.session_count} 个番茄 · ${formatMinutes(task.focused_seconds)} 分钟</small>
    </button>
    <button class="pomodoro-button" data-action="start-pomodoro" data-id="${task.id}" title="在此事项上启动番茄钟" aria-label="在 ${escapeHtml(task.title)} 上启动番茄钟">🍅</button>
  </div>`,
    )
    .join('');
  const allVisibleTasks = state.selectedRootId
    ? flattenDescendants(state.selectedRootId, children)
    : [];
  const visibleTasks = state.selectedRootId
    ? flattenVisibleDescendants(state.selectedRootId, children)
    : [];
  elements.empty.hidden = allVisibleTasks.length > 0;
  elements.tree.innerHTML = visibleTasks.length
    ? visibleTasks
        .map(
          (
            task,
          ) => `<div class="task child depth-${Math.min(task.depth, 4)} ${task.status === 'done' ? 'done' : ''}" data-task-id="${task.id}">
    <button class="status ${task.status === 'done' ? 'checked' : ''}" data-action="toggle" data-id="${task.id}" aria-label="切换完成状态"></button>
    <div><div class="task-title">${escapeHtml(task.title)}</div><div class="task-meta">${task.session_count} 个番茄 · ${formatMinutes(task.focused_seconds)} 分钟${task.notes ? ` · ${escapeHtml(task.notes)}` : ''}</div></div>
    <button class="pomodoro-button" data-action="start-pomodoro" data-id="${task.id}" title="在此事项上启动番茄钟" aria-label="在 ${escapeHtml(task.title)} 上启动番茄钟">🍅</button>
    ${
      task.hasChildren
        ? `<button class="collapse-button" data-action="collapse-one" data-id="${task.id}" aria-label="${state.collapsedTaskIds.has(task.id) ? '展开子项' : '折叠子项'}">${state.collapsedTaskIds.has(task.id) ? '▸' : '⌄'}</button>`
        : ''
    }
  </div>`,
        )
        .join('')
    : '';
}

function syncCurrentDuration() {
  if (state.running) {
    return;
  }
  state.duration = (state.timerMode === 'focus' ? state.focusDuration : state.breakDuration) * 60;
  if (!state.running) {
    state.remaining = state.duration;
  }
}

function renderDurationButtons() {
  syncCurrentDuration();
}

function taskById(id) {
  return state.tasks.find((task) => task.id === id);
}

function taskPath(id) {
  const taskMap = new Map(state.tasks.map((task) => [task.id, task]));
  const path = [];
  let current = taskMap.get(id);
  while (current) {
    path.unshift(current.title);
    current = current.parent_id ? taskMap.get(current.parent_id) : null;
  }
  return path.join(' / ');
}

function hideContextMenu() {
  elements.contextMenu.hidden = true;
  elements.contextMenu.removeAttribute('data-task-id');
}

function showContextMenu(event, taskId) {
  event.preventDefault();
  const task = taskById(taskId);
  if (!task) {
    return;
  }
  elements.contextMenu.dataset.taskId = String(taskId);
  elements.contextMenu.querySelector('[data-context-action="toggle"]').textContent =
    task.status === 'done' ? '恢复为未完成' : '标记完成';
  elements.contextMenu.hidden = false;
  const { innerWidth, innerHeight } = window;
  const rect = elements.contextMenu.getBoundingClientRect();
  elements.contextMenu.style.left = `${Math.min(event.clientX, innerWidth - rect.width - 8)}px`;
  elements.contextMenu.style.top = `${Math.min(event.clientY, innerHeight - rect.height - 8)}px`;
}

async function saveDurations() {
  const config = await window.pomodoro.setDurations({
    focusDurations: elements.focusDurations.value,
    breakDurations: elements.breakDurations.value,
  });
  showSettings(config);
  const changed =
    !sameDurations(state.focusDurations, config.focusDurations) ||
    !sameDurations(state.breakDurations, config.breakDurations);
  state.focusDurations = [...config.focusDurations];
  state.breakDurations = [...config.breakDurations];
  if (!state.focusDurations.includes(state.focusDuration)) {
    state.focusDuration = state.focusDurations[0];
  }
  if (!state.breakDurations.includes(state.breakDuration)) {
    state.breakDuration = state.breakDurations[0];
  }
  if (changed) {
    renderDurationButtons();
  }
}

async function refresh() {
  state.tasks = await window.pomodoro.listTasks();
  renderTasks();
}
function openDialog(parentId = '') {
  elements.parentId.value = parentId;
  elements.title.value = '';
  elements.notes.value = '';
  document.querySelector('#dialog-title').textContent = parentId ? '新建子项' : '新建大项';
  elements.dialog.showModal();
  elements.title.focus();
}
function renderTimer() {
  if (state.running) {
    window.pomodoro.updateTimerPopup(timerPopupState());
  }
}

function timerPopupState() {
  return {
    remaining: state.remaining,
    running: state.running,
    phase: state.timerMode,
    title: state.timerMode === 'focus' ? taskPath(state.activeTaskId) : '休息',
  };
}

function playSound(url, fallbackUrl) {
  const audio = new Audio(url);
  audio.addEventListener(
    'error',
    () => {
      if (fallbackUrl && fallbackUrl !== url) {
        new Audio(fallbackUrl).play().catch(() => {});
      }
    },
    { once: true },
  );
  audio.play().catch(() => {});
}

async function completeTimer() {
  clearInterval(state.interval);
  state.running = false;
  if (state.timerMode === 'focus') {
    await window.pomodoro.recordSession({
      taskId: state.activeTaskId,
      durationSeconds: state.duration,
      startedAt: state.startedAt,
    });
    if (Notification.permission === 'granted') {
      new Notification('番茄完成', { body: '这段专注已经记录，开始休息。' });
    }
    playSound(state.focusEndSoundUrl, 'assets/sounds/focus-end.mp3');
    await refresh();
    state.timerMode = 'break';
    state.duration = state.breakDuration * 60;
    state.remaining = state.duration;
    renderDurationButtons();
    startTimer();
    return;
  }
  if (Notification.permission === 'granted') {
    new Notification('休息结束', { body: '休息时间结束。' });
  }
  playSound(state.breakEndSoundUrl, 'assets/sounds/break-end.mp3');
  state.timerMode = 'focus';
  state.duration = state.focusDuration * 60;
  state.remaining = state.duration;
  renderTimer();
  await window.pomodoro.hideTimerPopup();
  state.activeTaskId = null;
}

function startTimer() {
  state.running = true;
  if (state.remaining === state.duration) {
    state.startedAt = new Date().toISOString();
  }
  window.pomodoro.showTimerPopup(timerPopupState());
  state.interval = setInterval(() => {
    state.remaining -= 1;
    renderTimer();
    window.pomodoro.updateTimerPopup(timerPopupState());
    if (state.remaining <= 0) {
      completeTimer();
    }
  }, 1000);
  renderTimer();
}

function startPomodoro(taskId) {
  if (state.running) {
    window.alert('当前已有番茄钟正在运行。');
    return;
  }
  state.activeTaskId = taskId;
  state.timerMode = 'focus';
  state.duration = state.focusDuration * 60;
  state.remaining = state.duration;
  state.startedAt = null;
  startTimer();
}

document.querySelector('#new-root').addEventListener('click', () => openDialog());
document.querySelector('#cancel-dialog').addEventListener('click', () => elements.dialog.close());
elements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await window.pomodoro.createTask({
    title: elements.title.value,
    notes: elements.notes.value,
    parentId: elements.parentId.value ? Number(elements.parentId.value) : null,
  });
  elements.dialog.close();
  await refresh();
});
elements.rootList.addEventListener('click', (event) => {
  const pomodoroButton = event.target.closest('button[data-action="start-pomodoro"]');
  if (pomodoroButton) {
    startPomodoro(Number(pomodoroButton.dataset.id));
    return;
  }
  const button = event.target.closest('button[data-root-select]');
  if (!button) {
    return;
  }
  state.selectedRootId = Number(button.dataset.rootSelect);
  renderTasks();
});
elements.rootList.addEventListener('contextmenu', (event) => {
  const item = event.target.closest('[data-root-id]');
  if (!item) {
    return;
  }
  state.selectedRootId = Number(item.dataset.rootId);
  renderTasks();
  showContextMenu(event, Number(item.dataset.rootId));
});
elements.tree.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }
  const id = Number(button.dataset.id);
  if (button.dataset.action === 'child') {
    openDialog(id);
  }
  if (button.dataset.action === 'toggle') {
    await window.pomodoro.toggleTask(id);
    await refresh();
  }
  if (button.dataset.action === 'collapse-one') {
    if (state.collapsedTaskIds.has(id)) {
      state.collapsedTaskIds.delete(id);
    } else {
      state.collapsedTaskIds.add(id);
    }
    renderTasks();
  }
  if (button.dataset.action === 'start-pomodoro') {
    startPomodoro(id);
  }
  if (button.dataset.action === 'delete' && window.confirm('删除该事项及其所有子项和记录？')) {
    await window.pomodoro.deleteTask(id);
    await refresh();
  }
});
elements.tree.addEventListener('contextmenu', (event) => {
  const item = event.target.closest('.task[data-task-id]');
  if (!item) {
    return;
  }
  showContextMenu(event, Number(item.dataset.taskId));
});
elements.contextMenu.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-context-action]');
  if (!button) {
    return;
  }
  const id = Number(elements.contextMenu.dataset.taskId);
  hideContextMenu();
  if (button.dataset.contextAction === 'child') {
    openDialog(id);
  }
  if (button.dataset.contextAction === 'toggle') {
    await window.pomodoro.toggleTask(id);
    await refresh();
  }
  if (button.dataset.contextAction === 'expand') {
    descendantIds(id, childMap()).forEach((taskId) => state.collapsedTaskIds.delete(taskId));
    state.collapsedTaskIds.delete(id);
    renderTasks();
  }
  if (button.dataset.contextAction === 'collapse') {
    const children = childMap();
    [id, ...descendantIds(id, children)].forEach((taskId) => {
      if ((children.get(taskId) || []).length > 0) {
        state.collapsedTaskIds.add(taskId);
      }
    });
    renderTasks();
  }
  if (
    button.dataset.contextAction === 'delete' &&
    window.confirm('删除该事项及其所有子项和记录？')
  ) {
    await window.pomodoro.deleteTask(id);
    await refresh();
  }
});
if (Notification.permission === 'default') {
  Notification.requestPermission();
}
elements.zoomRange.addEventListener('input', async () => {
  const config = await window.pomodoro.setZoomFactor(Number(elements.zoomRange.value) / 100);
  showSettings(config);
});
elements.focusDurations.addEventListener('change', saveDurations);
elements.breakDurations.addEventListener('change', saveDurations);
elements.timerPopupTopmost.addEventListener('change', async () => {
  showSettings(await window.pomodoro.setTimerPopupAlwaysOnTop(elements.timerPopupTopmost.checked));
});
elements.chooseDatabasePath.addEventListener('click', async () => {
  showSettings(await window.pomodoro.chooseDatabasePath());
  await refresh();
});
document.querySelectorAll('[data-sound-action]').forEach((button) => {
  button.addEventListener('click', async () => {
    const action = button.dataset.soundAction;
    const kind = button.dataset.soundKind;
    const config =
      action === 'choose'
        ? await window.pomodoro.chooseSoundPath(kind)
        : await window.pomodoro.clearSoundPath(kind);
    showSettings(config);
  });
});
elements.settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await saveDurations();
  elements.settingsDialog.close();
});
window.pomodoro.onSettingsChanged((config) => {
  const percent = Math.round(config.zoomFactor * 100);
  elements.zoomRange.value = percent;
  elements.zoomValue.textContent = `${percent}%`;
  elements.focusDurations.value = config.focusDurations.join(', ');
  elements.breakDurations.value = config.breakDurations.join(', ');
  elements.timerPopupTopmost.checked = config.timerPopupAlwaysOnTop;
  elements.databasePath.value = config.databasePath || '';
  elements.focusEndSound.value = config.focusEndSoundPath || '默认提示音';
  elements.breakEndSound.value = config.breakEndSoundPath || '默认提示音';
  state.focusEndSoundUrl = config.focusEndSoundUrl || 'assets/sounds/focus-end.mp3';
  state.breakEndSoundUrl = config.breakEndSoundUrl || 'assets/sounds/break-end.mp3';
  if (!sameDurations(state.focusDurations, config.focusDurations)) {
    state.focusDurations = [...config.focusDurations];
    if (!state.focusDurations.includes(state.focusDuration)) {
      state.focusDuration = state.focusDurations[0];
    }
  }
  if (!sameDurations(state.breakDurations, config.breakDurations)) {
    state.breakDurations = [...config.breakDurations];
    if (!state.breakDurations.includes(state.breakDuration)) {
      state.breakDuration = state.breakDurations[0];
    }
  }
  renderDurationButtons();
});
window.pomodoro.onOpenSettings(async () => showSettings(await window.pomodoro.getSettings()));
window.pomodoro.onOpenAbout(() => document.querySelector('#about-dialog').showModal());
document.querySelector('.app-menu').addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) {
    return;
  }
  if (button.dataset.menuAction === 'settings') {
    showSettings(await window.pomodoro.getSettings());
  }
  if (button.dataset.menuAction === 'about') {
    document.querySelector('#about-dialog').showModal();
  }
  if (button.dataset.appAction) {
    await window.pomodoro.performAppAction(button.dataset.appAction);
  }
  if (button.dataset.editCommand) {
    document.execCommand(button.dataset.editCommand);
  }
  if (button.dataset.zoomDelta) {
    const config = await window.pomodoro.getSettings();
    await window.pomodoro.setZoomFactor(config.zoomFactor + Number(button.dataset.zoomDelta));
  }
  if (button.hasAttribute('data-zoom-reset')) {
    await window.pomodoro.setZoomFactor(1);
  }
  button.closest('details')?.removeAttribute('open');
});
document.querySelectorAll('.menu-group').forEach((menu) => {
  menu.addEventListener('toggle', () => {
    if (!menu.open) {
      return;
    }
    document.querySelectorAll('.menu-group').forEach((other) => {
      if (other !== menu) {
        other.removeAttribute('open');
      }
    });
  });
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('#task-context-menu')) {
    hideContextMenu();
  }
  if (!event.target.closest('.app-menu')) {
    document.querySelectorAll('.menu-group').forEach((menu) => menu.removeAttribute('open'));
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideContextMenu();
  }
});
document.addEventListener('scroll', hideContextMenu, true);
window.pomodoro.getSettings().then((config) => {
  state.focusDurations = [...config.focusDurations];
  state.breakDurations = [...config.breakDurations];
  state.focusDuration = state.focusDurations.includes(25) ? 25 : state.focusDurations[0];
  state.breakDuration = state.breakDurations[0];
  renderDurationButtons();
});
refresh();
