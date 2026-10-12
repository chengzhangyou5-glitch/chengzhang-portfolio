// This enhancement is shipped only to Fliggy; native scrolling/routing stays intact.
const reader = document.querySelector('.fliggy-detail-page .project-reading-pages');
if (reader) {
  const desktop = matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const routes = {
    left: { label: '← AIGC 设计提效', href: '/projects/aigc-design-efficiency/' },
    right: { label: '乐心健康 APP →', href: '/projects/lexin-health-app/' },
  };
  const link = document.createElement('a');
  link.className = 'fliggy-context-link';
  const content = document.createElement('span');
  content.className = 'fliggy-context-link-content';
  link.appendChild(content);
  link.tabIndex = -1;
  link.setAttribute('aria-hidden', 'true');
  document.body.appendChild(link);
  let progress = 0, enabled = false, frame = 0, geometryDirty = true;
  let start = 0, distance = 1, wide = 0, narrow = 0, writtenWidth = -1;
  let pointer = null, side = null, position = null, previousTime = 0;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const hide = () => {
    side = null; position = null; previousTime = 0;
    link.dataset.visible = 'false';
    link.setAttribute('aria-hidden', 'true');
    delete document.documentElement.dataset.fliggyReadingCursor;
  };
  const configure = () => {
    enabled = desktop.matches && !reduced.matches;
    const viewport = document.documentElement.clientWidth;
    wide = reader.parentElement.clientWidth;
    narrow = Math.min(wide, clamp(viewport * .44, 640, 760));
    start = Math.max(0, reader.getBoundingClientRect().top + scrollY - innerHeight * .72);
    distance = Math.max(640, innerHeight * 1.05);
    geometryDirty = false;
    writtenWidth = -1;
    if (!enabled) {
      document.body.style.removeProperty('--fliggy-reading-width');
      hide();
    }
  };
  const region = point => {
    if (!enabled || progress < .88 || !point || document.hidden) return null;
    if (point.x < 24 || point.x >= document.documentElement.clientWidth - 24) return null;
    const target = document.elementFromPoint(point.x, point.y);
    if (target?.closest('a,button,input,textarea,select,[role="button"]')) return null;
    const rect = reader.getBoundingClientRect();
    if (point.y < Math.max(28, rect.top + 28) || point.y > Math.min(innerHeight - 28, rect.bottom - 28)) return null;
    if (point.x < rect.left - 32) return 'left';
    if (point.x > rect.right + 32) return 'right';
    return null;
  };
  const paint = time => {
    frame = 0;
    if (geometryDirty) configure();
    if (!enabled) return;
    progress = clamp((scrollY - start) / distance, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    const width = Math.round((wide + (narrow - wide) * eased) * 100) / 100;
    if (width !== writtenWidth) {
      document.body.style.setProperty('--fliggy-reading-width', `${width}px`);
      writtenWidth = width;
    }
    const nextSide = region(pointer);
    if (!nextSide) { hide(); return; }
    const changed = side !== nextSide;
    if (changed) {
      side = nextSide;
      content.textContent = routes[side].label;
      link.href = routes[side].href;
      link.dataset.side = side;
    }
    const rect = reader.getBoundingClientRect();
    const widthOfLink = link.offsetWidth, height = link.offsetHeight;
    const minX = side === 'left' ? 24 + widthOfLink / 2 : rect.right + 40 + widthOfLink / 2;
    const maxX = side === 'left' ? rect.left - 40 - widthOfLink / 2 : document.documentElement.clientWidth - 24 - widthOfLink / 2;
    if (maxX < minX) { hide(); return; }
    const target = {
      x: clamp(pointer.x, minX, maxX),
      y: clamp(pointer.y, Math.max(24, rect.top + 24) + height / 2, Math.min(innerHeight, rect.bottom) - height / 2 - 24),
    };
    if (!position || changed) { position = target; previousTime = 0; }
    else {
      // Same frame-rate independent 65 ms pursuit as the Selected Works cursor.
      const delta = previousTime ? Math.min(64, time - previousTime) : 16.67;
      const weight = 1 - Math.exp(-delta / 65);
      position = { x: position.x + (target.x - position.x) * weight, y: position.y + (target.y - position.y) * weight };
    }
    previousTime = time;
    const settled = Math.hypot(target.x - position.x, target.y - position.y) < .1;
    if (settled) { position = target; previousTime = 0; }
    link.style.setProperty('--fliggy-nav-x', `${position.x}px`);
    link.style.setProperty('--fliggy-nav-y', `${position.y}px`);
    link.dataset.visible = 'true';
    link.setAttribute('aria-hidden', 'false');
    document.documentElement.dataset.fliggyReadingCursor = 'true';
    if (!settled) schedule();
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { geometryDirty = true; schedule(); }, { passive: true });
  addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    pointer = { x: event.clientX, y: event.clientY, target: event.target };
    schedule();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointer = null; hide(); });
  addEventListener('blur', () => { pointer = null; hide(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pointer = null; hide(); } });
  // The visual cursor does not intercept hit testing. Its underlying blank
  // reading gutter supplies the native-link destination; other controls remain native.
  document.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.target.closest('a,button,input,textarea,select,[role="button"]')) return;
    const clickedSide = region({ x: event.clientX, y: event.clientY, target: event.target });
    if (!clickedSide || link.dataset.visible !== 'true') return;
    link.href = routes[clickedSide].href;
    link.click();
  });
  for (const media of [desktop, reduced]) media.addEventListener('change', () => { geometryDirty = true; schedule(); });
  document.fonts.ready.then(() => { geometryDirty = true; schedule(); });
  schedule();
}
