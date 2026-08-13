/* ===================================================
   INTERVIEW JOURNAL — SPA Router
   =================================================== */

window.Router = (() => {
  const routes = {};
  let currentRoute = null;
  let history = [];

  function define(path, handler) {
    routes[path] = handler;
  }

  function parseQueryParams(url) {
    const params = {};
    const qIdx = url.indexOf('?');
    if (qIdx >= 0) {
      const search = url.slice(qIdx + 1);
      new URLSearchParams(search).forEach((v, k) => { params[k] = v; });
    }
    return params;
  }

  function matchRoute(rawHash) {
    if (!rawHash) return null;
    const queryParams = parseQueryParams(rawHash);
    const hash = rawHash.split('?')[0].replace(/\/+$/, '');

    // Exact match first
    if (routes[hash]) return { handler: routes[hash], params: queryParams };

    // Pattern match (e.g. detail/:id, company/:name, company-questions/:name)
    const hashParts = hash.split('/');

    for (const pattern of Object.keys(routes)) {
      const parts = pattern.split('/');

      // Greedy match for 2-part routes ending in :param (e.g. company-questions/:name, company/:name)
      if (parts.length === 2 && parts[1].startsWith(':') && hashParts.length >= 2 && hashParts[0] === parts[0]) {
        const paramName = parts[1].slice(1);
        const rawValue  = hashParts.slice(1).join('/');
        let paramValue  = rawValue;
        try { paramValue = decodeURIComponent(rawValue); } catch (e) {}
        return {
          handler: routes[pattern],
          params: { [paramName]: paramValue, ...queryParams }
        };
      }

      if (parts.length !== hashParts.length) continue;
      const params = {};
      let match = true;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith(':')) {
          try {
            params[parts[i].slice(1)] = decodeURIComponent(hashParts[i]);
          } catch (e) {
            params[parts[i].slice(1)] = hashParts[i];
          }
        } else if (parts[i] !== hashParts[i]) {
          match = false; break;
        }
      }
      if (match) return { handler: routes[pattern], params: { ...params, ...queryParams } };
    }
    return null;
  }

  function getNavTab(route) {
    if (!route) return 'home';
    const cleanRoute = route.split('?')[0];
    if (cleanRoute === 'home') return 'home';
    if (cleanRoute === 'calendar') return 'calendar';
    if (cleanRoute === 'add' || cleanRoute.startsWith('add/') || cleanRoute.startsWith('edit/')) return 'add';
    if (cleanRoute === 'questions') return 'questions';
    if (cleanRoute === 'companies') return 'home'; // Since companies is no longer a tab, map it to home highlighting if visited directly, though they asked for it to be accessible elsewhere
    if (cleanRoute.startsWith('company/') || cleanRoute.startsWith('company-questions/')) return 'home';
    if (cleanRoute === 'settings') return 'settings';
    if (cleanRoute.startsWith('detail/')) return 'home';
    return 'home';
  }

  function isTabSwitch(fromRoute, toRoute) {
    if (!fromRoute || !toRoute) return false;
    const tabs = ['home', 'calendar', 'questions', 'settings'];
    const fromBase = fromRoute.split('?')[0].split('/')[0];
    const toBase   = toRoute.split('?')[0].split('/')[0];
    return tabs.includes(fromBase) && tabs.includes(toBase);
  }

  function navigate(route, params = {}, isBack = false) {
    const container = document.getElementById('view-container');
    if (!container) return;

    const matched = matchRoute(route);
    if (!matched) {
      push('home');
      return;
    }

    const oldView = container.querySelector('.view');
    const newViewEl = document.createElement('div');
    newViewEl.className = 'view';

    const tabSwitch = isTabSwitch(currentRoute, route);

    if (oldView) {
      if (tabSwitch) {
        // Instant clean swap for bottom tabs — zero lag, zero ghosting
        oldView.remove();
        newViewEl.classList.add('view-fade-in');
      } else if (isBack) {
        oldView.classList.add('view-slide-out-back');
        newViewEl.classList.add('view-slide-in-back');
      } else {
        oldView.classList.add('view-slide-out');
        newViewEl.classList.add('view-slide-in');
      }
    } else {
      newViewEl.classList.add('view-fade-in');
    }

    container.appendChild(newViewEl);

    // Render new view
    matched.handler({ el: newViewEl, params: { ...matched.params, ...params } });

    // Clean up old view if sliding
    if (oldView && oldView.parentNode && !tabSwitch) {
      oldView.addEventListener('animationend', () => oldView.remove(), { once: true });
      setTimeout(() => { if (oldView.parentNode) oldView.remove(); }, 350);
    }

    currentRoute = route;
    
    if (route.startsWith('auth')) {
      NavBar.hide();
    } else {
      NavBar.show();
      NavBar.setActive(getNavTab(route));
    }
  }

  function push(route, params = {}) {
    history.push(route);
    window.location.hash = route;
  }

  // Replace current history entry — use after Save so Back skips the edit page
  function replace(route) {
    if (history.length > 0) history.pop();
    history.push(route);
    window.location.hash = route;
  }

  function back() {
    if (history.length > 1) {
      history.pop();
      const prev = history[history.length - 1];
      window.location.hash = prev;
    } else {
      push('home');
    }
  }

  function init() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1) || 'home';
      const isBack = history.length > 1 && history[history.length - 2] === hash;
      if (isBack) history.pop();
      navigate(hash, {}, isBack);
    });

    // Initial route
    const initial = window.location.hash.slice(1) || 'home';
    history = [initial];
    navigate(initial);
  }

  return { define, push, replace, back, init, get current() { return currentRoute; } };
})();
