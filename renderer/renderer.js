const $ = (s) => document.querySelector(s);
const statusEl = $('#status');
const recordHotkeyBtn = $('#recordHotkey');

// Views
const mainEl = $('#main');
const headerActions = $('#headerActions');
const viewTodos = $('#view-todos');
const viewCalendar = $('#view-calendar');

// Calendar DOM
const calTitleEl = $('#calTitle');
const calGridEl = $('#calGrid');
const calPrevBtn = $('#calPrev');
const calNextBtn = $('#calNext');

// Todos DOM
const todoInputEl = $('#todoInput');
const todoListEl = $('#todoList');
const todoTodayListEl = $('#todoTodayList');
const todoPlannedListEl = $('#todoPlannedList');
const todoProcessingListEl = $('#todoProcessingList');
const todoTasksCountEl = $('#todoTasksCount');
const todayTasksCountEl = $('#todayTasksCount');
const plannedTasksCountEl = $('#plannedTasksCount');
const calTodayBtn = $('#calToday');
const toggleCalViewBtn = $('#toggleCalView');
const calViewIcon = $('#calViewIcon');
const calViewText = $('#calViewText');
const debugLogOverlay = $('#debugLogOverlay');
const debugLogContentEl = $('#debugLogContent');
const debugLogCopyBtn = $('#debugLogCopy');
const debugLogClearBtn = $('#debugLogClear');
const debugLogCloseBtn = $('#debugLogClose');
const debugLogBackdropEl = debugLogOverlay ? debugLogOverlay.querySelector('.debug-log-backdrop') : null;

// Calendar view mode: 'bars' or 'counts'
// 将在初始化时从 localStorage 加载
let calendarViewMode = 'bars';

// 模拟日期（用于测试）
let mockDate = null; // null 表示使用真实日期，否则使用模拟日期

// 获取当前日期（如果设置了模拟日期则返回模拟日期，否则返回真实日期）
function getToday() {
  if (mockDate) {
    return new Date(mockDate);
  }
  return new Date();
}

// 设置模拟日期
function setMockDate(dateStr) {
  if (dateStr) {
    mockDate = dateStr;
    localStorage.setItem('mockDate', dateStr);
    // 刷新所有显示
    renderTodos();
    renderTodayTasks();
    renderPlannedTasks();
    renderCalendar();
    updateTodayTasksCount();
    updateMockDateDisplay();
  } else {
    clearMockDate();
  }
}

// 清除模拟日期
function clearMockDate() {
  mockDate = null;
  localStorage.removeItem('mockDate');
  // 刷新所有显示
  renderTodos();
  renderTodayTasks();
  renderPlannedTasks();
  renderCalendar();
  updateTodayTasksCount();
  updateMockDateDisplay();
}

// 更新模拟日期显示
function updateMockDateDisplay() {
  const mockDateDisplayEl = $('#mockDateDisplay');
  const mockDateInputEl = $('#mockDateInput');
  const clearMockDateBtn = $('#clearMockDate');
  
  if (mockDate) {
    const date = new Date(mockDate);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (mockDateDisplayEl) {
      mockDateDisplayEl.textContent = `模拟日期: ${dateStr}`;
      mockDateDisplayEl.style.display = 'block';
    }
    if (mockDateInputEl) {
      mockDateInputEl.value = dateStr;
    }
    if (clearMockDateBtn) {
      clearMockDateBtn.style.display = 'inline-block';
    }
  } else {
    if (mockDateDisplayEl) {
      mockDateDisplayEl.style.display = 'none';
    }
    if (mockDateInputEl) {
      mockDateInputEl.value = '';
    }
    if (clearMockDateBtn) {
      clearMockDateBtn.style.display = 'none';
    }
  }
}

const DEBUG_LOG_LIMIT = 200;
const debugLogs = [];

function safeClone(value) {
  if (value === undefined || value === null) return value;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return value;
  }
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function addDebugLog(message, data) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    message: String(message || ''),
    data: data !== undefined ? safeClone(data) : undefined
  };
  debugLogs.push(entry);
  if (debugLogs.length > DEBUG_LOG_LIMIT) {
    debugLogs.shift();
  }
  if (debugLogOverlay && !debugLogOverlay.classList.contains('hidden')) {
    renderDebugLogContent();
  }
  try {
    if (entry.data !== undefined) {
      console.log(`[DEBUG] ${entry.message}`, entry.data);
    } else {
      console.log(`[DEBUG] ${entry.message}`);
    }
  } catch (error) {
    console.warn('Failed to print debug log:', error);
  }
}

function renderDebugLogContent() {
  if (!debugLogContentEl) return;
  if (!debugLogs.length) {
    debugLogContentEl.innerHTML = '<div class="debug-log-empty">暂无日志</div>';
    return;
  }
  const logsHtml = debugLogs
    .slice()
    .reverse()
    .map(entry => {
      const dataHtml = entry.data !== undefined
        ? `<pre class="debug-log-data">${escapeHtml(typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data, null, 2))}</pre>`
        : '';
      return `
        <div class="debug-log-entry">
          <div class="debug-log-meta">${escapeHtml(entry.timestamp)}</div>
          <div class="debug-log-message">${escapeHtml(entry.message)}</div>
          ${dataHtml}
        </div>
      `;
    })
    .join('');
  debugLogContentEl.innerHTML = logsHtml;
}

function openDebugLogOverlay() {
  if (!debugLogOverlay) return;
  renderDebugLogContent();
  debugLogOverlay.classList.remove('hidden');
}

function closeDebugLogOverlay() {
  if (!debugLogOverlay) return;
  debugLogOverlay.classList.add('hidden');
}

function showStatusMessage(text, duration = 2000) {
  if (!statusEl) return;
  statusEl.textContent = text;
  if (duration > 0) {
    setTimeout(() => {
      if (statusEl && statusEl.textContent === text) {
        statusEl.textContent = '';
      }
    }, duration);
  }
}


const openDevToolsBtn = $('#openDevTools');
if (openDevToolsBtn) {
  openDevToolsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('开发者工具按钮被点击');
    if (window.xformat && typeof window.xformat.openDevTools === 'function') {
      window.xformat.openDevTools();
    } else {
      console.error('openDevTools API not available', window.xformat);
    }
  });
} else {
  console.warn('开发者工具按钮未找到');
}

if (debugLogCloseBtn) {
  debugLogCloseBtn.addEventListener('click', () => {
    closeDebugLogOverlay();
  });
}

if (debugLogBackdropEl) {
  debugLogBackdropEl.addEventListener('click', () => {
    closeDebugLogOverlay();
  });
}

if (debugLogClearBtn) {
  debugLogClearBtn.addEventListener('click', () => {
    debugLogs.length = 0;
    renderDebugLogContent();
    showStatusMessage('🧹 调试日志已清空');
  });
}

if (debugLogCopyBtn) {
  debugLogCopyBtn.addEventListener('click', async () => {
    if (!debugLogs.length) {
      showStatusMessage('⚠️ 暂无调试日志可复制');
      return;
    }
    const text = debugLogs
      .map(entry => {
        const dataText = entry.data !== undefined
          ? `\n${typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data, null, 2)}`
          : '';
        return `[${entry.timestamp}] ${entry.message}${dataText}`;
      })
      .join('\n\n');
    try {
      if (window.xformat && typeof window.xformat.writeClipboard === 'function') {
        window.xformat.writeClipboard(text);
      } else if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('No clipboard API available');
      }
      showStatusMessage('✅ 调试日志已复制');
    } catch (error) {
      console.error('Failed to copy debug logs:', error);
      showStatusMessage('⚠️ 调试日志复制失败');
    }
  });
}


// Hotkey recording
let isRecordingHotkey = false;

function isModifierKey(key) {
  return key === 'Meta' || key === 'Control' || key === 'Alt' || key === 'Shift';
}

function normalizeKeyName(key) {
  if (!key) return '';
  if (key === ' ') return 'Space';
  const specialMap = {
    Enter: 'Enter',
    Escape: 'Esc',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Tab: 'Tab',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right'
  };
  if (specialMap[key]) return specialMap[key];
  if (key.length === 1) return key.toUpperCase();
  return key;
}

function startHotkeyRecording() {
  if (isRecordingHotkey) return;

  isRecordingHotkey = true;
  recordHotkeyBtn.textContent = '按下组合键...';
  recordHotkeyBtn.style.backgroundColor = '#ff6b6b';

  let captured = false;

  const handleKeyDown = (e) => {
    if (captured) return;
    e.preventDefault();
    e.stopPropagation();

    const modifiers = [];
    if (e.metaKey) modifiers.push('Cmd');
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');

    const keyRaw = e.key;
    // 忽略只有修饰键的按下，等待实际键位
    if (isModifierKey(keyRaw)) {
      recordHotkeyBtn.textContent = `按下组合键... (${modifiers.join('+')})`;
      return;
    }

    const key = normalizeKeyName(keyRaw);
    if (!key) return;

    const accelerator = [...modifiers, key].join('+');

    // Stop listening immediately to avoid duplicate capture
    captured = true;
    isRecordingHotkey = false;
    document.removeEventListener('keydown', handleKeyDown);

    // Send to main process
    window.xformat.setHistoryHotkey(accelerator);

    // Update UI
    recordHotkeyBtn.textContent = `Hotkey: ${accelerator}`;
    recordHotkeyBtn.style.backgroundColor = '#51cf66';
  };

  document.addEventListener('keydown', handleKeyDown);

  // Cancel after 10 seconds
  setTimeout(() => {
    if (isRecordingHotkey) {
      isRecordingHotkey = false;
      recordHotkeyBtn.textContent = 'Set History Hotkey';
      recordHotkeyBtn.style.backgroundColor = '';
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, 10000);
}

if (recordHotkeyBtn) {
  recordHotkeyBtn.addEventListener('click', startHotkeyRecording);
}

// Load saved hotkey on startup
window.xformat.getHistoryHotkey().then(hotkey => {
  if (hotkey && recordHotkeyBtn) {
    recordHotkeyBtn.textContent = `Hotkey: ${hotkey}`;
    recordHotkeyBtn.style.backgroundColor = '#51cf66';
  }
});

// Todos functionality
let todos = [];           // 待办任务（未分配的任务，默认类型）
let planTodos = [];       // 普通计划任务（有日期范围且 plan_type 为 'normal'）
let habitTodos = [];      // 打卡任务（plan_type 为 'checkin'）
let processingTodos = []; // 保留用于兼容（进行中的任务）
let completedTodos = [];  // 已完成的任务（保留数据但不显示）
let showProcessing = false;
let currentEditingTodoIndex = -1;
let currentEditingState = 'pending';

// Task categories functionality
const DEFAULT_CATEGORIES = ['工作', '娱乐'];
let taskCategories = [];

// 为归类分配颜色的函数
function getCategoryColor(category) {
  if (!category) {
    console.log('getCategoryColor: category为空');
    return null;
  }
  
  // 为每个归类分配一个颜色（基于归类名称的哈希）
  const colors = [
    '#4E85CE', // 蓝色
    '#98B957', // 绿色
    '#F9AB00', // 橙色
    '#E85D75', // 粉红色
    '#9B59B6', // 紫色
    '#1ABC9C', // 青色
    '#E67E22', // 深橙色
    '#3498DB', // 亮蓝色
    '#E74C3C', // 红色
    '#F39C12', // 金色
    '#16A085', // 深青色
    '#27AE60', // 深绿色
  ];
  
  // 使用改进的哈希算法，结合字符位置权重，确保更好的颜色分布
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    const char = category.charCodeAt(i);
    // 使用字符码、位置和质数相乘，增加随机性
    hash = ((hash << 5) - hash) + char + (i * 31);
    hash = hash & hash; // 转换为32位整数
  }
  
  // 确保哈希值为正数并取模
  const colorIndex = Math.abs(hash) % colors.length;
  const selectedColor = colors[colorIndex];
  
  console.log('getCategoryColor:', {
    category: category,
    hash: hash,
    hashAbs: Math.abs(hash),
    hashMod: Math.abs(hash) % colors.length,
    colorIndex: colorIndex,
    selectedColor: selectedColor,
    allColors: colors,
    colorsLength: colors.length
  });
  
  return selectedColor;
}

// 将十六进制颜色转换为rgba格式
function hexToRgba(hex, alpha) {
  console.log('hexToRgba 被调用:', { hex: hex, alpha: alpha });
  
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    console.error('hexToRgba: 无效的hex颜色值', hex);
    return `rgba(78, 133, 206, ${alpha})`; // 返回默认蓝色
  }
  
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const result = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  console.log('hexToRgba 结果:', { hex, r, g, b, alpha, result });
  
  return result;
}

// Load task categories
function loadTaskCategories() {
  try {
    const saved = localStorage.getItem('xform-task-categories');
    if (saved) {
      taskCategories = JSON.parse(saved);
    } else {
      // Initialize with default categories
      taskCategories = [...DEFAULT_CATEGORIES];
      saveTaskCategories();
    }
  } catch (error) {
    console.error('Error loading task categories:', error);
    taskCategories = [...DEFAULT_CATEGORIES];
  }
}

// Save task categories
function saveTaskCategories() {
  try {
    localStorage.setItem('xform-task-categories', JSON.stringify(taskCategories));
  } catch (error) {
    console.error('Error saving task categories:', error);
  }
}

// Add a new category
function addTaskCategory(categoryName) {
  const trimmed = categoryName.trim();
  if (trimmed && !taskCategories.includes(trimmed)) {
    taskCategories.push(trimmed);
    saveTaskCategories();
    return true;
  }
  return false;
}

// Remove a category (only if not default)
function removeTaskCategory(categoryName) {
  if (DEFAULT_CATEGORIES.includes(categoryName)) {
    return false; // Cannot remove default categories
  }
  const index = taskCategories.indexOf(categoryName);
  if (index > -1) {
    taskCategories.splice(index, 1);
    saveTaskCategories();
    return true;
  }
  return false;
}

