import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";
import { ProjectDetail } from "./project-detail-component.mjs";
import { projectDetails } from "./project-detail-content.mjs";
import { buildCanvasflowDetail } from "./build-canvasflow-detail.mjs";

const root = new URL("../", import.meta.url);
const escape = value => value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
export async function buildProjectDetails({ only = null } = {}) {
  if (only && !projectDetails.some(project => project.id === only)) throw new Error(`Unknown project: ${only}`);
  await build({ entryPoints: [fileURLToPath(new URL("project-detail-client.js", import.meta.url))], bundle: true, outfile: fileURLToPath(new URL("portfolio-projects.js", root)), format: "iife", target: "es2022", minify: false });
  for (const [index, project] of projectDetails.entries()) {
    if (only && project.id !== only) continue;
    // CanvasFlow uses the newer approved four-block composition.
    if (project.id === "canvasflow-art-preview") continue;
    if (project.reading.kind === "pdf" && (!project.reading.pdf || !project.reading.manifest)) throw new Error(`${project.id}: PDF and page manifest are required.`);
    await readFile(new URL(project.cover.src.slice(1), root));
    const pages = project.reading.kind === "pdf" ? JSON.parse(await readFile(new URL(project.reading.manifest, root), "utf8")).pages : [];
    if (project.reading.kind === "pdf") {
      await readFile(new URL(project.reading.pdf.slice(1), root));
      if (!pages.length) throw new Error(`${project.id}: PDF page manifest is empty.`);
      for (const page of pages) for (const tile of page.tiles) await readFile(new URL(tile.src.slice(1), root));
    }
    let markup = renderToStaticMarkup(React.createElement(ProjectDetail, { project, next: projectDetails[(index + 1) % projectDetails.length], pages }));
    const preload = markup.match(/<link rel="preload"[^>]+\/>/g)?.join("") || "";
    markup = markup.replace(/<link rel="preload"[^>]+\/>/g, "");
    const html = `<!doctype html><html lang="zh-CN" translate="no" class="notranslate"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="google" content="notranslate"><meta name="description" content="${escape(project.background)}"><meta name="theme-color" content="#0f1111"><title>${escape(project.title)} — 游承樟</title><link rel="icon" href="/icon.svg"><link rel="stylesheet" href="/portfolio-fonts.css"><link rel="stylesheet" href="/portfolio-projects.css">${preload}</head><body class="project-detail-page">${markup}</body></html>`;
    const directory = new URL(`projects/${project.id}/`, root);
    await mkdir(directory, { recursive: true });
    await writeFile(new URL("index.html", directory), html);
  }
  if (!only || only === "canvasflow-art-preview") await buildCanvasflowDetail();
  console.log(`Built ${only ? 1 : projectDetails.length} shared project detail pages; homepage files untouched.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildProjectDetails({ only: process.argv.find(arg => arg.startsWith("--only="))?.slice(7) });
