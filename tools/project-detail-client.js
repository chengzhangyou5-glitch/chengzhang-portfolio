import { portfolioGridGeometry } from "./project-detail-background.mjs";

const grid = document.querySelector(".project-background-grid");
const renderGrid = () => {
  if (!grid) return;
  const width = document.documentElement.clientWidth, height = window.innerHeight;
  const geometry = portfolioGridGeometry(width, height);
  grid.setAttribute("viewBox", `0 0 ${width} ${height}`);
  for (const [name, path] of Object.entries(geometry)) grid.querySelector(`[data-grid-path="${name}"]`).setAttribute("d", path);
};
let frame = 0;
renderGrid();
window.addEventListener("resize", () => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(renderGrid);
}, { passive: true });

// Keep the existing homepage return position and selected-project behavior.
const projectId = document.querySelector("script[data-project-id]").dataset.projectId;
document.querySelectorAll("[data-works-return]").forEach(link => {
  try {
    const origin = sessionStorage.getItem("portfolio:works-origin") || "";
    link.href = "/" + (origin.startsWith("?") ? origin : "") + "#featured-projects";
  } catch {}
  link.addEventListener("click", () => {
    try {
      sessionStorage.setItem("hq:pendingScrollAnchor", "#featured-projects");
      sessionStorage.setItem("portfolio:works-return", projectId);
    } catch {}
  });
});
