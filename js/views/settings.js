/* ===================================================
   INTERVIEW JOURNAL — Settings View
   =================================================== */

window.SettingsView = (() => {

  async function render({ el }) {
    el.innerHTML = `<div style="height:100dvh; display:flex; align-items:center; justify-content:center; color:var(--c-text-3); font-size:var(--fs-subhead);">Loading settings...</div>`;

    try {
      const settings = Store.getSettings();
      const stats = await Store.getStats();
      const user = Store.getUser();
      const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
      const email = user?.email || '';

      el.innerHTML = `
      <div style="padding-bottom:var(--sp-8)">
        <!-- Header -->
        <div class="settings-header">
          <h1 class="settings-page-title">Settings</h1>
        </div>

        <!-- Account -->
        <div class="settings-section">
          <div class="settings-section-label">Account</div>
          <div class="settings-group">
            <div class="settings-item" style="cursor:default">
              <div class="settings-item-icon" style="background:var(--c-accent-soft);color:var(--c-accent);font-size:18px;font-weight:700;">
                ${username.charAt(0).toUpperCase()}
              </div>
              <div class="settings-item-text">
                <div class="settings-item-title">${username}</div>
                <div class="settings-item-desc">${email}</div>
              </div>
            </div>
            <div class="settings-item" id="logout-btn">
              <div class="settings-item-icon" style="background:var(--c-red-soft);color:var(--c-red)">${Icons.xMark(18)}</div>
              <div class="settings-item-text">
                <div class="settings-item-title" style="color:var(--c-red)">Sign Out</div>
                <div class="settings-item-desc">Log out of your account</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Appearance -->
        <div class="settings-section">
          <div class="settings-section-label">Appearance</div>
          <div class="settings-group">
            <div style="padding:var(--sp-4);border-bottom:1px solid var(--c-separator)">
              <div style="font-size:var(--fs-footnote);font-weight:var(--fw-semibold);color:var(--c-text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:var(--sp-3)">Theme</div>
              <div class="theme-selector">
                ${themeOption('system', 'System',  settings.theme)}
                ${themeOption('light',  'Light',   settings.theme)}
                ${themeOption('dark',   'Dark',    settings.theme)}
              </div>
            </div>
          </div>
        </div>

        <!-- Data -->
        <div class="settings-section">
          <div class="settings-section-label">Data</div>
          <div class="settings-group">
            <div class="settings-item" id="export-btn">
              <div class="settings-item-icon" style="background:var(--c-green-soft);color:var(--c-green)">${Icons.download(18)}</div>
              <div class="settings-item-text">
                <div class="settings-item-title">Export Data</div>
                <div class="settings-item-desc">Download all interviews as JSON</div>
              </div>
              <span class="settings-chevron">${Icons.chevronRight(16)}</span>
            </div>
            <div class="settings-item" id="import-btn">
              <div class="settings-item-icon" style="background:var(--c-accent-soft);color:var(--c-accent)">${Icons.upload(18)}</div>
              <div class="settings-item-text">
                <div class="settings-item-title">Import Data</div>
                <div class="settings-item-desc">Restore from a JSON backup</div>
              </div>
              <span class="settings-chevron">${Icons.chevronRight(16)}</span>
            </div>
          </div>
        </div>

        <!-- Stats summary -->
        <div class="settings-section">
          <div class="settings-section-label">Summary</div>
          <div class="settings-group">
            ${summaryRow('Total Interviews', stats.totalInterviews, Icons.briefcase(18), 'var(--c-accent)', 'var(--c-accent-soft)')}
            ${summaryRow('Total Questions',  stats.totalQuestions,  Icons.questionMark(18), 'var(--c-purple)', 'var(--c-purple-soft)')}
            ${summaryRow('Companies',        stats.totalCompanies,  Icons.building(18), 'var(--c-green)', 'var(--c-green-soft)')}
          </div>
        </div>

        <!-- About -->
        <div class="settings-section">
          <div class="settings-section-label">About</div>
          <div class="about-card">
            <div class="about-icon">📓</div>
            <div class="about-name">Interview Journal</div>
            <div class="about-tagline">Never forget an interview again.</div>
            <div class="about-version">Version 1.0.0 · Data stored locally</div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="settings-section">
          <div class="settings-section-label">Danger Zone</div>
          <div class="settings-group">
            <div class="settings-item" id="clear-btn" style="color:var(--c-red)">
              <div class="settings-item-icon" style="background:var(--c-red-soft);color:var(--c-red)">${Icons.trash(18)}</div>
              <div class="settings-item-text">
                <div class="settings-item-title" style="color:var(--c-red)">Clear All Data</div>
                <div class="settings-item-desc">Permanently delete everything</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hidden file input for import -->
        <input type="file" id="import-file-input" accept=".json" style="display:none" />
      </div>
    `;

    // Theme selection
    el.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', () => {
        const theme = option.dataset.theme;
        Store.saveSettings({ theme });
        applyTheme(theme);
        el.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        Toast.show('Theme updated', 'success');
      });
    });

    // Logout
    el.querySelector('#logout-btn').addEventListener('click', () => {
      Modal.confirm({
        title: 'Sign Out?',
        message: 'You will be returned to the login screen.',
        confirmText: 'Sign Out',
        cancelText: 'Cancel',
        danger: false,
        onConfirm: async () => {
          try {
            await Store.logout();
            Router.replace('auth');
          } catch (err) {
            Toast.show('Sign out failed: ' + err.message, 'error');
          }
        }
      });
    });

    // Export
    el.querySelector('#export-btn').addEventListener('click', async () => {
      try {
        await Store.exportData();
        Toast.show('Data exported successfully!', 'success');
      } catch (err) {
        Toast.show('Export failed: ' + err.message, 'error');
      }
    });

    // Import
    const fileInput = el.querySelector('#import-file-input');
    el.querySelector('#import-btn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          await Store.importData(event.target.result);
          Toast.show('Data imported! Syncing to cloud...', 'success');
          setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
          Toast.show('Import failed: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    });

    // Clear all
    el.querySelector('#clear-btn').addEventListener('click', () => {
      Modal.confirm({
        title: 'Clear All Data?',
        message: 'This will permanently delete all your interviews, questions, and companies. This cannot be undone.',
        confirmText: 'Delete Everything',
        cancelText: 'Cancel',
        danger: true,
        onConfirm: async () => {
          try {
            await Store.clearAllData();
            Toast.show('All data cleared.', 'success');
            setTimeout(() => window.location.reload(), 1000);
          } catch (err) {
            Toast.show('Failed to clear data.', 'error');
          }
        }
      });
    });

    } catch (e) {
      console.error(e);
      el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--c-red);">Failed to load settings.</div>`;
    }
  }

  function themeOption(value, label, current) {
    const isActive = current === value;
    return `
      <div class="theme-option ${isActive ? 'active' : ''}" data-theme="${value}">
        <div class="theme-preview">
          ${themePreviewContent(value)}
        </div>
        <div class="theme-label">${label}</div>
      </div>
    `;
  }

  function themePreviewContent(theme) {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const bg   = isDark ? '#1C1C1E' : '#FFFFFF';
    const bg2  = isDark ? '#2C2C2E' : '#F2F2F7';
    const line = isDark ? '#3A3A3C' : '#E5E5EA';
    return `
      <div style="background:${bg};flex:1;display:flex;flex-direction:column;gap:2px;padding:4px">
        <div style="height:4px;background:${line};border-radius:2px;width:70%"></div>
        <div style="height:4px;background:${line};border-radius:2px;width:50%"></div>
        <div style="height:8px;background:${bg2};border-radius:2px;margin-top:2px"></div>
      </div>
    `;
  }

  function summaryRow(label, value, icon, color, bg) {
    return `
      <div class="settings-item" style="cursor:default">
        <div class="settings-item-icon" style="background:${bg};color:${color}">${icon}</div>
        <div class="settings-item-title">${label}</div>
        <span style="font-size:var(--fs-title3);font-weight:var(--fw-bold);color:${color}">${value}</span>
      </div>
    `;
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
  }

  return { render, applyTheme };
})();
