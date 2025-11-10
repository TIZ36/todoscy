const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld('xformat', {
  readClipboard: () => clipboard.readText(),
  writeClipboard: (text) => clipboard.writeText(text || ''),
  // Picker & history
  onHistoryData: (cb) => ipcRenderer.on('history-data', (_e, data) => cb(data)),
  pickerSelect: (text) => ipcRenderer.send('picker-select', text),
  pickerClose: () => ipcRenderer.send('picker-close'),
  pickerRefresh: () => ipcRenderer.send('picker-refresh'),
  getHistoryHotkey: () => ipcRenderer.invoke('get-history-hotkey'),
  setHistoryHotkey: (accel) => ipcRenderer.send('set-history-hotkey', accel),
  // Navigate to today
  onNavigateToToday: (cb) => ipcRenderer.on('navigate-to-today', () => cb()),
  // Open DevTools
  openDevTools: () => ipcRenderer.send('open-devtools'),
});