function loadTodos() {
  try {
    // 尝试从旧格式迁移数据（如果存在且新格式不存在）
    const currentData = localStorage.getItem('xform-todos');
    const oldListKey = 'xform.todos.list';
    const oldListData = localStorage.getItem(oldListKey);
    
    // 如果新格式不存在，尝试从旧格式迁移
    if (!currentData && oldListData) {
      try {
        const oldTodos = JSON.parse(oldListData);
        if (Array.isArray(oldTodos) && oldTodos.length > 0) {
          console.log('发现旧格式数据，准备迁移...');
          // 将旧数据转换为新格式
          const migratedData = {
            todos: oldTodos.filter(t => !t.completed && !t.processing),
            processing: oldTodos.filter(t => !t.completed && t.processing),
            completed: oldTodos.filter(t => t.completed)
          };
          // 保存为新格式
          localStorage.setItem('xform-todos', JSON.stringify(migratedData));
          // 删除旧数据
          localStorage.removeItem(oldListKey);
          console.log('数据迁移完成');
        }
      } catch (e) {
        console.error('迁移旧数据失败:', e);
      }
    }
    
    // 清理所有旧的 localStorage 键（迁移完成后）
    const oldKeys = ['xform.todos.list'];
    // 清理日期格式的旧键（xform.todos.YYYY-MM-DD）
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('xform.todos.') && key !== 'xform.todos.list') {
        // 检查是否是日期格式的键
        const dateMatch = key.match(/^xform\.todos\.\d{4}-\d{2}-\d{2}$/);
        if (dateMatch) {
          oldKeys.push(key);
        }
      }
    }
    
    // 删除所有旧键
    oldKeys.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        console.log(`清理旧的 localStorage 键: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    const saved = localStorage.getItem('xform-todos');
    if (saved) {
      const data = JSON.parse(saved);
      
      // 兼容旧格式：如果存在 todos, processing, completed，先迁移到新格式
      if (data.todos || data.processing || data.completed) {
        const allTasks = [
          ...(data.todos || []),
          ...(data.processing || []),
          ...(data.completed || [])
        ];
        
        // 将任务分配到新的数组中
        todos = [];
        planTodos = [];
        habitTodos = [];
      completedTodos = data.completed || [];
        processingTodos = data.processing || [];
        
        allTasks.forEach(todo => {
          if (todo.completed) {
            // 已完成的任务保持在 completedTodos
            return;
          }
          
          // 检查任务类型：todo（待办）、plan（计划）、habit（打卡）
          const taskType = todo.taskType || (todo.plan_type === 'checkin' ? 'habit' : (todo.plan_type ? 'plan' : 'todo'));
          const hasDateRange = todo.startDate && todo.endDate && 
                               String(todo.startDate).trim() !== '' && 
                               String(todo.endDate).trim() !== '';
          
          if (taskType === 'todo' || (!hasDateRange && !todo.plan_type)) {
            // 待办任务（没有日期范围）
            todos.push(todo);
          } else if (hasDateRange) {
            // 有日期范围的任务：计划任务或打卡任务
            if (taskType === 'habit' || todo.plan_type === 'checkin') {
              habitTodos.push(todo);
            } else {
              planTodos.push(todo);
            }
          } else {
            // 默认作为待办任务
            todos.push(todo);
          }
        });
        
        // 保存为新格式
        saveTodos();
      } else {
        // 新格式：直接加载
        todos = data.todos || [];
        planTodos = data.planTodos || [];
        habitTodos = data.habitTodos || [];
        processingTodos = data.processingTodos || [];
        completedTodos = data.completedTodos || [];
      }
      
      // Ensure all todos have color field and migrate old fields to new ones
      let needsSave = false;
      [...todos, ...planTodos, ...habitTodos, ...processingTodos, ...completedTodos].forEach(todo => {
        if (!todo.color) {
          todo.color = DEFAULT_TASK_COLOR;
          needsSave = true;
        }
        // 迁移旧字段到新字段（向后兼容）
        if (todo.taskType !== undefined && todo.plan_type === undefined) {
          todo.plan_type = todo.taskType;
          delete todo.taskType;
          needsSave = true;
        }
        if (todo.checkinDates !== undefined && todo.finish_data === undefined) {
          todo.finish_data = todo.checkinDates;
          delete todo.checkinDates;
          needsSave = true;
        }
        // 确保所有任务都有 plan_type 字段
        if (todo.plan_type === undefined) {
          todo.plan_type = 'normal';
          needsSave = true;
        }
        if (todo.plan_type === 'checkin' && todo.finish_data === undefined) {
          todo.finish_data = [];
          needsSave = true;
        }
        if (todo.plan_type === 'normal' && todo.finish_data !== undefined) {
          // 普通任务不需要 finish_data，可以删除
          delete todo.finish_data;
          needsSave = true;
        }
        // 确保所有任务都有 category 字段（如果没有，默认为空）
        if (todo.category === undefined) {
          todo.category = '';
          needsSave = true;
        }
      });
      
      // 如果进行了迁移，保存一次
      if (needsSave) {
        saveTodos();
      }
    }
  } catch (error) {
    console.error('Error loading todos:', error);
  }
  
  // 加载完成后，渲染所有任务
  // 注意：这里不直接渲染，由初始化函数统一处理，避免重复渲染
}

function saveTodos() {
  try {
    const data = {
      todos: todos,
      planTodos: planTodos,
      habitTodos: habitTodos,
      processingTodos: processingTodos,
      completedTodos: completedTodos
    };
    localStorage.setItem('xform-todos', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving todos:', error);
  }
}

function renderTodos() {
  if (!todoListEl) return;
  
  todoListEl.innerHTML = '';
  
  // 渲染所有待办任务（包括已完成和未完成的）
  // 按完成状态和创建时间排序：未完成的在前，已完成的在后；同状态内按创建时间倒序
  const sortedTasks = todos.sort((a, b) => {
    // 先按完成状态排序：未完成的在前
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // 同状态内按创建时间倒序
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  sortedTasks.forEach(todo => {
    const location = findTaskLocation(todo.id);
    if (location) {
      renderTaskItem(todo, todoListEl, location);
    }
  });
  
  updateTodoTasksCount();
}

function renderProcessingTodos() {
  // 处理中的任务现在显示在计划任务中（如果已分配）或待办中
  renderTodos();
  renderTodayTasks();
  renderPlannedTasks();
}

// Helper functions for plan_type and finish_data (with backward compatibility)
function getPlanType(todo) {
  // 优先使用新字段，如果没有则使用旧字段（向后兼容）
  return todo.plan_type || todo.taskType || 'normal';
}

function getFinishData(todo) {
  // 优先使用新字段，如果没有则使用旧字段（向后兼容）
  return todo.finish_data || todo.checkinDates || [];
}

function setPlanType(todo, planType) {
  todo.plan_type = planType;
  // 删除旧字段（如果存在）
  if (todo.taskType !== undefined) {
    delete todo.taskType;
  }
}

function setFinishData(todo, finishData) {
  todo.finish_data = finishData;
  // 删除旧字段（如果存在）
  if (todo.checkinDates !== undefined) {
    delete todo.checkinDates;
  }
}

// 检查是否可以打卡（根据打卡类型）
function canCheckin(todo) {
  const habitType = todo.habitType || 'daily';
  const finishData = getFinishData(todo);
  
  if (!finishData || !Array.isArray(finishData)) {
    return true; // 如果没有打卡记录，可以打卡
  }
  
  const today = getToday();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  if (habitType === 'daily') {
    // 每日打卡：每天可以打卡一次
    return !finishData.includes(todayStr);
  } else if (habitType === 'weekly') {
    // 每周打卡：每周可以打卡一次（检查当前周是否已经打卡）
    const currentWeekStart = getWeekStart(today);
    const currentWeekEnd = getWeekEnd(today);
    
    // 检查当前周内是否有打卡记录
    const hasCheckedInThisWeek = finishData.some(dateStr => {
      const checkDate = new Date(dateStr + 'T00:00:00');
      return checkDate >= currentWeekStart && checkDate <= currentWeekEnd;
    });
    
    return !hasCheckedInThisWeek;
  } else if (habitType === 'monthly') {
    // 每月打卡：每月可以打卡一次（检查当前月是否已经打卡）
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    // 检查当前月内是否有打卡记录
    const hasCheckedInThisMonth = finishData.some(dateStr => {
      const checkDate = new Date(dateStr + 'T00:00:00');
      return checkDate.getFullYear() === currentYear && 
             (checkDate.getMonth() + 1) === currentMonth;
    });
    
    return !hasCheckedInThisMonth;
  }
  
  return true; // 默认可以打卡
}

// 获取周的开始日期（周一）
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 调整为周一开始
  return new Date(d.setDate(diff));
}

// 获取周的结束日期（周日）
function getWeekEnd(date) {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
}

// 获取打卡提示文本
function getCheckinHint(todo) {
  const habitType = todo.habitType || 'daily';
  const finishData = getFinishData(todo);
  const checkinCount = finishData ? finishData.length : 0;
  
  if (habitType === 'daily') {
    return `已打卡 ${checkinCount} 天`;
  } else if (habitType === 'weekly') {
    return `已打卡 ${checkinCount} 周`;
  } else if (habitType === 'monthly') {
    return `已打卡 ${checkinCount} 月`;
  }
  
  return `已打卡 ${checkinCount} 次`;
}

// Helper function to find task location
function findTaskLocation(todoId) {
  // 确保 todoId 是数字类型进行比较（因为任务 ID 可能是数字，但传入的可能是字符串）
  const id = typeof todoId === 'string' ? Number(todoId) : todoId;
  
  let index = todos.findIndex(t => {
    const taskId = typeof t.id === 'string' ? Number(t.id) : t.id;
    return taskId === id;
  });
  if (index >= 0) {
    return { array: todos, index, state: 'todo' };
  }
  
  index = planTodos.findIndex(t => {
    const taskId = typeof t.id === 'string' ? Number(t.id) : t.id;
    return taskId === id;
  });
  if (index >= 0) {
    return { array: planTodos, index, state: 'plan' };
  }
  
  index = habitTodos.findIndex(t => {
    const taskId = typeof t.id === 'string' ? Number(t.id) : t.id;
    return taskId === id;
  });
  if (index >= 0) {
    return { array: habitTodos, index, state: 'habit' };
  }
  
  index = processingTodos.findIndex(t => {
    const taskId = typeof t.id === 'string' ? Number(t.id) : t.id;
    return taskId === id;
  });
  if (index >= 0) {
    return { array: processingTodos, index, state: 'processing' };
  }
  
  index = completedTodos.findIndex(t => {
    const taskId = typeof t.id === 'string' ? Number(t.id) : t.id;
    return taskId === id;
  });
  if (index >= 0) {
    return { array: completedTodos, index, state: 'completed' };
  }
  
  // 如果找不到，添加调试日志
  addDebugLog('findTaskLocation: task not found', {
    todoId,
    id,
    todos_count: todos.length,
    planTodos_count: planTodos.length,
    habitTodos_count: habitTodos.length,
    processingTodos_count: processingTodos.length,
    completedTodos_count: completedTodos.length,
    todos_ids: todos.map(t => t.id).slice(0, 5),
    planTodos_ids: planTodos.map(t => t.id).slice(0, 5),
    habitTodos_ids: habitTodos.map(t => t.id).slice(0, 5)
  });
  
  return null;
}

// Helper function to render a single task item
// isReadOnly: 如果为 true，表示任务来自计划任务或打卡任务，在今日任务中只读显示，不允许修改
function renderTaskItem(todo, containerEl, location, isReadOnly = false) {
  console.log('=== renderTaskItem 开始渲染 ===', {
    taskTitle: todo.title,
    taskId: todo.id,
    category: todo.category,
    hasCategory: !!todo.category
  });
  
  const li = document.createElement('li');
  li.className = 'todo-item';
  if (location && location.state === 'processing') {
    li.classList.add('processing');
  }
  // 如果是只读任务，添加只读类并禁用点击
  if (isReadOnly) {
    li.classList.add('todo-item-readonly');
    li.style.cursor = 'default';
  } else {
  li.style.cursor = 'pointer';
  }
  
  // 检查是否有日期范围
  const hasDateRange = todo.startDate && todo.endDate && String(todo.startDate).trim() !== '' && String(todo.endDate).trim() !== '';
  
  // 获取任务类型标记
  const taskType = todo.taskType || (hasDateRange ? (getPlanType(todo) === 'checkin' ? 'habit' : 'plan') : 'todo');
  let typeBadge = '';
  
  if (hasDateRange) {
    const planType = getPlanType(todo);
    if (planType === 'checkin') {
      const habitType = todo.habitType || 'daily';
      const habitTypeText = habitType === 'daily' ? '每日打卡' : (habitType === 'weekly' ? '每周打卡' : '每月打卡');
      typeBadge = `<span class="todo-type-badge todo-type-habit" title="${habitTypeText}">${habitTypeText}</span>`;
    } else {
      typeBadge = `<span class="todo-type-badge todo-type-plan" title="计划任务">计划任务</span>`;
    }
  } else if (taskType === 'todo') {
    typeBadge = `<span class="todo-type-badge todo-type-todo" title="待办任务">待办</span>`;
  }
  
  // 根据是否有日期范围决定显示什么时间
  let dateRangeStr = ''; // 执行周期字符串，显示在标题后面
  
  if (hasDateRange) {
    // 计划任务：显示规划时间（开始日期 - 结束日期）
    const startDate = new Date(todo.startDate);
    const endDate = new Date(todo.endDate);
    const startMonth = startDate.getMonth() + 1;
    const startDay = startDate.getDate();
    const endMonth = endDate.getMonth() + 1;
    const endDay = endDate.getDate();
    
    // 如果开始和结束在同一个月，只显示一次月份
    if (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth()) {
      dateRangeStr = `${startMonth}月${startDay}日-${endDay}日`;
    } else {
      dateRangeStr = `${startMonth}月${startDay}日-${endMonth}月${endDay}日`;
    }
  }
  
  // 根据任务状态显示不同的操作按钮
  // 布局：标题 | 类型 | 编辑 | 持续时间 | 任务独特显示区域
  let editButton = '';
  let uniqueDisplayArea = '';
  
  if (location && location.state === 'processing') {
    editButton = `<button class="todo-edit-menu" onclick="showEditMenu('${todo.id}', event, 'processing'); event.stopPropagation()" title="编辑">✏️</button>`;
    uniqueDisplayArea = `
      <button class="todo-complete" onclick="completeTaskById('${todo.id}'); event.stopPropagation()" title="标记为已完成">✓</button>
      <button class="todo-back" onclick="moveTaskBackToPending('${todo.id}'); event.stopPropagation()" title="移回待办">←</button>
    `;
  } else if (hasDateRange) {
    // 计划任务：显示编辑菜单按钮、任务独特显示区域
    const planType = getPlanType(todo); // 'normal' or 'checkin'
    
    // 统一的编辑菜单按钮
    editButton = `<button class="todo-edit-menu" onclick="showEditMenu('${todo.id}', event, 'plan'); event.stopPropagation()" title="编辑">✏️</button>`;
    
    // 如果是打卡任务，显示打卡按钮和打卡计数
    if (planType === 'checkin') {
      const habitType = todo.habitType || 'daily';
      const canCheckinToday = canCheckin(todo);
      const finishData = getFinishData(todo);
      const checkinCount = finishData ? finishData.length : 0;
      const checkinHint = getCheckinHint(todo);
      
      let checkinButtonTitle = '';
      if (habitType === 'daily') {
        checkinButtonTitle = canCheckinToday ? '今日打卡' : '今日已打卡';
      } else if (habitType === 'weekly') {
        checkinButtonTitle = canCheckinToday ? '本周打卡' : '本周已打卡';
      } else if (habitType === 'monthly') {
        checkinButtonTitle = canCheckinToday ? '本月打卡' : '本月已打卡';
      }
      
      uniqueDisplayArea = `
        <button class="todo-checkin ${!canCheckinToday ? 'checked' : ''}" 
                onclick="toggleCheckin('${todo.id}'); event.stopPropagation()" 
                title="${checkinButtonTitle}"
                ${!canCheckinToday ? 'disabled' : ''}>✓</button>
        <span class="todo-checkin-count" title="${checkinHint}">${checkinCount}</span>
      `;
    } else {
      // 普通计划任务：不显示下拉框，转为打卡任务通过编辑菜单操作
      // 添加占位元素，保持与打卡任务相同的布局宽度，确保标签和编辑按钮对齐
      uniqueDisplayArea = '<span class="todo-unique-placeholder"></span>';
    }
  } else {
    // 待办任务（todo）：没有日期范围的任务
    const taskType = todo.taskType || 'todo';
    const isProcessing = todo.processing === true;
    const isCompleted = todo.completed === true;
    
    if (isReadOnly) {
      // 只读模式：来自计划任务或打卡任务，只显示信息，不允许修改
      editButton = '';
      uniqueDisplayArea = `<span class="todo-readonly-label" title="此任务来自计划任务或打卡任务，请在对应分区修改">只读</span>`;
    } else if (isCompleted) {
      // 已完成：显示取消完成按钮和编辑菜单
      editButton = `<button class="todo-edit-menu" onclick="showEditMenu('${todo.id}', event, 'todo'); event.stopPropagation()" title="编辑">✏️</button>`;
      uniqueDisplayArea = `<button class="todo-complete-btn todo-complete-btn-completed" onclick="toggleTodoComplete('${todo.id}'); event.stopPropagation()" title="取消完成">✓</button>`;
    } else if (taskType === 'todo') {
      // 待办任务：显示完成按钮和编辑菜单按钮（包含转换和删除功能）
      editButton = `<button class="todo-edit-menu" onclick="showEditMenu('${todo.id}', event, 'todo'); event.stopPropagation()" title="编辑">✏️</button>`;
      uniqueDisplayArea = `<button class="todo-complete-btn" onclick="toggleTodoComplete('${todo.id}'); event.stopPropagation()" title="标记为完成">✓</button>`;
  } else {
      // 其他状态（兼容旧代码）
      editButton = `<button class="todo-edit-menu" onclick="showEditMenu('${todo.id}', event, 'todo'); event.stopPropagation()" title="编辑">✏️</button>`;
      if (isProcessing) {
        uniqueDisplayArea = `
          <button class="todo-stop" onclick="stopTask('${todo.id}'); event.stopPropagation()" title="停止">⏸</button>
          <button class="todo-complete" onclick="completeTodayTask('${todo.id}'); event.stopPropagation()" title="完成">✓</button>
        `;
      } else {
        uniqueDisplayArea = '';
      }
    }
  }
  
  // 为待办任务添加完成图标（在标题左侧）
  let completedIcon = '';
  if (!hasDateRange && taskType === 'todo' && todo.completed) {
    completedIcon = '<span class="todo-completed-icon" title="已完成">✓</span>';
  }
  
  // 获取任务归类显示（带颜色）
  const category = todo.category || '';
  let categoryBadge = '';
  if (category) {
    const categoryColor = getCategoryColor(category);
    console.log('渲染任务归类标签:', {
      taskTitle: todo.title,
      category: category,
      categoryColor: categoryColor,
      rgbaBackground: hexToRgba(categoryColor, 0.1),
      rgbaBorder: hexToRgba(categoryColor, 0.4)
    });
    categoryBadge = `<span class="todo-category-badge" title="任务归类: ${category}" style="background: ${hexToRgba(categoryColor, 0.1)}; border-color: ${hexToRgba(categoryColor, 0.4)}; color: ${categoryColor};">${category}</span>`;
    console.log('生成的HTML:', categoryBadge);
  } else {
    console.log('任务无归类:', todo.title);
  }
  
  li.innerHTML = `
    <span class="todo-status-indicator ${todo.processing ? 'processing' : ''} ${todo.completed ? 'completed' : ''}"></span>
    <span class="todo-category-col">
      ${categoryBadge}
    </span>
    <span class="todo-icon-col">
      ${completedIcon}
    </span>
    <span class="todo-text">
      ${todo.title}
      ${dateRangeStr ? `<span class="todo-date-range">${dateRangeStr}</span>` : ''}
    </span>
    <div class="todo-type-col">
      ${typeBadge}
    </div>
    <div class="todo-edit-col">
      ${editButton}
    </div>
    <div class="todo-unique-col">
      ${uniqueDisplayArea}
    </div>
  `;
  
  // 如果是只读任务，不添加点击事件打开详情面板
  if (!isReadOnly) {
  // 添加点击事件打开详情面板
  li.addEventListener('click', (e) => {
    if (!e.target.classList.contains('todo-delete') && 
        !e.target.classList.contains('todo-complete') && 
        !e.target.classList.contains('todo-complete-btn') &&
        !e.target.classList.contains('todo-back') && 
          !e.target.classList.contains('todo-start') &&
          !e.target.classList.contains('todo-stop') &&
          !e.target.classList.contains('todo-edit-date') &&
          !e.target.classList.contains('todo-completed-mark') &&
          !e.target.classList.contains('todo-completed-icon') &&
        !e.target.classList.contains('todo-processing') &&
        !e.target.classList.contains('todo-task-type') &&
        !e.target.classList.contains('todo-checkin') &&
        !e.target.classList.contains('todo-checkin-count') &&
          !e.target.classList.contains('todo-readonly-label') &&
          !e.target.classList.contains('todo-type-badge') &&
          !e.target.classList.contains('todo-edit-menu') &&
        e.target.tagName !== 'OPTION') {
      if (location) {
        showTodoDetail(todo, location.index, location.state);
      }
    }
  });
  }
  
  containerEl.appendChild(li);
}

// 渲染今日任务（显示今天有计划的计划任务和打卡任务）
function renderTodayTasks() {
  if (!todoTodayListEl) return;
  
  todoTodayListEl.innerHTML = '';
  
  // 获取今天的日期
  const today = getToday();
  
  // 筛选出今天有计划的普通计划任务和打卡任务
  const todayPlannedTasks = planTodos.filter(t => {
    if (t.completed || !t.startDate || !t.endDate) return false;
    const startDate = new Date(t.startDate);
    const endDate = new Date(t.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    // 使用本地日期进行比较，避免时区问题
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return todayLocal >= startDate && todayLocal <= endDate;
  });
  
  const todayHabitTasks = habitTodos.filter(t => {
    if (t.completed || !t.startDate || !t.endDate) return false;
    const startDate = new Date(t.startDate);
    const endDate = new Date(t.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    // 使用本地日期进行比较，避免时区问题
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return todayLocal >= startDate && todayLocal <= endDate;
  });
  
  // 合并今日的计划任务和打卡任务
  const allTasks = [...todayPlannedTasks, ...todayHabitTasks];
  
  // 按开始日期升序排序
  const sortedTasks = allTasks.sort((a, b) => {
    if (!a.startDate && !b.startDate) return 0;
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    
    const startA = new Date(a.startDate);
    const startB = new Date(b.startDate);
    
    if (isNaN(startA.getTime()) && isNaN(startB.getTime())) return 0;
    if (isNaN(startA.getTime())) return 1;
    if (isNaN(startB.getTime())) return -1;
    
    return startA.getTime() - startB.getTime();
  });
  
  sortedTasks.forEach(todo => {
    const location = findTaskLocation(todo.id);
    if (location) {
      // 今日任务中的计划任务和打卡任务是只读的
      renderTaskItem(todo, todoTodayListEl, location, true);
    }
  });
  
  updateTodayTasksCount();
}

function renderHabitTasks() {
  if (!todoHabitListEl) return;
  
  todoHabitListEl.innerHTML = '';
  
  // 获取所有打卡任务（未完成的）
  const allTasks = habitTodos.filter(t => !t.completed);
  
  addDebugLog('Habit tasks found', {
    count: allTasks.length,
    items: allTasks.map(t => ({
    id: t.id,
    title: t.title,
    startDate: t.startDate,
      endDate: t.endDate,
      plan_type: t.plan_type
    }))
  });
  
  // 按开始日期升序排序
  const sortedTasks = allTasks.sort((a, b) => {
    // 处理缺失 startDate 的情况
    if (!a.startDate && !b.startDate) return 0;
    if (!a.startDate) return 1; // 没有开始日期的排在后面
    if (!b.startDate) return -1;
    
    const startA = new Date(a.startDate);
    const startB = new Date(b.startDate);
    
    // 检查日期是否有效
    if (isNaN(startA.getTime()) && isNaN(startB.getTime())) return 0;
    if (isNaN(startA.getTime())) return 1;
    if (isNaN(startB.getTime())) return -1;
    
    return startA.getTime() - startB.getTime(); // 升序：开始日期早的在前
  });
  
  sortedTasks.forEach(todo => {
    const location = findTaskLocation(todo.id);
    if (location) {
      renderTaskItem(todo, todoHabitListEl, location);
    }
  });
  
  updateHabitTasksCount();
}

function renderPlannedTasks() {
  if (!todoPlannedListEl) return;
  
  todoPlannedListEl.innerHTML = '';
  
  // 显示所有计划任务和打卡任务（不筛选今天，常驻显示）
  const allPlannedTasks = planTodos.filter(t => !t.completed);
  const allHabitTasks = habitTodos.filter(t => !t.completed);
  
  // 合并所有计划任务和打卡任务
  const allTasks = [...allPlannedTasks, ...allHabitTasks];
  
  addDebugLog('Planned tasks found', {
    count: allTasks.length,
    planTodosCount: allPlannedTasks.length,
    habitTasksCount: allHabitTasks.length,
    planTodosTotal: planTodos.length,
    habitTodosTotal: habitTodos.length
  });
  
  // 按开始日期升序排序
  const sortedTasks = allTasks.sort((a, b) => {
    if (!a.startDate && !b.startDate) return 0;
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    
    const startA = new Date(a.startDate);
    const startB = new Date(b.startDate);
    
    if (isNaN(startA.getTime()) && isNaN(startB.getTime())) return 0;
    if (isNaN(startA.getTime())) return 1;
    if (isNaN(startB.getTime())) return -1;
    
    return startA.getTime() - startB.getTime();
  });
  
  sortedTasks.forEach(todo => {
    const location = findTaskLocation(todo.id);
    if (location) {
      renderTaskItem(todo, todoPlannedListEl, location);
    } else {
      addDebugLog('Task location not found in renderPlannedTasks', {
        id: todo.id,
        title: todo.title,
        startDate: todo.startDate,
        endDate: todo.endDate
      });
    }
  });
  
  updatePlannedTasksCount();
}

// Update task count functions
function updateTodoTasksCount() {
  if (!todoTasksCountEl) return;
  
  // 统计待办任务数量（未完成的）
  const todoTasksCount = todos.filter(t => !t.completed).length;
  
  // 统计今日完成的临时任务数量
  const today = getToday();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayCompletedCount = todos.filter(t => 
    t.completed && 
    t.completedDate === todayStr &&
    !t.startDate && 
    !t.endDate
  ).length;
  
  // 显示格式：未完成数量（今日完成数量）
  if (todayCompletedCount > 0) {
    todoTasksCountEl.textContent = `${todoTasksCount}（今日完成 ${todayCompletedCount}）`;
  } else {
    todoTasksCountEl.textContent = todoTasksCount;
  }
}

function updatePlannedTasksCount() {
  if (!plannedTasksCountEl) return;
  
  // 统计所有计划任务和打卡任务数量（未完成的）
  const plannedTasksCount = planTodos.filter(t => !t.completed).length;
  const habitTasksCount = habitTodos.filter(t => !t.completed).length;
  
  plannedTasksCountEl.textContent = plannedTasksCount + habitTasksCount;
}

function updateTodayTasksCount() {
  if (!todayTasksCountEl) return;
  
  // 获取今天的日期
  const today = getToday();
  
  // 统计今天有计划的计划任务和打卡任务数量
  const todayPlannedTasks = planTodos.filter(t => {
    if (t.completed || !t.startDate || !t.endDate) return false;
    const startDate = new Date(t.startDate);
    const endDate = new Date(t.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return todayLocal >= startDate && todayLocal <= endDate;
  });
  
  const todayHabitTasks = habitTodos.filter(t => {
    if (t.completed || !t.startDate || !t.endDate) return false;
    const startDate = new Date(t.startDate);
    const endDate = new Date(t.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return todayLocal >= startDate && todayLocal <= endDate;
  });
  
  todayTasksCountEl.textContent = todayPlannedTasks.length + todayHabitTasks.length;
}

function updateCompletedCount() {
  // 已完成分区已移除，此函数不再需要
}

// Task operations by ID
function startTask(todoId) {
  const location = findTaskLocation(todoId);
  if (!location) return;
  
  const todo = location.array[location.index];
  todo.processing = true;
  todo.processingAt = new Date().toISOString();
  
  // 如果任务在 todos 中，移动到 processingTodos
  if (location.state === 'today') {
    const index = todos.findIndex(t => t.id === todoId);
    if (index >= 0) {
      todos.splice(index, 1);
  processingTodos.push(todo);
    }
  }
  
  saveTodos();
  renderTodos();
  renderTodayTasks();
  renderPlannedTasks();
  renderCalendar();
}

function stopTask(todoId) {
  const location = findTaskLocation(todoId);
  if (!location) return;
  
  const todo = location.array[location.index];
  delete todo.processing;
  delete todo.processingAt;
  
  // 如果任务在 processingTodos 中，移回 todos
  if (location.state === 'processing') {
    const index = processingTodos.findIndex(t => t.id === todoId);
    if (index >= 0) {
      processingTodos.splice(index, 1);
      todos.push(todo);
    }
  }
  
  saveTodos();
  renderTodos();
  renderTodayTasks();
  renderPlannedTasks();
  renderCalendar();
}

function completeTodayTask(todoId) {
  const location = findTaskLocation(todoId);
  if (!location) return;
  
  const todo = location.array[location.index];
  todo.completed = true;
  todo.completedAt = new Date().toISOString();
  delete todo.processing;
  delete todo.processingAt;
  
  // 从原数组中移除
  location.array.splice(location.index, 1);
  
  // 添加到 todos 末尾（已完成的任务）
  todos.push(todo);
  
  saveTodos();
  renderTodos();
  renderTodayTasks();
  renderPlannedTasks();
  renderCalendar();
}

function editTaskDateRange(todoId) {
  const location = findTaskLocation(todoId);
  if (!location) return;
  
  const todo = location.array[location.index];
  
  // 如果任务没有日期范围，不执行编辑
  if (!todo.startDate || !todo.endDate) {
    if (statusEl) {
      statusEl.textContent = '⚠️ 该任务没有设置执行周期';
      setTimeout(() => {
        if (statusEl) statusEl.textContent = '';
      }, 2000);
    }
    return;
  }
  
  // 进入日期选择模式，允许修改执行周期
  if (location) {
    startDateSelection(location.index, location.state);
    
    // 显示提示
    if (statusEl) {
      statusEl.textContent = '✏️ 已进入修改模式，请重新选择执行周期';
      setTimeout(() => {
        if (statusEl && dateSelectionState.active) statusEl.textContent = '';
      }, 3000);
    }
  }
}

function planTask(todoId) {
  const location = findTaskLocation(todoId);
  if (!location) return;
  
  const todo = location.array[location.index];
  
  // 已完成的任务不支持规划日期
  if (todo.completed) {
    if (statusEl) {
      statusEl.textContent = '⚠️ 已完成的任务不支持规划日期';
      setTimeout(() => {
        if (statusEl) statusEl.textContent = '';
      }, 2000);
    }
    return;
  }
  
  // 进入日期选择模式，要求用户选择开始和结束日期
  startDateSelection(location.index, location.state);
  
  // 显示提示
  if (statusEl) {
    statusEl.textContent = '📅 请选择开始日期';
  }
}

function moveTaskToProcessing(todoId) {
  // 这个函数保留用于兼容，但实际使用 startTask
  startTask(todoId);
}

function moveTaskBackToPending(todoId) {
  const location = findTaskLocation(todoId);
  if (!location || location.state === 'today') return;
  
  const todo = location.array[location.index];
  delete todo.processing;
  delete todo.processingAt;
  
  // 根据任务是否有日期范围，决定添加到哪个数组
  const hasDateRange = todo.startDate && todo.endDate && 
                       String(todo.startDate).trim() !== '' && 
                       String(todo.endDate).trim() !== '';
  
  if (hasDateRange) {
    // 如果任务有日期范围，不应该移回 todos
    // 保持原位置或根据 plan_type 移动到正确的数组
    const planType = todo.plan_type || 'normal';
    if (planType === 'checkin' && location.state !== 'habit') {
      // 从其他数组移动到 habitTodos
      habitTodos.push(todo);
      location.array.splice(location.index, 1);
    } else if (planType === 'normal' && location.state !== 'plan') {
      // 从其他数组移动到 planTodos
      planTodos.push(todo);
      location.array.splice(location.index, 1);
    }
  } else {
    // 没有日期范围，移回 todos
  todos.push(todo);
  location.array.splice(location.index, 1);
  }
  
  saveTodos();
  renderTodos();
  renderTodayTasks();
  renderPlannedTasks();
  renderCalendar();
}

function deleteTaskById(todoId) {
  const location = findTaskLocation(todoId);
  if (!location) return;
  
  location.array.splice(location.index, 1);
  saveTodos();
  renderTodos();
  renderTodayTasks();
  renderPlannedTasks();
  renderCalendar();
}

// 确认将计划任务转为打卡任务（带对话框）
function confirmConvertPlanToHabit(todoId) {
  const location = findTaskLocation(todoId);
  if (!location) return;
  
  const todo = location.array[location.index];
  const taskTitle = todo.title || '该任务';
  
  // 创建确认对话框
  const dialog = document.createElement('div');
  dialog.className = 'modal';
  dialog.style.zIndex = '10001';
  dialog.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
      <div class="modal-header">
        <h3>转为打卡任务</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <p>确定要将计划任务 "<strong>${taskTitle}</strong>" 转为打卡任务吗？</p>
        <p style="color: var(--text-secondary); font-size: 12px; margin-top: 8px;">请选择打卡类型：</p>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
          <button class="btn-habit-type" onclick="convertPlanToHabit('${todoId}', 'daily'); this.closest('.modal').remove();">
            📋 每日打卡（每天可以打卡一次）
          </button>
          <button class="btn-habit-type" onclick="convertPlanToHabit('${todoId}', 'weekly'); this.closest('.modal').remove();">
            📋 每周打卡（每周可以打卡一次）
          </button>
          <button class="btn-habit-type" onclick="convertPlanToHabit('${todoId}', 'monthly'); this.closest('.modal').remove();">
            📋 每月打卡（每月可以打卡一次）
          </button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  // 点击背景关闭
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.remove();
    }
  });
  
  // ESC 键关闭
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      dialog.remove();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}

// 将计划任务转换为打卡任务
function convertPlanToHabit(todoId, habitType) {
  const location = findTaskLocation(todoId);
  if (!location) return;
  
  const todo = location.array[location.index];
  
  // 设置打卡任务类型
  todo.taskType = 'habit';
  todo.plan_type = 'checkin';
  todo.habitType = habitType; // 'daily', 'weekly', 'monthly'
  
  // 如果任务还没有颜色，自动分配一个未使用的颜色
  if (!todo.color) {
    todo.color = getAvailableColor();
  }
  
  // 初始化 finish_data（如果不存在）
  if (!todo.finish_data || !Array.isArray(todo.finish_data)) {
    todo.finish_data = [];
  }
  
  // 从 planTodos 移动到 habitTodos
  const indexInPlan = planTodos.findIndex(t => t.id === todoId);
  if (indexInPlan >= 0) {
    planTodos.splice(indexInPlan, 1);
    habitTodos.push(todo);
  }
  
  saveTodos();
  renderPlannedTasks();
  renderTodayTasks();
  renderTodos();
  renderCalendar();
  
  // 显示转换成功提示
  if (statusEl) {
    const habitTypeText = habitType === 'daily' ? '每日' : (habitType === 'weekly' ? '每周' : '每月');
    statusEl.textContent = `✅ 已转为${habitTypeText}打卡任务`;
    setTimeout(() => {
      if (statusEl) statusEl.textContent = '';
    }, 2000);
  }
}

// 确认删除任务（带对话框）
function confirmDeleteTask(todoId) {
  const location = findTaskLocation(todoId);
  if (!location) return;
  
  const todo = location.array[location.index];
  const taskTitle = todo.title || '该任务';
  
  // 创建确认对话框
  const dialog = document.createElement('div');
  dialog.className = 'modal';
  dialog.style.zIndex = '10001';
  dialog.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
      <div class="modal-header">
        <h3>确认删除</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <p>确定要删除任务 "<strong>${taskTitle}</strong>" 吗？</p>
        <p style="color: var(--text-secondary); font-size: 12px; margin-top: 8px;">此操作无法撤销</p>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
        <button class="btn-danger" onclick="deleteTaskById('${todoId}'); this.closest('.modal').remove();">删除</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  // 点击背景关闭
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.remove();
    }
  });
  
  // ESC 键关闭
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      dialog.remove();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}

// 切换待办任务的完成状态
function toggleTodoComplete(todoId) {
  const location = findTaskLocation(todoId);
  if (!location || location.state !== 'todo') return;
  
  const todo = location.array[location.index];
  
  if (todo.completed) {
    // 取消完成
    todo.completed = false;
    delete todo.completedAt;
    delete todo.completedDate; // 删除完成日期记录
  } else {
    // 标记为完成
    todo.completed = true;
    todo.completedAt = new Date().toISOString();
    
    // 记录完成日期（用于统计今日完成的临时任务）
    const today = getToday();
    todo.completedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  
  saveTodos();
  renderTodos();
  updateTodoTasksCount();
  
  // 显示状态提示
  if (statusEl) {
    if (todo.completed) {
      statusEl.textContent = '✅ 任务已完成';
    } else {
      statusEl.textContent = '↩️ 已取消完成';
    }
    setTimeout(() => {
      if (statusEl) statusEl.textContent = '';
    }, 2000);
  }
}

function completeTaskById(todoId) {
  const location = findTaskLocation(todoId);
  if (!location) return;
  
  const todo = location.array[location.index];
  todo.completed = true;
  todo.completedAt = new Date().toISOString();
  completedTodos.push(todo);
  location.array.splice(location.index, 1);
  
  saveTodos();
  renderTodos();
  renderTodayTasks();
  renderPlannedTasks();
  renderCalendar();
}

// Task type and checkin functions
function changeTaskType(todoId, taskType) {
  const location = findTaskLocation(todoId);
  if (!location) {
    addDebugLog('changeTaskType: task not found', { todoId });
    return;
  }
  
  const todo = location.array[location.index];
  const currentPlanType = getPlanType(todo);
  
  addDebugLog('changeTaskType: start', {
    todoId,
    taskType,
    currentPlanType,
    todo_plan_type: todo.plan_type,
    location_state: location.state,
    array_length: location.array.length
  });
  
  // 如果任务已经是打卡任务，不允许改回普通任务
  if (currentPlanType === 'checkin' && taskType === 'normal') {
    // 恢复下拉框到原来的值
    const selectEl = document.querySelector(`.todo-task-type[onchange*="${todoId}"]`);
    if (selectEl) {
      selectEl.value = 'checkin';
    }
    
    // 显示友好提示
    if (statusEl) {
      statusEl.textContent = '⚠️ 设置为打卡任务后不允许改为普通计划任务';
      setTimeout(() => {
        if (statusEl) statusEl.textContent = '';
      }, 3000);
    }
    return;
  }
  
  // 如果设置为打卡任务，显示提示
  if (taskType === 'checkin' && currentPlanType !== 'checkin') {
    if (statusEl) {
      statusEl.textContent = 'ℹ️ 设置为打卡任务后只支持删除';
      setTimeout(() => {
        if (statusEl) statusEl.textContent = '';
      }, 3000);
    }
  }
  
  // 直接修改数组中的对象
  todo.plan_type = taskType;
  if (todo.taskType !== undefined) {
    delete todo.taskType;
  }
  
  // 如果是打卡任务，确保 finish_data 存在（即使为空数组）
  if (taskType === 'checkin') {
    const finishData = getFinishData(todo);
    // 确保 finish_data 是一个数组
    if (!Array.isArray(finishData)) {
      todo.finish_data = [];
    } else {
      todo.finish_data = finishData;
    }
    if (todo.checkinDates !== undefined) {
    delete todo.checkinDates;
    }
    addDebugLog('Changed to checkin task', {
      id: todo.id,
      title: todo.title,
      plan_type: todo.plan_type,
      finish_data: todo.finish_data
    });
  } else {
    // 如果不是打卡任务，清除 finish_data
    if (todo.finish_data !== undefined) {
      delete todo.finish_data;
    }
    if (todo.checkinDates !== undefined) {
      delete todo.checkinDates;
    }
  }
  
  // 确保所有数组中的同一个任务对象都被更新，并在数组间移动（如果需要）
  const taskInToday = todos.find(t => t.id === todo.id);
  const taskInPlan = planTodos.find(t => t.id === todo.id);
  const taskInHabit = habitTodos.find(t => t.id === todo.id);
  const taskInProcessing = processingTodos.find(t => t.id === todo.id);
  const taskInCompleted = completedTodos.find(t => t.id === todo.id);
  
  // 检查任务是否有日期范围
  const hasDateRange = todo.startDate && todo.endDate && 
                       String(todo.startDate).trim() !== '' && 
                       String(todo.endDate).trim() !== '';
  
  // 如果任务有日期范围，需要在 planTodos 和 habitTodos 之间移动
  if (hasDateRange) {
    // 从原数组中移除
    if (taskInPlan) {
      const index = planTodos.indexOf(taskInPlan);
      if (index >= 0) planTodos.splice(index, 1);
    }
    if (taskInHabit) {
      const index = habitTodos.indexOf(taskInHabit);
      if (index >= 0) habitTodos.splice(index, 1);
    }
    
    // 添加到新数组
    if (taskType === 'checkin') {
      habitTodos.push(todo);
    } else {
      planTodos.push(todo);
    }
  }
  
  // 更新所有找到的任务对象
  [taskInToday, taskInPlan, taskInHabit, taskInProcessing, taskInCompleted].forEach(task => {
    if (task && task !== todo) {
      task.plan_type = taskType;
      if (task.taskType !== undefined) delete task.taskType;
      if (taskType === 'checkin') {
        task.finish_data = todo.finish_data || [];
      } else {
        if (task.finish_data !== undefined) delete task.finish_data;
      }
    }
  });
  
  // 添加调试日志
  addDebugLog('changeTaskType: before save', {
    todoId: todo.id,
    taskType: taskType,
    todo_plan_type: todo.plan_type,
    hasDateRange: hasDateRange,
    taskInToday: !!taskInToday,
    taskInPlan: !!taskInPlan,
    taskInHabit: !!taskInHabit
  });
  
  saveTodos();
  
  // 验证保存后的值
  const savedData = localStorage.getItem('xform-todos');
  if (savedData) {
    const parsed = JSON.parse(savedData);
    const savedTask = [...(parsed.todos || []), ...(parsed.planTodos || []), ...(parsed.habitTodos || []), ...(parsed.processingTodos || []), ...(parsed.completedTodos || [])].find(t => t.id === todo.id);
    addDebugLog('changeTaskType: after save', {
      todoId: todo.id,
      saved_plan_type: savedTask?.plan_type,
      saved_finish_data: savedTask?.finish_data
    });
  }
  
  renderPlannedTasks();
  renderTodayTasks();
  renderTodos(); // 确保任务列表更新
  renderCalendar();
}

function toggleCheckin(todoId) {
  const location = findTaskLocation(todoId);
  if (!location) return;
  
  const todo = location.array[location.index];
  let finishData = getFinishData(todo);
  
  if (!finishData || !Array.isArray(finishData)) {
    finishData = [];
  }
  
  // 检查是否可以打卡
  if (!canCheckin(todo)) {
    // 不能打卡，显示提示
    if (statusEl) {
      const habitType = todo.habitType || 'daily';
      let hintText = '';
      if (habitType === 'daily') {
        hintText = '今日已打卡';
      } else if (habitType === 'weekly') {
        hintText = '本周已打卡';
      } else if (habitType === 'monthly') {
        hintText = '本月已打卡';
      }
      statusEl.textContent = `⚠️ ${hintText}`;
      setTimeout(() => {
        if (statusEl) statusEl.textContent = '';
      }, 2000);
    }
    return;
  }
  
  const today = getToday();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // 打卡
  finishData.push(todayStr);
  // 排序确保日期顺序
  finishData.sort();
  setFinishData(todo, finishData);
  
  saveTodos();
  renderPlannedTasks();
  renderTodayTasks();
  renderTodos(); // 确保任务列表更新
  renderCalendar();
  
  // 显示打卡成功提示
  if (statusEl) {
    const habitType = todo.habitType || 'daily';
    let hintText = '';
    if (habitType === 'daily') {
      hintText = '✅ 今日打卡成功';
    } else if (habitType === 'weekly') {
      hintText = '✅ 本周打卡成功';
    } else if (habitType === 'monthly') {
      hintText = '✅ 本月打卡成功';
    }
    statusEl.textContent = hintText;
    setTimeout(() => {
      if (statusEl) statusEl.textContent = '';
    }, 2000);
  }
}

function addTodo(category = null) {
  const text = todoInputEl.value.trim();
  if (!text) return;
  
  // 使用传入的category，如果没有则使用当前选中的归类
  const finalCategory = category !== null ? category : currentInputCategory;
  
  const todo = {
    id: Date.now(),
    title: text,
    description: '',
    completed: false,
    // 待办任务不需要颜色，只有在转换为计划任务时才分配颜色
    // color: DEFAULT_TASK_COLOR,
    taskType: 'todo', // 默认类型为待办任务
    category: finalCategory || '', // 任务归类
    createdAt: new Date().toISOString()
  };
  
  // 新任务添加到 todos（待办任务）
  todos.push(todo);
  todoInputEl.value = '';
  // 清空当前归类选择
  currentInputCategory = '';
  updateCategoryHint();
  saveTodos();
  renderTodos();
  renderTodayTasks();
  renderPlannedTasks();
  renderCalendar();
}

// 更新归类提示显示
function updateCategoryHint() {
  const hintEl = document.getElementById('todoCategoryHint');
  if (!hintEl) {
    console.warn('归类提示元素未找到');
    return; // 如果元素不存在，直接返回
  }
  
  console.log('updateCategoryHint 被调用，当前归类:', currentInputCategory);
  
  if (currentInputCategory) {
    // 获取归类颜色并应用到提示
    const categoryColor = getCategoryColor(currentInputCategory);
    if (categoryColor) {
      const rgbaBackground = hexToRgba(categoryColor, 0.1);
      const rgbaBorder = hexToRgba(categoryColor, 0.4);
      
      console.log('更新归类提示颜色:', {
        category: currentInputCategory,
        hexColor: categoryColor,
        rgbaBackground: rgbaBackground,
        rgbaBorder: rgbaBorder,
        rgbaText: categoryColor
      });
      
      // 应用颜色样式
      hintEl.textContent = currentInputCategory;
      hintEl.classList.add('has-category');
      hintEl.style.background = rgbaBackground;
      hintEl.style.borderColor = rgbaBorder;
      hintEl.style.color = categoryColor;
    } else {
      hintEl.textContent = currentInputCategory;
      hintEl.classList.add('has-category');
    }
    console.log('更新提示为:', currentInputCategory);
  } else {
    hintEl.textContent = '无归类';
    hintEl.classList.remove('has-category');
    // 重置样式
    hintEl.style.background = '';
    hintEl.style.borderColor = '';
    hintEl.style.color = '';
    console.log('更新提示为: 无归类');
  }
}

// 切换下一个归类
function cycleToNextCategory() {
  console.log('cycleToNextCategory 被调用');
  console.log('当前归类:', currentInputCategory);
  console.log('可用归类列表:', taskCategories);
  
  if (taskCategories.length === 0) {
    console.log('没有可用归类，设置为空');
    currentInputCategory = '';
    updateCategoryHint();
    return;
  }
  
  const currentIndex = currentInputCategory ? taskCategories.indexOf(currentInputCategory) : -1;
  console.log('当前归类索引:', currentIndex);
  
  // 计算下一个索引：-1(无归类) -> 0(第一个) -> 1(第二个) -> ... -> length(无归类)
  const nextIndex = (currentIndex + 1) % (taskCategories.length + 1);
  console.log('下一个归类索引:', nextIndex);
  
  if (nextIndex === taskCategories.length) {
    // 循环到"无归类"（当索引等于归类数量时）
    console.log('切换到: 无归类');
    currentInputCategory = '';
  } else {
    // 切换到对应的归类（索引0到length-1）
    const newCategory = taskCategories[nextIndex];
    currentInputCategory = newCategory;
    console.log('切换到归类:', newCategory);
    
    // 打印归类颜色信息
    const categoryColor = getCategoryColor(newCategory);
    if (categoryColor) {
      const rgbaBackground = hexToRgba(categoryColor, 0.1);
      const rgbaBorder = hexToRgba(categoryColor, 0.4);
      console.log('归类颜色信息:', {
        category: newCategory,
        hexColor: categoryColor,
        rgbaBackground: rgbaBackground,
        rgbaBorder: rgbaBorder,
        rgbaText: categoryColor
      });
    }
  }
  
  console.log('更新后的归类:', currentInputCategory);
  updateCategoryHint();
}

function toggleTodo(index) {
  if (index >= 0 && index < todos.length) {
    const todo = todos[index];
    todo.completed = !todo.completed;
    
    if (todo.completed) {
      todo.completedAt = new Date().toISOString();
      completedTodos.push(todo);
      todos.splice(index, 1);
    }
    
    saveTodos();
    renderTodos();
    renderTodayTasks();
    renderPlannedTasks();
    renderCalendar();
  }
}

function moveToProcessing(index) {
  if (index >= 0 && index < todos.length) {
    const todo = todos[index];
    moveTaskToProcessing(todo.id);
  }
}

function deleteTodo(index) {
  if (index >= 0 && index < todos.length) {
    const todo = todos[index];
    deleteTaskById(todo.id);
  }
}

function toggleProcessingTodo(index) {
  if (index >= 0 && index < processingTodos.length) {
    const todo = processingTodos[index];
    todo.completed = !todo.completed;
    
    if (todo.completed) {
      todo.completedAt = new Date().toISOString();
      completedTodos.push(todo);
      processingTodos.splice(index, 1);
    }
    
    saveTodos();
    renderTodos();
    renderTodayTasks();
    renderPlannedTasks();
    renderCalendar();
  }
}

function completeProcessingTodo(index) {
  if (index >= 0 && index < processingTodos.length) {
    const todo = processingTodos[index];
    completeTaskById(todo.id);
  }
}

function moveBackToPending(index) {
  if (index >= 0 && index < processingTodos.length) {
    const todo = processingTodos[index];
    moveTaskBackToPending(todo.id);
  }
}

function deleteProcessingTodo(index) {
  if (index >= 0 && index < processingTodos.length) {
    const todo = processingTodos[index];
    deleteTaskById(todo.id);
  }
}

// 移除旧的toggleProcessingView函数，不再需要

// 已完成分区已移除，不再需要toggleCompletedView函数

function deleteCompletedTodo(index) {
  if (index >= 0 && index < completedTodos.length) {
    const todo = completedTodos[index];
    
    // 弹出确认对话框
    const confirmed = confirm(`确定要删除已完成的任务"${todo.title}"吗？`);
    if (!confirmed) {
      return;
    }
    
    completedTodos.splice(index, 1);
    saveTodos();
    renderCalendar();
  }
}

// Todo Detail Panel functions
function showTodoDetail(todo, index, state = 'pending') {
  currentEditingTodoIndex = index;
  currentEditingState = state;
  
  const detailPanel = document.getElementById('todoDetailPanel');
  const titleInput = document.getElementById('detailTitle');
  const descriptionInput = document.getElementById('detailDescription');
  const createdAtDisplay = document.getElementById('detailCreatedAt');
  const dateRangeDisplay = document.getElementById('detailDateRange');
  const colorPickerEl = document.getElementById('detailColorPicker');
  const categoryPickerEl = document.getElementById('detailCategoryPicker');
  
  // 填充数据
  titleInput.value = todo.title;
  descriptionInput.value = todo.description || '';
  
  // 格式化创建时间
  const createdDate = new Date(todo.createdAt);
  const formattedDate = createdDate.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  createdAtDisplay.textContent = formattedDate;
  
  // 显示执行周期
  if (dateRangeDisplay) {
    if (todo.startDate && todo.endDate) {
      const startDate = new Date(todo.startDate);
      const endDate = new Date(todo.endDate);
      const startStr = startDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const endStr = endDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      dateRangeDisplay.innerHTML = `<span class="date-range-display">${startStr} 至 ${endStr}</span>`;
    } else {
      dateRangeDisplay.innerHTML = '<span class="no-date-range">未设置</span>';
    }
  }
  
  // 渲染归类选择器
  if (categoryPickerEl) {
    const currentCategory = todo.category || '';
    categoryPickerEl.innerHTML = '';
    
    // 添加"无归类"选项
    const noneBtn = document.createElement('button');
    noneBtn.className = 'category-option-btn';
    noneBtn.textContent = '无归类';
    if (!currentCategory) {
      noneBtn.classList.add('selected');
    }
    noneBtn.addEventListener('click', () => {
      selectTaskCategory('');
    });
    categoryPickerEl.appendChild(noneBtn);
    
    // 添加所有归类选项（带颜色显示）
    taskCategories.forEach(category => {
      const categoryBtn = document.createElement('button');
      categoryBtn.className = 'category-option-btn';
      categoryBtn.textContent = category;
      
      // 应用归类颜色
      const categoryColor = getCategoryColor(category);
      if (categoryColor) {
        categoryBtn.style.background = hexToRgba(categoryColor, 0.1);
        categoryBtn.style.borderColor = hexToRgba(categoryColor, 0.4);
        categoryBtn.style.color = categoryColor;
      }
      
      if (category === currentCategory) {
        categoryBtn.classList.add('selected');
      }
      categoryBtn.addEventListener('click', () => {
        console.log('点击归类按钮:', category);
        selectTaskCategory(category);
      });
      categoryPickerEl.appendChild(categoryBtn);
    });
    
    // 添加"添加新归类"按钮
    const addBtn = document.createElement('button');
    addBtn.className = 'category-option-btn category-add-btn';
    addBtn.textContent = '+ 添加新归类';
    addBtn.addEventListener('click', () => {
      // 使用自定义模态框而不是prompt
      showAddCategoryInput();
      // 添加新归类后，刷新归类选择器
      setTimeout(() => {
        showTodoDetail(todo, index, state);
      }, 100);
    });
    categoryPickerEl.appendChild(addBtn);
  }
  
  // 渲染颜色选择器
  if (colorPickerEl) {
    const currentColor = todo.color || DEFAULT_TASK_COLOR;
    colorPickerEl.innerHTML = '';
    TASK_COLORS.forEach(color => {
      const colorBtn = document.createElement('button');
      colorBtn.className = 'color-option';
      colorBtn.style.backgroundColor = color;
      if (color === currentColor) {
        colorBtn.classList.add('selected');
      }
      colorBtn.title = color;
      colorBtn.addEventListener('click', () => {
        selectTaskColor(color);
      });
      colorPickerEl.appendChild(colorBtn);
    });
  }
  
  // 添加自动保存事件监听器
  titleInput.addEventListener('input', autoSaveTodoDetail);
  descriptionInput.addEventListener('input', autoSaveTodoDetail);
  
  // 显示面板
  detailPanel.classList.add('show');
}

function selectTaskColor(color) {
  if (currentEditingTodoIndex < 0) return;
  
  let targetArray;
  if (currentEditingState === 'processing') {
    targetArray = processingTodos;
  } else if (currentEditingState === 'completed') {
    targetArray = completedTodos;
  } else if (currentEditingState === 'today') {
    targetArray = todos;
  } else if (currentEditingState === 'plan') {
    targetArray = planTodos;
  } else if (currentEditingState === 'habit') {
    targetArray = habitTodos;
  } else {
    targetArray = todos;
  }
  
  if (currentEditingTodoIndex >= targetArray.length) return;
  
  // 更新颜色
  const updatedTask = targetArray[currentEditingTodoIndex];
  updatedTask.color = color;
  
  // 更新颜色选择器UI
  const colorPickerEl = document.getElementById('detailColorPicker');
  if (colorPickerEl) {
    colorPickerEl.querySelectorAll('.color-option').forEach(btn => {
      btn.classList.remove('selected');
      if (btn.style.backgroundColor === color) {
        btn.classList.add('selected');
      }
    });
  }
  
  // 保存
  saveTodos();
  
  // 更新任务列表显示
  renderTodos();
  renderTodayTasks();
  renderPlannedTasks();
  
  // 立即更新日历横栏颜色
  if (calendarViewMode === 'bars' && updatedTask.id && updatedTask.startDate && updatedTask.endDate) {
    // 直接重新渲染横栏以确保颜色更新
    renderTaskBars();
  } else {
    // 如果不是横栏模式或任务没有日期范围，刷新日历
    renderCalendar();
  }
}

function selectTaskCategory(category) {
  if (currentEditingTodoIndex < 0) return;
  
  let targetArray;
  if (currentEditingState === 'processing') {
    targetArray = processingTodos;
  } else if (currentEditingState === 'completed') {
    targetArray = completedTodos;
  } else if (currentEditingState === 'today') {
    targetArray = todos;
  } else if (currentEditingState === 'plan') {
    targetArray = planTodos;
  } else if (currentEditingState === 'habit') {
    targetArray = habitTodos;
  } else {
    targetArray = todos;
  }
  
  if (currentEditingTodoIndex >= targetArray.length) return;
  
  // 更新归类
  const updatedTask = targetArray[currentEditingTodoIndex];
  updatedTask.category = category;
  
  // 更新归类选择器UI
  const categoryPickerEl = document.getElementById('detailCategoryPicker');
  if (categoryPickerEl) {
    categoryPickerEl.querySelectorAll('.category-option-btn').forEach(btn => {
      btn.classList.remove('selected');
      if ((!category && btn.textContent === '无归类') || btn.textContent === category) {
        btn.classList.add('selected');
      }
    });
  }
  
  // 保存
  saveTodos();
  
  // 更新任务列表显示
  renderTodos();
  renderTodayTasks();
  renderPlannedTasks();
  renderCalendar();
}

function hideTodoDetail() {
  const detailPanel = document.getElementById('todoDetailPanel');
  const titleInput = document.getElementById('detailTitle');
  const descriptionInput = document.getElementById('detailDescription');
  
  // 移除自动保存事件监听器
  titleInput.removeEventListener('input', autoSaveTodoDetail);
  descriptionInput.removeEventListener('input', autoSaveTodoDetail);
  
  detailPanel.classList.remove('show');
  
  // 如果当前是横栏模式，重新渲染日历以刷新横栏颜色
  if (calendarViewMode === 'bars') {
    renderCalendar();
  }
  
  currentEditingTodoIndex = -1;
}

function autoSaveTodoDetail() {
  if (currentEditingTodoIndex < 0) return;
  
  const titleInput = document.getElementById('detailTitle');
  const descriptionInput = document.getElementById('detailDescription');
  
  const newTitle = titleInput.value.trim();
  if (!newTitle) return; // 如果标题为空，不保存
  
  // 根据当前状态更新对应的数组
  let targetArray;
  if (currentEditingState === 'processing') {
    targetArray = processingTodos;
  } else if (currentEditingState === 'completed') {
    targetArray = completedTodos;
  } else if (currentEditingState === 'today') {
    targetArray = todos;
  } else if (currentEditingState === 'plan') {
    targetArray = planTodos;
  } else if (currentEditingState === 'habit') {
    targetArray = habitTodos;
  } else {
    targetArray = todos;
  }
  
  if (currentEditingTodoIndex >= targetArray.length) return;
  
  // 更新todo数据
  targetArray[currentEditingTodoIndex].title = newTitle;
  targetArray[currentEditingTodoIndex].description = descriptionInput.value.trim();
  
  // 确保有颜色字段
  if (!targetArray[currentEditingTodoIndex].color) {
    targetArray[currentEditingTodoIndex].color = DEFAULT_TASK_COLOR;
  }
  
  // 保存并刷新
  saveTodos();
  renderTodos();
  renderTodayTasks();
  renderPlannedTasks();
  renderCalendar();
}

function saveTodoDetail() {
  // 这个函数现在只用于手动保存按钮，但实际不需要了
  autoSaveTodoDetail();
  hideTodoDetail();
}

// Default color palette for tasks
const TASK_COLORS = [
  '#4E85CE', // Blue
  '#6297B5', // Light Blue
  '#98B957', // Green
  '#F9AB00', // Orange
  '#D25252', // Red
  '#B576AD', // Purple
  '#6897BB', // Sky Blue
  '#A5C261', // Light Green
  '#FF6B6B', // Coral
  '#4ECDC4', // Turquoise
  '#95A5A6', // Gray
  '#F39C12'  // Dark Orange
];

// Default color for new tasks
const DEFAULT_TASK_COLOR = TASK_COLORS[0];

/**
 * 获取当前日历上所有任务使用的颜色集合
 * @returns {Set<string>} 已使用的颜色集合
 */
function getUsedColors() {
  const usedColors = new Set();
  
  // 获取所有有日期范围的任务（计划任务和打卡任务）
  const allTasksWithDates = [...planTodos, ...habitTodos].filter(t => 
    t.startDate && t.endDate && !t.completed && t.color
  );
  
  // 收集所有已使用的颜色
  allTasksWithDates.forEach(task => {
    if (task.color) {
      usedColors.add(task.color);
    }
  });
  
  return usedColors;
}

/**
 * 为新任务自动选择一个未使用的颜色
 * @param {string} [preferredColor] - 首选颜色（如果未使用）
 * @returns {string} 选择的颜色
 */
function getAvailableColor(preferredColor = null) {
  const usedColors = getUsedColors();
  
  // 如果提供了首选颜色且未被使用，优先使用
  if (preferredColor && !usedColors.has(preferredColor)) {
    return preferredColor;
  }
  
  // 从颜色全集中查找第一个未使用的颜色
  for (const color of TASK_COLORS) {
    if (!usedColors.has(color)) {
      return color;
    }
  }
  
  // 如果所有颜色都被使用，使用默认颜色（允许重复）
  return DEFAULT_TASK_COLOR;
}
// Category selector state
let categorySelectorVisible = false;
let pendingCategory = '';
let currentInputCategory = ''; // 当前输入框选中的归类

// Show category selector
function showCategorySelector() {
  if (categorySelectorVisible) return;
  
  const inputRect = todoInputEl.getBoundingClientRect();
  const selector = document.createElement('div');
  selector.id = 'categorySelector';
  selector.className = 'category-selector';
  
  // Create category options
  const optionsHtml = taskCategories.map(cat => 
    `<div class="category-option" data-category="${cat}">${cat}</div>`
  ).join('');
  
  selector.innerHTML = `
    <div class="category-selector-header">
      <span>选择任务归类</span>
      <button class="category-selector-close">&times;</button>
    </div>
    <div class="category-options">
      ${optionsHtml}
      <div class="category-option category-option-add">
        <span>+</span> 添加新归类
      </div>
    </div>
    <div class="category-selector-footer">
      <button class="category-selector-cancel">取消</button>
    </div>
  `;
  
  document.body.appendChild(selector);
  
  // Position selector below input
  selector.style.position = 'fixed';
  selector.style.top = `${inputRect.bottom + 5}px`;
  selector.style.left = `${inputRect.left}px`;
  selector.style.zIndex = '10000';
  
  categorySelectorVisible = true;
  
  // Add click handlers
  selector.querySelectorAll('.category-option:not(.category-option-add)').forEach(option => {
    option.addEventListener('click', (e) => {
      const category = e.currentTarget.dataset.category;
      selectCategory(category);
    });
  });
  
  // Add handler for add category option
  const addOption = selector.querySelector('.category-option-add');
  if (addOption) {
    addOption.addEventListener('click', () => {
      showAddCategoryInput();
    });
  }
  
  // Add handler for close button
  const closeBtn = selector.querySelector('.category-selector-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideCategorySelector();
    });
  }
  
  // Add handler for cancel button
  const cancelBtn = selector.querySelector('.category-selector-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideCategorySelector();
    });
  }
  
  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', handleCategorySelectorOutsideClick, true);
  }, 0);
}

function handleCategorySelectorOutsideClick(e) {
  const selector = document.getElementById('categorySelector');
  if (selector && !selector.contains(e.target) && e.target !== todoInputEl) {
    hideCategorySelector();
  }
}

function hideCategorySelector() {
  const selector = document.getElementById('categorySelector');
  if (selector) {
    selector.remove();
  }
  categorySelectorVisible = false;
  document.removeEventListener('click', handleCategorySelectorOutsideClick, true);
  
  // Clear pending category
  pendingCategory = '';
}

function selectCategory(category) {
  pendingCategory = category;
  hideCategorySelector();
  
  // Add the todo with the selected category
  addTodo(category);
}

// 显示添加归类输入框（自定义模态框）
function showAddCategoryInput() {
  // 创建已有归类列表HTML
  const existingCategoriesHtml = taskCategories.length > 0 ? `
    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 8px; font-size: 13px; color: var(--text-secondary); font-weight: 500;">已有归类：</label>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${taskCategories.map(cat => {
          const color = getCategoryColor(cat);
          return `<span class="category-preview-badge" style="background: ${hexToRgba(color, 0.1)}; border: 1px solid ${hexToRgba(color, 0.4)}; color: ${color}; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${cat}</span>`;
        }).join('')}
      </div>
    </div>
  ` : '';
  
  // 创建模态框
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.zIndex = '10001';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
      <div class="modal-header">
        <h3>添加新归类</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        ${existingCategoriesHtml}
        <div>
          <label for="newCategoryInput" style="display: block; margin-bottom: 8px; font-size: 13px; color: var(--text-secondary); font-weight: 500;">新归类名称：</label>
          <input type="text" id="newCategoryInput" class="detail-input" placeholder="请输入归类名称" style="width: 100%;" autofocus>
        </div>
        <p id="categoryError" style="color: #ff6b6b; font-size: 12px; margin-top: 8px; display: none;"></p>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="cancelAddCategory">取消</button>
        <button class="btn-primary" id="confirmAddCategory">确定</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const inputEl = modal.querySelector('#newCategoryInput');
  const errorEl = modal.querySelector('#categoryError');
  const confirmBtn = modal.querySelector('#confirmAddCategory');
  const cancelBtn = modal.querySelector('#cancelAddCategory');
  const closeBtn = modal.querySelector('.modal-close');
  
  const closeModal = () => {
    if (modal && modal.parentNode === document.body) {
      document.body.removeChild(modal);
    }
  };
  
  const handleConfirm = () => {
    const categoryName = inputEl.value.trim();
    if (!categoryName) {
      errorEl.textContent = '归类名称不能为空';
      errorEl.style.display = 'block';
      return;
    }
    
    if (addTaskCategory(categoryName)) {
      // 如果当前没有选中归类，自动选中新添加的归类
      if (!currentInputCategory) {
        currentInputCategory = categoryName;
        updateCategoryHint();
      }
      closeModal();
    } else {
      errorEl.textContent = '归类已存在或名称无效';
      errorEl.style.display = 'block';
    }
  };
  
  // 事件监听
  confirmBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  
  // 点击背景关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // ESC 键关闭
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
  
  // Enter 键确认
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  });
  
  // 聚焦输入框
  setTimeout(() => {
    inputEl.focus();
  }, 100);
}

if (todoInputEl) {
  todoInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      if (categorySelectorVisible) {
        // If selector is visible, don't add todo on Enter
        return;
      }
      addTodo();
    }
  });
  
  todoInputEl.addEventListener('keydown', (e) => {
    console.log('keydown事件触发:', {
      key: e.key,
      code: e.code,
      keyCode: e.keyCode,
      target: e.target,
      isInput: e.target === todoInputEl
    });
    
    if (e.key === 'Tab') {
      console.log('检测到Tab键，准备切换归类');
      e.preventDefault();
      e.stopPropagation();
      // 直接切换归类，不需要输入内容
      console.log('当前归类:', currentInputCategory);
      console.log('可用归类:', taskCategories);
      cycleToNextCategory();
      console.log('切换后归类:', currentInputCategory);
    }
  });
  
  // 检测输入框中的"tab"文本
  todoInputEl.addEventListener('input', (e) => {
    const value = todoInputEl.value.toLowerCase();
    
    // 检测是否输入了"tab"
    if (value.includes('tab')) {
      // 找到"tab"的位置
      const tabIndex = value.indexOf('tab');
      const beforeTab = todoInputEl.value.substring(0, tabIndex);
      const afterTab = todoInputEl.value.substring(tabIndex + 3);
      
      // 移除"tab"文本
      todoInputEl.value = beforeTab + afterTab;
      
      // 切换归类
      cycleToNextCategory();
      
      // 恢复光标位置
      const newCursorPos = beforeTab.length;
      setTimeout(() => {
        todoInputEl.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  });
}

// 等待DOM加载完成后再绑定事件
function initCategoryInputHandlers() {
  // 添加+按钮点击事件
  const addCategoryBtn = document.querySelector('.todo-category-add-btn');
  if (addCategoryBtn) {
    // 移除旧的事件监听器（如果存在）
    const newBtn = addCategoryBtn.cloneNode(true);
    addCategoryBtn.parentNode.replaceChild(newBtn, addCategoryBtn);
    
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showAddCategoryInput();
    });
  }
  
  // 添加类别提示的悬停效果
  const categoryHint = document.getElementById('todoCategoryHint');
  if (categoryHint) {
    // 保存原始文本
    let originalText = categoryHint.textContent;
    
    categoryHint.addEventListener('mouseenter', () => {
      originalText = categoryHint.textContent;
      categoryHint.textContent = '?';
      categoryHint.style.cursor = 'help';
      categoryHint.title = '任务归类可以帮助您对任务进行分类管理。在统计时，您可以选择只查看某个归类的任务。按Tab键可以快速切换归类，点击+号可以添加新归类。';
    });
    
    categoryHint.addEventListener('mouseleave', () => {
      updateCategoryHint();
      categoryHint.style.cursor = 'default';
      categoryHint.title = '按Tab键切换任务归类';
    });
  }
  
  // 初始化归类提示显示
  updateCategoryHint();
}

// 已完成分区已移除，不再需要相关事件监听器

if (calTodayBtn) {
  calTodayBtn.addEventListener('click', () => {
    currentDate = new Date();
    renderCalendar();
  });
}

// Calendar functionality
let currentDate = new Date();

// Date selection state
let dateSelectionState = {
  active: false,
  step: 'start', // 'start' or 'end'
  todoIndex: -1,
  todoId: null, // Store todo ID for verification
  todoState: 'pending',
  startDate: null,
  endDate: null
};

const dateSelectionHintEl = $('#dateSelectionHint');

function updateDateSelectionHint() {
  if (!dateSelectionHintEl) return;
  
  if (!dateSelectionState.active) {
    dateSelectionHintEl.style.display = 'none';
    return;
  }
  
  dateSelectionHintEl.style.display = 'block';
  
  if (dateSelectionState.step === 'start') {
    dateSelectionHintEl.textContent = '📅 请选择开始日期';
  } else if (dateSelectionState.step === 'end') {
    if (dateSelectionState.startDate) {
    const startDateStr = dateSelectionState.startDate.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric'
    });
    dateSelectionHintEl.textContent = `✅ 开始日期: ${startDateStr}，请选择结束日期`;
    } else {
      // 如果没有开始日期，提示用户先选择开始日期
      dateSelectionHintEl.textContent = '📅 请先选择开始日期';
    }
  }
}

function startDateSelection(todoIndex, state) {
  // Store the actual todo for reference
  let targetArray;
  if (state === 'processing') {
    targetArray = processingTodos;
  } else if (state === 'today') {
    targetArray = todos;
  } else if (state === 'plan') {
    targetArray = planTodos;
  } else if (state === 'habit') {
    targetArray = habitTodos;
  } else {
    targetArray = todos; // 默认使用 todos
  }
  
  if (todoIndex < 0 || todoIndex >= targetArray.length) {
    console.error('Invalid todo index:', todoIndex, 'Array length:', targetArray.length);
    return;
  }
  
  const todo = targetArray[todoIndex];
  
  // 已完成且没有日期范围的今日任务不支持规划日期
  if (todo.completed && !todo.startDate && !todo.endDate) {
    if (statusEl) {
      statusEl.textContent = '⚠️ 已完成的任务不支持规划日期';
      setTimeout(() => {
        if (statusEl) statusEl.textContent = '';
      }, 2000);
    }
    return;
  }
  
  // Toggle selection mode if already active for this todo
  if (dateSelectionState.active && dateSelectionState.todoId === todo.id) {
    stopDateSelection();
    // 显示退出提示
    if (statusEl) {
      statusEl.textContent = '已退出日期选择模式';
      setTimeout(() => {
        if (statusEl) statusEl.textContent = '';
      }, 2000);
    }
    return;
  }
  
  // 如果任务已有日期范围，初始化日期选择状态为已有日期
  let initialStartDate = null;
  let initialEndDate = null;
  let initialStep = 'start';
  
  if (todo.startDate && todo.endDate) {
    // 已有日期范围，从选择开始日期开始，但可以修改
    initialStartDate = new Date(todo.startDate);
    initialEndDate = new Date(todo.endDate);
    initialStep = 'start'; // 从重新选择开始日期开始
  }
  
  dateSelectionState = {
    active: true,
    step: initialStep,
    todoIndex,
    todoState: state,
    todoId: todo.id, // Store ID for verification
    startDate: initialStartDate,
    endDate: initialEndDate
  };
  
  // 显示进入选择模式提示
  if (statusEl) {
    if (initialStartDate && initialEndDate) {
      statusEl.textContent = '✏️ 修改执行周期：请重新选择开始日期';
    } else {
    statusEl.textContent = '📅 已进入日期选择模式，请点击日历选择开始日期';
    }
    setTimeout(() => {
      if (statusEl && dateSelectionState.active) statusEl.textContent = '';
    }, 3000);
  }
  

  // 高亮日历按钮
  let listEl;
  if (state === 'processing') {
    listEl = todoListEl;
  } else if (state === 'todo') {
    listEl = todoListEl;
  } else if (state === 'plan') {
    listEl = todoPlannedListEl;
  } else if (state === 'habit') {
    listEl = todoPlannedListEl; // 打卡任务也显示在计划任务列表中
  } else {
    listEl = todoListEl;
  }
  
  if (listEl) {
    const items = Array.from(listEl.querySelectorAll('.todo-item'));
    items.forEach((item) => {
      const btn = item.querySelector('.todo-calendar-btn');
      if (btn) {
        btn.classList.remove('active');
        if (btn.dataset.todoId === String(todo.id)) {
          btn.classList.add('active');
            btn.style.opacity = '1';
        }
      }
    });
  }
  
  // Add selection mode class to calendar
  if (calGridEl) {
    calGridEl.classList.add('date-selection-mode');
  }
  
  // Add class to body for global cursor style
  document.body.classList.add('date-selection-active');
  
  // 如果有初始日期，导航到开始日期所在月份
  if (initialStartDate) {
    currentDate = new Date(initialStartDate);
  } else {
  currentDate = new Date();
  }
  
  updateDateSelectionHint();
  renderCalendar();
}

function stopDateSelection() {
  if (dateSelectionState.active) {
    const wasActive = dateSelectionState.active;
    dateSelectionState = { 
      active: false, 
      step: 'start',
      todoIndex: -1, 
      todoId: null,
      todoState: 'pending', 
      startDate: null, 
      endDate: null 
    };
    if (calGridEl) {
      calGridEl.classList.remove('date-selection-mode');
    }
    // Remove body class
    document.body.classList.remove('date-selection-active');
    // Remove active class from all buttons and restore opacity
    document.querySelectorAll('.todo-calendar-btn').forEach(btn => {
      btn.classList.remove('active');
      // Restore opacity for unplanned tasks
      if (!btn.classList.contains('has-date')) {
        btn.style.opacity = '';
      }
    });
    // Clear all selection styling and preview
    document.querySelectorAll('.cal-cell').forEach(cell => {
      cell.classList.remove('selecting', 'range-start', 'range-end', 'in-range', 'selected-start', 'selected-end', 'selecting-end', 'preview-range-start', 'preview-range-end', 'preview-in-range');
    });
    updateDateSelectionHint();
    
    // 如果不是在applyDateRange中调用的（即手动退出），显示提示
    if (wasActive && !dateSelectionState.active && statusEl && statusEl.textContent.indexOf('已设置执行周期') === -1) {
      statusEl.textContent = '已退出日期选择模式';
      setTimeout(() => {
        if (statusEl) statusEl.textContent = '';
      }, 2000);
    }
  }
}

function selectDate(dateMid) {
  if (!dateSelectionState.active) return;
  
  if (dateSelectionState.step === 'start') {
    dateSelectionState.startDate = new Date(dateMid); // Create a new Date object
    dateSelectionState.step = 'end';
    updateDateSelectionHint();
    
    // Clear any preview
    clearDateRangePreview();
    
    // Re-render calendar to show selected start date and add mouse events
    renderCalendar();
  } else if (dateSelectionState.step === 'end') {
    dateSelectionState.endDate = new Date(dateMid); // Create a new Date object
    // Clear preview before applying
    clearDateRangePreview();
    applyDateRange();
  }
}

function applyDateRange() {
  if (!dateSelectionState.active || !dateSelectionState.startDate || !dateSelectionState.endDate) {
    console.error('Cannot apply date range:', dateSelectionState);
    return;
  }
  
  // Ensure startDate <= endDate
  let startDate = new Date(dateSelectionState.startDate);
  let endDate = new Date(dateSelectionState.endDate);
  if (startDate.getTime() > endDate.getTime()) {
    [startDate, endDate] = [endDate, startDate];
  }
  
  let targetArray;
  if (dateSelectionState.todoState === 'processing') {
    targetArray = processingTodos;
  } else if (dateSelectionState.todoState === 'todo' || dateSelectionState.todoState === 'today') {
    targetArray = todos;
  } else if (dateSelectionState.todoState === 'plan') {
    targetArray = planTodos;
  } else if (dateSelectionState.todoState === 'habit') {
    targetArray = habitTodos;
  } else {
    // 默认从 todos 查找
    targetArray = todos;
  }
  
  // Find todo by ID if available, otherwise use index
  let todo = null;
  if (dateSelectionState.todoId) {
    // 尝试从所有可能的数组中查找（因为任务可能在移动过程中）
    todo = targetArray.find(t => t.id === dateSelectionState.todoId);
    if (!todo) {
      todo = todos.find(t => t.id === dateSelectionState.todoId);
    }
    if (!todo) {
      todo = processingTodos.find(t => t.id === dateSelectionState.todoId);
    }
    if (!todo) {
      todo = planTodos.find(t => t.id === dateSelectionState.todoId);
    }
    if (!todo) {
      todo = habitTodos.find(t => t.id === dateSelectionState.todoId);
    }
  }
  
  if (!todo && dateSelectionState.todoIndex >= 0 && dateSelectionState.todoIndex < targetArray.length) {
    todo = targetArray[dateSelectionState.todoIndex];
  }
  
  if (!todo) {
    // 如果通过索引找不到，尝试从所有数组中通过ID查找
    if (dateSelectionState.todoId) {
      todo = [...todos, ...processingTodos, ...planTodos, ...habitTodos].find(t => t.id === dateSelectionState.todoId);
    }
  }
  
  if (todo) {
    // 确保日期值被正确设置
    todo.startDate = startDate.toISOString();
    todo.endDate = endDate.toISOString();
    
    // 如果任务还没有颜色，或者是从待办任务转换来的（需要重新分配颜色），自动分配一个未使用的颜色
    // 注意：如果是从 plan 或 habit 状态修改日期，保留原有颜色；如果是新转换的任务，使用新颜色
    if (!todo.color || (dateSelectionState.todoState === 'todo' || dateSelectionState.todoState === 'today')) {
      todo.color = getAvailableColor();
    }
    
    // 如果任务还没有 plan_type，默认为 'normal'
    if (!todo.plan_type && todo.taskType === undefined) {
      todo.plan_type = 'normal';
    }
    
    // 根据 plan_type 将任务移动到正确的数组
    const planType = todo.plan_type || 'normal';
    
    // 如果是从 plan 或 habit 状态修改日期，只需要更新日期，不需要移动数组
    if (dateSelectionState.todoState === 'plan' || dateSelectionState.todoState === 'habit') {
      // 修改现有计划任务的日期，保持在原数组，只更新日期
      // 不需要移动任务，任务已经在正确的数组中了
    } else {
      // 新转换的任务，需要从原数组移除并添加到目标数组
      const sourceArrays = [todos, processingTodos, planTodos, habitTodos];
      sourceArrays.forEach(array => {
        const index = array.findIndex(t => t.id === todo.id);
        if (index >= 0) {
          array.splice(index, 1);
        }
      });
      
      // 添加到目标数组
      if (planType === 'checkin') {
        habitTodos.push(todo);
      } else {
        planTodos.push(todo);
      }
    }
    
    // 验证日期值是否被正确设置
    if (!todo.startDate || !todo.endDate || 
        String(todo.startDate).trim() === '' || 
        String(todo.endDate).trim() === '') {
      console.error('Failed to set date range:', {
        id: todo.id,
        startDate: todo.startDate,
        endDate: todo.endDate
      });
    }
    
    saveTodos();
    
    // Show success message
    if (statusEl) {
      const startStr = startDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
      const endStr = endDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
      statusEl.textContent = `已设置执行周期: ${startStr} - ${endStr}`;
      setTimeout(() => {
        if (statusEl) statusEl.textContent = '';
      }, 3000);
    }
  
  // 确保日历视图模式为横栏模式，如果当前是统计模式，切换到横栏模式以显示横栏
  if (calendarViewMode === 'counts') {
    calendarViewMode = 'bars';
    localStorage.setItem('calendarViewMode', 'bars');
    // 更新切换按钮UI
    const toggleBtn = document.getElementById('toggleCalView');
    const iconEl = document.getElementById('calViewIcon');
    const textEl = document.getElementById('calViewText');
    if (toggleBtn) toggleBtn.classList.add('active');
    if (iconEl) iconEl.innerHTML = '<i class="fas fa-chart-bar"></i>';
    if (textEl) textEl.textContent = '横栏';
  }
  
    // 导航到任务的开始日期所在月份，确保横栏可见
    const taskStartYear = startDate.getFullYear();
    const taskStartMonth = startDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // 如果任务的开始日期不在当前显示的月份，导航到任务的开始日期
    if (taskStartYear !== currentYear || taskStartMonth !== currentMonth) {
      currentDate = new Date(taskStartYear, taskStartMonth, 1);
    }
    
    // Exit selection mode FIRST, then re-render
    stopDateSelection();
    
    // 验证任务对象确实有日期值
    addDebugLog('Task after setting dates', {
      id: todo.id,
      title: todo.title,
      startDate: todo.startDate,
      endDate: todo.endDate,
      hasStartDate: !!(todo.startDate && String(todo.startDate).trim() !== ''),
      hasEndDate: !!(todo.endDate && String(todo.endDate).trim() !== ''),
      hasDateRange: !!(todo.startDate && todo.endDate && String(todo.startDate).trim() !== '' && String(todo.endDate).trim() !== '')
    });
    
    // 强制同步：确保任务对象在数组中的引用也被更新（虽然已经在上面移动到新数组了）
    const taskInToday = todos.find(t => t.id === todo.id);
    const taskInPlan = planTodos.find(t => t.id === todo.id);
    const taskInHabit = habitTodos.find(t => t.id === todo.id);
    const taskInProcessing = processingTodos.find(t => t.id === todo.id);
    
    // 更新所有找到的任务（虽然理论上不应该有重复）
    [taskInToday, taskInPlan, taskInHabit, taskInProcessing].forEach(task => {
      if (task && task !== todo) {
        task.startDate = todo.startDate;
        task.endDate = todo.endDate;
        if (todo.plan_type !== undefined) {
          task.plan_type = todo.plan_type;
        }
        if (todo.finish_data !== undefined) {
          task.finish_data = todo.finish_data;
        }
      }
    });
    
    // 强制刷新所有任务列表：先清空DOM，再重新渲染
    if (todoListEl) {
      todoListEl.innerHTML = '';
    }
    if (todoPlannedListEl) {
      todoPlannedListEl.innerHTML = '';
    }
    
    // 立即刷新所有列表
    renderTodos();
    renderTodayTasks();
    renderPlannedTasks();
  renderCalendar();
  
    // 延迟再次刷新确保同步（处理可能的 DOM 更新延迟）
    setTimeout(() => {
      renderTodos();
      renderTodayTasks();
      renderPlannedTasks();
      renderCalendar();
    }, 100);
    
    addDebugLog('After applying date range', {
    id: todo.id,
    title: todo.title,
    startDate: todo.startDate,
    endDate: todo.endDate,
    hasDateRange: !!(todo.startDate && todo.endDate)
    });
  } else {
    addDebugLog('Todo not found when applying date range', {
      todoState: dateSelectionState.todoState,
      todoId: dateSelectionState.todoId,
      todoIndex: dateSelectionState.todoIndex
    });
    console.error('Todo not found:', dateSelectionState);
    if (statusEl) {
      statusEl.textContent = '错误：找不到任务';
    }
    // Exit selection mode even if todo not found
    stopDateSelection();
  }
}

function renderCalendar() {
  if (!calTitleEl || !calGridEl) return;
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  calTitleEl.textContent = `${year}年${month + 1}月`;
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  calGridEl.innerHTML = '';
  
  // Add calendar days (weekday headers are in HTML now)
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    
    if (date.getMonth() === month) {
      cell.classList.add('current-month');
    }
    
    // Check if this is today
    const today = getToday();
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateMid = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (dateMid.getTime() === todayMid.getTime()) {
      cell.classList.add('today');
    }

    // Build counts and content
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayTodos = getTodosForDate(dateStr);

    const pendingCount = dayTodos.filter(t => !t.completed && !t.processing).length;
    const processingCount = dayTodos.filter(t => t.processing && !t.completed).length;
    const completedCount = dayTodos.filter(t => t.completed).length;
    const isPast = dateMid.getTime() < todayMid.getTime();
    const overdueCount = isPast ? (pendingCount + processingCount) : 0;

    let countsHtml = '';
    if (calendarViewMode === 'counts') {
      // Show counts mode
      if (pendingCount > 0) countsHtml += `<span class="badge badge-pending" title="待办">${pendingCount}</span>`;
      if (processingCount > 0) countsHtml += `<span class="badge badge-processing" title="进行中">${processingCount}</span>`;
      if (completedCount > 0) countsHtml += `<span class="badge badge-completed" title="已完成">${completedCount}</span>`;
      if (overdueCount > 0) countsHtml += `<span class="badge badge-overdue" title="逾期">${overdueCount}</span>`;
    }
    // Bars mode: counts will be hidden, bars will be rendered separately

    const tooltipParts = [];
    if (pendingCount) tooltipParts.push(`待办 ${pendingCount}`);
    if (processingCount) tooltipParts.push(`进行中 ${processingCount}`);
    if (completedCount) tooltipParts.push(`已完成 ${completedCount}`);
    if (overdueCount) tooltipParts.push(`逾期 ${overdueCount}`);

    cell.innerHTML = `<div class="day">${date.getDate()}</div>${countsHtml ? `<div class=\"counts\">${countsHtml}</div>` : ''}<div class="cal-task-bars"></div>`;
    
    // Store view mode in cell for reference
    cell.dataset.viewMode = calendarViewMode;

    if (dayTodos.length > 0) {
      cell.classList.add('has-todos');
      if (tooltipParts.length > 0) {
        cell.title = tooltipParts.join(' / ');
      }
    }

    // Store date info on cell
    cell.dataset.date = dateStr;
    cell.dataset.dateObj = dateMid.getTime();
    cell.dataset.cellIndex = i; // Store cell index for bar rendering
    
    // Store the date mid for later use
    cell._dateMid = dateMid;
    
    // Add click event - handle date selection or normal click
    cell.addEventListener('click', (e) => {
      if (dateSelectionState.active) {
        e.stopPropagation();
        selectDate(dateMid);
      } else {
        showTodosForDate(dateStr, dayTodos);
      }
    });
    
    // Add mouseenter for range preview when selecting end date
    if (dateSelectionState.active && dateSelectionState.step === 'end' && dateSelectionState.startDate) {
      cell.addEventListener('mouseenter', () => {
        updateDateRangePreview(dateMid);
      });
      
      cell.addEventListener('mouseleave', () => {
        // Clear preview when mouse leaves
        clearDateRangePreview();
      });
    }
    
    // Highlight selected start date if in selection mode
    if (dateSelectionState.active && dateSelectionState.startDate) {
      const startTime = dateSelectionState.startDate.getTime();
      const cellTime = dateMid.getTime();
      if (cellTime === startTime) {
        cell.classList.add('selected-start');
      }
    }
    
    calGridEl.appendChild(cell);
  }
  
  // Update hint after rendering
  updateDateSelectionHint();
  
  // Render task bars only if in bars mode
  if (calendarViewMode === 'bars') {
    renderTaskBars();
  }
}

function clearDateRangePreview() {
  document.querySelectorAll('.cal-cell').forEach(cell => {
    cell.classList.remove('preview-range-start', 'preview-range-end', 'preview-in-range');
  });
}

function updateDateRangePreview(hoverDateMid) {
  if (!dateSelectionState.active || dateSelectionState.step !== 'end' || !dateSelectionState.startDate) {
    return;
  }
  
  const startTime = dateSelectionState.startDate.getTime();
  const hoverTime = hoverDateMid.getTime();
  const minTime = Math.min(startTime, hoverTime);
  const maxTime = Math.max(startTime, hoverTime);
  
  // Clear all preview classes first
  clearDateRangePreview();
  
  // Add preview classes
  document.querySelectorAll('.cal-cell').forEach(cell => {
    const cellTime = parseInt(cell.dataset.dateObj);
    if (cellTime >= minTime && cellTime <= maxTime) {
      if (cellTime === minTime) {
        cell.classList.add('preview-range-start');
      } else if (cellTime === maxTime) {
        cell.classList.add('preview-range-end');
      } else {
        cell.classList.add('preview-in-range');
      }
    }
  });
}


// Helper function to adjust color with opacity while keeping the original color
function desaturateColor(color, saturation = 0.9, opacity = 0.75) {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Simple approach: mix with white/light gray to reduce saturation slightly
  // Calculate the amount to mix (1 - saturation means more white)
  const mixAmount = 1 - saturation;
  
  // Mix with white (255, 255, 255) for light colors, or light gray for darker
  const mixR = 255;
  const mixG = 255;
  const mixB = 255;
  
  // Mix the colors
  const rNew = Math.round(r * saturation + mixR * mixAmount);
  const gNew = Math.round(g * saturation + mixG * mixAmount);
  const bNew = Math.round(b * saturation + mixB * mixAmount);
  
  return `rgba(${rNew}, ${gNew}, ${bNew}, ${opacity})`;
}

function renderTaskBars() {
  if (!calGridEl || calendarViewMode !== 'bars') return;
  
  // Remove existing bars
  calGridEl.querySelectorAll('.task-bar').forEach(bar => bar.remove());
  
  // Get all tasks with date ranges (excluding completed)
  const allTasks = [...planTodos, ...habitTodos].filter(t => 
    t.startDate && t.endDate && !t.completed
  );
  
  if (allTasks.length === 0) return;
  
  // Use requestAnimationFrame with double call to ensure layout is complete
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const cells = Array.from(calGridEl.querySelectorAll('.cal-cell'));
      if (cells.length === 0) return;
      
      // Group tasks by their visual row (to avoid overlapping)
      const taskRows = [];
      
      allTasks.forEach(task => {
        const startDate = new Date(task.startDate);
        const endDate = new Date(task.endDate);
        
        // Find which cells this task spans
        const taskCells = [];
        cells.forEach((cell, idx) => {
          const cellDateObj = parseInt(cell.dataset.dateObj);
          if (!cellDateObj) return;
          
          const cellDateMid = new Date(cellDateObj);
          const startMid = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const endMid = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          
          if (cellDateMid.getTime() >= startMid.getTime() && cellDateMid.getTime() <= endMid.getTime()) {
            taskCells.push({ cell, idx });
          }
        });
        
        if (taskCells.length > 0) {
          // Find an available row
          let rowIndex = 0;
          while (taskRows[rowIndex] && taskRows[rowIndex].some(existingTask => {
            const existingCells = existingTask.cells.map(c => c.idx);
            return taskCells.some(tc => existingCells.includes(tc.idx));
          })) {
            rowIndex++;
          }
          
          if (!taskRows[rowIndex]) {
            taskRows[rowIndex] = [];
          }
          
          taskRows[rowIndex].push({
            task,
            cells: taskCells,
            color: task.color || DEFAULT_TASK_COLOR  // 确保使用task.color
          });
        }
      });
      
      // Render bars inside each cell
      const barHeight = 10;
      const barSpacing = 12;
      
      // Calculate date area height for a cell (helper function)
      const getDateAreaHeight = (cell) => {
        const dayElement = cell.querySelector('.day');
        const countsElement = cell.querySelector('.counts');
        return dayElement ? dayElement.getBoundingClientRect().height + 
                          (countsElement ? countsElement.getBoundingClientRect().height : 0) + 8 : 40;
      };
      
      // Calculate max available height for bars in a cell
      const getCellAvailableHeight = (cell) => {
        const cellRect = cell.getBoundingClientRect();
        const dateAreaHeight = getDateAreaHeight(cell);
        return cellRect.height - dateAreaHeight - 8; // Leave some padding
      };
      
      // First, find the maximum row index across all cells
      const maxRowIndex = taskRows.length > 0 ? taskRows.length - 1 : 0;
      
      // Calculate unified spacing: check all cells to find the minimum available height
      // and determine if we need to overlap globally
      let minAvailableHeight = Infinity;
      let maxDateAreaHeight = 0;
      
      cells.forEach(cell => {
        const availableHeight = getCellAvailableHeight(cell);
        const dateAreaHeight = getDateAreaHeight(cell);
        minAvailableHeight = Math.min(minAvailableHeight, availableHeight);
        maxDateAreaHeight = Math.max(maxDateAreaHeight, dateAreaHeight);
      });
      
      // Calculate required height if we use normal spacing
      const requiredHeight = (maxRowIndex + 1) * barSpacing + barHeight;
      
      // Determine if we need to overlap globally or can use normal spacing
      const needsOverlap = requiredHeight > minAvailableHeight;
      const unifiedSpacing = needsOverlap ? Math.max(1, Math.floor((minAvailableHeight - barHeight) / (maxRowIndex + 1))) : barSpacing;
      
      // Use unified date area height for consistent positioning across all cells
      const unifiedDateAreaHeight = maxDateAreaHeight;
      
      // Group bars by cell for rendering
      const barsByCell = new Map();
      
      taskRows.forEach((row, rowIndex) => {
        row.forEach(({ task, cells, color }) => {
          if (cells.length === 0) return;
          
          cells.forEach(({ cell }, cellIndex) => {
            if (!barsByCell.has(cell)) {
              barsByCell.set(cell, []);
            }
            barsByCell.get(cell).push({
              task,
              rowIndex,
              cellIndex,
              cells,
              color
            });
          });
        });
      });
      
      // Render bars for each cell using unified positioning
      barsByCell.forEach((bars, cell) => {
        bars.forEach(({ task, rowIndex, cellIndex, cells, color }) => {
          // 使用task.color，如果color参数不存在则使用task.color
          const taskColor = color || task.color || DEFAULT_TASK_COLOR;
          // Keep color vibrant and visible - simple color mixing
          const desaturatedColor = desaturateColor(taskColor, 0.6, 0.6);
          
          // Calculate position using unified date area height and spacing
          // This ensures all bars at the same rowIndex have the same top position across cells
          const top = unifiedDateAreaHeight + 4 + rowIndex * unifiedSpacing;
          
          // Create bar element for this cell - make it continuous
          const bar = document.createElement('div');
          bar.className = 'task-bar';
          bar.style.backgroundColor = desaturatedColor;
          bar.style.top = `${top}px`;
          bar.style.left = cellIndex === 0 ? '4px' : '0px'; // No gap on left for continuity
          bar.style.right = cellIndex === cells.length - 1 ? '4px' : '0px'; // No gap on right for continuity
          bar.style.height = `${barHeight}px`;
          bar.style.borderRadius = cellIndex === 0 ? '2px 0 0 2px' : (cellIndex === cells.length - 1 ? '0 2px 2px 0' : '0');
          bar.title = task.title;
          bar.dataset.taskId = task.id;
          bar.style.position = 'absolute';
          
          // Add task title text only on first cell
          if (cellIndex === 0) {
            const titleSpan = document.createElement('span');
            titleSpan.className = 'task-bar-title';
            titleSpan.textContent = task.title;
            bar.appendChild(titleSpan);
          }
          
          // For checkin tasks, add checkmark on checked-in dates
          const planType = getPlanType(task);
          const finishData = getFinishData(task);
          if (planType === 'checkin' && finishData && finishData.length > 0) {
            const cellDateObj = parseInt(cell.dataset.dateObj);
            if (cellDateObj) {
              const cellDateMid = new Date(cellDateObj);
              const cellDateStr = `${cellDateMid.getFullYear()}-${String(cellDateMid.getMonth() + 1).padStart(2, '0')}-${String(cellDateMid.getDate()).padStart(2, '0')}`;
              
              if (finishData.includes(cellDateStr)) {
                // Add checkmark indicator
                const checkmark = document.createElement('span');
                checkmark.className = 'task-bar-checkmark';
                checkmark.textContent = '✓';
                checkmark.style.position = 'absolute';
                checkmark.style.right = '4px';
                checkmark.style.top = '50%';
                checkmark.style.transform = 'translateY(-50%)';
                checkmark.style.fontSize = '12px';
                checkmark.style.fontWeight = 'bold';
                checkmark.style.color = '#fff';
                checkmark.style.textShadow = '0 0 2px rgba(0,0,0,0.5)';
                checkmark.style.pointerEvents = 'none';
                bar.appendChild(checkmark);
              }
            }
          }
          
          // Add click handler
          bar.addEventListener('click', (e) => {
            e.stopPropagation();
            // Find the task and show its detail
            const location = findTaskLocation(task.id);
            if (location) {
              showTodoDetail(task, location.index, location.state);
            }
          });
          
          cell.appendChild(bar);
        });
      });
    });
  });
}

function getTodosForDate(dateStr) {
  const allTodos = [...todos, ...planTodos, ...habitTodos, ...processingTodos, ...completedTodos];
  return allTodos.filter(todo => {
    // Check if this date falls within the task's date range
    if (todo.startDate && todo.endDate) {
      const startDate = new Date(todo.startDate);
      const endDate = new Date(todo.endDate);
      const checkDate = new Date(dateStr);
      
      const startMid = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endMid = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const checkMid = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      
      if (checkMid.getTime() >= startMid.getTime() && checkMid.getTime() <= endMid.getTime()) {
        return true;
      }
    }
    
    // Fallback to creation date matching
    const todoDate = new Date(todo.createdAt);
    const localDateStr = `${todoDate.getFullYear()}-${String(todoDate.getMonth() + 1).padStart(2, '0')}-${String(todoDate.getDate()).padStart(2, '0')}`;
    return localDateStr === dateStr;
  }).map(todo => {
    // 确保各个数组中的任务有正确的状态
    if (completedTodos.includes(todo)) {
      return { ...todo, completed: true, processing: false };
    } else if (processingTodos.includes(todo)) {
      return { ...todo, completed: false, processing: true };
    }
    return { ...todo, completed: false, processing: false };
  });
}

function showTodosForDate(dateStr, dayTodos) {
  // 直接使用传入的日期字符串，避免时区转换问题
  const [year, month, day] = dateStr.split('-');
  const dateFormatted = `${year}年${parseInt(month)}月${parseInt(day)}日`;
  
  // Separate todos by status
  const pendingTodos = dayTodos.filter(todo => !todo.completed && !todo.processing);
  const processingTodos = dayTodos.filter(todo => !todo.completed && todo.processing);
  const completedTodos = dayTodos.filter(todo => todo.completed);
  
  // Helper function to format date range
  const formatDateRange = (todo) => {
    if (!todo.startDate || !todo.endDate) return '无计划时间';
    try {
      const start = new Date(todo.startDate);
      const end = new Date(todo.endDate);
      const startStr = `${start.getMonth() + 1}月${start.getDate()}日`;
      const endStr = `${end.getMonth() + 1}月${end.getDate()}日`;
      return `${startStr} - ${endStr}`;
    } catch (e) {
      return '无计划时间';
    }
  };
  
  // Helper function to get task type
  const getTaskType = (todo) => {
    const planType = getPlanType(todo);
    if (planType === 'checkin') {
      return '打卡任务';
    } else if (todo.startDate && todo.endDate) {
      return '计划任务';
    } else {
      return '今日任务';
    }
  };
  
  // Helper function to get checkin count
  const getCheckinCount = (todo) => {
    const finishData = getFinishData(todo);
    return finishData ? finishData.length : 0;
  };
  
  // Helper function to render task item
  const renderTaskItem = (todo) => {
    const taskType = getTaskType(todo);
    const dateRange = formatDateRange(todo);
    const checkinCount = getCheckinCount(todo);
    const statusClass = todo.completed ? 'completed' : (todo.processing ? 'processing' : 'pending');
    const statusText = todo.completed ? '已完成' : (todo.processing ? '进行中' : '待办');
    
    let checkinInfo = '';
    if (taskType === '打卡任务') {
      checkinInfo = `<div class="task-info-row">
        <span class="task-info-label">打卡天数：</span>
        <span class="task-info-value">${checkinCount} 天</span>
      </div>`;
    }
    
    return `
      <div class="modal-todo-item ${statusClass}">
        <div class="task-title-row">
          <span class="task-title">${todo.title}</span>
          <span class="task-status ${statusClass}">${statusText}</span>
        </div>
        <div class="task-info">
          <div class="task-info-row">
            <span class="task-info-label">任务类型：</span>
            <span class="task-info-value">${taskType}</span>
          </div>
          ${taskType !== '今日任务' ? `
            <div class="task-info-row">
              <span class="task-info-label">计划时间：</span>
              <span class="task-info-value">${dateRange}</span>
            </div>
          ` : ''}
          ${checkinInfo}
        </div>
      </div>
    `;
  };
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content task-modal-content">
      <div class="modal-header">
        <h3>${dateFormatted} 的任务</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        ${dayTodos.length === 0 ? '<p style="text-align: center; color: #666; padding: 20px;">这一天没有任务</p>' : ''}
        
        ${pendingTodos.length > 0 ? `
          <div class="task-group">
            <h4 class="task-group-title">待办任务 (${pendingTodos.length})</h4>
            <div class="task-list">
              ${pendingTodos.map(renderTaskItem).join('')}
              </div>
          </div>
        ` : ''}
        
        ${processingTodos.length > 0 ? `
          <div class="task-group">
            <h4 class="task-group-title processing">进行中的任务 (${processingTodos.length})</h4>
            <div class="task-list">
              ${processingTodos.map(renderTaskItem).join('')}
              </div>
          </div>
        ` : ''}
        
        ${completedTodos.length > 0 ? `
          <div class="task-group">
            <h4 class="task-group-title completed">已完成的任务 (${completedTodos.length})</h4>
            <div class="task-list">
              ${completedTodos.map(renderTaskItem).join('')}
              </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal handlers
  const closeBtn = modal.querySelector('.modal-close');
  const closeModal = () => {
    if (modal && modal.parentNode === document.body) {
    document.body.removeChild(modal);
    }
  };
  
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // ESC key handler
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

