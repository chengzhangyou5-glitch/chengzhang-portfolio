(() => {
  // tools/return-readiness-runtime.js
  function waitForSelectedWorksPresentation(state, onReady) {
    let frame = 0, previous = "", stableFrames = 0;
    function opacity(element, stop) {
      let value = 1;
      for (let node = element; node && node !== stop; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.visibility === "hidden" || style.display === "none") return 0;
        value *= Number(style.opacity);
      }
      return value;
    }
    function navigation() {
      const header = document.querySelector("header");
      if (!header) return null;
      const labels = [];
      for (const control of header.querySelectorAll("a,button")) {
        const rect = control.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= innerHeight) continue;
        if (opacity(control, header.parentElement) < 0.999) return null;
        const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          if (walker.currentNode.textContent.trim() && opacity(walker.currentNode.parentElement, control.parentElement) < 0.999) return null;
        }
        labels.push(control.textContent.trim());
      }
      return labels.length ? labels.join("|") : null;
    }
    function inspect() {
      if (state.phase !== "preparing") return;
      const host = document.querySelector("#featured-projects");
      const stage = host?.querySelector(".works-stage");
      const pinned = matchMedia("(min-width: 901px) and (min-height: 621px)").matches || matchMedia("(min-width: 360px) and (max-width: 900px) and (min-height: 800px)").matches;
      let image, positionReady;
      if (pinned) {
        image = host?.querySelector('.works-plane[data-active="true"] img');
        const planes = [...host?.querySelectorAll(".works-plane") || []];
        const index = planes.findIndex((plane) => plane.dataset.projectId === state.projectId);
        const progress = Number(host?.dataset.worksScrollProgress);
        positionReady = index >= 0 && host?.dataset.activeProject === state.projectId && Math.abs(stage?.getBoundingClientRect().top ?? Infinity) <= 1 && Math.abs(progress - index) * innerHeight <= 0.5;
      } else {
        const row = [...host?.querySelectorAll(".works-mobile-project") || []].find((element) => element.querySelector("[data-project-id]")?.dataset.projectId === state.projectId);
        image = row?.querySelector("img");
        positionReady = Math.abs((row?.getBoundingClientRect().top ?? Infinity) - 90) <= 1;
      }
      const labels = navigation(), rect = image?.getBoundingClientRect();
      const geometry = rect && [rect.left, rect.top, rect.width, rect.height].map((n) => Math.round(n * 4) / 4).join(",");
      const signature = `${geometry}|${labels}|${document.querySelector(".overflow-y-auto")?.scrollTop}`;
      const ready = positionReady && image?.complete && image.naturalWidth && labels && state.paintReady;
      stableFrames = ready && signature === previous ? stableFrames + 1 : 0;
      previous = signature;
      if (stableFrames >= 3) {
        state.phase = "stable";
        state.stableAt = performance.now();
        dispatchEvent(new Event("portfolio:return-stable"));
        onReady();
        return;
      }
      frame = requestAnimationFrame(inspect);
    }
    frame = requestAnimationFrame(inspect);
    return () => cancelAnimationFrame(frame);
  }

  // tools/project-entry-runtime.js
  (() => {
    if (window.__portfolioProjectEntryInstalled) return;
    window.__portfolioProjectEntryInstalled = true;
    const key = "portfolio:project-entry";
    const historyKey = "portfolioSelectedReturn";
    const entryPath = window.__portfolioEntryPath || location.pathname;
    const validProject = (path) => /^\/projects\/(canvasflow-art-preview|aigc-design-efficiency|fliggy-lele-run|lexin-health-app)\/$/.test(path);
    const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    let overlay = null, navigating = false, watchdog = 0;
    function restore() {
      clearTimeout(watchdog);
      overlay?.remove();
      overlay = null;
      navigating = false;
      delete document.documentElement.dataset.projectNavigating;
    }
    function layer(color, glass) {
      const element = document.createElement("div");
      element.className = "portfolio-project-transition";
      element.setAttribute("aria-hidden", "true");
      element.style.setProperty("--project-transition-base", color);
      element.style.setProperty("--project-transition-glass", glass);
      element.innerHTML = '<div class="portfolio-project-transition-matte"></div><div class="portfolio-project-transition-glass"></div>';
      document.body.appendChild(element);
      return element;
    }
    let incoming = null;
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || "null");
      if (saved && saved.url === entryPath + location.search + location.hash && Date.now() - saved.created < 15e3) incoming = saved;
      sessionStorage.removeItem(key);
    } catch {
    }
    const validId = (id) => validProject("/projects/" + id + "/");
    const historyVisit = performance.getEntriesByType("navigation")[0]?.type === "back_forward";
    const historyTarget = history.state?.[historyKey];
    const historyReturn = entryPath === "/" && historyVisit && validId(historyTarget?.projectId);
    if (historyReturn && !incoming) incoming = { color: historyTarget.color, glass: historyTarget.glass };
    const returning = entryPath === "/" && (!!incoming && location.hash === "#featured-projects" || historyReturn);
    if (returning) {
      let projectId = "canvasflow-art-preview";
      try {
        projectId = sessionStorage.getItem("portfolio:works-return") || sessionStorage.getItem("portfolio:works-last") || projectId;
      } catch {
      }
      if (historyReturn) {
        projectId = historyTarget.projectId;
        try {
          sessionStorage.setItem("portfolio:works-return", projectId);
        } catch {
        }
      }
      window.__portfolioReturnPresentation = { projectId, phase: "waiting", paintReady: false };
    }
    const canvasflow = entryPath === "/projects/canvasflow-art-preview/";
    if (incoming || canvasflow) {
      window.__portfolioProjectEntry = { incoming: true, canvasflow };
      document.documentElement.dataset.projectEntryPending = "true";
      document.documentElement.style.setProperty("--project-transition-base", incoming?.color || "#0f1111");
      document.documentElement.style.setProperty("--project-transition-glass", incoming?.glass || "rgba(30, 38, 53, .28)");
    }
    const fade = (current) => {
      current.dataset.phase = "revealing";
      if (reduced() || !current.animate) {
        current.remove();
        return;
      }
      requestAnimationFrame(() => requestAnimationFrame(() => {
        current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-out", fill: "forwards" }).finished.catch(() => {
        }).finally(() => current.remove());
      }));
    };
    let presentationStarted = false;
    const release = () => {
      if (navigating || presentationStarted) return;
      if (document.documentElement.dataset.projectEntryPending) {
        overlay = layer(incoming?.color || "#0f1111", incoming?.glass || "rgba(30, 38, 53, .28)");
        overlay.dataset.phase = "holding";
      }
      delete document.documentElement.dataset.projectEntryPending;
      if (!overlay) return;
      const current = overlay;
      overlay = null;
      presentationStarted = true;
      if (returning) {
        const state = window.__portfolioReturnPresentation;
        state.phase = "preparing";
        state.preparingAt = performance.now();
        waitForSelectedWorksPresentation(state, () => fade(current));
      } else fade(current);
    };
    addEventListener("portfolio:page-ready", release);
    addEventListener("pageshow", (event) => {
      if (!event.persisted) return;
      const target = history.state?.[historyKey];
      if (entryPath !== "/" || !validId(target?.projectId)) {
        delete document.documentElement.dataset.projectEntryPending;
        restore();
        return;
      }
      clearTimeout(watchdog);
      navigating = false;
      delete document.documentElement.dataset.projectNavigating;
      delete document.documentElement.dataset.projectEntryPending;
      const current = overlay || document.querySelector(".portfolio-project-transition") || layer(target.color || "#0f1111", target.glass || "rgba(30, 38, 53, .28)");
      current.dataset.phase = "holding";
      overlay = null;
      const state = window.__portfolioReturnPresentation = { projectId: target.projectId, phase: "preparing", paintReady: false, preparingAt: performance.now(), history: "bfcache" };
      try {
        sessionStorage.setItem("portfolio:works-return", target.projectId);
      } catch {
      }
      dispatchEvent(new Event("portfolio:history-return"));
      waitForSelectedWorksPresentation(state, () => fade(current));
    });
    function resolveLink(event) {
      if (!(event.target instanceof Element)) return null;
      let link = event.target.closest("a[href]");
      if (link && link.matches(".works-visual,.works-detail-link,.works-mobile-visual,[data-works-return],[data-canvasflow-return]")) return link;
      const host = document.querySelector("#featured-projects");
      const plane = host?.querySelector('.works-plane[data-active="true"]');
      const image = plane?.querySelector(".works-visual img");
      if (!image || !plane.contains(event.target)) return null;
      const rect = image.getBoundingClientRect();
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
      const radius = parseFloat(getComputedStyle(image).borderTopLeftRadius) * rect.width / image.clientWidth;
      const edgeX = Math.min(x, rect.width - x), edgeY = Math.min(y, rect.height - y);
      if (edgeX < radius && edgeY < radius && Math.hypot(radius - edgeX, radius - edgeY) > radius) return null;
      return plane.querySelector(".works-visual");
    }
    function remember(link, url) {
      try {
        if (validProject(url.pathname)) {
          sessionStorage.setItem("portfolio:works-last", url.pathname.split("/")[2]);
          if (location.pathname === "/") sessionStorage.setItem("portfolio:works-origin", location.search);
        } else if (link.matches("[data-works-return],[data-canvasflow-return]")) {
          const id = location.pathname.split("/")[2];
          sessionStorage.setItem("hq:pendingScrollAnchor", "#featured-projects");
          sessionStorage.setItem("portfolio:works-return", id);
          sessionStorage.setItem("portfolio:works-last", id);
        }
      } catch {
      }
    }
    document.addEventListener("click", async (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = resolveLink(event);
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || !(validProject(url.pathname) || url.pathname === "/" && url.hash === "#featured-projects")) return;
      event.preventDefault();
      event.stopPropagation();
      if (navigating) return;
      navigating = true;
      remember(link, url);
      document.documentElement.dataset.projectNavigating = "true";
      dispatchEvent(new Event("portfolio:project-open"));
      const cursor = document.querySelector('.works-cover-cursor[data-visible="true"] .works-cover-cursor-content');
      const source = link.matches(".works-visual") && cursor ? cursor : link;
      const rect = source.getBoundingClientRect();
      const style = getComputedStyle(source);
      const x = event.detail ? event.clientX : rect.left + rect.width / 2;
      const y = event.detail ? event.clientY : rect.top + rect.height / 2;
      const width = Math.max(88, Math.min(rect.width, 240)), height = Math.max(38, Math.min(rect.height, 64));
      const left = Math.max(0, Math.min(innerWidth - width, x - width / 2));
      const top = Math.max(0, Math.min(innerHeight - height, y - height / 2));
      const background = getComputedStyle(document.body).backgroundColor;
      const color = background === "rgba(0, 0, 0, 0)" ? document.documentElement.classList.contains("dark") ? "#0f1111" : "#f2f3f5" : background;
      const glass = style.backgroundImage !== "none" ? style.backgroundImage : "linear-gradient(145deg,rgba(69,99,166,.24),rgba(24,39,85,.14))";
      if (entryPath === "/" && validProject(url.pathname)) {
        const projectId = url.pathname.split("/")[2];
        try {
          history.replaceState({ ...history.state, [historyKey]: { projectId, color, glass } }, "", location.href);
        } catch {
        }
      }
      overlay = layer(color, glass);
      overlay.dataset.phase = "covering";
      try {
        sessionStorage.setItem(key, JSON.stringify({ url: url.pathname + url.search + url.hash, color, glass, created: Date.now() }));
      } catch {
      }
      watchdog = setTimeout(restore, 12e3);
      if (!reduced() && overlay.animate) {
        const start = `inset(${top}px ${Math.max(0, innerWidth - left - width)}px ${Math.max(0, innerHeight - top - height)}px ${left}px round 999px)`;
        const animation = overlay.animate([{ clipPath: start }, { clipPath: "inset(0px 0px 0px 0px round 0px)" }], { duration: 520, easing: "cubic-bezier(.65,0,.25,1)", fill: "forwards" });
        overlay.querySelector(".portfolio-project-transition-matte").animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1, offset: 1 }], { duration: 520, easing: "ease-in", fill: "forwards" });
        await animation.finished.catch(() => {
        });
      }
      try {
        location.assign(url.href);
      } catch {
        restore();
      }
    }, true);
  })();
})();
