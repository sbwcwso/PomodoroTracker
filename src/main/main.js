const fs = require('node:fs');
const path = require('node:path');
const { Buffer } = require('node:buffer');
const { spawn } = require('node:child_process');
const { clearTimeout, setTimeout } = require('node:timers');
const { pathToFileURL } = require('node:url');
const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  Notification,
  screen,
  shell,
} = require('electron');
const { AppDatabase } = require('./database');
const { ConfigStore } = require('./config-store');

// Timer completions happen without a fresh click. Linux Chromium builds can otherwise
// reject media playback after the window has remained in the background for a while.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let database;
let configStore;
let timerPopup;
let pendingDatabaseImportPath = '';
const DEFAULT_WINDOW_SIZE = Object.freeze({ width: 1940, height: 1189 });
const NATURE_SOUND_FILES = Object.freeze({
  'heavy-rain': 'heavy-rain.ogg',
  'forest-rain': 'forest-rain.ogg',
  stream: 'stream.ogg',
  thunderstorm: 'thunderstorm.ogg',
  wind: 'wind.ogg',
  fireplace: 'fireplace.ogg',
  'ocean-waves': 'ocean-waves.ogg',
  'forest-birds': 'forest-birds.ogg',
  'night-crickets': 'night-crickets.ogg',
  waterfall: 'waterfall.ogg',
});

function defaultDatabasePath() {
  return path.join(app.getPath('userData'), 'pomodoro.sqlite3');
}

function installerLanguage() {
  try {
    const value = fs
      .readFileSync(path.join(process.resourcesPath, 'installer-language.txt'), 'utf8')
      .trim();
    return value === 'zh-CN' ? 'zh-CN' : 'en-US';
  } catch {
    return 'en-US';
  }
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

function text(english, chinese) {
  return configStore?.getAll().language === 'zh-CN' ? chinese : english;
}

function broadcastSettings(config = publicConfig()) {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('settings:changed', config);
  });
  return config;
}

