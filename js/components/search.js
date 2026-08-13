/* ===================================================
   INTERVIEW JOURNAL — Global Search Overlay
   =================================================== */

window.Search = (() => {
  let isOpen = false;
  const debouncedSearch = Utils.debounce(runSearch, 200);

  function open() {
    if (isOpen) return;
    isOpen = true;
    const overlay = document.getElementById('search-overlay');
    overlay.classList.remove('hidden');
    overlay.innerHTML = `
      <div class="search-header">
        <div class="search-input-wrap">
          ${Icons.search(18)}
          <input
            type="search"
            class="search-input"
            id="global-search-input"
            placeholder="Search interviews, questions, companies…"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
          />
        </div>
        <button class="search-cancel" id="search-cancel-btn">Cancel</button>
      </div>
      <div class="search-results" id="search-results">
        ${renderEmpty()}
      </div>
    `;

    // Focus input
    setTimeout(() => {
      const inp = document.getElementById('global-search-input');
      inp?.focus();
      inp?.addEventListener('input', (e) => debouncedSearch(e.target.value));
    }, 50);

    document.getElementById('search-cancel-btn').addEventListener('click', close);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    const overlay = document.getElementById('search-overlay');
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
  }

  function renderEmpty() {
    return `
      <div class="empty-state" style="padding: var(--sp-12) var(--sp-8);">
        <div class="empty-icon">${Icons.search(36)}</div>
        <div class="empty-title">Search Everything</div>
        <div class="empty-subtitle">Find interviews, questions, topics, and companies instantly.</div>
      </div>
    `;
  }

  function renderNoResults(query) {
    return `
      <div class="empty-state" style="padding: var(--sp-10) var(--sp-8);">
        <div class="empty-icon">${Icons.search(36)}</div>
        <div class="empty-title">No results found</div>
        <div class="empty-subtitle">Nothing matched "<strong>${Utils.escapeHtml(query)}</strong>". Try a different keyword.</div>
      </div>
    `;
  }

  function runSearch(query) {
    const resultsEl = document.getElementById('search-results');
    if (!resultsEl) return;

    if (!query.trim()) {
      resultsEl.innerHTML = renderEmpty();
      return;
    }

    const results = Store.search(query.trim());
    const { interviews, questions, companies } = results;
    const hasResults = interviews.length || questions.length || companies.length;

    if (!hasResults) {
      resultsEl.innerHTML = renderNoResults(query);
      return;
    }

    let html = '';

    if (companies.length) {
      html += `<div class="search-section-title">Companies</div>`;
      companies.forEach(name => {
        const color = Utils.getCompanyColor(name);
        const initials = Utils.getCompanyInitials(name);
        const count = Store.getAllInterviews().filter(i => i.company === name).length;
        html += `
          <div class="search-result-item pressable" data-action="company" data-name="${Utils.escapeHtml(name)}">
            <div class="search-result-icon" style="background:${color}20">
              <div class="company-avatar avatar-sm" style="background:${color};width:36px;height:36px;border-radius:8px;">${initials}</div>
            </div>
            <div>
              <div style="font-size:var(--fs-callout);font-weight:var(--fw-semibold)">${Utils.highlight(name, query)}</div>
              <div style="font-size:var(--fs-footnote);color:var(--c-text-3)">${count} interview${count !== 1 ? 's' : ''}</div>
            </div>
          </div>
        `;
      });
    }

    if (interviews.length) {
      html += `<div class="search-section-title">Interviews</div>`;
      interviews.forEach(i => {
        const color = Utils.getCompanyColor(i.company);
        const initials = Utils.getCompanyInitials(i.company);
        html += `
          <div class="search-result-item pressable" data-action="interview" data-id="${i.id}">
            <div class="search-result-icon" style="background:${color}20">
              <div class="company-avatar avatar-sm" style="background:${color};width:36px;height:36px;border-radius:8px;">${initials}</div>
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:var(--fs-callout);font-weight:var(--fw-semibold)">${Utils.highlight(i.company, query)}</div>
              <div style="font-size:var(--fs-footnote);color:var(--c-text-3)">${i.round} · ${Utils.formatDate(i.date)}</div>
            </div>
            <span class="badge ${Utils.getOutcomeBadgeClass(i.outcome)}">${i.outcome}</span>
          </div>
        `;
      });
    }

    if (questions.length) {
      html += `<div class="search-section-title">Questions</div>`;
      questions.forEach(q => {
        const interview = Store.getInterview(q.interviewId);
        html += `
          <div class="search-result-item pressable" data-action="interview" data-id="${q.interviewId}">
            <div class="search-result-icon" style="background:var(--c-accent-soft);color:var(--c-accent);">
              ${Icons.questionMark(20)}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:var(--fs-callout);font-weight:var(--fw-medium)">${Utils.highlight(Utils.truncate(q.question, 50), query)}</div>
              <div style="font-size:var(--fs-footnote);color:var(--c-text-3)">${q.topic || 'No topic'} · ${interview ? interview.company : ''}</div>
            </div>
          </div>
        `;
      });
    }

    resultsEl.innerHTML = html;

    // Attach click handlers
    resultsEl.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', () => {
        const action = el.dataset.action;
        if (action === 'interview') {
          close();
          Router.push(`detail/${el.dataset.id}`);
        } else if (action === 'company') {
          close();
          Router.push(`company/${encodeURIComponent(el.dataset.name)}`);
        }
      });
    });
  }

  return { open, close };
})();
