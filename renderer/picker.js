document.addEventListener('DOMContentLoaded', () => {
  console.log('Picker script loaded');
  const $ = (s) => document.querySelector(s);
  const listEl = $('#list');

  let items = [];
  let activeIndex = 0;

  function render() {
    if (!listEl) return;
    listEl.innerHTML = '';
    
    if (items.length === 0) {
      const li = document.createElement('li');
      li.textContent = '没有剪贴板历史记录';
      li.style.fontStyle = 'italic';
      li.style.color = '#666';
      listEl.appendChild(li);
      return;
    }
    
    items.forEach((t, i) => {
      const li = document.createElement('li');
      const displayText = String(t).replace(/\s+/g, ' ').trim().slice(0, 500);
      li.textContent = displayText;
      if (i === activeIndex) li.classList.add('active');
      li.addEventListener('click', () => select(i));
      listEl.appendChild(li);
    });
  }

  function select(i) {
    if (i < 0 || i >= items.length) return;
    window.xformat.pickerSelect(items[i]);
  }

  window.xformat.onHistoryData((data) => {
    console.log('Picker received history data:', data);
    items = Array.isArray(data) ? data : [];
    activeIndex = 0;
    render();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.xformat.pickerClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(items.length - 1, activeIndex + 1);
      render();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(0, activeIndex - 1);
      render();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(activeIndex);
    }
  });

  // Initial data request
  window.xformat.pickerRefresh();
});