function openDatabase() {
  database = new AppDatabase(currentDatabasePath());
  database.migrateUiGroups(configStore.getAll());
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
  const config = configStore.getAll();
  const workArea = screen.getPrimaryDisplay().workAreaSize;
  const savedBounds = config.windowBounds;
  const width = Math.min(
    workArea.width,
    Math.max(880, savedBounds?.width || DEFAULT_WINDOW_SIZE.width),
  );
  const height = Math.min(
    workArea.height,
    Math.max(620, savedBounds?.height || DEFAULT_WINDOW_SIZE.height),
  );
  const window = new BrowserWindow({
    width,
    height,
    icon: path.join(__dirname, '../renderer/assets/app-icon.png'),
    minWidth: 880,
    minHeight: 620,
    backgroundColor: '#f5f1e8',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });
  if (config.windowMaximized) {
    window.maximize();
  }
  window.on('close', () => {
    configStore.setWindowState(window.getNormalBounds(), window.isMaximized());
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

function notifyTimerPopupVisibility(visible) {
  BrowserWindow.getAllWindows().forEach((window) => {
    if (window !== timerPopup) {
      window.webContents.send('timer-popup:visibility', visible);
    }
  });
}

function restoredTimerPopupPosition(width, height) {
  const savedPosition = configStore.getAll().timerPopupPosition;
  if (!savedPosition) {
    return {};
  }
  const { workArea } = screen.getDisplayNearestPoint(savedPosition);
  return {
    x: Math.min(Math.max(savedPosition.x, workArea.x), workArea.x + workArea.width - width),
    y: Math.min(Math.max(savedPosition.y, workArea.y), workArea.y + workArea.height - height),
  };
}

function showTimerPopup(timer) {
  if (timerPopup?.isDestroyed()) {
    timerPopup = null;
  }
  if (!timerPopup) {
    const width = 280;
    const height = 156;
    timerPopup = new BrowserWindow({
      width,
      height,
      ...restoredTimerPopupPosition(width, height),
      frame: false,
      transparent: true,
      hasShadow: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      alwaysOnTop: configStore.getAll().timerPopupAlwaysOnTop,
      skipTaskbar: true,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false,
      },
    });
    const popup = timerPopup;
    keepTimerPopupOnTop();
    timerPopup.removeMenu();
    popup.on('close', () => {
      const [x, y] = popup.getPosition();
      configStore.setTimerPopupPosition({ x, y });
    });
    popup.on('closed', () => {
      if (timerPopup === popup) {
        timerPopup = null;
      }
      notifyTimerPopupVisibility(false);
    });
    notifyTimerPopupVisibility(true);
    timerPopup.loadFile(path.join(__dirname, '../renderer/timer-popup.html')).then(() => {
      keepTimerPopupOnTop();
      timerPopup?.webContents.send('timer-popup:update', timer);
    });
    return true;
  }
  timerPopup.show();
  keepTimerPopupOnTop();
  timerPopup.webContents.send('timer-popup:update', timer);
  return true;
}

function resizeTimerPopup(requestedWidth) {
  if (!timerPopup || timerPopup.isDestroyed()) {
    return false;
  }
  const currentBounds = timerPopup.getBounds();
  const { workArea } = screen.getDisplayMatching(currentBounds);
  const width = Math.min(
    Math.max(280, Math.round(Number(requestedWidth) || 280)),
    Math.min(620, workArea.width),
  );
  const x = Math.min(Math.max(currentBounds.x, workArea.x), workArea.x + workArea.width - width);
  timerPopup.setBounds({ x, y: currentBounds.y, width, height: currentBounds.height }, true);
  return true;
}

function nativeWindowHandle(window) {
  const handle = window.getNativeWindowHandle();
  if (handle.length >= 8) {
    return handle.readBigUInt64LE(0).toString();
  }
  return handle.readUInt32LE(0).toString();
}

function switchToWindowsWindow(window) {
  return new Promise((resolve) => {
    const handle = nativeWindowHandle(window);
    const script = `
$nativeMethods = Add-Type -MemberDefinition @'
[DllImport("user32.dll")]
public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);
'@ -Name NativeWindowActivation -Namespace PomodoroTracker -PassThru
$nativeMethods::SwitchToThisWindow([IntPtr]([Int64]${handle}), $true)
`;
    const encodedScript = Buffer.from(script, 'utf16le').toString('base64');
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-EncodedCommand', encodedScript],
      { stdio: 'ignore', windowsHide: true },
    );
    let completed = false;
    const finish = (activated) => {
      if (completed) {
        return;
      }
      completed = true;
      clearTimeout(timeout);
      resolve(activated);
    };
    const timeout = setTimeout(() => {
      child.kill();
      finish(false);
    }, 3000);
    timeout.unref();
    child.once('error', () => finish(false));
    child.once('exit', (code) => finish(code === 0));
  });
}

async function showMainWindow() {
  const mainWindow = BrowserWindow.getAllWindows().find((window) => window !== timerPopup);
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  if (process.platform === 'win32') {
    const activated = await switchToWindowsWindow(mainWindow);
    if (!activated && !mainWindow.isDestroyed()) {
      mainWindow.focus();
    }
  } else {
    mainWindow.focus();
  }
  return true;
}

function registerHandlers() {
  ipcMain.handle('tasks:list', () => database.listTasks());
  ipcMain.handle('tasks:create', (_event, input) => database.createTask(input));
  ipcMain.handle('tasks:rename', (_event, id, title) => database.renameTask(id, title));
  ipcMain.handle('tasks:move', (_event, id, direction) => database.moveTask(id, direction));
  ipcMain.handle('tasks:setDefaultGroup', (_event, id) => database.setDefaultGroup(id));
  ipcMain.handle('tasks:setGroupCollapsed', (_event, id, collapsed) =>
    database.setGroupCollapsed(id, collapsed),
  );
  ipcMain.handle('tasks:moveToGroup', (_event, taskIds, groupId) =>
    database.moveTasks(taskIds, groupId),
  );
  ipcMain.handle('tasks:reparent', (_event, taskIds, parentId) =>
    database.reparentTasks(taskIds, parentId),
  );
  ipcMain.handle('tasks:toggle', (_event, id) => database.toggleTask(id));
  ipcMain.handle('tasks:delete', (_event, id) => database.deleteTask(id));
  ipcMain.handle('tasks:setTimerSettings', (_event, id, input) =>
    database.setTaskTimerSettings(id, input),
  );
  ipcMain.handle('sessions:record', (_event, input) => database.recordSession(input));
  ipcMain.handle('sessions:updateNote', (_event, sessionId, note) =>
    database.updateSessionNote(sessionId, note),
  );
  ipcMain.handle('sessions:listForTask', (_event, taskId) => database.listTaskSessions(taskId));
  ipcMain.handle('sessions:searchNotes', (_event, input) => database.searchSessionNotes(input));
  ipcMain.handle('summary:get', () => database.getSummary());
  ipcMain.handle('dashboard:get', (_event, input = {}) =>
    database.getDashboardData({
      ...input,
      weekStartDay: configStore.getAll().weekStartDay,
    }),
  );
  ipcMain.handle('settings:get', () => publicConfig());
  ipcMain.handle('settings:setLanguage', (_event, value) =>
    broadcastSettings(configStore.setLanguage(value)),
  );
  ipcMain.handle('nature-sounds:load', (_event, id) => {
    const filename = NATURE_SOUND_FILES[String(id)];
    if (!filename) {
      throw new Error(text('Unknown nature sound', '未知的自然声'));
    }
    return fs.promises.readFile(
      path.join(__dirname, '..', 'renderer', 'assets', 'sounds', 'nature', filename),
    );
  });
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
  ipcMain.handle('settings:setNatureSounds', (_event, value) => {
    configStore.setNatureSounds(value);
    const config = publicConfig();
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('settings:changed', config);
    });
    return config;
  });
  ipcMain.handle('settings:setWeekStartDay', (_event, value) => {
    const config = configStore.setWeekStartDay(value);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('settings:changed', config);
    });
    return config;
  });
  ipcMain.handle('settings:setTaskGrouping', (_event, value) => configStore.setTaskGrouping(value));
  ipcMain.handle('settings:chooseDatabasePath', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(window, {
      title: text('Select an existing database', '选择已有数据库文件'),
      defaultPath: currentDatabasePath(),
      filters: [
        {
          name: text('SQLite database', 'SQLite 数据库'),
          extensions: ['sqlite3', 'sqlite', 'db'],
        },
      ],
      buttonLabel: text('Use this database', '使用此数据库'),
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0]) {
      return publicConfig();
    }
    return switchDatabase(result.filePaths[0]);
  });
  ipcMain.handle('database:prepareImport', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(window, {
      title: text('Merge another Pomodoro database', '合并另一份番茄钟数据库'),
      defaultPath: path.dirname(currentDatabasePath()),
      filters: [
        {
          name: text('SQLite database', 'SQLite 数据库'),
          extensions: ['sqlite3', 'sqlite', 'db'],
        },
      ],
      buttonLabel: text('Review merge', '检查合并内容'),
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths[0]) {
      return null;
    }
    const sourcePath = path.resolve(result.filePaths[0]);
    if (sourcePath === path.resolve(currentDatabasePath())) {
      throw new Error(
        text('Choose a different database to merge.', '请选择另一份数据库进行合并。'),
      );
    }
    const preview = database.previewMerge(sourcePath);
    pendingDatabaseImportPath = sourcePath;
    return { ...preview, fileName: path.basename(sourcePath), canOverwrite: false };
  });
  ipcMain.handle('database:applyImport', (_event, mode) => {
    if (!pendingDatabaseImportPath) {
      throw new Error(text('No database is waiting to be merged.', '当前没有等待合并的数据库。'));
    }
    const conflictPolicy = mode === 'keep-imported' ? 'keep-imported' : 'keep-current';
    const summary = database.mergeFromFile(pendingDatabaseImportPath, conflictPolicy);
    pendingDatabaseImportPath = '';
    return summary;
  });
  ipcMain.handle('settings:chooseSoundPath', async (event, kind) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(window, {
      title:
        kind === 'breakEnd'
          ? text('Select break completion sound', '选择休息结束提示音')
          : text('Select focus completion sound', '选择专注结束提示音'),
      filters: [
        {
          name: text('Audio files', '音频文件'),
          extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'],
        },
      ],
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
  ipcMain.handle('timer-popup:resize', (_event, width) => resizeTimerPopup(width));
  ipcMain.handle('window:showMain', () => showMainWindow());
  ipcMain.handle('window:openExternal', (_event, value) => {
    try {
      const url = new globalThis.URL(String(value || ''));
      if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
        return false;
      }
      shell.openExternal(url.href);
      return true;
    } catch {
      return false;
    }
  });
  ipcMain.handle('timer-popup:update', (_event, timer) => {
    timerPopup?.webContents.send('timer-popup:update', timer);
  });
  ipcMain.handle('timer-popup:hide', () => {
    timerPopup?.close();
    timerPopup = null;
    notifyTimerPopupVisibility(false);
    return false;
  });
  ipcMain.handle('timer:notifyCompletion', (event, payload = {}) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (Notification.isSupported()) {
      new Notification({
        title: String(payload.title || text('Timer finished', '计时结束')),
        body: String(payload.body || ''),
        icon: path.join(__dirname, '../renderer/assets/app-icon.png'),
        silent: true,
      }).show();
    }
    window?.flashFrame(true);
    if (payload.timer) {
      showTimerPopup(payload.timer);
    }
    return true;
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
  const configPath = path.join(app.getPath('userData'), 'config.json');
  const firstLaunch = !fs.existsSync(configPath);
  configStore = new ConfigStore(configPath);
  if (firstLaunch) {
    configStore.setLanguage(installerLanguage());
  }
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