// 显示任务统计
async function showTaskStatistics(selectedCategory = '') {
  // 获取所有任务数据
  let allTasks = [...todos, ...planTodos, ...habitTodos, ...processingTodos, ...completedTodos];
  
  // 如果选择了归类，筛选任务
  if (selectedCategory) {
    allTasks = allTasks.filter(t => t.category === selectedCategory);
  }
  
  // 统计数据
  const stats = {
    total: allTasks.length,
    today: allTasks.filter(t => !t.completed && todos.includes(t)).length,
    planned: allTasks.filter(t => !t.completed && planTodos.includes(t)).length,
    habit: allTasks.filter(t => !t.completed && habitTodos.includes(t)).length,
    processing: allTasks.filter(t => !t.completed && processingTodos.includes(t)).length,
    completed: allTasks.filter(t => completedTodos.includes(t)).length,
    habitCheckins: allTasks.filter(t => habitTodos.includes(t)).reduce((sum, t) => {
      const finishData = getFinishData(t);
      return sum + (finishData ? finishData.length : 0);
    }, 0)
  };
  
  // 检查DeepSeek API Key
  const deepseekApiKey = localStorage.getItem('deepseekApiKey');
  
  // 创建归类筛选器HTML
  const categoryFilterHtml = `
    <div class="stats-category-filter">
      <label>筛选归类：</label>
      <select id="statsCategoryFilter" class="category-filter-select">
        <option value="">全部归类</option>
        ${taskCategories.map(cat => `<option value="${cat}" ${cat === selectedCategory ? 'selected' : ''}>${cat}</option>`).join('')}
      </select>
    </div>
  `;
  
  // 创建模态框
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content stats-modal-content">
      <div class="modal-header stats-header">
          <div class="stats-header-left">
            <h3 class="stats-title"><i class="fas fa-chart-bar"></i> 任务统计</h3>
            ${categoryFilterHtml}
          </div>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body stats-modal-body">
        <div class="stats-pages">
          <!-- 左侧：系统数据 -->
          <div class="stats-page stats-page-left">
            <div class="stats-section">
              <h4 class="stats-section-title"><i class="fas fa-chart-bar"></i> 任务概览</h4>
              <div class="stats-grid">
                <div class="stat-item stat-item-primary">
                  <div class="stat-icon"><i class="fas fa-clipboard-list"></i></div>
                  <div class="stat-value">${stats.total}</div>
                  <div class="stat-label">总任务数</div>
                </div>
                <div class="stat-item stat-item-today">
                  <div class="stat-icon"><i class="fas fa-calendar-day"></i></div>
                  <div class="stat-value">${stats.today}</div>
                  <div class="stat-label">今日任务</div>
                </div>
                <div class="stat-item stat-item-planned">
                  <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
                  <div class="stat-value">${stats.planned}</div>
                  <div class="stat-label">计划任务</div>
                </div>
                <div class="stat-item stat-item-habit">
                  <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                  <div class="stat-value">${stats.habit}</div>
                  <div class="stat-label">打卡任务</div>
                </div>
                <div class="stat-item stat-item-processing">
                  <div class="stat-icon"><i class="fas fa-bolt"></i></div>
                  <div class="stat-value">${stats.processing}</div>
                  <div class="stat-label">进行中</div>
                </div>
                <div class="stat-item stat-item-completed">
                  <div class="stat-icon"><i class="fas fa-bullseye"></i></div>
                  <div class="stat-value">${stats.completed}</div>
                  <div class="stat-label">已完成</div>
                </div>
                <div class="stat-item stat-item-checkins">
                  <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                  <div class="stat-value">${stats.habitCheckins}</div>
                  <div class="stat-label">打卡总天数</div>
                </div>
              </div>
            </div>
            
            <div class="stats-section">
              <h4 class="stats-section-title"><i class="fas fa-list"></i> 任务详情</h4>
              <div class="task-details" id="taskDetailsContainer">
                <pre id="taskDetailsJson"></pre>
              </div>
            </div>
          </div>
          
          <!-- 右侧：AI分析 -->
          <div class="stats-page stats-page-right">
            <div class="stats-section" id="aiAnalysisSection">
              <div class="stats-section-header">
                <h4 class="stats-section-title"><i class="fas fa-robot"></i> AI 分析</h4>
                <div class="export-buttons" id="exportButtons" style="display: none;">
                  <button class="export-btn" data-format="html" title="导出为HTML">
                    <i class="fas fa-file-code"></i> HTML
                  </button>
                  <button class="export-btn" data-format="markdown" title="导出为Markdown">
                    <i class="fas fa-file-alt"></i> MD
                  </button>
                  <button class="export-btn" data-format="pdf" title="导出为PDF">
                    <i class="fas fa-file-pdf"></i> PDF
                  </button>
                </div>
              </div>
              <div id="aiAnalysisContent">
                ${deepseekApiKey ? `
                  <div class="ai-input-section">
                    <div class="ai-api-key-info">
                      <span class="ai-api-key-status">
                        <i class="fas fa-check-circle" style="color: var(--status-completed); margin-right: 6px;"></i>
                        DeepSeek API Key 已配置
                      </span>
                      <button id="deleteApiKeyBtn" class="ai-delete-key-btn" title="删除 API Key">
                        <i class="fas fa-trash-alt"></i> 删除
                      </button>
                    </div>
                    <textarea id="aiUserInput" class="ai-user-input" placeholder="请输入您的问题或需求（可选）&#10;例如：分析我的任务完成情况、给出改进建议等"></textarea>
                    <button id="triggerAiAnalysisBtn" class="ai-trigger-btn">
                      <span class="ai-btn-icon"><i class="fas fa-robot"></i></span>
                      <span class="ai-btn-text">开始 AI 分析</span>
                    </button>
                  </div>
                ` : `
                  <div class="ai-prompt">
                    <div class="ai-prompt-icon"><i class="fas fa-lightbulb"></i></div>
                    <p class="ai-prompt-title">未配置 DeepSeek API Key</p>
                    <p class="ai-prompt-desc">请在 localStorage 中设置 <code>deepseekApiKey</code> 以启用 AI 分析功能</p>
                    <input type="text" id="deepseekApiKeyInput" class="ai-api-input" placeholder="请输入 DeepSeek API Key">
                    <button id="saveApiKeyBtn" class="ai-save-btn">保存</button>
                  </div>
                `}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // 添加归类筛选器事件
  const categoryFilter = modal.querySelector('#statsCategoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      const category = e.target.value;
      // 重新打开统计窗口，传入选中的归类
      closeModal();
      showTaskStatistics(category);
    });
  }
  
  // 显示任务详情JSON（根据筛选后的数据）
  const taskDetailsJson = modal.querySelector('#taskDetailsJson');
  if (taskDetailsJson) {
    // 根据筛选条件构建任务数据
    const filteredTodos = selectedCategory ? todos.filter(t => t.category === selectedCategory) : todos;
    const filteredPlanTodos = selectedCategory ? planTodos.filter(t => t.category === selectedCategory) : planTodos;
    const filteredHabitTodos = selectedCategory ? habitTodos.filter(t => t.category === selectedCategory) : habitTodos;
    const filteredProcessingTodos = selectedCategory ? processingTodos.filter(t => t.category === selectedCategory) : processingTodos;
    const filteredCompletedTodos = selectedCategory ? completedTodos.filter(t => t.category === selectedCategory) : completedTodos;
    
    const taskData = {
      todos: filteredTodos,
      planTodos: filteredPlanTodos,
      habitTodos: filteredHabitTodos,
      processingTodos: filteredProcessingTodos,
      completedTodos: filteredCompletedTodos
    };
    taskDetailsJson.textContent = JSON.stringify(taskData, null, 2);
  }
  
  // 检查并处理DeepSeek API Key
  const aiAnalysisContent = modal.querySelector('#aiAnalysisContent');
  
  if (!deepseekApiKey) {
    const saveBtn = modal.querySelector('#saveApiKeyBtn');
    const input = modal.querySelector('#deepseekApiKeyInput');
    if (saveBtn && input) {
      saveBtn.addEventListener('click', () => {
        const apiKey = input.value.trim();
        if (apiKey) {
          localStorage.setItem('deepseekApiKey', apiKey);
          showStatusMessage('✅ API Key 已保存');
          // 重新打开统计窗口以刷新界面
          closeModal();
          showTaskStatistics(selectedCategory);
        }
      });
      
      // 支持 Enter 键保存
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveBtn.click();
        }
      });
    }
  } else {
    // 添加删除 API Key 按钮事件
    const deleteBtn = modal.querySelector('#deleteApiKeyBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('确定要删除 DeepSeek API Key 吗？删除后将无法使用 AI 分析功能。')) {
          localStorage.removeItem('deepseekApiKey');
          showStatusMessage('✅ API Key 已删除');
          // 重新打开统计窗口以刷新界面
          closeModal();
          showTaskStatistics(selectedCategory);
        }
      });
    }
    
    // 添加触发AI分析的按钮事件
    const triggerBtn = modal.querySelector('#triggerAiAnalysisBtn');
    const userInputEl = modal.querySelector('#aiUserInput');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', async () => {
        const userInput = userInputEl ? userInputEl.value.trim() : '';
        // 根据筛选条件构建任务数据
        const filteredTodos = selectedCategory ? todos.filter(t => t.category === selectedCategory) : todos;
        const filteredPlanTodos = selectedCategory ? planTodos.filter(t => t.category === selectedCategory) : planTodos;
        const filteredHabitTodos = selectedCategory ? habitTodos.filter(t => t.category === selectedCategory) : habitTodos;
        const filteredProcessingTodos = selectedCategory ? processingTodos.filter(t => t.category === selectedCategory) : processingTodos;
        const filteredCompletedTodos = selectedCategory ? completedTodos.filter(t => t.category === selectedCategory) : completedTodos;
        
        const taskData = {
          todos: filteredTodos,
          planTodos: filteredPlanTodos,
          habitTodos: filteredHabitTodos,
          processingTodos: filteredProcessingTodos,
          completedTodos: filteredCompletedTodos
        };
        
        // 如果有归类筛选，在用户输入中添加提示
        let enhancedUserInput = userInput;
        if (selectedCategory) {
          enhancedUserInput = `[归类筛选：${selectedCategory}] ${userInput || '请分析这个归类下的任务情况'}`;
        }
        
        await analyzeTasksWithDeepSeekStream(deepseekApiKey, taskData, aiAnalysisContent, stats, enhancedUserInput);
      });
      
      // 支持 Enter+Ctrl 发送
      if (userInputEl) {
        userInputEl.addEventListener('keydown', async (e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            triggerBtn.click();
          }
        });
      }
    }
  }
  
  // 关闭模态框处理
  const closeBtn = modal.querySelector('.modal-close');
  const closeModal = () => {
    if (modal && modal.parentNode === document.body) {
      document.body.removeChild(modal);
    }
  };
  
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // ESC键处理
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}

