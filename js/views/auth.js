/* ===================================================
   INTERVIEW JOURNAL — Auth View (Local Prototype)
   =================================================== */

window.AuthView = (() => {
  function render(ctx) {
    const el = ctx.el;

    // Inject styles once
    if (!document.getElementById('auth-styles')) {
      const style = document.createElement('style');
      style.id = 'auth-styles';
      style.textContent = `
        .auth-wrap {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          box-sizing: border-box;
        }
        .auth-card {
          width: 100%;
          max-width: 380px;
          background: rgba(28, 28, 30, 0.85);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 40px 32px 36px;
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.04) inset;
          animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .auth-brand {
          text-align: center;
          margin-bottom: 32px;
        }
        .auth-logo {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          box-shadow: 0 8px 24px rgba(0, 122, 255, 0.35);
          color: white;
        }
        .auth-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--c-text, #fff);
          margin: 0 0 6px;
          letter-spacing: -0.3px;
        }
        .auth-subtitle {
          font-size: 14px;
          color: var(--c-text-3, rgba(255,255,255,0.4));
          margin: 0;
        }
        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 20px;
        }
        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .auth-field label {
          font-size: 12px;
          font-weight: 600;
          color: var(--c-text-2, rgba(255,255,255,0.6));
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }
        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 13px 14px;
          font-size: 15px;
          color: var(--c-text, #fff);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.2); }
        .auth-input:focus {
          border-color: #007AFF;
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
        }
        .auth-submit {
          width: 100%;
          padding: 14px;
          background: #007AFF;
          color: #fff;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: -0.2px;
          transition: opacity 0.15s, transform 0.15s;
          font-family: inherit;
        }
        .auth-submit:hover { opacity: 0.88; transform: scale(0.99); }
        .auth-submit:active { opacity: 0.75; transform: scale(0.97); }
        .auth-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .auth-msg {
          font-size: 13px;
          text-align: center;
          padding: 10px 14px;
          border-radius: 10px;
          margin-top: 6px;
        }
        .auth-msg.error {
          background: rgba(255, 59, 48, 0.12);
          color: #FF453A;
          border: 1px solid rgba(255, 59, 48, 0.2);
        }
        .auth-hidden { display: none !important; }
      `;
      document.head.appendChild(style);
    }

    el.innerHTML = `
      <div class="auth-wrap">
        <div class="auth-card">

          <div class="auth-brand">
            <div class="auth-logo">
              ${Icons.journal(28)}
            </div>
            <h1 class="auth-title">Interview Journal</h1>
            <p class="auth-subtitle" id="auth-subtitle">Welcome back. Please log in.</p>
          </div>

          <form id="auth-form" autocomplete="on">
            <div class="auth-fields">

              <!-- Username -->
              <div class="auth-field" id="username-field">
                <label for="auth-username">Username</label>
                <input class="auth-input" type="text" id="auth-username" placeholder="john_doe" autocomplete="username" required />
              </div>

              <!-- Password -->
              <div class="auth-field" id="password-field">
                <label for="auth-password">Password</label>
                <input class="auth-input" type="password" id="auth-password" placeholder="••••••••" autocomplete="current-password" required />
              </div>

            </div>

            <!-- Message -->
            <div id="auth-msg" class="auth-hidden"></div>

            <button type="submit" class="auth-submit" id="auth-submit" style="margin-top: 4px;">
              Sign In
            </button>
          </form>

        </div>
      </div>
    `;

    // ── Refs ──────────────────────────────────────────
    const form         = el.querySelector('#auth-form');
    const userInput    = el.querySelector('#auth-username');
    const passInput    = el.querySelector('#auth-password');
    const submitBtn    = el.querySelector('#auth-submit');
    const msgDiv       = el.querySelector('#auth-msg');

    function showMsg(text, type) {
      msgDiv.textContent = text;
      msgDiv.className = `auth-msg ${type}`;
    }
    function clearMsg() {
      msgDiv.textContent = '';
      msgDiv.className = 'auth-hidden';
    }

    // ── Events ────────────────────────────────────────
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearMsg();
      const username = userInput.value.trim();
      const password = passInput.value.trim();

      submitBtn.disabled = true;
      const orig = submitBtn.textContent;
      submitBtn.textContent = 'Please wait…';

      try {
        await Store.login(username, password);
        // Navigate home upon successful login
        Router.replace('home');
      } catch (err) {
        showMsg(err.message || 'Authentication failed. Please try again.', 'error');
      } finally {
        submitBtn.textContent = orig;
        submitBtn.disabled = false;
      }
    });
  }

  return { render };
})();
