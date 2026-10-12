import { waitForSelectedWorksPresentation } from './return-readiness-runtime.js';

(() => {
  if (window.__portfolioProjectEntryInstalled) return;
  window.__portfolioProjectEntryInstalled = true;
  const key = 'portfolio:project-entry';
  const historyKey = 'portfolioSelectedReturn';
  const entryPath = window.__portfolioEntryPath || location.pathname;
  const validProject = path => /^\/projects\/(canvasflow-art-preview|aigc-design-efficiency|fliggy-lele-run|lexin-health-app)\/$/.test(path);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let overlay = null, navigating = false, watchdog = 0;
  function restore() {
    clearTimeout(watchdog);
    overlay?.remove(); overlay = null; navigating = false;
    delete document.documentElement.dataset.projectNavigating;
  }
  function layer(color, glass) {
    const element = document.createElement('div');
    element.className = 'portfolio-project-transition';
    element.setAttribute('aria-hidden', 'true');
    element.style.setProperty('--project-transition-base', color);
    element.style.setProperty('--project-transition-glass', glass);
    element.innerHTML = '<div class="portfolio-project-transition-matte"></div><div class="portfolio-project-transition-glass"></div>';
    document.body.appendChild(element);
    return element;
  }
  let incoming = null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
    // Read before the existing CanvasFlow route adapter temporarily uses '/'.
    if (saved && saved.url === entryPath + location.search + location.hash && Date.now() - saved.created < 15000) incoming = saved;
    sessionStorage.removeItem(key);
  } catch {}
  const validId = id => validProject('/projects/' + id + '/');
  const historyVisit = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
  const historyTarget = history.state?.[historyKey];
  const historyReturn = entryPath === '/' && historyVisit && validId(historyTarget?.projectId);
  // Browser Back has no click-transfer record and often restores the original
  // homepage URL without a hash. Recover the target from that history entry,
  // not a session-wide last project that could belong to a different visit.
  if (historyReturn && !incoming) incoming = { color: historyTarget.color, glass: historyTarget.glass };
  const returning = entryPath === '/' && (!!incoming && location.hash === '#featured-projects' || historyReturn);
  if (returning) {
    let projectId = 'canvasflow-art-preview';
    try { projectId = sessionStorage.getItem('portfolio:works-return') || sessionStorage.getItem('portfolio:works-last') || projectId; } catch {}
    if (historyReturn) {
      projectId = historyTarget.projectId;
      try { sessionStorage.setItem('portfolio:works-return', projectId); } catch {}
    }
    window.__portfolioReturnPresentation = { projectId, phase: 'waiting', paintReady: false };
  }
  const canvasflow = entryPath === '/projects/canvasflow-art-preview/';
  if (incoming || canvasflow) {
    window.__portfolioProjectEntry = { incoming: true, canvasflow };
    document.documentElement.dataset.projectEntryPending = 'true';
    document.documentElement.style.setProperty('--project-transition-base', incoming?.color || '#0f1111');
    document.documentElement.style.setProperty('--project-transition-glass', incoming?.glass || 'rgba(30, 38, 53, .28)');
  }
  const fade = current => {
    current.dataset.phase = 'revealing';
    if (reduced() || !current.animate) { current.remove(); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-out', fill: 'forwards' }).finished.catch(() => {}).finally(() => current.remove());
    }));
  };
  let presentationStarted = false;
  const release = () => {
    // A late ready signal from CanvasFlow must never fade an outgoing cover.
    if (navigating || presentationStarted) return;
    if (document.documentElement.dataset.projectEntryPending) {
      overlay = layer(incoming?.color || '#0f1111', incoming?.glass || 'rgba(30, 38, 53, .28)');
      overlay.dataset.phase = 'holding';
    }
    delete document.documentElement.dataset.projectEntryPending;
    if (!overlay) return;
    const current = overlay;
    overlay = null;
    presentationStarted = true;
    if (returning) {
      // Unhide under an opaque glass layer, then allow the real restored scene,
      // grid texture, camera and existing navigation entrance to finish painting.
      const state = window.__portfolioReturnPresentation;
      state.phase = 'preparing';
      state.preparingAt = performance.now();
      waitForSelectedWorksPresentation(state, () => fade(current));
    } else fade(current);
  };
  addEventListener('portfolio:page-ready', release);
  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    const target = history.state?.[historyKey];
    if (entryPath !== '/' || !validId(target?.projectId)) { delete document.documentElement.dataset.projectEntryPending; restore(); return; }
    // BFCache resumes the old document and renderer instead of rerunning head
    // scripts. Retain its outgoing opaque cover until restored scroll/GPU frames
    // are stable; immediately removing it exposes browser/GPU restoration frames.
    clearTimeout(watchdog); navigating = false;
    delete document.documentElement.dataset.projectNavigating;
    delete document.documentElement.dataset.projectEntryPending;
    const current = overlay || document.querySelector('.portfolio-project-transition') || layer(target.color || '#0f1111', target.glass || 'rgba(30, 38, 53, .28)');
    current.dataset.phase = 'holding'; overlay = null;
    const state = window.__portfolioReturnPresentation = { projectId: target.projectId, phase: 'preparing', paintReady: false, preparingAt: performance.now(), history: 'bfcache' };
    try { sessionStorage.setItem('portfolio:works-return', target.projectId); } catch {}
    dispatchEvent(new Event('portfolio:history-return'));
    waitForSelectedWorksPresentation(state, () => fade(current));
  });

  function resolveLink(event) {
    if (!(event.target instanceof Element)) return null;
    let link = event.target.closest('a[href]');
    if (link && (link.matches('.works-visual,.works-detail-link,.works-mobile-visual,[data-works-return],[data-canvasflow-return]'))) return link;
    // Same surface as the cover cursor: a transformed image may hit its plane
    // instead of the anchor. Make that visible surface actually actionable.
    const host = document.querySelector('#featured-projects');
    const plane = host?.querySelector('.works-plane[data-active="true"]');
    const image = plane?.querySelector('.works-visual img');
    if (!image || !plane.contains(event.target)) return null;
    const rect = image.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
    const radius = parseFloat(getComputedStyle(image).borderTopLeftRadius) * rect.width / image.clientWidth;
    const edgeX = Math.min(x, rect.width - x), edgeY = Math.min(y, rect.height - y);
    if (edgeX < radius && edgeY < radius && Math.hypot(radius - edgeX, radius - edgeY) > radius) return null;
    return plane.querySelector('.works-visual');
  }
  function remember(link, url) {
    try {
      if (validProject(url.pathname)) {
        sessionStorage.setItem('portfolio:works-last', url.pathname.split('/')[2]);
        if (location.pathname === '/') sessionStorage.setItem('portfolio:works-origin', location.search);
      } else if (link.matches('[data-works-return],[data-canvasflow-return]')) {
        const id = location.pathname.split('/')[2];
        sessionStorage.setItem('hq:pendingScrollAnchor', '#featured-projects');
        sessionStorage.setItem('portfolio:works-return', id);
        sessionStorage.setItem('portfolio:works-last', id);
      }
    } catch {}
  }
  document.addEventListener('click', async event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = resolveLink(event);
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !(validProject(url.pathname) || (url.pathname === '/' && url.hash === '#featured-projects'))) return;
    event.preventDefault(); event.stopPropagation();
    if (navigating) return;
    navigating = true;
    remember(link, url);
    document.documentElement.dataset.projectNavigating = 'true';
    dispatchEvent(new Event('portfolio:project-open'));
    const cursor = document.querySelector('.works-cover-cursor[data-visible="true"] .works-cover-cursor-content');
    const source = link.matches('.works-visual') && cursor ? cursor : link;
    const rect = source.getBoundingClientRect();
    const style = getComputedStyle(source);
    const x = event.detail ? event.clientX : rect.left + rect.width / 2;
    const y = event.detail ? event.clientY : rect.top + rect.height / 2;
    const width = Math.max(88, Math.min(rect.width, 240)), height = Math.max(38, Math.min(rect.height, 64));
    const left = Math.max(0, Math.min(innerWidth - width, x - width / 2));
    const top = Math.max(0, Math.min(innerHeight - height, y - height / 2));
    // Retain the site's existing tag glass; the matte only closes at the end so
    // cross-document navigation cannot show an empty or partially styled page.
    const background = getComputedStyle(document.body).backgroundColor;
    const color = background === 'rgba(0, 0, 0, 0)' ? (document.documentElement.classList.contains('dark') ? '#0f1111' : '#f2f3f5') : background;
    const glass = style.backgroundImage !== 'none' ? style.backgroundImage : 'linear-gradient(145deg,rgba(69,99,166,.24),rgba(24,39,85,.14))';
    if (entryPath === '/' && validProject(url.pathname)) {
      // Update the current entry, preserving Next's existing state and URL.
      // No extra history entry: the browser's one-step Back still returns here.
      const projectId = url.pathname.split('/')[2];
      try { history.replaceState({ ...history.state, [historyKey]: { projectId, color, glass } }, '', location.href); } catch {}
    }
    overlay = layer(color, glass);
    overlay.dataset.phase = 'covering';
    try { sessionStorage.setItem(key, JSON.stringify({ url: url.pathname + url.search + url.hash, color, glass, created: Date.now() })); } catch {}
    watchdog = setTimeout(restore, 12000);
    if (!reduced() && overlay.animate) {
      const start = `inset(${top}px ${Math.max(0, innerWidth - left - width)}px ${Math.max(0, innerHeight - top - height)}px ${left}px round 999px)`;
      const animation = overlay.animate([{ clipPath: start }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], { duration: 520, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards' });
      overlay.querySelector('.portfolio-project-transition-matte').animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: .45 }, { opacity: 1, offset: 1 }], { duration: 520, easing: 'ease-in', fill: 'forwards' });
      await animation.finished.catch(() => {});
    }
    // Native navigation preserves real URLs, browser history and modified-click
    // behavior. There is one navigation and one cover, no second GPU transition.
    try { location.assign(url.href); } catch { restore(); }
  }, true);
})();
