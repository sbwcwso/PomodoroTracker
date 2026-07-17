const state = {
  language: 'en-US',
  tasks: [],
  selectedRootId: null,
  collapsedTaskIds: new Set(),
  currentView: 'tasks',
  dashboardPeriod: 'day',
  dashboardAnchorDate: '',
  dashboardSelection: null,
  dashboardTotalSeconds: 0,
  taskGroups: [{ id: 'default', name: 'Default group', collapsed: false }],
  defaultTaskGroupId: 'default',
  groupSelectionMode: false,
  selectedGroupIds: new Set(),
  selectedTaskIds: new Set(),
  taskFilter: '',
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
  sessionNoteMode: 'final',
  focusDraftNote: '',
  historyTaskId: null,
  historySessions: new Map(),
  historyOpenedFromSearch: false,
  recordSearchScrollTop: 0,
  duration: 25 * 60,
  remaining: 25 * 60,
  running: false,
  timerPopupOpen: false,
  interval: null,
  startedAt: null,
  endsAt: null,
  timerCompleting: false,
  focusEndSoundUrl: 'assets/sounds/focus-end.mp3',
  breakEndSoundUrl: 'assets/sounds/break-end.mp3',
  natureSoundsEnabled: false,
  natureSoundsMasterVolume: 35,
  natureSoundVolumes: {},
  settingsTab: 'general',
};
const NATURE_SOUND_LIBRARY = Object.freeze([
  { id: 'heavy-rain' },
  { id: 'forest-rain' },
  { id: 'stream' },
  { id: 'thunderstorm' },
  { id: 'wind' },
  { id: 'fireplace' },
  { id: 'ocean-waves' },
  { id: 'forest-birds' },
  { id: 'night-crickets' },
  { id: 'waterfall' },
]);
const elements = {
  rootList: document.querySelector('#root-list'),
  addGroup: document.querySelector('#add-group'),
  collapseGroups: document.querySelector('#collapse-groups'),
  selectGroups: document.querySelector('#select-groups'),
  deleteGroups: document.querySelector('#delete-groups'),
  taskSearchInput: document.querySelector('#task-search-input'),
  taskSearchCount: document.querySelector('#task-search-count'),
  clearTaskSearch: document.querySelector('#clear-task-search'),
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
  historyBackToSearch: document.querySelector('#history-back-to-search'),
  historyRecordSearchInput: document.querySelector('#history-record-search-input'),
  historyRecordSearchRegex: document.querySelector('#history-record-search-regex'),
  historyRecordSearchCase: document.querySelector('#history-record-search-case'),
  historyRecordSearchStart: document.querySelector('#history-record-search-start'),
  historyRecordSearchEnd: document.querySelector('#history-record-search-end'),
  historyRecordSearchSummary: document.querySelector('#history-record-search-summary'),
  historyRecordSearchError: document.querySelector('#history-record-search-error'),
  historyRecordSearchEmpty: document.querySelector('#history-record-search-empty'),
  clearHistoryRecordSearch: document.querySelector('#clear-history-record-search'),
  clearHistoryRecordSearchRange: document.querySelector('#clear-history-record-search-range'),
  searchRecords: document.querySelector('#search-records'),
  recordSearchDialog: document.querySelector('#record-search-dialog'),
  closeRecordSearch: document.querySelector('#close-record-search'),
  recordSearchInput: document.querySelector('#record-search-input'),
  recordSearchRegex: document.querySelector('#record-search-regex'),
  recordSearchCase: document.querySelector('#record-search-case'),
  recordSearchStart: document.querySelector('#record-search-start'),
  recordSearchEnd: document.querySelector('#record-search-end'),
  recordSearchSummary: document.querySelector('#record-search-summary'),
  recordSearchError: document.querySelector('#record-search-error'),
  recordSearchResults: document.querySelector('#record-search-results'),
  clearRecordSearchRange: document.querySelector('#clear-record-search-range'),
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
  sessionNoteEyebrow: document.querySelector('#session-note-eyebrow'),
  sessionNoteHeading: document.querySelector('#session-note-heading'),
  sessionNoteTask: document.querySelector('#session-note-task'),
  sessionNoteMeta: document.querySelector('#session-note-meta'),
  sessionNoteDate: document.querySelector('#session-note-date'),
  sessionNoteTime: document.querySelector('#session-note-time'),
  sessionNoteDuration: document.querySelector('#session-note-duration'),
  sessionNoteStatus: document.querySelector('#session-note-status'),
  sessionNote: document.querySelector('#session-note'),
  skipSessionNote: document.querySelector('#skip-session-note'),
  sessionNoteSubmit: document.querySelector('#session-note-submit'),
  markdownHelpToggle: document.querySelector('#markdown-help-toggle'),
  markdownHelpPanel: document.querySelector('#markdown-help-panel'),
  settingsDialog: document.querySelector('#settings-dialog'),
  settingsForm: document.querySelector('#settings-dialog form'),
  settingsTabs: [...document.querySelectorAll('[data-settings-tab]')],
  settingsPanels: [...document.querySelectorAll('[data-settings-panel]')],
  languageSelect: document.querySelector('#language-select'),
  zoomRange: document.querySelector('#zoom-range'),
  zoomValue: document.querySelector('#zoom-value'),
  focusDurations: document.querySelector('#focus-durations'),
  breakDurations: document.querySelector('#break-durations'),
  weekStartDay: document.querySelector('#week-start-day'),
  timerPopupTopmost: document.querySelector('#timer-popup-topmost'),
  natureSoundsEnabled: document.querySelector('#nature-sounds-enabled'),
  natureSoundsMasterVolume: document.querySelector('#nature-sounds-master-volume'),
  natureSoundsMasterVolumeValue: document.querySelector('#nature-sounds-master-volume-value'),
  natureSoundItems: [...document.querySelectorAll('[data-nature-sound]')],
  databasePath: document.querySelector('#database-path'),
  chooseDatabasePath: document.querySelector('#choose-database-path'),
  exportDatabase: document.querySelector('#export-database'),
  importDatabase: document.querySelector('#import-database'),
  databaseImportDialog: document.querySelector('#database-import-dialog'),
  databaseImportFile: document.querySelector('#database-import-file'),
  databaseImportTaskCount: document.querySelector('#database-import-task-count'),
  databaseImportSessionCount: document.querySelector('#database-import-session-count'),
  databaseImportDuplicateCount: document.querySelector('#database-import-duplicate-count'),
  databaseImportConflictCount: document.querySelector('#database-import-conflict-count'),
  databaseImportConflicts: document.querySelector('#database-import-conflicts'),
  databaseImportConflictList: document.querySelector('#database-import-conflict-list'),
  databaseImportOverwrite: document.querySelector('#database-import-overwrite'),
  databaseImportKeepCurrent: document.querySelector('#database-import-keep-current'),
  databaseImportKeepImported: document.querySelector('#database-import-keep-imported'),
  activeTimer: document.querySelector('#active-timer'),
  activeTimerPhase: document.querySelector('#active-timer-phase'),
  activeTimerTitle: document.querySelector('#active-timer-title'),
  activeTimerTime: document.querySelector('#active-timer-time'),
  activeTimerNote: document.querySelector('#active-timer-note'),
  openTimerPopup: document.querySelector('#open-timer-popup'),
  interruptTimer: document.querySelector('#interrupt-timer'),
  focusEndSound: document.querySelector('#focus-end-sound'),
  breakEndSound: document.querySelector('#break-end-sound'),
};

const appTooltip = document.createElement('div');
appTooltip.className = 'app-tooltip';
appTooltip.setAttribute('role', 'tooltip');
appTooltip.hidden = true;
document.body.append(appTooltip);
if (window.pomodoro.platform === 'android') {
  elements.importDatabase.textContent = '导入数据库';
}
let tooltipTarget = null;
let tooltipTimer = null;

function upgradeTooltips(root = document) {
  const candidates = [];
  if (root.nodeType === 1 && root.hasAttribute('title')) {
    candidates.push(root);
  }
  root.querySelectorAll?.('[title]').forEach((element) => candidates.push(element));
  candidates.forEach((element) => {
    const label = (element.dataset.i18nTitleSource || element.getAttribute('title'))?.trim();
    if (label) {
      element.dataset.tooltip = label;
    }
    element.removeAttribute('title');
  });
}

function positionTooltip(target) {
  const targetRect = target.getBoundingClientRect();
  const tooltipRect = appTooltip.getBoundingClientRect();
  const targetCenter = targetRect.left + targetRect.width / 2;
  const left = Math.min(
    Math.max(10, targetCenter - tooltipRect.width / 2),
    window.innerWidth - tooltipRect.width - 10,
  );
  let top = targetRect.top - tooltipRect.height - 12;
  const below = top < 8;
  if (below) {
    top = targetRect.bottom + 12;
  }
  appTooltip.style.left = `${left}px`;
  appTooltip.style.top = `${top}px`;
  appTooltip.style.setProperty(
    '--tooltip-arrow-x',
    `${Math.min(Math.max(14, targetCenter - left), tooltipRect.width - 14)}px`,
  );
  appTooltip.classList.toggle('below', below);
}

function showTooltip(target) {
  window.clearTimeout(tooltipTimer);
  tooltipTarget = target;
  tooltipTimer = window.setTimeout(() => {
    if (tooltipTarget !== target || !target.isConnected) {
      return;
    }
    const openDialog = target.closest('dialog[open]');
    const tooltipHost = openDialog || document.body;
    if (appTooltip.parentElement !== tooltipHost) {
      tooltipHost.append(appTooltip);
    }
    appTooltip.textContent = target.dataset.tooltip;
    appTooltip.hidden = false;
    window.requestAnimationFrame(() => positionTooltip(target));
  }, 220);
}

function hideTooltip(target = null) {
  if (target && tooltipTarget !== target) {
    return;
  }
  window.clearTimeout(tooltipTimer);
  tooltipTarget = null;
  appTooltip.hidden = true;
}

