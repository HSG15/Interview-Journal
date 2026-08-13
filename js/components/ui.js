/* ===================================================
   INTERVIEW JOURNAL — Toast Notifications
   =================================================== */

window.Toast = (() => {
  function show(message, type = 'default', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    if (type !== 'error') {
      try {
        const audio = new Audio('tune.mp3');
        audio.play().catch(e => console.log('Audio playback prevented:', e));
      } catch (e) {}
    }

    const iconMap = {
      success: Icons.checkCircle('#34C759'),
      error:   Icons.xCircle('#FF3B30'),
      info:    Icons.info(20),
      default: Icons.checkCircle('#34C759'), // Fallback to success icon for default minimal style
    };

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      ${iconMap[type] ? `<span class="toast-icon">${iconMap[type]}</span>` : ''}
      <span>${Utils.escapeHtml(message)}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
  }

  return { show };
})();

/* ===================================================
   INTERVIEW JOURNAL — Modal Dialog
   =================================================== */

window.Modal = (() => {
  function confirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false, onConfirm, onCancel }) {
    // Remove any existing backdrop
    const existing = document.getElementById('modal-backdrop');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <div class="modal-title" id="modal-title">${Utils.escapeHtml(title)}</div>
        </div>
        ${message ? `<div class="modal-body">${Utils.escapeHtml(message)}</div>` : ''}
        <div class="modal-actions">
          <button class="modal-btn" id="modal-cancel">${Utils.escapeHtml(cancelText)}</button>
          <button class="modal-btn ${danger ? 'danger' : ''}" id="modal-confirm">${Utils.escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    const container = document.getElementById('app') || document.body;
    container.appendChild(backdrop);

    const close = () => {
      backdrop.style.animation = 'fadeIn 0.15s ease reverse both';
      setTimeout(() => backdrop.remove(), 150);
    };

    backdrop.querySelector('#modal-cancel').addEventListener('click', () => {
      close();
      onCancel?.();
    });

    backdrop.querySelector('#modal-confirm').addEventListener('click', () => {
      close();
      onConfirm?.();
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) { close(); onCancel?.(); }
    });
  }

  function show({ title, content, maxWidth, onOpen, onClose }) {
    const existing = document.getElementById('modal-backdrop');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal ${maxWidth ? 'modal-lg' : ''}" style="${maxWidth ? `max-width:${maxWidth}px;` : ''}" role="dialog" aria-modal="true">
        <div class="modal-header" style="text-align: left; padding: var(--sp-4) var(--sp-5) var(--sp-2); display: flex; justify-content: space-between; align-items: center;">
          <div class="modal-title" style="font-size: var(--fs-title3);">${Utils.escapeHtml(title)}</div>
          <button class="btn-icon modal-close-btn" aria-label="Close">${Icons.xMark(20)}</button>
        </div>
        <div class="modal-content-body">
          ${content}
        </div>
      </div>
    `;

    const container = document.getElementById('app') || document.body;
    container.appendChild(backdrop);

    const close = () => {
      backdrop.style.animation = 'fadeIn 0.15s ease reverse both';
      setTimeout(() => backdrop.remove(), 150);
      if (onClose) onClose();
    };

    backdrop.querySelector('.modal-close-btn').addEventListener('click', close);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    if (onOpen) {
      setTimeout(() => onOpen(backdrop, close), 0);
    }
    
    return { close };
  }

  return { confirm, show };
})();

/* ===================================================
   INTERVIEW JOURNAL — Bottom Sheet
   =================================================== */

window.BottomSheet = (() => {
  let backdropEl = null;
  let sheetEl = null;

  function ensureElements() {
    sheetEl = document.getElementById('bottom-sheet');
    if (!backdropEl && sheetEl) {
      backdropEl = document.createElement('div');
      backdropEl.id = 'sheet-backdrop';
      sheetEl.parentNode.insertBefore(backdropEl, sheetEl);
    }
  }

  function open(content, title = '') {
    ensureElements();
    sheetEl.innerHTML = `
      <div class="sheet-handle"></div>
      ${title ? `
        <div class="sheet-header">
          <div class="sheet-title">${Utils.escapeHtml(title)}</div>
          <button class="btn-icon sheet-close" aria-label="Close">${Icons.xMark(18)}</button>
        </div>
      ` : ''}
      <div class="sheet-body">${content}</div>
    `;

    backdropEl.classList.add('visible');
    sheetEl.classList.add('visible');
    sheetEl.classList.remove('hidden');

    // Close handlers
    const close = () => BottomSheet.close();
    backdropEl.addEventListener('click', close, { once: true });
    sheetEl.querySelector('.sheet-close')?.addEventListener('click', close);
  }

  function close() {
    if (sheetEl) {
      sheetEl.classList.remove('visible');
      backdropEl?.classList.remove('visible');
      setTimeout(() => {
        sheetEl.innerHTML = '';
      }, 350);
    }
  }

  return { open, close };
})();
