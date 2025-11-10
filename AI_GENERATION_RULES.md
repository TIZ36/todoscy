# Pinko AI 生成规则

## 设计系统遵循规则

所有 AI 生成的代码和 UI 组件都必须遵循 `DESIGN_SYSTEM.md` 中定义的设计系统规范。

## 强制规则

### 1. 颜色使用

**必须使用 CSS 变量，禁止硬编码颜色值**

✅ **正确示例：**
```css
.my-component {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}
```

❌ **错误示例：**
```css
.my-component {
  background: #FFFFFF;
  color: #37352F;
  border: 1px solid #E9E9E6;
}
```

### 2. 字体系统

**必须使用字体变量**

✅ **正确示例：**
```css
.text {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
}
```

❌ **错误示例：**
```css
.text {
  font-family: Arial, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
}
```

### 3. 间距系统

**必须使用间距变量（基于 4px 单位）**

✅ **正确示例：**
```css
.container {
  padding: var(--spacing-4);
  margin: var(--spacing-2);
  gap: var(--spacing-3);
}
```

❌ **错误示例：**
```css
.container {
  padding: 16px;
  margin: 8px;
  gap: 12px;
}
```

### 4. 圆角系统

**必须使用圆角变量**

✅ **正确示例：**
```css
.button {
  border-radius: var(--radius-md);
}

.card {
  border-radius: var(--radius-lg);
}
```

❌ **错误示例：**
```css
.button {
  border-radius: 6px;
}

.card {
  border-radius: 8px;
}
```

### 5. 阴影系统

**必须使用阴影变量**

✅ **正确示例：**
```css
.card {
  box-shadow: var(--shadow-md);
}

.modal {
  box-shadow: var(--shadow-2xl);
}
```

❌ **错误示例：**
```css
.card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}
```

### 6. 过渡动画

**必须使用过渡变量**

✅ **正确示例：**
```css
.button {
  transition: all var(--transition-base) var(--ease-in-out);
}
```

❌ **错误示例：**
```css
.button {
  transition: all 0.2s ease;
}
```

## 组件规范

### 按钮（Button）

**必须使用预定义的按钮类或遵循以下规范：**

```css
.btn-primary {
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: #FFFFFF;
  background: var(--accent-blue);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base) var(--ease-in-out);
}

.btn-primary:hover {
  background: var(--accent-blue-hover);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

### 输入框（Input）

```css
.input {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  transition: all var(--transition-base) var(--ease-in-out);
}

.input:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(35, 131, 226, 0.1);
}

.input::placeholder {
  color: var(--text-placeholder);
}
```

### 卡片（Card）

```css
.card {
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base) var(--ease-in-out);
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

### 模态框（Modal）

```css
.modal {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  padding: var(--spacing-6);
}
```

## HTML 结构规范

### 语义化 HTML

**必须使用语义化 HTML 标签**

✅ **正确示例：**
```html
<header>
  <h1>标题</h1>
  <nav>导航</nav>
</header>
<main>
  <section>
    <article>内容</article>
  </section>
</main>
<footer>页脚</footer>
```

❌ **错误示例：**
```html
<div class="header">
  <div class="title">标题</div>
  <div class="nav">导航</div>
</div>
```

## JavaScript 规范

### 访问 CSS 变量

**在 JavaScript 中访问 CSS 变量：**

```javascript
const primaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--accent-blue');
```

### 动态设置 CSS 变量

```javascript
document.documentElement.style.setProperty('--accent-blue', '#2383E2');
```

## 响应式设计

**必须使用媒体查询和响应式单位**

```css
/* 移动设备 */
@media (max-width: 768px) {
  .container {
    padding: var(--spacing-3);
  }
}

/* 平板设备 */
@media (min-width: 769px) and (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

## 可访问性要求

1. **颜色对比度**：文本与背景的对比度至少为 4.5:1（WCAG AA 标准）
2. **焦点状态**：所有交互元素必须有清晰的焦点指示
3. **键盘导航**：所有功能都应支持键盘操作
4. **语义化 HTML**：使用正确的 HTML 标签和 ARIA 属性

## 代码检查清单

在生成代码前，请检查：

- [ ] 所有颜色都使用 CSS 变量
- [ ] 所有字体都使用字体变量
- [ ] 所有间距都使用间距变量
- [ ] 所有圆角都使用圆角变量
- [ ] 所有阴影都使用阴影变量
- [ ] 所有过渡都使用过渡变量
- [ ] HTML 使用语义化标签
- [ ] 支持深色模式（使用 CSS 变量自动适配）
- [ ] 响应式设计（移动端和桌面端）
- [ ] 可访问性（焦点状态、键盘导航）

## 示例：完整组件

```css
/* ✅ 正确的组件样式 */
.task-item {
  /* 间距 */
  padding: var(--spacing-3) var(--spacing-4);
  margin-bottom: var(--spacing-2);
  gap: var(--spacing-3);
  
  /* 颜色 */
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  
  /* 圆角 */
  border-radius: var(--radius-md);
  
  /* 阴影 */
  box-shadow: var(--shadow-sm);
  
  /* 字体 */
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  
  /* 过渡 */
  transition: all var(--transition-base) var(--ease-in-out);
}

.task-item:hover {
  background: var(--bg-hover);
  box-shadow: var(--shadow-md);
}

.task-item:focus {
  outline: 2px solid var(--accent-blue);
  outline-offset: 2px;
}
```

## 更新日志

- **2024-01-XX**: 初始版本，基于 Notion 设计语言创建

## 注意事项

1. **一致性**：所有新组件都必须遵循此规则
2. **可维护性**：使用 CSS 变量，便于主题切换和维护
3. **性能**：避免过度使用阴影和动画
4. **兼容性**：确保在不同浏览器和设备上的兼容性
5. **文档**：复杂组件应添加注释说明

