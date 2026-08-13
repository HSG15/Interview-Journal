/* ===================================================
   INTERVIEW JOURNAL — Home View (Company-First)
   Primary entity: Company. Shows one card per company.
   =================================================== */

window.HomeView = (() => {

  async function render({ el }) {
    // Initial Loading State
    el.innerHTML = `<div style="height:100dvh; display:flex; align-items:center; justify-content:center; color:var(--c-text-3); font-size:var(--fs-subhead);">Loading...</div>`;

    try {
      const [companies, stats, allRounds] = await Promise.all([
        Store.getCompanies(),
        Store.getStats(),
        Store.getAllInterviews()
      ]);

      const upcoming = allRounds.filter(i => Utils.isFuture(i.date))
                                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                                  .slice(0, 3);

      el.innerHTML = `
      <!-- Header -->
      <div class="home-header stagger-item">
        <div>
          <div class="home-greeting">${Utils.getGreeting()} 👋</div>
          <div class="home-greeting-sub">Track every round. Never forget a question.</div>
        </div>
        <button class="home-search-btn" id="home-search-btn" aria-label="Search">
          ${Icons.search(20)}
        </button>
      </div>

      <!-- Stats Strip -->
      <div class="home-section">
        <div class="stats-grid">
          ${statCard('Companies',      companies.length,       Icons.building(20),      'var(--c-accent)',  'var(--c-accent-soft)')}
          ${statCard('Total Rounds',   stats.totalInterviews,  Icons.briefcase(20),     'var(--c-purple)',  'var(--c-purple-soft)')}
          ${statCard('Questions',      stats.totalQuestions,   Icons.questionMark(20),  'var(--c-green)',   'var(--c-green-soft)')}
          ${statCard('This Month',     stats.thisMonthCount,   Icons.calendar(20),      'var(--c-orange)',  'var(--c-orange-soft)')}
        </div>
      </div>

      <!-- Upcoming Rounds -->
      ${upcoming.length ? `
      <div class="home-section">
        <div class="section-header stagger-item">
          <div class="section-title">Upcoming</div>
        </div>
        ${upcoming.map(renderUpcomingRound).join('')}
      </div>` : ''}

      <!-- Company Grid -->
      <div class="home-section" style="padding-bottom: calc(var(--nav-height) + var(--sp-6));">
        <div class="section-header stagger-item">
          <div class="section-title">Companies</div>
          ${companies.length > 0 ? `
          <span class="section-action" id="home-add-company">+ New</span>` : ''}
        </div>
        ${companies.length
          ? `<div class="companies-grid home-company-grid" id="home-company-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px">
              ${companies.map((c, i) => renderCompanyCard(c, i)).join('')}
             </div>`
          : renderEmptyState()
        }
      </div>
    `;

    // Stat card stagger
    el.querySelectorAll('.stat-card').forEach((card, i) => {
      card.style.animationDelay = `${50 + i * 60}ms`;
      card.classList.add('stagger-item');
    });

    // Events
    el.querySelector('#home-search-btn')?.addEventListener('click', Search.open);
    el.querySelector('#home-add-company')?.addEventListener('click', () => Router.push('add'));
    el.querySelector('#home-empty-add')?.addEventListener('click', () => Router.push('add'));

    el.querySelectorAll('[data-company]').forEach(card => {
      card.addEventListener('click', () => {
        Router.push(`company/${encodeURIComponent(card.dataset.company)}`);
      });
    });

    el.querySelectorAll('[data-interview-id]').forEach(item => {
      item.addEventListener('click', () => {
        Router.push(`detail/${item.dataset.interviewId}`);
      });
    });

    } catch (e) {
      console.error(e);
      el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--c-red);">Failed to load data.</div>`;
    }
  }

  // ── Sub-renderers ────────────────────────────────────

  function statCard(label, value, icon, color, bg) {
    return `
      <div class="stat-card pressable">
        <div class="stat-card-icon" style="background:${bg};color:${color}">${icon}</div>
        <div class="stat-card-value">${value}</div>
        <div class="stat-card-label">${label}</div>
      </div>`;
  }

  // ── Status Indicator Config ────────────────────────────
  // Small colored circle with icon for top-right corner
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

  // Uniform avatar color for all companies
  const AVATAR_BG = '#6366F1';

  function renderCompanyCard(company, idx) {
    const initials = Utils.getCompanyInitials(company.name);
    const dot      = getStatusDot(company.overallStatus);
    const location = company.latestLocation ? Utils.escapeHtml(company.latestLocation) : '';
    const lastDate = company.latestDate ? Utils.formatDate(company.latestDate) : '';

    return `
      <div class="hc-card stagger-item pressable" data-company="${Utils.escapeHtml(company.name)}"
           style="animation-delay:${60 + idx * 40}ms">

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

  function renderUpcomingRound(interview) {
    const d = new Date(interview.date + 'T00:00:00');
    return `
      <div class="upcoming-card stagger-item pressable" data-interview-id="${interview.id}">
        <div class="upcoming-date-badge">
          <div class="upcoming-date-day">${d.getDate()}</div>
          <div class="upcoming-date-month">${Utils.getMonthShort(d.getMonth())}</div>
        </div>
        <div style="flex:1;min-width:0">
          <div class="upcoming-company">${Utils.escapeHtml(interview.company)}</div>
          <div class="upcoming-meta">${Utils.escapeHtml(interview.round)} · ${Utils.formatTime(interview.time)}</div>
        </div>
        <div style="color:rgba(255,255,255,0.8)">${Icons.chevronRight(18)}</div>
      </div>`;
  }

  function renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">${Icons.building(40)}</div>
        <div class="empty-title">No companies yet</div>
        <div class="empty-subtitle">Add your first interview to start tracking.</div>
        <button class="btn btn-primary" id="home-empty-add">
          ${Icons.plus(16)} Add First Interview
        </button>
      </div>`;
  }

  return { render };
})();
