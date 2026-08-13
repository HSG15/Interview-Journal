/* ===================================================
   INTERVIEW JOURNAL — Calendar View (Dual Mode)
   =================================================== */

window.CalendarView = (() => {
  let viewMode = 'year'; // 'year' | 'month'
  let currentYear;
  let currentMonth;
  let selectedDate = null;
  let dateMap = {}; // dateStr -> [interviews]

  async function render({ el }) {
    el.innerHTML = `<div style="height:100dvh; display:flex; align-items:center; justify-content:center; color:var(--c-text-3); font-size:var(--fs-subhead);">Loading calendar...</div>`;

    const now = new Date();
    currentYear  = now.getFullYear();
    currentMonth = now.getMonth();
    
    try {
      // Load interviews and build dateMap for quick lookup
      const interviews = await Store.getAllInterviews();
      dateMap = {};
      interviews.forEach(i => {
        if (!dateMap[i.date]) dateMap[i.date] = [];
        dateMap[i.date].push(i);
      });

      el.innerHTML = `
      <div class="calendar-page-container">
        <!-- Segmented Toggle -->
        <div class="calendar-toggle-wrapper">
          <div class="calendar-segmented-control">
            <div class="calendar-segment ${viewMode === 'year' ? 'active' : ''}" data-mode="year">Year</div>
            <div class="calendar-segment ${viewMode === 'month' ? 'active' : ''}" data-mode="month">Month</div>
          </div>
        </div>
        
        <div class="apple-calendar-card">
          <!-- Common Header (Year/Month switcher) -->
          <div class="calendar-header">
            <div class="calendar-month-label" id="cal-main-label"></div>
            <div class="calendar-nav-group">
              <button class="calendar-nav-btn" id="cal-prev" aria-label="Previous">
                ${Icons.chevronLeft(16)}
              </button>
              <button class="calendar-nav-btn" id="cal-next" aria-label="Next">
                ${Icons.chevronRight(16)}
              </button>
            </div>
          </div>
          
          <!-- View Container -->
          <div id="cal-view-container"></div>
        </div>

        <!-- Selected Day Interviews -->
        <div id="cal-day-section" style="padding: 0 0 var(--sp-8); margin-top: -12px;"></div>
      </div>
    `;

    renderActiveView(el);

    // Event Listeners
    el.querySelectorAll('.calendar-segment').forEach(seg => {
      seg.addEventListener('click', () => {
        el.querySelectorAll('.calendar-segment').forEach(s => s.classList.remove('active'));
        seg.classList.add('active');
        viewMode = seg.dataset.mode;
        
        // If switching to month, center on the selected date's month if one exists
        if (viewMode === 'month' && selectedDate) {
          const d = new Date(selectedDate);
          currentYear = d.getFullYear();
          currentMonth = d.getMonth();
        }
        
        renderActiveView(el);
      });
    });

    el.querySelector('#cal-prev').addEventListener('click', () => {
      if (viewMode === 'year') {
        currentYear--;
      } else {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      }
      renderActiveView(el);
    });

    el.querySelector('#cal-next').addEventListener('click', () => {
      if (viewMode === 'year') {
        currentYear++;
      } else {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      }
      renderActiveView(el);
    });

    } catch (e) {
      console.error(e);
      el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--c-red);">Failed to load calendar.</div>`;
    }
  }

  function renderActiveView(el) {
    const label = el.querySelector('#cal-main-label');
    const container = el.querySelector('#cal-view-container');
    
    if (viewMode === 'year') {
      label.textContent = currentYear;
      renderYearGrid(container, el);
    } else {
      label.textContent = `${Utils.MONTHS_LONG[currentMonth]} ${currentYear}`;
      renderMonthGrid(container, el);
    }
    
    // Day section remains persistent, update if we have a selected date
    if (selectedDate) {
      renderDaySection(el, selectedDate, dateMap[selectedDate] || []);
    } else {
      // Show today by default if no date selected
      const today = new Date();
      if (viewMode === 'year' && currentYear === today.getFullYear()) {
        const todayStr = Utils.toDateString(today);
        if (dateMap[todayStr]?.length) renderDaySection(el, todayStr, dateMap[todayStr]);
      } else if (viewMode === 'month' && currentYear === today.getFullYear() && currentMonth === today.getMonth()) {
        const todayStr = Utils.toDateString(today);
        if (dateMap[todayStr]?.length) renderDaySection(el, todayStr, dateMap[todayStr]);
      } else {
        el.querySelector('#cal-day-section').innerHTML = ''; // Clear if not relevant
      }
    }
  }

  // ── Year View ───────────────────────────────────────
  function renderYearGrid(container, rootEl) {
    let html = '<div class="calendar-year-grid" id="year-grid">';
    
    for (let m = 0; m < 12; m++) {
      html += renderMiniMonth(currentYear, m);
    }
    html += '</div>';
    
    container.innerHTML = html;
    
    // Animate
    container.style.animation = 'fadeInScale 0.2s var(--ease-out) both';
    setTimeout(() => container.style.animation = '', 250);

    bindDayClicks(container, rootEl);
  }

  function renderMiniMonth(year, month) {
    const days = Utils.getDaysInMonth(year, month);
    const firstDay = Utils.getFirstDayOfMonth(year, month);
    const today = new Date();
    let cells = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: '', isOtherMonth: true, dateStr: null });
    }
    // Current month days
    for (let d = 1; d <= days; d++) {
      cells.push({ day: d, isOtherMonth: false, dateStr: Utils.toDateString(new Date(year, month, d)) });
    }

    const html = cells.map((cell, idx) => {
      if (cell.isOtherMonth) return '<div class="calendar-mini-day other-month"></div>';
      
      const colIndex = idx % 7;
      const isWeekend = colIndex === 0 || colIndex === 6;
      const isToday = today.getDate() === cell.day && today.getMonth() === month && today.getFullYear() === year;
      const isSelected = selectedDate === cell.dateStr;
      
      const dayInterviews = dateMap[cell.dateStr] || [];
      const dotsHtml = dayInterviews.slice(0, 3).map(i => {
        const cls = i.outcome === 'Passed' ? 'passed' : i.outcome === 'Failed' ? 'failed' : 'pending';
        return `<div class="calendar-mini-dot ${cls}"></div>`;
      }).join('');

      return `
        <div class="calendar-mini-day ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''} ${isSelected && !isToday ? 'selected' : ''}" data-date="${cell.dateStr}">
          ${cell.day}
          ${dotsHtml ? `<div class="calendar-mini-dots">${dotsHtml}</div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="calendar-mini-month">
        <div class="calendar-mini-header">${Utils.MONTHS_SHORT[month]}</div>
        <div class="calendar-mini-grid">
          ${html}
        </div>
      </div>
    `;
  }

  // ── Month View ──────────────────────────────────────
  function renderMonthGrid(container, rootEl) {
    container.innerHTML = `
      <div class="calendar-weekdays">
        <div class="calendar-weekday weekend">S</div>
        <div class="calendar-weekday">M</div>
        <div class="calendar-weekday">T</div>
        <div class="calendar-weekday">W</div>
        <div class="calendar-weekday">T</div>
        <div class="calendar-weekday">F</div>
        <div class="calendar-weekday weekend">S</div>
      </div>
      <div class="calendar-grid" id="month-grid"></div>
    `;
    
    const grid = container.querySelector('#month-grid');
    const days = Utils.getDaysInMonth(currentYear, currentMonth);
    const firstDay = Utils.getFirstDayOfMonth(currentYear, currentMonth);
    const today = new Date();
    const prevDays = Utils.getDaysInMonth(currentYear, currentMonth - 1);
    let cells = [];

    // Leading empty cells
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: prevDays - i, isOtherMonth: true, dateStr: null });
    }
    // Current month days
    for (let d = 1; d <= days; d++) {
      cells.push({ day: d, isOtherMonth: false, dateStr: Utils.toDateString(new Date(currentYear, currentMonth, d)) });
    }
    // Trailing empty cells
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, isOtherMonth: true, dateStr: null });
    }

    grid.innerHTML = cells.map((cell, idx) => {
      const colIndex = idx % 7;
      const isWeekend = colIndex === 0 || colIndex === 6;
      const isToday = !cell.isOtherMonth && cell.dateStr && today.getDate() === cell.day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
      const isSelected = selectedDate === cell.dateStr;
      
      const dayInterviews = cell.dateStr ? (dateMap[cell.dateStr] || []) : [];
      const dotsHtml = dayInterviews.slice(0, 3).map(i => {
        const cls = i.outcome === 'Passed' ? 'passed' : i.outcome === 'Failed' ? 'failed' : 'pending';
        return `<div class="calendar-dot ${cls}"></div>`;
      }).join('');

      return `
        <div class="calendar-day ${cell.isOtherMonth ? 'other-month' : ''} ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''} ${isSelected && !isToday ? 'selected' : ''}" 
             ${cell.dateStr ? `data-date="${cell.dateStr}"` : ''} 
             ${cell.isOtherMonth ? '' : 'role="button" tabindex="0"'}>
          <span class="day-number">${cell.day}</span>
          ${dotsHtml ? `<div class="calendar-day-dots">${dotsHtml}</div>` : ''}
        </div>
      `;
    }).join('');

    // Animate
    grid.style.animation = 'fadeInScale 0.2s var(--ease-out) both';
    setTimeout(() => grid.style.animation = '', 250);

    bindDayClicks(grid, rootEl);
  }

  // ── Common Day Selection ────────────────────────────
  function bindDayClicks(container, rootEl) {
    container.querySelectorAll('[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        selectedDate = cell.dataset.date;
        renderActiveView(rootEl);
        
        // Scroll down on mobile if it's the year view and a day is selected
        setTimeout(() => {
          rootEl.querySelector('#cal-day-section')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      });
    });
  }

  function renderDaySection(el, dateStr, dayInterviews) {
    const section = el.querySelector('#cal-day-section');
    if (!section) return;

    if (!dayInterviews.length) {
      section.innerHTML = `
        <div style="text-align:center;padding:var(--sp-6) 0;color:var(--c-text-3)">
          <div style="font-size:var(--fs-callout);font-weight:var(--fw-medium)">${Utils.formatDateLong(dateStr)}</div>
          <div style="font-size:var(--fs-subhead);margin-top:var(--sp-2)">No interviews on this day.</div>
        </div>
      `;
      return;
    }

    section.innerHTML = `
      <div style="margin-bottom:var(--sp-3)">
        <div style="font-size:var(--fs-callout);font-weight:var(--fw-semibold);color:var(--c-text-3)">${Utils.formatDateLong(dateStr)}</div>
      </div>
      ${dayInterviews.map(i => {
        const color = Utils.getCompanyColor(i.company);
        const initials = Utils.getCompanyInitials(i.company);
        return `
          <div class="interview-item stagger-item pressable" data-interview-id="${i.id}">
            <div class="company-avatar avatar-md" style="background:${color}">${initials}</div>
            <div class="interview-item-body">
              <div class="interview-item-company">${Utils.escapeHtml(i.company)}</div>
              <div class="interview-item-meta">${Utils.escapeHtml(i.round)}${i.time ? ' · ' + Utils.formatTime(i.time) : ''}</div>
            </div>
            <div class="interview-item-right">
              <span class="badge ${Utils.getOutcomeBadgeClass(i.outcome)}">${i.outcome}</span>
            </div>
          </div>
        `;
      }).join('')}
    `;

    section.querySelectorAll('[data-interview-id]').forEach(item => {
      item.addEventListener('click', () => Router.push(`detail/${item.dataset.interviewId}`));
    });

    section.style.animation = 'fadeInUp 0.2s var(--ease-out) both';
    setTimeout(() => section.style.animation = '', 250);
  }

  return { render };
})();
