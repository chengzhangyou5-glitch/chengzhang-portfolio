// Injected into the existing Three scene module (React `u`, Three `sy`, R3F
// `sv`). Composite the original SVG in the BACKGROUND pass, before all image
// planes / 3D meshes. Moving a DOM grid behind HTML alone cannot protect
// portraits and project images that are rendered in the same opaque canvas.
function usePortfolioBackgroundGrid(target, renderer) {
  const invalidate = (0, sv.useThree)(state => state.invalidate);
  (0, u.useEffect)(() => {
    const material = target.current || target;
    if (!material?.uniforms) return;
    let disposed = false;
    let generation = 0;
    let texture = null;
    const clear = () => {
      material.uniforms.uPortfolioGridReady.value = 0;
      material.uniforms.uPortfolioGrid.value = null;
      texture?.dispose();
      texture = null;
    };
    const update = source => {
      const version = ++generation;
      if (!source) { clear(); invalidate(); return; }
      // Match the canvas pixel density while respecting GPU texture limits.
      const ratio = Math.min(renderer.getPixelRatio(), renderer.capabilities.maxTextureSize / Math.max(source.width, source.height));
      const image = new Image();
      image.onload = () => {
        if (disposed || version !== generation) return;
        const next = new sy.Texture(image);
        next.colorSpace = sy.NoColorSpace;
        next.minFilter = sy.LinearFilter;
        next.magFilter = sy.LinearFilter;
        next.generateMipmaps = false;
        next.needsUpdate = true;
        texture?.dispose();
        texture = next;
        material.uniforms.uPortfolioGrid.value = texture;
        material.uniforms.uPortfolioGridReady.value = 1;
        invalidate();
      };
      const svg = source.svg.replace("<svg ", `<svg width="${Math.round(source.width * ratio)}" height="${Math.round(source.height * ratio)}" `);
      image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    };
    const onSource = event => update(event.detail);
    window.addEventListener("portfolio-grid-source", onSource);
    update(window.__portfolioGridSource);
    return () => {
      disposed = true;
      ++generation;
      window.removeEventListener("portfolio-grid-source", onSource);
      clear();
    };
  }, [target, renderer, invalidate]);
}
