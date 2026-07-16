const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { ConfigStore } = require('../src/main/config-store');

test('persists zoom and defaults to English', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-config-'));
  const filePath = path.join(directory, 'config.json');
  const store = new ConfigStore(filePath);
  assert.equal(store.getAll().language, 'en-US');
  assert.equal(store.getAll().timerPopupAlwaysOnTop, true);
  assert.equal(store.getAll().weekStartDay, 1);
  assert.deepEqual(store.getAll().focusDurations, [25]);
  assert.deepEqual(store.getAll().breakDurations, [5]);
  store.setZoomFactor(1.3);
  assert.equal(new ConfigStore(filePath).getAll().zoomFactor, 1.3);
  fs.rmSync(directory, { recursive: true });
});

test('persists a supported interface language and rejects unknown locales', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-config-'));
  const filePath = path.join(directory, 'config.json');
  const store = new ConfigStore(filePath);
  store.setLanguage('zh-CN');
  assert.equal(new ConfigStore(filePath).getAll().language, 'zh-CN');
  store.setLanguage('fr-FR');
  assert.equal(new ConfigStore(filePath).getAll().language, 'en-US');
  fs.rmSync(directory, { recursive: true });
});

test('persists timer popup topmost setting', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-config-'));
  const filePath = path.join(directory, 'config.json');
  const store = new ConfigStore(filePath);
  store.setTimerPopupAlwaysOnTop(false);
  assert.equal(new ConfigStore(filePath).getAll().timerPopupAlwaysOnTop, false);
  fs.rmSync(directory, { recursive: true });
});

test('persists database path', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-config-'));
  const filePath = path.join(directory, 'config.json');
  const databasePath = path.join(directory, 'sync', 'pomodoro.sqlite3');
  const store = new ConfigStore(filePath);
  store.setDatabasePath(databasePath);
  assert.equal(new ConfigStore(filePath).getAll().databasePath, databasePath);
  fs.rmSync(directory, { recursive: true });
});

test('persists custom sound paths', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-config-'));
  const filePath = path.join(directory, 'config.json');
  const focusSound = path.join(directory, 'focus.mp3');
  const breakSound = path.join(directory, 'break.mp3');
  const store = new ConfigStore(filePath);
  store.setSoundPath('focusEnd', focusSound);
  store.setSoundPath('breakEnd', breakSound);
  const config = new ConfigStore(filePath).getAll();
  assert.equal(config.focusEndSoundPath, focusSound);
  assert.equal(config.breakEndSoundPath, breakSound);
  fs.rmSync(directory, { recursive: true });
});

test('persists and normalizes nature sound settings', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-config-'));
  const filePath = path.join(directory, 'config.json');
  const store = new ConfigStore(filePath);
  store.setNatureSounds({
    enabled: true,
    masterVolume: 140,
    volumes: { 'heavy-rain': 62, stream: -5, wind: 24 },
  });
  const config = new ConfigStore(filePath).getAll();
  assert.equal(config.natureSoundsEnabled, true);
  assert.equal(config.natureSoundsMasterVolume, 100);
  assert.deepEqual(config.natureSoundVolumes, {
    'heavy-rain': 62,
    'forest-rain': 0,
    stream: 0,
    thunderstorm: 0,
    wind: 24,
    fireplace: 0,
  });
  fs.rmSync(directory, { recursive: true });
});

test('limits zoom to supported range', () => {
  const filePath = path.join(os.tmpdir(), `pomodoro-${Date.now()}.json`);
  const store = new ConfigStore(filePath);
  assert.equal(store.setZoomFactor(10).zoomFactor, 2);
  assert.equal(store.setZoomFactor(0).zoomFactor, 0.5);
  fs.rmSync(filePath, { force: true });
});

test('persists configurable timer durations', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-config-'));
  const filePath = path.join(directory, 'config.json');
  const store = new ConfigStore(filePath);
  store.setDurations({ focusDurations: '20, 30, 40', breakDurations: '5, 10, bad' });
  const config = new ConfigStore(filePath).getAll();
  assert.deepEqual(config.focusDurations, [20, 30, 40]);
  assert.deepEqual(config.breakDurations, [5, 10]);
  fs.rmSync(directory, { recursive: true });
});

test('persists main window size and maximized state', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-config-'));
  const filePath = path.join(directory, 'config.json');
  const store = new ConfigStore(filePath);
  store.setWindowState({ width: 1360, height: 900 }, true);
  const config = new ConfigStore(filePath).getAll();
  assert.deepEqual(config.windowBounds, { width: 1360, height: 900 });
  assert.equal(config.windowMaximized, true);
  fs.rmSync(directory, { recursive: true });
});

test('persists timer popup position', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-config-'));
  const filePath = path.join(directory, 'config.json');
  const store = new ConfigStore(filePath);
  store.setTimerPopupPosition({ x: 320, y: 180 });
  assert.deepEqual(new ConfigStore(filePath).getAll().timerPopupPosition, { x: 320, y: 180 });
  fs.rmSync(directory, { recursive: true });
});

test('persists the first day of the week', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-config-'));
  const filePath = path.join(directory, 'config.json');
  const store = new ConfigStore(filePath);
  store.setWeekStartDay(0);
  assert.equal(new ConfigStore(filePath).getAll().weekStartDay, 0);
  fs.rmSync(directory, { recursive: true });
});

test('persists view-only task groups and keeps the default group', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-config-'));
  const filePath = path.join(directory, 'config.json');
  const store = new ConfigStore(filePath);
  store.setTaskGrouping({
    groups: [
      { id: 'default', name: '可被忽略的名称', collapsed: true },
      { id: 'study', name: '学习', collapsed: true },
    ],
    defaultGroupId: 'study',
    assignments: { 12: 'study', 13: 'missing' },
  });
  const config = new ConfigStore(filePath).getAll();
  assert.deepEqual(config.taskGroups, [
    { id: 'default', name: '可被忽略的名称', collapsed: true },
    { id: 'study', name: '学习', collapsed: true },
  ]);
  assert.equal(config.defaultTaskGroupId, 'study');
  assert.deepEqual(config.taskGroupAssignments, { 12: 'study' });
  fs.rmSync(directory, { recursive: true });
});
