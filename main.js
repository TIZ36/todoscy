const { app, BrowserWindow, Tray, Menu, nativeImage, clipboard, globalShortcut, ipcMain, systemPreferences, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let tray = null;
let mainWindow = null;
let pickerWindow = null;

let clipboardHistory = [];
let lastClipboardText = '';
let historyHotkey = 'CmdOrCtrl+Shift+H';

function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function loadConfig() {
  try {
    const p = getConfigPath();
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      const cfg = JSON.parse(raw);
      if (typeof cfg.historyHotkey === 'string' && cfg.historyHotkey.length > 0) {
        historyHotkey = cfg.historyHotkey;
      }
    }
  } catch {}
}

function saveConfig() {
  try {
    const p = getConfigPath();
    const cfg = { historyHotkey };
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf8');
  } catch {}
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 720,
    height: 600,
    show: false,
    frame: false,
    resizable: true,
    transparent: true,
    vibrancy: 'sidebar',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  
  // Center window on the primary display
  mainWindow.once('ready-to-show', () => {
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const { x, y } = primaryDisplay.workArea;
    
    const windowBounds = mainWindow.getBounds();
    const centerX = x + (width - windowBounds.width) / 2;
    const centerY = y + (height - windowBounds.height) / 2;
    
    mainWindow.setPosition(Math.round(centerX), Math.round(centerY));
    mainWindow.show();
  });

  mainWindow.on('blur', () => {
    // If picker is visible, don't hide the main window
    if (pickerWindow && pickerWindow.isVisible()) {
      return;
    }
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    positionWindowUnderTray();
    mainWindow.show();
    mainWindow.focus();
  }
}

function positionWindowUnderTray() {
  const windowBounds = mainWindow.getBounds();
  const trayBounds = tray.getBounds();
  const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);
  const y = Math.round(trayBounds.y + trayBounds.height);
  mainWindow.setPosition(x, y, false);
}

function createTray() {
  const iconPath = path.join(__dirname, 'renderer/assets/trayTemplate.png');
  const nimg = nativeImage.createFromPath(iconPath);
  const icon = nimg.isEmpty() ? undefined : nimg;
  tray = new Tray(icon || nativeImage.createEmpty());
  if (!icon) {
    tray.setTitle('{}');
  }
  tray.setToolTip('XForm - JSON Formatter');
  tray.on('click', toggleWindow);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open', click: toggleWindow },
    { type: 'separator' },
    { label: 'Request Permissions…', click: () => ensurePermissionsFlow(true) },
    { type: 'separator' },
    { label: 'Clipboard History', click: () => openPicker() },
    { type: 'separator' },
    { label: 'Format Clipboard JSON', click: () => mainWindow.webContents.send('format-clipboard') },
    { label: 'Quit', role: 'quit' }
  ]);
  tray.setContextMenu(contextMenu);
}

function createPickerWindow() {
  if (pickerWindow) return;
  console.log('Creating picker window...');
  pickerWindow = new BrowserWindow({
    width: 320,
    height: 400,
    show: false,
    frame: false,
    resizable: false,
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    closable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Ensure Node.js modules can be required in preload
      webSecurity: false // For debugging
    }
  });
  
  const pickerPath = path.join(__dirname, 'renderer/picker.html');
  console.log('Loading picker from:', pickerPath);
  pickerWindow.loadFile(pickerPath);
  
  pickerWindow.webContents.on('did-finish-load', () => {
    console.log('Picker window loaded successfully');
  });
  
  pickerWindow.webContents.on('console-message', (event, level, message) => {
    console.log('Picker console:', message);
  });
  
  pickerWindow.on('blur', () => {
    // Add a small delay to prevent immediate hiding when clicking on picker
    setTimeout(() => {
      if (pickerWindow && !pickerWindow.isFocused()) {
        pickerWindow.hide();
      }
    }, 100);
  });
}

