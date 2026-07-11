const path = require('node:path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { AppDatabase } = require('./database');

let database;

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
  window.loadFile(path.join(__dirname, '../renderer/index.html'));
}

function registerHandlers() {
  ipcMain.handle('tasks:list', () => database.listTasks());
  ipcMain.handle('tasks:create', (_event, input) => database.createTask(input));
  ipcMain.handle('tasks:toggle', (_event, id) => database.toggleTask(id));
  ipcMain.handle('tasks:delete', (_event, id) => database.deleteTask(id));
  ipcMain.handle('sessions:record', (_event, input) => database.recordSession(input));
  ipcMain.handle('summary:get', () => database.getSummary());
}

app.whenReady().then(() => {
  database = new AppDatabase(path.join(app.getPath('userData'), 'pomodoro.sqlite3'));
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
