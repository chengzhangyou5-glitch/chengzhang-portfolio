import React from "react";
import { portfolioGridGeometry } from "./project-detail-background.mjs";

const h = React.createElement;
export function ProjectDetail({ project, next, pages }) {
  const grid = portfolioGridGeometry(1707, 932);
  const info = [["担任角色", project.role], ...(project.period ? [["项目时间", project.period]] : []), ["项目定位", project.positioning]];
  const archive = (label, text, key) => h("section", { className: "project-archive-section", key }, h("h2", null, label), h("p", null, text));
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
      h("a", { className: "project-back", href: "/#featured-projects", "data-works-return": true }, h("span", { "aria-hidden": true }, "←"), "返回精选项目"))),
    h("main", { className: "project-main" },
      h("section", { className: "project-hero", "aria-labelledby": "project-title" },
        h("div", { className: "project-hero-columns" },
          h("article", { className: "project-archive", id: "project-archive" },
            h("div", { className: "project-kicker" }, h("span", null, project.number), h("span", null, "/ SELECTED WORK")),
            h("h1", { id: "project-title", lang: project.id === "canvasflow-art-preview" ? "en" : undefined }, project.title),
            h("p", { className: "project-subtitle" }, project.subtitle),
            h("ul", { className: "project-tags", "aria-label": "设计方向" }, project.tags.map(tag => h("li", { key: tag }, tag))),
            h("dl", { className: "project-metadata" }, info.map(([label, text]) => h("div", { key: label }, h("dt", null, label), h("dd", null, text)))),
            h("div", { className: "project-archive-body" },
              archive("项目背景", project.background, "background"),
              archive("项目目标", project.objective, "objective"),
              h("section", { className: "project-archive-section" }, h("h2", null, "核心工作"), h("ul", { className: "project-contributions" }, project.contributions.map((text, index) => h("li", { key: index }, text)))),
              archive("实际成果", project.outcome, "outcome"))),
          h("figure", { className: "project-cover" },
            h("img", { src: project.cover.src, width: project.cover.width, height: project.cover.height, alt: `${project.title} · ${project.cover.caption}`, fetchPriority: "high", decoding: "async" }),
            h("figcaption", null, h("span", null, project.cover.caption), h("span", { lang: "en" }, `${project.number} / 04`)))),
        h("a", { className: "project-scroll-cue", href: "#project-reading" }, h("span", { "aria-hidden": true }, "↓"), "向下浏览完整项目")),
      h("section", { className: "project-reading", id: "project-reading", "aria-labelledby": "project-reading-title" },
        h("div", { className: "project-reading-heading" },
          h("div", null, h("p", { className: "project-reading-kicker", lang: "en" }, "PROJECT / IN DETAIL"), h("h2", { id: "project-reading-title" }, "完整项目"),
            h("p", { className: "project-reading-caption" }, project.reading.kind === "pdf" ? "按原始 PDF 页序连续阅读" : "项目内容待接入")),
          project.reading.kind === "pdf" ? h("a", { className: "project-pdf-link", href: project.reading.pdf, download: `${project.title}.pdf` }, "下载原始 PDF", h("span", { "aria-hidden": true }, "↗")) : h("span", { className: "project-placeholder-status" }, "临时占位")),
        h("div", { className: "project-reading-pages", "data-reading-kind": project.reading.kind },
          project.reading.kind === "pdf" ? pages.map((page, index) => h("figure", { className: "project-pdf-page", key: page.number, "aria-label": `项目 PDF 第 ${page.number} 页`, "data-page": page.number },
            page.tiles.map((tile, tileIndex) => h("img", { key: tile.src, src: tile.src, width: tile.width, height: tile.height, alt: tileIndex === 0 ? `${project.title} · PDF 第 ${page.number} 页` : "", loading: "lazy", decoding: "async" }))))
            : Array.from({ length: project.reading.pages }, (_, index) => h("div", { className: "project-placeholder-page", key: index, "aria-label": `项目内容待接入 · 占位第 ${index + 1} 页` },
              h("span", { className: "project-placeholder-number", lang: "en" }, `${project.number} / ${String(index + 1).padStart(2, "0")}`),
              h("div", { className: "project-placeholder-center" }, h("p", null, project.title), h("h3", null, "项目内容待接入")),
              h("span", { className: "project-placeholder-footer" }, "预留完整项目 PDF 连续阅读区域"))))),
      h("nav", { className: "project-footer", "aria-label": "项目导航" },
        h("a", { href: "/#featured-projects", "data-works-return": true }, "← 返回精选项目"),
        h("a", { href: `/projects/${next.id}/` }, h("span", null, "下一个项目"), h("strong", null, next.title), h("span", { "aria-hidden": true }, "↗")))),
    h("script", { src: "/portfolio-projects.js", defer: true, "data-project-id": project.id }));
}
