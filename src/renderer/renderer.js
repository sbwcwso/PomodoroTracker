const state = {
  tasks: [],
  selectedRootId: null,
  collapsedTaskIds: new Set(),
  currentView: 'tasks',
  dashboardPeriod: 'day',
  dashboardAnchorDate: '',
  dashboardSelection: null,
  dashboardTotalSeconds: 0,
  taskGroups: [{ id: 'default', name: '默认分组', collapsed: false }],
  defaultTaskGroupId: 'default',
  groupSelectionMode: false,
  selectedGroupIds: new Set(),
  selectedTaskIds: new Set(),
  pendingRootGroupId: 'default',
  editingGroupId: null,
  editingTaskId: null,
  draggedTaskIds: [],
  focusDurations: [],
  breakDurations: [],
  timerMode: 'focus',
  focusDuration: 25,
  breakDuration: 5,
  activeFocusDuration: 25,
  activeBreakDuration: 5,
  activeTaskId: null,
  completedSessionId: null,
  pendingNoteSessionId: null,
  historyTaskId: null,
  historySessions: new Map(),
  duration: 25 * 60,
  remaining: 25 * 60,
  running: false,
  timerPopupOpen: false,
  interval: null,
  startedAt: null,
  focusEndSoundUrl: 'assets/sounds/focus-end.mp3',
  breakEndSoundUrl: 'assets/sounds/break-end.mp3',
};
const elements = {
  rootList: document.querySelector('#root-list'),
  addGroup: document.querySelector('#add-group'),
  collapseGroups: document.querySelector('#collapse-groups'),
  selectGroups: document.querySelector('#select-groups'),
  deleteGroups: document.querySelector('#delete-groups'),
  groupDialog: document.querySelector('#group-dialog'),
  groupForm: document.querySelector('#group-form'),
  groupName: document.querySelector('#group-name'),
  groupDialogTitle: document.querySelector('#group-dialog-title'),
  groupSubmit: document.querySelector('#group-submit'),
  tree: document.querySelector('#task-tree'),
  contextMenu: document.querySelector('#task-context-menu'),
  board: document.querySelector('#task-board'),
  tasksView: document.querySelector('#tasks-view'),
  dashboardView: document.querySelector('#dashboard-view'),
  dashboardDate: document.querySelector('#dashboard-date'),
  dashboardTitle: document.querySelector('#dashboard-title'),
  dashboardDateLabel: document.querySelector('#dashboard-date-label'),
  dashboardAnchorDate: document.querySelector('#dashboard-anchor-date'),
  dashboardDepth: document.querySelector('#dashboard-depth'),
  dashboardToday: document.querySelector('#dashboard-today'),
  dashboardAllocationDescription: document.querySelector('#dashboard-allocation-description'),
  dashboardTrendTitle: document.querySelector('#dashboard-trend-title'),
  dashboardTrendDescription: document.querySelector('#dashboard-trend-description'),
  dashboardTotalTime: document.querySelector('#dashboard-total-time'),
  dashboardTotalLabel: document.querySelector('#dashboard-total-label'),
  dashboardCompletedCount: document.querySelector('#dashboard-completed-count'),
  dashboardInterruptedCount: document.querySelector('#dashboard-interrupted-count'),
  dashboardDonut: document.querySelector('#dashboard-donut'),
  dashboardLegend: document.querySelector('#dashboard-legend'),
  dashboardTrend: document.querySelector('#dashboard-trend'),
  donutTotal: document.querySelector('#donut-total'),
  donutUnit: document.querySelector('#donut-unit'),
  empty: document.querySelector('#empty-state'),
  dialog: document.querySelector('#task-dialog'),
  form: document.querySelector('#task-form'),
  parentId: document.querySelector('#parent-id'),
  title: document.querySelector('#task-title'),
  notes: document.querySelector('#task-notes'),
  notesLabel: document.querySelector('#task-notes-label'),
  taskSubmit: document.querySelector('#task-submit'),
  taskTimerDialog: document.querySelector('#task-timer-dialog'),
  taskTimerForm: document.querySelector('#task-timer-form'),
  taskTimerId: document.querySelector('#task-timer-id'),
  taskTimerName: document.querySelector('#task-timer-name'),
  taskFocusMinutes: document.querySelector('#task-focus-minutes'),
  taskBreakMinutes: document.querySelector('#task-break-minutes'),
  taskHistoryDialog: document.querySelector('#task-history-dialog'),
  taskHistoryTitle: document.querySelector('#task-history-title'),
  taskHistoryContent: document.querySelector('#task-history-content'),
  interruptConfirmDialog: document.querySelector('#interrupt-confirm-dialog'),
  interruptConfirmTitle: document.querySelector('#interrupt-confirm-title'),
  interruptConfirmMessage: document.querySelector('#interrupt-confirm-message'),
  actionDialog: document.querySelector('#action-dialog'),
  actionDialogEyebrow: document.querySelector('#action-dialog-eyebrow'),
  actionDialogTitle: document.querySelector('#action-dialog-title'),
  actionDialogMessage: document.querySelector('#action-dialog-message'),
  actionDialogDetail: document.querySelector('#action-dialog-detail'),
  actionDialogCancel: document.querySelector('#action-dialog-cancel'),
  actionDialogConfirm: document.querySelector('#action-dialog-confirm'),
  sessionNoteDialog: document.querySelector('#session-note-dialog'),
  sessionNoteForm: document.querySelector('#session-note-form'),
  sessionNoteHeading: document.querySelector('#session-note-heading'),
  sessionNoteTask: document.querySelector('#session-note-task'),
  sessionNote: document.querySelector('#session-note'),
  skipSessionNote: document.querySelector('#skip-session-note'),
  settingsDialog: document.querySelector('#settings-dialog'),
  settingsForm: document.querySelector('#settings-dialog form'),
  zoomRange: document.querySelector('#zoom-range'),
  zoomValue: document.querySelector('#zoom-value'),
  focusDurations: document.querySelector('#focus-durations'),
  breakDurations: document.querySelector('#break-durations'),
  weekStartDay: document.querySelector('#week-start-day'),
  timerPopupTopmost: document.querySelector('#timer-popup-topmost'),
  databasePath: document.querySelector('#database-path'),
  chooseDatabasePath: document.querySelector('#choose-database-path'),
  activeTimer: document.querySelector('#active-timer'),
  activeTimerPhase: document.querySelector('#active-timer-phase'),
  activeTimerTitle: document.querySelector('#active-timer-title'),
  activeTimerTime: document.querySelector('#active-timer-time'),
  openTimerPopup: document.querySelector('#open-timer-popup'),
  interruptTimer: document.querySelector('#interrupt-timer'),
  focusEndSound: document.querySelector('#focus-end-sound'),
  breakEndSound: document.querySelector('#break-end-sound'),
};

