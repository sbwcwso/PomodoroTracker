const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_TASK_GROUP = Object.freeze({ id: 'default', name: '默认分组', collapsed: false });
const NATURE_SOUND_IDS = Object.freeze([
  'heavy-rain',
  'forest-rain',
  'stream',
  'thunderstorm',
  'wind',
  'fireplace',
]);
const DEFAULT_NATURE_SOUND_VOLUMES = Object.freeze({
  'heavy-rain': 45,
  'forest-rain': 0,
  stream: 0,
  thunderstorm: 0,
  wind: 0,
  fireplace: 0,
});

const DEFAULT_CONFIG = Object.freeze({
  language: 'zh-CN',
  zoomFactor: 1,
  focusDurations: [25],
  breakDurations: [5],
  timerPopupAlwaysOnTop: true,
  databasePath: '',
  focusEndSoundPath: '',
  breakEndSoundPath: '',
  natureSoundsEnabled: false,
  natureSoundsMasterVolume: 35,
  natureSoundVolumes: DEFAULT_NATURE_SOUND_VOLUMES,
  windowBounds: null,
  windowMaximized: false,
  timerPopupPosition: null,
  weekStartDay: 1,
  taskGroups: [DEFAULT_TASK_GROUP],
  defaultTaskGroupId: 'default',
  taskGroupAssignments: {},
});

function normalizeTaskGrouping(groups, assignments, defaultGroupId = 'default') {
  const sourceGroups = Array.isArray(groups) ? groups : [];
  const normalizedGroups = [];
  const seen = new Set();
  sourceGroups.forEach((group) => {
    const id = String(group?.id || '').trim();
    const name = String(group?.name || '').trim();
    if (!id || !name || seen.has(id)) {
      return;
    }
    seen.add(id);
    normalizedGroups.push({ id, name: name.slice(0, 40), collapsed: group.collapsed === true });
  });
  if (normalizedGroups.length === 0) {
    normalizedGroups.push({ ...DEFAULT_TASK_GROUP });
    seen.add(DEFAULT_TASK_GROUP.id);
  }
  const normalizedDefaultGroupId = seen.has(String(defaultGroupId))
    ? String(defaultGroupId)
    : normalizedGroups[0].id;
  const normalizedAssignments = {};
  if (assignments && typeof assignments === 'object' && !Array.isArray(assignments)) {
    Object.entries(assignments).forEach(([taskId, groupId]) => {
      if (/^\d+$/.test(taskId) && seen.has(String(groupId))) {
        normalizedAssignments[taskId] = String(groupId);
      }
    });
  }
  return {
    groups: normalizedGroups,
    defaultGroupId: normalizedDefaultGroupId,
    assignments: normalizedAssignments,
  };
}

function normalizeWindowBounds(value) {
  if (!value || !Number.isFinite(value.width) || !Number.isFinite(value.height)) {
    return null;
  }
  return {
    width: Math.round(value.width),
    height: Math.round(value.height),
  };
}

function normalizeWindowPosition(value) {
  if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y)) {
    return null;
  }
  return { x: Math.round(value.x), y: Math.round(value.y) };
}

function normalizeDurations(value, fallback) {
  const durations = (Array.isArray(value) ? value : String(value || '').split(','))
    .map((item) => Number.parseInt(item, 10))
    .filter(
      (item, index, list) => Number.isInteger(item) && item > 0 && list.indexOf(item) === index,
    )
    .slice(0, 6);
  return durations.length > 0 ? durations : [...fallback];
}

function normalizeVolume(value, fallback = 0) {
  const volume = Number(value);
  return Number.isFinite(volume) ? Math.min(100, Math.max(0, Math.round(volume))) : fallback;
}

function normalizeNatureSoundVolumes(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return Object.fromEntries(
    NATURE_SOUND_IDS.map((id) => [
      id,
      normalizeVolume(source[id], DEFAULT_NATURE_SOUND_VOLUMES[id]),
    ]),
  );
}

class ConfigStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.config = this.load();
  }

  load() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      const taskGrouping = normalizeTaskGrouping(
        parsed.taskGroups,
        parsed.taskGroupAssignments,
        parsed.defaultTaskGroupId,
      );
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        language: 'zh-CN',
        focusDurations: normalizeDurations(parsed.focusDurations, DEFAULT_CONFIG.focusDurations),
        breakDurations: normalizeDurations(parsed.breakDurations, DEFAULT_CONFIG.breakDurations),
        timerPopupAlwaysOnTop: parsed.timerPopupAlwaysOnTop !== false,
        databasePath: typeof parsed.databasePath === 'string' ? parsed.databasePath : '',
        focusEndSoundPath:
          typeof parsed.focusEndSoundPath === 'string' ? parsed.focusEndSoundPath : '',
        breakEndSoundPath:
          typeof parsed.breakEndSoundPath === 'string' ? parsed.breakEndSoundPath : '',
        natureSoundsEnabled: parsed.natureSoundsEnabled === true,
        natureSoundsMasterVolume: normalizeVolume(parsed.natureSoundsMasterVolume, 35),
        natureSoundVolumes: normalizeNatureSoundVolumes(parsed.natureSoundVolumes),
        windowBounds: normalizeWindowBounds(parsed.windowBounds),
        windowMaximized: parsed.windowMaximized === true,
        timerPopupPosition: normalizeWindowPosition(parsed.timerPopupPosition),
        weekStartDay:
          Number.isInteger(parsed.weekStartDay) &&
          parsed.weekStartDay >= 0 &&
          parsed.weekStartDay <= 6
            ? parsed.weekStartDay
            : 1,
        taskGroups: taskGrouping.groups,
        defaultTaskGroupId: taskGrouping.defaultGroupId,
        taskGroupAssignments: taskGrouping.assignments,
      };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  getAll() {
    return { ...this.config };
  }

  setZoomFactor(value) {
    this.config.zoomFactor = Math.min(2, Math.max(0.5, Math.round(Number(value) * 10) / 10));
    this.save();
    return this.getAll();
  }

  setDurations({ focusDurations, breakDurations }) {
    this.config.focusDurations = normalizeDurations(focusDurations, DEFAULT_CONFIG.focusDurations);
    this.config.breakDurations = normalizeDurations(breakDurations, DEFAULT_CONFIG.breakDurations);
    this.save();
    return this.getAll();
  }

  setTimerPopupAlwaysOnTop(value) {
    this.config.timerPopupAlwaysOnTop = value !== false;
    this.save();
    return this.getAll();
  }

  setDatabasePath(value) {
    this.config.databasePath = path.resolve(String(value || '').trim());
    this.save();
    return this.getAll();
  }

  setSoundPath(kind, value) {
    const key = kind === 'breakEnd' ? 'breakEndSoundPath' : 'focusEndSoundPath';
    this.config[key] = value ? path.resolve(String(value)) : '';
    this.save();
    return this.getAll();
  }

  setNatureSounds({ enabled, masterVolume, volumes }) {
    this.config.natureSoundsEnabled = enabled === true;
    this.config.natureSoundsMasterVolume = normalizeVolume(masterVolume, 35);
    this.config.natureSoundVolumes = normalizeNatureSoundVolumes(volumes);
    this.save();
    return this.getAll();
  }

  setWindowState(bounds, maximized) {
    this.config.windowBounds = normalizeWindowBounds(bounds);
    this.config.windowMaximized = maximized === true;
    this.save();
    return this.getAll();
  }

  setTimerPopupPosition(position) {
    this.config.timerPopupPosition = normalizeWindowPosition(position);
    this.save();
    return this.getAll();
  }

  setWeekStartDay(value) {
    const day = Number(value);
    this.config.weekStartDay = Number.isInteger(day) && day >= 0 && day <= 6 ? day : 1;
    this.save();
    return this.getAll();
  }

  setTaskGrouping({ groups, defaultGroupId, assignments }) {
    const normalized = normalizeTaskGrouping(groups, assignments, defaultGroupId);
    this.config.taskGroups = normalized.groups;
    this.config.defaultTaskGroupId = normalized.defaultGroupId;
    this.config.taskGroupAssignments = normalized.assignments;
    this.save();
    return this.getAll();
  }

  save() {
    fs.writeFileSync(this.filePath, `${JSON.stringify(this.config, null, 2)}\n`, 'utf8');
  }
}

module.exports = { ConfigStore, DEFAULT_CONFIG };
