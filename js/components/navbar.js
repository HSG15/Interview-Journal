/* ===================================================
   INTERVIEW JOURNAL — Bottom Navigation
   =================================================== */

window.NavBar = (() => {
  const TABS = [
    { id: 'home',      label: 'Home',      icon: () => Icons.home() },
    { id: 'calendar',  label: 'Calendar',  icon: () => Icons.calendar() },
    { id: 'add',       label: '',          icon: () => Icons.plus(22), isAdd: true },
    { id: 'questions', label: 'Questions', icon: () => Icons.messageCircle() },
    { id: 'settings',  label: 'Settings',  icon: () => Icons.settingsIcon() },
  ];

  function render(activeTab) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;

    nav.innerHTML = TABS.map(tab => {
      const isActive = tab.id === activeTab && !tab.isAdd;
      return `
        <button
          class="nav-item ${isActive ? 'active' : ''} ${tab.isAdd ? 'nav-add-btn' : ''}"
          data-tab="${tab.id}"
          aria-label="${tab.isAdd ? 'Add Interview' : tab.label}"
          ${isActive ? 'aria-current="page"' : ''}
        >
          <span class="nav-icon">${tab.icon()}</span>
          ${tab.label ? `<span class="nav-label">${tab.label}</span>` : ''}
        </button>
      `;
    }).join('');

    // Attach routing events
    nav.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab === 'add') {
          Router.push('add');
        } else {
          Router.push(tab);
        }
      });
    });

    // ── macOS Dock Magnification Logic ──
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (!isTouch) {
      const items = Array.from(nav.querySelectorAll('.nav-item'));
      
      nav.addEventListener('mousemove', (e) => {
        const navRect = nav.getBoundingClientRect();
        const mouseX = e.clientX;
        
        items.forEach(item => {
          const rect = item.getBoundingClientRect();
          const itemCenterX = rect.left + rect.width / 2;
          const distance = Math.abs(mouseX - itemCenterX);
          
          const maxDist = 120; // How far the effect reaches
          
          let scale = 1;
          if (distance < maxDist) {
            // Scale between 1 and 1.3 based on proximity
            scale = 1 + (0.3 * (1 - distance / maxDist));
          }
          
          item.style.setProperty('--scale', scale.toFixed(3));
        });
      });

      nav.addEventListener('mouseleave', () => {
        items.forEach(item => {
          item.style.setProperty('--scale', '1');
        });
      });
    }
  }

  function setActive(tabId) {
    document.querySelectorAll('.nav-item').forEach(btn => {
      const isActive = btn.dataset.tab === tabId && !btn.classList.contains('nav-add-btn');
      btn.classList.toggle('active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
  }

  function hide() {
    const nav = document.getElementById('bottom-nav');
    if (nav) nav.style.display = 'none';
  }

  function show() {
    const nav = document.getElementById('bottom-nav');
    if (nav) nav.style.display = 'flex';
  }

  return { render, setActive, hide, show };
})();
