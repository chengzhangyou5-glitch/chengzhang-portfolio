import React from "react";
import { ProjectDetailHero } from "./project-detail-hero.mjs";
import { portfolioGridGeometry } from "./project-detail-background.mjs";

const h = React.createElement;
// Reuse the approved CanvasFlow heading/action row on every document.
export function ProjectDocumentHeading({ headingId, canvasflow = false }) {
  return h(React.Fragment, null,
    h("h2", { id: headingId }, "完整项目"),
    h("button", { type: "button", className: canvasflow ? "canvasflow-pdf-download" : "project-pdf-link", "data-project-contact": true, "aria-haspopup": "dialog", "aria-controls": "contact-connect-dialog" }, "联系获取 PDF", h("span", { "aria-hidden": true }, "↗")));
}
// These attributes join the existing return/context/transition listeners.
export function ProjectReadingReturn({ canvasflow = false }) {
  return h("a", { className: "project-reading-return", href: "/#featured-projects", [canvasflow ? "data-canvasflow-return" : "data-works-return"]: true, "data-active": "false", "aria-hidden": true, inert: true },
    h("span", { "aria-hidden": true }, "←"), "返回精选项目");
}
// Reuse the accepted two-level footer; project-specific routes are data only.
export function ProjectNavigation({ next, canvasflow = false }) {
  return h("nav", { className: "project-footer project-template-navigation", "aria-label": "项目导航" },
    h("a", { href: "/#featured-projects", [canvasflow ? "data-canvasflow-return" : "data-works-return"]: true },
      h("span", { className: "project-footer-label" }, "上一级页面"),
      h("span", { className: "project-footer-destination" },
        h("span", { className: "project-footer-arrow", "aria-hidden": true }, "←"),
        h("span", { className: "project-footer-title" }, "返回精选项目"))),
    h("a", { href: `/projects/${next.id}/` },
      h("span", { className: "project-footer-label" }, "下一个项目"),
      h("span", { className: "project-footer-destination" }, h("strong", { className: "project-footer-title" }, next.title), h("span", { className: "project-footer-arrow", "aria-hidden": true }, "↗"))));
}
// Shared reading surface: same markup for static details and the mounted CanvasFlow route.
export function ProjectPdfReader({ project, previous, next, pdfManifest }) {
  return h("div", { className: "project-pdf-shell" },
          h("div", { className: "project-pdf-controls", "aria-label": "阅读缩放", "aria-hidden": true, "data-active": "false", inert: true },
            h("button", { className: "project-pdf-control", type: "button", "data-pdf-out": true, "aria-label": "缩小 10%", disabled: true }, h("svg", { viewBox: "0 0 24 24", "aria-hidden": true }, h("path", { d: "M5 12h14" }))),
            h("button", { className: "project-pdf-control", type: "button", "data-pdf-reset": true, disabled: true }, "恢复原状"),
            h("button", { className: "project-pdf-control", type: "button", "data-pdf-in": true, "aria-label": "放大 10%", disabled: true }, h("svg", { viewBox: "0 0 24 24", "aria-hidden": true }, h("path", { d: "M5 12h14M12 5v14" }))),
            h("div", { className: "project-pdf-failure", role: "alert", hidden: true }, h("span", null, "内容加载失败，请重试。"), h("button", { className: "project-pdf-control", type: "button", "data-pdf-retry": true }, "重试"))),
          h("div", { className: "project-reading-pages project-pdf-reader", "data-reading-kind": project.reading.renderer === "continuous-webp" ? "continuous-pdf" : "lossless-pdf", "data-renderer": project.reading.renderer, "data-manifest": "/" + project.reading.manifest, "data-source-hash": project.reading.sourceHash, "data-previous": `/projects/${previous.id}/`, "data-previous-title": previous.title, "data-next": `/projects/${next.id}/`, "data-next-title": next.title, style: { aspectRatio: `${pdfManifest.maxWidth} / ${pdfManifest.totalHeight}` } },
            h("canvas", { className: "project-pdf-canvas", tabIndex: 0, "aria-label": `${project.title} · 完整 ${pdfManifest.pages.length} 页连续阅读` }),
            h("noscript", null, h("a", { href: project.reading.pdf }, "打开原稿 PDF"))));
}

export function ProjectDetail({ project, previous, next, pages, pdfManifest }) {
  const grid = portfolioGridGeometry(1707, 932);
  const enhanced = ["lossless-tiles", "continuous-webp"].includes(project.reading.renderer);
  return h(React.Fragment, null,
    h("a", { className: "project-skip", href: "#project-archive" }, "跳至项目内容"),
    h("div", { className: "project-background", "aria-hidden": true },
      h("div", { className: "project-background-pixels" }),
      h("svg", { className: "project-background-grid", viewBox: "0 0 1707 932", xmlns: "http://www.w3.org/2000/svg" },
        h("path", { "data-grid-path": "vertical", d: grid.vertical }),
        h("path", { "data-grid-path": "horizontal", d: grid.horizontal }),
        h("path", { "data-grid-path": "crosses", d: grid.crosses }))),
    h("header", { className: "project-header" }, h("div", { className: "project-header-inner" },
      h("a", { className: "project-brand", href: "/" }, "CHENGZHANG YOU"),
      h("a", { className: "project-back", href: "/#featured-projects", "data-works-return": true }, h("svg", { className: "project-back-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true }, h("use", { href: "/assets/icons/experience-tabler.svg#chevron-down" })), "返回精选项目"))),
    h("main", { className: "project-main" },
      h(ProjectReadingReturn),
      h(ProjectDetailHero, { project }),
      h("section", { className: "project-reading project-document", id: "project-reading", "aria-labelledby": "project-reading-title" },
        h(ProjectDocumentHeading, { headingId: "project-reading-title" }),
        enhanced ? h(ProjectPdfReader, { project, previous, next, pdfManifest }) : h("div", { className: "project-reading-pages", "data-reading-kind": project.reading.kind },
          project.reading.kind === "pdf" ? pages.map((page, index) => h("figure", { className: "project-pdf-page", key: page.number, "aria-label": `项目 PDF 第 ${page.number} 页`, "data-page": page.number },
            page.tiles.map((tile, tileIndex) => h("img", { key: tile.src, src: tile.src, width: tile.width, height: tile.height, alt: tileIndex === 0 ? `${project.title} · PDF 第 ${page.number} 页` : "", loading: "lazy", decoding: "async" }))))
            : Array.from({ length: project.reading.pages }, (_, index) => h("div", { className: "project-placeholder-page", key: index, "aria-label": `项目内容待接入 · 占位第 ${index + 1} 页` },
              h("span", { className: "project-placeholder-number", lang: "en" }, `${project.number} / ${String(index + 1).padStart(2, "0")}`),
              h("div", { className: "project-placeholder-center" }, h("p", null, project.title), h("h3", null, "项目内容待接入")),
              h("span", { className: "project-placeholder-footer" }, "预留完整项目 PDF 连续阅读区域"))))),
      enhanced ? h(ProjectNavigation, { next }) : h("nav", { className: "project-footer", "aria-label": "项目导航" },
        h("a", { href: "/#featured-projects", "data-works-return": true }, "← 返回精选项目"),
        h("a", { href: `/projects/${next.id}/` }, h("span", null, "下一个项目"), h("strong", null, next.title), h("span", { "aria-hidden": true }, "↗")))),
    h("script", { src: "/portfolio-projects.js", defer: true, "data-project-id": project.id }));
}
