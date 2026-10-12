// Reading UI only: the real anchors use the existing return listeners and cover.
import { mountReadingPointer } from './project-reading-pointer.js';
const mounted = new WeakMap();
function mount(root = document) {
  for (const link of root.querySelectorAll('.project-reading-return')) {
    if (mounted.has(link)) continue;
    const scope = link.closest('main');
    const pages = scope?.querySelector('.project-reading-pages');
    if (!pages) continue;
    const disposePointer = mountReadingPointer(pages);
    const scroller = scope.closest('.overflow-y-auto') || window;
    const events = new AbortController();
    let frame = 0, lastActive = false;
    const update = () => {
      frame = 0;
      const rect = pages.getBoundingClientRect();
      const active = rect.top <= 56 && rect.bottom > 80;
      if (active === lastActive) return;
      lastActive = active;
      link.dataset.active = String(active);
      link.inert = !active;
      link.setAttribute('aria-hidden', String(!active));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    for (const [target, event] of [[scroller, 'scroll'], [window, 'resize'], [window, 'pageshow']]) target.addEventListener(event, schedule, { passive: true, signal: events.signal });
    // PDF auto-width/zoom changes height without always generating a scroll.
    const observer = new ResizeObserver(schedule); observer.observe(pages);
    const dispose = () => { events.abort(); observer.disconnect(); cancelAnimationFrame(frame); disposePointer(); mounted.delete(link); };
    window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, { signal: events.signal });
    mounted.set(link, dispose); schedule();
  }
}
window.__portfolioProjectReadingNavigation = {
  mount,
  unmount(root) { for (const link of root.querySelectorAll('.project-reading-return')) mounted.get(link)?.(); }
};
mount();
