# Pinko 设计系统规范

## 设计原则

基于 Notion 设计语言，遵循以下核心原则：

1. **简洁与直观**：界面以简洁、直观为特点，避免不必要的装饰，确保用户专注于内容
2. **模块化与灵活性**：采用模块化设计，使各个组件可独立存在，并能灵活组合
3. **一致性**：保持字体、颜色、间距等设计元素的一致性，提升整体用户体验
4. **可访问性**：注意颜色对比度，确保文本可读性，遵循 WCAG 标准

## 全局默认规则

### 1. 字体系统

```css
/* 主字体 - Notion 风格 */
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif,
  "Segoe UI Emoji", "Segoe UI Symbol";

/* 字体大小 */
--font-size-xs: 11px;      /* 辅助文本、标签 */
--font-size-sm: 12px;      /* 次要文本 */
--font-size-base: 14px;    /* 正文 */
--font-size-md: 16px;      /* 重要文本 */
--font-size-lg: 18px;      /* 小标题 */
--font-size-xl: 20px;      /* 标题 */
--font-size-2xl: 24px;     /* 大标题 */

/* 字重 */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* 行高 */
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### 2. 颜色系统

#### 浅色主题（Light Theme）

```css
/* 背景色 */
--bg-primary: #FFFFFF;           /* 主背景 */
--bg-secondary: #F7F6F3;        /* 次要背景 */
--bg-tertiary: #EDECE9;         /* 三级背景 */
--bg-hover: #F1F1EF;            /* 悬停背景 */
--bg-active: #E9E9E6;           /* 激活背景 */

/* 文本色 */
--text-primary: #37352F;        /* 主文本 - Notion 风格 */
--text-secondary: #787774;      /* 次要文本 */
--text-tertiary: #9B9A97;       /* 三级文本 */
--text-disabled: #C1C1BD;       /* 禁用文本 */
--text-placeholder: #B3B3B0;    /* 占位符文本 */

/* 边框色 */
--border-primary: #E9E9E6;      /* 主边框 */
--border-secondary: #EDECE9;     /* 次要边框 */
--border-tertiary: #F1F1EF;     /* 三级边框 */

/* 主色调 - 蓝色 */
--accent-blue: #2383E2;          /* 主蓝色 - Notion 风格 */
--accent-blue-light: #4A9EFF;   /* 浅蓝色 */
--accent-blue-dark: #1A6FC7;    /* 深蓝色 */
--accent-blue-hover: #1A6FC7;    /* 悬停蓝色 */

/* 状态色 */
--status-pending: #2383E2;      /* 待处理 - 蓝色 */
--status-processing: #F9AB00;   /* 进行中 - 橙色 */
--status-completed: #0F7B0F;     /* 已完成 - 绿色 */
--status-error: #E16259;        /* 错误 - 红色 */
--status-overdue: #D25252;       /* 逾期 - 深红色 */

/* 语义色 */
--semantic-info: #2383E2;
--semantic-success: #0F7B0F;
--semantic-warning: #F9AB00;
--semantic-error: #E16259;
```

#### 深色主题（Dark Theme）

```css
/* 背景色 */
--bg-primary: #191919;           /* 主背景 */
--bg-secondary: #2E2E2E;         /* 次要背景 */
--bg-tertiary: #373737;          /* 三级背景 */
--bg-hover: #3D3D3D;             /* 悬停背景 */
--bg-active: #454545;            /* 激活背景 */

/* 文本色 */
--text-primary: #FFFFFF;         /* 主文本 */
--text-secondary: #B3B3B0;       /* 次要文本 */
--text-tertiary: #9B9A97;        /* 三级文本 */
--text-disabled: #6B6B6B;        /* 禁用文本 */
--text-placeholder: #808080;     /* 占位符文本 */

/* 边框色 */
--border-primary: #3D3D3D;       /* 主边框 */
--border-secondary: #373737;      /* 次要边框 */
--border-tertiary: #2E2E2E;      /* 三级边框 */