upgradeTooltips();
new window.MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes') {
      upgradeTooltips(mutation.target);
    } else {
      mutation.addedNodes.forEach((node) => upgradeTooltips(node));
    }
  });
}).observe(document.body, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ['title'],
});
document.addEventListener('mouseover', (event) => {
  const target = event.target.closest('[data-tooltip]');
  if (target && target !== tooltipTarget) {
    showTooltip(target);
  }
});
document.addEventListener('mouseout', (event) => {
  const target = event.target.closest('[data-tooltip]');
  if (target && !target.contains(event.relatedTarget)) {
    hideTooltip(target);
  }
});
document.addEventListener('focusin', (event) => {
  const target = event.target.closest('[data-tooltip]');
  if (target) {
    showTooltip(target);
  }
});
document.addEventListener('focusout', (event) => {
  const target = event.target.closest('[data-tooltip]');
  if (target) {
    hideTooltip(target);
  }
});
window.addEventListener('blur', () => hideTooltip());

function showSettings(config) {
  state.language = config.language === 'zh-CN' ? 'zh-CN' : 'en-US';
  window.i18n.setLocale(state.language);
  elements.languageSelect.value = state.language;
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
  syncNatureSoundSettings(config);
  activateSettingsTab(state.settingsTab);
  if (!elements.settingsDialog.open) {
    elements.settingsDialog.showModal();
  }
}

