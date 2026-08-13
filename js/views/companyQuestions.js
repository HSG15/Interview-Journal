/* ===================================================
   INTERVIEW JOURNAL — Company All Questions View
   Dedicated page for browsing, searching, filtering, and
   exporting all questions for a specific company.
   =================================================== */

window.CompanyQuestionsView = (() => {

  const VALID_STATUSES = ['Answered', 'Not Answered', 'Not Sure'];

  async function render({ el, params }) {
    const rawName     = params.name || '';
    let companyName   = rawName;
    try {
      if (rawName.includes('%')) companyName = decodeURIComponent(rawName);
    } catch (e) {
      companyName = rawName;
    }

    el.innerHTML = `<div style="height:100dvh; display:flex; align-items:center; justify-content:center; color:var(--c-text-3); font-size:var(--fs-subhead);">Loading questions...</div>`;

    try {
      const rounds = await Store.getCompanyRounds(companyName);

      if (!rounds.length) {
        el.innerHTML = `
          <div class="dv-topbar">
            <button class="dv-back-btn" onclick="Router.back()">${Icons.chevronLeft(18)} <span>Back</span></button>
          </div>
          <div class="detail-empty-page">
            <div class="detail-empty-title">Company not found</div>
            <button class="btn btn-secondary" onclick="Router.back()">Go Back</button>
          </div>`;
        return;
      }

      const color    = Utils.getCompanyColor(companyName);
      const initials = Utils.getCompanyInitials(companyName);

      // All questions across all rounds for this company
      const allRoundsQs = await Promise.all(rounds.map(async r => {
        const qs = await Store.getQuestionsByInterview(r.id);
        return qs.map(q => ({
          ...q,
          roundId:   r.id,
          roundName: r.round,
          roundDate: r.date,
        }));
      }));
      const allQs = allRoundsQs.flat();

    // Unique rounds & topics for filter dropdowns
    const roundNames = [...new Set(rounds.map(r => r.round))].filter(Boolean);
    const topics     = [...new Set(allQs.map(q => q.topic))].filter(Boolean);

    el.innerHTML = `
      <!-- Top Nav -->
      <div class="dv-topbar">
        <button class="dv-back-btn" id="cq-back">
          ${Icons.chevronLeft(18)} <span>${Utils.escapeHtml(companyName)}</span>
        </button>
        <div class="dv-topbar-actions">
          ${allQs.length > 0 ? `
          <button class="dv-action-btn" id="cq-print-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print PDF
          </button>` : ''}
        </div>
      </div>

      <!-- Main Container -->
      <div class="cq-container">
        <!-- Header -->
        <div class="cq-header">
          <div class="dv-avatar" style="background:${color}">${initials}</div>
          <div>
            <h1 class="cq-title">${Utils.escapeHtml(companyName)} — All Questions</h1>
            <div class="cq-sub">${allQs.length} question${allQs.length !== 1 ? 's' : ''} across ${rounds.length} round${rounds.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="cq-filter-bar">
          <div class="cq-search-box">
            ${Icons.search(16)}
            <input type="text" class="cq-search-input" id="cq-search" placeholder="Search questions or notes…" />
          </div>

          <div class="cq-filters-row">
            <div class="dv-filter-group">
              <label class="dv-filter-label" for="cq-filter-round">Round:</label>
              <select class="dv-filter-select" id="cq-filter-round">
                <option value="ALL">All Rounds</option>
                ${roundNames.map(r => `<option value="${Utils.escapeHtml(r)}">${Utils.escapeHtml(r)}</option>`).join('')}
              </select>
            </div>

            <div class="dv-filter-group">
              <label class="dv-filter-label" for="cq-filter-topic">Topic:</label>
              <select class="dv-filter-select" id="cq-filter-topic">
                <option value="ALL">All Topics</option>
                ${topics.map(t => `<option value="${Utils.escapeHtml(t)}">${Utils.escapeHtml(t)}</option>`).join('')}
              </select>
            </div>

            <div class="dv-filter-group">
              <label class="dv-filter-label" for="cq-filter-status">Status:</label>
              <select class="dv-filter-select" id="cq-filter-status">
                <option value="ALL">All Statuses</option>
                <option value="Answered">Answered</option>
                <option value="Not Answered">Not Answered</option>
                <option value="Not Sure">Not Sure</option>
              </select>
            </div>

            <div class="dv-filter-group">
              <label class="dv-filter-label" for="cq-sort">Sort:</label>
              <select class="dv-filter-select" id="cq-sort">
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Questions Count / Filter Status -->
        <div class="cq-status-bar" id="cq-status-bar">
          Showing <span id="cq-visible-count">${allQs.length}</span> of ${allQs.length} questions
        </div>

        <!-- Questions List -->
        <div class="cq-list" id="cq-list">
          ${allQs.map(q => renderQuestionCard(q)).join('')}
        </div>
      </div>
    `;

    bindEvents(el, companyName, allQs);

    } catch (e) {
      console.error(e);
      el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--c-red);">Failed to load questions.</div>`;
    }
  }

  function renderQuestionCard(q) {
    const status = VALID_STATUSES.includes(q.status) ? q.status : 'Answered';
    const statusCls = status === 'Answered' ? 'sq-badge-green' : status === 'Not Answered' ? 'sq-badge-red' : 'sq-badge-orange';

    return `
      <div class="cq-q-card" data-qid="${q.id}" data-round-id="${q.roundId}">
        <div class="cq-q-header">
          <div class="cq-q-text">${Utils.escapeHtml(q.question)}</div>
        </div>
        <div class="cq-q-meta">
          <span class="sq-status-badge ${statusCls}">${status}</span>
          ${q.topic ? `<span class="sq-topic-badge">${Utils.escapeHtml(q.topic)}</span>` : ''}
          <span class="cq-round-badge pressable" data-goto-detail="${q.roundId}">
            ${Icons.briefcase(11)} ${Utils.escapeHtml(q.roundName)} · ${Utils.formatDate(q.roundDate)}
          </span>
        </div>
        ${q.notes ? `<div class="cq-q-notes">${Utils.escapeHtml(q.notes)}</div>` : ''}
      </div>`;
  }

  function bindEvents(el, companyName, allQs) {
    // Back to Company Detail
    el.querySelector('#cq-back').addEventListener('click', () => {
      Router.push(`company/${encodeURIComponent(companyName)}`);
    });

    // Print
    el.querySelector('#cq-print-btn')?.addEventListener('click', () => {
      printFilteredQuestions(companyName, getFilteredQuestions(el, allQs));
    });

    // Navigate to round detail when clicking round badge
    el.querySelectorAll('[data-goto-detail]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Router.push(`detail/${btn.dataset.gotoDetail}`);
      });
    });

    // Filters & Search handlers
    const searchInput  = el.querySelector('#cq-search');
    const roundSelect  = el.querySelector('#cq-filter-round');
    const topicSelect  = el.querySelector('#cq-filter-topic');
    const statusSelect = el.querySelector('#cq-filter-status');
    const sortSelect   = el.querySelector('#cq-sort');

    function updateView() {
      const filtered = getFilteredQuestions(el, allQs);
      const listEl   = el.querySelector('#cq-list');
      const countEl  = el.querySelector('#cq-visible-count');

      if (countEl) countEl.textContent = filtered.length;

      if (!filtered.length) {
        listEl.innerHTML = `<div class="sq-empty-filter">No questions match your search or filter settings.</div>`;
      } else {
        listEl.innerHTML = filtered.map(q => renderQuestionCard(q)).join('');
        listEl.querySelectorAll('[data-goto-detail]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            Router.push(`detail/${btn.dataset.gotoDetail}`);
          });
        });
      }
    }

    searchInput?.addEventListener('input', Utils.debounce(updateView, 180));
    roundSelect?.addEventListener('change', updateView);
    topicSelect?.addEventListener('change', updateView);
    statusSelect?.addEventListener('change', updateView);
    sortSelect?.addEventListener('change', updateView);
  }

  function getFilteredQuestions(el, allQs) {
    const query    = (el.querySelector('#cq-search')?.value || '').trim().toLowerCase();
    const roundVal = el.querySelector('#cq-filter-round')?.value || 'ALL';
    const topicVal = el.querySelector('#cq-filter-topic')?.value || 'ALL';
    const statusVal= el.querySelector('#cq-filter-status')?.value || 'ALL';
    const sortVal  = el.querySelector('#cq-sort')?.value || 'NEWEST';

    let result = allQs.filter(q => {
      const matchSearch = !query ||
        (q.question || '').toLowerCase().includes(query) ||
        (q.notes    || '').toLowerCase().includes(query) ||
        (q.topic    || '').toLowerCase().includes(query);

      const matchRound  = roundVal === 'ALL' || q.roundName === roundVal;
      const matchTopic  = topicVal === 'ALL' || q.topic === topicVal;
      const status      = VALID_STATUSES.includes(q.status) ? q.status : 'Answered';
      const matchStatus = statusVal === 'ALL' || status === statusVal;

      return matchSearch && matchRound && matchTopic && matchStatus;
    });

    if (sortVal === 'NEWEST') {
      result.sort((a, b) => new Date(b.roundDate) - new Date(a.roundDate));
    } else {
      result.sort((a, b) => new Date(a.roundDate) - new Date(b.roundDate));
    }

    return result;
  }

  function printFilteredQuestions(companyName, questions) {
    const sColor = { 'Answered':'#1a7f3c','Not Answered':'#c0392b','Not Sure':'#b8600a' };
    const sBg    = { 'Answered':'#d4edda','Not Answered':'#f8d7da','Not Sure':'#fff3cd' };

    const rows = questions.map((q, i) => {
      const status = VALID_STATUSES.includes(q.status) ? q.status : 'Answered';
      const topic  = q.topic || 'General';
      return `
        <tr>
          <td style="padding:10px 14px;vertical-align:top;font-size:13px;line-height:1.6;color:#1a1a1a;border-bottom:1px solid #e5e7eb;white-space:pre-wrap;">
            <span style="color:#9ca3af;font-size:11px;font-weight:600;display:block;margin-bottom:3px;">Q${i + 1} · ${Utils.escapeHtml(q.roundName)} (${Utils.formatDate(q.roundDate)})</span>
            ${Utils.escapeHtml(q.question || '')}
          </td>
          <td style="padding:10px 14px;vertical-align:top;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
            <span style="display:inline-block;background:#e8f0fe;color:#1a56db;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;">${topic}</span>
          </td>
          <td style="padding:10px 14px;vertical-align:top;border-bottom:1px solid #e5e7eb;white-space:nowrap;">
            <span style="display:inline-block;background:${sBg[status]||'#eee'};color:${sColor[status]||'#555'};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;">${status}</span>
          </td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${companyName} — Questions List</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#1a1a1a;padding:40px}
    h1{font-size:22px;font-weight:700;color:#111;margin-bottom:4px}
    .meta{font-size:12px;color:#6b7280;margin-bottom:28px}
    table{width:100%;border-collapse:collapse}
    thead th{background:#f3f4f6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;padding:10px 14px;text-align:left;border-bottom:2px solid #e5e7eb}
    tbody tr:last-child td{border-bottom:none}
    @media print{body{padding:20px}@page{margin:18mm 15mm}}
  </style>
</head>
<body>
  <h1>${companyName} — Questions List</h1>
  <div class="meta">${questions.length} question${questions.length!==1?'s':''} · Printed ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
  <table>
    <thead><tr><th style="width:60%">Question</th><th style="width:20%">Topic</th><th style="width:20%">Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=820,height=700');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

  return { render };
})();
