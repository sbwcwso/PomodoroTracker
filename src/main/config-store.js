const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_CONFIG = Object.freeze({
  language: 'zh-CN',
  zoomFactor: 1,
  focusDurations: [15, 25, 45],
  breakDurations: [5, 10],
  timerPopupAlwaysOnTop: true,
  databasePath: '',
  focusEndSoundPath: '',
  breakEndSoundPath: '',
});

function normalizeDurations(value, fallback) {
  const durations = (Array.isArray(value) ? value : String(value || '').split(','))
    .map((item) => Number.parseInt(item, 10))
    .filter(
      (item, index, list) => Number.isInteger(item) && item > 0 && list.indexOf(item) === index,
    )
    .slice(0, 6);
  return durations.length > 0 ? durations : [...fallback];
}

class ConfigStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.config = this.load();
  }

  load() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
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

  save() {
    fs.writeFileSync(this.filePath, `${JSON.stringify(this.config, null, 2)}\n`, 'utf8');
  }
}

module.exports = { ConfigStore, DEFAULT_CONFIG };
