import { PdfTilePainter } from './project-pdf-tiles.mjs';
import { PdfSegmentPainter } from './project-pdf-segments.mjs';

// Only the configured reading surface is enhanced. Page entry, navigation,
// background and typography remain owned by the existing detail page.
const mountedReaders = new WeakMap();
function mountProjectReaders(root = document) {
  for (const reader of root.querySelectorAll('.project-pdf-reader')) {
    if (!mountedReaders.has(reader)) mountedReaders.set(reader, mountReader(reader));
  }
}
window.__portfolioProjectPdf = {
  mount: mountProjectReaders,
  unmount(root) {
    for (const reader of root.querySelectorAll('.project-pdf-reader')) {
      mountedReaders.get(reader)?.(); mountedReaders.delete(reader);
    }
  }
};
mountProjectReaders();

function mountReader(reader) {
  const shell = reader.closest('.project-pdf-shell'), canvas = reader.querySelector('canvas');
  const controls = shell.querySelector('.project-pdf-controls');
  const minus = controls.querySelector('[data-pdf-out]'), plus = controls.querySelector('[data-pdf-in]');
  const reset = controls.querySelector('[data-pdf-reset]'), retry = controls.querySelector('[data-pdf-retry]');
  const failure = controls.querySelector('.project-pdf-failure');
  const feather = document.createElement('div');
  feather.className = 'project-pdf-feather';
  feather.setAttribute('aria-hidden', 'true');
  // CanvasFlow's foreground owns a stacking context. Keep its feather in that
  // same context so the existing z-index:45 toolbar stays above z-index:43 blur.
  (reader.closest('.canvasflow-detail') || document.body).appendChild(feather);
  const segmented = reader.dataset.renderer === 'continuous-webp';
  // Both shells use the same Lenis engine on their existing scroll host.
  const scroller = reader.closest('.overflow-y-auto');
  const scrollHost = scroller || window;
  const scrollPosition = () => scroller ? scroller.scrollTop : scrollY;
  const restoreScroll = top => {
    const env = window.__portfolioProjectContactScrollEnv;
    if (env) env.lenisScrollTo(top, { immediate: true });
    else if (scroller) scroller.scrollTo({ top, behavior: 'instant' });
    else scrollTo({ top, behavior: 'instant' });
  };
  let manifest, painter, stats, frame = 0, percent = 100, fitWidth = 0, docWidth = 0;
  let panX = 0, anchor = null, drag = null, initializing = false, disposed = false, initVersion = 0;
  const desktop = matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  let dirty = true, wide = 0, narrow = 0, start = 0, distance = 1, progress = 0, manualBase = null;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(paint); };
  const updateControls = () => {
    const rect = reader.getBoundingClientRect();
    const active = rect.top <= 56 && rect.bottom > 80;
    // Separate the feather from the toolbar's entrance transform. Fade in from
    // the real document edge before applying the downward mask: clipping alone
    // cuts through an opaque blur and produces the previous dark leading seam.
    feather.style.left = rect.left + 'px';
    feather.style.width = rect.width + 'px';
    feather.style.setProperty('--pdf-edge-top', rect.top + 'px');
    feather.style.setProperty('--pdf-edge-bottom', rect.bottom + 'px');
    feather.style.setProperty('--pdf-edge-radius', rect.top > 0 ? getComputedStyle(reader).borderTopLeftRadius : '0px');
    feather.dataset.active = String(active);
    controls.dataset.active = String(active);
    controls.inert = !active; controls.setAttribute('aria-hidden', String(!active));
  };
  const focusY = () => Math.max(controls.getBoundingClientRect().bottom + 24, (innerHeight + controls.offsetHeight + 16) / 2);
  const capture = () => {
    if (!manifest || !docWidth) return null;
    const r = reader.getBoundingClientRect(), scale = docWidth / manifest.maxWidth;
    return { y: clamp((focusY() - r.top) / scale, 0, manifest.totalHeight), screenY: focusY(), pan: panX / scale };
  };
  const setPercent = value => {
    anchor = capture();
    // Restore releases manual width so native scrolling controls the column again.
    if (value === 100) manualBase = null; else if (manualBase === null) manualBase = docWidth;
    percent = value; schedule();
  };
  minus.onclick = () => setPercent(percent - 10);
  plus.onclick = () => setPercent(percent + 10);
  reset.onclick = () => setPercent(100);
  retry.onclick = () => {
    failure.hidden = true;
    if (painter) { painter.retry(); schedule(); } else initialize();
  };

  async function initialize() {
    if (initializing || disposed) return;
    initializing = true; const version = ++initVersion;
    try {
      const response = await fetch(reader.dataset.manifest);
      if (!response.ok) throw Error('PDF manifest unavailable');
      const parsed = await response.json();
      if (parsed.sha256 !== reader.dataset.sourceHash || !parsed.staticResources?.complete || (segmented ? parsed.kind !== 'continuous-webp' || parsed.spec?.width !== 3200 || parsed.spec?.quality !== 92 : parsed.resolutionPolicy?.level8 !== 'precomputed-static')) throw Error('PDF resource version mismatch');
      if (disposed || version !== initVersion) return;
      manifest = parsed; painter = segmented ? new PdfSegmentPainter(canvas, manifest, schedule) : new PdfTilePainter(canvas, manifest, schedule);
      reset.disabled = false; schedule();
    } catch (error) {
      if (!disposed && version === initVersion) { failure.hidden = false; schedule(); console.error(error); }
    } finally { initializing = false; }
  }

  function configure() {
    const previous = wide;
    wide = shell.clientWidth;
    narrow = Math.min(wide, clamp(document.documentElement.clientWidth * .44, 640, 760));
    if (manualBase !== null && previous) manualBase *= wide / previous;
    start = Math.max(0, reader.getBoundingClientRect().top + scrollPosition() - innerHeight * .72);
    distance = Math.max(640, innerHeight * 1.05); dirty = false;
  }

  function paint(time) {
    frame = 0; if (disposed) return;
    updateControls();
    if (!painter) return;
    if (dirty) configure();
    const progressAt = y => desktop.matches && !reduced.matches ? clamp((y - start) / distance, 0, 1) : 0;
    const widthAt = y => { const p = progressAt(y); return wide + (narrow - wide) * p * p * (3 - 2 * p); };
    let layoutScroll = scrollPosition();
    if (anchor && manualBase === null) {
      // Solve the coupled width/scroll change when restoring inside the transition.
      const absoluteTop = reader.getBoundingClientRect().top + scrollPosition();
      const targetAt = y => absoluteTop + anchor.y * widthAt(y) / manifest.maxWidth - anchor.screenY;
      let low = 0, high = Math.max(0, targetAt(0));
      for (let n = 0; n < 24; n++) { const mid = (low + high) / 2; if (mid < targetAt(mid)) low = mid; else high = mid; }
      layoutScroll = (low + high) / 2;
    }
    progress = progressAt(layoutScroll);
    const automaticWidth = widthAt(layoutScroll), base = manualBase ?? automaticWidth;
    const maxScale = segmented ? manifest.resolutionPolicy.maxCssZoom : Math.min(manifest.resolutionPolicy.maxCssZoom, Math.max(...manifest.levels) / (devicePixelRatio || 1));
    const maximum = Math.max(100, Math.floor(maxScale / (base / manifest.maxWidth) * 10) * 10);
    percent = clamp(percent, 50, maximum);
    docWidth = manualBase === null ? automaticWidth : manualBase * percent / 100;
    fitWidth = Math.min(wide, docWidth);
    reader.style.width = fitWidth + 'px';
    reader.closest('.project-main,.canvasflow-main').style.setProperty('--project-reading-width', fitWidth + 'px');
    const scale = docWidth / manifest.maxWidth;
    reader.style.height = manifest.totalHeight * scale + 'px';
    if (docWidth > fitWidth + .5) canvas.dataset.horizontalPan = 'true'; else delete canvas.dataset.horizontalPan;
    if (anchor) {
      const absoluteTop = reader.getBoundingClientRect().top + scrollPosition();
      panX = anchor.pan * scale;
      restoreScroll(absoluteTop + anchor.y * scale - anchor.screenY);
      anchor = null;
    }
    panX = clamp(panX, -Math.max(0, (docWidth - fitWidth) / 2), Math.max(0, (docWidth - fitWidth) / 2));
    const rect = reader.getBoundingClientRect(), height = Math.min(innerHeight, rect.height);
    canvas.style.height = height + 'px';
    const canvasRect = canvas.getBoundingClientRect();
    if (rect.top < innerHeight * 1.5 && rect.bottom > 0) {
      stats = painter.draw({ scale, x: (fitWidth - docWidth) / 2 + panX, y: rect.top - canvasRect.top, width: fitWidth, height });
      // Normal reading has no technical status UI. Retry appears only after a
      // currently visible resource failed, and disappears as soon as retried.
      failure.hidden = stats.failedVisible === 0;
    } else failure.hidden = true;
    minus.disabled = percent <= 50; plus.disabled = percent >= maximum;
    reader.dataset.zoom = String(percent);
    updateControls();
    paintNavigation(time);
  }

  // Same centred capsule, entrance and 65 ms pursuit as the accepted project cursor.
  const nav = document.createElement('a');
  nav.className = 'project-pdf-context-link'; nav.tabIndex = -1; nav.setAttribute('aria-hidden', 'true');
  const content = document.createElement('span'); content.className = 'project-pdf-context-link-content'; nav.appendChild(content);
  document.body.appendChild(nav);
  const routes = {
    left: { label: '← ' + reader.dataset.previousTitle, href: reader.dataset.previous },
    right: { label: reader.dataset.nextTitle + ' →', href: reader.dataset.next }
  };
  let pointer = null, side = null, position = null, previousTime = 0;
  function hideNavigation() {
    side = null; position = null; previousTime = 0; nav.dataset.visible = 'false';
    nav.setAttribute('aria-hidden', 'true'); delete document.documentElement.dataset.projectPdfCursor;
  }
  function region(point) {
    if (!desktop.matches || reduced.matches || progress < .88 || !point || document.hidden) return null;
    if (point.x < 24 || point.x >= document.documentElement.clientWidth - 24) return null;
    const target = document.elementFromPoint(point.x, point.y);
    if (target?.closest('a,button,input,textarea,select,[role="button"]')) return null;
    const box = reader.getBoundingClientRect();
    if (point.y < Math.max(28, box.top + 28) || point.y > Math.min(innerHeight - 28, box.bottom - 28)) return null;
    return point.x < box.left - 32 ? 'left' : point.x > box.right + 32 ? 'right' : null;
  }
  function paintNavigation(time) {
    const next = region(pointer); if (!next) { hideNavigation(); return; }
    const changed = side !== next;
    if (changed) { side = next; content.textContent = routes[side].label; nav.href = routes[side].href; nav.dataset.side = side; }
    const box = reader.getBoundingClientRect(), w = nav.offsetWidth, h = nav.offsetHeight;
    const minX = side === 'left' ? 24 + w / 2 : box.right + 40 + w / 2;
    const maxX = side === 'left' ? box.left - 40 - w / 2 : document.documentElement.clientWidth - 24 - w / 2;
    if (maxX < minX) { hideNavigation(); return; }
    const target = { x: clamp(pointer.x, minX, maxX), y: clamp(pointer.y, Math.max(24, box.top + 24) + h / 2, Math.min(innerHeight, box.bottom) - h / 2 - 24) };
    if (!position || changed) { position = target; previousTime = 0; }
    else {
      const dt = previousTime ? Math.min(64, time - previousTime) : 16.67, weight = 1 - Math.exp(-dt / 65);
      position = { x: position.x + (target.x - position.x) * weight, y: position.y + (target.y - position.y) * weight };
    }
    previousTime = time;
    const settled = Math.hypot(target.x - position.x, target.y - position.y) < .1;
    if (settled) { position = target; previousTime = 0; }
    nav.style.setProperty('--project-pdf-nav-x', position.x + 'px'); nav.style.setProperty('--project-pdf-nav-y', position.y + 'px');
    nav.dataset.visible = 'true'; nav.setAttribute('aria-hidden', 'false'); document.documentElement.dataset.projectPdfCursor = 'true';
    if (!settled) schedule();
  }
  addEventListener('pointermove', event => { if (event.pointerType !== 'touch') { pointer = { x: event.clientX, y: event.clientY }; schedule(); } }, { passive: true, signal: events.signal });
  document.documentElement.addEventListener('pointerleave', () => { pointer = null; hideNavigation(); }, { signal: events.signal });
  addEventListener('blur', () => { pointer = null; hideNavigation(); }, { signal: events.signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pointer = null; hideNavigation(); } }, { signal: events.signal });
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.target.closest('a,button,input,textarea,select,[role="button"]')) return;
    const clicked = region({ x: event.clientX, y: event.clientY });
    if (clicked && nav.dataset.visible === 'true') { nav.href = routes[clicked].href; nav.click(); }
  }, { signal: events.signal });
  for (const media of [desktop, reduced]) media.addEventListener('change', () => { dirty = true; schedule(); }, { signal: events.signal });

  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || docWidth <= fitWidth || (event.pointerType === 'touch' && !event.isPrimary)) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, pan: panX, touch: event.pointerType === 'touch', axis: event.pointerType === 'touch' ? null : 'x' };
    if (!drag.touch) canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (drag.axis === null) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (drag.axis === 'x') canvas.setPointerCapture(event.pointerId);
    }
    if (drag.axis !== 'x') return;
    if (drag.touch && event.cancelable) event.preventDefault();
    panX = drag.pan + dx; schedule();
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, e => { if (drag?.id === e.pointerId) drag = null; });
  const resize = () => { anchor = capture(); dirty = true; schedule(); };
  scrollHost.addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', resize, { passive: true });
  document.fonts.ready.then(() => { dirty = true; schedule(); });
  const dispose = () => {
    if (disposed) return;
    disposed = true; initVersion++; cancelAnimationFrame(frame); painter?.destroy();
    events.abort(); hideNavigation(); nav.remove(); feather.remove();
    scrollHost.removeEventListener('scroll', schedule); removeEventListener('resize', resize);
  };
  addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, { signal: events.signal });
  // Nonvisual diagnostics used for regression; never shown as page content.
  reader.pdfReview = {
    get manifest() { return manifest; },
    get stats() { return { render: stats, percent, scale: manifest ? docWidth / manifest.maxWidth : 0, panX, fitWidth, docWidth, wide, narrow, start, distance, progress, manual: manualBase !== null, running: painter?.running || 0 }; },
    async idle() { for (let n = 0; n < 400; n++) { await new Promise(r => setTimeout(r, 25)); if (stats?.ready && !painter.running) return; } throw Error('PDF resources not ready'); }
  };
  initialize();
  return dispose;
}