function showSettings(config) {
  const percent = Math.round(config.zoomFactor * 100);
  elements.zoomRange.value = percent;
  elements.zoomValue.textContent = `${percent}%`;
  elements.focusDurations.value = config.focusDurations.join(', ');
  elements.breakDurations.value = config.breakDurations.join(', ');
  elements.weekStartDay.value = String(config.weekStartDay ?? 1);
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
function formatTime(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
function formatRecordedDuration(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  return hours > 0 ? `${hours} 小时 ${minutes} 分` : `${minutes} 分 ${rest} 秒`;
}
function formatCompactDuration(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  if (safeSeconds < 60) {
    return `${safeSeconds} 秒`;
  }
  if (safeSeconds === 3600) {
    return '1 小时';
  }
  if (safeSeconds > 3600) {
    return `${(safeSeconds / 3600).toFixed(1)} 小时`;
  }
  return `${Math.floor(safeSeconds / 60)} 分钟`;
}

function chartScale(maxSeconds) {
  const safeMax = Math.max(1, Number(maxSeconds) || 0);
  const targetStep = safeMax / 5;
  const steps = [300, 600, 900, 1800, 3600, 5400, 7200, 10800, 21600, 43200, 86400];
  let step = steps.find((candidate) => candidate >= targetStep);
  if (!step) {
    step = Math.ceil(targetStep / 86400) * 86400;
  }
  const maximum = Math.max(step, Math.ceil(safeMax / step) * step);
  const ticks = [];
  for (let value = maximum; value >= 0; value -= step) {
    ticks.push(value);
  }
  return { maximum, ticks };
}
function formatHistoryDate(date) {
  const [year, month, day] = String(date)
    .split('-')
    .map((value) => Number(value));
  if (!year || !month || !day) {
    return '日期未知';
  }
  return new Date(year, month - 1, day).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
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

function taskTimerSummary(task) {
  if (task.focus_minutes === null && task.break_minutes === null) {
    return '';
  }
  return ` · 专属 ${task.focus_minutes ?? state.focusDuration}/${task.break_minutes ?? state.breakDuration} 分钟`;
}

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromValue(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function dashboardRangeLabel(period, startDate, endDate) {
  const start = dateFromValue(startDate);
  const end = dateFromValue(endDate);
  end.setDate(end.getDate() - 1);
  if (period === 'day') {
    return start.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  }
  if (period === 'year') {
    return `${start.getFullYear()} 年`;
  }
  const options = { month: 'long', day: 'numeric' };
  return `${start.toLocaleDateString('zh-CN', options)} – ${end.toLocaleDateString('zh-CN', options)}`;
}

function buildDashboardTree(taskStats) {
  const stats = new Map(taskStats.map((item) => [item.id, item]));
  const nodes = new Map(
    state.tasks.map((task) => [
      task.id,
      {
        id: task.id,
        title: task.title,
        parentId: task.parent_id,
        ownSeconds: stats.get(task.id)?.focused_seconds || 0,
        children: [],
        totalSeconds: 0,
      },
    ]),
  );
  const roots = [];
  nodes.forEach((node) => {
    const parent = nodes.get(node.parentId);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  function calculate(node) {
    node.totalSeconds =
      node.ownSeconds + node.children.reduce((sum, child) => sum + calculate(child), 0);
    return node.totalSeconds;
  }
  roots.forEach(calculate);
  return roots.filter((node) => node.totalSeconds > 0);
}

function dashboardRings(roots, requestedDepth) {
  function treeDepth(node) {
    const activeChildren = node.children.filter((child) => child.totalSeconds > 0);
    return activeChildren.length > 0 ? 1 + Math.max(...activeChildren.map(treeDepth)) : 1;
  }
  const availableDepth = roots.length > 0 ? Math.max(...roots.map(treeDepth)) : 1;
  const ringCount =
    requestedDepth === 'all' ? availableDepth : Math.min(Number(requestedDepth), availableDepth);
  let current = roots.map((node, rootIndex) => ({
    node,
    rootIndex,
    label: node.title,
    seconds: node.totalSeconds,
  }));
  const rings = [];
  for (let level = 0; level < ringCount; level += 1) {
    rings.push(current);
    current = current.flatMap((segment) => {
      if (!segment.node) {
        return [segment];
      }
      const children = segment.node.children.filter((child) => child.totalSeconds > 0);
      if (children.length === 0) {
        return [{ ...segment, node: null }];
      }
      const next = [];
      if (segment.node.ownSeconds > 0) {
        next.push({
          node: null,
          rootIndex: segment.rootIndex,
          label: `${segment.label}（自身）`,
          seconds: segment.node.ownSeconds,
        });
      }
      children.forEach((child) => {
        next.push({
          node: child,
          rootIndex: segment.rootIndex,
          label: `${segment.label} / ${child.title}`,
          seconds: child.totalSeconds,
        });
      });
      return next;
    });
  }
  return rings;
}

function dashboardSegmentColor(segment, level, index) {
  const hues = [12, 104, 205, 292, 38, 165, 338, 66];
  const hue = hues[segment.rootIndex % hues.length];
  const lightness = Math.min(70, 43 + level * 8 + ((index * 5) % 11));
  return `hsl(${hue} 42% ${lightness}%)`;
}

function buildTimeline(period, startDate, timelineStats) {
  const values = new Map(timelineStats.map((item) => [item.bucket, item.focused_seconds]));
  if (period === 'day') {
    return Array.from({ length: 6 }, (_, index) => {
      const hour = index * 4;
      const seconds = Array.from({ length: 4 }, (_, offset) => hour + offset).reduce(
        (sum, value) => sum + (values.get(String(value).padStart(2, '0')) || 0),
        0,
      );
      return { label: `${String(hour).padStart(2, '0')}:00`, sublabel: '', seconds };
    });
  }
  if (period === 'year') {
    return Array.from({ length: 12 }, (_, index) => ({
      label: `${index + 1} 月`,
      sublabel: '',
      seconds: values.get(String(index + 1).padStart(2, '0')) || 0,
    }));
  }
  const start = dateFromValue(startDate);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const value = localDateValue(date);
    return {
      label: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
      sublabel: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`,
      seconds: values.get(value) || 0,
    };
  });
}

async function renderDashboard() {
  state.dashboardSelection = null;
  if (!state.dashboardAnchorDate) {
    state.dashboardAnchorDate = localDateValue();
    elements.dashboardAnchorDate.value = state.dashboardAnchorDate;
  }
  const data = await window.pomodoro.getDashboard({
    period: state.dashboardPeriod,
    anchorDate: state.dashboardAnchorDate,
  });
  const { taskStats, timelineStats, startDate, endDate, period } = data;
  const totalSeconds = taskStats.reduce((sum, item) => sum + item.focused_seconds, 0);
  state.dashboardTotalSeconds = totalSeconds;
  const completedCount = taskStats.reduce((sum, item) => sum + item.completed_pomodoros, 0);
  const interruptedCount = taskStats.reduce((sum, item) => sum + item.interrupted_sessions, 0);
  const periodNames = { day: '日看板', week: '周看板', year: '年看板' };
  elements.dashboardTitle.textContent = periodNames[period];
  elements.dashboardTotalLabel.textContent =
    period === 'day' ? '当日专注' : period === 'week' ? '本周专注' : '全年专注';
  elements.dashboardDate.textContent = dashboardRangeLabel(period, startDate, endDate);
  elements.dashboardDateLabel.textContent =
    period === 'day' ? '选择日期' : period === 'week' ? '选择周内日期' : '选择年内日期';
  elements.dashboardTotalTime.textContent = formatCompactDuration(totalSeconds);
  elements.dashboardCompletedCount.textContent = completedCount;
  elements.dashboardInterruptedCount.textContent = interruptedCount;

  const roots = buildDashboardTree(taskStats);
  const rings = dashboardRings(roots, elements.dashboardDepth.value);
  const ringCount = rings.length;
  elements.dashboardAllocationDescription.textContent =
    ringCount > 1
      ? `内圈是顶层事项，外圈展开到第 ${ringCount} 层，子项保持在所属父项扇区内`
      : '按顶层事项汇总所有后代条目的专注时间';
  const radiusStep = ringCount > 1 ? 76 / (ringCount - 1) : 0;
  const strokeWidth = ringCount > 1 ? Math.max(13, Math.min(24, radiusStep * 0.72)) : 30;
  const tracks = rings
    .map((_, level) => {
      const radius = ringCount === 1 ? 104 : 66 + radiusStep * level;
      return `<circle class="donut-track" cx="160" cy="160" r="${radius}" data-stroke-width="${strokeWidth}"></circle>`;
    })
    .join('');
  const slices = rings
    .flatMap((ring, level) => {
      let offset = 0;
      const radius = ringCount === 1 ? 104 : 66 + radiusStep * level;
      return ring.map((segment, index) => {
        const percent = totalSeconds > 0 ? (segment.seconds / totalSeconds) * 100 : 0;
        const color = dashboardSegmentColor(segment, level, index);
        const markup = `<circle class="donut-slice" cx="160" cy="160" r="${radius}" pathLength="100" stroke="${color}" data-stroke-width="${strokeWidth}" data-segment-key="${escapeHtml(segment.label)}" data-segment-seconds="${segment.seconds}" data-level="${level}" data-radius="${radius}" data-start="${offset}" data-percent="${percent}" data-color="${color}" stroke-dasharray="${percent} ${100 - percent}" stroke-dashoffset="${-offset}"><title>${escapeHtml(segment.label)}：${formatCompactDuration(segment.seconds)}（${percent.toFixed(1)}%）</title></circle>`;
        offset += percent;
        return markup;
      });
    })
    .join('');
  elements.dashboardDonut.innerHTML = `${tracks}${slices}<g class="donut-selection-guide" aria-hidden="true"></g>`;
  elements.dashboardDonut.querySelectorAll('[data-stroke-width]').forEach((circle) => {
    circle.style.strokeWidth = `${circle.dataset.strokeWidth}px`;
  });
  updateDonutCenter(totalSeconds);
  const legendSegments = rings.at(-1) || [];
  elements.dashboardLegend.innerHTML = legendSegments.length
    ? legendSegments
        .map((segment, index) => {
          const percent = (segment.seconds / totalSeconds) * 100;
          const color = dashboardSegmentColor(segment, ringCount - 1, index);
          return `<button class="dashboard-legend__item" type="button" data-segment-key="${escapeHtml(segment.label)}" aria-pressed="false">
            <span class="dashboard-legend__swatch" data-color="${color}"></span>
            <span class="dashboard-legend__label" title="${escapeHtml(segment.label)}">${escapeHtml(segment.label)}</span>
            <strong>${formatCompactDuration(segment.seconds)}</strong>
            <span>${percent.toFixed(0)}%</span>
          </button>`;
        })
        .join('')
    : '<div class="dashboard-empty">所选时间没有专注记录</div>';
  elements.dashboardLegend.querySelectorAll('[data-color]').forEach((swatch) => {
    swatch.style.backgroundColor = swatch.dataset.color;
  });

  const timeline = buildTimeline(period, startDate, timelineStats);
  const maxSeconds = Math.max(...timeline.map((item) => item.seconds), 1);
  const scale = chartScale(maxSeconds);
  elements.dashboardTrendTitle.textContent =
    period === 'day' ? '当日时段分布' : period === 'week' ? '本周每日专注' : '全年月度趋势';
  elements.dashboardTrendDescription.textContent =
    period === 'day'
      ? '每 4 小时汇总，包含被打断时已完成的时间'
      : period === 'week'
        ? '按设置的每周起始日展示 7 天'
        : '按月汇总全年实际专注时间';
  const isDayTimeline = period === 'day';
  const dayBoundaries = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
  const bars = timeline
    .map((item) => {
      const height = item.seconds > 0 ? Math.max(6, (item.seconds / scale.maximum) * 100) : 0;
      return `<div class="trend-day${isDayTimeline ? ' trend-day--interval' : ''}">
        <span class="trend-day__value">${formatCompactDuration(item.seconds)}</span>
        <div class="trend-day__track"><span class="trend-day__bar" data-height="${height}"></span></div>
        ${isDayTimeline ? '' : `<strong>${item.label}</strong><span>${item.sublabel}</span>`}
      </div>`;
    })
    .join('');
  elements.dashboardTrend.innerHTML = `
    <div class="trend-y-axis" aria-hidden="true">${scale.ticks.map((value) => `<span>${formatCompactDuration(value)}</span>`).join('')}</div>
    <div class="trend-plot${isDayTimeline ? ' trend-plot--interval' : ''}">
      <div class="trend-grid" aria-hidden="true">${scale.ticks.map(() => '<span></span>').join('')}</div>
      ${bars}
      ${isDayTimeline ? `<div class="trend-x-boundaries" aria-hidden="true">${dayBoundaries.map((label, index) => `<span data-position="${(index / 6) * 100}">${label}</span>`).join('')}</div>` : ''}
    </div>`;
  const trendPlot = elements.dashboardTrend.querySelector('.trend-plot');
  trendPlot.style.gridTemplateColumns = `repeat(${timeline.length}, minmax(42px, 1fr))`;
  elements.dashboardTrend.querySelectorAll('[data-height]').forEach((bar) => {
    bar.style.height = `${bar.dataset.height}%`;
  });
  elements.dashboardTrend.querySelectorAll('[data-position]').forEach((label) => {
    label.style.left = `${label.dataset.position}%`;
  });
}

function dashboardSegmentsRelated(first, second) {
  const normalizedFirst = first.replace(/（自身）$/, '');
  const normalizedSecond = second.replace(/（自身）$/, '');
  return (
    normalizedFirst === normalizedSecond ||
    normalizedFirst.startsWith(`${normalizedSecond} / `) ||
    normalizedSecond.startsWith(`${normalizedFirst} / `)
  );
}

function updateDonutCenter(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  if (safeSeconds > 3600) {
    elements.donutTotal.textContent = (safeSeconds / 3600).toFixed(1);
    elements.donutUnit.textContent = '小时';
  } else if (safeSeconds === 3600) {
    elements.donutTotal.textContent = '1';
    elements.donutUnit.textContent = '小时';
  } else if (safeSeconds >= 60) {
    elements.donutTotal.textContent = Math.floor(safeSeconds / 60);
    elements.donutUnit.textContent = '分钟';
  } else {
    elements.donutTotal.textContent = safeSeconds;
    elements.donutUnit.textContent = '秒';
  }
}

function donutPoint(radius, percentage) {
  const angle = ((percentage * 3.6 - 90) * Math.PI) / 180;
  return {
    x: 160 + radius * Math.cos(angle),
    y: 160 + radius * Math.sin(angle),
  };
}

function renderDonutSelectionGuide(selectedElement) {
  const guide = elements.dashboardDonut.querySelector('.donut-selection-guide');
  if (!guide) {
    return;
  }
  guide.replaceChildren();
  if (!selectedElement || Number(selectedElement.dataset.level) <= 0) {
    return;
  }

  const namespace = 'http://www.w3.org/2000/svg';
  const selectedLevel = Number(selectedElement.dataset.level);
  const selectedRadius = Number(selectedElement.dataset.radius);
  const strokeWidth = Number(selectedElement.dataset.strokeWidth);
  const start = Number(selectedElement.dataset.start);
  const percent = Number(selectedElement.dataset.percent);
  const color = selectedElement.dataset.color;
  const innerRings = Array.from(elements.dashboardDonut.querySelectorAll('.donut-slice'))
    .filter((element) => Number(element.dataset.level) < selectedLevel)
    .reduce((levels, element) => {
      levels.set(Number(element.dataset.level), Number(element.dataset.radius));
      return levels;
    }, new Map());

  innerRings.forEach((radius) => {
    const arc = document.createElementNS(namespace, 'circle');
    arc.setAttribute('class', 'donut-selection-arc');
    arc.setAttribute('cx', '160');
    arc.setAttribute('cy', '160');
    arc.setAttribute('r', String(radius));
    arc.setAttribute('pathLength', '100');
    arc.setAttribute('stroke', color);
    arc.setAttribute('stroke-width', String(strokeWidth));
    arc.setAttribute('stroke-dasharray', `${percent} ${100 - percent}`);
    arc.setAttribute('stroke-dashoffset', String(-start));
    guide.append(arc);
  });

  const innermostRadius = Math.min(...innerRings.values());
  const lineStartRadius = selectedRadius - strokeWidth / 2;
  const lineEndRadius = innermostRadius + strokeWidth / 2;
  [start, start + percent].forEach((boundary) => {
    const from = donutPoint(lineStartRadius, boundary);
    const to = donutPoint(lineEndRadius, boundary);
    const line = document.createElementNS(namespace, 'line');
    line.setAttribute('class', 'donut-selection-connector');
    line.setAttribute('x1', String(from.x));
    line.setAttribute('y1', String(from.y));
    line.setAttribute('x2', String(to.x));
    line.setAttribute('y2', String(to.y));
    line.setAttribute('stroke', color);
    guide.append(line);
  });
}

function setDashboardSegment(key, sourceElement = null) {
  state.dashboardSelection = key;
  const selected = state.dashboardSelection;
  const donutSegments = Array.from(elements.dashboardDonut.querySelectorAll('.donut-slice'));
  const selectedElement =
    sourceElement || donutSegments.findLast((element) => element.dataset.segmentKey === selected);
  elements.dashboardDonut.classList.toggle('has-selection', Boolean(selected));
  elements.dashboardLegend.classList.toggle('has-selection', Boolean(selected));
  donutSegments.forEach((element) => {
    const normalizedKey = element.dataset.segmentKey.replace(/（自身）$/, '');
    const normalizedSelected = (selected || '').replace(/（自身）$/, '');
    const isSelectedScope =
      Boolean(selected) &&
      (normalizedKey === normalizedSelected ||
        normalizedKey.startsWith(`${normalizedSelected} / `));
    element.classList.toggle('is-highlighted', isSelectedScope);
    element.classList.toggle('is-dimmed', Boolean(selected) && !isSelectedScope);
  });
  elements.dashboardLegend.querySelectorAll('[data-segment-key]').forEach((element) => {
    const related = !selected || dashboardSegmentsRelated(element.dataset.segmentKey, selected);
    element.classList.toggle('is-highlighted', Boolean(selected) && related);
    element.classList.toggle('is-dimmed', Boolean(selected) && !related);
    element.setAttribute('aria-pressed', String(Boolean(selected) && related));
  });
  updateDonutCenter(selectedElement?.dataset.segmentSeconds ?? state.dashboardTotalSeconds);
  renderDonutSelectionGuide(selectedElement);
}

async function switchView(view) {
  state.currentView = view;
  elements.tasksView.hidden = view !== 'tasks';
  elements.dashboardView.hidden = view !== 'dashboard';
  document.querySelectorAll('.view-tab').forEach((button) => {
    const selected = button.dataset.view === view;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
  });
  if (view === 'dashboard') {
    await renderDashboard();
  }
}

function groupIdForTask(taskId) {
  const tasks = new Map(state.tasks.map((task) => [task.id, task]));
  let current = tasks.get(Number(taskId));
  while (current) {
    if (current.is_group === 1) {
      return String(current.id);
    }
    current = current.parent_id === null ? null : tasks.get(current.parent_id);
  }
  return state.defaultTaskGroupId;
}

function syncGroupsFromTasks() {
  const previousCollapsed = new Map(state.taskGroups.map((group) => [group.id, group.collapsed]));
  state.taskGroups = state.tasks
    .filter((task) => task.is_group === 1 && task.parent_id === null)
    .map((task) => {
      let collapsed = previousCollapsed.get(String(task.id)) || false;
      try {
        collapsed = JSON.parse(task.notes || '{}').collapsed === true;
      } catch {
        // Keep the current in-memory state for legacy notes.
      }
      return { id: String(task.id), name: task.title, collapsed };
    });
  const defaultGroup = state.tasks.find(
    (task) => task.is_group === 1 && task.is_default_group === 1,
  );
  state.defaultTaskGroupId = String(defaultGroup?.id || state.taskGroups[0]?.id || '');
  const groupIds = new Set(state.taskGroups.map((group) => group.id));
  state.selectedGroupIds = new Set(
    [...state.selectedGroupIds].filter(
      (groupId) => groupId !== state.defaultTaskGroupId && groupIds.has(groupId),
    ),
  );
}

function normalizedTaskTitle(title) {
  return String(title || '')
    .trim()
    .toLocaleLowerCase('zh-CN');
}

function duplicateRootTitle(title, groupId, excludedTaskIds = new Set()) {
  const normalized = normalizedTaskTitle(title);
  return state.tasks.find(
    (task) =>
      task.is_group !== 1 &&
      String(task.parent_id) === String(groupId) &&
      !excludedTaskIds.has(task.id) &&
      normalizedTaskTitle(task.title) === normalized,
  );
}

function duplicateSiblingTitle(title, parentId, excludedTaskId = null) {
  const normalized = normalizedTaskTitle(title);
  return state.tasks.find(
    (task) =>
      task.parent_id === parentId &&
      task.id !== excludedTaskId &&
      normalizedTaskTitle(task.title) === normalized,
  );
}

function movingTaskTitleConflict(taskIds, targetGroupId) {
  const movingIds = new Set(taskIds);
  const occupiedTitles = new Map();
  state.tasks.forEach((task) => {
    if (
      task.is_group !== 1 &&
      String(task.parent_id) === String(targetGroupId) &&
      !movingIds.has(task.id)
    ) {
      occupiedTitles.set(normalizedTaskTitle(task.title), task.title);
    }
  });
  for (const taskId of taskIds) {
    const task = taskById(taskId);
    if (!task) {
      continue;
    }
    const normalized = normalizedTaskTitle(task.title);
    if (occupiedTitles.has(normalized)) {
      return task.title;
    }
    occupiedTitles.set(normalized, task.title);
  }
  return null;
}

function rootTaskIdsForGroup(groupId) {
  return state.tasks
    .filter((task) => task.is_group !== 1 && String(task.parent_id) === String(groupId))
    .map((task) => task.id);
}

function renderRootItem(task) {
  const selecting = state.groupSelectionMode;
  return `<div class="root-item ${selecting ? 'selecting' : ''} ${state.selectedTaskIds.has(task.id) ? 'batch-selected' : ''} ${task.id === state.selectedRootId ? 'selected' : ''} ${task.status === 'done' ? 'done' : ''}" data-root-id="${task.id}" draggable="true">
    ${selecting ? `<input class="root-selection-check" type="checkbox" data-select-task="${task.id}" aria-label="选择 ${escapeHtml(task.title)}" ${state.selectedTaskIds.has(task.id) ? 'checked' : ''}>` : ''}
    <button class="root-select" data-root-select="${task.id}">
      <span>${escapeHtml(task.title)}</span>
      <small>${task.session_count} 个番茄 · ${formatMinutes(task.focused_seconds)} 分钟${taskTimerSummary(task)}</small>
    </button>
    <button class="pomodoro-button" data-action="start-pomodoro" data-id="${task.id}" title="在此事项上启动番茄钟" aria-label="在 ${escapeHtml(task.title)} 上启动番茄钟"><span class="pomodoro-icon" aria-hidden="true">🍅</span></button>
    <button class="item-rename-button" data-action="rename" data-id="${task.id}" type="button" title="重命名事项" aria-label="重命名 ${escapeHtml(task.title)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4 4-.8L18 8.4 15.6 6zM13.8 7.8l2.4 2.4" /></svg></button>
    <button class="child-add-button" data-action="child" data-id="${task.id}" type="button" title="新建子条目" aria-label="在 ${escapeHtml(task.title)} 下新建子条目"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h9M4 12h6M4 18h9M17 10v6m-3-3h6" /></svg></button>
  </div>`;
}

function renderTasks() {
  const tasks = orderedTasks();
  const groupIds = new Set(state.taskGroups.map((group) => group.id));
  const roots = tasks.filter((task) => task.is_group !== 1 && groupIds.has(String(task.parent_id)));
  const rootIds = new Set(roots.map((task) => task.id));
  state.selectedTaskIds = new Set(
    [...state.selectedTaskIds].filter((taskId) => rootIds.has(taskId)),
  );
  const children = childMap();
  if (!roots.some((task) => task.id === state.selectedRootId)) {
    state.selectedRootId = roots[0]?.id || null;
  }
  elements.board.hidden = false;
  const groupedRoots = new Map(state.taskGroups.map((group) => [group.id, []]));
  roots.forEach((task) => groupedRoots.get(groupIdForTask(task.id)).push(task));
  elements.rootList.innerHTML = state.taskGroups
    .map((group) => {
      const groupRoots = groupedRoots.get(group.id) || [];
      const selectedRootCount = groupRoots.filter((task) =>
        state.selectedTaskIds.has(task.id),
      ).length;
      const allRootsSelected = groupRoots.length > 0 && selectedRootCount === groupRoots.length;
      const groupSelected = allRootsSelected || state.selectedGroupIds.has(group.id);
      const selectingClass = state.groupSelectionMode ? 'selecting' : '';
      const groupCheckbox = state.groupSelectionMode
        ? `<input class="group-selection-check" type="checkbox" data-select-group="${escapeHtml(group.id)}" aria-label="选择 ${escapeHtml(group.name)} 中的全部事项" ${groupSelected ? 'checked' : ''} data-partial="${selectedRootCount > 0 && !allRootsSelected}">`
        : '';
      return `<section class="task-group ${group.collapsed ? 'collapsed' : ''}" data-group-id="${escapeHtml(group.id)}">
        <header class="task-group__header ${selectingClass}">
          ${groupCheckbox}
          <button class="task-group__toggle" type="button" data-toggle-group="${escapeHtml(group.id)}" aria-expanded="${!group.collapsed}">
            <span class="task-group__chevron" aria-hidden="true"></span>
            <span>${escapeHtml(group.name)}</span>
            ${group.id === state.defaultTaskGroupId ? '<span class="task-group__default-label" title="默认分组">默认</span>' : ''}
            <span class="task-group__count">${groupRoots.length}</span>
          </button>
          <button class="group-default-button ${group.id === state.defaultTaskGroupId ? 'active' : ''}" type="button" data-set-default-group="${escapeHtml(group.id)}" title="${group.id === state.defaultTaskGroupId ? '当前默认分组' : '设为默认分组'}" aria-label="${group.id === state.defaultTaskGroupId ? `${escapeHtml(group.name)} 是当前默认分组` : `将 ${escapeHtml(group.name)} 设为默认分组`}" aria-pressed="${group.id === state.defaultTaskGroupId}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6-4.4-4.3 6.1-.9z" /></svg></button>
          <button class="group-rename-button" type="button" data-rename-group="${escapeHtml(group.id)}" title="重命名分组" aria-label="重命名 ${escapeHtml(group.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4 4-.8L18 8.4 15.6 6zM13.8 7.8l2.4 2.4" /></svg></button>
          <button class="child-add-button group-add-button" type="button" data-add-root-to-group="${escapeHtml(group.id)}" title="在此分组中新建事项" aria-label="在 ${escapeHtml(group.name)} 中新建事项"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h9M4 12h6M4 18h9M17 10v6m-3-3h6" /></svg></button>
        </header>
        <div class="task-group__items">
          ${groupRoots.length ? groupRoots.map(renderRootItem).join('') : '<div class="task-group__empty">暂无事项，可拖动到这里</div>'}
        </div>
      </section>`;
    })
    .join('');
  elements.rootList
    .querySelectorAll('.group-selection-check[data-partial="true"]')
    .forEach((input) => {
      input.indeterminate = true;
    });
  elements.selectGroups.classList.toggle('active', state.groupSelectionMode);
  elements.selectGroups.setAttribute('aria-pressed', String(state.groupSelectionMode));
  const selectedEmptyCustomGroup = state.taskGroups.some(
    (group) =>
      group.id !== state.defaultTaskGroupId &&
      state.selectedGroupIds.has(group.id) &&
      (groupedRoots.get(group.id) || []).length === 0,
  );
  elements.deleteGroups.disabled = state.selectedTaskIds.size === 0 && !selectedEmptyCustomGroup;
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
          ) => `<div class="task child depth-${Math.min(Math.max(task.depth - 1, 1), 4)} ${task.status === 'done' ? 'done' : ''}" data-task-id="${task.id}">
    <button class="status ${task.status === 'done' ? 'checked' : ''}" data-action="toggle" data-id="${task.id}" aria-label="切换完成状态"></button>
    <div><div class="task-title">${escapeHtml(task.title)}</div><div class="task-meta">${task.session_count} 个番茄 · ${formatMinutes(task.focused_seconds)} 分钟${taskTimerSummary(task)}${task.notes ? ` · ${escapeHtml(task.notes)}` : ''}</div></div>
    <button class="pomodoro-button" data-action="start-pomodoro" data-id="${task.id}" title="在此事项上启动番茄钟" aria-label="在 ${escapeHtml(task.title)} 上启动番茄钟"><span class="pomodoro-icon" aria-hidden="true">🍅</span></button>
    <button class="item-rename-button" data-action="rename" data-id="${task.id}" type="button" title="重命名事项" aria-label="重命名 ${escapeHtml(task.title)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4 4-.8L18 8.4 15.6 6zM13.8 7.8l2.4 2.4" /></svg></button>
    <button class="child-add-button" data-action="child" data-id="${task.id}" type="button" title="新建子条目" aria-label="在 ${escapeHtml(task.title)} 下新建子条目"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h9M4 12h6M4 18h9M17 10v6m-3-3h6" /></svg></button>
    ${
      task.hasChildren
        ? `<button class="collapse-button ${state.collapsedTaskIds.has(task.id) ? 'is-collapsed' : ''}" data-action="collapse-one" data-id="${task.id}" aria-label="${state.collapsedTaskIds.has(task.id) ? '展开子项' : '折叠子项'}" aria-expanded="${!state.collapsedTaskIds.has(task.id)}"><span class="collapse-icon" aria-hidden="true"></span></button>`
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
  syncGroupsFromTasks();
  renderTasks();
  if (state.currentView === 'dashboard') {
    await renderDashboard();
  }
}
function openDialog(parentId = '', groupId = null) {
  state.editingTaskId = null;
  state.pendingRootGroupId = groupId || state.defaultTaskGroupId;
  elements.parentId.value = parentId;
  elements.title.value = '';
  elements.notes.value = '';
  elements.notesLabel.hidden = false;
  elements.notes.hidden = false;
  elements.taskSubmit.textContent = '保存';
  document.querySelector('#dialog-title').textContent = parentId ? '新建子项' : '新建大项';
  elements.dialog.showModal();
  elements.title.focus();
}

function openTaskRenameDialog(taskId) {
  const task = taskById(taskId);
  if (!task) {
    return;
  }
  state.editingTaskId = taskId;
  state.pendingRootGroupId = groupIdForTask(taskId);
  elements.parentId.value = task.parent_id ?? '';
  elements.title.value = task.title;
  elements.notes.value = task.notes || '';
  elements.notesLabel.hidden = true;
  elements.notes.hidden = true;
  elements.taskSubmit.textContent = '保存名称';
  document.querySelector('#dialog-title').textContent = '重命名事项';
  elements.dialog.showModal();
  elements.title.select();
}
function openTaskTimerDialog(taskId) {
  const task = taskById(taskId);
  if (!task) {
    return;
  }
  elements.taskTimerId.value = taskId;
  elements.taskTimerName.textContent = taskPath(taskId);
  elements.taskFocusMinutes.value = task.focus_minutes ?? '';
  elements.taskBreakMinutes.value = task.break_minutes ?? '';
  elements.taskFocusMinutes.placeholder = String(state.focusDuration);
  elements.taskBreakMinutes.placeholder = String(state.breakDuration);
  elements.taskTimerDialog.showModal();
  elements.taskFocusMinutes.focus();
}
async function openTaskHistory(taskId) {
  const task = taskById(taskId);
  if (!task) {
    return;
  }
  const sessions = await window.pomodoro.listTaskSessions(taskId);
  state.historyTaskId = taskId;
  state.historySessions = new Map(sessions.map((session) => [session.id, session]));
  elements.taskHistoryTitle.textContent = taskPath(taskId);
  if (sessions.length === 0) {
    elements.taskHistoryContent.innerHTML = '<div class="history-empty">该事项还没有专注记录</div>';
  } else {
    const sessionsByDate = new Map();
    sessions.forEach((session) => {
      const date = session.local_date || '未知日期';
      sessionsByDate.set(date, [...(sessionsByDate.get(date) || []), session]);
    });
    elements.taskHistoryContent.innerHTML = [...sessionsByDate.entries()]
      .map(([date, daySessions], index) => {
        const completedCount = daySessions.filter(
          (session) => session.counts_as_pomodoro === 1,
        ).length;
        const totalSeconds = daySessions.reduce(
          (sum, session) => sum + session.duration_seconds,
          0,
        );
        const rows = daySessions
          .map(
            (
              session,
            ) => `<div class="history-entry ${session.counts_as_pomodoro ? '' : 'interrupted'}">
              <span class="history-entry__dot" aria-hidden="true"></span>
              <div class="history-entry__times">
                <div class="history-entry__clock">
                  <strong>${escapeHtml(session.local_start_time || '--:--:--')}</strong>
                  <span>至 ${escapeHtml(session.local_end_time || '--:--:--')}</span>
                </div>
                <small>${escapeHtml(taskPath(session.task_id))}</small>
              </div>
              <span class="history-entry__duration">${formatRecordedDuration(session.duration_seconds)}</span>
              <span class="history-entry__status">${session.counts_as_pomodoro ? '完整番茄' : '被打断'}</span>
              <div class="history-entry__note" data-session-note="${session.id}">
                <div class="history-entry__note-header">
                  <span>事项记录</span>
                  <button type="button" data-edit-session-note="${session.id}">修改</button>
                </div>
                <p>${session.note ? escapeHtml(session.note) : '未填写'}</p>
              </div>
            </div>`,
          )
          .join('');
        return `<details class="history-day" ${index === 0 ? 'open' : ''}>
          <summary>
            <span class="history-day__date">${escapeHtml(formatHistoryDate(date))}</span>
            <span class="history-day__summary">${completedCount} 个番茄 · ${formatRecordedDuration(totalSeconds)}</span>
            <span class="history-day__chevron" aria-hidden="true"></span>
          </summary>
          <div class="history-day__entries">${rows}</div>
        </details>`;
      })
      .join('');
  }
  elements.taskHistoryDialog.showModal();
}
function renderTimer() {
  elements.activeTimer.hidden = !state.running;
  elements.openTimerPopup.textContent = state.timerPopupOpen ? '关闭小窗' : '打开小窗';
  if (state.running) {
    const timer = timerPopupState();
    elements.activeTimerPhase.textContent = timer.phase === 'break' ? '休息中' : '专注中';
    elements.activeTimerTitle.textContent = timer.title;
    elements.activeTimerTitle.title = timer.title;
    elements.activeTimerTime.textContent = formatTime(timer.remaining);
  }
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

function confirmInterrupt(title, message) {
  elements.interruptConfirmTitle.textContent = title;
  elements.interruptConfirmMessage.textContent = message;
  elements.interruptConfirmDialog.returnValue = 'cancel';
  elements.interruptConfirmDialog.showModal();
  return new Promise((resolve) => {
    elements.interruptConfirmDialog.addEventListener(
      'close',
      () => resolve(elements.interruptConfirmDialog.returnValue === 'confirm'),
      { once: true },
    );
  });
}

function showActionDialog({
  mode = 'notice',
  eyebrow,
  title,
  message,
  detail,
  cancelLabel = '',
  confirmLabel = '知道了',
}) {
  elements.actionDialog.dataset.mode = mode;
  elements.actionDialogEyebrow.textContent = eyebrow;
  elements.actionDialogTitle.textContent = title;
  elements.actionDialogMessage.textContent = message;
  elements.actionDialogDetail.textContent = detail;
  elements.actionDialogDetail.hidden = !detail;
  elements.actionDialogCancel.textContent = cancelLabel;
  elements.actionDialogCancel.hidden = !cancelLabel;
  elements.actionDialogConfirm.textContent = confirmLabel;
  elements.actionDialogConfirm.classList.toggle('danger', mode === 'delete');
  elements.actionDialogConfirm.classList.toggle('primary', mode !== 'delete');
  elements.actionDialog.returnValue = 'cancel';
  elements.actionDialog.showModal();
  return new Promise((resolve) => {
    elements.actionDialog.addEventListener(
      'close',
      () => resolve(elements.actionDialog.returnValue === 'confirm'),
      { once: true },
    );
  });
}

function confirmDeletion(title, message) {
  return showActionDialog({
    mode: 'delete',
    eyebrow: '删除所选内容',
    title,
    message,
    detail: '删除后无法恢复，请确认选择无误。',
    cancelLabel: '保留这些内容',
    confirmLabel: '确认删除',
  });
}

function showDuplicateNotice(message, detail = '同一个分组中的顶层事项名称必须保持唯一。') {
  return showActionDialog({
    mode: 'notice',
    eyebrow: '名称冲突',
    title: '这个名称已经被使用',
    message,
    detail,
    confirmLabel: '知道了',
  });
}

function openSessionNoteDialog(sessionId, taskId, note = '', editing = false) {
  if (!sessionId) {
    return;
  }
  state.pendingNoteSessionId = sessionId;
  elements.sessionNoteHeading.textContent = editing ? '修改事项记录' : '这个番茄完成了什么？';
  elements.sessionNoteTask.textContent = taskPath(taskId);
  elements.sessionNote.value = note;
  elements.skipSessionNote.textContent = editing ? '取消' : '暂不填写';
  elements.sessionNoteDialog.showModal();
  elements.sessionNote.focus();
}

async function completeTimer() {
  clearInterval(state.interval);
  state.running = false;
  if (state.timerMode === 'focus') {
    const session = await window.pomodoro.recordSession({
      taskId: state.activeTaskId,
      durationSeconds: state.duration,
      startedAt: state.startedAt,
    });
    state.completedSessionId = session.sessionId;
    if (Notification.permission === 'granted') {
      new Notification('番茄完成', { body: '这段专注已经记录，开始休息。' });
    }
    playSound(state.focusEndSoundUrl, 'assets/sounds/focus-end.mp3');
    await refresh();
    state.timerMode = 'break';
    state.duration = state.activeBreakDuration * 60;
    state.remaining = state.duration;
    startTimer();
    return;
  }
  if (Notification.permission === 'granted') {
    new Notification('休息结束', { body: '休息时间结束。' });
  }
  playSound(state.breakEndSoundUrl, 'assets/sounds/break-end.mp3');
  const completedTaskId = state.activeTaskId;
  const completedSessionId = state.completedSessionId;
  state.timerMode = 'focus';
  state.duration = state.focusDuration * 60;
  state.remaining = state.duration;
  renderTimer();
  await window.pomodoro.hideTimerPopup();
  state.activeTaskId = null;
  state.completedSessionId = null;
  openSessionNoteDialog(completedSessionId, completedTaskId);
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
    if (state.remaining <= 0) {
      completeTimer();
    }
  }, 1000);
  renderTimer();
}

function startPomodoro(taskId) {
  if (taskById(taskId)?.is_group === 1) {
    return;
  }
  if (state.running) {
    window.alert('当前已有番茄钟正在运行。');
    return;
  }
  state.activeTaskId = taskId;
  state.completedSessionId = null;
  const task = taskById(taskId);
  state.activeFocusDuration = task?.focus_minutes ?? state.focusDuration;
  state.activeBreakDuration = task?.break_minutes ?? state.breakDuration;
  state.timerMode = 'focus';
  state.duration = state.activeFocusDuration * 60;
  state.remaining = state.duration;
  state.startedAt = null;
  startTimer();
}

async function interruptTimer() {
  if (!state.running) {
    return;
  }
  const elapsedSeconds = Math.max(0, state.duration - state.remaining);
  const isFocus = state.timerMode === 'focus';
  const completedTaskId = state.activeTaskId;
  const completedSessionId = state.completedSessionId;
  const confirmed = await confirmInterrupt(
    isFocus ? '打断当前番茄？' : '提前结束休息？',
    isFocus
      ? `已专注 ${formatTime(elapsedSeconds)} 将被记录，但不计入番茄次数。`
      : '这个番茄已在专注结束时记录，提前结束休息不会影响番茄次数。',
  );
  if (!confirmed) {
    return;
  }
  clearInterval(state.interval);
  state.running = false;
  if (state.timerMode === 'focus' && elapsedSeconds > 0) {
    await window.pomodoro.recordSession({
      taskId: state.activeTaskId,
      durationSeconds: elapsedSeconds,
      startedAt: state.startedAt,
      countsAsPomodoro: false,
    });
  }
  await window.pomodoro.hideTimerPopup();
  state.timerPopupOpen = false;
  state.timerMode = 'focus';
  state.duration = state.focusDuration * 60;
  state.remaining = state.duration;
  state.activeTaskId = null;
  state.completedSessionId = null;
  renderTimer();
  await refresh();
  if (!isFocus) {
    openSessionNoteDialog(completedSessionId, completedTaskId);
  }
}

elements.openTimerPopup.addEventListener('click', async () => {
  if (!state.running) {
    return;
  }
  state.timerPopupOpen = state.timerPopupOpen
    ? await window.pomodoro.hideTimerPopup()
    : await window.pomodoro.showTimerPopup(timerPopupState());
  renderTimer();
});
elements.interruptTimer.addEventListener('click', interruptTimer);
document.querySelector('.view-tabs').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-view]');
  if (button) {
    await switchView(button.dataset.view);
  }
});
document.querySelector('.dashboard-period').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-dashboard-period]');
  if (!button) {
    return;
  }
  state.dashboardPeriod = button.dataset.dashboardPeriod;
  document.querySelectorAll('[data-dashboard-period]').forEach((periodButton) => {
    periodButton.classList.toggle('active', periodButton === button);
  });
  await renderDashboard();
});
elements.dashboardAnchorDate.addEventListener('change', async () => {
  if (elements.dashboardAnchorDate.value) {
    state.dashboardAnchorDate = elements.dashboardAnchorDate.value;
    await renderDashboard();
  }
});
elements.dashboardDepth.addEventListener('change', renderDashboard);
elements.dashboardToday.addEventListener('click', async () => {
  state.dashboardAnchorDate = localDateValue();
  elements.dashboardAnchorDate.value = state.dashboardAnchorDate;
  await renderDashboard();
});
elements.dashboardDonut.addEventListener('pointerover', (event) => {
  const segment = event.target.closest('[data-segment-key]');
  if (segment) {
    setDashboardSegment(segment.dataset.segmentKey, segment);
  }
});
elements.dashboardDonut.addEventListener('pointerleave', () => {
  setDashboardSegment(null);
});
elements.dashboardLegend.addEventListener('pointerover', (event) => {
  const item = event.target.closest('button[data-segment-key]');
  if (item) {
    setDashboardSegment(item.dataset.segmentKey);
  }
});
elements.dashboardLegend.addEventListener('pointerleave', () => {
  setDashboardSegment(null);
});
elements.dashboardLegend.addEventListener('focusin', (event) => {
  const item = event.target.closest('button[data-segment-key]');
  if (item) {
    setDashboardSegment(item.dataset.segmentKey);
  }
});
elements.dashboardLegend.addEventListener('focusout', (event) => {
  if (!elements.dashboardLegend.contains(event.relatedTarget)) {
    setDashboardSegment(null);
  }
});
elements.sessionNoteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.pendingNoteSessionId) {
    const sessionId = state.pendingNoteSessionId;
    const note = elements.sessionNote.value.trim();
    await window.pomodoro.updateSessionNote(sessionId, note);
    const historySession = state.historySessions.get(sessionId);
    if (historySession) {
      historySession.note = note;
      const noteElement = elements.taskHistoryContent.querySelector(
        `[data-session-note="${sessionId}"] p`,
      );
      if (noteElement) {
        noteElement.textContent = note || '未填写';
      }
    }
  }
  state.pendingNoteSessionId = null;
  elements.sessionNoteDialog.close();
});
document.querySelector('#skip-session-note').addEventListener('click', () => {
  state.pendingNoteSessionId = null;
  elements.sessionNoteDialog.close();
});
elements.taskHistoryContent.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-edit-session-note]');
  if (!button) {
    return;
  }
  const sessionId = Number(button.dataset.editSessionNote);
  const session = state.historySessions.get(sessionId);
  if (session) {
    openSessionNoteDialog(sessionId, session.task_id, session.note, true);
  }
});

