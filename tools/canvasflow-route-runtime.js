// Uses the existing captured scene/scroll providers, but mounts no hidden home
// sections. Only the approved background renderer and grid remain on this route.
function fb() {
  const [mounted, setMounted] = u.useState(false);
  const { width, height } = fi.useWindowSize();
  const { readyToLoadHeavy } = cL.useRouteTransitionController();
  const { fontsLoaded } = e.i(23525).useShellMedia();
  const banner = u.useRef(null), footer = u.useRef(null);
  const sections = u.useMemo(() => {
    const h = Math.max(1, height);
    return [
      { name: 'banner', ref: banner, x: 0, y: -h, width, height: h },
      { name: 'footer', ref: footer, x: 0, y: h * 100, width, height: h }
    ];
  }, [width, height]);
  u.useLayoutEffect(() => { sI = 1; }, []);
  u.useEffect(() => {
    window.__canvasflowRestoreRoute?.();
    document.title = PORTFOLIO_CANVASFLOW_TITLE;
    const container = document.querySelector('.overflow-y-auto')?.firstElementChild;
    if (!container) return;
    const host = document.createElement('div');
    host.innerHTML = PORTFOLIO_CANVASFLOW_CONTENT;
    container.appendChild(host);
    window.__portfolioProjectContactScrollEnv = e.i(29680).scrollEnv;
    const mountReader = () => window.__portfolioProjectPdf?.mount(host);
    const readerScript = document.querySelector('script[src="/portfolio-project-pdf.js"]');
    mountReader();
    readerScript?.addEventListener('load', mountReader, { once: true });
    const mountReadingNavigation = () => window.__portfolioProjectReadingNavigation?.mount(host);
    const navigationScript = document.querySelector('script[src="/portfolio-project-reading-navigation.js"]');
    mountReadingNavigation();
    navigationScript?.addEventListener('load', mountReadingNavigation, { once: true });
    const remember = () => {
      try {
        sessionStorage.setItem('hq:pendingScrollAnchor', '#featured-projects');
        sessionStorage.setItem('portfolio:works-return', 'canvasflow-art-preview');
        sessionStorage.setItem('portfolio:works-last', 'canvasflow-art-preview');
      } catch {}
    };
    const links = host.querySelectorAll('[data-canvasflow-return]');
    links.forEach(link => {
      try { const origin = sessionStorage.getItem('portfolio:works-origin') || ''; link.href = '/' + (origin.startsWith('?') ? origin : '') + '#featured-projects'; } catch {}
      link.addEventListener('click', remember);
    });
    setMounted(true);
    return () => { links.forEach(link => link.removeEventListener('click', remember)); readerScript?.removeEventListener('load', mountReader); navigationScript?.removeEventListener('load', mountReadingNavigation); window.__portfolioProjectReadingNavigation?.unmount(host); window.__portfolioProjectPdf?.unmount(host); delete window.__portfolioProjectContactScrollEnv; host.remove(); };
  }, []);
  u.useEffect(() => {
    if (!mounted) return;
    const shell = document.querySelector('.canvasflow-background-shell');
    if (!shell) return;
    // The homepage composites this SVG into its image pass and hides the DOM
    // copy. This route retains its existing direct SVG treatment instead.
    const showGrid = () => {
      const grid = shell.querySelector('.portfolio-background-grid');
      if (grid?.hasAttribute('hidden')) grid.removeAttribute('hidden');
    };
    const observer = new MutationObserver(showGrid);
    observer.observe(shell, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    showGrid();
    return () => observer.disconnect();
  }, [mounted]);
  u.useEffect(() => {
    if (!readyToLoadHeavy || !fontsLoaded) return;
    let cancelled = false, frame = 0;
    const check = async () => {
      const image = document.querySelector('.project-overview-cover img');
      if (!image?.complete || !image.naturalWidth) { frame = requestAnimationFrame(check); return; }
      try { await image.decode(); } catch { frame = requestAnimationFrame(check); return; }
      await window.__portfolioStickerResidue?.ready;
      if (!cancelled) requestAnimationFrame(() => {
        if (!cancelled) dispatchEvent(new Event('portfolio:page-ready'));
      });
    };
    frame = requestAnimationFrame(check);
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [readyToLoadHeavy, fontsLoaded]);
  if (!mounted) return null;
  return s.jsxs('div', { className: 'canvasflow-background-shell', children: [
    s.jsx(sd, { hidden: true, collapsed: false }),
    s.jsxs('div', { className: 'portfolio-background-layer top-0 left-0 -z-1 fixed w-full h-dvh lg:h-screen', children: [
      s.jsx(cV, { sectionPosition: sections, domImages: { layers: [] } }),
      s.jsx(portfolioBackgroundGrid.default, {})
    ] }) ] });
}
