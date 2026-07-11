const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const { AppDatabase } = require('./database');
const { ConfigStore } = require('./config-store');

let database;
let configStore;
let timerPopup;

function defaultDatabasePath() {
  return path.join(app.getPath('userData'), 'pomodoro.sqlite3');
}

function currentDatabasePath() {
  return configStore.getAll().databasePath || defaultDatabasePath();
}

function publicConfig() {
  const config = configStore.getAll();
  return {
    ...config,
    databasePath: currentDatabasePath(),
    focusEndSoundUrl: config.focusEndSoundPath ? pathToFileURL(config.focusEndSoundPath).href : '',
    breakEndSoundUrl: config.breakEndSoundPath ? pathToFileURL(config.breakEndSoundPath).href : '',
  };
}

function openDatabase() {
  database = new AppDatabase(currentDatabasePath());
}

function switchDatabase(nextPath) {
  const targetPath = path.resolve(nextPath);
  const previousPath = currentDatabasePath();
  if (targetPath === previousPath) {
    return publicConfig();
  }
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  database?.close();
  database = null;
  if (!fs.existsSync(targetPath) && fs.existsSync(previousPath)) {
    fs.copyFileSync(previousPath, targetPath);
  }
  configStore.setDatabasePath(targetPath);
  openDatabase();
  const config = publicConfig();
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('settings:changed', config);
  });
  return config;
}

function applyZoom(window, zoomFactor) {
  window.webContents.setZoomFactor(zoomFactor);
  window.webContents.send('settings:changed', publicConfig());
}

function changeZoom(window, delta) {
  const config = configStore.setZoomFactor(configStore.getAll().zoomFactor + delta);
  applyZoom(window, config.zoomFactor);
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 880,
    minHeight: 620,
    backgroundColor: '#f5f1e8',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  window.webContents.setZoomFactor(configStore.getAll().zoomFactor);
  window.webContents.on('before-input-event', (event, input) => {
    if (!input.control || input.type !== 'keyDown') {
      return;
    }
    if (input.key === '+' || input.key === '=') {
      event.preventDefault();
      changeZoom(window, 0.1);
    }
    if (input.key === '-') {
      event.preventDefault();
      changeZoom(window, -0.1);
    }
    if (input.key === '0') {
      event.preventDefault();
      applyZoom(window, configStore.setZoomFactor(1).zoomFactor);
    }
  });
  Menu.setApplicationMenu(null);
  window.loadFile(path.join(__dirname, '../renderer/index.html'));
}

function keepTimerPopupOnTop() {
  if (!timerPopup || timerPopup.isDestroyed()) {
    return;
  }
  const topmost = configStore.getAll().timerPopupAlwaysOnTop;
  timerPopup.setAlwaysOnTop(topmost);
  if (topmost) {
    timerPopup.moveTop();
  }
}

function showTimerPopup(timer) {
  if (timerPopup?.isDestroyed()) {
    timerPopup = null;
  }
  if (!timerPopup) {
    timerPopup = new BrowserWindow({
      width: 260,
      height: 132,
      resizable: false,
      minimizable: false,
      maximizable: false,
      alwaysOnTop: configStore.getAll().timerPopupAlwaysOnTop,
      skipTaskbar: true,
      backgroundColor: '#fffdf8',
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });
    keepTimerPopupOnTop();
    timerPopup.removeMenu();
    timerPopup.on('closed', () => {
      timerPopup = null;
    });
    timerPopup.loadFile(path.join(__dirname, '../renderer/timer-popup.html')).then(() => {
      keepTimerPopupOnTop();
      timerPopup?.webContents.send('timer-popup:update', timer);
    });
    return;
  }
  timerPopup.show();
  keepTimerPopupOnTop();
  timerPopup.webContents.send('timer-popup:update', timer);
}

function registerHandlers() {
  ipcMain.handle('tasks:list', () => database.listTasks());
  ipcMain.handle('tasks:create', (_event, input) => database.createTask(input));
  ipcMain.handle('tasks:toggle', (_event, id) => database.toggleTask(id));
  ipcMain.handle('tasks:delete', (_event, id) => database.deleteTask(id));
  ipcMain.handle('sessions:record', (_event, input) => database.recordSession(input));
  ipcMain.handle('summary:get', () => database.getSummary());
  ipcMain.handle('settings:get', () => publicConfig());
  ipcMain.handle('settings:setZoom', (_event, value) => {
    configStore.setZoomFactor(value);
    const config = publicConfig();
    BrowserWindow.getAllWindows().forEach((window) => applyZoom(window, config.zoomFactor));
    return config;
  });
  ipcMain.handle('settings:setDurations', (_event, value) => {
    configStore.setDurations(value);
    const config = publicConfig();
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('settings:changed', config);
    });
    return config;
  });
  ipcMain.handle('settings:setTimerPopupAlwaysOnTop', (_event, value) => {
    configStore.setTimerPopupAlwaysOnTop(value);
    const config = publicConfig();
    keepTimerPopupOnTop();
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('settings:changed', config);
    });
    return config;
  });
  ipcMain.handle('settings:chooseDatabasePath', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(window, {
      title: '选择数据库文件位置',
      defaultPath: currentDatabasePath(),
      filters: [{ name: 'SQLite 数据库', extensions: ['sqlite3', 'sqlite', 'db'] }],
      buttonLabel: '使用此位置',
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });
    if (result.canceled || !result.filePath) {
      return publicConfig();
    }
    return switchDatabase(result.filePath);
  });
  ipcMain.handle('settings:chooseSoundPath', async (event, kind) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(window, {
      title: kind === 'breakEnd' ? '选择休息结束提示音' : '选择专注结束提示音',
      filters: [{ name: '音频文件', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'] }],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0]) {
      return publicConfig();
    }
    configStore.setSoundPath(kind, result.filePaths[0]);
    const config = publicConfig();
    BrowserWindow.getAllWindows().forEach((browserWindow) => {
      browserWindow.webContents.send('settings:changed', config);
    });
    return config;
  });
  ipcMain.handle('settings:clearSoundPath', (_event, kind) => {
    configStore.setSoundPath(kind, '');
    const config = publicConfig();
    BrowserWindow.getAllWindows().forEach((browserWindow) => {
      browserWindow.webContents.send('settings:changed', config);
    });
    return config;
  });
  ipcMain.handle('timer-popup:show', (_event, timer) => showTimerPopup(timer));
  ipcMain.handle('timer-popup:update', (_event, timer) => {
    timerPopup?.webContents.send('timer-popup:update', timer);
  });
  ipcMain.handle('timer-popup:hide', () => {
    timerPopup?.close();
    timerPopup = null;
  });
  ipcMain.handle('app:action', (event, action) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (action === 'quit') {
      app.quit();
    }
    if (action === 'reload') {
      window.reload();
    }
    if (action === 'fullscreen') {
      window.setFullScreen(!window.isFullScreen());
    }
  });
}

app.whenReady().then(() => {
  configStore = new ConfigStore(path.join(app.getPath('userData'), 'config.json'));
  openDatabase();
  registerHandlers();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('before-quit', () => database?.close());