// 使用DeepSeek API分析任务（流式模式）
async function analyzeTasksWithDeepSeekStream(apiKey, taskData, containerEl, stats = null, userInput = '') {
  if (!containerEl) return;
  
  try {
    // 显示加载状态并禁用按钮
    const modal = containerEl.closest('.modal');
    const triggerBtn = modal ? modal.querySelector('#triggerAiAnalysisBtn') : null;
    const userInputEl = modal ? modal.querySelector('#aiUserInput') : null;
    
    // 获取当前选中的归类
    const categoryFilter = modal ? modal.querySelector('#statsCategoryFilter') : null;
    const selectedCategory = categoryFilter ? categoryFilter.value : '';
    
    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.querySelector('.ai-btn-text').textContent = '分析中...';
    }
    if (userInputEl) {
      userInputEl.disabled = true;
    }
    
    // 创建结果容器
    containerEl.innerHTML = `
      <div class="ai-analysis-container">
        <div class="ai-analysis-result">
          <div class="ai-content" id="aiStreamContent"></div>
        </div>
      </div>
    `;
    const contentEl = containerEl.querySelector('#aiStreamContent');
    
    // 显示导出按钮
    const exportButtons = modal.querySelector('#exportButtons');
    if (exportButtons) {
      exportButtons.style.display = 'flex';
    }
    
    // 构建提示词
    let prompt = '';
    
    // 添加统计信息
    if (stats) {
      prompt += `以下是任务统计信息：\n`;
      prompt += `- 总任务数：${stats.total}\n`;
      prompt += `- 今日任务：${stats.today}\n`;
      prompt += `- 计划任务：${stats.planned}\n`;
      prompt += `- 打卡任务：${stats.habit}\n`;
      prompt += `- 进行中：${stats.processing}\n`;
      prompt += `- 已完成：${stats.completed}\n`;
      prompt += `- 打卡总次数：${stats.habitCheckins}\n\n`;
    }
    
    // 添加任务数据
    prompt += `任务详细数据：\n${JSON.stringify(taskData, null, 2)}\n\n`;
    
    // 如果有用户输入，添加到提示词
    if (userInput) {
      prompt += `用户需求：${userInput}\n\n`;
      prompt += `请根据以上统计信息和任务数据，针对用户的需求进行详细分析和回复。`;
    } else {
      prompt += `请分析以上任务数据，给出任务完成情况的总结和建议。`;
    }
    
    // 调用DeepSeek API（流式模式）
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        stream: true  // 启用流式输出
      })
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    // 读取流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    
    // 存储完整文本到元素的数据属性，供导出使用
    if (contentEl) {
      contentEl.dataset.fullText = '';
    }
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // 解码数据块
      buffer += decoder.decode(value, { stream: true });
      
      // 处理完整的SSE消息
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留最后一个可能不完整的行
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            continue;
          }
          
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            
            if (delta) {
              fullText += delta;
              // 实时更新显示内容
              if (contentEl) {
                contentEl.innerHTML = fullText.replace(/\n/g, '<br>');
                contentEl.dataset.fullText = fullText; // 保存完整文本
                // 滚动到底部 - 使用 resultEl 而不是 contentEl
                const resultEl = contentEl.closest('.ai-analysis-result');
                if (resultEl) {
                  resultEl.scrollTop = resultEl.scrollHeight;
                }
              }
            }
          } catch (e) {
            // 忽略JSON解析错误
            console.warn('Failed to parse SSE data:', e);
          }
        }
      }
    }
    
    // 流式输出完成后，保存完整文本并绑定导出事件
    if (contentEl) {
      contentEl.dataset.fullText = fullText;
      // 获取统计信息和归类
      const categoryFilter = modal ? modal.querySelector('#statsCategoryFilter') : null;
      const currentCategory = categoryFilter ? categoryFilter.value : '';
      bindExportButtons(modal, fullText, stats, currentCategory);
    }
    
    // 流式输出完成后，恢复按钮状态
    if (triggerBtn) {
      triggerBtn.disabled = false;
      const btnText = triggerBtn.querySelector('.ai-btn-text');
      const btnIcon = triggerBtn.querySelector('.ai-btn-icon');
      if (btnText) btnText.textContent = '重新分析';
      if (btnIcon) btnIcon.innerHTML = '<i class="fas fa-redo"></i>';
      
      // 重新绑定点击事件，传递最新的用户输入和统计信息
      triggerBtn.replaceWith(triggerBtn.cloneNode(true));
      const newTriggerBtn = modal.querySelector('#triggerAiAnalysisBtn');
      if (newTriggerBtn) {
        newTriggerBtn.addEventListener('click', async () => {
          const currentUserInput = userInputEl ? userInputEl.value.trim() : '';
          const currentTaskData = {
            todos: todos,
            planTodos: planTodos,
            habitTodos: habitTodos,
            processingTodos: processingTodos,
            completedTodos: completedTodos
          };
          // 重新计算统计信息
          const currentStats = {
            total: [...todos, ...planTodos, ...habitTodos, ...processingTodos, ...completedTodos].length,
            today: todos.filter(t => !t.completed).length,
            planned: planTodos.filter(t => !t.completed).length,
            habit: habitTodos.filter(t => !t.completed).length,
            processing: processingTodos.filter(t => !t.completed).length,
            completed: completedTodos.length,
            habitCheckins: habitTodos.reduce((sum, t) => {
              const finishData = getFinishData(t);
              return sum + (finishData ? finishData.length : 0);
            }, 0)
          };
          await analyzeTasksWithDeepSeekStream(apiKey, currentTaskData, containerEl, currentStats, currentUserInput);
        });
      }
    }
    if (userInputEl) {
      userInputEl.disabled = false;
    }
    
  } catch (error) {
    console.error('DeepSeek API调用失败:', error);
    
    // 恢复按钮状态
    const modal = containerEl.closest('.modal');
    const triggerBtn = modal ? modal.querySelector('#triggerAiAnalysisBtn') : null;
    const userInputEl = modal ? modal.querySelector('#aiUserInput') : null;
    
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.querySelector('.ai-btn-text').textContent = '重新分析';
      triggerBtn.querySelector('.ai-btn-icon').innerHTML = '<i class="fas fa-robot"></i>';
    }
    if (userInputEl) {
      userInputEl.disabled = false;
    }
    
    containerEl.innerHTML = `
      <div class="ai-error">
        <p>❌ AI分析失败: ${error.message}</p>
        <p style="color: var(--text-secondary); font-size: 12px; margin-top: 8px;">请检查网络连接或 API Key 是否正确</p>
      </div>
    `;
  }
}

