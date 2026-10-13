// Decide the phone layout before CSS/React paint. Address-bar height changes do
// not change that decision; returning from a detail keeps the same tab/width mode.
(() => {
  if (window.__portfolioWorksLayout) return;
  const root = document.documentElement;
  const key = 'portfolio:works-phone-layout:v1';
  const modes = new Map();
  let width = 0, phone = false, pinned = false;
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || '{}');
    for (const [size, mode] of Object.entries(saved)) {
      const value = typeof mode === 'string' ? { mode, height: Math.max(800, innerHeight) } : mode;
      if (Number(size) >= 360 && Number(size) <= 900 && ['stage', 'list'].includes(value?.mode) && Number.isFinite(value.height)) modes.set(Number(size), value);
    }
  } catch { /* Layout still stays stable in this document if storage is disabled. */ }
  const update = () => {
    const next = Math.round(innerWidth);
    if (next === width) return;
    width = next; phone = width >= 360 && width <= 900;
    if (phone) {
      if (!modes.has(width)) modes.set(width, { mode: innerHeight >= 800 ? 'stage' : 'list', height: innerHeight });
      const { mode, height } = modes.get(width);
      pinned = mode === 'stage'; root.dataset.worksPhoneMode = mode;
      root.style.setProperty('--works-phone-cover-height', height + 'px');
      try { sessionStorage.setItem(key, JSON.stringify(Object.fromEntries(modes))); } catch {}
    } else {
      pinned = false; delete root.dataset.worksPhoneMode; root.style.removeProperty('--works-phone-cover-height');
    }
    dispatchEvent(new Event('portfolio:works-layout'));
  };
  window.__portfolioWorksLayout = {
    get() {
      return { width, phone, pinned, reading: phone ? !pinned : matchMedia('(max-width: 900px), (max-height: 620px)').matches };
    },
    stageHeight(host, viewport = innerHeight) {
      return pinned ? host.querySelector('.works-stage').getBoundingClientRect().height : viewport;
    }
  };
  update();
  addEventListener('resize', update, { passive: true });
  addEventListener('pageshow', update, { passive: true });
})();