function activateSettingsTab(tabId, { focus = false } = {}) {
  const nextTab = elements.settingsTabs.find((tab) => tab.dataset.settingsTab === tabId);
  if (!nextTab) {
    return;
  }
  state.settingsTab = tabId;
  elements.settingsTabs.forEach((tab) => {
    const active = tab === nextTab;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  elements.settingsPanels.forEach((panel) => {
    const active = panel.dataset.settingsPanel === tabId;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
    if (active) {
      panel.scrollTop = 0;
    }
  });
  if (focus) {
    nextTab.focus();
  }
}

function syncNatureSoundSettings(config) {
  state.natureSoundsEnabled = config.natureSoundsEnabled === true;
  state.natureSoundsMasterVolume = Number(config.natureSoundsMasterVolume ?? 35);
  state.natureSoundVolumes = { ...(config.natureSoundVolumes || {}) };
  elements.natureSoundsEnabled.checked = state.natureSoundsEnabled;
  elements.natureSoundsMasterVolume.value = String(state.natureSoundsMasterVolume);
  elements.natureSoundsMasterVolumeValue.textContent = `${state.natureSoundsMasterVolume}%`;
  elements.natureSoundItems.forEach((item) => {
    const id = item.dataset.natureSound;
    const toggle = item.querySelector('.nature-sound-toggle');
    const slider = item.querySelector('.nature-sound-volume');
    const output = item.querySelector('output');
    const volume = Number(state.natureSoundVolumes[id] || 0);
    if (!item.dataset.lastVolume) {
      item.dataset.lastVolume = slider.value;
    }
    if (volume > 0) {
      slider.value = String(volume);
      item.dataset.lastVolume = String(volume);
    }
    toggle.checked = volume > 0;
    slider.disabled = volume <= 0;
    output.textContent = `${slider.value}%`;
  });
  preloadEnabledNatureSounds();
}

function collectNatureSoundSettings() {
  const volumes = {};
  elements.natureSoundItems.forEach((item) => {
    const id = item.dataset.natureSound;
    const toggle = item.querySelector('.nature-sound-toggle');
    const slider = item.querySelector('.nature-sound-volume');
    volumes[id] = toggle.checked ? Number(slider.value) : 0;
  });
  return {
    enabled: elements.natureSoundsEnabled.checked,
    masterVolume: Number(elements.natureSoundsMasterVolume.value),
    volumes,
  };
}

async function saveNatureSoundSettings() {
  const config = await window.pomodoro.setNatureSounds(collectNatureSoundSettings());
  syncNatureSoundSettings(config);
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}

function safeMarkdownUrl(value) {
  try {
    const url = new globalThis.URL(String(value || ''));
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function renderInlineMarkdown(value) {
  const tokens = [];
  const preserve = (html) => {
    const token = `\uE000${tokens.length}\uE001`;
    tokens.push(html);
    return token;
  };
  let text = String(value || '');
  text = text.replace(/`([^`\n]+)`/g, (_match, code) =>
    preserve(`<code>${escapeHtml(code)}</code>`),
  );
  text = text.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (match, label, rawUrl) => {
    const url = safeMarkdownUrl(rawUrl);
    if (!url) {
      return match;
    }
    return preserve(
      `<a href="${escapeHtml(url)}" data-markdown-link="${escapeHtml(url)}">${escapeHtml(label)}</a>`,
    );
  });
  text = escapeHtml(text)
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  return text.replace(/\uE000(\d+)\uE001/g, (_match, index) => tokens[Number(index)] || '');
}

function renderMarkdown(value) {
  const source = String(value || '').trim();
  if (!source) {
    return '<span class="markdown-empty">未填写</span>';
  }
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let index = 0;
  const isBlockStart = (line) =>
    /^\s*$/.test(line) ||
    /^```/.test(line) ||
    /^(#{1,3})\s+/.test(line) ||
    /^\s*>\s?/.test(line) ||
    /^\s*[-+*]\s+/.test(line) ||
    /^\s*\d+[.)]\s+/.test(line);
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (/^```/.test(line)) {
      const code = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      index += index < lines.length ? 1 : 0;
      output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length + 2;
      output.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      output.push(`<blockquote>${quote.map(renderInlineMarkdown).join('<br>')}</blockquote>`);
      continue;
    }
    const unordered = /^\s*[-+*]\s+/.test(line);
    const ordered = /^\s*\d+[.)]\s+/.test(line);
    if (unordered || ordered) {
      const tag = ordered ? 'ol' : 'ul';
      const pattern = ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-+*]\s+/;
      const items = [];
      while (index < lines.length && pattern.test(lines[index])) {
        items.push(`<li>${renderInlineMarkdown(lines[index].replace(pattern, ''))}</li>`);
        index += 1;
      }
      output.push(`<${tag}>${items.join('')}</${tag}>`);
      continue;
    }
    const paragraph = [line];
    index += 1;
    while (index < lines.length && !isBlockStart(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }
    output.push(`<p>${paragraph.map(renderInlineMarkdown).join('<br>')}</p>`);
  }
  return output.join('');
}
function formatTaskDuration(seconds) {
  const totalMinutes = Math.round(Math.max(0, Number(seconds) || 0) / 60);
  if (totalMinutes < 60) {
    return window.i18n.t(`${totalMinutes} 分钟`);
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return window.i18n.t(minutes > 0 ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`);
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
  return window.i18n.t(hours > 0 ? `${hours} 小时 ${minutes} 分` : `${minutes} 分 ${rest} 秒`);
}
function formatCompactDuration(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  if (safeSeconds < 60) {
    return window.i18n.t(`${safeSeconds} 秒`);
  }
  if (safeSeconds === 3600) {
    return window.i18n.t('1 小时');
  }
  if (safeSeconds > 3600) {
    return window.i18n.t(`${(safeSeconds / 3600).toFixed(1)} 小时`);
  }
  return window.i18n.t(`${Math.floor(safeSeconds / 60)} 分钟`);
}

function formatDashboardTotalDuration(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  if (safeSeconds < 60) {
    return window.i18n.t(`${safeSeconds} 秒`);
  }
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (hours > 0) {
    return window.i18n.t(minutes > 0 ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`);
  }
  return window.i18n.t(`${minutes} 分钟`);
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
  return new Date(year, month - 1, day).toLocaleDateString(state.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}
function orderedTasks() {
  const children = childMap();
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

function childMap(tasks = state.tasks) {
  const children = new Map();
  tasks.forEach((task) => {
    const key = task.parent_id || 0;
    children.set(key, [...(children.get(key) || []), task]);
  });
  children.forEach((siblings) => {
    siblings.sort(
      (first, second) => Number(first.status === 'done') - Number(second.status === 'done'),
    );
  });
  return children;
}

function descendantIds(parentId, children) {
  return (children.get(parentId) || []).flatMap((task) => [
    task.id,
    ...descendantIds(task.id, children),
  ]);
}

function taskFilterResult(query) {
  const normalized = String(query || '')
    .trim()
    .toLocaleLowerCase('zh-CN');
  if (!normalized) {
    return null;
  }
  const tasksById = new Map(state.tasks.map((task) => [task.id, task]));
  const children = childMap();
  const matches = state.tasks.filter((task) =>
    task.title.toLocaleLowerCase('zh-CN').includes(normalized),
  );
  const visibleIds = new Set();
  matches.forEach((task) => {
    visibleIds.add(task.id);
    descendantIds(task.id, children).forEach((id) => visibleIds.add(id));
    let parent = tasksById.get(task.parent_id);
    while (parent) {
      visibleIds.add(parent.id);
      parent = tasksById.get(parent.parent_id);
    }
  });
  return { visibleIds, matchCount: matches.length };
}

function sameDurations(first, second) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function effectiveTaskTimer(task) {
  return {
    focusMinutes: task.focus_minutes ?? state.focusDuration,
    breakMinutes: task.break_minutes ?? state.breakDuration,
  };
}

function renderMoveControls(id, index, total, type) {
  const attribute = type === 'group' ? 'data-move-group' : 'data-move-task';
  const canMoveUp = index > 0;
  const canMoveDown = index < total - 1;
  return `<div class="move-controls" role="group" aria-label="调整顺序">
    <button class="move-button ${canMoveUp ? '' : 'is-disabled'}" type="button" ${attribute}="${escapeHtml(id)}" data-direction="up" data-can-move="${canMoveUp}" title="${canMoveUp ? '向上移动' : '已经到顶'}" aria-label="${canMoveUp ? '向上移动' : '已经到顶'}" aria-disabled="${!canMoveUp}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 11 4-4 4 4"/></svg></button>
    <button class="move-button ${canMoveDown ? '' : 'is-disabled'}" type="button" ${attribute}="${escapeHtml(id)}" data-direction="down" data-can-move="${canMoveDown}" title="${canMoveDown ? '向下移动' : '已经到底'}" aria-label="${canMoveDown ? '向下移动' : '已经到底'}" aria-disabled="${!canMoveDown}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 9 4 4 4-4"/></svg></button>
  </div>`;
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
    return start.toLocaleDateString(state.language, {
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
  return `${start.toLocaleDateString(state.language, options)} – ${end.toLocaleDateString(state.language, options)}`;
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
      label: date.toLocaleDateString(state.language, { weekday: 'short' }),
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
  elements.dashboardTotalTime.textContent = formatDashboardTotalDuration(totalSeconds);
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

function movingTaskTitleConflict(taskIds, targetParentId) {
  const movingIds = new Set(taskIds);
  const occupiedTitles = new Map();
  state.tasks.forEach((task) => {
    if (
      task.is_group !== 1 &&
      String(task.parent_id) === String(targetParentId) &&
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

function renderTreeItem(task, depth, children, allChildren = children) {
  const selecting = state.groupSelectionMode;
  const isRoot = depth === 0;
  const hasChildren = (children.get(task.id) || []).length > 0;
  const collapsed = !state.taskFilter.trim() && state.collapsedTaskIds.has(task.id);
  const timer = effectiveTaskTimer(task);
  const siblings = allChildren.get(task.parent_id) || [];
  const siblingIndex = siblings.findIndex((sibling) => sibling.id === task.id);
  const completionButton = `<button class="completion-button ${task.status === 'done' ? 'is-complete' : ''}" data-action="toggle-complete" data-id="${task.id}" type="button" title="${task.status === 'done' ? '恢复为未完成' : '标记完成'}" aria-label="${task.status === 'done' ? `将 ${escapeHtml(task.title)} 恢复为未完成` : `将 ${escapeHtml(task.title)} 标记完成`}" aria-pressed="${task.status === 'done'}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path class="completion-check" d="m8.5 12 2.3 2.4 4.9-5"/></svg></button>`;
  const historyButton = `<button class="history-button" data-action="history" data-id="${task.id}" type="button" title="查看专注记录" aria-label="查看 ${escapeHtml(task.title)} 的专注记录"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.8 8.2A8 8 0 1 1 4 14M4.8 8.2V4.5M4.8 8.2h3.7M12 8v4.5l3 1.8" /></svg></button>`;
  const availableActions =
    task.status === 'done'
      ? `<span class="completed-action-spacer completed-action-spacer--pomodoro" aria-hidden="true"></span>${completionButton}${historyButton}<span class="completed-action-spacer completed-action-spacer--icon" aria-hidden="true"></span><span class="completed-action-spacer completed-action-spacer--move" aria-hidden="true"></span><span class="completed-action-spacer completed-action-spacer--icon" aria-hidden="true"></span><span class="completed-action-spacer completed-action-spacer--icon" aria-hidden="true"></span>`
      : `<button class="pomodoro-control" data-action="start-pomodoro" data-id="${task.id}" title="启动番茄钟 · 专注 ${timer.focusMinutes} 分钟，休息 ${timer.breakMinutes} 分钟" aria-label="在 ${escapeHtml(task.title)} 上启动番茄钟，专注 ${timer.focusMinutes} 分钟，休息 ${timer.breakMinutes} 分钟">
      <span class="pomodoro-icon" aria-hidden="true">🍅</span>
      <span class="pomodoro-duration">${timer.focusMinutes}/${timer.breakMinutes}</span>
    </button>
    ${completionButton}
    ${historyButton}
    <button class="timer-settings-button" data-action="timer-settings" data-id="${task.id}" type="button" title="设置番茄钟时长" aria-label="设置 ${escapeHtml(task.title)} 的番茄钟时长"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.8 1.8M9 3h6M12 3v2"/></svg></button>
    ${renderMoveControls(task.id, siblingIndex, siblings.length, 'task')}
    <button class="item-rename-button" data-action="rename" data-id="${task.id}" type="button" title="重命名事项" aria-label="重命名 ${escapeHtml(task.title)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4 4-.8L18 8.4 15.6 6zM13.8 7.8l2.4 2.4" /></svg></button>
    <button class="child-add-button" data-action="child" data-id="${task.id}" type="button" title="新建子条目" aria-label="在 ${escapeHtml(task.title)} 下新建子条目"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h9M4 12h6M4 18h9M17 10v6m-3-3h6" /></svg></button>`;
  const descendants =
    hasChildren && !collapsed
      ? (children.get(task.id) || [])
          .map((child) => renderTreeItem(child, depth + 1, children, allChildren))
          .join('')
      : '';
  return `<div class="tree-task-branch depth-${Math.min(depth, 6)} ${hasChildren ? 'has-children' : ''}">
    <div class="root-item tree-task ${state.selectedRootId === task.id ? 'selected' : ''} ${selecting && isRoot ? 'selecting' : ''} ${state.selectedTaskIds.has(task.id) ? 'batch-selected' : ''} ${task.status === 'done' ? 'done' : ''}" data-task-id="${task.id}" data-drag-task-id="${task.id}" draggable="true">
    ${selecting && isRoot ? `<input class="root-selection-check" type="checkbox" data-select-task="${task.id}" aria-label="选择 ${escapeHtml(task.title)}" ${state.selectedTaskIds.has(task.id) ? 'checked' : ''}>` : ''}
    ${hasChildren ? `<button class="tree-collapse-button ${collapsed ? 'is-collapsed' : ''}" data-action="collapse-one" data-id="${task.id}" aria-label="${collapsed ? '展开子项' : '折叠子项'}" aria-expanded="${!collapsed}"><span class="task-group__chevron" aria-hidden="true"></span></button>` : '<span class="tree-collapse-spacer" aria-hidden="true"></span>'}
    <button class="root-select" data-tree-select="${task.id}">
      <span>${escapeHtml(task.title)}</span>
      <small>${task.session_count} 个番茄 · ${formatTaskDuration(task.focused_seconds)}</small>
    </button>
    ${availableActions}
    </div>
    ${descendants}
  </div>`;
}

function renderTasks() {
  const filterResult = taskFilterResult(state.taskFilter);
  const isFiltering = filterResult !== null;
  const allTasks = orderedTasks();
  const tasks = isFiltering
    ? allTasks.filter((task) => filterResult.visibleIds.has(task.id))
    : allTasks;
  const groupIds = new Set(state.taskGroups.map((group) => group.id));
  const roots = tasks.filter((task) => task.is_group !== 1 && groupIds.has(String(task.parent_id)));
  const rootIds = new Set(
    allTasks
      .filter((task) => task.is_group !== 1 && groupIds.has(String(task.parent_id)))
      .map((task) => task.id),
  );
  state.selectedTaskIds = new Set(
    [...state.selectedTaskIds].filter((taskId) => rootIds.has(taskId)),
  );
  const children = childMap(tasks);
  const allChildren = childMap();
  elements.board.hidden = false;
  const groupedRoots = new Map(state.taskGroups.map((group) => [group.id, []]));
  roots.forEach((task) => groupedRoots.get(groupIdForTask(task.id)).push(task));
  const groupMarkup = state.taskGroups
    .map((group, groupIndex) => {
      const groupRoots = groupedRoots.get(group.id) || [];
      if (
        isFiltering &&
        groupRoots.length === 0 &&
        !filterResult.visibleIds.has(Number(group.id))
      ) {
        return '';
      }
      const selectedRootCount = groupRoots.filter((task) =>
        state.selectedTaskIds.has(task.id),
      ).length;
      const allRootsSelected = groupRoots.length > 0 && selectedRootCount === groupRoots.length;
      const groupSelected = allRootsSelected || state.selectedGroupIds.has(group.id);
      const selectingClass = state.groupSelectionMode ? 'selecting' : '';
      const groupCheckbox = state.groupSelectionMode
        ? `<input class="group-selection-check" type="checkbox" data-select-group="${escapeHtml(group.id)}" aria-label="选择 ${escapeHtml(group.name)} 中的全部事项" ${groupSelected ? 'checked' : ''} data-partial="${selectedRootCount > 0 && !allRootsSelected}">`
        : '';
      return `<section class="task-group ${group.collapsed && !isFiltering ? 'collapsed' : ''}" data-group-id="${escapeHtml(group.id)}">
        <header class="task-group__header ${selectingClass}">
          ${groupCheckbox}
          <button class="task-group__toggle" type="button" data-toggle-group="${escapeHtml(group.id)}" aria-expanded="${isFiltering || !group.collapsed}">
            <span class="task-group__chevron" aria-hidden="true"></span>
            <span>${escapeHtml(group.name)}</span>
            ${group.id === state.defaultTaskGroupId ? '<span class="task-group__default-label" title="默认分组">默认</span>' : ''}
            <span class="task-group__count">${groupRoots.length}</span>
          </button>
          <button class="group-default-button ${group.id === state.defaultTaskGroupId ? 'active' : ''}" type="button" data-set-default-group="${escapeHtml(group.id)}" title="${group.id === state.defaultTaskGroupId ? '当前默认分组' : '设为默认分组'}" aria-label="${group.id === state.defaultTaskGroupId ? `${escapeHtml(group.name)} 是当前默认分组` : `将 ${escapeHtml(group.name)} 设为默认分组`}" aria-pressed="${group.id === state.defaultTaskGroupId}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6-4.4-4.3 6.1-.9z" /></svg></button>
          ${renderMoveControls(group.id, groupIndex, state.taskGroups.length, 'group')}
          <button class="group-rename-button" type="button" data-rename-group="${escapeHtml(group.id)}" title="重命名分组" aria-label="重命名 ${escapeHtml(group.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.8 4 4-.8L18 8.4 15.6 6zM13.8 7.8l2.4 2.4" /></svg></button>
          <button class="child-add-button group-add-button" type="button" data-add-root-to-group="${escapeHtml(group.id)}" title="在此分组中新建事项" aria-label="在 ${escapeHtml(group.name)} 中新建事项"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h9M4 12h6M4 18h9M17 10v6m-3-3h6" /></svg></button>
        </header>
        <div class="task-group__items">
          ${groupRoots.length ? groupRoots.map((task) => renderTreeItem(task, 0, children, allChildren)).join('') : '<div class="task-group__empty">暂无事项，可拖动到这里</div>'}
        </div>
      </section>`;
    })
    .join('');
  elements.rootList.innerHTML =
    groupMarkup || '<div class="task-search-empty">没有找到符合条件的事项</div>';
  elements.taskSearchCount.textContent = isFiltering ? `${filterResult.matchCount} 个匹配` : '';
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
      rootTaskIdsForGroup(group.id).length === 0,
  );
  elements.deleteGroups.disabled = state.selectedTaskIds.size === 0 && !selectedEmptyCustomGroup;
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

function topLevelTaskId(id) {
  const taskMap = new Map(state.tasks.map((task) => [task.id, task]));
  let current = taskMap.get(Number(id));
  if (!current) {
    return null;
  }
  while (current.parent_id) {
    const parent = taskMap.get(current.parent_id);
    if (!parent || parent.is_group === 1) {
      break;
    }
    current = parent;
  }
  return current.id;
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
  if (state.selectedRootId && !state.tasks.some((task) => task.id === state.selectedRootId)) {
    state.selectedRootId = null;
  }
  syncGroupsFromTasks();
  renderTasks();
  if (state.currentView === 'dashboard') {
    await renderDashboard();
  }
}

function renderDatabaseImportPreview(preview) {
  const summary = preview.summary;
  elements.databaseImportFile.textContent = preview.fileName;
  elements.databaseImportTaskCount.textContent = String(summary.sourceTaskCount);
  elements.databaseImportSessionCount.textContent = String(summary.sourceSessionCount);
  elements.databaseImportDuplicateCount.textContent = String(summary.duplicateSessionCount);
  elements.databaseImportConflictCount.textContent = String(summary.conflictCount);
  elements.databaseImportConflicts.hidden = summary.conflictCount === 0;
  elements.databaseImportConflictList.replaceChildren();
  preview.conflicts.slice(0, 20).forEach((conflict) => {
    const item = document.createElement('div');
    item.className = 'database-import-conflict-item';
    const appendSession = (label, session) => {
      const row = document.createElement('div');
      row.className = 'database-import-conflict-session';
      const source = document.createElement('span');
      source.className = 'database-import-conflict-source';
      source.textContent = label;
      const details = document.createElement('div');
      const task = document.createElement('strong');
      task.textContent = session.task_path;
      const time = document.createElement('time');
      const start = new Date(session.started_at);
      const end = new Date(session.completed_at);
      time.textContent = `${start.toLocaleString()} – ${end.toLocaleTimeString()}`;
      details.append(task, time);
      row.append(source, details);
      item.append(row);
    };
    conflict.current.forEach((session) => appendSession('本机', session));
    appendSession('导入', conflict.imported);
    elements.databaseImportConflictList.append(item);
  });
  elements.databaseImportOverwrite.hidden = preview.canOverwrite !== true;
  elements.databaseImportKeepImported.hidden = summary.conflictCount === 0;
  elements.databaseImportKeepCurrent.textContent =
    summary.conflictCount === 0 ? '确认合并' : '合并并保留本机冲突记录';
  elements.databaseImportDialog.showModal();
}

async function applyDatabaseImport(mode) {
  const buttons = [
    elements.databaseImportOverwrite,
    elements.databaseImportKeepCurrent,
    elements.databaseImportKeepImported,
  ];
  buttons.forEach((button) => {
    button.disabled = true;
  });
  try {
    const summary = await window.pomodoro.applyDatabaseImport(mode);
    elements.databaseImportDialog.close();
    state.selectedRootId = null;
    state.collapsedTaskIds.clear();
    await refresh();
    await showActionDialog({
      eyebrow: '数据库同步完成',
      title: mode === 'overwrite' ? '本机数据已被替换' : '数据库合并完成',
      message: `新增 ${summary.importedTaskCount} 个事项，导入 ${summary.importedSessionCount} 条专注记录。`,
      detail:
        summary.duplicateSessionCount > 0
          ? `已自动跳过 ${summary.duplicateSessionCount} 条完全相同的记录。`
          : '',
    });
  } catch (error) {
    await showActionDialog({
      eyebrow: '数据库同步失败',
      title: '没有修改当前数据',
      message: error.message,
      detail: '请确认所选文件来自番茄钟，并且文件没有损坏。',
    });
  } finally {
    buttons.forEach((button) => {
      button.disabled = false;
    });
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
async function openTaskHistory(taskId, options = {}) {
  const task = taskById(taskId);
  if (!task) {
    return;
  }
  const sessions = await window.pomodoro.listTaskSessions(taskId);
  state.historyTaskId = taskId;
  state.historySessions = new Map(sessions.map((session) => [session.id, session]));
  state.historyOpenedFromSearch = options.fromSearch === true;
  elements.historyRecordSearchInput.value = '';
  elements.historyRecordSearchStart.value = '';
  elements.historyRecordSearchEnd.value = '';
  elements.historyRecordSearchSummary.textContent = '';
  elements.historyRecordSearchError.textContent = '';
  elements.historyRecordSearchError.hidden = true;
  elements.historyRecordSearchEmpty.hidden = true;
  elements.taskHistoryContent.hidden = false;
  elements.clearHistoryRecordSearch.hidden = true;
  elements.clearHistoryRecordSearchRange.hidden = true;
  elements.historyBackToSearch.hidden = !state.historyOpenedFromSearch;
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
            ) => `<div class="history-entry ${session.counts_as_pomodoro ? '' : 'interrupted'}" data-history-session-id="${session.id}">
              <div class="history-entry__overview">
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
              </div>
              <div class="history-entry__note" data-session-note="${session.id}">
                <div class="history-entry__note-header">
                  <button type="button" data-edit-session-note="${session.id}">修改</button>
                </div>
                <div class="markdown-content">${renderMarkdown(session.note)}</div>
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
          <div class="history-day__entries">
            <div class="history-day__columns" aria-hidden="true"><span>专注时间</span><span>事项记录</span></div>
            ${rows}
          </div>
        </details>`;
      })
      .join('');
  }
  if (elements.recordSearchDialog.open) {
    elements.recordSearchDialog.close();
  }
  elements.taskHistoryDialog.showModal();
  if (options.targetSessionId) {
    window.requestAnimationFrame(() => {
      const target = elements.taskHistoryContent.querySelector(
        `[data-history-session-id="${Number(options.targetSessionId)}"]`,
      );
      if (!target) {
        return;
      }
      const day = target.closest('details');
      if (day) {
        day.open = true;
      }
      target.classList.add('is-search-target');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}

function readSearchDateRange(startInput, endInput) {
  const startDate = startInput.value;
  const endDate = endInput.value;
  if (startDate && endDate && startDate > endDate) {
    throw new Error('开始日期不能晚于结束日期');
  }
  return { startDate, endDate };
}

function historyNoteMatcher(query) {
  if (!query) {
    return () => true;
  }
  if (elements.historyRecordSearchRegex.checked) {
    let expression;
    try {
      expression = new RegExp(query, elements.historyRecordSearchCase.checked ? 'u' : 'iu');
    } catch (error) {
      throw new Error(`正则表达式无效：${error.message}`);
    }
    return (note) => expression.test(note);
  }
  const expected = elements.historyRecordSearchCase.checked
    ? query
    : query.toLocaleLowerCase('zh-CN');
  return (note) => {
    const value = elements.historyRecordSearchCase.checked ? note : note.toLocaleLowerCase('zh-CN');
    return value.includes(expected);
  };
}

function restoreHistoryRecordVisibility(days) {
  days.forEach((day) => {
    day.hidden = false;
    day.classList.remove('is-filtered');
    day.querySelectorAll('.history-entry').forEach((entry) => {
      entry.hidden = false;
    });
    const summary = day.querySelector('.history-day__summary');
    if (summary?.dataset.unfilteredText) {
      summary.textContent = summary.dataset.unfilteredText;
    }
  });
}

function applyHistoryRecordSearch() {
  const query = elements.historyRecordSearchInput.value.trim();
  const days = [...elements.taskHistoryContent.querySelectorAll('.history-day')];
  elements.historyRecordSearchError.textContent = '';
  elements.historyRecordSearchError.hidden = true;
  elements.clearHistoryRecordSearch.hidden = !query;
  elements.clearHistoryRecordSearchRange.hidden = !(
    elements.historyRecordSearchStart.value || elements.historyRecordSearchEnd.value
  );

  if (
    !query &&
    !elements.historyRecordSearchStart.value &&
    !elements.historyRecordSearchEnd.value
  ) {
    elements.historyRecordSearchSummary.textContent = '';
    elements.historyRecordSearchEmpty.hidden = true;
    elements.taskHistoryContent.hidden = false;
    restoreHistoryRecordVisibility(days);
    return;
  }

  let matches;
  let dateRange;
  try {
    dateRange = readSearchDateRange(
      elements.historyRecordSearchStart,
      elements.historyRecordSearchEnd,
    );
    matches = historyNoteMatcher(query);
  } catch (error) {
    elements.historyRecordSearchSummary.textContent = '';
    elements.historyRecordSearchError.textContent = error.message;
    elements.historyRecordSearchError.hidden = false;
    elements.historyRecordSearchEmpty.hidden = true;
    elements.taskHistoryContent.hidden = false;
    restoreHistoryRecordVisibility(days);
    return;
  }

  let resultCount = 0;
  days.forEach((day) => {
    const matchingSessions = [];
    day.querySelectorAll('.history-entry').forEach((entry) => {
      const session = state.historySessions.get(Number(entry.dataset.historySessionId));
      const sessionDate = session?.local_date || '';
      const inDateRange = Boolean(
        session &&
        (!dateRange.startDate || sessionDate >= dateRange.startDate) &&
        (!dateRange.endDate || sessionDate <= dateRange.endDate),
      );
      const matched = Boolean(
        inDateRange && String(session.note || '').trim() && matches(String(session.note || '')),
      );
      entry.hidden = !matched;
      if (matched) {
        matchingSessions.push(session);
      }
    });
    const summary = day.querySelector('.history-day__summary');
    if (summary) {
      summary.dataset.unfilteredText ||= summary.textContent;
      const matchingSeconds = matchingSessions.reduce(
        (total, session) => total + session.duration_seconds,
        0,
      );
      summary.textContent = `${matchingSessions.length} 条记录 · ${formatRecordedDuration(matchingSeconds)}`;
    }
    day.hidden = matchingSessions.length === 0;
    day.classList.toggle('is-filtered', matchingSessions.length > 0);
    if (matchingSessions.length > 0) {
      day.open = true;
      resultCount += matchingSessions.length;
    }
  });
  elements.historyRecordSearchSummary.textContent = `${resultCount} 条结果`;
  elements.historyRecordSearchEmpty.hidden = resultCount !== 0;
  elements.taskHistoryContent.hidden = resultCount === 0;
}

function renderTimer() {
  elements.activeTimer.hidden = !state.running;
  elements.openTimerPopup.textContent = state.timerPopupOpen ? '关闭小窗' : '打开小窗';
  elements.activeTimerNote.hidden = !state.running || state.timerMode !== 'focus';
  elements.activeTimerNote.classList.toggle('has-draft', Boolean(state.focusDraftNote.trim()));
  elements.activeTimerNote.title = state.focusDraftNote.trim()
    ? '继续编辑当前番茄的随手记'
    : '记录当前番茄的想法';
  upgradeTooltips(elements.activeTimerNote);
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
    endsAt: state.endsAt,
    running: state.running,
    phase: state.timerMode,
    title: state.timerMode === 'focus' ? taskPath(state.activeTaskId) : '休息',
  };
}

const activeSoundPlayers = new Set();
const natureSoundPlayers = new Map();
const natureSoundBufferPromises = new Map();
let natureAudioContext = null;
let natureSoundGeneration = 0;
let fallbackAudioContext = null;

function natureSoundTargetVolume(id) {
  const master = Math.min(100, Math.max(0, Number(state.natureSoundsMasterVolume || 0))) / 100;
  const track = Math.min(100, Math.max(0, Number(state.natureSoundVolumes[id] || 0))) / 100;
  return Math.min(1, master * track);
}

function getNatureAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }
  natureAudioContext ||= new AudioContextClass();
  return natureAudioContext;
}

async function loadNatureSoundBuffer(id) {
  const context = getNatureAudioContext();
  if (!context) {
    throw new Error('当前环境不支持 Web Audio');
  }
  if (!natureSoundBufferPromises.has(id)) {
    const promise = window.pomodoro
      .loadNatureSound(id)
      .then((data) => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength))
      .then((data) => context.decodeAudioData(data))
      .catch((error) => {
        natureSoundBufferPromises.delete(id);
        throw error;
      });
    natureSoundBufferPromises.set(id, promise);
  }
  return natureSoundBufferPromises.get(id);
}

function rampNatureSoundVolume(player, target, duration = 0.18) {
  const context = getNatureAudioContext();
  if (!context) {
    return;
  }
  const now = context.currentTime;
  const gain = player.gain.gain;
  if (typeof gain.cancelAndHoldAtTime === 'function') {
    gain.cancelAndHoldAtTime(now);
  } else {
    const current = gain.value;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(current, now);
  }
  gain.linearRampToValueAtTime(Math.max(0, target), now + duration);
}

function retireNatureSoundPlayer(player, immediate = false) {
  const context = getNatureAudioContext();
  if (!context) {
    return;
  }
  const fadeSeconds = immediate ? 0 : 0.45;
  rampNatureSoundVolume(player, 0, fadeSeconds);
  try {
    player.source.stop(context.currentTime + fadeSeconds + 0.02);
  } catch {
    // The source may already have ended while the timer was being stopped.
  }
}

function stopNatureSounds({ immediate = false } = {}) {
  natureSoundGeneration += 1;
  natureSoundPlayers.forEach((player) => retireNatureSoundPlayer(player, immediate));
  natureSoundPlayers.clear();
}

function syncNatureSoundPlayerVolumes() {
  natureSoundPlayers.forEach((player, id) => {
    const target = natureSoundTargetVolume(id);
    if (target > 0) {
      rampNatureSoundVolume(player, target);
      return;
    }
    natureSoundPlayers.delete(id);
    retireNatureSoundPlayer(player);
  });
}

function startNatureSounds() {
  if (!state.running || state.timerMode !== 'focus' || !state.natureSoundsEnabled) {
    stopNatureSounds();
    return;
  }
  const context = getNatureAudioContext();
  if (!context) {
    return;
  }
  const generation = ++natureSoundGeneration;
  context.resume().catch(() => {});
  NATURE_SOUND_LIBRARY.forEach(({ id }) => {
    const target = natureSoundTargetVolume(id);
    const existing = natureSoundPlayers.get(id);
    if (target <= 0) {
      if (existing) {
        natureSoundPlayers.delete(id);
        retireNatureSoundPlayer(existing);
      }
      return;
    }
    if (existing) {
      rampNatureSoundVolume(existing, target);
      return;
    }
    loadNatureSoundBuffer(id)
      .then((buffer) => {
        if (
          generation !== natureSoundGeneration ||
          !state.running ||
          state.timerMode !== 'focus' ||
          !state.natureSoundsEnabled ||
          natureSoundTargetVolume(id) <= 0 ||
          natureSoundPlayers.has(id)
        ) {
          return;
        }
        const source = context.createBufferSource();
        const gain = context.createGain();
        const player = { source, gain };
        source.buffer = buffer;
        source.loop = true;
        gain.gain.setValueAtTime(0, context.currentTime);
        source.connect(gain).connect(context.destination);
        source.addEventListener('ended', () => {
          source.disconnect();
          gain.disconnect();
        });
        natureSoundPlayers.set(id, player);
        source.start();
        rampNatureSoundVolume(player, natureSoundTargetVolume(id), 0.9);
      })
      .catch(() => {
        // Keep the Pomodoro timer usable even if an optional sound cannot be decoded.
      });
  });
}

function preloadEnabledNatureSounds() {
  if (!state.natureSoundsEnabled) {
    return;
  }
  NATURE_SOUND_LIBRARY.filter(({ id }) => natureSoundTargetVolume(id) > 0).forEach(({ id }) => {
    loadNatureSoundBuffer(id).catch(() => {});
  });
}

function playAudioFile(url) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    let settled = false;
    const finish = (error = null) => {
      if (settled) {
        return;
      }
      settled = true;
      activeSoundPlayers.delete(audio);
      audio.removeAttribute('src');
      audio.load();
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };
    activeSoundPlayers.add(audio);
    audio.preload = 'auto';
    audio.volume = 0.82;
    audio.addEventListener('ended', () => finish(), { once: true });
    audio.addEventListener('error', () => finish(new Error(`无法播放音频：${url}`)), {
      once: true,
    });
    audio.src = url;
    audio.play().catch((error) => finish(error));
  });
}

