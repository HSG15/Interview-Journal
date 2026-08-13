/* ===================================================
   INTERVIEW JOURNAL — Main Application Entry Point
   =================================================== */

(function () {
  'use strict';

  // ── Theme: apply saved preference on load ──────────
  function applyInitialTheme() {
    const settings = Store.getSettings();
    if (settings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (settings.theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  // ── Seed demo data ──────────────────────────────────
  Store.seedIfEmpty();

  // ── Apply theme ─────────────────────────────────────
  applyInitialTheme();

  // ── Render bottom nav ────────────────────────────────
  NavBar.render('home');

  // Hide navbar on auth route immediately
  const initialHash = window.location.hash.slice(1) || 'home';
  if (initialHash === 'auth') {
    NavBar.hide();
  }

  // ── Ensure bottom sheet overlay is in DOM ───────────
  if (!document.getElementById('sheet-backdrop')) {
    const bd = document.createElement('div');
    bd.id = 'sheet-backdrop';
    document.body.appendChild(bd);
  }

  // ── Define routes ────────────────────────────────────
  Router.define('auth',                    AuthView.render);
  Router.define('home',                    HomeView.render);
  Router.define('calendar',                CalendarView.render);
  Router.define('add',                     AddInterviewView.render);
  Router.define('edit/:id',                AddInterviewView.render);
  Router.define('detail/:id',              DetailView.render);
  Router.define('questions',               QuestionsView.render);
  Router.define('companies',               CompaniesView.render);
  Router.define('company/:name',           CompanyDetailView.render);
  Router.define('company-questions/:name', CompanyQuestionsView.render);
  Router.define('settings',                SettingsView.render);

  // ── Init auth and router ─────────────────────────────
  Store.initAuth().then(() => {
    Router.init();
    console.log('🎯 Interview Journal — loaded.');
  });

  // ── Handle home-empty-add button (delegated) ─────────
  document.addEventListener('click', (e) => {
    if (e.target.closest('#home-empty-add')) {
      Router.push('add');
    }
    if (e.target.closest('[data-interview-id]') && !e.target.closest('.detail-actions-menu')) {
      // Global delegation handled in each view
    }
  });

  // ── Keyboard shortcuts ───────────────────────────────
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      Search.open();
    }
    if (e.key === 'Escape') {
      Search.close();
      BottomSheet.close();
    }
  });
})();
