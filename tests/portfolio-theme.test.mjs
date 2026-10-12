import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
const source = await readFile(new URL("../portfolio-theme.js", import.meta.url), "utf8");

function boot({ saved = null, dark = false, blocked = false } = {}) {
  const classes = new Set(["notranslate"]), events = new Map(), os = new Map(), ready = new Map();
  const media = { matches: dark, addEventListener: (name, handler) => os.set(name, handler) };
  let value = saved, writes = 0;
  const meta = { content: "#0f1111" };
  const document = {
    documentElement: { classList: { toggle(name, active) { active ? classes.add(name) : classes.delete(name); } }, style: {} },
    querySelector: () => meta, addEventListener: (name, handler) => ready.set(name, handler)
  };
  const window = { matchMedia: () => media, addEventListener: (name, handler) => events.set(name, handler) };
  const localStorage = {
    getItem() { if (blocked) throw new Error("Storage unavailable"); return value; },
    setItem(key, next) { if (blocked) throw new Error("Storage unavailable"); value = next; writes++; }
  };
  runInNewContext(source, { window, document, localStorage });
  return { window, document, classes, meta, writes: () => writes,
    changeOS(next) { media.matches = next; os.get("change")(); },
    changeStorage(next) { value = next; events.get("storage")({ key: "theme" }); }
  };
}

test("saved theme applies synchronously without overwriting preference or unrelated root classes", () => {
  const site = boot({ saved: "dark", dark: false });
  assert.equal(site.window.PortfolioTheme.getResolved(), "dark");
  assert.deepEqual([...site.classes], ["notranslate", "dark"]);
  assert.equal(site.document.documentElement.style.colorScheme, "dark");
  assert.equal(site.writes(), 0);
});
test("system follows OS while an explicit preference remains stable", () => {
  const site = boot({ dark: false });
  site.changeOS(true);
  assert.equal(site.window.PortfolioTheme.getResolved(), "dark");
  site.window.PortfolioTheme.setPreference("light");
  site.changeOS(false); site.changeOS(true);
  assert.equal(site.window.PortfolioTheme.getResolved(), "light");
  assert.equal(site.meta.content, "#fbfaf4");
  assert.equal(site.writes(), 1);
});
test("cross-tab storage changes notify the existing provider and unsubscribe stops notification", () => {
  const site = boot({ saved: "light" });
  const notices = [];
  const unsubscribe = site.window.PortfolioTheme.subscribe(value => notices.push(value.resolved));
  site.changeStorage("dark");
  assert.deepEqual(notices, ["dark"]);
  assert.equal(site.classes.has("light"), false);
  unsubscribe(); site.changeStorage("light");
  assert.deepEqual(notices, ["dark"]);
});
test("invalid or blocked storage safely resolves system; user selection still works in memory", () => {
  const invalid = boot({ saved: "unknown", dark: true });
  assert.equal(invalid.window.PortfolioTheme.getPreference(), "system");
  const blocked = boot({ blocked: true, dark: true });
  blocked.window.PortfolioTheme.setPreference("light");
  assert.equal(blocked.window.PortfolioTheme.getResolved(), "light");
  blocked.window.PortfolioTheme.setPreference("unexpected");
  assert.equal(blocked.window.PortfolioTheme.getPreference(), "light");
});
