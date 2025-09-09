const $ = (s) => document.querySelector(s);
const inputEl = $('#input');
const outputEl = $('#output');
const statusEl = $('#status');
const indentEl = $('#indent');
const wrapEl = $('#wrap');
const b64EncBtn = $('#b64enc');
const b64DecBtn = $('#b64dec');
const recordHotkeyBtn = $('#recordHotkey');

// Tabs & views
const tabTodos = $('#tab-todos');
const tabTools = $('#tab-tools');
const mainEl = $('#main');
const headerActions = $('#headerActions');
const sidebarTools = $('#sidebar-tools');
const viewEditor = $('#view-editor');
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
const todoCompletedListEl = $('#todoCompletedList');
const toggleCompletedBtn = $('#toggleCompleted');
const completedCountEl = $('#completedCount');

function setActiveTab(which) {
  if (which === 'todos') {
    tabTodos.classList.add('active');
    tabTools.classList.remove('active');
    mainEl.classList.remove('layout-tools');
    mainEl.classList.add('layout-todos');
    headerActions.classList.add('hidden');
    viewTodos.classList.remove('hidden');
    viewCalendar.classList.remove('hidden');
    sidebarTools.classList.add('hidden');
    viewEditor.classList.add('hidden');
  } else {
    tabTools.classList.add('active');
    tabTodos.classList.remove('active');
    mainEl.classList.remove('layout-todos');
    mainEl.classList.add('layout-tools');
    headerActions.classList.remove('hidden');
    viewTodos.classList.add('hidden');
    viewCalendar.classList.add('hidden');
    sidebarTools.classList.remove('hidden');
    viewEditor.classList.remove('hidden');
  }
}

// Tab event listeners
if (tabTodos) {
  tabTodos.addEventListener('click', () => setActiveTab('todos'));
}
if (tabTools) {
  tabTools.addEventListener('click', () => setActiveTab('tools'));
}

// JSON formatting functions
function formatJSON() {
  try {
    const text = inputEl.value.trim();
    if (!text) {
      statusEl.textContent = 'Please enter JSON to format';
      return;
    }

    const parsed = JSON.parse(text);
    const indent = parseInt(indentEl.value) || 2;
    const formatted = JSON.stringify(parsed, null, indent);
    
    outputEl.textContent = formatted;
    statusEl.textContent = 'JSON formatted successfully';
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
    outputEl.textContent = '';
  }
}

function minifyJSON() {
  try {
    const text = inputEl.value.trim();
    if (!text) {
      statusEl.textContent = 'Please enter JSON to minify';
      return;
    }

    const parsed = JSON.parse(text);
    const minified = JSON.stringify(parsed);
    
    outputEl.textContent = minified;
    statusEl.textContent = 'JSON minified successfully';
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
    outputEl.textContent = '';
  }
}

function encodeBase64() {
  try {
    const text = inputEl.value.trim();
    if (!text) {
      statusEl.textContent = 'Please enter text to encode';
      return;
    }

    const encoded = btoa(text);
    outputEl.textContent = encoded;
    statusEl.textContent = 'Text encoded to Base64 successfully';
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
    outputEl.textContent = '';
  }
}

function decodeBase64() {
  try {
    const text = inputEl.value.trim();
    if (!text) {
      statusEl.textContent = 'Please enter Base64 to decode';
      return;
    }

    const decoded = atob(text);
    outputEl.textContent = decoded;
    statusEl.textContent = 'Base64 decoded successfully';
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
    outputEl.textContent = '';
  }
}

// Event listeners for JSON functions
if (b64EncBtn) {
  b64EncBtn.addEventListener('click', encodeBase64);
}
if (b64DecBtn) {
  b64DecBtn.addEventListener('click', decodeBase64);
}

// Hotkey recording
let isRecordingHotkey = false;