async function playFallbackChime() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }
  fallbackAudioContext ||= new AudioContextClass();
  if (fallbackAudioContext.state === 'suspended') {
    await fallbackAudioContext.resume();
  }
  const start = fallbackAudioContext.currentTime + 0.02;
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((frequency, index) => {
    const oscillator = fallbackAudioContext.createOscillator();
    const gain = fallbackAudioContext.createGain();
    const noteStart = start + index * 0.18;
    const noteEnd = noteStart + 0.72;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.11, noteStart + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
    oscillator.connect(gain);
    gain.connect(fallbackAudioContext.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteEnd);
  });
}

async function playSound(url, fallbackUrl) {
  const candidates = [...new Set([url, fallbackUrl].filter(Boolean))];
  for (const candidate of candidates) {
    try {
      await playAudioFile(candidate);
      return;
    } catch (error) {
      console.warn('提示音播放失败，正在尝试备用方案。', error);
    }
  }
  try {
    await playFallbackChime();
  } catch (error) {
    console.error('提示音和跨平台备用音均播放失败。', error);
  }
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

async function selectTaskFromAction(taskId) {
  if (state.running && taskId !== state.activeTaskId) {
    await showActionDialog({
      mode: 'notice',
      eyebrow: '当前事项已锁定',
      title: '番茄进行中，不能切换事项',
      message: `当前正在专注“${taskPath(state.activeTaskId)}”。`,
      detail: '完成或打断当前番茄后，才可以操作其他事项。',
      confirmLabel: '知道了',
    });
    return false;
  }
  state.selectedRootId = taskId;
  renderTasks();
  return true;
}

function openSessionNoteDialog(sessionId, taskId, note = '', editing = false) {
  if (!sessionId) {
    return;
  }
  state.sessionNoteMode = editing ? 'edit' : 'final';
  state.pendingNoteSessionId = sessionId;
  elements.sessionNoteEyebrow.textContent = editing ? '修改记录' : '番茄小结';
  elements.sessionNoteHeading.textContent = editing ? '修改事项记录' : '这个番茄完成了什么？';
  elements.sessionNoteTask.textContent = taskPath(taskId);
  const session = editing ? state.historySessions.get(sessionId) : null;
  elements.sessionNoteMeta.hidden = !session;
  if (session) {
    elements.sessionNoteDate.textContent = formatHistoryDate(session.local_date || '');
    elements.sessionNoteTime.textContent = `${session.local_start_time || '--:--:--'} 至 ${session.local_end_time || '--:--:--'}`;
    elements.sessionNoteDuration.textContent = formatRecordedDuration(session.duration_seconds);
    elements.sessionNoteStatus.textContent = session.counts_as_pomodoro ? '完整番茄' : '被打断';
    elements.sessionNoteStatus.classList.toggle('interrupted', !session.counts_as_pomodoro);
  }
  elements.sessionNote.value = note;
  elements.skipSessionNote.textContent = editing
    ? '取消'
    : note.trim()
      ? '保持当前记录'
      : '暂不填写';
  elements.sessionNoteSubmit.textContent = '保存记录';
  elements.markdownHelpPanel.hidden = true;
  elements.markdownHelpToggle.setAttribute('aria-expanded', 'false');
  elements.markdownHelpToggle.querySelector('span').textContent = 'Markdown 语法帮助';
  elements.sessionNoteDialog.showModal();
  elements.sessionNote.focus();
}

function openFocusDraftDialog() {
  if (!state.running || state.timerMode !== 'focus' || !state.activeTaskId) {
    return;
  }
  state.sessionNoteMode = 'draft';
  state.pendingNoteSessionId = null;
  elements.sessionNoteEyebrow.textContent = '专注随手记';
  elements.sessionNoteHeading.textContent = '记录当前番茄的想法';
  elements.sessionNoteTask.textContent = `${taskPath(state.activeTaskId)} · 草稿将在本次专注结束时自动写入记录`;
  elements.sessionNoteMeta.hidden = true;
  elements.sessionNote.value = state.focusDraftNote;
  elements.skipSessionNote.textContent = '取消';
  elements.sessionNoteSubmit.textContent = '保存草稿';
  elements.markdownHelpPanel.hidden = true;
  elements.markdownHelpToggle.setAttribute('aria-expanded', 'false');
  elements.markdownHelpToggle.querySelector('span').textContent = 'Markdown 语法帮助';
  elements.sessionNoteDialog.showModal();
  elements.sessionNote.focus();
}

let historyRecordSearchTimer = null;
let recordSearchTimer = null;
let recordSearchRequest = 0;

async function runRecordSearch() {
  const query = elements.recordSearchInput.value.trim();
  const hasDateRange = Boolean(elements.recordSearchStart.value || elements.recordSearchEnd.value);
  window.clearTimeout(recordSearchTimer);
  elements.recordSearchError.hidden = true;
  elements.recordSearchError.textContent = '';
  elements.clearRecordSearchRange.hidden = !hasDateRange;
  if (!query && !hasDateRange) {
    elements.recordSearchSummary.textContent = '';
    elements.recordSearchResults.innerHTML =
      '<div class="record-search-placeholder">输入内容或选择时间范围后开始搜索</div>';
    return;
  }
  const requestId = ++recordSearchRequest;
  elements.recordSearchSummary.textContent = '搜索中…';
  try {
    const dateRange = readSearchDateRange(elements.recordSearchStart, elements.recordSearchEnd);
    const sessions = await window.pomodoro.searchSessionNotes({
      query,
      useRegex: elements.recordSearchRegex.checked,
      caseSensitive: elements.recordSearchCase.checked,
      ...dateRange,
    });
    if (requestId !== recordSearchRequest) {
      return;
    }
    elements.recordSearchSummary.textContent = `${sessions.length} 条结果`;
    elements.recordSearchResults.innerHTML = sessions.length
      ? sessions
          .map((session) => {
            const completedAt = new Date(session.completed_at);
            const dateLabel = Number.isNaN(completedAt.getTime())
              ? session.completed_at
              : completedAt.toLocaleString(state.language, {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });
            return `<article class="record-search-result">
              <div class="record-search-result__meta">
                <span class="record-search-result__path">${escapeHtml(taskPath(session.task_id))}</span>
                <span>${formatRecordedDuration(session.duration_seconds)}</span>
                <time>${escapeHtml(dateLabel)}</time>
                <button class="record-search-result__jump" type="button" data-open-search-session="${session.id}" data-task-id="${session.task_id}" title="跳转到此记录" aria-label="在完整专注历史中定位这条记录">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16 16 8M10 8h6v6"/><path d="M18 13v5H6V6h5"/></svg>
                </button>
              </div>
              <div class="markdown-content">${renderMarkdown(session.note)}</div>
            </article>`;
          })
          .join('')
      : '<div class="record-search-placeholder">没有找到符合条件的记录</div>';
    upgradeTooltips(elements.recordSearchResults);
  } catch (error) {
    if (requestId !== recordSearchRequest) {
      return;
    }
    elements.recordSearchSummary.textContent = '';
    const errorMessage = error.message || '搜索失败';
    const regexErrorIndex = errorMessage.indexOf('正则表达式无效');
    elements.recordSearchError.textContent =
      regexErrorIndex >= 0 ? errorMessage.slice(regexErrorIndex) : errorMessage;
    elements.recordSearchError.hidden = false;
    elements.recordSearchResults.innerHTML =
      '<div class="record-search-placeholder">请修改搜索条件后重试</div>';
  }
}

async function completeTimer() {
  clearInterval(state.interval);
  state.interval = null;
  state.endsAt = null;
  state.running = false;
  stopNatureSounds();
  if (state.timerMode === 'focus') {
    if (elements.sessionNoteDialog.open && state.sessionNoteMode === 'draft') {
      state.focusDraftNote = elements.sessionNote.value.trim();
      elements.sessionNoteDialog.close();
    }
    const session = await window.pomodoro.recordSession({
      taskId: state.activeTaskId,
      durationSeconds: state.duration,
      startedAt: state.startedAt,
      note: state.focusDraftNote,
    });
    state.completedSessionId = session.sessionId;
    playSound(state.focusEndSoundUrl, 'assets/sounds/focus-end.mp3');
    await refresh();
    state.timerMode = 'break';
    state.duration = state.activeBreakDuration * 60;
    state.remaining = state.duration;
    startTimer();
    await window.pomodoro.notifyTimerCompletion({
      title: window.i18n.t('番茄完成'),
      body: window.i18n.t('这段专注已经记录，开始休息。'),
      timer: timerPopupState(),
    });
    await window.pomodoro.showMainWindow();
    openSessionNoteDialog(session.sessionId, state.activeTaskId, state.focusDraftNote);
    return;
  }
  playSound(state.breakEndSoundUrl, 'assets/sounds/break-end.mp3');
  state.timerMode = 'focus';
  state.duration = state.focusDuration * 60;
  state.remaining = state.duration;
  renderTimer();
  await window.pomodoro.hideTimerPopup();
  state.timerPopupOpen = false;
  await window.pomodoro.notifyTimerCompletion({
    title: window.i18n.t('休息结束'),
    body: window.i18n.t('休息时间结束，可以开始下一个番茄。'),
  });
  await window.pomodoro.showMainWindow();
  state.activeTaskId = null;
  state.completedSessionId = null;
  state.focusDraftNote = '';
}

function updateRemainingFromClock() {
  if (!state.running || !state.endsAt) {
    return;
  }
  state.remaining = Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
}

function syncTimerClock() {
  if (!state.running) {
    return;
  }
  updateRemainingFromClock();
  renderTimer();
  if (state.remaining <= 0 && !state.timerCompleting) {
    state.timerCompleting = true;
    completeTimer().finally(() => {
      state.timerCompleting = false;
    });
  }
}

function startTimer() {
  clearInterval(state.interval);
  state.running = true;
  if (state.remaining === state.duration) {
    state.startedAt = new Date().toISOString();
  }
  state.endsAt = Date.now() + state.remaining * 1000;
  window.pomodoro.showTimerPopup(timerPopupState());
  state.interval = setInterval(syncTimerClock, 500);
  syncTimerClock();
  startNatureSounds();
}

async function startPomodoro(taskId) {
  if (taskById(taskId)?.is_group === 1) {
    return;
  }
  if (state.running) {
    await showActionDialog({
      mode: 'notice',
      eyebrow: '当前事项已锁定',
      title: '番茄进行中，不能切换事项',
      message: `当前正在专注“${taskPath(state.activeTaskId)}”。`,
      detail: '请先完成或打断当前番茄，再启动其他事项。',
      confirmLabel: '知道了',
    });
    return;
  }
  state.activeTaskId = taskId;
  state.selectedRootId = taskId;
  state.completedSessionId = null;
  state.focusDraftNote = '';
  const task = taskById(taskId);
  state.activeFocusDuration = task?.focus_minutes ?? state.focusDuration;
  state.activeBreakDuration = task?.break_minutes ?? state.breakDuration;
  state.timerMode = 'focus';
  state.duration = state.activeFocusDuration * 60;
  state.remaining = state.duration;
  state.startedAt = null;
  renderTasks();
  startTimer();
}

async function interruptTimer() {
  if (!state.running) {
    return;
  }
  updateRemainingFromClock();
  let elapsedSeconds = Math.max(0, state.duration - state.remaining);
  const isFocus = state.timerMode === 'focus';
  const discardShortFocus = isFocus && elapsedSeconds < 30;
  if (!discardShortFocus) {
    const confirmed = await confirmInterrupt(
      isFocus ? '打断当前番茄？' : '提前结束休息？',
      isFocus
        ? `已专注 ${formatTime(elapsedSeconds)} 将被记录，但不计入番茄次数。`
        : '这个番茄已在专注结束时记录，提前结束休息不会影响番茄次数。',
    );
    if (!confirmed) {
      return;
    }
  }
  updateRemainingFromClock();
  elapsedSeconds = Math.max(0, state.duration - state.remaining);
  clearInterval(state.interval);
  state.interval = null;
  state.endsAt = null;
  state.running = false;
  stopNatureSounds();
  if (state.timerMode === 'focus' && !discardShortFocus && elapsedSeconds >= 30) {
    await window.pomodoro.recordSession({
      taskId: state.activeTaskId,
      durationSeconds: elapsedSeconds,
      startedAt: state.startedAt,
      countsAsPomodoro: false,
      note: state.focusDraftNote,
    });
  }
  await window.pomodoro.hideTimerPopup();
  state.timerPopupOpen = false;
  state.timerMode = 'focus';
  state.duration = state.focusDuration * 60;
  state.remaining = state.duration;
  state.activeTaskId = null;
  state.completedSessionId = null;
  state.focusDraftNote = '';
  renderTimer();
  await refresh();
  if (discardShortFocus) {
    await showActionDialog({
      mode: 'notice',
      eyebrow: '本次未记录',
      title: '计时已结束',
      message: `本次专注时长为 ${formatTime(elapsedSeconds)}，不足 30 秒。`,
      detail: '为避免误触产生无效数据，本次计时不会写入数据库。',
      confirmLabel: '知道了',
    });
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
elements.activeTimerNote.addEventListener('click', openFocusDraftDialog);
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
  if (state.sessionNoteMode === 'draft') {
    state.focusDraftNote = elements.sessionNote.value.trim();
    elements.sessionNoteDialog.close();
    renderTimer();
    return;
  }
  if (state.pendingNoteSessionId) {
    const sessionId = state.pendingNoteSessionId;
    const note = elements.sessionNote.value.trim();
    await window.pomodoro.updateSessionNote(sessionId, note);
    const historySession = state.historySessions.get(sessionId);
    if (historySession) {
      historySession.note = note;
      const noteElement = elements.taskHistoryContent.querySelector(
        `[data-session-note="${sessionId}"] .markdown-content`,
      );
      if (noteElement) {
        noteElement.innerHTML = renderMarkdown(note);
      }
      if (elements.historyRecordSearchInput.value.trim()) {
        applyHistoryRecordSearch();
      }
    }
  }
  if (state.sessionNoteMode === 'final') {
    state.focusDraftNote = '';
  }
  state.pendingNoteSessionId = null;
  elements.sessionNoteDialog.close();
});
document.querySelector('#skip-session-note').addEventListener('click', () => {
  if (state.sessionNoteMode === 'final') {
    state.focusDraftNote = '';
  }
  state.pendingNoteSessionId = null;
  elements.sessionNoteDialog.close();
});
elements.markdownHelpToggle.addEventListener('click', () => {
  const open = elements.markdownHelpPanel.hidden;
  elements.markdownHelpPanel.hidden = !open;
  elements.markdownHelpToggle.setAttribute('aria-expanded', String(open));
  elements.markdownHelpToggle.querySelector('span').textContent = open
    ? '收起语法帮助'
    : 'Markdown 语法帮助';
});
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-markdown-link]');
  if (!link) {
    return;
  }
  event.preventDefault();
  window.pomodoro.openExternalLink(link.dataset.markdownLink);
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