// 绑定导出按钮事件
function bindExportButtons(modal, content, stats, selectedCategory) {
  const exportButtons = modal.querySelectorAll('.export-btn');
  exportButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format;
      exportAnalysis(format, content, stats, selectedCategory);
    });
  });
}

// 导出分析结果
function exportAnalysis(format, content, stats, selectedCategory) {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const categorySuffix = selectedCategory ? `_${selectedCategory}` : '';
  const filename = `task-analysis${categorySuffix}_${timestamp}`;
  
  switch (format) {
    case 'html':
      exportAsHTML(content, stats, selectedCategory, filename);
      break;
    case 'markdown':
      exportAsMarkdown(content, stats, selectedCategory, filename);
      break;
    case 'pdf':
      exportAsPDF(content, stats, selectedCategory, filename);
      break;
  }
}

// 导出为HTML
function exportAsHTML(content, stats, selectedCategory, filename) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>任务分析报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #37352f;
      background: #ffffff;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #37352f;
    }
    h2 {
      font-size: 24px;
      font-weight: 600;
      margin-top: 32px;
      margin-bottom: 16px;
      color: #37352f;
      border-bottom: 2px solid #e9e9e7;
      padding-bottom: 8px;
    }
    .meta {
      color: #787774;
      font-size: 14px;
      margin-bottom: 32px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }
    .stat-card {
      background: #f7f6f3;
      border: 1px solid #e9e9e7;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #37352f;
      margin: 8px 0;
    }
    .stat-label {
      font-size: 13px;
      color: #787774;
      font-weight: 500;
    }
    .content {
      background: #ffffff;
      border: 1px solid #e9e9e7;
      border-radius: 8px;
      padding: 24px;
      margin-top: 24px;
      white-space: pre-wrap;
      line-height: 1.8;
      font-size: 15px;
    }
    .category-badge {
      display: inline-block;
      background: #e9e9e7;
      color: #37352f;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      margin-left: 8px;
    }
  </style>
