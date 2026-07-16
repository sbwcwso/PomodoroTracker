const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pomodoro', {
  listTasks: () => ipcRenderer.invoke('tasks:list'),
  createTask: (input) => ipcRenderer.invoke('tasks:create', input),
  renameTask: (id, title) => ipcRenderer.invoke('tasks:rename', id, title),
  moveTask: (id, direction) => ipcRenderer.invoke('tasks:move', id, direction),
  setDefaultGroup: (id) => ipcRenderer.invoke('tasks:setDefaultGroup', id),
  setGroupCollapsed: (id, collapsed) =>
    ipcRenderer.invoke('tasks:setGroupCollapsed', id, collapsed),
  moveTasksToGroup: (taskIds, groupId) => ipcRenderer.invoke('tasks:moveToGroup', taskIds, groupId),
  reparentTasks: (taskIds, parentId) => ipcRenderer.invoke('tasks:reparent', taskIds, parentId),
  toggleTask: (id) => ipcRenderer.invoke('tasks:toggle', id),
  deleteTask: (id) => ipcRenderer.invoke('tasks:delete', id),
  setTaskTimerSettings: (id, input) => ipcRenderer.invoke('tasks:setTimerSettings', id, input),
  recordSession: (input) => ipcRenderer.invoke('sessions:record', input),
  updateSessionNote: (sessionId, note) =>
    ipcRenderer.invoke('sessions:updateNote', sessionId, note),
  listTaskSessions: (taskId) => ipcRenderer.invoke('sessions:listForTask', taskId),
  searchSessionNotes: (input) => ipcRenderer.invoke('sessions:searchNotes', input),
  getSummary: () => ipcRenderer.invoke('summary:get'),
  getDashboard: (input) => ipcRenderer.invoke('dashboard:get', input),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setLanguage: (value) => ipcRenderer.invoke('settings:setLanguage', value),
  loadNatureSound: (id) => ipcRenderer.invoke('nature-sounds:load', id),
  setZoomFactor: (value) => ipcRenderer.invoke('settings:setZoom', value),
  setDurations: (value) => ipcRenderer.invoke('settings:setDurations', value),
  setTimerPopupAlwaysOnTop: (value) =>
    ipcRenderer.invoke('settings:setTimerPopupAlwaysOnTop', value),
  setNatureSounds: (value) => ipcRenderer.invoke('settings:setNatureSounds', value),
  setWeekStartDay: (value) => ipcRenderer.invoke('settings:setWeekStartDay', value),
  setTaskGrouping: (value) => ipcRenderer.invoke('settings:setTaskGrouping', value),
  chooseDatabasePath: () => ipcRenderer.invoke('settings:chooseDatabasePath'),
  chooseSoundPath: (kind) => ipcRenderer.invoke('settings:chooseSoundPath', kind),
  clearSoundPath: (kind) => ipcRenderer.invoke('settings:clearSoundPath', kind),
  showTimerPopup: (timer) => ipcRenderer.invoke('timer-popup:show', timer),
  updateTimerPopup: (timer) => ipcRenderer.invoke('timer-popup:update', timer),
  hideTimerPopup: () => ipcRenderer.invoke('timer-popup:hide'),
  resizeTimerPopup: (width) => ipcRenderer.invoke('timer-popup:resize', width),
  showMainWindow: () => ipcRenderer.invoke('window:showMain'),
  openExternalLink: (url) => ipcRenderer.invoke('window:openExternal', url),
  notifyTimerCompletion: (payload) => ipcRenderer.invoke('timer:notifyCompletion', payload),
  onTimerPopupUpdate: (callback) =>
    ipcRenderer.on('timer-popup:update', (_event, value) => callback(value)),
  onTimerPopupVisibility: (callback) =>
    ipcRenderer.on('timer-popup:visibility', (_event, visible) => callback(visible)),
  onSettingsChanged: (callback) =>
    ipcRenderer.on('settings:changed', (_event, value) => callback(value)),
  onOpenSettings: (callback) => ipcRenderer.on('settings:open', callback),
  onOpenAbout: (callback) => ipcRenderer.on('about:open', callback),
  performAppAction: (action) => ipcRenderer.invoke('app:action', action),
});