elements.historyRecordSearchInput.addEventListener('input', () => {
  window.clearTimeout(historyRecordSearchTimer);
  historyRecordSearchTimer = window.setTimeout(applyHistoryRecordSearch, 180);
});
elements.historyRecordSearchRegex.addEventListener('change', applyHistoryRecordSearch);
elements.historyRecordSearchCase.addEventListener('change', applyHistoryRecordSearch);
elements.historyRecordSearchStart.addEventListener('change', applyHistoryRecordSearch);
elements.historyRecordSearchEnd.addEventListener('change', applyHistoryRecordSearch);
elements.clearHistoryRecordSearch.addEventListener('click', () => {
  elements.historyRecordSearchInput.value = '';
  applyHistoryRecordSearch();
  elements.historyRecordSearchInput.focus();
});
elements.clearHistoryRecordSearchRange.addEventListener('click', () => {
  elements.historyRecordSearchStart.value = '';
  elements.historyRecordSearchEnd.value = '';
  applyHistoryRecordSearch();
});
elements.historyRecordSearchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    applyHistoryRecordSearch();
  }
  if (event.key === 'Escape' && elements.historyRecordSearchInput.value) {
    event.preventDefault();
    elements.historyRecordSearchInput.value = '';
    applyHistoryRecordSearch();
  }
});

