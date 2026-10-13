// Runs only for a transferred detail -> Selected Works navigation. The glass
// remains opaque while the existing page finishes restoring and painting.
export function waitForSelectedWorksPresentation(state, onReady) {
  let frame = 0, previous = '', stableFrames = 0;
  function opacity(element, stop) {
    let value = 1;
    for (let node = element; node && node !== stop; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.visibility === 'hidden' || style.display === 'none') return 0;
      value *= Number(style.opacity);
    }
    return value;
  }
  function navigation() {
    const header = document.querySelector('header');
    if (!header) return null;
    const labels = [];
    for (const control of header.querySelectorAll('a,button')) {
      const rect = control.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= innerHeight) continue;
      if (opacity(control, header.parentElement) < .999) return null;
      const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.trim() && opacity(walker.currentNode.parentElement, control.parentElement) < .999) return null;
      }
      labels.push(control.textContent.trim());
    }
    return labels.length ? labels.join('|') : null;
  }
  function inspect() {
    if (state.phase !== 'preparing') return;
    const host = document.querySelector('#featured-projects');
    const stage = host?.querySelector('.works-stage');
    const pinned = !window.__portfolioWorksLayout.get().reading;
    let image, positionReady;
    if (pinned) {
      image = host?.querySelector('.works-plane[data-active="true"] img');
      const planes = [...(host?.querySelectorAll('.works-plane') || [])];
      const index = planes.findIndex(plane => plane.dataset.projectId === state.projectId);
      const progress = Number(host?.dataset.worksScrollProgress);
      positionReady = index >= 0 && host?.dataset.activeProject === state.projectId && Math.abs(stage?.getBoundingClientRect().top ?? Infinity) <= 1 &&
        Math.abs(progress - index) * window.__portfolioWorksLayout.stageHeight(host) <= .5;
    } else {
      const row = [...(host?.querySelectorAll('.works-mobile-project') || [])].find(element => element.querySelector('[data-project-id]')?.dataset.projectId === state.projectId);
      image = row?.querySelector('img');
      positionReady = Math.abs((row?.getBoundingClientRect().top ?? Infinity) - 90) <= 1;
    }
    const labels = navigation(), rect = image?.getBoundingClientRect();
    const geometry = rect && [rect.left, rect.top, rect.width, rect.height].map(n => Math.round(n * 4) / 4).join(',');
    const signature = `${geometry}|${labels}|${document.querySelector('.overflow-y-auto')?.scrollTop}`;
    const ready = positionReady && image?.complete && image.naturalWidth && labels && state.paintReady;
    stableFrames = ready && signature === previous ? stableFrames + 1 : 0;
    previous = signature;
    if (stableFrames >= 3) {
      state.phase = 'stable';
      state.stableAt = performance.now();
      dispatchEvent(new Event('portfolio:return-stable'));
      onReady();
      return;
    }
    frame = requestAnimationFrame(inspect);
  }
  frame = requestAnimationFrame(inspect);
  return () => cancelAnimationFrame(frame);
}
