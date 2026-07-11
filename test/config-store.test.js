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
  store.setZoomFactor(1.3);
  assert.equal(new ConfigStore(filePath).getAll().zoomFactor, 1.3);
  fs.rmSync(directory, { recursive: true });
});

test('limits zoom to supported range', () => {
  const filePath = path.join(os.tmpdir(), `pomodoro-${Date.now()}.json`);
  const store = new ConfigStore(filePath);
  assert.equal(store.setZoomFactor(10).zoomFactor, 2);
  assert.equal(store.setZoomFactor(0).zoomFactor, 0.5);
  fs.rmSync(filePath, { force: true });
});
