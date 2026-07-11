const path = require('node:path');
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { AppDatabase } = require('./database');
const { ConfigStore } = require('./config-store');

let database;
let configStore;

function applyZoom(window, zoomFactor) {
  window.webContents.setZoomFactor(zoomFactor);
  window.webContents.send('settings:changed', configStore.getAll());
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

function registerHandlers() {
  ipcMain.handle('tasks:list', () => database.listTasks());
  ipcMain.handle('tasks:create', (_event, input) => database.createTask(input));
  ipcMain.handle('tasks:toggle', (_event, id) => database.toggleTask(id));
  ipcMain.handle('tasks:delete', (_event, id) => database.deleteTask(id));
  ipcMain.handle('sessions:record', (_event, input) => database.recordSession(input));
  ipcMain.handle('summary:get', () => database.getSummary());
  ipcMain.handle('settings:get', () => configStore.getAll());
  ipcMain.handle('settings:setZoom', (_event, value) => {
    const config = configStore.setZoomFactor(value);
    BrowserWindow.getAllWindows().forEach((window) => applyZoom(window, config.zoomFactor));
    return config;
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
  database = new AppDatabase(path.join(app.getPath('userData'), 'pomodoro.sqlite3'));
  configStore = new ConfigStore(path.join(app.getPath('userData'), 'config.json'));
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