function startHotkeyRecording() {
  if (isRecordingHotkey) return;
  
  isRecordingHotkey = true;
  recordHotkeyBtn.textContent = 'Press any key combination...';
  recordHotkeyBtn.style.backgroundColor = '#ff6b6b';
  
  const handleKeyDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const modifiers = [];
    if (e.metaKey) modifiers.push('Cmd');
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');
    
    const key = e.key === ' ' ? 'Space' : e.key;
    const accelerator = [...modifiers, key].join('+');
    
    // Send to main process
    window.xformat.setHistoryHotkey(accelerator);
    
    // Update UI
    recordHotkeyBtn.textContent = `Hotkey: ${accelerator}`;
    recordHotkeyBtn.style.backgroundColor = '#51cf66';
    
    isRecordingHotkey = false;
    document.removeEventListener('keydown', handleKeyDown);
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
let todos = [];
let completedTodos = [];
let showCompleted = false;
let currentEditingTodoIndex = -1;

function loadTodos() {
  try {
    const saved = localStorage.getItem('xform-todos');
    if (saved) {
      const data = JSON.parse(saved);
      todos = data.todos || [];
      completedTodos = data.completed || [];
    }
  } catch (error) {
    console.error('Error loading todos:', error);
  }
}

function saveTodos() {
  try {
    const data = {
      todos: todos,
      completed: completedTodos
    };
    localStorage.setItem('xform-todos', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving todos:', error);
  }
}

function renderTodos() {
  if (!todoListEl) return;
  
  todoListEl.innerHTML = '';
  
  // 按创建时间倒序排列
  const sortedTodos = [...todos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  sortedTodos.forEach((todo, sortedIndex) => {
    // 找到原始数组中的索引
    const originalIndex = todos.findIndex(t => t.id === todo.id);
    
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.style.cursor = 'pointer';
    
    // 格式化日期显示
    const todoDate = new Date(todo.createdAt);
    const month = todoDate.getMonth() + 1;
    const day = todoDate.getDate();
    const dateStr = `${month}月${day}日`;
    
    // 判断日期颜色：过去的时间显示红色，今天显示灰色
    const today = new Date();
    const isToday = todoDate.toDateString() === today.toDateString();
    const isPast = todoDate < today && !isToday;
    const dateClass = isPast ? 'todo-date past' : (isToday ? 'todo-date today' : 'todo-date future');
    
    li.innerHTML = `
      <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${originalIndex})" onclick="event.stopPropagation()">
      <span class="todo-text">${todo.title}</span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="${dateClass}">${dateStr}</span>
        <button class="todo-delete" onclick="deleteTodo(${originalIndex}); event.stopPropagation()">×</button>
      </div>
    `;
    
    // 添加点击事件打开详情面板
    li.addEventListener('click', (e) => {
      if (e.target.type !== 'checkbox' && !e.target.classList.contains('todo-delete')) {
        showTodoDetail(todo, originalIndex);
      }
    });
    
    todoListEl.appendChild(li);
  });
  
  updateCompletedCount();
}

function updateCompletedCount() {
  if (completedCountEl) {
    completedCountEl.textContent = completedTodos.length;
  }
}

function addTodo() {
  const text = todoInputEl.value.trim();
  if (!text) return;
  
  const todo = {
    id: Date.now(),
    title: text,
    description: '',
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  todos.push(todo);
  todoInputEl.value = '';
  saveTodos();
  renderTodos();
  renderCalendar();
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
    renderCalendar();
  }
}

function deleteTodo(index) {
  if (index >= 0 && index < todos.length) {
    todos.splice(index, 1);
    saveTodos();
    renderTodos();
    renderCalendar();
  }
}

function toggleCompletedView() {
  showCompleted = !showCompleted;
  
  if (showCompleted) {
    todoCompletedListEl.innerHTML = '';
    completedTodos.forEach((todo, index) => {
      const li = document.createElement('li');
      li.className = 'todo-item completed';
      
      // 格式化日期显示
      const todoDate = new Date(todo.createdAt);
      const month = todoDate.getMonth() + 1;
      const day = todoDate.getDate();
      const dateStr = `${month}月${day}日`;
      
      // 判断日期颜色：过去的时间显示红色，今天显示灰色
      const today = new Date();
      const isToday = todoDate.toDateString() === today.toDateString();
      const isPast = todoDate < today && !isToday;
      const dateClass = isPast ? 'todo-date past' : (isToday ? 'todo-date today' : 'todo-date future');
      
      li.innerHTML = `
        <div style="width: 20px;"></div>
        <span class="todo-text" style="text-decoration: line-through; opacity: 0.7;">${todo.title}</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="${dateClass}">${dateStr}</span>
          <button class="todo-delete" onclick="deleteCompletedTodo(${index})">×</button>
        </div>
      `;
      todoCompletedListEl.appendChild(li);
    });
    todoCompletedListEl.style.display = 'block';
    toggleCompletedBtn.textContent = '隐藏已完成';
  } else {
    todoCompletedListEl.style.display = 'none';
    toggleCompletedBtn.textContent = `已完成 ${completedTodos.length}`;
  }
}

function deleteCompletedTodo(index) {
  if (index >= 0 && index < completedTodos.length) {
    completedTodos.splice(index, 1);
    saveTodos();
    toggleCompletedView();
    renderCalendar();
  }
}

// Todo Detail Panel functions
function showTodoDetail(todo, index) {
  currentEditingTodoIndex = index;
  
  const detailPanel = document.getElementById('todoDetailPanel');
  const titleInput = document.getElementById('detailTitle');
  const descriptionInput = document.getElementById('detailDescription');
  const createdAtDisplay = document.getElementById('detailCreatedAt');
  
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
  
  // 添加自动保存事件监听器
  titleInput.addEventListener('input', autoSaveTodoDetail);
  descriptionInput.addEventListener('input', autoSaveTodoDetail);
  
  // 显示面板
  detailPanel.classList.add('show');
}

function hideTodoDetail() {
  const detailPanel = document.getElementById('todoDetailPanel');
  const titleInput = document.getElementById('detailTitle');
  const descriptionInput = document.getElementById('detailDescription');
  
  // 移除自动保存事件监听器
  titleInput.removeEventListener('input', autoSaveTodoDetail);
  descriptionInput.removeEventListener('input', autoSaveTodoDetail);
  
  detailPanel.classList.remove('show');
  currentEditingTodoIndex = -1;
}

function autoSaveTodoDetail() {
  if (currentEditingTodoIndex < 0 || currentEditingTodoIndex >= todos.length) return;
  
  const titleInput = document.getElementById('detailTitle');
  const descriptionInput = document.getElementById('detailDescription');
  
  const newTitle = titleInput.value.trim();
  if (!newTitle) return; // 如果标题为空，不保存
  
  // 更新todo数据
  todos[currentEditingTodoIndex].title = newTitle;
  todos[currentEditingTodoIndex].description = descriptionInput.value.trim();
  
  // 保存并刷新
  saveTodos();
  renderTodos();
}

function saveTodoDetail() {
  // 这个函数现在只用于手动保存按钮，但实际不需要了
  autoSaveTodoDetail();
  hideTodoDetail();
}

// Event listeners for todos
if (todoInputEl) {
  todoInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  });
}

if (toggleCompletedBtn) {
  toggleCompletedBtn.addEventListener('click', toggleCompletedView);
}

// Calendar functionality
let currentDate = new Date();

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
  
  // Add day headers
  const dayHeaders = ['日', '一', '二', '三', '四', '五', '六'];
  dayHeaders.forEach(day => {
    const header = document.createElement('div');
    header.className = 'cal-header';
    header.textContent = day;
    calGridEl.appendChild(header);
  });
  
  // Add calendar days
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    
    if (date.getMonth() === month) {
      cell.classList.add('current-month');
    }
    
    // Check if this is today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      cell.classList.add('today');
    }
    
    cell.textContent = date.getDate();
    
    // Check if this date has todos
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayTodos = getTodosForDate(dateStr);
    
    if (dayTodos.length > 0) {
      cell.classList.add('has-todos');
      cell.title = `${dayTodos.length} 个任务`;
    }
    
    // Add click event for all cells
    cell.addEventListener('click', () => {
      showTodosForDate(dateStr, dayTodos);
    });
    
    calGridEl.appendChild(cell);
  }
}

