/* ===================================================
   INTERVIEW JOURNAL — Companies Directory View
   Dedicated page for filtering and searching companies
   by application status (Passed, Rejected, In Progress, etc.)
   =================================================== */

window.CompaniesView = (() => {

  const STATUS_DOT = {
    'Passed':      { icon: '✓', bg: '#34C759' },
    'Rejected':    { icon: '✕', bg: '#FF3B30' },
    'In Progress': { icon: '⏳', bg: '#FF9F0A' },
    'Pending':     { icon: '⏳', bg: '#FF9F0A' },
    'Upcoming':    { icon: '📅', bg: '#007AFF' },
    'Ghosted':     { icon: '👻', bg: '#8E8E93' },
    'On Hold':     { icon: '⏸️', bg: '#8E8E93' },
  };

  function getStatusDot(outcome) {
    return STATUS_DOT[outcome] || STATUS_DOT['In Progress'];
  }

  async function render({ el }) {
    el.innerHTML = `<div style="height:100dvh; display:flex; align-items:center; justify-content:center; color:var(--c-text-3); font-size:var(--fs-subhead);">Loading companies...</div>`;

    try {
      const companies = await Store.getCompanies();

    el.innerHTML = `
      <div style="padding-top:var(--sp-4);padding-bottom:calc(var(--nav-height) + var(--sp-6))">
        <!-- Header -->
        <div style="padding:var(--sp-2) var(--page-padding) var(--sp-4);display:flex;align-items:center;justify-content:space-between">
          <div>
            <h1 style="font-size:var(--fs-largetitle);font-weight:var(--fw-bold);margin:0">Companies</h1>
            <div style="font-size:var(--fs-caption1);color:var(--c-text-3);margin-top:2px">Filter & browse tracked companies</div>
          </div>
          <button class="home-search-btn" id="companies-search-btn" aria-label="Search">${Icons.search(20)}</button>
        </div>

        <!-- Filter bar -->
        <div class="filter-bar" id="companies-filter" style="margin-bottom:var(--sp-4);padding:0 var(--page-padding);display:flex;gap:8px;overflow-x:auto">
          <div class="filter-chip active" data-filter="ALL">All (${companies.length})</div>
          <div class="filter-chip" data-filter="Passed">✓ Passed</div>
          <div class="filter-chip" data-filter="Rejected">✕ Rejected</div>
          <div class="filter-chip" data-filter="In Progress">⏳ In Progress</div>
          <div class="filter-chip" data-filter="Upcoming">📅 Upcoming</div>
          <div class="filter-chip" data-filter="Ghosted">👻 Ghosted</div>
          <div class="filter-chip" data-filter="On Hold">⏸️ On Hold</div>
        </div>

        <!-- Companies Count Bar -->
        <div style="padding:0 var(--page-padding);margin-bottom:12px;font-size:var(--fs-caption1);color:var(--c-text-3)">
          Showing <span id="companies-count">${companies.length}</span> of ${companies.length} companies
        </div>

        <!-- Grid -->
        ${companies.length ? `
          <div class="companies-grid home-company-grid" id="companies-grid" style="padding:0 var(--page-padding);display:grid;grid-template-columns:repeat(auto-fill, minmax(340px, 1fr));gap:14px">
            ${companies.map((c, idx) => renderCompanyCard(c, idx)).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-icon">${Icons.building(40)}</div>
            <div class="empty-title">No companies yet</div>
            <div class="empty-subtitle">Add your first interview to start tracking.</div>
            <button class="btn btn-primary" onclick="Router.push('add')">
              ${Icons.plus(16)} Add Interview
            </button>
          </div>
        `}
      </div>
    `;

    // Events
    el.querySelector('#companies-search-btn')?.addEventListener('click', Search.open);

    el.querySelectorAll('[data-company]').forEach(card => {
      card.addEventListener('click', () => Router.push(`company/${encodeURIComponent(card.dataset.company)}`));
    });

    // Status Filter Chip handlers
    el.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        el.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterCompanies(el, chip.dataset.filter);
      });
    });

    } catch (e) {
      console.error(e);
      el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--c-red);">Failed to load companies.</div>`;
    }
  }

  function renderCompanyCard(company, idx) {
    const initials = Utils.getCompanyInitials(company.name);
    const dot      = getStatusDot(company.overallStatus);
    const location = company.latestLocation ? Utils.escapeHtml(company.latestLocation) : '';
    const lastDate = company.latestDate ? Utils.formatDate(company.latestDate) : '';

    return `
      <div class="hc-card stagger-item pressable"
           data-company="${Utils.escapeHtml(company.name)}"
           data-status="${Utils.escapeHtml(company.overallStatus)}"
           style="animation-delay:${40 + idx * 30}ms">

        <!-- Row 1: Avatar + Name + Status dot -->
        <div class="hc-row1">
          <div class="hc-avatar-uniform">${initials}</div>
          <div class="hc-name-block">
            <div class="hc-company-name">${Utils.escapeHtml(company.name)}</div>
            ${location ? `<div class="hc-location">${location}</div>` : ''}
          </div>
          <div class="hc-status-dot" style="background:${dot.bg}" title="${company.overallStatus}">
            <span>${dot.icon}</span>
          </div>
        </div>

        <!-- Row 2: Metadata chips -->
        <div class="hc-meta-row">
          <span class="hc-meta-chip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="3"/><path d="M16 1v4M8 1v4M2 9h20"/></svg>
            ${company.rounds.length} Round${company.rounds.length !== 1 ? 's' : ''}
          </span>
          <span class="hc-meta-chip">
            ${Icons.questionMark(12)}
            ${company.totalQuestions} Question${company.totalQuestions !== 1 ? 's' : ''}
          </span>
          ${lastDate ? `
          <span class="hc-meta-chip hc-meta-date">
            Last Interview: ${lastDate}
          </span>` : ''}
        </div>
      </div>`;
  }

  function filterCompanies(el, filter) {
    const cards = el.querySelectorAll('.hc-card');
    const countEl = el.querySelector('#companies-count');
    let visible = 0;

    cards.forEach(card => {
      const status = card.dataset.status;
      let show = false;
      if (filter === 'ALL') {
        show = true;
      } else if (filter === 'In Progress') {
        show = status === 'In Progress' || status === 'Pending';
      } else {
        show = status === filter;
      }

      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (countEl) countEl.textContent = visible;
  }

  return { render };
})();