</head>
<body>
  <h1><i class="fas fa-chart-bar"></i> 任务分析报告</h1>
  <div class="meta">
    生成时间: ${new Date().toLocaleString('zh-CN')}
    ${selectedCategory ? `<span class="category-badge">${selectedCategory}</span>` : ''}
  </div>
  
  <h2>统计概览</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${stats.total}</div>
      <div class="stat-label">总任务数</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.today}</div>
      <div class="stat-label">今日任务</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.planned}</div>
      <div class="stat-label">计划任务</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.habit}</div>
      <div class="stat-label">打卡任务</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.processing}</div>
      <div class="stat-label">进行中</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.completed}</div>
      <div class="stat-label">已完成</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.habitCheckins}</div>
      <div class="stat-label">打卡总天数</div>
    </div>
  </div>
  
  <h2>AI 分析</h2>
  <div class="content">${content.replace(/\n/g, '<br>')}</div>
</body>
</html>`;
  
  downloadFile(html, `${filename}.html`, 'text/html');
}

// 导出为Markdown
function exportAsMarkdown(content, stats, selectedCategory, filename) {
  const md = `# 📊 任务分析报告

**生成时间**: ${new Date().toLocaleString('zh-CN')}
${selectedCategory ? `**归类筛选**: ${selectedCategory}` : ''}