function getTodosForDate(dateStr) {
  const allTodos = [...todos, ...completedTodos];
  return allTodos.filter(todo => {
    // 使用本地日期而不是UTC日期
    const todoDate = new Date(todo.createdAt);
    const localDateStr = `${todoDate.getFullYear()}-${String(todoDate.getMonth() + 1).padStart(2, '0')}-${String(todoDate.getDate()).padStart(2, '0')}`;
    return localDateStr === dateStr;
  }).map(todo => {
    // 确保completedTodos中的任务有正确的completed状态
    if (completedTodos.includes(todo)) {
      return { ...todo, completed: true };
    }
    return { ...todo, completed: false };
  });
}

function showTodosForDate(dateStr, dayTodos) {
  // 直接使用传入的日期字符串，避免时区转换问题
  const [year, month, day] = dateStr.split('-');
  const dateFormatted = `${year}年${parseInt(month)}月${parseInt(day)}日`;
  
  // Separate completed and pending todos
  const pendingTodos = dayTodos.filter(todo => !todo.completed);
  const completedTodos = dayTodos.filter(todo => todo.completed);
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${dateFormatted} 的任务</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        ${dayTodos.length === 0 ? '<p style="text-align: center; color: #666; padding: 20px;">这一天没有任务</p>' : ''}
        
        ${pendingTodos.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #2563eb; font-weight: 600;">进行中的任务 (${pendingTodos.length})</h4>
            ${pendingTodos.map(todo => `
              <div class="modal-todo">
                <span>${todo.title}</span>
                <span class="status">进行中</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${completedTodos.length > 0 ? `
          <div>
            <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #059669; font-weight: 600;">已完成的任务 (${completedTodos.length})</h4>
            ${completedTodos.map(todo => `
              <div class="modal-todo completed">
                <span style="text-decoration: line-through; opacity: 0.7;">${todo.title}</span>
                <span class="status">已完成</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal handlers
  const closeBtn = modal.querySelector('.modal-close');
  const closeModal = () => {
    document.body.removeChild(modal);
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

// Initialize
loadTodos();
renderTodos();
renderCalendar();
setActiveTab('todos');
