const $ = (s) => document.querySelector(s);
const inputEl = $('#input');
const outputEl = $('#output');
const statusEl = $('#status');
const indentEl = $('#indent');
const wrapEl = $('#wrap');
const b64EncBtn = $('#b64enc');
const b64DecBtn = $('#b64dec');
const formatBtn = $('#format');
const minifyBtn = $('#minify');
const detectKeyBtn = $('#detectKey');
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
const todoProcessingListEl = $('#todoProcessingList');
const todoCompletedListEl = $('#todoCompletedList');
const toggleProcessingBtn = $('#toggleProcessing');
const toggleCompletedBtn = $('#toggleCompleted');
const processingTextEl = $('#processingText');
const completedTextEl = $('#completedText');
const processingCountEl = $('#processingCount');
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

    // 如果输入是对象字面量而不是严格JSON，尝试宽松解析
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // 尝试将单引号替换为双引号并移除尾逗号
      const relaxed = text
        .replace(/'(?:\\'|[^'])*'/g, (m) => m.replace(/^'/, '"').replace(/'$/, '"'))
        .replace(/,\s*([}\]])/g, '$1');
      parsed = JSON.parse(relaxed);
    }
    const indent = indentEl.value === '\t' ? '\t' : (parseInt(indentEl.value) || 2);
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

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const relaxed = text
        .replace(/'(?:\\'|[^'])*'/g, (m) => m.replace(/^'/, '"').replace(/'$/, '"'))
        .replace(/,\s*([}\]])/g, '$1');
      parsed = JSON.parse(relaxed);
    }
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

// Event listeners for tools
if (formatBtn) {
  formatBtn.addEventListener('click', formatJSON);
}
if (minifyBtn) {
  minifyBtn.addEventListener('click', minifyJSON);
}
if (b64EncBtn) {
  b64EncBtn.addEventListener('click', encodeBase64);
}
if (b64DecBtn) {
  b64DecBtn.addEventListener('click', decodeBase64);
}