elements.historyBackToSearch.addEventListener('click', () => {
  elements.taskHistoryDialog.close();
  state.historyOpenedFromSearch = false;
  elements.historyBackToSearch.hidden = true;
  elements.recordSearchDialog.showModal();
  window.requestAnimationFrame(() => {
    elements.recordSearchResults.scrollTop = state.recordSearchScrollTop;
  });
});

elements.searchRecords.addEventListener('click', () => {
  if (!elements.recordSearchDialog.open) {
    elements.recordSearchDialog.showModal();
  }
  elements.recordSearchInput.focus();
  if (elements.recordSearchInput.value.trim()) {
    runRecordSearch();
  }
});
elements.closeRecordSearch.addEventListener('click', () => elements.recordSearchDialog.close());
elements.recordSearchInput.addEventListener('input', () => {
  window.clearTimeout(recordSearchTimer);
  recordSearchTimer = window.setTimeout(runRecordSearch, 180);
});
elements.recordSearchRegex.addEventListener('change', runRecordSearch);
elements.recordSearchCase.addEventListener('change', runRecordSearch);
elements.recordSearchStart.addEventListener('change', runRecordSearch);
elements.recordSearchEnd.addEventListener('change', runRecordSearch);
elements.clearRecordSearchRange.addEventListener('click', () => {
  elements.recordSearchStart.value = '';
  elements.recordSearchEnd.value = '';
  runRecordSearch();
});
elements.recordSearchResults.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-open-search-session]');
  if (!button) {
    return;
  }
  const taskId = Number(button.dataset.taskId);
  const sessionId = Number(button.dataset.openSearchSession);
  const rootTaskId = topLevelTaskId(taskId);
  if (!rootTaskId) {
    return;
  }
  state.recordSearchScrollTop = elements.recordSearchResults.scrollTop;
  await openTaskHistory(rootTaskId, {
    fromSearch: true,
    targetSessionId: sessionId,
  });
});
elements.recordSearchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    runRecordSearch();
  }
});
elements.taskSearchInput.addEventListener('input', (event) => {
  state.taskFilter = event.target.value;
  renderTasks();
});
elements.clearTaskSearch.addEventListener('click', () => {
  elements.taskSearchInput.value = '';
  state.taskFilter = '';
  renderTasks();
  elements.taskSearchInput.focus();
});
elements.taskSearchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.taskFilter) {
    event.preventDefault();
    elements.taskSearchInput.value = '';
    state.taskFilter = '';
    renderTasks();
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
  const moveButton = event.target.closest('button[data-move-task], button[data-move-group]');
  const taskActionButton = event.target.closest(
    'button[data-move-task], button[data-action][data-id]',
  );
  if (taskActionButton && taskActionButton.dataset.action !== 'collapse-one') {
    const taskId = Number(taskActionButton.dataset.moveTask || taskActionButton.dataset.id);
    if (!(await selectTaskFromAction(taskId))) {
      return;
    }
  }
  if (moveButton) {
    if (moveButton.dataset.canMove !== 'true') {
      return;
    }
    const id = Number(moveButton.dataset.moveTask || moveButton.dataset.moveGroup);
    await window.pomodoro.moveTask(id, moveButton.dataset.direction);
    await refresh();
    return;
  }
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
    await startPomodoro(Number(pomodoroButton.dataset.id));
    return;
  }
  const completionButton = event.target.closest('button[data-action="toggle-complete"]');
  if (completionButton) {
    await window.pomodoro.toggleTask(Number(completionButton.dataset.id));
    await refresh();
    return;
  }
  const historyButton = event.target.closest('button[data-action="history"]');
  if (historyButton) {
    await openTaskHistory(Number(historyButton.dataset.id));
    return;
  }
  const timerSettingsButton = event.target.closest('button[data-action="timer-settings"]');
  if (timerSettingsButton) {
    openTaskTimerDialog(Number(timerSettingsButton.dataset.id));
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
  const collapseButton = event.target.closest('button[data-action="collapse-one"]');
  if (collapseButton) {
    const id = Number(collapseButton.dataset.id);
    if (state.collapsedTaskIds.has(id)) {
      state.collapsedTaskIds.delete(id);
    } else {
      state.collapsedTaskIds.add(id);
    }
    renderTasks();
    return;
  }
  const button = event.target.closest('button[data-tree-select]');
  if (!button) {
    return;
  }
  if (state.groupSelectionMode) {
    const taskId = Number(button.dataset.treeSelect);
    const task = taskById(taskId);
    if (!task || !state.taskGroups.some((group) => String(task.parent_id) === group.id)) {
      return;
    }
    if (state.selectedTaskIds.has(taskId)) {
      state.selectedTaskIds.delete(taskId);
    } else {
      state.selectedTaskIds.add(taskId);
    }
    renderTasks();
    return;
  }
  const taskId = Number(button.dataset.treeSelect);
  if (state.running && taskId !== state.activeTaskId) {
    await showActionDialog({
      mode: 'notice',
      eyebrow: '当前事项已锁定',
      title: '番茄进行中，不能切换事项',
      message: `当前正在专注“${taskPath(state.activeTaskId)}”。`,
      detail: '完成或打断当前番茄后，才可以选择其他事项。',
      confirmLabel: '知道了',
    });
    return;
  }
  state.selectedRootId = taskId;
  renderTasks();
});
elements.rootList.addEventListener('dblclick', (event) => {
  if (event.target.closest('button:not(.root-select), input')) {
    return;
  }
  const item = event.target.closest('.tree-task[data-task-id]');
  if (!item) {
    return;
  }
  const id = Number(item.dataset.taskId);
  if ((childMap().get(id) || []).length === 0) {
    return;
  }
  event.preventDefault();
  if (state.collapsedTaskIds.has(id)) {
    state.collapsedTaskIds.delete(id);
  } else {
    state.collapsedTaskIds.add(id);
  }
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
  const item = event.target.closest('[data-task-id]');
  if (!item) {
    return;
  }
  showContextMenu(event, Number(item.dataset.taskId));
});
function clearTaskDragTargets() {
  elements.rootList.querySelectorAll('.drag-over, .drag-invalid').forEach((item) => {
    item.classList.remove('drag-over', 'drag-invalid');
  });
}