## 统计概览

| 指标 | 数值 |
|------|------|
| 总任务数 | ${stats.total} |
| 今日任务 | ${stats.today} |
| 计划任务 | ${stats.planned} |
| 打卡任务 | ${stats.habit} |
| 进行中 | ${stats.processing} |
| 已完成 | ${stats.completed} |
| 打卡总天数 | ${stats.habitCheckins} |

## AI 分析

${content}
`;
  
  downloadFile(md, `${filename}.md`, 'text/markdown');
}

// 导出为PDF
function exportAsPDF(content, stats, selectedCategory, filename) {
  // 使用html2pdf.js库或调用打印API
  // 这里使用window.print()配合CSS打印样式
  const printWindow = window.open('', '_blank');
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>任务分析报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #37352f;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    h2 {
      font-size: 24px;
      font-weight: 600;
      margin-top: 32px;
      margin-bottom: 16px;
      border-bottom: 2px solid #e9e9e7;
      padding-bottom: 8px;
    }
    .meta {
      color: #787774;
      font-size: 14px;
      margin-bottom: 32px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }
    .stat-card {
      background: #f7f6f3;
      border: 1px solid #e9e9e7;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      margin: 8px 0;
    }
    .stat-label {
      font-size: 13px;
      color: #787774;
      font-weight: 500;
    }
    .content {
      background: #ffffff;
      border: 1px solid #e9e9e7;
      border-radius: 8px;
      padding: 24px;
      margin-top: 24px;
      white-space: pre-wrap;
      line-height: 1.8;
      font-size: 15px;
    }
    @media print {
      body { padding: 20px; }
      .stat-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1><i class="fas fa-chart-bar"></i> 任务分析报告</h1>
  <div class="meta">
    生成时间: ${new Date().toLocaleString('zh-CN')}
    ${selectedCategory ? `<span style="display: inline-block; background: #e9e9e7; color: #37352f; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; margin-left: 8px;">${selectedCategory}</span>` : ''}
  </div>
  
  <h2>统计概览</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${stats.total}</div>
      <div class="stat-label">总任务数</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.today}</div>
      <div class="stat-label">今日任务</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.planned}</div>
      <div class="stat-label">计划任务</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.habit}</div>
      <div class="stat-label">打卡任务</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.processing}</div>
      <div class="stat-label">进行中</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.completed}</div>
      <div class="stat-label">已完成</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.habitCheckins}</div>
      <div class="stat-label">打卡总天数</div>
    </div>
  </div>
  
  <h2>AI 分析</h2>
  <div class="content">${content.replace(/\n/g, '<br>')}</div>
  
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;
  
  printWindow.document.write(html);
  printWindow.document.close();
}

// 下载文件辅助函数
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Calendar event listeners
if (calPrevBtn) {
  calPrevBtn.addEventListener('click', prevMonth);
}
if (calNextBtn) {
  calNextBtn.addEventListener('click', nextMonth);
}

// Todo Detail Panel event listeners
const detailPanel = document.getElementById('todoDetailPanel');
const closeDetailBtn = document.getElementById('closeDetailPanel');

if (closeDetailBtn) {
  closeDetailBtn.addEventListener('click', hideTodoDetail);
}

// 点击面板外部关闭
if (detailPanel) {
  detailPanel.addEventListener('click', (e) => {
    if (e.target === detailPanel) {
      hideTodoDetail();
    }
  });
}

// 点击主内容区域关闭详情面板
const mainContent = document.querySelector('.main-content');
if (mainContent) {
  mainContent.addEventListener('click', () => {
    if (detailPanel && detailPanel.classList.contains('show')) {
      hideTodoDetail();
    }
  });
}

// Section collapse/expand functionality
function initSectionCollapse() {
  // 加载保存的折叠状态
  const savedStates = JSON.parse(localStorage.getItem('sectionCollapseStates') || '{}');
  
  // 为每个分区标题添加点击事件
  document.querySelectorAll('[data-section-header]').forEach(header => {
    const sectionType = header.getAttribute('data-section-header');
    const section = header.closest('.todo-section');
    
    // 恢复保存的状态
    if (savedStates[sectionType] === true) {
      section.classList.add('collapsed');
    }
    
    // 添加点击事件
    header.addEventListener('click', () => {
      section.classList.toggle('collapsed');
      
      // 保存状态
      const currentStates = JSON.parse(localStorage.getItem('sectionCollapseStates') || '{}');
      currentStates[sectionType] = section.classList.contains('collapsed');
      localStorage.setItem('sectionCollapseStates', JSON.stringify(currentStates));
    });
  });
}

// Initialize - 确保在 DOM 加载完成后执行
function initializeApp() {
  // 1. 加载任务归类
  loadTaskCategories();
  
  // 2. 从 localStorage 加载数据
loadTodos();
  
  // 2.1. 初始化归类提示显示
  updateCategoryHint();
  
  // 2.2. 初始化归类输入框事件处理器
  initCategoryInputHandlers();
  
  // 2.3. 确保开发者工具按钮事件绑定
  const devToolsBtn = $('#openDevTools');
  if (devToolsBtn) {
    // 移除旧的事件监听器（如果存在）
    const newBtn = devToolsBtn.cloneNode(true);
    devToolsBtn.parentNode.replaceChild(newBtn, devToolsBtn);
    
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('开发者工具按钮被点击');
      if (window.xformat && typeof window.xformat.openDevTools === 'function') {
        window.xformat.openDevTools();
      } else {
        console.error('openDevTools API not available', window.xformat);
      }
    });
  }
  
  // 2.4. 确保统计按钮事件绑定
  const statsBtn = document.getElementById('toggleCalView');
  if (statsBtn) {
    // 移除旧的事件监听器（如果存在）
    const newStatsBtn = statsBtn.cloneNode(true);
    statsBtn.parentNode.replaceChild(newStatsBtn, statsBtn);
    
    newStatsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('统计按钮被点击');
      showTaskStatistics();
    });
  }
  
  // 3. 加载日历视图模式
  calendarViewMode = localStorage.getItem('calendarViewMode') || 'bars';
  
  // 3. 加载模拟日期（如果存在）
  const savedMockDate = localStorage.getItem('mockDate');
  if (savedMockDate) {
    mockDate = savedMockDate;
    updateMockDateDisplay();
  }
  
  // 4. 渲染所有任务和日历
  renderTodos();
renderTodayTasks();
  renderPlannedTasks();
renderCalendar();
  
  // 5. 初始化分区折叠状态
  initSectionCollapse();
  
  // 6. 更新日历视图切换按钮
  updateCalendarViewToggle();
  
  // 7. 初始化导入/导出功能
  initImportExport();
  
  // 8. 初始化主题选择器
  initThemeSelector();
  
  // 9. 强制使用浅色主题（保留原有逻辑，但会被主题选择器覆盖）
  const savedColorTheme = localStorage.getItem('colorTheme');
  if (!savedColorTheme) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  
  // 8. 初始化模拟日期控件事件监听
  const mockDateInputEl = $('#mockDateInput');
  const setMockDateBtn = $('#setMockDate');
  const clearMockDateBtn = $('#clearMockDate');
  
  if (setMockDateBtn) {
    setMockDateBtn.addEventListener('click', () => {
      const dateStr = mockDateInputEl?.value;
      if (dateStr) {
        setMockDate(dateStr);
      }
    });
  }
  
  if (clearMockDateBtn) {
    clearMockDateBtn.addEventListener('click', () => {
      clearMockDate();
    });
  }
  
  addDebugLog('App initialized', {
    todosCount: todos.length,
    planTodosCount: planTodos.length,
    habitTodosCount: habitTodos.length,
    calendarViewMode: calendarViewMode,
    mockDate: mockDate
  });
}

// 等待 DOM 加载完成后再初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM 已经加载完成，直接初始化
  initializeApp();
}

// Toggle calendar view mode
function toggleCalendarViewMode() {
  calendarViewMode = calendarViewMode === 'bars' ? 'counts' : 'bars';
  localStorage.setItem('calendarViewMode', calendarViewMode);
  updateCalendarViewToggle();
  renderCalendar();
}

function updateCalendarViewToggle() {
  if (calViewIcon && calViewText) {
    if (calendarViewMode === 'bars') {
      calViewIcon.innerHTML = '<i class="fas fa-chart-bar"></i>';
      calViewText.textContent = '统计';
    } else {
      calViewIcon.innerHTML = '<i class="fas fa-calendar-alt"></i>';
      calViewText.textContent = '横栏';
    }
  }
}

// Re-render task bars on window resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (calendarViewMode === 'bars') {
      renderTaskBars();
    }
  }, 150);
});

// ESC key to cancel date selection
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (debugLogOverlay && !debugLogOverlay.classList.contains('hidden')) {
      closeDebugLogOverlay();
      return;
    }
    if (dateSelectionState.active) {
    stopDateSelection();
    }
  }
});

// 显示编辑菜单（编辑和删除功能）
function showEditMenu(todoId, event, taskState) {
  event.stopPropagation();
  
  // 移除已存在的菜单
  const existingMenu = document.querySelector('.edit-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  
  // 创建菜单
  const menu = document.createElement('div');
  menu.className = 'edit-menu convert-menu';
  menu.style.position = 'fixed';
  menu.style.zIndex = '10000';
  menu.style.background = 'white';
  menu.style.border = '1px solid var(--border-primary)';
  menu.style.borderRadius = '8px';
  menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  menu.style.padding = '8px 0';
  menu.style.minWidth = '160px';
  
  // 获取鼠标位置
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  
  // 设置菜单位置（鼠标位置附近）
  menu.style.left = `${mouseX + 10}px`;
  menu.style.top = `${mouseY + 10}px`;
  
  // 确保菜单不超出屏幕
  const updateMenuPosition = () => {
    const rect = menu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (rect.right > windowWidth) {
      menu.style.left = `${mouseX - rect.width - 10}px`;
    }
    if (rect.bottom > windowHeight) {
      menu.style.top = `${mouseY - rect.height - 10}px`;
    }
  };
  
  // 根据任务状态构建菜单项
  let menuItems = '';
  
  if (taskState === 'plan') {
    // 计划任务：显示修改日期范围、转为打卡任务和删除
    const location = findTaskLocation(todoId);
    const planType = location ? getPlanType(location.array[location.index]) : 'normal';
    
    if (planType === 'checkin') {
      // 已经是打卡任务，只显示修改日期范围和删除
      menuItems = `
        <div class="convert-menu-item" onclick="editTaskDateRange('${todoId}'); event.stopPropagation(); document.querySelector('.edit-menu')?.remove();">
          <span>📅 修改执行周期</span>
        </div>
        <div class="convert-menu-item" style="border-top: 1px solid var(--border-tertiary); margin-top: 4px; padding-top: 4px;" onclick="confirmDeleteTask('${todoId}'); event.stopPropagation(); document.querySelector('.edit-menu')?.remove();">
          <span style="color: var(--status-error);">🗑️ 删除任务</span>
        </div>
      `;
    } else {
      // 普通计划任务，显示转为打卡任务选项
      menuItems = `
        <div class="convert-menu-item" onclick="editTaskDateRange('${todoId}'); event.stopPropagation(); document.querySelector('.edit-menu')?.remove();">
          <span>📅 修改执行周期</span>
        </div>
        <div class="convert-menu-item" onclick="confirmConvertPlanToHabit('${todoId}'); event.stopPropagation(); document.querySelector('.edit-menu')?.remove();">
          <span>📋 转为打卡任务</span>
        </div>
        <div class="convert-menu-item" style="border-top: 1px solid var(--border-tertiary); margin-top: 4px; padding-top: 4px;" onclick="confirmDeleteTask('${todoId}'); event.stopPropagation(); document.querySelector('.edit-menu')?.remove();">
          <span style="color: var(--status-error);">🗑️ 删除任务</span>
        </div>
      `;
    }
  } else if (taskState === 'todo') {
    // 待办任务：显示转换选项和删除
    menuItems = `
      <div class="convert-menu-item" onclick="convertTodoToPlan('${todoId}'); event.stopPropagation(); document.querySelector('.edit-menu')?.remove();">
        <span>📅 转换为计划任务</span>
      </div>
      <div class="convert-menu-item" onclick="showHabitTypeMenu('${todoId}', event); event.stopPropagation(); document.querySelector('.edit-menu')?.remove();">
        <span>📋 转换为打卡任务</span>
      </div>
      <div class="convert-menu-item" style="border-top: 1px solid var(--border-tertiary); margin-top: 4px; padding-top: 4px;" onclick="confirmDeleteTask('${todoId}'); event.stopPropagation(); document.querySelector('.edit-menu')?.remove();">
        <span style="color: var(--status-error);">🗑️ 删除任务</span>
      </div>
    `;
  } else {
    // 其他任务：只显示删除
    menuItems = `
      <div class="convert-menu-item" onclick="confirmDeleteTask('${todoId}'); event.stopPropagation(); document.querySelector('.edit-menu')?.remove();">
        <span style="color: var(--status-error);">🗑️ 删除任务</span>
      </div>
    `;
  }
  
  menu.innerHTML = menuItems;
  
  document.body.appendChild(menu);
  
  // 更新菜单位置以确保不超出屏幕
  setTimeout(updateMenuPosition, 0);
  
  // 点击外部关闭菜单
  const closeMenu = (e) => {
    if (!menu.contains(e.target) && e.target !== event.target) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
}

// 显示转换菜单（转换为计划任务或打卡任务，跟随鼠标位置）
function showConvertMenu(todoId, event) {
  event.stopPropagation();
  
  // 移除已存在的菜单
  const existingMenu = document.querySelector('.convert-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  
  // 创建菜单
  const menu = document.createElement('div');
  menu.className = 'convert-menu';
  menu.style.position = 'fixed';
  menu.style.zIndex = '10000';
  menu.style.background = 'white';
  menu.style.border = '1px solid var(--border-primary)';
  menu.style.borderRadius = '8px';
  menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  menu.style.padding = '8px 0';
  menu.style.minWidth = '160px';
  
  // 获取鼠标位置
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  
  // 设置菜单位置（鼠标位置附近）
  menu.style.left = `${mouseX + 10}px`;
  menu.style.top = `${mouseY + 10}px`;
  
  // 确保菜单不超出屏幕
  const updateMenuPosition = () => {
    const rect = menu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (rect.right > windowWidth) {
      menu.style.left = `${mouseX - rect.width - 10}px`;
    }
    if (rect.bottom > windowHeight) {
      menu.style.top = `${mouseY - rect.height - 10}px`;
    }
  };
  
  menu.innerHTML = `
    <div class="convert-menu-item" onclick="convertTodoToPlan('${todoId}'); event.stopPropagation()">
      <span>📅 转换为计划任务</span>
    </div>
    <div class="convert-menu-item" onclick="showHabitTypeMenu('${todoId}', event); event.stopPropagation()">
      <span>📋 转换为打卡任务</span>
      <span style="margin-left: auto;">›</span>
    </div>
  `;
  
  document.body.appendChild(menu);
  
  // 更新菜单位置以确保不超出屏幕
  setTimeout(updateMenuPosition, 0);
  
  // 点击外部关闭菜单
  const closeMenu = (e) => {
    if (!menu.contains(e.target) && e.target !== event.target) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
}

// 显示打卡类型选择菜单（跟随鼠标位置）
function showHabitTypeMenu(todoId, event) {
  event.stopPropagation();
  
  // 移除已存在的菜单
  const existingMenu = document.querySelector('.convert-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  
  // 创建菜单
  const menu = document.createElement('div');
  menu.className = 'convert-menu';
  menu.style.position = 'fixed';
  menu.style.zIndex = '10000';
  menu.style.background = 'white';
  menu.style.border = '1px solid var(--border-primary)';
  menu.style.borderRadius = '8px';
  menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  menu.style.padding = '8px 0';
  menu.style.minWidth = '180px';
  
  // 获取鼠标位置
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  
  // 设置菜单位置（鼠标位置附近）
  menu.style.left = `${mouseX + 10}px`;
  menu.style.top = `${mouseY + 10}px`;
  
  // 确保菜单不超出屏幕
  const updateMenuPosition = () => {
    const rect = menu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (rect.right > windowWidth) {
      menu.style.left = `${mouseX - rect.width - 10}px`;
    }
    if (rect.bottom > windowHeight) {
      menu.style.top = `${mouseY - rect.height - 10}px`;
    }
  };
  
  menu.innerHTML = `
    <div class="convert-menu-item" onclick="convertTodoToHabit('${todoId}', 'daily'); event.stopPropagation()">
      <span>📅 每日打卡</span>
    </div>
    <div class="convert-menu-item" onclick="convertTodoToHabit('${todoId}', 'weekly'); event.stopPropagation()">
      <span>📅 每周任意一天打卡</span>
    </div>
    <div class="convert-menu-item" onclick="convertTodoToHabit('${todoId}', 'monthly'); event.stopPropagation()">
      <span>📅 每月任意一天打卡</span>
    </div>
  `;
  
  document.body.appendChild(menu);
  
  // 更新菜单位置以确保不超出屏幕
  setTimeout(updateMenuPosition, 0);
  
  // 点击外部关闭菜单
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
}

// 转换为计划任务
function convertTodoToPlan(todoId) {
  // 移除菜单
  const menu = document.querySelector('.convert-menu');
  if (menu) menu.remove();
  
  // 调用 planTask 进入日期选择模式
  planTask(todoId);
}

// 转换为打卡任务
function convertTodoToHabit(todoId, habitType) {
  // 移除菜单
  const menu = document.querySelector('.convert-menu');
  if (menu) menu.remove();
  
  const location = findTaskLocation(todoId);
  if (!location) return;
  
  const todo = location.array[location.index];
  
  // 设置打卡任务类型
  todo.taskType = 'habit';
  todo.plan_type = 'checkin';
  todo.habitType = habitType; // 'daily', 'weekly', 'monthly'
  todo.finish_data = [];
  
  // 保存任务状态（在转换时先保存）
  saveTodos();
  
  // 进入日期选择模式，选择打卡周期
  if (location) {
    startDateSelection(location.index, location.state);
    
    // 显示提示
    if (statusEl) {
      const habitTypeText = habitType === 'daily' ? '每日' : (habitType === 'weekly' ? '每周' : '每月');
      statusEl.textContent = `📋 已转换为${habitTypeText}打卡任务，请选择执行周期`;
      setTimeout(() => {
        if (statusEl && dateSelectionState.active) statusEl.textContent = '';
      }, 3000);
    }
  }
}

// Listen for navigate-to-today message from main process
window.xformat.onNavigateToToday(() => {
  currentDate = new Date();
  renderCalendar();
  
  // 聚焦输入框，方便用户直接输入任务
  if (todoInputEl) {
    // 使用 setTimeout 确保窗口完全显示后再聚焦
    setTimeout(() => {
      todoInputEl.focus();
    }, 100);
  }
});

// ==================== 导入/导出功能 ====================

// 显示导入/导出模态框
function showImportExportModal() {
  const modal = $('#importExportModal');
  if (!modal) return;
  
  modal.classList.remove('hidden');
  
  // 默认显示导出标签页
  switchTab('export');
  
  // 生成导出JSON
  generateExportJson();
}

// 关闭导入/导出模态框
function closeImportExportModal() {
  const modal = $('#importExportModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// 切换标签页
function switchTab(tabName) {
  const tabs = document.querySelectorAll('.import-export-tab');
  const contents = document.querySelectorAll('.import-export-tab-content');
  
  tabs.forEach(tab => {
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  contents.forEach(content => {
    if (content.id === `${tabName}Tab`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
  
  // 切换到导入标签页时，清空错误信息
  if (tabName === 'import') {
    const errorEl = $('#importError');
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }
}

// 生成导出JSON
function generateExportJson() {
  const exportTextarea = $('#exportJsonText');
  if (!exportTextarea) return;
  
  const exportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    categories: taskCategories,
    tasks: {
      todos: todos,
      planTodos: planTodos,
      habitTodos: habitTodos,
      processingTodos: processingTodos,
      completedTodos: completedTodos
    }
  };
  
  exportTextarea.value = JSON.stringify(exportData, null, 2);
}

// 复制JSON到剪贴板
async function copyJsonToClipboard() {
  const exportTextarea = $('#exportJsonText');
  if (!exportTextarea) return;
  
  try {
    await navigator.clipboard.writeText(exportTextarea.value);
    showStatusMessage('✅ JSON已复制到剪贴板');
  } catch (error) {
    console.error('复制失败:', error);
    // 降级方案：选中文本
    exportTextarea.select();
    document.execCommand('copy');
    showStatusMessage('✅ JSON已复制到剪贴板');
  }
}

// 下载JSON文件
function downloadJsonFile() {
  const exportTextarea = $('#exportJsonText');
  if (!exportTextarea) return;
  
  const jsonData = exportTextarea.value;
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pinko-tasks-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showStatusMessage('✅ JSON文件已下载');
}

// 验证JSON格式
function validateJson(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    
    // 检查必需字段
    if (!data.tasks) {
      throw new Error('JSON格式错误：缺少 tasks 字段');
    }
    
    // 检查tasks结构
    const tasks = data.tasks;
    const requiredArrays = ['todos', 'planTodos', 'habitTodos', 'processingTodos', 'completedTodos'];
    for (const key of requiredArrays) {
      if (!Array.isArray(tasks[key])) {
        throw new Error(`JSON格式错误：tasks.${key} 必须是数组`);
      }
    }
    
    return { valid: true, data: data };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// 导入JSON数据
function importJsonData(jsonString) {
  const validation = validateJson(jsonString);
  
  if (!validation.valid) {
    const errorEl = $('#importError');
    if (errorEl) {
      errorEl.textContent = `导入失败：${validation.error}`;
      errorEl.style.display = 'block';
    }
    return false;
  }
  
  const data = validation.data;
  
  // 确认导入
  if (!confirm('导入将替换当前所有数据，此操作不可撤销！确定要继续吗？')) {
    return false;
  }
  
  try {
    // 导入任务数据
    todos = data.tasks.todos || [];
    planTodos = data.tasks.planTodos || [];
    habitTodos = data.tasks.habitTodos || [];
    processingTodos = data.tasks.processingTodos || [];
    completedTodos = data.tasks.completedTodos || [];
    
    // 导入归类（如果存在）
    if (data.categories && Array.isArray(data.categories)) {
      taskCategories = data.categories;
      localStorage.setItem('xform-task-categories', JSON.stringify(taskCategories));
    }
    
    // 保存数据
    saveTodos();
    
    // 重新渲染
    renderTodos();
    renderTodayTasks();
    renderPlannedTasks();
    renderCalendar();
    
    // 关闭模态框
    closeImportExportModal();
    
    showStatusMessage('✅ 数据导入成功');
    return true;
  } catch (error) {
    console.error('导入失败:', error);
    const errorEl = $('#importError');
    if (errorEl) {
      errorEl.textContent = `导入失败：${error.message}`;
      errorEl.style.display = 'block';
    }
    return false;
  }
}

// 读取文件内容
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

// 绑定导入/导出事件（使用事件委托，避免重复绑定）
let importExportEventsBound = false;

function bindImportExportEvents() {
  const modal = $('#importExportModal');
  if (!modal || importExportEventsBound) return;
  
  importExportEventsBound = true;
  
  // 使用事件委托处理标签页切换
  modal.addEventListener('click', (e) => {
    const tab = e.target.closest('.import-export-tab');
    if (tab) {
      switchTab(tab.dataset.tab);
      return;
    }
    
    // 关闭按钮
    if (e.target.closest('.modal-close')) {
      closeImportExportModal();
      return;
    }
    
    // 点击背景关闭
    if (e.target === modal) {
      closeImportExportModal();
      return;
    }
    
    // 导出功能按钮
    if (e.target.closest('#copyJsonBtn')) {
      copyJsonToClipboard();
      return;
    }
    
    if (e.target.closest('#downloadJsonBtn')) {
      downloadJsonFile();
      return;
    }
    
    // 导入功能按钮
    if (e.target.closest('#importJsonBtn')) {
      const importTextarea = $('#importJsonText');
      const jsonText = importTextarea ? importTextarea.value.trim() : '';
      if (jsonText) {
        importJsonData(jsonText);
      }
      return;
    }
    
    if (e.target.closest('#clearImportBtn')) {
      const importTextarea = $('#importJsonText');
      const fileInput = $('#importFileInput');
      const selectedFileName = $('#selectedFileName');
      const importBtn = $('#importJsonBtn');
      const importError = $('#importError');
      
      if (importTextarea) importTextarea.value = '';
      if (fileInput) fileInput.value = '';
      if (selectedFileName) selectedFileName.style.display = 'none';
      if (importBtn) importBtn.disabled = true;
      if (importError) importError.style.display = 'none';
      return;
    }
    
    // 文件上传区域点击
    if (e.target.closest('#fileUploadArea')) {
      const fileInput = $('#importFileInput');
      if (fileInput) {
        fileInput.click();
      }
      return;
    }
  });
  
  // ESC键关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeImportExportModal();
    }
  });
  
  // 导入文本输入变化
  const importTextarea = $('#importJsonText');
  const importBtn = $('#importJsonBtn');
  const importError = $('#importError');
  
  if (importTextarea) {
    importTextarea.addEventListener('input', () => {
      const hasText = importTextarea.value.trim().length > 0;
      if (importBtn) {
        importBtn.disabled = !hasText;
      }
      if (importError) {
        importError.style.display = 'none';
      }
    });
  }
  
  // 文件选择
  const fileInput = $('#importFileInput');
  const fileUploadArea = $('#fileUploadArea');
  const selectedFileName = $('#selectedFileName');
  
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const text = await readFileAsText(file);
          if (importTextarea) {
            importTextarea.value = text;
            importTextarea.dispatchEvent(new Event('input'));
          }
          if (selectedFileName) {
            selectedFileName.innerHTML = `<i class="fas fa-file"></i> ${file.name}`;
            selectedFileName.style.display = 'flex';
          }
        } catch (error) {
          if (importError) {
            importError.textContent = `文件读取失败：${error.message}`;
            importError.style.display = 'block';
          }
        }
      }
    });
  }
  
  // 拖拽上传
  if (fileUploadArea) {
    fileUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUploadArea.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
      fileUploadArea.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', async (e) => {
      e.preventDefault();
      fileUploadArea.classList.remove('dragover');
      
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.json')) {
        if (fileInput) {
          // 创建新的FileList
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
          fileInput.dispatchEvent(new Event('change'));
        }
      } else {
        if (importError) {
          importError.textContent = '请选择 .json 格式的文件';
          importError.style.display = 'block';
        }
      }
    });
  }
}

// 初始化导入/导出功能（在DOM加载完成后）
function initImportExport() {
  // 绑定导入/导出按钮事件
  const importExportBtn = $('#importExportBtn');
  if (importExportBtn) {
    importExportBtn.addEventListener('click', () => {
      showImportExportModal();
    });
  }
  
  // 绑定模态框内的事件（只绑定一次）
  bindImportExportEvents();
}

// ==================== 主题选择器功能 ====================

// 初始化主题选择器
function initThemeSelector() {
  const themeSelectorBtn = $('#themeSelectorBtn');
  const themeSelectorMenu = $('#themeSelectorMenu');
  const themeSelectorWrapper = document.querySelector('.theme-selector-wrapper');
  const themeOptions = document.querySelectorAll('.theme-option');
  
  if (!themeSelectorBtn || !themeSelectorMenu) return;
  
  // 加载保存的主题
  const savedColorTheme = localStorage.getItem('colorTheme') || 'tokidoki';
  applyColorTheme(savedColorTheme);
  updateThemeSelectorUI(savedColorTheme);
  
  // 切换菜单显示/隐藏
  themeSelectorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = themeSelectorMenu.classList.contains('hidden');
    
    if (isHidden) {
      themeSelectorMenu.classList.remove('hidden');
      themeSelectorWrapper.classList.add('active');
    } else {
      themeSelectorMenu.classList.add('hidden');
      themeSelectorWrapper.classList.remove('active');
    }
  });
  
  // 点击主题选项
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const themeName = option.dataset.theme;
      applyColorTheme(themeName);
      updateThemeSelectorUI(themeName);
      localStorage.setItem('colorTheme', themeName);
      
      // 关闭菜单
      themeSelectorMenu.classList.add('hidden');
      themeSelectorWrapper.classList.remove('active');
      
      showStatusMessage(`✅ 已切换到 ${option.querySelector('.theme-name').textContent} 主题`);
    });
  });
  
  // 点击外部关闭菜单
  document.addEventListener('click', (e) => {
    if (!themeSelectorWrapper.contains(e.target)) {
      themeSelectorMenu.classList.add('hidden');
      themeSelectorWrapper.classList.remove('active');
    }
  });
  
  // ESC键关闭菜单
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !themeSelectorMenu.classList.contains('hidden')) {
      themeSelectorMenu.classList.add('hidden');
      themeSelectorWrapper.classList.remove('active');
    }
  });
}

// 应用颜色主题
function applyColorTheme(themeName) {
  const html = document.documentElement;
  
  // 移除所有主题属性
  const themes = ['tokidoki', 'intellij-light', 'darcula', 'high-contrast', 'material', 'monokai'];
  themes.forEach(theme => {
    html.removeAttribute(`data-color-theme`);
  });
  
  // 应用新主题
  html.setAttribute('data-color-theme', themeName);
  
  // 根据主题设置亮色/暗色模式
  const darkThemes = ['darcula', 'monokai'];
  const lightThemes = ['tokidoki', 'intellij-light', 'high-contrast', 'material'];
  
  if (darkThemes.includes(themeName)) {
    html.setAttribute('data-theme', 'dark');
  } else if (lightThemes.includes(themeName)) {
    html.setAttribute('data-theme', 'light');
  }
}

// 更新主题选择器UI（显示当前选中的主题）
function updateThemeSelectorUI(themeName) {
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(option => {
    if (option.dataset.theme === themeName) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}
