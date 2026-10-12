// Uses the captured scene's React (`u`), JSX (`s`) and frame hook (`sA`).
function portfolioSceneEntry() {
  if (typeof window === 'undefined') return 'hero';
  const path = window.__portfolioEntryPath || location.pathname;
  if (path !== '/') return 'detail';
  if (window.__portfolioReturnPresentation) return 'works';
  if (location.hash === '#featured-projects') return 'works';
  if (location.hash === '#contact' || location.hash === '#footer') return 'contact';
  if (location.hash === '#about') return 'about';
  if (location.hash === '#work-experience') return 'works';
  return 'hero';
}
function portfolioCriticalModels(entry) {
  return entry === 'hero' ? ['hello', 'h_star'] : entry === 'contact' ? ['cnt'] : [];
}
function portfolioCriticalLayers(entry, layers) {
  // Homepage project covers are ordinary DOM images, not these refractive planes.
  // The About portrait is a scene texture and must be ready on a direct About entry.
  return entry === 'about' ? layers.filter(layer => layer.key === 'about') : [];
}
function PortfolioDeferredModel(props) {
  const entry = u.useRef(portfolioSceneEntry()).current;
  const key = props.model.includes("hello") ? "hello" : props.model.includes("cursor") ? "h_star" : "cnt";
  // Keep the compact Contact model warm on a hero visit: moving its first parse
  // into a fast mobile scroll regressed frames. It remains outside the ready contract.
  const warmShader = entry === "hero" && key === "cnt";
  const mounted = usePortfolioSceneResource(props, portfolioCriticalModels(entry).includes(key) || warmShader);
  return mounted ? s.jsx(u.Suspense, { fallback: null, children: s.jsx(cp, props) }) : null;
}
function PortfolioDeferredImage(props) {
  const entry = u.useRef(portfolioSceneEntry()).current;
  // The portrait is the immediately adjacent screen: prewarm before the first scroll.
  const mounted = usePortfolioSceneResource(props, (entry === "about" || entry === "hero") && props.layerKey === "about");
  return mounted ? s.jsx(u.Suspense, { fallback: null, children: s.jsx(cw, props) }) : null;
}
function PortfolioSceneReadyFrame({ ready, onReady }) {
  const frames = u.useRef(0), done = u.useRef(false), pending = u.useRef(0);
  u.useEffect(() => () => cancelAnimationFrame(pending.current), []);
  sA.useFrame(() => {
    if (done.current) return;
    if (!ready) { frames.current = 0; return; }
    // Complete two scene frames, then signal outside the render callback. This
    // also permits an empty detail backdrop while its off-page models load.
    if (++frames.current >= 2) {
      done.current = true;
      pending.current = requestAnimationFrame(onReady);
    }
  });
  return null;
}
