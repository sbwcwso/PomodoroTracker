const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pomodoro', {
  listTasks: () => ipcRenderer.invoke('tasks:list'),
  createTask: (input) => ipcRenderer.invoke('tasks:create', input),
  toggleTask: (id) => ipcRenderer.invoke('tasks:toggle', id),
  deleteTask: (id) => ipcRenderer.invoke('tasks:delete', id),
  recordSession: (input) => ipcRenderer.invoke('sessions:record', input),
  getSummary: () => ipcRenderer.invoke('summary:get'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setZoomFactor: (value) => ipcRenderer.invoke('settings:setZoom', value),
  setDurations: (value) => ipcRenderer.invoke('settings:setDurations', value),
  setTimerPopupAlwaysOnTop: (value) =>
    ipcRenderer.invoke('settings:setTimerPopupAlwaysOnTop', value),
  chooseDatabasePath: () => ipcRenderer.invoke('settings:chooseDatabasePath'),
  chooseSoundPath: (kind) => ipcRenderer.invoke('settings:chooseSoundPath', kind),
  clearSoundPath: (kind) => ipcRenderer.invoke('settings:clearSoundPath', kind),
  showTimerPopup: (timer) => ipcRenderer.invoke('timer-popup:show', timer),
  updateTimerPopup: (timer) => ipcRenderer.invoke('timer-popup:update', timer),
  hideTimerPopup: () => ipcRenderer.invoke('timer-popup:hide'),
  onTimerPopupUpdate: (callback) =>
    ipcRenderer.on('timer-popup:update', (_event, value) => callback(value)),
  onSettingsChanged: (callback) =>
    ipcRenderer.on('settings:changed', (_event, value) => callback(value)),
  onOpenSettings: (callback) => ipcRenderer.on('settings:open', callback),
  onOpenAbout: (callback) => ipcRenderer.on('about:open', callback),
  performAppAction: (action) => ipcRenderer.invoke('app:action', action),
});
