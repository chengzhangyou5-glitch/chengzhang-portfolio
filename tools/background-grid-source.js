// Injected into the existing SVG grid module (React is `i`). The original
// path calculations remain the single source of truth for spacing and style.
function usePortfolioGridSource({ width, height, verticalPath, horizontalPath, crossPath, loading }) {
  (0, i.useEffect)(() => {
    if (loading || width <= 0 || height <= 0) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><path d="${verticalPath}" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" fill="none"/><path d="${horizontalPath}" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" fill="none"/><path d="${crossPath}" stroke="#FFFFFF" stroke-width="1" fill="none" opacity="0.4"/></svg>`;
    const source = { width, height, svg };
    window.__portfolioGridSource = source;
    window.dispatchEvent(new CustomEvent("portfolio-grid-source", { detail: source }));
    return () => {
      if (window.__portfolioGridSource === source) {
        delete window.__portfolioGridSource;
        window.dispatchEvent(new CustomEvent("portfolio-grid-source", { detail: null }));
      }
    };
  }, [width, height, verticalPath, horizontalPath, crossPath, loading]);
}
