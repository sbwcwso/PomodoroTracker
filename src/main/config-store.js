const fs = require('node:fs');

const DEFAULT_CONFIG = Object.freeze({ language: 'zh-CN', zoomFactor: 1 });

class ConfigStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.config = this.load();
  }

  load() {
    try {
      return {
        ...DEFAULT_CONFIG,
        ...JSON.parse(fs.readFileSync(this.filePath, 'utf8')),
        language: 'zh-CN',
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
    fs.writeFileSync(this.filePath, `${JSON.stringify(this.config, null, 2)}\n`, 'utf8');
    return this.getAll();
  }
}

module.exports = { ConfigStore, DEFAULT_CONFIG };
