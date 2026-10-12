(() => {
  // tools/sticker-residue-math.js
  var ResidueVector2 = class {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
    set(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }
    copy(value) {
      return this.set(value.x, value.y);
    }
    toArray() {
      return [this.x, this.y];
    }
  };
  var ResidueColor = class {
    constructor(value) {
      this.set(value);
    }
    set(value) {
      const hex = parseInt(value.replace("#", ""), 16);
      const linear = (n) => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
      this.r = linear((hex >> 16 & 255) / 255);
      this.g = linear((hex >> 8 & 255) / 255);
      this.b = linear((hex & 255) / 255);
      return this;
    }
    toArray() {
      return [this.r, this.g, this.b];
    }
  };
  var residueMath = { damp: (x, y, lambda, dt) => y + (x - y) * Math.exp(-lambda * dt) };

  // tools/sticker-residue-motion.generated.js
  var sy = { Vector2: ResidueVector2, Color: ResidueColor, MathUtils: residueMath };
  var cF = "#c0fe04";
  var cP = class {
    cssResolution = new sy.Vector2(1, 1);
    devicePixelRatio = 1;
    trail = Array.from({ length: 16 }, () => new sy.Vector2(0.5, 0.5));
    trailStrength = Array.from({ length: 16 }, () => 0);
    lastPointerCell = new sy.Vector2(-1, -1);
    pixelSize = 16;
    uniforms = { uTrail: { value: this.trail }, uTrailStrength: { value: this.trailStrength }, uTrailCount: { value: 14 }, uPointerColor: { value: new sy.Color(cF) }, uPointerOpacity: { value: 1 }, uPointerDotRadius: { value: 0.8 }, uPointerPixelSize: { value: this.pixelSize }, uResolution: { value: new sy.Vector2(1, 1) }, uDevicePixelRatio: { value: this.devicePixelRatio } };
    setColor(e10) {
      this.uniforms.uPointerColor.value.set(e10);
    }
    setPixelSize(e10) {
      this.pixelSize = e10, this.uniforms.uPointerPixelSize.value = e10;
    }
    setDisplayMetrics(e10, t10, r10) {
      this.cssResolution.set(Math.max(1, e10), Math.max(1, t10)), this.devicePixelRatio = Math.max(1, r10), this.uniforms.uDevicePixelRatio.value = this.devicePixelRatio;
    }
    setResolution(e10, t10) {
      this.uniforms.uResolution.value.set(Math.max(1, e10), Math.max(1, t10));
    }
    updatePointer(e10, t10, r10) {
      let n10 = Math.max(this.pixelSize / Math.max(this.cssResolution.x, 1), 1e-6), i10 = Math.max(this.pixelSize / Math.max(this.cssResolution.y, 1), 1e-6);
      for (let e11 = +!!t10; e11 < 14; e11 += 1) this.trailStrength[e11] = sy.MathUtils.damp(this.trailStrength[e11], 0, 2, r10);
      if (t10) {
        let t11 = Math.floor(e10.x / n10), r11 = Math.floor(e10.y / i10);
        if (t11 !== this.lastPointerCell.x || r11 !== this.lastPointerCell.y) {
          for (let e11 = 13; e11 > 0; e11 -= 1) this.trail[e11].copy(this.trail[e11 - 1]), this.trailStrength[e11] = this.trailStrength[e11 - 1];
          this.lastPointerCell.set(t11, r11);
        }
        this.trail[0].set(e10.x, e10.y), this.trailStrength[0] = 1;
        return;
      }
      this.lastPointerCell.set(-1, -1);
    }
  };

  // tools/project-reading-pointer.js
  function mountReadingPointer(pages) {
    const media = matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const canvas = document.createElement("canvas");
    canvas.className = "project-reading-pointer";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d"), overlay = new cP(), pointer = new ResidueVector2(0.5, 0.5);
    const events = new AbortController(), scroller = pages.closest(".overflow-y-auto") || window;
    let frame = 0, lastTime = 0, point = null, disposed = false, headerLayer = false;
    const sRGB = (n) => Math.round(255 * (n <= 31308e-7 ? n * 12.92 : 1.055 * n ** (1 / 2.4) - 0.055));
    const color = overlay.uniforms.uPointerColor.value.toArray().map(sRGB);
    const clear = () => {
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    };
    const tick = (now) => {
      frame = 0;
      if (disposed || !ctx || document.hidden) return;
      const dt = Math.min((now - (lastTime || now - 16.667)) / 1e3, 0.1);
      lastTime = now;
      if (!media.matches) {
        overlay.trailStrength.fill(0);
        clear();
        return;
      }
      const box = pages.getBoundingClientRect();
      const headerFallback = !document.querySelector(".canvasflow-background-shell") && !window.__portfolioStickerResidue?.detail?.canvas;
      const replaced = document.documentElement.hasAttribute("data-project-pdf-cursor");
      const eligible = media.matches && !replaced;
      const target = point && document.elementFromPoint(point.x, point.y);
      const inDocument = point && point.x >= box.left && point.x < box.right && point.y >= Math.max(0, box.top) && point.y < Math.min(innerHeight, box.bottom);
      const inHeader = headerFallback && point && point.y >= 0 && point.y < Math.min(innerHeight, box.top);
      if (point) headerLayer = !!inHeader;
      canvas.style.zIndex = headerLayer ? "0" : "44";
      const active = eligible && (inDocument || inHeader) && !target?.closest('a,button,input,textarea,select,[role="button"]');
      if (!eligible) overlay.trailStrength.fill(0);
      overlay.setDisplayMetrics(innerWidth, innerHeight, Math.min(devicePixelRatio, 2));
      overlay.updatePointer(pointer, !!active, dt);
      const ratio = Math.min(devicePixelRatio, 2), w = Math.round(innerWidth * ratio), h = Math.round(innerHeight * ratio);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      clear();
      if (eligible && (headerFallback && box.top > 0 || box.bottom > 0 && box.top < innerHeight)) {
        ctx.save();
        ctx.scale(ratio, ratio);
        ctx.beginPath();
        if (headerLayer) ctx.rect(0, 0, innerWidth, Math.max(0, Math.min(innerHeight, box.top)));
        else ctx.roundRect(box.left, box.top, box.width, box.height, parseFloat(getComputedStyle(pages).borderTopLeftRadius) || 0);
        ctx.clip();
        const size = overlay.pixelSize, cells = /* @__PURE__ */ new Map();
        for (let i = 0; i < overlay.uniforms.uTrailCount.value; i++) {
          const strength = overlay.trailStrength[i];
          if (strength <= 1e-3) continue;
          const x = Math.floor(overlay.trail[i].x * innerWidth / size) * size;
          const y = innerHeight - (Math.floor(overlay.trail[i].y * innerHeight / size) + 1) * size;
          const key = x + "," + y, previous = cells.get(key);
          if (!previous || previous.strength < strength) cells.set(key, { x, y, strength });
        }
        ctx.fillStyle = "rgb(" + color.join(" ") + ")";
        for (const cell of cells.values()) {
          ctx.globalAlpha = cell.strength;
          ctx.fillRect(cell.x, cell.y, size, size);
        }
        ctx.restore();
      }
      if (overlay.trailStrength.slice(active ? 1 : 0, 14).some((n) => n > 1e-3)) schedule();
    };
    const schedule = () => {
      if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const move = (event) => {
      if (event.pointerType === "touch") return;
      point = { x: event.clientX, y: event.clientY };
      pointer.set(point.x / innerWidth, 1 - point.y / innerHeight);
      schedule();
    };
    const leave = () => {
      point = null;
      schedule();
    };
    for (const [host, type, handler] of [[window, "pointermove", move], [window, "pointerdown", move], [window, "blur", leave], [document.documentElement, "pointerleave", leave], [scroller, "scroll", schedule], [window, "resize", schedule]]) host.addEventListener(type, handler, { passive: true, signal: events.signal });
    const cursorObserver = new MutationObserver(() => {
      if (document.documentElement.hasAttribute("data-project-pdf-cursor")) {
        overlay.trailStrength.fill(0);
        clear();
      }
      schedule();
    });
    cursorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-project-pdf-cursor"] });
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(pages);
    media.addEventListener("change", schedule, { signal: events.signal });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        point = null;
        overlay.trailStrength.fill(0);
        clear();
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
      } else schedule();
    }, { signal: events.signal });
    window.addEventListener("pagehide", () => {
      point = null;
      overlay.trailStrength.fill(0);
      clear();
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }, { signal: events.signal });
    window.addEventListener("pageshow", schedule, { signal: events.signal });
    schedule();
    return () => {
      disposed = true;
      events.abort();
      cursorObserver.disconnect();
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
      canvas.remove();
    };
  }

  // tools/project-reading-navigation.js
  var mounted = /* @__PURE__ */ new WeakMap();
  function mount(root = document) {
    for (const link of root.querySelectorAll(".project-reading-return")) {
      if (mounted.has(link)) continue;
      const scope = link.closest("main");
      const pages = scope?.querySelector(".project-reading-pages");
      if (!pages) continue;
      const disposePointer = mountReadingPointer(pages);
      const scroller = scope.closest(".overflow-y-auto") || window;
      const events = new AbortController();
      let frame = 0, lastActive = false;
      const update = () => {
        frame = 0;
        const rect = pages.getBoundingClientRect();
        const active = rect.top <= 56 && rect.bottom > 80;
        if (active === lastActive) return;
        lastActive = active;
        link.dataset.active = String(active);
        link.inert = !active;
        link.setAttribute("aria-hidden", String(!active));
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      for (const [target, event] of [[scroller, "scroll"], [window, "resize"], [window, "pageshow"]]) target.addEventListener(event, schedule, { passive: true, signal: events.signal });
      const observer = new ResizeObserver(schedule);
      observer.observe(pages);
      const dispose = () => {
        events.abort();
        observer.disconnect();
        cancelAnimationFrame(frame);
        disposePointer();
        mounted.delete(link);
      };
      window.addEventListener("pagehide", (event) => {
        if (!event.persisted) dispose();
      }, { signal: events.signal });
      mounted.set(link, dispose);
      schedule();
    }
  }
  window.__portfolioProjectReadingNavigation = {
    mount,
    unmount(root) {
      for (const link of root.querySelectorAll(".project-reading-return")) mounted.get(link)?.();
    }
  };
  mount();
})();