elements.addGroup.addEventListener('click', () => {
  state.editingGroupId = null;
  elements.groupName.value = '';
  elements.groupDialogTitle.textContent = '新建分组';
  elements.groupSubmit.textContent = '创建';
  elements.groupDialog.showModal();
  elements.groupName.focus();
});
document.querySelector('#cancel-group-dialog').addEventListener('click', () => {
  state.editingGroupId = null;
  elements.groupDialog.close();
});
elements.groupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = elements.groupName.value.trim();
  if (!name) {
    await showActionDialog({
      eyebrow: '名称不能为空',
      title: '请输入分组名称',
      message: '分组名称不能只包含空格。',
      detail: '输入一个便于识别的名称后再保存。',
    });
    elements.groupName.focus();
    return;
  }
  const duplicateGroup = state.taskGroups.find(
    (group) =>
      group.id !== state.editingGroupId &&
      normalizedTaskTitle(group.name) === normalizedTaskTitle(name),
  );
  if (duplicateGroup) {
    await showDuplicateNotice(
      `已经存在名为“${duplicateGroup.name}”的分组。`,
      '分组名称必须保持唯一。',
    );
    elements.groupName.focus();
    return;
  }
  if (state.editingGroupId) {
    await window.pomodoro.renameTask(Number(state.editingGroupId), name);
  } else {
    await window.pomodoro.createTask({ title: name, notes: '', parentId: null, isGroup: true });
  }
  state.editingGroupId = null;
  elements.groupDialog.close();
  await refresh();
});
elements.collapseGroups.addEventListener('click', async () => {
  for (const group of state.taskGroups) {
    await window.pomodoro.setGroupCollapsed(Number(group.id), true);
  }
  await refresh();
});
elements.selectGroups.addEventListener('click', () => {
  state.groupSelectionMode = !state.groupSelectionMode;
  if (!state.groupSelectionMode) {
    state.selectedGroupIds.clear();
    state.selectedTaskIds.clear();
  }
  renderTasks();
});
elements.deleteGroups.addEventListener('click', async () => {
  const rootIds = new Set(state.taskGroups.flatMap((group) => rootTaskIdsForGroup(group.id)));
  const selectedTaskIds = [...state.selectedTaskIds].filter((taskId) => rootIds.has(taskId));
  const selectedTaskIdSet = new Set(selectedTaskIds);
  const groupsToDelete = state.taskGroups.filter((group) => {
    if (group.id === state.defaultTaskGroupId) {
      return false;
    }
    const groupTaskIds = rootTaskIdsForGroup(group.id);
    return groupTaskIds.length === 0
      ? state.selectedGroupIds.has(group.id)
      : groupTaskIds.every((taskId) => selectedTaskIdSet.has(taskId));
  });
  if (selectedTaskIds.length === 0 && groupsToDelete.length === 0) {
    return;
  }
  const taskDescription =
    selectedTaskIds.length > 0 ? `${selectedTaskIds.length} 个事项及其所有子项和记录` : '';
  const groupDescription = groupsToDelete.length > 0 ? `${groupsToDelete.length} 个完整分组` : '';
  const message = `将删除${[taskDescription, groupDescription].filter(Boolean).join('，并移除')}。`;
  const title = groupsToDelete.length > 0 ? '删除所选事项与分组？' : '删除所选事项？';
  if (!(await confirmDeletion(title, message))) {
    return;
  }
  for (const taskId of selectedTaskIds) {
    await window.pomodoro.deleteTask(taskId);
  }
  for (const group of groupsToDelete) {
    await window.pomodoro.deleteTask(Number(group.id));
  }
  state.selectedGroupIds.clear();
  state.selectedTaskIds.clear();
  await refresh();
});
document.querySelector('#cancel-dialog').addEventListener('click', () => {
  state.editingTaskId = null;
  elements.dialog.close();
});
document
  .querySelector('#cancel-task-timer')
  .addEventListener('click', () => elements.taskTimerDialog.close());
