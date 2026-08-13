/* ===================================================
   INTERVIEW JOURNAL — All Questions View
   Dedicated page for browsing, searching, and filtering
   all questions across all interviews.
   =================================================== */

window.QuestionsView = (() => {
  const VALID_STATUSES = ['Answered', 'Not Answered', 'Not Sure'];

  const TOPIC_PRIORITY = {
    'python': 1,
    'sql': 2,
    'pyspark': 3,
    'spark concept': 4,
    'de concept': 5,
    'databricks project related': 6,
    'system design': 7,
    'behavioural': 8
  };

  function getTopicPriority(topic) {
    if (!topic) return 99;
    const lower = topic.trim().toLowerCase();
    return TOPIC_PRIORITY[lower] || 99;
  }

  async function render({ el }) {
    el.innerHTML = `<div style="height:100dvh; display:flex; align-items:center; justify-content:center; color:var(--c-text-3); font-size:var(--fs-subhead);">Loading questions...</div>`;

    try {
      const [questions, interviews] = await Promise.all([
        Store.getAllQuestions(),
        Store.getAllInterviews()
      ]);

    // Build interview lookup for resolving company details
    const interviewMap = {};
    interviews.forEach(i => {
      interviewMap[i.id] = i;
    });

    // Decorate questions with interview context
    const allQs = questions.map(q => {
      const interview = interviewMap[q.interview_id] || {};
      return {
        ...q,
        companyName: interview.company || q.company || 'Unknown Company',
        roundName:   interview.round   || '',
        roundDate:   interview.date    || '',
      };
    }).sort((a, b) => {
      const pA = getTopicPriority(a.topic);
      const pB = getTopicPriority(b.topic);
      if (pA !== pB) return pA - pB;
      return new Date(b.roundDate) - new Date(a.roundDate);
    });

    // Unique values for filter dropdowns
    const companies = [...new Set(allQs.map(q => q.companyName))].filter(Boolean).sort();
    const topics    = [...new Set(allQs.map(q => q.topic))].filter(Boolean).sort();

    el.innerHTML = `
      <!-- Top Nav -->
      <!-- Top Nav & Header in one compact block -->
      <div class="questions-glass-header">
        <div class="cq-header-content">
          <!-- Title & Actions Row -->
          <div class="cq-title-row">
            <div>
              <h1 class="cq-title">Questions</h1>
              <div class="cq-sub">Browse <span id="q-count-label" style="font-weight:600;color:var(--c-text)">${allQs.length}</span> recorded questions</div>
            </div>
            <button id="btn-export-pdf" class="btn-primary btn-sm" style="border-radius: var(--r-full); padding: 4px 12px; gap: 4px;">
              ${Icons.share(14)} Export PDF
            </button>
          </div>

          <!-- Unified Glass Filter Bar -->
          <div class="cq-unified-filter-bar">
            <div class="cq-search-box">
              ${Icons.search(16)}
              <input type="text" class="cq-search-input" id="q-search" placeholder="Search questions..." />
            </div>
            <div class="cq-filters-row">
              <select class="cq-filter-dropdown" id="q-filter-company">
                <option value="ALL">Company</option>
                ${companies.map(c => `<option value="${Utils.escapeHtml(c)}">${Utils.escapeHtml(c)}</option>`).join('')}
              </select>
              <select class="cq-filter-dropdown" id="q-filter-topic">
                <option value="ALL">Topic</option>
                ${topics.map(t => `<option value="${Utils.escapeHtml(t)}">${Utils.escapeHtml(t)}</option>`).join('')}
              </select>
              <select class="cq-filter-dropdown" id="q-filter-status">
                <option value="ALL">Status</option>
                ${VALID_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="cq-container">

          <!-- Questions List -->
          <div class="cq-list" id="q-list">
            ${allQs.map((q, idx) => renderQuestionCard(q, idx)).join('')}
            ${allQs.length === 0 ? `
              <div class="empty-state">
                <div class="empty-icon">${Icons.messageCircle(40)}</div>
                <div class="empty-title">No questions yet</div>
                <div class="empty-subtitle">Add questions to an interview round to see them here.</div>
              </div>
            ` : ''}
          </div>
          
          <div id="q-no-results" class="hidden empty-state" style="padding:40px 0;">
            <div class="empty-icon">${Icons.search(32)}</div>
            <div class="empty-title">No matches found</div>
            <div class="empty-subtitle">Try adjusting your search or filters.</div>
          </div>
        </div>
    `;

    // ── Logic ─────────────────────────────────────────────
    const searchInp = el.querySelector('#q-search');
    const compSel   = el.querySelector('#q-filter-company');
    const topicSel  = el.querySelector('#q-filter-topic');
    const statusSel = el.querySelector('#q-filter-status');
    const list      = el.querySelector('#q-list');
    const noRes     = el.querySelector('#q-no-results');
    const countL    = el.querySelector('#q-count-label');

    function applyFilters() {
      const qText = searchInp.value.toLowerCase().trim();
      const compF = compSel.value;
      const topF  = topicSel.value;
      const staF  = statusSel.value;

      let visible = 0;

      el.querySelectorAll('.cq-q-card').forEach(card => {
        let show = true;
        if (compF !== 'ALL' && card.dataset.company !== compF) show = false;
        if (topF !== 'ALL' && card.dataset.topic !== topF) show = false;
        if (staF !== 'ALL' && card.dataset.status !== staF) show = false;
        if (qText && !card.dataset.search.includes(qText)) show = false;

        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });

      countL.textContent = visible;
      
      if (allQs.length > 0) {
        if (visible === 0) {
          list.style.display = 'none';
          noRes.classList.remove('hidden');
        } else {
          list.style.display = 'flex';
          noRes.classList.add('hidden');
        }
      }
    }

    searchInp?.addEventListener('input', applyFilters);
    compSel?.addEventListener('change', applyFilters);
    topicSel?.addEventListener('change', applyFilters);
    statusSel?.addEventListener('change', applyFilters);
    
    el.querySelector('#btn-export-pdf')?.addEventListener('click', () => {
      window.print();
    });

    } catch (e) {
      console.error(e);
      el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--c-red);">Failed to load questions.</div>`;
    }
  }

  function renderQuestionCard(q, idx) {
    const isAns = q.status === 'Answered';
    const isNotAns = q.status === 'Not Answered';
    const statusCls = isAns ? 'sq-badge-green' : isNotAns ? 'sq-badge-red' : 'sq-badge-orange';
    
    const searchText = `${q.question} ${q.notes || ''} ${q.topic || ''} ${q.companyName || ''}`.toLowerCase();

    return `
      <div class="cq-q-card" data-idx="${idx}" data-company="${Utils.escapeHtml(q.companyName)}" data-topic="${Utils.escapeHtml(q.topic || '')}" data-status="${q.status}" data-search="${Utils.escapeHtml(searchText)}">
        <div class="cq-q-header">
          <div class="cq-q-text"><span style="color:var(--c-text-3); font-weight:var(--fw-semibold); font-size:var(--fs-footnote); margin-right:6px;">Q${idx + 1}</span>${Utils.escapeHtml(q.question)}</div>
        </div>
        <div class="cq-q-meta">
          <span class="sq-status-badge ${statusCls}">${q.status}</span>
          ${q.topic ? `<span class="sq-topic-badge">${Utils.escapeHtml(q.topic)}</span>` : ''}
          <span class="cq-round-badge pressable" onclick="Router.push('detail/${q.interview_id}')">
            ${Utils.escapeHtml(q.companyName)}
          </span>
        </div>
        ${q.notes ? `<div class="cq-q-notes">${Utils.escapeHtml(q.notes).replace(/\n/g, '<br>')}</div>` : ''}
      </div>
    `;
  }

  return { render };
})();
