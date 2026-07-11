const state = {
  tasks: [],
  duration: 25 * 60,
  remaining: 25 * 60,
  running: false,
  interval: null,
  startedAt: null,
};
const elements = {
  tree: document.querySelector('#task-tree'),
  empty: document.querySelector('#empty-state'),
  select: document.querySelector('#task-select'),
  timer: document.querySelector('#timer'),
  action: document.querySelector('#timer-action'),
  dialog: document.querySelector('#task-dialog'),
  form: document.querySelector('#task-form'),
  parentId: document.querySelector('#parent-id'),
  title: document.querySelector('#task-title'),
  notes: document.querySelector('#task-notes'),
};

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
function renderTasks() {
  const tasks = orderedTasks();
  elements.empty.hidden = tasks.length > 0;
  elements.tree.innerHTML = tasks
    .map(
      (
        task,
      ) => `<div class="task ${task.depth ? 'child' : ''} ${task.status === 'done' ? 'done' : ''}">
    <button class="status ${task.status === 'done' ? 'checked' : ''}" data-action="toggle" data-id="${task.id}" aria-label="切换完成状态"></button>
    <div><div class="task-title">${escapeHtml(task.title)}</div><div class="task-meta">${task.session_count} 个番茄 · ${formatMinutes(task.focused_seconds)} 分钟${task.notes ? ` · ${escapeHtml(task.notes)}` : ''}</div></div>
    <div class="task-actions"><button data-action="child" data-id="${task.id}">＋ 子项</button><button data-action="delete" data-id="${task.id}">删除</button></div></div>`,
    )
    .join('');
  const selected = elements.select.value;
  elements.select.innerHTML =
    '<option value="">请选择事项</option>' +
    tasks
      .filter((t) => t.status === 'active')
      .map((t) => `<option value="${t.id}">${'　'.repeat(t.depth)}${escapeHtml(t.title)}</option>`)
      .join('');
  elements.select.value = selected;
}
async function refresh() {
  state.tasks = await window.pomodoro.listTasks();
  renderTasks();
  const summary = await window.pomodoro.getSummary();
  document.querySelector('#today-summary').textContent =
    `${summary.sessions} 次 · ${formatMinutes(summary.seconds)} 分钟`;
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
  const minutes = Math.floor(state.remaining / 60);
  const seconds = state.remaining % 60;
  elements.timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  elements.action.textContent = state.running
    ? '暂停'
    : state.remaining < state.duration
      ? '继续'
      : '开始专注';
}
async function completeTimer() {
  clearInterval(state.interval);
  state.running = false;
  await window.pomodoro.recordSession({
    taskId: Number(elements.select.value),
    durationSeconds: state.duration,
    startedAt: state.startedAt,
  });
  if (Notification.permission === 'granted') {
    new Notification('番茄完成', { body: '这段专注已经记录。' });
  }
  state.remaining = state.duration;
  renderTimer();
  await refresh();
}
function toggleTimer() {
  if (!elements.select.value) {
    elements.select.focus();
    document.querySelector('#timer-hint').textContent = '请先选择一个事项。';
    return;
  }
  state.running = !state.running;
  if (state.running) {
    if (state.remaining === state.duration) {
      state.startedAt = new Date().toISOString();
    }
    state.interval = setInterval(() => {
      state.remaining -= 1;
      renderTimer();
      if (state.remaining <= 0) {
        completeTimer();
      }
    }, 1000);
  } else {
    clearInterval(state.interval);
  }
  renderTimer();
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
  if (button.dataset.action === 'delete' && window.confirm('删除该事项及其所有子项和记录？')) {
    await window.pomodoro.deleteTask(id);
    await refresh();
  }
});
document.querySelectorAll('[data-minutes]').forEach((button) =>
  button.addEventListener('click', () => {
    if (state.running) {
      return;
    }
    document
      .querySelectorAll('[data-minutes]')
      .forEach((item) => item.classList.remove('selected'));
    button.classList.add('selected');
    state.duration = Number(button.dataset.minutes) * 60;
    state.remaining = state.duration;
    renderTimer();
  }),
);
elements.action.addEventListener('click', toggleTimer);
document.querySelector('#timer-reset').addEventListener('click', () => {
  clearInterval(state.interval);
  state.running = false;
  state.remaining = state.duration;
  renderTimer();
});
if (Notification.permission === 'default') {
  Notification.requestPermission();
}
refresh();
renderTimer();
