/* ===================================================
   INTERVIEW JOURNAL — Add / Edit Interview View
   Company-aware: detects existing companies and prompts
   to add a new round instead of duplicating.
   =================================================== */

window.AddInterviewView = (() => {
  let questionCounter = 0;
  let editId = null;

  const ROUNDS = [
    'Online Assessment',
    'Technical Round 1',
    'Technical Round 2',
    'Culture Fit',
    'HR',
    'Techno-Managerial'
  ];

  const TOPICS = [
    'Python',
    'PySpark',
    'SQL',
    'System Design',
    'Spark Concept',
    'Project Related',
    'DE Concept',
    'Databricks',
    'Behavioural',
    'Other'
  ];

  const QUESTION_STATUSES = [
    { value: 'Answered',    label: '✓ Answered',     cls: 'chip-success' },
    { value: 'Not Answered',label: '✕ Not Answered', cls: 'chip-danger'  },
    { value: 'Not Sure',    label: '½ Not Sure',      cls: 'chip-warning' },
  ];

  const MODES    = ['Online', 'Onsite'];
  const DURATIONS = [15, 30, 45, 60, 75, 90, 120];
  const OUTCOMES = [
    { value: 'In Progress', label: '⏳ In Progress', cls: 'chip-warning' },
    { value: 'Passed',      label: '✓ Passed',      cls: 'chip-success' },
    { value: 'Rejected',    label: '✕ Rejected',    cls: 'chip-danger'  },
    { value: 'Upcoming',    label: '📅 Upcoming',    cls: 'chip-accent'  },
    { value: 'Ghosted',     label: '👻 Ghosted',     cls: 'chip-neutral' },
    { value: 'On Hold',     label: '⏸️ On Hold',     cls: 'chip-accent'  },
  ];

  async function render({ el, params }) {
    el.innerHTML = `<div style="height:100dvh; display:flex; align-items:center; justify-content:center; color:var(--c-text-3); font-size:var(--fs-subhead);">Loading form...</div>`;

    editId = params.id || null;
    questionCounter = 0;

    try {
      const [existing, existingQuestions, companies] = await Promise.all([
        editId ? Store.getInterview(editId) : Promise.resolve(null),
        editId ? Store.getQuestionsByInterview(editId) : Promise.resolve([]),
        Store.getCompanies()
      ]);

      // Pre-fill company if coming from Company Detail "Add Round" button
      const prefilledCompany  = params.company ? decodeURIComponent(params.company) : '';

      const today = Utils.toDateString(new Date());
      const i = existing || {};
      const defaultCompany = i.company || prefilledCompany || '';

      // Build datalist of existing company names for autocomplete
      const existingCompanies = companies.map(c => c.name);

    el.innerHTML = `
      <div class="add-view">
        <!-- Header -->
        <div class="add-header">
          <button class="btn btn-ghost btn-sm" id="add-cancel-btn" style="padding:8px 0">Cancel</button>
          <div class="add-header-title">${editId ? 'Edit Interview' : 'New Interview Round'}</div>
          <button class="btn btn-primary btn-sm" id="add-save-btn">Save</button>
        </div>

        <div class="add-form">

          <!-- Company -->
          <div class="form-section">
            <div class="form-section-title">Company</div>
            <div class="form-card">
              <div class="input-group" style="margin-bottom:0">
                <label class="input-label" for="f-company">Company Name *</label>
                <input class="input" id="f-company" type="text"
                  placeholder="e.g. Google, InfoObjects, Amazon"
                  value="${Utils.escapeHtml(defaultCompany)}"
                  autocomplete="off"
                  list="company-datalist" />
                <datalist id="company-datalist">
                  ${existingCompanies.map(n => `<option value="${Utils.escapeHtml(n)}">`).join('')}
                </datalist>
              </div>
              <!-- Company exists notice (shown dynamically) -->
              <div class="add-company-notice hidden" id="add-company-notice">
                <span class="add-company-notice-icon">${Icons.building(14)}</span>
                <span id="add-company-notice-text"></span>
              </div>
            </div>
          </div>

          <!-- Schedule & Round -->
          <div class="form-section">
            <div class="form-section-title">Schedule & Round</div>
            <div class="form-card">
              <div class="input-row" style="margin-bottom:var(--sp-4)">
                <div class="input-group" style="margin-bottom:0">
                  <label class="input-label" for="f-date">Date *</label>
                  <input class="input" id="f-date" type="date" value="${i.date || today}" />
                </div>
                <div class="input-group" style="margin-bottom:0">
                  <label class="input-label" for="f-time">Time</label>
                  <input class="input" id="f-time" type="time" value="${i.time || '10:00'}" />
                </div>
              </div>

              <div class="input-row">
                <div class="input-group" style="margin-bottom:0">
                  <label class="input-label" for="f-round">Round</label>
                  <select class="input" id="f-round">
                    ${ROUNDS.map(r => `<option value="${r}" ${i.round === r ? 'selected' : ''}>${r}</option>`).join('')}
                  </select>
                </div>
                <div class="input-group" style="margin-bottom:0">
                  <label class="input-label" for="f-duration">Duration</label>
                  <select class="input" id="f-duration">
                    ${DURATIONS.map(d => `<option value="${d}" ${Number(i.duration) === d ? 'selected' : ''}>${d} min</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Details -->
          <div class="form-section">
            <div class="form-section-title">Details</div>
            <div class="form-card">
              <div class="input-group">
                <label class="input-label">Interview Mode</label>
                <div class="chip-group" id="f-mode-chips">
                  ${MODES.map(m => `
                    <div class="chip ${i.mode === m || (!i.mode && m === 'Online') ? 'active' : ''}" data-mode="${m}">${m}</div>
                  `).join('')}
                </div>
              </div>
              <div class="input-group">
                <label class="input-label" for="f-interviewer">Interviewer Name</label>
                <input class="input" id="f-interviewer" type="text" placeholder="Optional"
                  value="${Utils.escapeHtml(i.interviewer || '')}" />
              </div>
              <div class="input-group" id="f-location-group" style="margin-bottom:0">
                <label class="input-label" for="f-location">Company Location</label>
                <select class="input" id="f-location">
                  ${[
                    '',
                    'Mumbai, Maharashtra',
                    'Pune, Maharashtra',
                    'Bhubaneswar, Odisha',
                    'Hyderabad, Telangana',
                    'Bangalore, Karnataka',
                    'Chandigarh',
                    'Jaipur, Rajasthan',
                    'Delhi',
                    'Gurgaon, Haryana',
                    'Kolkata, West Bengal',
                    'Chennai, Tamil Nadu'
                  ].map(loc => `<option value="${loc}" ${i.location === loc ? 'selected' : ''}>${loc || 'Select location...'}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>

          <!-- Outcome -->
          <div class="form-section">
            <div class="form-section-title">Outcome</div>
            <div class="form-card">
              <div class="input-group" style="margin-bottom:0">
                <label class="input-label">Result</label>
                <div class="chip-group" id="f-outcome-chips">
                  ${OUTCOMES.map(o => {
                    // Treat old 'Pending' data as 'In Progress' for display
                    const normalizedOutcome = (i.outcome === 'Pending') ? 'In Progress' : i.outcome;
                    const isActive = normalizedOutcome === o.value || (!i.outcome && o.value === 'In Progress');
                    return `
                      <div class="chip ${o.cls} ${isActive ? 'active' : ''}"
                        data-outcome="${o.value}">${o.label}</div>`;
                  }).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="form-section">
            <div class="form-section-title">Notes</div>
            <div class="form-card">
              <div class="input-group" style="margin-bottom:0">
                <label class="input-label" for="f-notes">Personal Notes</label>
                <textarea class="input" id="f-notes" placeholder="How did it go? Overall thoughts…"
                  style="min-height:90px">${Utils.escapeHtml(i.notes || '')}</textarea>
              </div>
            </div>
          </div>

          <!-- Questions -->
          <div class="form-section">
            <div class="form-section-title">Questions Asked</div>
            <div id="question-cards-container" class="question-cards-container">
              ${existingQuestions.map(q => buildQuestionCard(q)).join('')}
            </div>
            <button class="add-question-btn" id="add-question-btn">
              ${Icons.plus(18)} Add Question
            </button>
          </div>

        </div>
      </div>
    `;

    // ── Mode chips ───
    el.querySelectorAll('#f-mode-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        el.querySelectorAll('#f-mode-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    // ── Outcome chips ───
    el.querySelectorAll('#f-outcome-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        el.querySelectorAll('#f-outcome-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    // ── Company exists detection ───
    const companyInput = el.querySelector('#f-company');
    const notice       = el.querySelector('#add-company-notice');
    const noticeText   = el.querySelector('#add-company-notice-text');

    async function checkCompany() {
      const locationGroup = el.querySelector('#f-location-group');
      const val = companyInput.value.trim();
      
      if (!val) { 
        notice.classList.add('hidden'); 
        locationGroup.style.display = 'block';
        return; 
      }
      
      const canonical = await Store.findCompany(val);
      if (canonical) {
        if (!editId) {
          const rounds = await Store.getCompanyRounds(canonical);
          noticeText.textContent = `"${canonical}" already tracked (${rounds.length} round${rounds.length !== 1 ? 's' : ''}) — this will add a new round.`;
          notice.classList.remove('hidden');
        }
        // Company exists, hide company-level location input
        locationGroup.style.display = 'none';
      } else {
        notice.classList.add('hidden');
        locationGroup.style.display = 'block';
      }
    }

    companyInput.addEventListener('input', Utils.debounce(checkCompany, 250));
    // Check immediately if pre-filled
    if (defaultCompany) setTimeout(checkCompany, 0);

    // ── Add question ───
    el.querySelector('#add-question-btn').addEventListener('click', () => {
      const container = el.querySelector('#question-cards-container');
      const card = document.createElement('div');
      card.innerHTML = buildQuestionCard();
      container.appendChild(card.firstElementChild);
      bindQuestionCard(container.lastElementChild, el);
      container.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    // ── Bind existing question cards ───
    el.querySelectorAll('.question-form-card').forEach(card => bindQuestionCard(card, el));

    // ── Navigation ───
    el.querySelector('#add-cancel-btn').addEventListener('click', () => Router.back());
    el.querySelector('#add-save-btn').addEventListener('click', (e) => saveInterview(el, e.target));

    } catch (e) {
      console.error(e);
      el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--c-red);">Failed to load form.</div>`;
    }
  }

  function buildQuestionCard(q = {}) {
    questionCounter++;
    const n = questionCounter;
    const currentTopic  = q.topic  || TOPICS[0];
    const currentStatus = q.status || 'Answered';

    return `
      <div class="question-form-card" data-question-id="${q.id || ''}">
        <div class="question-form-card-header">
          <span class="question-form-num">Question ${n}</span>
          <button class="question-remove-btn" aria-label="Remove question">✕</button>
        </div>
        <div class="input-group">
          <label class="input-label">Question Text *</label>
          <textarea class="input qf-question" placeholder="Enter question asked…"
            style="min-height:72px">${Utils.escapeHtml(q.question || '')}</textarea>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
          <div class="input-group" style="margin-bottom:0">
            <label class="input-label">Topic</label>
            <select class="input qf-topic">
              ${TOPICS.map(t => `<option value="${t}" ${currentTopic === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>

          <div class="input-group" style="margin-bottom:0">
            <label class="input-label">Answer Status</label>
            <div class="chip-group qf-status-chips" style="flex-wrap:wrap">
              ${QUESTION_STATUSES.map(s => `
                <div class="chip ${s.cls} ${currentStatus === s.value ? 'active' : ''}"
                  data-status="${s.value}">${s.label}</div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="input-group" style="margin-bottom:0">
          <label class="input-label">Notes & Solution Highlights</label>
          <textarea class="input qf-notes" placeholder="Key points to revise, correct approach…"
            style="min-height:56px">${Utils.escapeHtml(q.notes || '')}</textarea>
        </div>
      </div>
    `;
  }

  function bindQuestionCard(card, el) {
    card.querySelector('.question-remove-btn').addEventListener('click', () => {
      card.style.animation = 'fadeInScale 0.2s var(--ease-out) reverse both';
      setTimeout(() => card.remove(), 200);
    });

    card.querySelectorAll('.qf-status-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        card.querySelectorAll('.qf-status-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });
  }

  async function saveInterview(el, btn) {
    const company = el.querySelector('#f-company').value.trim();
    if (!company) {
      el.querySelector('#f-company').focus();
      el.querySelector('#f-company').style.borderColor = 'var(--c-red)';
      Toast.show('Company name is required', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
      // Use canonical company name if it already exists (preserves original casing)
      const canonicalCompany = (await Store.findCompany(company)) || company;

      const interviewData = {
        id:          editId || undefined, // undefined for insert
        company:     canonicalCompany,
        date:        el.querySelector('#f-date').value,
        time:        el.querySelector('#f-time').value,
        round:       el.querySelector('#f-round').value,
        duration:    Number(el.querySelector('#f-duration').value),
        mode:        el.querySelector('#f-mode-chips .chip.active')?.dataset.mode || 'Online',
        interviewer: el.querySelector('#f-interviewer').value.trim(),
        location:    el.querySelector('#f-location').value.trim(),
        outcome:     el.querySelector('#f-outcome-chips .chip.active')?.dataset.outcome || 'Pending',
        notes:       el.querySelector('#f-notes').value.trim(),
      };

      const savedId = await Store.saveInterview(interviewData);

      // Save questions
      const questionCards = el.querySelectorAll('.question-form-card');
      const questionsData = [];
      questionCards.forEach(card => {
        const text = card.querySelector('.qf-question').value.trim();
        if (!text) return;
        questionsData.push({
          id:       card.dataset.questionId || undefined,
          question: text,
          topic:    card.querySelector('.qf-topic').value,
          status:   card.querySelector('.qf-status-chips .chip.active')?.dataset.status || 'Answered',
          notes:    card.querySelector('.qf-notes').value.trim(),
        });
      });

      await Store.saveQuestions(savedId, questionsData);

      Toast.show(editId ? 'Round updated!' : 'Interview round saved!', 'success');
      // Navigate to company detail page instead of interview detail
      Router.replace(`company/${encodeURIComponent(canonicalCompany)}`);
    } catch (e) {
      console.error(e);
      Toast.show('Failed to save interview.', 'error');
      btn.disabled = false;
      btn.textContent = 'Save';
    }
  }

  return { render };
})();
