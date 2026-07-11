const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { ConfigStore } = require('../src/main/config-store');

test('persists zoom and defaults to Chinese', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pomodoro-config-'));
  const filePath = path.join(directory, 'config.json');
  const store = new ConfigStore(filePath);
  assert.equal(store.getAll().language, 'zh-CN');
  assert.equal(store.getAll().timerPopupAlwaysOnTop, true);
  store.setZoomFactor(1.3);
  assert.equal(new ConfigStore(filePath).getAll().zoomFactor, 1.3);
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
