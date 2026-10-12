import { Lenis } from './lenis-core.generated.mjs';

// The same engine/options as CanvasFlow, adapted to the static detail's existing
// document scroll host. Keep its DOM, sticky reader, history and background.
export function mountProjectScroll() {
  if (!document.body.classList.contains('project-detail-page') || window.__portfolioProjectScroll) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let lenis = null, frame = 0, paused = false;
  const root = document.documentElement;
  const tick = time => {
    frame = 0;
    if (paused || !lenis) return;
    lenis.raf(time);
    frame = requestAnimationFrame(tick);
  };
  const schedule = () => { if (!frame && !paused && lenis) frame = requestAnimationFrame(tick); };
  const configure = () => {
    cancelAnimationFrame(frame); frame = 0;
    lenis?.destroy(); lenis = null;
    if (!reduced.matches) {
      lenis = new Lenis({
        lerp: .1, smoothWheel: true, syncTouch: true, anchors: true, autoRaf: false,
        prevent: node => !!node.closest?.('dialog[open]') || root.style.overflow === 'hidden'
      });
      schedule();
    }
  };
  const env = {
    getContainerEl: () => root,
    getScrollTopPx: () => scrollY,
    lenisScrollTo(target, options = {}) {
      if (lenis) lenis.scrollTo(target, options);
      else {
        const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY;
        scrollTo({ top, behavior: 'instant' });
        options.onComplete?.();
      }
    },
    get instance() { return lenis; }
  };
  window.__portfolioProjectScroll = env;
  window.__portfolioProjectContactScrollEnv = env;
  configure();
  reduced.addEventListener('change', configure);
  addEventListener('pagehide', event => {
    paused = true; cancelAnimationFrame(frame); frame = 0;
    if (!event.persisted) { lenis?.destroy(); reduced.removeEventListener('change', configure); }
  });
  addEventListener('pageshow', () => { paused = false; lenis?.resize(); schedule(); });
}
