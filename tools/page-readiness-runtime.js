// Injected into the existing transition module; `r` is its React instance.
// Cache changes the presentation policy, never the actual readiness checks.
function usePortfolioPageReadiness(sceneReady, idle) {
  const [entry, setEntry] = r.useState(null);
  const [foregroundReady, setForegroundReady] = r.useState(false);
  r.useEffect(() => {
    const path = window.__portfolioEntryPath || location.pathname;
    let cached = false, returnId = null;
    try {
      cached = sessionStorage.getItem('portfolio:revealed:' + path) === '1';
      returnId = sessionStorage.getItem('portfolio:works-return');
    } catch { /* Disabled storage still uses real readiness. */ }
    const returning = path === '/' && (location.hash === '#featured-projects' || !!returnId || !!window.__portfolioReturnPresentation);
    if (returning && window.__portfolioReturnPresentation) returnId = window.__portfolioReturnPresentation.projectId;
    let internal = false;
    try { internal = new URL(document.referrer).origin === location.origin; } catch {}
    const historyVisit = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
    setEntry({ path, returning, returnId, fast: cached || returning || internal || historyVisit });
  }, []);

  r.useEffect(() => {
    if (!entry || !sceneReady) return;
    let cancelled = false, frame = 0;
    const decoded = new WeakSet(), decoding = new WeakSet();
    function imageReady(image) {
      if (!image?.complete || !image.naturalWidth) return false;
      if (decoded.has(image)) return true;
      if (!decoding.has(image)) {
        decoding.add(image);
        // A supported decoder must finish before exposing the current cover.
        (image.decode ? image.decode() : Promise.resolve()).then(() => {
          if (!cancelled) decoded.add(image);
        }).catch(() => { decoding.delete(image); });
      }
      return false;
    }
    function inspect() {
      if (cancelled) return;
      let ready;
      if (entry.path === '/projects/canvasflow-art-preview/') {
        const stylesheet = document.querySelector('link[href="/portfolio-canvasflow.css"]');
        ready = !!document.querySelector('#project-title') && !!stylesheet?.sheet &&
          imageReady(document.querySelector('.project-overview-cover img'));
      } else if (entry.returning) {
        // Existing selected-works code restores scroll as soon as sceneReady is
        // true. Wait for that foreground rather than briefly exposing the hero.
        const host = document.querySelector('#featured-projects');
        const stage = host?.querySelector('.works-stage');
        const rect = stage?.getBoundingClientRect();
        const selected = !entry.returnId || host?.dataset.activeProject === entry.returnId;
        const desktop = matchMedia('(min-width: 901px) and (min-height: 621px)').matches;
        const pinnedPhone = matchMedia('(min-width: 360px) and (max-width: 900px) and (min-height: 800px)').matches;
        if (desktop || pinnedPhone) {
          ready = selected && !!rect && rect.top < innerHeight && rect.bottom > 0 &&
            imageReady(host?.querySelector('.works-plane[data-active="true"] img'));
        } else {
          const rows = [...(host?.querySelectorAll('.works-mobile-project') || [])];
          const target = rows.find(row => row.querySelector('[data-project-id]')?.dataset.projectId === entry.returnId) || rows[0];
          const rowRect = target?.getBoundingClientRect();
          ready = !!rowRect && rowRect.top < innerHeight && rowRect.bottom > 0 && imageReady(target?.querySelector('img'));
        }
      } else {
        ready = !!document.querySelector('header');
      }
      if (ready) setForegroundReady(true);
      else frame = requestAnimationFrame(inspect);
    }
    frame = requestAnimationFrame(inspect);
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [entry, sceneReady]);

  r.useEffect(() => {
    if (!idle || !entry || !foregroundReady) return;
    try { sessionStorage.setItem('portfolio:revealed:' + entry.path, '1'); } catch {}
  }, [idle, entry, foregroundReady]);
  return { ready: !!entry && foregroundReady, fast: !!entry?.fast };
}
