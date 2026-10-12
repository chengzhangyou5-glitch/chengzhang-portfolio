// Readiness probe inside the existing renderer; no new pass or visual changes.
function PortfolioReturnPaintReadyFrame() {
  const { gl, scene, camera, size } = sv.useThree();
  const { resolvedTheme } = sM.useThemeMode();
  const stable = u.useRef(0), lastFrame = u.useRef(-1);
  sA.useFrame(() => {
    const state = window.__portfolioReturnPresentation;
    if (!state || state.phase !== 'preparing') { stable.current = 0; return; }
    const range = size.width >= 1024 ? cN : cJ;
    const targetZ = sy.MathUtils.lerp(range.min, range.max, sT(sI));
    const domScroll = document.querySelector('.overflow-y-auto')?.scrollTop;
    let grids = 0, gridsReady = true;
    scene.traverse(object => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        const grid = material?.uniforms?.uPortfolioGridReady;
        if (grid) { grids++; gridsReady &&= grid.value > .5; }
      }
    });
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const ready = grids >= 2 && gridsReady && !!window.__portfolioGridSource && resolvedTheme === theme && (window.__portfolioStickerResidue?.sceneReady() ?? true) &&
      Math.abs(s0.getScrollTopPx() - domScroll) <= 1 && Math.abs(camera.position.z - targetZ) < .001 && sT(sI) > .999;
    // Observe completed render frames rather than merely counting CPU callbacks.
    stable.current = ready && gl.info.render.frame > lastFrame.current ? stable.current + 1 : 0;
    lastFrame.current = gl.info.render.frame;
    state.paintReady = stable.current >= 3;
    state.paint = { gridsReady, grids, cameraZ: camera.position.z, targetZ, renderFrame: gl.info.render.frame, scroll: s0.getScrollTopPx() };
  });
  return null;
}
