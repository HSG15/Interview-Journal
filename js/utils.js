/* ===================================================
   INTERVIEW JOURNAL — Utilities
   =================================================== */

window.Utils = (() => {

  // ── UUID ────────────────────────────────────────────
  function uuid() {
    return 'ij-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  // ── Date / Time ─────────────────────────────────────
  const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS_LONG    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function formatDateLong(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return `${DAYS_SHORT[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function formatDateRelative(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0,0,0,0);
    const diff = Math.round((d - now) / 86400000);
    if (diff === 0)  return 'Today';
    if (diff === 1)  return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff > 0 && diff < 7) return `In ${diff} days`;
    if (diff < 0 && diff > -7) return `${Math.abs(diff)} days ago`;
    return formatDate(dateStr);
  }

  function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  function formatDuration(minutes) {
    if (!minutes) return '—';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  function getMonthLabel(year, month) {
    return `${MONTHS_LONG[month]} ${year}`;
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function isToday(dateStr) {
    const today = new Date();
    const d = new Date(dateStr + 'T00:00:00');
    return d.toDateString() === today.toDateString();
  }

  function isFuture(dateStr) {
    const today = new Date();
    today.setHours(0,0,0,0);
    return new Date(dateStr + 'T00:00:00') > today;
  }

  function toDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ── Time of Day ─────────────────────────────────────
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 5)  return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
  }

  // ── Color by Company ────────────────────────────────
  const COMPANY_COLORS = [
    '#007AFF', // Royal Blue
    '#34C759', // Apple Green
    '#FF9500', // Amber Orange
    '#FF3B30', // Vibrant Red
    '#AF52DE', // Deep Purple
    '#5AC8FA', // Sky Blue
    '#FF2D55', // Hot Pink
    '#5856D6', // Indigo
    '#FF6B35', // Coral Red
    '#00C7BE', // Teal
    '#E65100', // Deep Orange
    '#00838F', // Cyan
    '#43A047', // Emerald
    '#D81B60', // Rose
    '#8E24AA', // Violet
    '#3F51B5', // Ultramarine
    '#00ACC1', // Turquoise
    '#F4511E', // Burnt Orange
    '#7CB342', // Lime Green
    '#FB8C00', // Warm Gold
    '#1E88E5', // Bright Blue
    '#6D4C41', // Warm Bronze
    '#546E7A', // Slate Blue
    '#2E7D32', // Forest Green
  ];

  function getCompanyColor(name) {
    if (!name) return COMPANY_COLORS[0];
    const str = name.trim().toLowerCase();
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return COMPANY_COLORS[Math.abs(hash) % COMPANY_COLORS.length];
  }

  function getCompanyInitials(name) {
    if (!name || typeof name !== 'string') return '?';
    const clean = name.trim();
    if (!clean) return '?';

    const words = clean.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }

    const single = words[0];
    const uppers = single.match(/[A-Z]/g) || [];
    if (uppers.length >= 2) {
      return (uppers[0] + uppers[1]).toUpperCase();
    }

    return single.slice(0, 2).toUpperCase();
  }

  // ── Outcome ─────────────────────────────────────────
  function getOutcomeBadgeClass(outcome) {
    switch (outcome) {
      case 'Passed': return 'badge-green';
      case 'Failed': return 'badge-red';
      case 'Rejected': return 'badge-red';
      case 'Pending': return 'badge-orange';
      case 'In Progress': return 'badge-orange';
      case 'On Hold': return 'badge-accent';
      case 'Ghosted': return 'badge-gray';
      case 'Upcoming': return 'badge-accent';
      default: return 'badge-gray';
    }
  }

  function getOutcomeIcon(outcome) {
    switch (outcome) {
      case 'Passed': return Icons.checkCircle('#34C759');
      case 'Failed': return Icons.xCircle('#FF3B30');
      case 'Rejected': return Icons.xCircle('#FF3B30');
      case 'Pending': return Icons.clock('#FF9500');
      case 'In Progress': return Icons.clock('#FF9500');
      case 'On Hold': return Icons.clock('#007AFF');
      case 'Upcoming': return Icons.calendar(16, '#007AFF');
      case 'Ghosted': return Icons.xCircle('#8E8E93'); // Or maybe a different icon for ghosted?
      default: return Icons.clock('#8E8E93');
    }
  }

  // ── Difficulty ──────────────────────────────────────
  function getDifficultyLabel(score) {
    if (score <= 3) return 'Easy';
    if (score <= 6) return 'Moderate';
    if (score <= 8) return 'Hard';
    return 'Very Hard';
  }

  function getDifficultyColor(score) {
    if (score <= 3) return 'var(--c-green)';
    if (score <= 6) return 'var(--c-orange)';
    return 'var(--c-red)';
  }

  function getQuestionStatusBadgeClass(status) {
    switch (status) {
      case 'Answered':         return 'badge-green';
      case 'Not Answered':     return 'badge-red';
      case '50-50 / Not Sure': return 'badge-orange';
      default:                 return 'badge-green';
    }
  }

  function getQuestionCardClass(status) {
    switch (status) {
      case 'Answered':         return 'difficulty-easy';
      case 'Not Answered':     return 'difficulty-hard';
      case '50-50 / Not Sure': return 'difficulty-medium';
      default:                 return 'difficulty-easy';
    }
  }

  // ── Progress fill color ─────────────────────────────
  function getProgressColor(score, max = 10) {
    const pct = score / max;
    if (pct <= 0.3) return 'var(--c-green)';
    if (pct <= 0.6) return 'var(--c-orange)';
    return 'var(--c-red)';
  }

  function getConfidenceColor(score, max = 10) {
    const pct = score / max;
    if (pct >= 0.7) return 'var(--c-green)';
    if (pct >= 0.4) return 'var(--c-orange)';
    return 'var(--c-red)';
  }

  // ── String helpers ───────────────────────────────────
  function truncate(str, max = 60) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max).trim() + '…' : str;
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function highlight(text, query) {
    if (!query || !text) return escapeHtml(text || '');
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark style="background:var(--c-yellow-soft);color:var(--c-text);border-radius:2px;">$1</mark>');
  }

  // ── Debounce ─────────────────────────────────────────
  function debounce(fn, delay = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  // ── Months list ─────────────────────────────────────
  function getMonthShort(i) { return MONTHS_SHORT[i]; }
  function getDayShort(i)   { return DAYS_SHORT[i]; }

  return {
    uuid, formatDate, formatDateLong, formatDateRelative, formatTime, formatDuration,
    getMonthLabel, getDaysInMonth, getFirstDayOfMonth, isToday, isFuture, toDateString,
    getGreeting, getCompanyColor, getCompanyInitials,
    getOutcomeBadgeClass, getOutcomeIcon,
    getDifficultyLabel, getDifficultyColor, getQuestionStatusBadgeClass, getQuestionCardClass,
    getProgressColor, getConfidenceColor,
    truncate, escapeHtml, highlight, debounce,
    getMonthShort, getDayShort, MONTHS_LONG, MONTHS_SHORT, DAYS_SHORT,
  };
})();