function openPicker() {
  if (!pickerWindow) createPickerWindow();
  // Ensure we include the latest clipboard content once
  updateHistoryFromClipboard();
  console.log('Opening picker with history:', clipboardHistory.length, 'items');
  console.log('History contents:', clipboardHistory.map(s => s.slice(0, 20)));
  
  // Get cursor position and find the correct display
  const { x, y } = screen.getCursorScreenPoint();
  const displays = screen.getAllDisplays();
  
  console.log('Cursor position:', { x, y });
  console.log('Available displays:', displays.map(d => ({
    id: d.id,
    bounds: d.bounds,
    workArea: d.workArea,
    isPrimary: d.primary
  })));
  
  // Find the display that contains the cursor
  let targetDisplay = displays[0]; // fallback to primary display
  for (const display of displays) {
    const { x: displayX, y: displayY, width: displayWidth, height: displayHeight } = display.bounds;
    if (x >= displayX && x < displayX + displayWidth && 
        y >= displayY && y < displayY + displayHeight) {
      targetDisplay = display;
      console.log('Target display found:', { id: display.id, bounds: display.bounds, isPrimary: display.primary });
      break;
    }
  }
  
  // Use work area size for better positioning (excludes dock, menu bar, etc.)
  const { width: screenWidth, height: screenHeight } = targetDisplay.workAreaSize;
  const { x: displayX, y: displayY } = targetDisplay.workArea;
  
  // Calculate position relative to the target display
  const relativeX = x - displayX;
  const relativeY = y - displayY;
  
  let pickerX = x + 20;
  let pickerY = y;
  
  // Adjust if picker would go off screen
  if (pickerX + 320 > displayX + screenWidth) {
    pickerX = x - 340; // Show to the left of cursor
  }
  if (pickerY + 400 > displayY + screenHeight) {
    pickerY = displayY + screenHeight - 420; // Show above bottom edge
  }
  if (pickerX < displayX) pickerX = displayX + 20; // Ensure not off left edge
  if (pickerY < displayY) pickerY = displayY + 20; // Ensure not off top edge
  
  // Ensure picker is on the correct display
  pickerWindow.setPosition(pickerX, pickerY, false);
  
  // Ensure picker is always on top and visible
  pickerWindow.setAlwaysOnTop(true, 'screen-saver');
  pickerWindow.show();
  pickerWindow.focus();
  pickerWindow.moveTop();
  
  // Wait for the window to be ready before sending data
  const sendData = () => {
    console.log('Sending history data:', clipboardHistory);
    try {
      if (pickerWindow && !pickerWindow.isDestroyed()) {
        pickerWindow.webContents.send('history-data', clipboardHistory);
        console.log('Data sent successfully');
      }
    } catch (err) {
      console.log('Send error:', err.message);
    }
  };
  
  // Send immediately if ready, otherwise wait
  if (pickerWindow.webContents.isLoading()) {
    console.log('Window is loading, waiting...');
    pickerWindow.webContents.once('did-finish-load', () => {
      console.log('Window loaded, sending data...');
      setTimeout(sendData, 100);
    });
  } else {
    console.log('Window ready, sending data immediately...');
    sendData();
    // Also send with delay as backup
    setTimeout(sendData, 200);
  }
}

function registerHistoryHotkey(accelerator) {
  try { globalShortcut.unregister(historyHotkey); } catch {}
  historyHotkey = accelerator || historyHotkey;
  const ok = globalShortcut.register(historyHotkey, () => {
    // Gate by permissions
    if (!hasAccessibility()) {
      ensurePermissionsFlow(false);
      return;
    }
    openPicker();
  });
  if (!ok) {
    // fallback
    historyHotkey = 'CmdOrCtrl+Shift+H';
    globalShortcut.register(historyHotkey, () => {
      if (!hasAccessibility()) {
        ensurePermissionsFlow(false);
        return;
      }
      openPicker();
    });
  }
  saveConfig();
}

function startClipboardWatcher() {
  setInterval(() => {
    try { updateHistoryFromClipboard(); } catch {}
  }, 700);
}

function updateHistoryFromClipboard() {
  let txt;
  try {
    txt = clipboard.readText();
    console.log('Clipboard read:', txt ? `"${txt.slice(0, 50)}..."` : 'empty');
  } catch (err) {
    console.log('Clipboard read error:', err.message);
    return;
  }
  if (!txt || !txt.trim()) return; // Filter out empty strings
  if (txt === lastClipboardText) return;
  lastClipboardText = txt;
  console.log('Adding to history:', txt.slice(0, 30));
  const existingIndex = clipboardHistory.findIndex((t) => t === txt);
  if (existingIndex !== -1) {
    clipboardHistory.splice(existingIndex, 1);
  }
  clipboardHistory.unshift(txt);
  if (clipboardHistory.length > 10) clipboardHistory.length = 10;
  console.log('History length:', clipboardHistory.length);
}

