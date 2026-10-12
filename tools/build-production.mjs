import { copyFile, lstat, mkdir, open, readFile, readdir, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { basename, dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Export the existing built site. Module builds remain separate and development
// HTML keeps its feedback script; only the production copy removes that script.
const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const runtimeDirectories = new Set(["assets", "_next", "projects", "fonts", "img", "model", "sticker_img", "work"]);
const runtimeExtensions = new Set([".html", ".css", ".js", ".mjs", ".json", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".ico", ".pdf", ".glb", ".gltf", ".bin", ".mp3", ".wav", ".ogg", ".woff", ".woff2", ".ttf", ".otf", ".eot", ".txt", ".xml", ".webmanifest"]);
const outputMarker = ".portfolio-production.json";

function attribute(source, name) {
  const match = source.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match && (match[1] ?? match[2] ?? match[3]);
}

export function stripDevelopmentTools(html) {
  let removed = 0;
  const content = html.replace(/<script\b([^>]*)>[\s\S]*?<\/script\s*>/gi, (tag, attributes) => {
    const src = attribute(attributes, "src");
    if (!src) return tag;
    const pathname = new URL(src, "https://portfolio.invalid/").pathname;
    if (pathname !== "/dev-tools/feedback.js") return tag;
    removed += 1;
    return "";
  });
  return { content, removed };
}

async function collectFiles() {
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(resolve(root, directory), { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const path = directory ? `${directory}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) {
        if (directory || runtimeDirectories.has(entry.name)) throw new Error(`Refusing runtime symlink: ${path}`);
        continue;
      }
      if (entry.isDirectory()) {
        if (directory || runtimeDirectories.has(entry.name)) await walk(path);
      } else if (entry.isFile()) {
        const extension = extname(entry.name).toLowerCase();
        const license = !directory && ["LICENSE", "NOTICE.md"].includes(entry.name);
        if (license || (runtimeExtensions.has(extension) && (directory || extension !== ".json"))) files.push(path);
      }
    }
  }
  await walk("");
  return files.sort();
}

function localReference(url, documentPath) {
  const decoded = url.replaceAll("&amp;", "&");
  if (/^(?:[a-z]+:|\/\/|#)/i.test(decoded)) return null;
  const base = `https://portfolio.invalid/${documentPath}`;
  return decodeURIComponent(new URL(decoded, base).pathname).replace(/^\//, "");
}

function validateHtmlResources(content, documentPath, fileSet) {
  for (const tag of content.matchAll(/<(?:script|link|img|source|video)\b([^>]*)>/gi)) {
    const name = tag[0].match(/^<([a-z]+)/i)[1].toLowerCase();
    const url = attribute(tag[1], name === "link" ? "href" : name === "video" ? "poster" : "src");
    if (!url) continue;
    const path = localReference(url, documentPath);
    if (!path) continue;
    if (path.startsWith("dev-tools/") || !fileSet.has(path)) {
      throw new Error(`Missing production resource: ${documentPath} -> ${url}`);
    }
  }
}

async function assertOutputPath(path, requireMarker = false) {
  const destination = resolve(path);
  if (dirname(destination) !== root || !/^(?:dist|\.dist-(?:stage|backup)-[a-f0-9-]+)$/.test(basename(destination))) {
    throw new Error(`Unsafe production output path: ${destination}`);
  }
  const entry = await lstat(destination).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (entry) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) throw new Error(`Output is not a normal directory: ${destination}`);
    const actual = await realpath(destination);
    if (relative(root, actual).startsWith(`..${sep}`) || dirname(actual) !== root) throw new Error(`Output escapes workspace: ${actual}`);
    if (requireMarker) {
      const marker = JSON.parse(await readFile(resolve(destination, outputMarker), "utf8"));
      if (marker.exporter !== "portfolio-static-production-v1") throw new Error(`Unrecognized output directory: ${destination}`);
    }
  }
  return Boolean(entry);
}

async function removeOwnedOutput(path) {
  if (await assertOutputPath(path, true)) await rm(path, { recursive: true, force: false });
}

export async function buildProduction({ checkOnly = false } = {}) {
  const files = await collectFiles();
  const fileSet = new Set(files);
  if (!fileSet.has("index.html")) throw new Error("Missing built index.html");
  let feedbackScriptsRemoved = 0;
  const html = new Map();
  for (const path of files.filter((path) => extname(path) === ".html")) {
    const source = await readFile(resolve(root, path), "utf8");
    const result = stripDevelopmentTools(source);
    validateHtmlResources(result.content, path, fileSet);
    html.set(path, result.content);
    feedbackScriptsRemoved += result.removed;
  }
  const summary = {
    files: files.length,
    htmlPages: html.size,
    feedbackScriptsRemoved,
    bytes: (await Promise.all(files.map(async (path) => (await stat(resolve(root, path))).size))).reduce((a, b) => a + b, 0),
    excluded: ["dev-tools", "tools", "node_modules", "output", "package*.json", "source maps", "audit documents"],
    checkOnly,
  };
  if (checkOnly) return summary;

  const destination = resolve(root, "dist");
  const token = randomUUID();
  const stage = resolve(root, `.dist-stage-${token}`);
  const backup = resolve(root, `.dist-backup-${token}`);
  const lockPath = resolve(root, ".production-build.lock");
  const lock = await open(lockPath, "wx");
  let previousMoved = false;
  try {
    const hasPrevious = await assertOutputPath(destination, true);
    await assertOutputPath(stage);
    await assertOutputPath(backup);
    await mkdir(stage);
    await writeFile(resolve(stage, outputMarker), JSON.stringify({ exporter: "portfolio-static-production-v1", createdAt: new Date().toISOString(), ...summary }, null, 2));
    for (const path of files) {
      const target = resolve(stage, path);
      await mkdir(dirname(target), { recursive: true });
      if (html.has(path)) await writeFile(target, html.get(path));
      else await copyFile(resolve(root, path), target);
    }
    if (hasPrevious) {
      await rename(destination, backup);
      previousMoved = true;
    }
    await rename(stage, destination);
    if (previousMoved) await removeOwnedOutput(backup);
    return { ...summary, output: destination };
  } catch (error) {
    if (previousMoved && !(await assertOutputPath(destination))) await rename(backup, destination);
    await removeOwnedOutput(stage);
    throw error;
  } finally {
    await lock.close();
    await rm(lockPath, { force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--check")) throw new Error("Usage: node tools/build-production.mjs [--check]");
  console.log(JSON.stringify(await buildProduction({ checkOnly: args.includes("--check") }), null, 2));
}