elements.taskTimerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await window.pomodoro.setTaskTimerSettings(Number(elements.taskTimerId.value), {
    focusMinutes: elements.taskFocusMinutes.value || null,
    breakMinutes: elements.taskBreakMinutes.value || null,
  });
  elements.taskTimerDialog.close();
  await refresh();
});
document.querySelector('#reset-task-timer').addEventListener('click', async () => {
  await window.pomodoro.setTaskTimerSettings(Number(elements.taskTimerId.value), {
    focusMinutes: null,
    breakMinutes: null,
  });
  elements.taskTimerDialog.close();
  await refresh();
});
elements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = elements.title.value.trim();
  if (!title) {
    await showActionDialog({
      eyebrow: '名称不能为空',
      title: '请输入事项名称',
      message: '事项名称不能只包含空格。',
      detail: '输入一个便于识别的名称后再保存。',
    });
    elements.title.focus();
    return;
  }
  const editingTask = state.editingTaskId ? taskById(state.editingTaskId) : null;
  const parentId = editingTask
    ? editingTask.parent_id
    : elements.parentId.value
      ? Number(elements.parentId.value)
      : Number(state.pendingRootGroupId);
  const parentTask = taskById(parentId);
  if (parentTask?.is_group === 1) {
    const duplicate = duplicateRootTitle(
      title,
      state.pendingRootGroupId,
      new Set(state.editingTaskId ? [state.editingTaskId] : []),
    );
    if (duplicate) {
      const groupName =
        state.taskGroups.find((group) => group.id === state.pendingRootGroupId)?.name || '当前分组';
      await showDuplicateNotice(`“${duplicate.title}”已存在于“${groupName}”，请使用其他名称。`);
      elements.title.focus();
      return;
    }
  } else {
    const duplicate = duplicateSiblingTitle(title, parentId, state.editingTaskId);
    if (duplicate) {
      const parentTitle = taskById(parentId)?.title || '当前父事项';
      await showDuplicateNotice(
        `“${duplicate.title}”已经是“${parentTitle}”的直接子事项，请使用其他名称。`,
        '同一个父事项下的直接子事项不能重名；更深层的后代不参与本次比较。',
      );
      elements.title.focus();
      return;
    }
  }
  if (editingTask) {
    await window.pomodoro.renameTask(editingTask.id, title);
    state.editingTaskId = null;
    elements.dialog.close();
    await refresh();
    return;
  }
  await window.pomodoro.createTask({
    title,
    notes: elements.notes.value,
    parentId,
  });
  elements.dialog.close();
  await refresh();
});
elements.rootList.addEventListener('click', async (event) => {
  const defaultButton = event.target.closest('button[data-set-default-group]');
  if (defaultButton) {
    const nextDefaultGroupId = defaultButton.dataset.setDefaultGroup;
    if (nextDefaultGroupId !== state.defaultTaskGroupId) {
      await window.pomodoro.setDefaultGroup(Number(nextDefaultGroupId));
      await refresh();
    }
    return;
  }
  const renameGroupButton = event.target.closest('button[data-rename-group]');
  if (renameGroupButton) {
    const group = state.taskGroups.find(
      (item) => item.id === renameGroupButton.dataset.renameGroup,
    );
    if (group) {
      state.editingGroupId = group.id;
      elements.groupDialogTitle.textContent = '重命名分组';
      elements.groupSubmit.textContent = '保存名称';
      elements.groupName.value = group.name;
      elements.groupDialog.showModal();
      elements.groupName.select();
    }
    return;
  }
  const groupToggle = event.target.closest('button[data-toggle-group]');
  if (groupToggle) {
    const group = state.taskGroups.find((item) => item.id === groupToggle.dataset.toggleGroup);
    if (group) {
      group.collapsed = !group.collapsed;
      await window.pomodoro.setGroupCollapsed(Number(group.id), group.collapsed);
      await refresh();
    }
    return;
  }
  const addToGroup = event.target.closest('button[data-add-root-to-group]');
  if (addToGroup) {
    openDialog('', addToGroup.dataset.addRootToGroup);
    return;
  }
  const pomodoroButton = event.target.closest('button[data-action="start-pomodoro"]');
  if (pomodoroButton) {
    startPomodoro(Number(pomodoroButton.dataset.id));
    return;
  }
  const renameButton = event.target.closest('button[data-action="rename"]');
  if (renameButton) {
    openTaskRenameDialog(Number(renameButton.dataset.id));
    return;
  }
  const childButton = event.target.closest('button[data-action="child"]');
  if (childButton) {
    openDialog(Number(childButton.dataset.id));
    return;
  }
  const button = event.target.closest('button[data-root-select]');
  if (!button) {
    return;
  }
  if (state.groupSelectionMode) {
    const taskId = Number(button.dataset.rootSelect);
    if (state.selectedTaskIds.has(taskId)) {
      state.selectedTaskIds.delete(taskId);
    } else {
      state.selectedTaskIds.add(taskId);
    }
    renderTasks();
    return;
  }
  state.selectedRootId = Number(button.dataset.rootSelect);
  renderTasks();
});
elements.rootList.addEventListener('change', (event) => {
  const groupCheckbox = event.target.closest('input[data-select-group]');
  if (groupCheckbox) {
    const groupId = groupCheckbox.dataset.selectGroup;
    const taskIds = rootTaskIdsForGroup(groupId);
    if (groupCheckbox.checked) {
      state.selectedGroupIds.add(groupId);
      taskIds.forEach((taskId) => state.selectedTaskIds.add(taskId));
    } else {
      state.selectedGroupIds.delete(groupId);
      taskIds.forEach((taskId) => state.selectedTaskIds.delete(taskId));
    }
    renderTasks();
    return;
  }
  const taskCheckbox = event.target.closest('input[data-select-task]');
  if (taskCheckbox) {
    const taskId = Number(taskCheckbox.dataset.selectTask);
    if (taskCheckbox.checked) {
      state.selectedTaskIds.add(taskId);
    } else {
      state.selectedTaskIds.delete(taskId);
    }
    state.taskGroups.forEach((group) => {
      const groupTaskIds = rootTaskIdsForGroup(group.id);
      const allSelected =
        groupTaskIds.length > 0 && groupTaskIds.every((id) => state.selectedTaskIds.has(id));
      if (allSelected) {
        state.selectedGroupIds.add(group.id);
      } else {
        state.selectedGroupIds.delete(group.id);
      }
    });
    renderTasks();
  }
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
elements.rootList.addEventListener('dragstart', (event) => {
  const item = event.target.closest('.root-item[data-root-id]');
  if (!item) {
    return;
  }
  const taskId = Number(item.dataset.rootId);
  state.draggedTaskIds = state.selectedTaskIds.has(taskId) ? [...state.selectedTaskIds] : [taskId];
  item.classList.add('dragging');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', state.draggedTaskIds.join(','));
});
elements.rootList.addEventListener('dragover', (event) => {
  const group = event.target.closest('.task-group[data-group-id]');
  if (!group || state.draggedTaskIds.length === 0) {
    return;
  }
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  elements.rootList.querySelectorAll('.task-group.drag-over').forEach((item) => {
    if (item !== group) {
      item.classList.remove('drag-over');
    }
  });
  group.classList.add('drag-over');
});
elements.rootList.addEventListener('dragleave', (event) => {
  const group = event.target.closest('.task-group[data-group-id]');
  if (group && !group.contains(event.relatedTarget)) {
    group.classList.remove('drag-over');
  }
});
elements.rootList.addEventListener('drop', async (event) => {
  const group = event.target.closest('.task-group[data-group-id]');
  if (!group || state.draggedTaskIds.length === 0) {
    return;
  }
  event.preventDefault();
  const targetGroupId = group.dataset.groupId;
  if (state.draggedTaskIds.every((taskId) => groupIdForTask(taskId) === targetGroupId)) {
    state.draggedTaskIds = [];
    group.classList.remove('drag-over');
    return;
  }
  const conflictTitle = movingTaskTitleConflict(state.draggedTaskIds, targetGroupId);
  if (conflictTitle) {
    const groupName =
      state.taskGroups.find((item) => item.id === targetGroupId)?.name || '目标分组';
    await showDuplicateNotice(`无法移动：“${groupName}”中已经有名为“${conflictTitle}”的事项。`);
    state.draggedTaskIds = [];
    group.classList.remove('drag-over');
    return;
  }
  await window.pomodoro.moveTasksToGroup(state.draggedTaskIds, Number(targetGroupId));
  state.selectedTaskIds.clear();
  state.draggedTaskIds = [];
  await refresh();
});
elements.rootList.addEventListener('dragend', () => {
  state.draggedTaskIds = [];
  elements.rootList.querySelectorAll('.dragging, .drag-over').forEach((item) => {
    item.classList.remove('dragging', 'drag-over');
  });
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
  if (button.dataset.action === 'rename') {
    openTaskRenameDialog(id);
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
  if (
    button.dataset.action === 'delete' &&
    (await confirmDeletion('删除这个事项？', '该事项、所有子项以及相关专注记录都会被删除。'))
  ) {
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
  if (button.dataset.contextAction === 'timer-settings') {
    openTaskTimerDialog(id);
  }
  if (button.dataset.contextAction === 'history') {
    await openTaskHistory(id);
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
    (await confirmDeletion('删除这个事项？', '该事项、所有子项以及相关专注记录都会被删除。'))
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
elements.weekStartDay.addEventListener('change', async () => {
  showSettings(await window.pomodoro.setWeekStartDay(Number(elements.weekStartDay.value)));
});
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
  elements.weekStartDay.value = String(config.weekStartDay ?? 1);
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
  renderTasks();
  if (state.currentView === 'dashboard') {
    renderDashboard();
  }
});
window.pomodoro.onTimerPopupVisibility((visible) => {
  state.timerPopupOpen = visible;
  renderTimer();
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
  renderTasks();
});
refresh();