function performPaste(text, isInternalPaste = false) {
  try {
    clipboard.writeText(text || '');

    if (!isInternalPaste) {
      // Hide our app to let keystroke go to previous app
      app.hide();
    }

    // A delay is needed for app.hide() or window.focus() to take effect
    setTimeout(() => {
      const script = 'osascript -e "tell application \\"System Events\\" to keystroke \\"v\\" using command down"';
      exec(script, (error, stdout, stderr) => {
        if (error) {
          console.error(`Paste script exec error: ${error}`);
          dialog.showMessageBox({
            type: 'error',
            message: '自动粘贴失败',
            detail: `无法执行粘贴操作，请检查系统权限。\n\n错误: ${error.message}`,
            buttons: ['好的']
          });
          return;
        }
        if (stderr) {
          // AppleScript errors often go to stderr
          console.error(`Paste script stderr: ${stderr}`);
          dialog.showMessageBox({
            type: 'warning',
            message: '粘贴时发生未知错误',
            detail: `请检查“系统设置 > 隐私与安全 > 自动化”，确保 XForm 可以控制“系统事件(System Events)”。\n\n信息: ${stderr}`,
            buttons: ['好的']
          });
        }
        console.log('Paste script executed successfully.');
      });
    }, 100);

  } catch (err) {
    console.error('Error in performPaste:', err);
  }
}

function openPrivacyPane(pane) {
  const map = {
    accessibility: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
    automation: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Automation'
  };
  const url = map[pane] || map.accessibility;
  exec(`open "${url}"`);
}

function requestAccessibility() {
  try {
    // Ask macOS to show the Accessibility prompt (opens System Settings on newer versions)
    if (process.platform === 'darwin') {
      try { systemPreferences.isTrustedAccessibilityClient(true); } catch {}
    }
    // Trigger Accessibility/Automation prompt by attempting a keystroke via System Events
    exec('osascript -e "tell application \"System Events\" to key down command" -e "key up command"');
  } catch {}
  // Open the relevant System Settings pane
  openPrivacyPane('accessibility');
}

function hasAccessibility() {
  try {
    if (process.platform !== 'darwin') return true;
    return systemPreferences.isTrustedAccessibilityClient(false);
  } catch {
    return false;
  }
}

function ensurePermissionsFlow(fromMenu) {
  if (hasAccessibility()) {
    if (fromMenu) {
      dialog.showMessageBox({
        type: 'info',
        message: '权限正常',
        detail: '已拥有辅助功能权限和自动化控制。',
        buttons: ['好的']
      });
    }
    return;
  }
  dialog.showMessageBox({
    type: 'warning',
    message: '需要启用辅助功能权限',
    detail: '为实现全局快捷键呼出选择器并自动粘贴，需要在"系统设置 > 隐私与安全 > 辅助功能"中勾选 XForm。同时在"自动化"中允许控制"系统事件"。',
    buttons: ['前往设置', '取消']
  }).then((res) => {
    if (res.response === 0) {
      requestAccessibility();
    }
  });
}

app.setName('XForm');
app.dock && app.dock.hide();

app.whenReady().then(() => {
  loadConfig();
  createWindow();
  createTray();
  createPickerWindow();

  globalShortcut.register('CommandOrControl+Shift+J', () => {
    toggleWindow();
  });

  registerHistoryHotkey(historyHotkey);
  startClipboardWatcher();
  // Seed with current clipboard content if any
  try { updateHistoryFromClipboard(); } catch {}
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
  }
});

// IPC for picker select and config
ipcMain.on('picker-select', (event, text) => {
  if (pickerWindow) pickerWindow.hide();
  
  const wantsInternalPaste = mainWindow && mainWindow.isVisible();
  
  if (wantsInternalPaste) {
    mainWindow.focus();
  }

  performPaste(text, wantsInternalPaste);
});

ipcMain.on('picker-close', () => {
  if (pickerWindow) pickerWindow.hide();
});

ipcMain.on('picker-refresh', (event) => {
  console.log('Picker requesting refresh, current history length:', clipboardHistory.length);
  updateHistoryFromClipboard();
  console.log('After update, history length:', clipboardHistory.length);
  console.log('Sending history data:', clipboardHistory.map(s => s.slice(0, 30)));
  event.reply('history-data', clipboardHistory);
});

ipcMain.handle('get-history-hotkey', () => historyHotkey);

ipcMain.on('set-history-hotkey', (event, accel) => {
  if (typeof accel === 'string' && accel.length > 0) {
    registerHistoryHotkey(accel);
  }
});