/* 主色调 - 蓝色 */
--accent-blue: #4A9EFF;           /* 主蓝色 */
--accent-blue-light: #6BB3FF;    /* 浅蓝色 */
--accent-blue-dark: #2383E2;     /* 深蓝色 */
--accent-blue-hover: #6BB3FF;    /* 悬停蓝色 */

/* 状态色 */
--status-pending: #4A9EFF;
--status-processing: #F9AB00;
--status-completed: #4EC9B0;
--status-error: #E16259;
--status-overdue: #D25252;
```

### 3. 间距系统

```css
/* 基础间距单位：4px */
--spacing-1: 4px;    /* 0.25rem */
--spacing-2: 8px;    /* 0.5rem */
--spacing-3: 12px;   /* 0.75rem */
--spacing-4: 16px;   /* 1rem */
--spacing-5: 20px;   /* 1.25rem */
--spacing-6: 24px;   /* 1.5rem */
--spacing-8: 32px;   /* 2rem */
--spacing-10: 40px;  /* 2.5rem */
--spacing-12: 48px;  /* 3rem */
--spacing-16: 64px;  /* 4rem */
```

### 4. 圆角系统

```css
--radius-sm: 4px;      /* 小圆角 */
--radius-md: 6px;      /* 中等圆角 */
--radius-lg: 8px;      /* 大圆角 */
--radius-xl: 12px;     /* 超大圆角 */
--radius-full: 9999px; /* 完全圆形 */
```

### 5. 阴影系统

```css
/* 浅色主题阴影 */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.12);
--shadow-2xl: 0 12px 24px rgba(0, 0, 0, 0.15);

/* 深色主题阴影 */
--shadow-sm-dark: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md-dark: 0 2px 4px rgba(0, 0, 0, 0.4);
--shadow-lg-dark: 0 4px 8px rgba(0, 0, 0, 0.5);
```

### 6. 过渡动画

```css
/* 过渡时间 */
--transition-fast: 0.15s;
--transition-base: 0.2s;
--transition-slow: 0.3s;

/* 缓动函数 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

## 组件规范

### 按钮（Button）

```css
/* 主要按钮 */
.btn-primary {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
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

/* 次要按钮 */
.btn-secondary {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base) var(--ease-in-out);
}

.btn-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--border-secondary);
}

/* 危险按钮 */
.btn-danger {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #FFFFFF;
  background: var(--status-error);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base) var(--ease-in-out);
}

.btn-danger:hover {
  background: #C85046;
}
```

### 输入框（Input）

```css
.input {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
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

## 布局规范

### 容器（Container）

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-4);
}
```

### 网格系统（Grid）

```css
.grid {
  display: grid;
  gap: var(--spacing-4);
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
```

## 响应式设计

```css
/* 移动设备 */
@media (max-width: 768px) {
  .container {
    padding: var(--spacing-3);
  }
  
  .grid-cols-2,
  .grid-cols-3 {
    grid-template-columns: 1fr;
  }
}

/* 平板设备 */
@media (min-width: 769px) and (max-width: 1024px) {
  .grid-cols-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

## 可访问性规范

1. **颜色对比度**：文本与背景的对比度至少为 4.5:1（WCAG AA 标准）
2. **焦点状态**：所有交互元素必须有清晰的焦点指示
3. **键盘导航**：所有功能都应支持键盘操作
4. **语义化 HTML**：使用正确的 HTML 标签和 ARIA 属性

## 使用指南

### 在 CSS 中使用

```css
.my-component {
  padding: var(--spacing-4);
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
```

### 在 JavaScript 中使用

```javascript
// 获取 CSS 变量值
const primaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--accent-blue');
```

## 更新日志

- **2024-01-XX**: 初始版本，基于 Notion 设计语言创建

## 注意事项

1. **一致性**：所有新组件都应遵循此设计系统
2. **可维护性**：使用 CSS 变量，便于主题切换和维护
3. **性能**：避免过度使用阴影和动画
4. **兼容性**：确保在不同浏览器和设备上的兼容性

