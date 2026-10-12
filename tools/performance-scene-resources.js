// Resource timing only: readiness, geometry, materials and frame clocks stay unchanged.
const portfolioSceneLoadingGate = e.i(97839);
function usePortfolioSceneResource(props, critical) {
  const [mounted, setMounted] = u.useState(critical);
  const loading = portfolioSceneLoadingGate.useHomeLoadingGate();
  u.useEffect(() => {
    if (mounted || critical) return;
    let observer, frame = 0, attempts = 0;
    const section = props.sectionName === "footer" ? "contact" : props.sectionName || props.layerKey;
    const activate = () => { setMounted(true); observer?.disconnect(); };
    const intent = event => {
      const target = event.target?.closest?.('[data-portfolio-nav],a[href^="#"]');
      const destination = target?.dataset.portfolioNav || target?.getAttribute("href")?.slice(1);
      if (destination === section || (section === "banner" && destination === "home")) activate();
    };
    const attach = () => {
      const element = props.targetRef?.current || s0.findSection(props.sectionPosition, props.sectionName)?.ref?.current;
      if (!element) {
        if (++attempts < 120) frame = requestAnimationFrame(attach);
        else activate(); // Missing observer support/geometry must never hide content forever.
        return;
      }
      if (typeof IntersectionObserver === "undefined") { activate(); return; }
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) activate();
      }, { rootMargin: `${Math.round(s0.getViewportHeightPx() * (section === "contact" ? 6 : 2))}px 0px` });
      observer.observe(element);
    };
    document.addEventListener("pointerover", intent, { passive: true });
    document.addEventListener("focusin", intent);
    document.addEventListener("click", intent, { passive: true });
    if (!loading) attach();
    return () => {
      cancelAnimationFrame(frame); observer?.disconnect();
      document.removeEventListener("pointerover", intent);
      document.removeEventListener("focusin", intent);
      document.removeEventListener("click", intent);
    };
  }, [mounted, critical, loading, props.sectionPosition, props.sectionName, props.targetRef, props.layerKey]);
  return mounted || critical;
}
