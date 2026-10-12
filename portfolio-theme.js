/* Shared theme preference for the React shell and standalone project routes. */
(() => {
  if (window.PortfolioTheme) return;
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const listeners = new Set();
  const valid = value => ["light", "dark", "system"].includes(value);
  const read = () => {
    try { const value = localStorage.getItem("theme"); return valid(value) ? value : "system"; }
    catch { return "system"; }
  };
  let preference = read();
  let resolved;
  function apply() {
    resolved = preference === "system" ? media.matches ? "dark" : "light" : preference;
    root.classList.toggle("light", resolved === "light");
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
    syncMeta();
    for (const listener of listeners) listener({ preference, resolved });
  }
  function syncMeta() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = resolved === "dark" ? "#0f1111" : "#fbfaf4";
  }
  window.PortfolioTheme = Object.freeze({
    getPreference: () => preference,
    getResolved: () => resolved,
    setPreference(value) {
      const next = typeof value === "function" ? value(preference) : value;
      if (!valid(next)) return;
      preference = next;
      try { localStorage.setItem("theme", next); } catch {}
      apply();
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  });
  media.addEventListener("change", () => { if (preference === "system") apply(); });
  window.addEventListener("storage", event => {
    if (event.key !== "theme" && event.key !== null) return;
    preference = read();
    apply();
  });
  document.addEventListener("DOMContentLoaded", syncMeta, { once: true });
  window.addEventListener("pageshow", event => { if (event.persisted) { preference = read(); apply(); } });
  apply();
})();
