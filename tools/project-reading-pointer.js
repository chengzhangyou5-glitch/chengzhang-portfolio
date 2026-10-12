import { ResiduePointerOverlay } from './sticker-residue-motion.generated.js';
import { ResidueVector2 } from './sticker-residue-math.js';

// PDF foreground covers the background GPU cursor. Present the same original
// trail state above the document, clipped to its actual (zoomed) viewport.
export function mountReadingPointer(pages) {
  const media = matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const canvas = document.createElement('canvas');
  canvas.className = 'project-reading-pointer'; canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d'), overlay = new ResiduePointerOverlay(), pointer = new ResidueVector2(.5, .5);
  const events = new AbortController(), scroller = pages.closest('.overflow-y-auto') || window;
  let frame = 0, lastTime = 0, point = null, disposed = false, headerLayer = false;
  const sRGB = n => Math.round(255 * (n <= .0031308 ? n * 12.92 : 1.055 * n ** (1 / 2.4) - .055));
  const color = overlay.uniforms.uPointerColor.value.toArray().map(sRGB);
  const clear = () => { ctx?.clearRect(0, 0, canvas.width, canvas.height); };
  const tick = now => {
    frame = 0; if (disposed || !ctx || document.hidden) return;
    const dt = Math.min((now - (lastTime || now - 16.667)) / 1000, .1); lastTime = now;
    if (!media.matches) { overlay.trailStrength.fill(0); clear(); return; }
    const box = pages.getBoundingClientRect();
    // Directly opened static details have no homepage GPU checkpoint. Supply
    // the header cursor there too; never duplicate a restored scene's cursor.
    const headerFallback = !document.querySelector('.canvasflow-background-shell') && !window.__portfolioStickerResidue?.detail?.canvas;
    const replaced = document.documentElement.hasAttribute('data-project-pdf-cursor');
    const eligible = media.matches && !replaced;
    const target = point && document.elementFromPoint(point.x, point.y);
    const inDocument = point && point.x >= box.left && point.x < box.right && point.y >= Math.max(0, box.top) && point.y < Math.min(innerHeight, box.bottom);
    const inHeader = headerFallback && point && point.y >= 0 && point.y < Math.min(innerHeight, box.top);
    if (point) headerLayer = !!inHeader;
    // Match the GPU route: the header trail sits behind the glass cards so
    // their real backdrop blur applies. PDF content still needs a foreground.
    canvas.style.zIndex = headerLayer ? '0' : '44';
    const active = eligible && (inDocument || inHeader) && !target?.closest('a,button,input,textarea,select,[role="button"]');
    if (!eligible) overlay.trailStrength.fill(0);
    overlay.setDisplayMetrics(innerWidth, innerHeight, Math.min(devicePixelRatio, 2));
    overlay.updatePointer(pointer, !!active, dt);
    const ratio = Math.min(devicePixelRatio, 2), w = Math.round(innerWidth * ratio), h = Math.round(innerHeight * ratio);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    clear();
    if (eligible && (headerFallback && box.top > 0 || box.bottom > 0 && box.top < innerHeight)) {
      ctx.save(); ctx.scale(ratio, ratio); ctx.beginPath();
      if (headerLayer) ctx.rect(0, 0, innerWidth, Math.max(0, Math.min(innerHeight, box.top)));
      else ctx.roundRect(box.left, box.top, box.width, box.height, parseFloat(getComputedStyle(pages).borderTopLeftRadius) || 0);
      ctx.clip();
      // Match the original shader's bottom-origin pixel grid and max strength
      // per cell (overlapping trail samples must not brighten a pixel twice).
      const size = overlay.pixelSize, cells = new Map();
      for (let i = 0; i < overlay.uniforms.uTrailCount.value; i++) {
        const strength = overlay.trailStrength[i]; if (strength <= .001) continue;
        const x = Math.floor(overlay.trail[i].x * innerWidth / size) * size;
        const y = innerHeight - (Math.floor(overlay.trail[i].y * innerHeight / size) + 1) * size;
        const key = x + ',' + y, previous = cells.get(key);
        if (!previous || previous.strength < strength) cells.set(key, { x, y, strength });
      }
      ctx.fillStyle = 'rgb(' + color.join(' ') + ')';
      for (const cell of cells.values()) { ctx.globalAlpha = cell.strength; ctx.fillRect(cell.x, cell.y, size, size); }
      ctx.restore();
    }
    if (overlay.trailStrength.slice(active ? 1 : 0, 14).some(n => n > .001)) schedule();
  };
  const schedule = () => { if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(tick); };
  const move = event => { if (event.pointerType === 'touch') return; point = { x: event.clientX, y: event.clientY }; pointer.set(point.x / innerWidth, 1 - point.y / innerHeight); schedule(); };
  const leave = () => { point = null; schedule(); };
  for (const [host, type, handler] of [[window, 'pointermove', move], [window, 'pointerdown', move], [window, 'blur', leave], [document.documentElement, 'pointerleave', leave], [scroller, 'scroll', schedule], [window, 'resize', schedule]]) host.addEventListener(type, handler, { passive: true, signal: events.signal });
  const cursorObserver = new MutationObserver(() => {
    if (document.documentElement.hasAttribute('data-project-pdf-cursor')) { overlay.trailStrength.fill(0); clear(); }
    schedule();
  });
  cursorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-project-pdf-cursor'] });
  const resizeObserver = new ResizeObserver(schedule); resizeObserver.observe(pages);
  media.addEventListener('change', schedule, { signal: events.signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { point = null; overlay.trailStrength.fill(0); clear(); cancelAnimationFrame(frame); frame = 0; lastTime = 0; } else schedule(); }, { signal: events.signal });
  window.addEventListener('pagehide', () => { point = null; overlay.trailStrength.fill(0); clear(); cancelAnimationFrame(frame); frame = 0; lastTime = 0; }, { signal: events.signal });
  window.addEventListener('pageshow', schedule, { signal: events.signal });
  schedule();
  return () => { disposed = true; events.abort(); cursorObserver.disconnect(); resizeObserver.disconnect(); cancelAnimationFrame(frame); canvas.remove(); };
}