function taskDragDestination(event) {
  const taskItem = event.target.closest('.root-item[data-task-id]');
  if (taskItem) {
    return {
      element: taskItem,
      isTask: true,
      parentId: Number(taskItem.dataset.taskId),
      label: taskPath(Number(taskItem.dataset.taskId)),
    };
  }
  const group = event.target.closest('.task-group[data-group-id]');
  if (!group) {
    return null;
  }
  const groupId = Number(group.dataset.groupId);
  return {
    element: group,
    isTask: false,
    parentId: groupId,
    label: state.taskGroups.find((item) => Number(item.id) === groupId)?.name || '目标分组',
  };
}

function invalidTaskDropParent(parentId) {
  const children = childMap();
  return state.draggedTaskIds.some(
    (taskId) => taskId === parentId || descendantIds(taskId, children).includes(parentId),
  );
}

elements.rootList.addEventListener('dragstart', (event) => {
  const item = event.target.closest('.root-item[data-drag-task-id]');
  if (!item) {
    return;
  }
  const taskId = Number(item.dataset.dragTaskId);
  state.draggedTaskIds = state.selectedTaskIds.has(taskId) ? [...state.selectedTaskIds] : [taskId];
  item.classList.add('dragging');
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', state.draggedTaskIds.join(','));
});
elements.rootList.addEventListener('dragover', (event) => {
  const destination = taskDragDestination(event);
  if (!destination || state.draggedTaskIds.length === 0) {
    return;
  }
  event.preventDefault();
  const invalid = invalidTaskDropParent(destination.parentId);
  event.dataTransfer.dropEffect = invalid ? 'none' : 'move';
  clearTaskDragTargets();
  destination.element.classList.add(invalid ? 'drag-invalid' : 'drag-over');
});
elements.rootList.addEventListener('dragleave', (event) => {
  const destination = taskDragDestination(event);
  if (destination && !destination.element.contains(event.relatedTarget)) {
    destination.element.classList.remove('drag-over', 'drag-invalid');
  }
});
elements.rootList.addEventListener('drop', async (event) => {
  const destination = taskDragDestination(event);
  if (!destination || state.draggedTaskIds.length === 0) {
    return;
  }
  event.preventDefault();
  if (invalidTaskDropParent(destination.parentId)) {
    clearTaskDragTargets();
    await showActionDialog({
      mode: 'notice',
      eyebrow: '无法移动事项',
      title: '不能移动到自身的层级中',
      message: '目标位置是当前事项本身，或者位于它的子事项中。',
      detail: '请选择其它事项作为新的父事项，或者拖到大分组空白处成为一级事项。',
      confirmLabel: '知道了',
    });
    state.draggedTaskIds = [];
    return;
  }
  if (
    state.draggedTaskIds.every(
      (taskId) => Number(taskById(taskId)?.parent_id) === destination.parentId,
    )
  ) {
    state.draggedTaskIds = [];
    clearTaskDragTargets();
    return;
  }
  const conflictTitle = movingTaskTitleConflict(state.draggedTaskIds, destination.parentId);
  if (conflictTitle) {
    await showDuplicateNotice(
      `无法移动：“${destination.label}”下已经有名为“${conflictTitle}”的事项。`,
    );
    state.draggedTaskIds = [];
    clearTaskDragTargets();
    return;
  }
  await window.pomodoro.reparentTasks(state.draggedTaskIds, destination.parentId);
  if (destination.isTask) {
    state.collapsedTaskIds.delete(destination.parentId);
  }
  state.selectedTaskIds.clear();
  state.draggedTaskIds = [];
  await refresh();
});
elements.rootList.addEventListener('dragend', () => {
  state.draggedTaskIds = [];
  elements.rootList.querySelectorAll('.dragging, .drag-over, .drag-invalid').forEach((item) => {
    item.classList.remove('dragging', 'drag-over', 'drag-invalid');
  });
});
elements.contextMenu.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-context-action]');
  if (!button) {
    return;
  }
  const id = Number(elements.contextMenu.dataset.taskId);
  hideContextMenu();
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
  const deletionPath = taskPath(id);
  if (
    button.dataset.contextAction === 'delete' &&
    (await confirmDeletion(
      `删除“${deletionPath}”？`,
      `将删除事项“${deletionPath}”、它的所有子项以及相关专注记录。`,
    ))
  ) {
    await window.pomodoro.deleteTask(id);
    await refresh();
  }
});
elements.settingsTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateSettingsTab(tab.dataset.settingsTab));
  tab.addEventListener('keydown', (event) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % elements.settingsTabs.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + elements.settingsTabs.length) % elements.settingsTabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = elements.settingsTabs.length - 1;
    }
    if (nextIndex === null) {
      return;
    }
    event.preventDefault();
    activateSettingsTab(elements.settingsTabs[nextIndex].dataset.settingsTab, { focus: true });
  });
});
elements.zoomRange.addEventListener('input', async () => {
  const config = await window.pomodoro.setZoomFactor(Number(elements.zoomRange.value) / 100);
  showSettings(config);
});
elements.languageSelect.addEventListener('change', async () => {
  const config = await window.pomodoro.setLanguage(elements.languageSelect.value);
  state.language = config.language;
  window.i18n.setLocale(config.language);
  showSettings(config);
  renderDurationButtons();
  renderTasks();
  renderTimer();
  if (state.currentView === 'dashboard') {
    renderDashboard();
  }
});
elements.focusDurations.addEventListener('change', saveDurations);
elements.breakDurations.addEventListener('change', saveDurations);
elements.weekStartDay.addEventListener('change', async () => {
  showSettings(await window.pomodoro.setWeekStartDay(Number(elements.weekStartDay.value)));
});
elements.timerPopupTopmost.addEventListener('change', async () => {
  showSettings(await window.pomodoro.setTimerPopupAlwaysOnTop(elements.timerPopupTopmost.checked));
});
elements.natureSoundsEnabled.addEventListener('change', async () => {
  await saveNatureSoundSettings();
});
elements.natureSoundsMasterVolume.addEventListener('input', () => {
  state.natureSoundsMasterVolume = Number(elements.natureSoundsMasterVolume.value);
  elements.natureSoundsMasterVolumeValue.textContent = `${state.natureSoundsMasterVolume}%`;
  syncNatureSoundPlayerVolumes();
});
elements.natureSoundsMasterVolume.addEventListener('change', saveNatureSoundSettings);
elements.natureSoundItems.forEach((item) => {
  const toggle = item.querySelector('.nature-sound-toggle');
  const slider = item.querySelector('.nature-sound-volume');
  const output = item.querySelector('output');
  toggle.addEventListener('change', async () => {
    slider.disabled = !toggle.checked;
    if (toggle.checked) {
      slider.value = item.dataset.lastVolume || slider.value || '35';
    }
    state.natureSoundVolumes[item.dataset.natureSound] = toggle.checked ? Number(slider.value) : 0;
    if (state.running && state.timerMode === 'focus' && state.natureSoundsEnabled) {
      startNatureSounds();
    }
    await saveNatureSoundSettings();
  });
  slider.addEventListener('input', () => {
    item.dataset.lastVolume = slider.value;
    output.textContent = `${slider.value}%`;
    state.natureSoundVolumes[item.dataset.natureSound] = Number(slider.value);
    syncNatureSoundPlayerVolumes();
  });
  slider.addEventListener('change', saveNatureSoundSettings);
});
elements.chooseDatabasePath.addEventListener('click', async () => {
  showSettings(await window.pomodoro.chooseDatabasePath());
  await refresh();
});
elements.exportDatabase.addEventListener('click', async () => {
  if (state.running) {
    await showActionDialog({
      eyebrow: '计时正在进行',
      title: '暂时不能导出数据库',
      message: '请先完成或打断当前番茄钟，再导出数据库。',
      detail: '这样可以确保导出文件包含完整的专注记录。',
    });
    return;
  }
  try {
    const result = await window.pomodoro.exportDatabase();
    if (!result?.canceled) {
      await showActionDialog({
        eyebrow: '数据库已生成',
        title: '请选择保存或分享位置',
        message: result.fileName,
        detail: '该 SQLite 文件可在桌面端直接合并，也可以在另一台手机上导入。',
      });
    }
  } catch (error) {
    await showActionDialog({
      eyebrow: '导出失败',
      title: '没有生成数据库文件',
      message: error.message,
      detail: '请检查设备存储空间后重试。',
    });
  }
});
elements.importDatabase.addEventListener('click', async () => {
  if (state.running) {
    await showActionDialog({
      eyebrow: '计时正在进行',
      title: '暂时不能导入或合并数据库',
      message: '请先完成或打断当前番茄钟，再进行数据库同步。',
      detail: '导入期间事项和记录会发生变化。',
    });
    return;
  }
  try {
    const preview = await window.pomodoro.prepareDatabaseImport();
    if (preview) {
      renderDatabaseImportPreview(preview);
    }
  } catch (error) {
    await showActionDialog({
      eyebrow: '无法读取数据库',
      title: '请选择有效的番茄钟数据库',
      message: error.message,
      detail: '支持 .sqlite3、.sqlite 和 .db 文件。',
    });
  }
});
elements.databaseImportOverwrite.addEventListener('click', () => applyDatabaseImport('overwrite'));
elements.databaseImportKeepCurrent.addEventListener('click', () =>
  applyDatabaseImport('keep-current'),
);
elements.databaseImportKeepImported.addEventListener('click', () =>
  applyDatabaseImport('keep-imported'),
);
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
  state.language = config.language === 'zh-CN' ? 'zh-CN' : 'en-US';
  window.i18n.setLocale(state.language);
  elements.languageSelect.value = state.language;
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
  syncNatureSoundSettings(config);
  if (state.running && state.timerMode === 'focus' && state.natureSoundsEnabled) {
    startNatureSounds();
  } else {
    stopNatureSounds();
  }
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
window.addEventListener('focus', syncTimerClock);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    syncTimerClock();
  }
});
window.pomodoro.getSettings().then((config) => {
  state.language = config.language === 'zh-CN' ? 'zh-CN' : 'en-US';
  window.i18n.setLocale(state.language);
  elements.languageSelect.value = state.language;
  state.focusDurations = [...config.focusDurations];
  state.breakDurations = [...config.breakDurations];
  state.focusDuration = state.focusDurations.includes(25) ? 25 : state.focusDurations[0];
  state.breakDuration = state.breakDurations[0];
  syncNatureSoundSettings(config);
  renderDurationButtons();
  renderTasks();
});
refresh();
