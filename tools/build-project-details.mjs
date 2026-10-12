import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";
import { ProjectDetail } from "./project-detail-component.mjs";
import { projectDetails } from "./project-detail-content.mjs";
import { buildCanvasflowDetail } from "./build-canvasflow-detail.mjs";
import { buildProjectContact } from "./build-project-contact.mjs";

const root = new URL("../", import.meta.url);
const escape = value => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const usesReader = project => ["lossless-tiles", "continuous-webp"].includes(project.reading.renderer);
export async function buildProjectDetails({ only = null } = {}) {
  await buildProjectContact();
  await build({ entryPoints: [fileURLToPath(new URL("sticker-residue-detail.js", import.meta.url))], bundle: true, outfile: fileURLToPath(new URL("portfolio-sticker-residue.js", root)), format: "iife", target: "es2022" });
  await build({ entryPoints: [fileURLToPath(new URL("project-reading-navigation.js", import.meta.url))], bundle: true, outfile: fileURLToPath(new URL("portfolio-project-reading-navigation.js", root)), format: "iife", target: "es2022" });
  if (only && !projectDetails.some(project => project.id === only)) throw new Error(`Unknown project: ${only}`);
  await build({ entryPoints: [fileURLToPath(new URL("project-detail-client.js", import.meta.url))], bundle: true, outfile: fileURLToPath(new URL("portfolio-projects.js", root)), format: "iife", target: "es2022", minify: false });
  if ((!only || only === "fliggy-lele-run") && !usesReader(projectDetails.find(project => project.id === "fliggy-lele-run"))) await build({ entryPoints: [fileURLToPath(new URL("fliggy-reading-runtime.js", import.meta.url))], bundle: true, outfile: fileURLToPath(new URL("portfolio-fliggy-reading.js", root)), format: "iife", target: "es2022", minify: false });
  if (projectDetails.some(project => (!only || project.id === only) && usesReader(project))) await build({ entryPoints: [fileURLToPath(new URL("project-pdf-reader.js", import.meta.url))], bundle: true, outfile: fileURLToPath(new URL("portfolio-project-pdf.js", root)), format: "iife", target: "es2022", minify: false });
  for (const [index, project] of projectDetails.entries()) {
    if (only && project.id !== only) continue;
    // CanvasFlow uses the newer approved four-block composition.
    if (project.id === "canvasflow-art-preview") continue;
    if (project.reading.kind === "pdf" && (!project.reading.pdf || !project.reading.manifest)) throw new Error(`${project.id}: PDF and page manifest are required.`);
    await readFile(new URL(project.cover.src.slice(1), root));
    const lossless = project.reading.renderer === "lossless-tiles";
    const enhanced = usesReader(project);
    const pdfManifest = project.reading.kind === "pdf" ? JSON.parse(await readFile(new URL(project.reading.manifest, root), "utf8")) : null;
    const pages = pdfManifest?.pages || [];
    if (project.reading.kind === "pdf") {
      await readFile(new URL(project.reading.pdf.slice(1), root));
      if (!pages.length) throw new Error(`${project.id}: PDF page manifest is empty.`);
      if (enhanced) {
        if (pdfManifest.sha256 !== project.reading.sourceHash || !pdfManifest.staticResources?.complete || (lossless ? pdfManifest.resolutionPolicy.level8 !== "precomputed-static" : pdfManifest.kind !== "continuous-webp" || pdfManifest.spec.width !== 3200 || pdfManifest.spec.quality !== 92 || pdfManifest.spec.maxHeight !== 4096)) throw new Error("Complete version-matched PDF resources required.");
        if (!lossless) {
          const source = await readFile(new URL(project.reading.pdf.slice(1), root));
          if (createHash("sha256").update(source).digest("hex") !== pdfManifest.sha256) throw new Error("Source PDF checksum mismatch.");
          let end = 0;
          for (const segment of pdfManifest.segments) {
            if (segment.top !== end || segment.height <= 0 || segment.width !== 3200 || segment.imageHeight > 4096 || segment.imageTop > segment.top || segment.imageTop + segment.imageHeight < segment.top + segment.height) throw new Error("PDF segment gap or invalid dimensions.");
            end += segment.height;
          }
          if (end !== pdfManifest.totalHeight) throw new Error("Incomplete continuous document.");
        }
        const resourceRoot = new URL("./", new URL(project.reading.manifest, root));
        const records = JSON.parse(await readFile(new URL("resources.json", resourceRoot), "utf8"));
        for (const record of records) {
          const resource = new URL(record.path, resourceRoot);
          if (!resource.href.startsWith(resourceRoot.href)) throw new Error("PDF resource outside version directory.");
          const bytes = await readFile(resource);
          if (bytes.length !== record.bytes || createHash("sha256").update(bytes).digest("hex") !== record.sha256) throw new Error(`PDF resource checksum mismatch: ${record.path}`);
        }
      } else for (const page of pages) for (const tile of page.tiles) await readFile(new URL(tile.src.slice(1), root));
    }
    let markup = renderToStaticMarkup(React.createElement(ProjectDetail, { project, previous: projectDetails[(index + projectDetails.length - 1) % projectDetails.length], next: projectDetails[(index + 1) % projectDetails.length], pages, pdfManifest }));
    const preload = markup.match(/<link rel="preload"[^>]+\/>/g)?.join("") || "";
    markup = markup.replace(/<link rel="preload"[^>]+\/>/g, "");
    const fliggy = project.id === "fliggy-lele-run";
    const routeStyle = (enhanced ? '<link rel="stylesheet" href="/portfolio-project-pdf.css"><link rel="stylesheet" href="/portfolio-project-navigation.css">' : fliggy ? '<link rel="stylesheet" href="/portfolio-fliggy-reading.css">' : '') + '<link rel="stylesheet" href="/portfolio-project-document.css">';
    if (enhanced) markup += '<script src="/portfolio-project-pdf.js" defer></script>';
    if (fliggy && !enhanced) {
      const originalFooter = '<nav class="project-footer" aria-label="项目导航">';
      const footerStart = markup.indexOf(originalFooter), footerEnd = markup.indexOf('</nav>', footerStart);
      if (footerStart < 0 || footerEnd < 0) throw new Error('Fliggy footer boundary missing.');
      const next = projectDetails[(index + 1) % projectDetails.length];
      const footer = `<nav class="project-footer" aria-label="项目导航"><a href="/#featured-projects" data-works-return="true"><span class="fliggy-footer-label">上一级页面</span><span class="fliggy-footer-destination">← 返回精选项目</span></a><a href="/projects/${next.id}/"><span class="fliggy-footer-label">下一个项目</span><span class="fliggy-footer-destination"><strong>${escape(next.title)}</strong><span aria-hidden="true">↗</span></span></a></nav>`;
      markup = markup.slice(0, footerStart) + footer + markup.slice(footerEnd + 6);
      markup += '<script src="/portfolio-fliggy-reading.js" defer></script>';
    }
    const directory = new URL(`projects/${project.id}/`, root);
    // Keep the existing site's click-origin cover bootstrap without rebuilding
    // the homepage/other routes through the global entry pipeline.
    let entryAssets = '';
    try { if ((await readFile(new URL("index.html", directory), "utf8")).includes('/portfolio-project-entry.js')) entryAssets = '<link rel="stylesheet" href="/portfolio-project-entry.css"><script src="/portfolio-project-entry.js"></script>'; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    entryAssets += '<link rel="stylesheet" href="/portfolio-contact.css"><link rel="stylesheet" href="/portfolio-project-contact.css"><script src="/portfolio-project-contact-entry.js" defer></script><link rel="stylesheet" href="/portfolio-project-reading-navigation.css"><script src="/portfolio-project-reading-navigation.js" defer></script>';
    const html = `<!doctype html><html lang="zh-CN" translate="no" class="notranslate"><head><script src="/portfolio-theme.js"></script>${entryAssets}<script src="/portfolio-sticker-residue.js"></script><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="google" content="notranslate"><meta name="description" content="${escape(project.background)}"><meta name="theme-color" content="#0f1111"><title>${escape(project.title)}｜游承樟</title><link rel="icon" href="/icon.svg?v=20261013"><link rel="stylesheet" href="/portfolio-fonts.css"><link rel="stylesheet" href="/portfolio-projects.css"><link rel="stylesheet" href="/portfolio-project-hero.css">${routeStyle}${preload}</head><body class="project-detail-page${fliggy ? ' fliggy-detail-page' : ''}">${markup}</body></html>`;
    await mkdir(directory, { recursive: true });
    await writeFile(new URL("index.html", directory), html);
  }
  if (!only || only === "canvasflow-art-preview") await buildCanvasflowDetail();
  console.log(`Built ${only ? 1 : projectDetails.length} shared project detail pages; homepage files untouched.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildProjectDetails({ only: process.argv.find(arg => arg.startsWith("--only="))?.slice(7) });