// 私钥鉴定
function normalizePemBlock(label, base64Body) {
  const width = 64;
  const lines = base64Body.replace(/\s+/g, '').match(new RegExp(`.{1,${width}}`, 'g')) || [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

function detectPrivateKey(pemOrRaw) {
  const text = pemOrRaw.trim();
  // 已带头标记
  const hasBegin = /-----BEGIN [^-]+-----/.test(text);
  if (hasBegin) {
    const label = (text.match(/-----BEGIN ([^-]+)-----/) || [])[1] || '';
    const base64Body = text.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
    const bytes = base64ToBytesSafe(base64Body);
    if (!bytes) return { type: 'Invalid', label: label, output: '', reason: 'Base64 无法解码' };
    if (/RSA PRIVATE KEY/.test(label)) {
      if (isValidPkcs1(bytes)) return { type: 'PKCS#1', label: 'RSA PRIVATE KEY', output: normalizePemBlock('RSA PRIVATE KEY', base64Body) };
      return { type: 'Invalid', label: 'RSA PRIVATE KEY', output: '', reason: '结构不符合 PKCS#1' };
    }
    if (/PRIVATE KEY/.test(label)) {
      if (isValidPkcs8(bytes)) return { type: 'PKCS#8', label: 'PRIVATE KEY', output: normalizePemBlock('PRIVATE KEY', base64Body) };
      return { type: 'Invalid', label: 'PRIVATE KEY', output: '', reason: '结构不符合 PKCS#8' };
    }
  }

  // 可能是纯Base64或带杂空白
  const base64Body = text.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const bytes = base64ToBytesSafe(base64Body);
  if (!bytes) return { type: 'Invalid', label: '', output: '', reason: 'Base64 无法解码' };
  if (isValidPkcs8(bytes)) {
    return { type: 'PKCS#8', label: 'PRIVATE KEY', output: normalizePemBlock('PRIVATE KEY', base64Body) };
  }
  if (isValidPkcs1(bytes)) {
    return { type: 'PKCS#1', label: 'RSA PRIVATE KEY', output: normalizePemBlock('RSA PRIVATE KEY', base64Body) };
  }
  return { type: 'Invalid', label: '', output: '', reason: '无法识别为有效 PKCS#1 或 PKCS#8 私钥' };
}

function runDetectKey() {
  const raw = inputEl.value.trim();
  if (!raw) {
    statusEl.textContent = '请粘贴私钥文本';
    return;
  }
  const result = detectPrivateKey(raw);
  outputEl.textContent = result.output || '';
  let html = '';
  if (result.type === 'Invalid') {
    html = `校验：<span class="tag tag-bad">无效</span>${result.reason ? `（${result.reason}）` : ''}`;
  } else {
    const tagClass = result.type === 'PKCS#1' ? 'tag tag-pkcs1' : 'tag tag-pkcs8';
    html = `已识别：<span class="${tagClass}">${result.type}</span>`;
  }
  statusEl.innerHTML = html;
}

if (detectKeyBtn) {
  detectKeyBtn.addEventListener('click', runDetectKey);
}

// --- Minimal DER helpers for validation ---
function base64ToBytesSafe(b64) {
  try {
    if (!/^[-A-Za-z0-9+/=\s]+$/.test(b64)) return null;
    const bin = atob(b64);
    return Uint8Array.from(bin, c => c.charCodeAt(0));
  } catch { return null; }
}

function readLength(bytes, offset) {
  const first = bytes[offset];
  if (first < 0x80) return { length: first, lenBytes: 1 };
  const num = first & 0x7f;
  if (num === 0 || num > 4) return { error: true };
  let length = 0;
  for (let i = 1; i <= num; i++) {
    length = (length << 8) | bytes[offset + i];
  }
  return { length, lenBytes: 1 + num };
}

function readElement(bytes, offset) {
  if (offset >= bytes.length) return { error: true };
  const tag = bytes[offset];
  const lres = readLength(bytes, offset + 1);
  if (lres.error) return { error: true };
  const valueOffset = offset + 1 + lres.lenBytes;
  const valueEnd = valueOffset + lres.length;
  if (valueEnd > bytes.length) return { error: true };
  return { tag, length: lres.length, headerLen: 1 + lres.lenBytes, valueOffset, valueEnd };
}

function isValidPkcs1(bytes) {
  // SEQUENCE
  const seq = readElement(bytes, 0);
  if (seq.error || seq.tag !== 0x30) return false;
  let p = seq.valueOffset;
  const end = seq.valueEnd;
  // version INTEGER
  const ver = readElement(bytes, p);
  if (ver.error || ver.tag !== 0x02) return false;
  p = ver.valueEnd;
  // Expect multiple INTEGERs: modulus, publicExponent, privateExponent, prime1, prime2, exponent1, exponent2, coefficient
  let intCount = 0;
  while (p < end) {
    const el = readElement(bytes, p);
    if (el.error || el.tag !== 0x02) break;
    intCount++;
    p = el.valueEnd;
  }
  // At least 8 integers after version
  if (intCount < 8) return false;
  // No trailing bytes
  return p === end;
}

function isValidPkcs8(bytes) {
  // Outer SEQUENCE
  const outer = readElement(bytes, 0);
  if (outer.error || outer.tag !== 0x30) return false;
  let p = outer.valueOffset;
  const end = outer.valueEnd;
  // version INTEGER (0)
  const ver = readElement(bytes, p);
  if (ver.error || ver.tag !== 0x02) return false;
  p = ver.valueEnd;
  // algorithmIdentifier SEQUENCE
  const alg = readElement(bytes, p);
  if (alg.error || alg.tag !== 0x30) return false;
  // Inside alg: OID rsaEncryption and optional NULL
  let ap = alg.valueOffset;
  const aend = alg.valueEnd;
  const oid = readElement(bytes, ap);
  if (oid.error || oid.tag !== 0x06) return false;
  // Check OID bytes
  const rsaOid = [0x2A,0x86,0x48,0x86,0xF7,0x0D,0x01,0x01,0x01];
  if (oid.length !== rsaOid.length) return false;
  for (let i = 0; i < rsaOid.length; i++) {
    if (bytes[oid.valueOffset + i] !== rsaOid[i]) return false;
  }
  ap = oid.valueEnd;
  if (ap < aend) {
    const maybeNull = readElement(bytes, ap);
    if (maybeNull.error) return false;
    // NULL is tag 0x05, but some encodings omit it; accept if present
    if (maybeNull.tag === 0x05) ap = maybeNull.valueEnd;
  }
  if (ap !== aend) return false;
  p = alg.valueEnd;
  // privateKey OCTET STRING
  const oct = readElement(bytes, p);
  if (oct.error || oct.tag !== 0x04) return false;
  // inner should be PKCS#1
  const inner = bytes.slice(oct.valueOffset, oct.valueEnd);
  return isValidPkcs1(inner);
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
let todos = [];
let processingTodos = [];
let completedTodos = [];
let showCompleted = false;
let showProcessing = false;
let currentEditingTodoIndex = -1;
let currentEditingState = 'pending';

function loadTodos() {
  try {
    const saved = localStorage.getItem('xform-todos');
    if (saved) {
      const data = JSON.parse(saved);
      todos = data.todos || [];
      processingTodos = data.processing || [];
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
      processing: processingTodos,
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
        <button class="todo-processing" onclick="moveToProcessing(${originalIndex}); event.stopPropagation()" title="标记为进行中">⚡</button>
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

function renderProcessingTodos() {
  if (!todoProcessingListEl) return;
  
  todoProcessingListEl.innerHTML = '';
  
  // 按开始处理时间倒序排列
  const sortedProcessingTodos = [...processingTodos].sort((a, b) => new Date(b.processingAt) - new Date(a.processingAt));
  
  sortedProcessingTodos.forEach((todo, sortedIndex) => {
    // 找到原始数组中的索引
    const originalIndex = processingTodos.findIndex(t => t.id === todo.id);
    
    const li = document.createElement('li');
    li.className = 'todo-item processing';
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
      <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleProcessingTodo(${originalIndex})" onclick="event.stopPropagation()">
      <span class="todo-text">${todo.title}</span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="${dateClass}">${dateStr}</span>
        <button class="todo-complete" onclick="completeProcessingTodo(${originalIndex}); event.stopPropagation()" title="标记为已完成">✓</button>
        <button class="todo-back" onclick="moveBackToPending(${originalIndex}); event.stopPropagation()" title="移回待办">←</button>
        <button class="todo-delete" onclick="deleteProcessingTodo(${originalIndex}); event.stopPropagation()">×</button>
      </div>
    `;
    
    // 添加点击事件打开详情面板
    li.addEventListener('click', (e) => {
      if (e.target.type !== 'checkbox' && !e.target.classList.contains('todo-delete') && !e.target.classList.contains('todo-complete') && !e.target.classList.contains('todo-back')) {
        showTodoDetail(todo, originalIndex, 'processing');
      }
    });
    
    todoProcessingListEl.appendChild(li);
  });
  
  updateProcessingCount();
}

function updateProcessingCount() {
  if (processingCountEl) {
    processingCountEl.textContent = processingTodos.length;
  }
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

function moveToProcessing(index) {
  if (index >= 0 && index < todos.length) {
    const todo = todos[index];
    todo.processing = true;
    todo.processingAt = new Date().toISOString();
    processingTodos.push(todo);
    todos.splice(index, 1);
    saveTodos();
    renderTodos();
    renderProcessingTodos();
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
    renderProcessingTodos();
    renderCalendar();
  }
}

function completeProcessingTodo(index) {
  if (index >= 0 && index < processingTodos.length) {
    const todo = processingTodos[index];
    todo.completed = true;
    todo.completedAt = new Date().toISOString();
    completedTodos.push(todo);
    processingTodos.splice(index, 1);
    
    saveTodos();
    renderProcessingTodos();
    renderCalendar();
  }
}

function moveBackToPending(index) {
  if (index >= 0 && index < processingTodos.length) {
    const todo = processingTodos[index];
    todo.processing = false;
    delete todo.processingAt;
    todos.push(todo);
    processingTodos.splice(index, 1);
    
    saveTodos();
    renderTodos();
    renderProcessingTodos();
    renderCalendar();
  }
}

function deleteProcessingTodo(index) {
  if (index >= 0 && index < processingTodos.length) {
    processingTodos.splice(index, 1);
    saveTodos();
    renderProcessingTodos();
    renderCalendar();
  }
}

function toggleProcessingView() {
  // 不再允许隐藏进行中；始终保持可见并保持文案“进行中”
  if (todoProcessingListEl) todoProcessingListEl.style.display = 'block';
  if (processingTextEl) processingTextEl.textContent = '进行中';
  updateProcessingCount();
}

function toggleCompletedView() {
  showCompleted = !showCompleted;
  
  if (showCompleted) {
    todoCompletedListEl.innerHTML = '';
    completedTodos.forEach((todo, index) => {
      const li = document.createElement('li');
      li.className = 'todo-item completed';
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
        <div style="width: 20px;"></div>
        <span class="todo-text" style="text-decoration: line-through; opacity: 0.7;">${todo.title}</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="${dateClass}">${dateStr}</span>
          <button class="todo-delete" onclick="deleteCompletedTodo(${index})">×</button>
        </div>
      `;
      // 添加点击事件打开详情面板（排除删除按钮）
      li.addEventListener('click', (e) => {
        if (!e.target.classList.contains('todo-delete')) {
          showTodoDetail(todo, index, 'completed');
        }
      });
      todoCompletedListEl.appendChild(li);
    });
    todoCompletedListEl.style.display = 'block';
    if (completedTextEl) completedTextEl.textContent = '隐藏已完成';
  } else {
    todoCompletedListEl.style.display = 'none';
    if (completedTextEl) completedTextEl.textContent = '已完成';
  }
  updateCompletedCount();
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
function showTodoDetail(todo, index, state = 'pending') {
  currentEditingTodoIndex = index;
  currentEditingState = state;
  
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
  } else {
    targetArray = todos;
  }
  
  if (currentEditingTodoIndex >= targetArray.length) return;
  
  // 更新todo数据
  targetArray[currentEditingTodoIndex].title = newTitle;
  targetArray[currentEditingTodoIndex].description = descriptionInput.value.trim();
  
  // 保存并刷新
  saveTodos();
  renderTodos();
  renderProcessingTodos();
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

if (toggleProcessingBtn) {
  toggleProcessingBtn.addEventListener('click', toggleProcessingView);
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
    if (pendingCount > 0) countsHtml += `<span class="badge badge-pending" title="待办">${pendingCount}</span>`;
    if (processingCount > 0) countsHtml += `<span class="badge badge-processing" title="进行中">${processingCount}</span>`;
    if (completedCount > 0) countsHtml += `<span class="badge badge-completed" title="已完成">${completedCount}</span>`;
    if (overdueCount > 0) countsHtml += `<span class="badge badge-overdue" title="逾期">${overdueCount}</span>`;

    const tooltipParts = [];
    if (pendingCount) tooltipParts.push(`待办 ${pendingCount}`);
    if (processingCount) tooltipParts.push(`进行中 ${processingCount}`);
    if (completedCount) tooltipParts.push(`已完成 ${completedCount}`);
    if (overdueCount) tooltipParts.push(`逾期 ${overdueCount}`);

    cell.innerHTML = `<div class="day">${date.getDate()}</div>${countsHtml ? `<div class=\"counts\">${countsHtml}</div>` : ''}`;

    if (dayTodos.length > 0) {
      cell.classList.add('has-todos');
      if (tooltipParts.length > 0) {
        cell.title = tooltipParts.join(' / ');
      }
    }

    // Add click event for all cells
    cell.addEventListener('click', () => {
      showTodosForDate(dateStr, dayTodos);
    });

    calGridEl.appendChild(cell);
  }
}

function getTodosForDate(dateStr) {
  const allTodos = [...todos, ...processingTodos, ...completedTodos];
  return allTodos.filter(todo => {
    // 使用本地日期而不是UTC日期
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
            <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">待办任务 (${pendingTodos.length})</h4>
            ${pendingTodos.map(todo => `
              <div class="modal-todo">
                <span>${todo.title}</span>
                <span class="status">待办</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${processingTodos.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #f59e0b; font-weight: 600;">进行中的任务 (${processingTodos.length})</h4>
            ${processingTodos.map(todo => `
              <div class="modal-todo processing">
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
renderProcessingTodos();
renderCalendar();
setActiveTab('todos');
