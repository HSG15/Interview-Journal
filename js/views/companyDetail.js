/* ===================================================
   INTERVIEW JOURNAL — Company Detail View (Apple HIG Redesign)
   Single responsibility: Display company interview journey.
   Maximum content width: ~960px, compact & centered.
   =================================================== */

window.CompanyDetailView = (() => {

  function outcomeBadgeCls(outcome) {
    switch (outcome) {
      case 'Passed': return 'cd-badge-green';
      case 'Rejected': return 'cd-badge-red';
      case 'In Progress': return 'cd-badge-orange';
      case 'Pending': return 'cd-badge-orange';
      case 'Ghosted': return 'cd-badge-gray';
      case 'On Hold': return 'cd-badge-accent';
      case 'Upcoming': return 'cd-badge-accent';
      default: return 'cd-badge-gray';
    }
  }

  async function render({ el, params }) {
    const rawName     = params.name || '';
    let companyName   = rawName;
    try {
      if (rawName.includes('%')) companyName = decodeURIComponent(rawName);
    } catch (e) {
      companyName = rawName;
    }

    el.innerHTML = `<div style="height:100dvh; display:flex; align-items:center; justify-content:center; color:var(--c-text-3); font-size:var(--fs-subhead);">Loading company details...</div>`;

    try {
      const rounds = await Store.getCompanyRounds(companyName);

      if (!rounds.length) {
        el.innerHTML = `
          <div class="dv-topbar">
            <button class="dv-back-btn" onclick="Router.push('home')">
              ${Icons.chevronLeft(18)} <span>Home</span>
            </button>
          </div>
          <div class="detail-empty-page">
            <div class="detail-empty-icon">${Icons.building(48)}</div>
            <div class="detail-empty-title">Company not found</div>
            <button class="btn btn-secondary" onclick="Router.push('home')">Go to Home</button>
          </div>`;
        return;
      }

      await drawView(el, companyName, rounds);
    } catch (e) {
      console.error(e);
      el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--c-red);">Failed to load company details.</div>`;
    }
  }

  async function drawView(el, companyName, rounds) {
    const compObj  = (await Store.getCompanyByName(companyName)) || { name: companyName, status: 'In Progress', location: '', notes: '' };
    const color    = Utils.getCompanyColor(compObj.name);
    const initials = Utils.getCompanyInitials(compObj.name);

    // Aggregate stats by fetching questions for all rounds concurrently
    const roundsQuestions = await Promise.all(rounds.map(r => Store.getQuestionsByInterview(r.id)));
    const totalQs  = roundsQuestions.reduce((acc, qs) => acc + qs.length, 0);
    const latest   = rounds[0];

    const overallStatus = compObj.status;

    el.innerHTML = `
      <!-- Top Nav -->
      <div class="dv-topbar">
        <button class="dv-back-btn" id="cd-back">
          ${Icons.chevronLeft(18)} <span>Home</span>
        </button>
        <div class="dv-topbar-actions">
          <button class="dv-icon-btn dv-icon-btn-danger" id="cd-delete-company" title="Delete Company">
            ${Icons.trash(16)}
          </button>
        </div>
      </div>

      <!-- Main Compact Centered Container (Max 960px) -->
      <div class="company-detail-container">

        <!-- 1. COMPACT COMPANY HEADER -->
        <div class="cd-header-card">
          <div class="cd-header-top">
            <div class="dv-avatar" style="background:${color};width:56px;height:56px;font-size:20px">${initials}</div>
            <div class="cd-header-main">
              <div class="cd-header-title-row">
                <h1 class="cd-company-title">${Utils.escapeHtml(compObj.name)}</h1>
                <button class="dv-icon-btn" id="cd-edit-company" title="Edit Company Details" style="margin-left:8px; width:28px; height:28px; opacity:0.7">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <span class="dv-outcome-badge outcome-${overallStatus.toLowerCase().replace(' ', '-')}">
                  ${Utils.getOutcomeIcon(overallStatus)} ${overallStatus}
                </span>
              </div>
              <div class="cd-header-meta">
                ${compObj.location ? `<span>${Utils.escapeHtml(compObj.location)}</span><span class="cd-meta-bullet">·</span>` : ''}
                <span><strong>${rounds.length}</strong> round${rounds.length !== 1 ? 's' : ''}</span>
                <span class="cd-meta-bullet">·</span>
                <span><strong>${totalQs}</strong> question${totalQs !== 1 ? 's' : ''}</span>
                ${latest ? `
                <span class="cd-meta-bullet">·</span>
                <span>Latest: ${Utils.formatDate(latest.date)}</span>` : ''}
              </div>
            </div>
          </div>
          ${compObj.notes ? `
          <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--c-separator); font-size:14px; color:var(--c-text-2); white-space:pre-wrap;">
            <strong>Company Notes:</strong><br>${Utils.escapeHtml(compObj.notes)}
          </div>` : ''}
        </div>

        <!-- 2. INTERVIEW HISTORY (STACKED ROUND CARDS) -->
        <div class="cd-history-section">
          <div class="cd-section-header">
            <div class="cd-section-title">Interview History</div>
            <div class="cd-section-sub">Click any round to view questions & detailed notes</div>
          </div>

          <div class="cd-rounds-stack" id="cd-rounds-stack">
            ${rounds.map((r, idx) => renderRoundCard(r, idx, rounds.length, roundsQuestions[idx].length)).join('')}
          </div>
        </div>

        <!-- 3. BOTTOM ACTION BUTTONS -->
        <div class="cd-bottom-actions">
          <button class="btn btn-primary" id="cd-add-round">
            ${Icons.plus(16)} Add New Round
          </button>

          <button class="btn btn-secondary" id="cd-see-all-qs">
            ${Icons.questionMark(16)} See All Questions (${totalQs})
          </button>

          ${totalQs > 0 ? `
          <button class="btn btn-ghost" id="cd-print-pdf">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print PDF
          </button>` : ''}
        </div>

      </div>
    `;

    bindEvents(el, companyName, rounds);
  }

  function renderRoundCard(round, idx, totalRounds, qCount) {

    return `
      <div class="cd-stacked-round-card pressable" data-round-id="${round.id}">
        <div class="cd-stacked-round-left">
          <div class="cd-round-index-badge">R${totalRounds - idx}</div>
          <div class="cd-stacked-round-info">
            <div class="cd-stacked-round-name">${Utils.escapeHtml(round.round)}</div>
            <div class="cd-stacked-round-sub">
              ${Utils.formatDate(round.date)}
              ${round.time ? ' · ' + Utils.formatTime(round.time) : ''}
              ${round.mode ? ' · ' + round.mode : ''}
              ${round.duration ? ' · ' + Utils.formatDuration(round.duration) : ''}
            </div>
          </div>
        </div>

        <div class="cd-stacked-round-right">
          ${qCount > 0 ? `<span class="cd-q-count-badge">${qCount} Q</span>` : ''}
          <span class="cd-outcome-pill ${outcomeBadgeCls(round.outcome)}">${round.outcome}</span>
          <span class="cd-round-arrow">${Icons.chevronRight(18)}</span>
        </div>
      </div>`;
  }

  function bindEvents(el, companyName, rounds) {
    // Back to Home
    el.querySelector('#cd-back')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Router.push('home');
    });

    // Clicking any round card opens Interview Detail page
    el.querySelectorAll('[data-round-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        Router.push(`detail/${card.dataset.roundId}`);
      });
    });

    // Bottom Action: Add New Round
    el.querySelector('#cd-add-round')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Router.push(`add?company=${encodeURIComponent(companyName)}`);
    });

    // Bottom Action: See All Questions
    el.querySelector('#cd-see-all-qs')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Router.push(`company-questions/${encodeURIComponent(companyName)}`);
    });

    // Bottom Action: Print PDF
    el.querySelector('#cd-print-pdf')?.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const allRoundsQs = await Promise.all(rounds.map(async r => {
        const qs = await Store.getQuestionsByInterview(r.id);
        return qs.map(q => ({ ...q, roundName: r.round, roundDate: r.date }));
      }));
      const allQs = allRoundsQs.flat();
      printQuestionsPDF(companyName, allQs);
    });

    // Edit Company Details
    el.querySelector('#cd-edit-company')?.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      let compObj = await Store.getCompanyByName(companyName);
      // Fallback if not perfectly migrated or doesn't exist yet
      if (!compObj) {
        compObj = {
          id: Utils.uuid(),
          name: companyName,
          status: 'In Progress',
          location: '',
          notes: ''
        };
      }

      const statuses = ['In Progress', 'Passed', 'Rejected', 'Ghosted', 'On Hold'];
      const html = `
        <div class="form-section" style="padding: var(--sp-2) var(--sp-5) var(--sp-5);">
          <div class="input-group">
            <label class="input-label" for="edit-comp-name">Company Name</label>
            <input class="input" id="edit-comp-name" type="text" value="${Utils.escapeHtml(compObj.name)}" />
          </div>
          <div class="input-group">
            <label class="input-label" for="edit-comp-loc">Location</label>
            <input class="input" id="edit-comp-loc" type="text" value="${Utils.escapeHtml(compObj.location)}" />
          </div>
          <div class="input-group">
            <label class="input-label" for="edit-comp-status">Overall Status</label>
            <select class="input" id="edit-comp-status">
              ${statuses.map(s => `<option value="${s}" ${compObj.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="input-group" style="margin-bottom: var(--sp-6)">
            <label class="input-label" for="edit-comp-notes">Company Notes</label>
            <textarea class="input" id="edit-comp-notes" style="min-height:90px">${Utils.escapeHtml(compObj.notes)}</textarea>
          </div>
          
          <div style="display:flex; gap:var(--sp-3);">
            <button class="btn btn-secondary" id="cancel-comp-details" style="flex:1;">Cancel</button>
            <button class="btn btn-primary" id="save-comp-details" style="flex:1;">Save Details</button>
          </div>
        </div>
      `;
      
      Modal.show({
        title: 'Edit Company',
        content: html,
        maxWidth: 500,
        onOpen: (modalEl, closeFn) => {
          modalEl.querySelector('#cancel-comp-details').addEventListener('click', closeFn);
          
          modalEl.querySelector('#save-comp-details').addEventListener('click', async () => {
            const newName = document.getElementById('edit-comp-name').value.trim();
            if (!newName) { Toast.show('Name is required', 'error'); return; }

            try {
              await Store.saveCompany({
                id: compObj.id,
                name: newName,
                location: document.getElementById('edit-comp-loc').value.trim(),
                status: document.getElementById('edit-comp-status').value,
                notes: document.getElementById('edit-comp-notes').value.trim(),
              });
              
              Toast.show('Company details updated!', 'success');
              closeFn();
              
              if (newName.toLowerCase() !== compObj.name.toLowerCase()) {
                Router.push(`company/${encodeURIComponent(newName)}`);
              } else {
                // Re-render current page
                Router.replace(`company/${encodeURIComponent(newName)}`); // triggers a clean re-render
              }
            } catch (err) {
              console.error(err);
              Toast.show('Failed to save company details.', 'error');
            }
          });
        }
      });
    });

    // Delete Company
    el.querySelector('#cd-delete-company')?.addEventListener('click', () => {
      Modal.confirm({
        title: 'Delete Company?',
        message: `Permanently delete "${companyName}" and all ${rounds.length} round${rounds.length !== 1 ? 's' : ''}?`,
        confirmText: 'Delete Company',
        danger: true,
        onConfirm: async () => {
          try {
            const compObj = await Store.getCompanyByName(companyName);
            if (compObj) {
              await Store.deleteCompany(compObj.id);
            } else {
              for (const r of rounds) await Store.deleteInterview(r.id);
            }
            
            Toast.show(`${companyName} deleted`, 'default');
            Router.push('home');
          } catch (err) {
            console.error(err);
            Toast.show('Failed to delete company', 'error');
          }
        },
      });
    });
  }

  function printQuestionsPDF(companyName, allQs) {
    const sColor = { 'Answered':'#1a7f3c','Not Answered':'#c0392b','Not Sure':'#b8600a' };
    const sBg    = { 'Answered':'#d4edda','Not Answered':'#f8d7da','Not Sure':'#fff3cd' };
    const VALID  = ['Answered', 'Not Answered', 'Not Sure'];

    const rows = allQs.map((q, i) => {
      const status = VALID.includes(q.status) ? q.status : 'Answered';
      const topic  = q.topic || 'General';
      return `
        <tr>
          <td style="padding:10px 14px;vertical-align:top;font-size:13px;line-height:1.6;color:#1a1a1a;border-bottom:1px solid #e5e7eb;white-space:pre-wrap;">
            <span style="color:#9ca3af;font-size:11px;font-weight:600;display:block;margin-bottom:3px;">Q${i + 1} · ${Utils.escapeHtml(q.roundName)}</span>
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
  <title>${companyName} — Questions</title>
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
  <h1>${companyName}</h1>
  <div class="meta">${allQs.length} question${allQs.length!==1?'s':''} · Printed ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
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
