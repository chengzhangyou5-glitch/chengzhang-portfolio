// Uses the captured page's existing React (i), scroll environment (g), and scroll hooks (A).
// No extra animation loop or scrolling engine is introduced.
function portfolioNavigationTarget(anchor) {
  if (anchor !== "#featured-projects") return anchor;
  return document.querySelector("#selected-work > .grid > article") || "#selected-work";
}

function usePortfolioNavigationSection(pathname, width, height) {
  const scrollTop = A.useScrollTopPx();
  const container = g.scrollEnv.useContainerEl();
  const [active, setActive] = i.useState(null);

  const update = i.useCallback(() => {
    if (pathname !== "/") {
      setActive(previous => previous === null ? previous : null);
      return;
    }
    const viewportTop = container?.getBoundingClientRect().top || 0;
    const readingLine = viewportTop + g.scrollEnv.getViewportHeightPx() * 0.35;
    const markers = [
      ["about", document.querySelector("#about")],
      ["experience", document.querySelector("#work-experience")],
      ["projects", document.querySelector("#selected-work > .grid > article")],
      ["contact", document.querySelector("#contact")]
    ].filter(([, element]) => element)
      .map(([name, element]) => ({ name, top: element.getBoundingClientRect().top }))
      .sort((first, second) => first.top - second.top);
    let next = null;
    for (const marker of markers) {
      if (marker.top <= readingLine) next = marker.name;
    }
    setActive(previous => previous === next ? previous : next);
  }, [pathname, container]);

  i.useEffect(update, [update, scrollTop, width, height]);
  i.useEffect(() => {
    const observer = new ResizeObserver(update);
    for (const selector of ["#about", "#selected-work", "#contact"]) {
      const element = document.querySelector(selector);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [update]);

  return active;
}
