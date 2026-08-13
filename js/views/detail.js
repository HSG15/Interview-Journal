/* ===================================================
   INTERVIEW JOURNAL — Interview Detail View
   Two-column desktop layout: sticky sidebar + scrollable questions
   =================================================== */

window.DetailView = (() => {

  const VALID_STATUSES  = ['Answered', 'Not Answered', 'Not Sure'];
  const TOPICS = [
    'Python','PySpark','SQL','System Design',
    'Spark Concept','Project Related','DE Concept','Databricks','Behavioural','Other'
  ];

  // ── Status helpers ───────────────────────────────────
  function normaliseStatus(q) {
    return VALID_STATUSES.includes(q.status) ? q.status : 'Answered';
  }

  function statusBadgeClass(status) {
    switch (status) {
      case 'Answered':     return 'sq-badge-green';
      case 'Not Answered': return 'sq-badge-red';
      case 'Not Sure':     return 'sq-badge-orange';
      default:             return 'sq-badge-green';
    }
  }

  function statusChipClass(status) {
    switch (status) {
      case 'Answered':     return 'chip-success';
      case 'Not Answered': return 'chip-danger';
      case 'Not Sure':     return 'chip-warning';
      default:             return 'chip-success';
    }
  }

  function modeIcon(mode) {
    switch (mode) {
      case 'Online':  return Icons.video(14);
      case 'Onsite':  return Icons.building(14);
      default:        return '';
    }
  }

  function outcomeClass(outcome) {
    switch (outcome) {
      case 'Passed':   return 'outcome-passed';
      case 'Rejected': return 'outcome-rejected';
      case 'Pending':  return 'outcome-pending';
      default:         return 'outcome-pending';
    }
  }

  // ── Render ───────────────────────────────────────────
  async function render({ el, params }) {
    const { id } = params;
    
    el.innerHTML = `<div style="height:100dvh; display:flex; align-items:center; justify-content:center; color:var(--c-text-3); font-size:var(--fs-subhead);">Loading details...</div>`;

    try {
      const interview = await Store.getInterview(id);

      if (!interview) {
        el.innerHTML = `
          <div class="detail-empty-page">
            <div class="detail-empty-icon">${Icons.briefcase(48)}</div>
            <div class="detail-empty-title">Interview not found</div>
            <button class="btn btn-secondary" onclick="Router.push('home')">Go Home</button>
          </div>`;
        return;
      }

      await drawView(el, id, interview);
    } catch (e) {
      console.error(e);
      el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--c-red);">Failed to load interview details.</div>`;
    }
  }

  async function drawView(el, id, interview) {
    const questions = await Store.getQuestionsByInterview(id);
    const color     = Utils.getCompanyColor(interview.company);
    const initials  = Utils.getCompanyInitials(interview.company);
    const answered  = questions.filter(q => normaliseStatus(q) === 'Answered').length;
    const notAns    = questions.filter(q => normaliseStatus(q) === 'Not Answered').length;
    const notSure   = questions.filter(q => normaliseStatus(q) === 'Not Sure').length;

    el.innerHTML = `
      <!-- Top Nav -->
      <div class="dv-topbar">
        <button class="dv-back-btn" id="dv-back">
          ${Icons.chevronLeft(18)}
          <span>Back</span>
        </button>
        <div class="dv-topbar-actions">
          ${questions.length > 0 ? `
          <button class="dv-action-btn dv-print-btn" id="dv-print">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print PDF
          </button>` : ''}
          <button class="dv-icon-btn" id="dv-edit" title="Edit Interview">${Icons.edit(16)}</button>
          <button class="dv-icon-btn dv-icon-btn-danger" id="dv-delete" title="Delete Interview">${Icons.trash(16)}</button>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="dv-layout">

        <!-- LEFT: Interview Summary Sidebar -->
        <aside class="dv-sidebar">
          <div class="dv-summary-card">
            <!-- Company Avatar + Name -->
            <div class="dv-company-row">
              <div class="dv-avatar" style="background:${color}">${initials}</div>
              <div class="dv-company-info">
                <div class="dv-company-name">${Utils.escapeHtml(interview.company)}</div>
                <div class="dv-round-label">${Utils.escapeHtml(interview.round || '')}</div>
              </div>
            </div>

            <!-- Outcome Badge + Edit Company Details button -->
            <div class="dv-outcome-row" style="display:flex;align-items:center;justify-content:space-between">
              <span class="dv-outcome-badge ${outcomeClass(interview.outcome)}">
                ${Utils.getOutcomeIcon(interview.outcome)}
                ${interview.outcome || 'Pending'}
              </span>
              <button class="dv-edit-company-btn" id="dv-edit-company" title="Edit Company Details">
                ${Icons.edit(13)} Edit Details
              </button>
            </div>

            <!-- Meta grid -->
            <div class="dv-meta-divider"></div>
            <div class="dv-meta-grid">
              <div class="dv-meta-item">
                <div class="dv-meta-label">Date</div>
                <div class="dv-meta-value">${Utils.formatDate(interview.date)}</div>
              </div>
              ${interview.time ? `
              <div class="dv-meta-item">
                <div class="dv-meta-label">Time</div>
                <div class="dv-meta-value">${Utils.formatTime(interview.time)}</div>
              </div>` : ''}
              <div class="dv-meta-item">
                <div class="dv-meta-label">Mode</div>
                <div class="dv-meta-value dv-meta-icon-val">${modeIcon(interview.mode)} ${interview.mode || '—'}</div>
              </div>
              <div class="dv-meta-item">
                <div class="dv-meta-label">Duration</div>
                <div class="dv-meta-value">${Utils.formatDuration(interview.duration)}</div>
              </div>
              ${interview.interviewer ? `
              <div class="dv-meta-item">
                <div class="dv-meta-label">Interviewer</div>
                <div class="dv-meta-value">${Utils.escapeHtml(interview.interviewer)}</div>
              </div>` : ''}
              ${interview.location ? `
              <div class="dv-meta-item">
                <div class="dv-meta-label">Location</div>
                <div class="dv-meta-value">${Utils.escapeHtml(interview.location)}</div>
              </div>` : ''}
            </div>

            <!-- Stats row -->
            ${questions.length > 0 ? `
            <div class="dv-meta-divider"></div>
            <div class="dv-stats-row">
              <div class="dv-stat-item">
                <div class="dv-stat-num dv-stat-green">${answered}</div>
                <div class="dv-stat-label">Answered</div>
              </div>
              <div class="dv-stat-item">
                <div class="dv-stat-num dv-stat-red">${notAns}</div>
                <div class="dv-stat-label">Not Answered</div>
              </div>
              <div class="dv-stat-item">
                <div class="dv-stat-num dv-stat-orange">${notSure}</div>
                <div class="dv-stat-label">Not Sure</div>
              </div>
            </div>` : ''}

            <!-- Notes -->
            ${interview.notes ? `
            <div class="dv-meta-divider"></div>
            <div class="dv-notes-section">
              <div class="dv-notes-label">Notes</div>
              <div class="dv-notes-body">${Utils.escapeHtml(interview.notes)}</div>
            </div>` : ''}
          </div>
        </aside>

        <!-- RIGHT: Questions Panel -->
        <div class="dv-questions-panel">
          <div class="dv-questions-header">
            <div class="dv-questions-title">Questions <span class="dv-q-count">${questions.length}</span></div>
            <button class="dv-add-q-btn" id="dv-add-q">
              ${Icons.plus(14)} Add Question
            </button>
          </div>

          <!-- Topic & Status Filter Bar -->
          <div class="dv-filter-bar">
            <div class="dv-filter-group">
              <label class="dv-filter-label" for="dv-filter-topic">Topic:</label>
              <select class="dv-filter-select" id="dv-filter-topic">
                <option value="ALL">All Topics</option>
                ${TOPICS.map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>
            <div class="dv-filter-group">
              <label class="dv-filter-label" for="dv-filter-status">Status:</label>
              <select class="dv-filter-select" id="dv-filter-status">
                <option value="ALL">All Statuses</option>
                <option value="Answered">Answered</option>
                <option value="Not Answered">Not Answered</option>
                <option value="Not Sure">Not Sure</option>
              </select>
            </div>
          </div>

          <div class="dv-q-list" id="dv-q-list">
            ${questions.length
              ? questions.map(q => renderQuestionCard(q)).join('')
              : renderEmptyState()
            }
          </div>
        </div>

      </div>

      <!-- Single Question Add / Edit Modal -->
      <div class="dv-modal-overlay hidden" id="dv-modal-overlay">
        <div class="dv-modal" id="dv-modal" role="dialog" aria-modal="true">
          <div class="dv-modal-header">
            <div class="dv-modal-title" id="dvm-title">Edit Question</div>
            <button class="dv-modal-close" id="dv-modal-close">✕</button>
          </div>
          <div class="dv-modal-body">
            <div class="dv-modal-field">
              <label class="dv-modal-label">Question Text *</label>
              <textarea class="dv-modal-input dv-modal-textarea" id="dvm-question" rows="3" placeholder="Enter question asked…"></textarea>
            </div>
            <div class="dv-modal-row">
              <div class="dv-modal-field">
                <label class="dv-modal-label">Topic</label>
                <select class="dv-modal-input dv-modal-select" id="dvm-topic">
                  ${TOPICS.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
              </div>
              <div class="dv-modal-field">
                <label class="dv-modal-label">Answer Status</label>
                <div class="dv-modal-chips" id="dvm-status-chips">
                  ${VALID_STATUSES.map(s => `
                    <button class="dv-status-chip ${statusChipClass(s)}" data-status="${s}">${s}</button>
                  `).join('')}
                </div>
              </div>
            </div>
            <div class="dv-modal-field">
              <label class="dv-modal-label">Notes & Solution Highlights</label>
              <textarea class="dv-modal-input dv-modal-textarea" id="dvm-notes" rows="2" placeholder="Key points, correct approach…"></textarea>
            </div>
          </div>
          <div class="dv-modal-footer">
            <button class="dv-modal-delete-btn" id="dvm-delete">Delete</button>
            <div class="dv-modal-footer-right">
              <button class="dv-modal-cancel-btn" id="dvm-cancel">Cancel</button>
              <button class="dv-modal-save-btn" id="dvm-save">Save Question</button>
            </div>
          </div>
        </div>
      </div>
    `;

    bindEvents(el, id, interview, questions);
  }

  // ── Question Card ─────────────────────────────────────
  function renderQuestionCard(q) {
    const status  = normaliseStatus(q);
    const badgeCls = statusBadgeClass(status);
    return `
      <div class="sq-card" data-qid="${q.id}">
        <div class="sq-card-main">
          <div class="sq-card-top">
            <div class="sq-question-text">${Utils.escapeHtml(q.question)}</div>
            <div class="sq-card-actions">
              <button class="sq-edit-btn" title="Edit question">${Icons.edit(14)}</button>
              <button class="sq-chevron" title="Expand">${Icons.chevronDown(16)}</button>
            </div>
          </div>
          <div class="sq-badges">
            ${q.topic ? `<span class="sq-topic-badge">${Utils.escapeHtml(q.topic)}</span>` : ''}
            <span class="sq-status-badge ${badgeCls}">${status}</span>
          </div>
        </div>
        <div class="sq-card-body">
          ${q.notes
            ? `<div class="sq-notes">${Utils.escapeHtml(q.notes)}</div>`
            : `<div class="sq-no-notes">No notes added.</div>`}
          <div class="sq-card-body-actions">
            <button class="sq-body-edit-btn" data-action="edit">${Icons.edit(13)} Edit</button>
            <button class="sq-body-delete-btn" data-action="delete">${Icons.trash(13)} Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderEmptyState() {
    return `
      <div class="sq-empty-state">
        <div class="sq-empty-icon">${Icons.questionMark ? Icons.questionMark(40) : '?'}</div>
        <div class="sq-empty-title">No questions yet</div>
        <div class="sq-empty-sub">Add the questions you were asked in this interview.</div>
        <button class="btn btn-secondary btn-sm sq-empty-btn" id="dv-empty-add-q">Add First Question</button>
      </div>`;
  }

  // ── Event Binding ────────────────────────────────────
  function bindEvents(el, id, interview, questions) {
    // Back — go to company detail page
    el.querySelector('#dv-back').addEventListener('click', () => {
      if (interview.company) {
        Router.push(`company/${encodeURIComponent(interview.company)}`);
      } else {
        Router.back();
      }
    });

    // Edit interview (top icon & sidebar edit details button)
    el.querySelector('#dv-edit').addEventListener('click', () => Router.push(`edit/${id}`));
    el.querySelector('#dv-edit-company')?.addEventListener('click', () => Router.push(`edit/${id}`));

    el.querySelector('#dv-delete').addEventListener('click', () => {
      Modal.confirm({
        title: 'Delete Interview Round?',
        message: `Permanently delete the ${interview.company} — ${interview.round || 'this round'} and all ${questions.length} question${questions.length !== 1 ? 's' : ''}?`,
        confirmText: 'Delete',
        danger: true,
        onConfirm: async () => {
          const companyName = interview.company;
          try {
            await Store.deleteInterview(id);
            Toast.show('Round deleted', 'default');
            // Go back to company detail, or home if no rounds left
            const remaining = await Store.getCompanyRounds(companyName);
            if (remaining.length > 0) {
              Router.push(`company/${encodeURIComponent(companyName)}`);
            } else {
              Router.push('home');
            }
          } catch (e) {
            console.error(e);
            Toast.show('Failed to delete interview', 'error');
          }
        },
      });
    });

    // Print
    const printBtn = el.querySelector('#dv-print');
    if (printBtn) {
      printBtn.addEventListener('click', () => printInterviewQuestions(interview, questions));
    }

    // Add question button — opens Single Question Modal directly
    el.querySelector('#dv-add-q')?.addEventListener('click', () => openQuestionModal(el, id, null));
    el.querySelector('#dv-empty-add-q')?.addEventListener('click', () => openQuestionModal(el, id, null));

    // Filters (Topic & Status)
    el.querySelector('#dv-filter-topic')?.addEventListener('change', () => applyFilters(el, id));
    el.querySelector('#dv-filter-status')?.addEventListener('change', () => applyFilters(el, id));

    // Question card interactions
    bindQuestionCards(el, id);

    // Modal setup
    bindModal(el, id);
  }

  async function applyFilters(el, interviewId) {
    const topicVal  = el.querySelector('#dv-filter-topic')?.value  || 'ALL';
    const statusVal = el.querySelector('#dv-filter-status')?.value || 'ALL';
    const allQs     = await Store.getQuestionsByInterview(interviewId);

    const filtered  = allQs.filter(q => {
      const matchTopic  = (topicVal === 'ALL')  || (q.topic === topicVal);
      const matchStatus = (statusVal === 'ALL') || (normaliseStatus(q) === statusVal);
      return matchTopic && matchStatus;
    });

    const listEl = el.querySelector('#dv-q-list');
    if (!listEl) return;

    if (!allQs.length) {
      listEl.innerHTML = renderEmptyState();
      el.querySelector('#dv-empty-add-q')?.addEventListener('click', () => openQuestionModal(el, interviewId, null));
    } else if (!filtered.length) {
      listEl.innerHTML = `<div class="sq-empty-filter">No questions match the selected filters.</div>`;
    } else {
      listEl.innerHTML = filtered.map(q => renderQuestionCard(q)).join('');
      bindQuestionCards(el, interviewId);
    }
  }

  function bindQuestionCards(el, id) {
    el.querySelectorAll('.sq-card').forEach(card => {
      const qid  = card.dataset.qid;
      const chevron = card.querySelector('.sq-chevron');
      const body    = card.querySelector('.sq-card-body');

      // Accordion toggle
      card.querySelector('.sq-card-main').addEventListener('click', (e) => {
        if (e.target.closest('.sq-edit-btn') || e.target.closest('.sq-chevron')) return;
        toggleAccordion(card, body, chevron);
      });
      chevron.addEventListener('click', () => toggleAccordion(card, body, chevron));

      // Inline edit button
      card.querySelector('.sq-edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openQuestionModal(el, id, qid);
      });

      // Body action buttons
      card.querySelector('[data-action="edit"]').addEventListener('click', () => openQuestionModal(el, id, qid));
      card.querySelector('[data-action="delete"]').addEventListener('click', () => deleteQuestion(el, id, qid, card));
    });
  }

  function toggleAccordion(card, body, chevron) {
    const isOpen = card.classList.contains('sq-card-open');
    if (isOpen) {
      body.style.maxHeight = body.scrollHeight + 'px';
      requestAnimationFrame(() => {
        body.style.maxHeight = '0';
        body.style.opacity   = '0';
      });
      card.classList.remove('sq-card-open');
      chevron.style.transform = 'rotate(0deg)';
    } else {
      body.style.maxHeight = body.scrollHeight + 'px';
      body.style.opacity   = '1';
      setTimeout(() => { body.style.maxHeight = 'none'; }, 320);
      card.classList.add('sq-card-open');
      chevron.style.transform = 'rotate(180deg)';
    }
  }

  // ── Question Add / Edit Modal ─────────────────────────
  let _activeQid = null; // null = Adding new question, string = Editing question

  function openQuestionModal(el, interviewId, qid = null) {
    _activeQid = qid;
    const isNew = !qid;

    const titleEl  = el.querySelector('#dvm-title');
    const deleteBtn = el.querySelector('#dvm-delete');
    const qField   = el.querySelector('#dvm-question');

    qField.style.borderColor = 'var(--c-separator-hard)';

    if (isNew) {
      if (titleEl) titleEl.textContent = 'Add Question';
      if (deleteBtn) deleteBtn.style.display = 'none';
      qField.value = '';
      el.querySelector('#dvm-notes').value = '';
      el.querySelector('#dvm-topic').value = TOPICS[0];

      // Set default Answered chip
      el.querySelectorAll('#dvm-status-chips .dv-status-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.status === 'Answered');
      });
    } else {
      if (titleEl) titleEl.textContent = 'Edit Question';
      if (deleteBtn) deleteBtn.style.display = 'block';

      Store.getQuestionsByInterview(interviewId).then(questions => {
        const q = questions.find(q => q.id === qid);
        if (!q) return;

        const status = normaliseStatus(q);
        qField.value = q.question || '';
        el.querySelector('#dvm-notes').value = q.notes || '';
        el.querySelector('#dvm-topic').value = q.topic || TOPICS[0];

        el.querySelectorAll('#dvm-status-chips .dv-status-chip').forEach(chip => {
          chip.classList.toggle('active', chip.dataset.status === status);
        });
      });
    }

    const overlay = el.querySelector('#dv-modal-overlay');
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.add('visible'));
    qField.focus();
  }

  function closeQuestionModal(el) {
    const overlay = el.querySelector('#dv-modal-overlay');
    overlay.classList.remove('visible');
    setTimeout(() => overlay.classList.add('hidden'), 220);
    _activeQid = null;
  }

  function bindModal(el, id) {
    // Status chip toggle
    el.querySelectorAll('#dvm-status-chips .dv-status-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        el.querySelectorAll('#dvm-status-chips .dv-status-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    // Close
    el.querySelector('#dvm-cancel').addEventListener('click', () => closeQuestionModal(el));
    el.querySelector('#dv-modal-close').addEventListener('click', () => closeQuestionModal(el));
    el.querySelector('#dv-modal-overlay').addEventListener('click', (e) => {
      if (e.target === el.querySelector('#dv-modal-overlay')) closeQuestionModal(el);
    });

    // Save Question (Add or Edit)
    el.querySelector('#dvm-save').addEventListener('click', async () => {
      const questionText = el.querySelector('#dvm-question').value.trim();
      if (!questionText) {
        el.querySelector('#dvm-question').style.borderColor = 'var(--c-red)';
        el.querySelector('#dvm-question').focus();
        return;
      }

      const activeChip = el.querySelector('#dvm-status-chips .dv-status-chip.active');
      const status     = activeChip ? activeChip.dataset.status : 'Answered';
      const topic      = el.querySelector('#dvm-topic').value;
      const notes      = el.querySelector('#dvm-notes').value.trim();

      const targetQid  = _activeQid || undefined;

      try {
        const savedId = await Store.saveQuestion({
          id:          targetQid,
          interviewId: id,
          question:    questionText,
          topic,
          status,
          notes,
        });

        closeQuestionModal(el);

        // Re-apply filters & refresh list
        await applyFilters(el, id);

        // Highlight saved/added card
        const card = el.querySelector(`.sq-card[data-qid="${savedId}"]`);
        if (card) {
          card.classList.add('sq-card-just-saved');
          setTimeout(() => card.classList.remove('sq-card-just-saved'), 600);
        }

        // Refresh sidebar stats & header counters
        await refreshStats(el, id);
        Toast.show(_activeQid ? 'Question updated' : 'Question added!', 'success');
      } catch (e) {
        console.error(e);
        Toast.show('Failed to save question', 'error');
      }
    });

    // Delete from modal
    el.querySelector('#dvm-delete').addEventListener('click', () => {
      if (!_activeQid) return;
      const qid = _activeQid;
      closeQuestionModal(el);
      const card = el.querySelector(`.sq-card[data-qid="${qid}"]`);
      if (card) deleteQuestion(el, id, qid, card);
    });
  }

  function deleteQuestion(el, interviewId, qid, card) {
    Modal.confirm({
      title: 'Delete Question?',
      message: 'This question will be permanently removed.',
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await Store.deleteQuestion(qid);
          if (card) {
            card.style.transition = 'all 0.22s ease-out';
            card.style.opacity    = '0';
            card.style.transform  = 'scale(0.96) translateY(-6px)';
            card.style.maxHeight  = card.offsetHeight + 'px';
            requestAnimationFrame(() => { card.style.maxHeight = '0'; card.style.margin = '0'; card.style.padding = '0'; });
            setTimeout(async () => {
              card.remove();
              await applyFilters(el, interviewId);
              await refreshStats(el, interviewId);
            }, 240);
          } else {
            await applyFilters(el, interviewId);
            await refreshStats(el, interviewId);
          }
          Toast.show('Question deleted', 'default');
        } catch (e) {
          console.error(e);
          Toast.show('Failed to delete question', 'error');
        }
      },
    });
  }

  async function refreshStats(el, id) {
    const questions = await Store.getQuestionsByInterview(id);
    const answered  = questions.filter(q => normaliseStatus(q) === 'Answered').length;
    const notAns    = questions.filter(q => normaliseStatus(q) === 'Not Answered').length;
    const notSure   = questions.filter(q => normaliseStatus(q) === 'Not Sure').length;

    const statGreen  = el.querySelector('.dv-stat-green');
    const statRed    = el.querySelector('.dv-stat-red');
    const statOrange = el.querySelector('.dv-stat-orange');
    const countEl    = el.querySelector('.dv-q-count');
    if (statGreen)  statGreen.textContent  = answered;
    if (statRed)    statRed.textContent    = notAns;
    if (statOrange) statOrange.textContent = notSure;
    if (countEl)    countEl.textContent    = questions.length;
  }

  // ── PDF Print ────────────────────────────────────────
  function printInterviewQuestions(interview, questions) {
    const sColor = { 'Answered':'#1a7f3c','Not Answered':'#c0392b','Not Sure':'#b8600a' };
    const sBg    = { 'Answered':'#d4edda','Not Answered':'#f8d7da','Not Sure':'#fff3cd' };

    const rows = questions.map((q, i) => {
      const status = normaliseStatus(q);
      const topic  = q.topic || 'General';
      return `
        <tr>
          <td style="padding:10px 14px;vertical-align:top;font-size:13px;line-height:1.6;color:#1a1a1a;border-bottom:1px solid #e5e7eb;white-space:pre-wrap;">
            <span style="color:#9ca3af;font-size:11px;font-weight:600;display:block;margin-bottom:3px;">Q${i + 1}</span>
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
  <title>${interview.company} — ${interview.round}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#1a1a1a;padding:40px}
    h1{font-size:20px;font-weight:700;color:#111;margin-bottom:2px}
    h2{font-size:13px;font-weight:500;color:#6b7280;margin-bottom:4px}
    .meta{font-size:12px;color:#9ca3af;margin-bottom:28px}
    table{width:100%;border-collapse:collapse}
    thead th{background:#f3f4f6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;padding:10px 14px;text-align:left;border-bottom:2px solid #e5e7eb}
    tbody tr:last-child td{border-bottom:none}
    @media print{body{padding:20px}@page{margin:18mm 15mm}}
  </style>
</head>
<body>
  <h1>${interview.company}</h1>
  <h2>${interview.round}</h2>
  <div class="meta">${questions.length} question${questions.length!==1?'s':''} · ${Utils.formatDate(interview.date)} · Printed ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
  <table>
    <thead><tr><th style="width:60%">Question</th><th style="width:20%">Topic</th><th style="width:20%">Label</th></tr></thead>
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
