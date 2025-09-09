const { contextBridge, ipcRenderer, clipboard } = require('electron');
const JSON5 = require('json5');

function safeFormat(input, space = 2) {
  try {
    const data = typeof input === 'string' ? JSON5.parse(input) : input;
    return JSON.stringify(data, null, space);
  } catch (err) {
    return `/* JSON Parse Error: ${err.message} */\n${String(input)}`;
  }
}

contextBridge.exposeInMainWorld('xformat', {
  format: (input, space = 2) => safeFormat(input, space),
  minify: (input) => {
    try {
      const data = typeof input === 'string' ? JSON5.parse(input) : input;
      return JSON.stringify(data);
    } catch (err) {
      return `/* JSON Parse Error: ${err.message} */`;
    }
  },
  readClipboard: () => clipboard.readText(),
  writeClipboard: (text) => clipboard.writeText(text || ''),
  onFormatClipboard: (cb) => ipcRenderer.on('format-clipboard', cb),
  base64Encode: (input) => {
    try {
      const text = typeof input === 'string' ? input : JSON.stringify(input);
      return Buffer.from(text, 'utf8').toString('base64');
    } catch (err) {
      return `/* Base64 Encode Error: ${err.message} */`;
    }
  },
  base64Decode: (input) => {
    try {
      const text = typeof input === 'string' ? input : String(input);
      return Buffer.from(text, 'base64').toString('utf8');
    } catch (err) {
      return `/* Base64 Decode Error: ${err.message} */`;
    }
  }
  ,
  // Picker & history
  onHistoryData: (cb) => ipcRenderer.on('history-data', (_e, data) => cb(data)),
  pickerSelect: (text) => ipcRenderer.send('picker-select', text),
  pickerClose: () => ipcRenderer.send('picker-close'),
  pickerRefresh: () => ipcRenderer.send('picker-refresh'),
  getHistoryHotkey: () => ipcRenderer.invoke('get-history-hotkey'),
  setHistoryHotkey: (accel) => ipcRenderer.send('set-history-hotkey', accel),
  
});


