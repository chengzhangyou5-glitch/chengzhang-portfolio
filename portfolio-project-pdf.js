(() => {
  // tools/project-pdf-tiles.mjs
  var PdfTilePainter = class {
    constructor(canvas, manifest, onChange) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.manifest = manifest;
      this.onChange = onChange;
      this.cache = /* @__PURE__ */ new Map();
      this.broken = /* @__PURE__ */ new Set();
      this.pending = /* @__PURE__ */ new Set();
      this.queue = [];
      this.visible = [];
      this.running = 0;
      this.failed = 0;
      this.destroyed = false;
      this.retryGeneration = 0;
      this.metrics = { bytes: 0, loaded: 0, evicted: 0, firstRequest: 0, firstReady: 0 };
      this.previews = /* @__PURE__ */ new Map();
      this.initialized = this.loadPreviews();
    }
    async loadPreviews() {
      await Promise.all(this.manifest.pages.map(async (p) => {
        const response = await fetch(p.preview);
        if (!response.ok) throw Error(`Preview ${response.status}`);
        const blob = await response.blob();
        this.metrics.bytes += blob.size;
        const image = await createImageBitmap(blob);
        if (this.destroyed) image.close();
        else this.previews.set(p.number, image);
      })).catch((e) => {
        this.failed++;
        console.error(e);
      });
      this.onChange();
    }
    key(page, level, col, row) {
      return [this.manifest.sha256, this.manifest.tileVersion, level, page.number, col, row].join(":");
    }
    rect(page, level, col, row) {
      const { tileSize: T, bleed: B } = this.manifest, r = page.rasterSizes[level];
      return { left: Math.max(0, col * T - B), top: Math.max(0, row * T - B), right: Math.min(r.width, (col + 1) * T + B), bottom: Math.min(r.height, (row + 1) * T + B) };
    }
    tiles(state, extra = 0) {
      if (!this.level) return [];
      const { scale, x, y, width, height } = state, T = this.manifest.tileSize, result = [];
      for (const p of this.manifest.pages) {
        const left = x + (this.manifest.maxWidth - p.width) * scale / 2, top = y + p.offset * scale;
        if (top > height + extra || top + p.height * scale < -extra) continue;
        const r = p.rasterSizes[this.level];
        const c0 = Math.max(0, Math.floor((-left - extra) / scale * this.level / T)), c1 = Math.min(Math.ceil(r.width / T) - 1, Math.floor((width - left + extra) / scale * this.level / T));
        const r0 = Math.max(0, Math.floor((-top - extra) / scale * this.level / T)), r1 = Math.min(Math.ceil(r.height / T) - 1, Math.floor((height - top + extra) / scale * this.level / T));
        for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) result.push({ page: p, level: this.level, col, row, key: this.key(p, this.level, col, row), rect: this.rect(p, this.level, col, row) });
      }
      return result;
    }
    draw(state) {
      if (this.destroyed) return;
      this.state = state;
      const { scale, x, y, width, height } = state, dpr = devicePixelRatio || 1;
      this.level = [...this.manifest.levels].sort((a, b) => a - b).find((l) => l >= scale * dpr) || null;
      if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) {
        this.canvas.width = Math.round(width * dpr);
        this.canvas.height = Math.round(height * dpr);
      }
      const ctx = this.ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#0f1111";
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      for (const p of this.manifest.pages) {
        const left = x + (this.manifest.maxWidth - p.width) * scale / 2, top = y + p.offset * scale, preview = this.previews.get(p.number);
        if (!preview || top > height || top + p.height * scale < 0) continue;
        if (p.background.strategy === "source-preview-edges") {
          ctx.drawImage(preview, 0, 0, preview.width, 1, left, Math.floor(top * dpr) / dpr, p.width * scale, 2 / dpr);
          ctx.drawImage(preview, 0, preview.height - 1, preview.width, 1, left, Math.floor((top + p.height * scale) * dpr) / dpr, p.width * scale, 1 / dpr);
        }
        ctx.drawImage(preview, left, top, p.width * scale, p.height * scale);
      }
      this.visible = this.tiles(state);
      const T = this.manifest.tileSize;
      for (const t of this.visible) {
        const tile = this.cache.get(t.key);
        if (!tile) continue;
        const p = t.page, left = x + (this.manifest.maxWidth - p.width) * scale / 2, top = y + p.offset * scale;
        const x0 = Math.max(0, t.col * T - 1) / t.level, x1 = Math.min(p.width * t.level, (t.col + 1) * T + 1) / t.level;
        const y0 = Math.max(0, t.row * T - 1) / t.level, y1 = Math.min(p.height * t.level, (t.row + 1) * T + 1) / t.level;
        ctx.save();
        ctx.beginPath();
        ctx.rect(left + x0 * scale, top + y0 * scale, (x1 - x0) * scale, (y1 - y0) * scale);
        ctx.clip();
        ctx.drawImage(tile, left + t.rect.left / t.level * scale, top + t.rect.top / t.level * scale, tile.width / t.level * scale, tile.height / t.level * scale);
        ctx.restore();
      }
      const visibleKeys = new Set(this.visible.map((t) => t.key)), candidates = this.level === 8 ? [] : this.tiles(state, Math.min(height, 1e3));
      candidates.sort((a, b) => Math.abs(y + (a.page.offset + (a.row + 0.5) * T / a.level) * scale - height / 2) - Math.abs(y + (b.page.offset + (b.row + 0.5) * T / b.level) * scale - height / 2));
      const desired = [...this.visible, ...candidates.filter((t) => !visibleKeys.has(t.key))].slice(0, Math.max(24, this.visible.length)), wanted = new Set(desired.map((t) => t.key));
      this.queue = this.queue.filter((t) => wanted.has(t.key));
      for (const t of desired) {
        if (this.cache.has(t.key)) {
          const image = this.cache.get(t.key);
          this.cache.delete(t.key);
          this.cache.set(t.key, image);
        }
      }
      const queued = new Set(this.queue.map((t) => t.key));
      for (const t of desired) if (!this.cache.has(t.key) && !this.pending.has(t.key) && !queued.has(t.key) && !this.broken.has(t.key)) {
        this.queue.push(t);
        queued.add(t.key);
      }
      this.queue.sort((a, b) => Number(visibleKeys.has(b.key)) - Number(visibleKeys.has(a.key)));
      this.evict();
      this.pump();
      const ready = !!this.level && this.visible.length > 0 && this.visible.every((t) => this.cache.has(t.key));
      if (ready && !this.metrics.firstReady) this.metrics.firstReady = performance.now();
      this.canvas.dataset.ready = String(ready);
      this.canvas.dataset.level = String(this.level);
      return { ready, level: this.level, required: scale * dpr, failed: this.failed, failedVisible: this.visible.filter((t) => this.broken.has(t.key)).length, visible: this.visible.length, loadedVisible: this.visible.filter((t) => this.cache.has(t.key)).length, tiles: this.cache.size, dpr, ...this.metrics };
    }
    evict() {
      const visible = new Set(this.visible.map((t) => t.key));
      while (this.cache.size > 24) {
        const key = [...this.cache.keys()].find((k) => !visible.has(k));
        if (!key) break;
        this.cache.get(key).close();
        this.cache.delete(key);
        this.metrics.evicted++;
      }
    }
    pump() {
      while (!this.destroyed && this.running < 4 && this.queue.length) {
        const t = this.queue.shift(), generation = this.retryGeneration;
        this.running++;
        this.pending.add(t.key);
        if (!this.metrics.firstRequest) this.metrics.firstRequest = performance.now();
        (async () => {
          const url = this.manifest.tileUrlTemplate.replace("{level}", t.level).replace("{page}", t.page.number).replace("{col}", t.col).replace("{row}", t.row);
          const response = await fetch(url);
          if (!response.ok) throw Error(`Static PNG ${response.status}: ${url}`);
          const blob = await response.blob();
          this.metrics.bytes += blob.size;
          const image = await createImageBitmap(blob);
          if (this.destroyed) {
            image.close();
            return;
          }
          this.cache.set(t.key, image);
          this.metrics.loaded++;
          this.evict();
        })().catch((e) => {
          if (generation === this.retryGeneration) {
            this.failed++;
            this.broken.add(t.key);
            console.error(e);
          }
        }).finally(() => {
          this.pending.delete(t.key);
          this.running--;
          this.onChange();
          this.pump();
        });
      }
    }
    retry() {
      if (this.destroyed) return;
      this.retryGeneration++;
      this.broken.clear();
      this.failed = 0;
      this.onChange();
    }
    destroy() {
      this.destroyed = true;
      this.queue = [];
      for (const image of this.cache.values()) image.close();
      for (const image of this.previews.values()) image.close();
      this.cache.clear();
      this.previews.clear();
    }
  };

  // tools/project-pdf-segments.mjs
  var PdfSegmentPainter = class {
    constructor(canvas, manifest, onChange) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.manifest = manifest;
      this.onChange = onChange;
      this.cache = /* @__PURE__ */ new Map();
      this.queue = [];
      this.visible = [];
      this.running = 0;
      this.retryGeneration = 0;
      this.destroyed = false;
      this.metrics = { bytes: 0, loaded: 0, decoded: 0, evicted: 0 };
    }
    key(segment) {
      return this.manifest.sha256 + ":" + segment.src;
    }
    draw({ scale, x, y, width, height }) {
      if (this.destroyed) return;
      const dpr = devicePixelRatio || 1, ctx = this.ctx;
      if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) {
        this.canvas.width = Math.round(width * dpr);
        this.canvas.height = Math.round(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#0f1111";
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      this.visible = this.manifest.segments.filter((segment) => y + segment.top * scale < height && y + (segment.top + segment.height) * scale > 0);
      const target = Math.min(this.manifest.maxWidth, Math.max(512, Math.ceil(this.manifest.maxWidth * scale * dpr / 256) * 256));
      const wanted = new Set(this.visible.map((segment) => this.key(segment)));
      this.queue = this.queue.filter((job) => wanted.has(this.key(job.segment)));
      for (const segment of this.visible) {
        const key = this.key(segment);
        let entry = this.cache.get(key);
        if (!entry) {
          entry = { segment, bitmap: null, blob: null, bitmapWidth: 0, pending: false, failed: false, removed: false };
          this.cache.set(key, entry);
        }
        if (entry.bitmap) {
          const top = y + segment.top * scale;
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, top - 0.5 / dpr, segment.width * scale, segment.height * scale + 1 / dpr);
          ctx.clip();
          ctx.drawImage(entry.bitmap, x, y + segment.imageTop * scale, segment.width * scale, segment.imageHeight * scale);
          ctx.restore();
        }
        if (!entry.failed && !entry.pending && (!entry.bitmap || entry.bitmapWidth < target || entry.bitmapWidth > target * 1.75) && !this.queue.some((job) => this.key(job.segment) === key)) this.queue.push({ segment, target });
        this.cache.delete(key);
        this.cache.set(key, entry);
      }
      this.evict(wanted);
      this.pump();
      const entries = this.visible.map((segment) => this.cache.get(this.key(segment)));
      return {
        ready: !!entries.length && entries.every((entry) => entry.bitmap && !entry.failed && !entry.pending && entry.bitmapWidth >= target),
        failedVisible: entries.filter((entry) => entry.failed).length,
        visible: entries.length,
        loadedVisible: entries.filter((entry) => entry.bitmap).length,
        segments: this.cache.size,
        dpr,
        targetBitmapWidth: target,
        bitmapBytes: [...this.cache.values()].reduce((bytes, entry) => bytes + (entry.bitmap ? entry.bitmap.width * entry.bitmap.height * 4 : 0), 0),
        ...this.metrics
      };
    }
    evict(wanted) {
      while (this.cache.size > Math.max(3, wanted.size)) {
        const key = [...this.cache.keys()].find((key2) => !wanted.has(key2));
        if (!key) break;
        const entry = this.cache.get(key);
        entry.removed = true;
        entry.controller?.abort();
        entry.bitmap?.close();
        this.cache.delete(key);
        this.metrics.evicted++;
      }
    }
    pump() {
      while (!this.destroyed && this.running < 2 && this.queue.length) {
        const job = this.queue.shift(), entry = this.cache.get(this.key(job.segment));
        if (!entry || entry.pending || entry.failed) continue;
        const generation = this.retryGeneration;
        entry.pending = true;
        entry.controller = new AbortController();
        this.running++;
        let timeout;
        (async () => {
          const operation = (async () => {
            if (!entry.blob) {
              const response = await fetch(job.segment.src, { signal: entry.controller.signal });
              if (!response.ok) throw Error("PDF segment " + response.status);
              entry.blob = await response.blob();
              this.metrics.bytes += entry.blob.size;
              this.metrics.loaded++;
            }
            const bitmap = await createImageBitmap(entry.blob, { resizeWidth: job.target, resizeHeight: Math.round(job.segment.imageHeight * job.target / job.segment.width), resizeQuality: "high" });
            if (this.destroyed || entry.removed || entry.controller.signal.aborted) {
              bitmap.close();
              return;
            }
            entry.bitmap?.close();
            entry.bitmap = bitmap;
            entry.bitmapWidth = job.target;
            this.metrics.decoded++;
          })();
          await Promise.race([operation, new Promise((_, reject) => {
            timeout = setTimeout(() => {
              entry.controller.abort();
              reject(Error("PDF segment load timeout"));
            }, 2e4);
          })]);
        })().catch((error) => {
          if (!this.destroyed && !entry.removed && generation === this.retryGeneration) {
            entry.failed = true;
            console.error(error);
          }
        }).finally(() => {
          clearTimeout(timeout);
          entry.pending = false;
          this.running--;
          this.onChange();
          this.pump();
        });
      }
    }
    retry() {
      this.retryGeneration++;
      for (const entry of this.cache.values()) if (entry.failed) {
        entry.failed = false;
        entry.blob = null;
      }
      this.onChange();
    }
    destroy() {
      this.destroyed = true;
      this.queue = [];
      for (const entry of this.cache.values()) {
        entry.removed = true;
        entry.controller?.abort();
        entry.bitmap?.close();
      }
      this.cache.clear();
    }
  };

  // tools/project-pdf-reader.js
  var mountedReaders = /* @__PURE__ */ new WeakMap();
  function mountProjectReaders(root = document) {
    for (const reader of root.querySelectorAll(".project-pdf-reader")) {
      if (!mountedReaders.has(reader)) mountedReaders.set(reader, mountReader(reader));
    }
  }
  window.__portfolioProjectPdf = {
    mount: mountProjectReaders,
    unmount(root) {
      for (const reader of root.querySelectorAll(".project-pdf-reader")) {
        mountedReaders.get(reader)?.();
        mountedReaders.delete(reader);
      }
    }
  };
  mountProjectReaders();
  function mountReader(reader) {
    const shell = reader.closest(".project-pdf-shell"), canvas = reader.querySelector("canvas");
    const controls = shell.querySelector(".project-pdf-controls");
    const minus = controls.querySelector("[data-pdf-out]"), plus = controls.querySelector("[data-pdf-in]");
    const reset = controls.querySelector("[data-pdf-reset]"), retry = controls.querySelector("[data-pdf-retry]");
    const failure = controls.querySelector(".project-pdf-failure");
    const feather = document.createElement("div");
    feather.className = "project-pdf-feather";
    feather.setAttribute("aria-hidden", "true");
    (reader.closest(".canvasflow-detail") || document.body).appendChild(feather);
    const segmented = reader.dataset.renderer === "continuous-webp";
    const scroller = reader.closest(".overflow-y-auto");
    const scrollHost = scroller || window;
    const scrollPosition = () => scroller ? scroller.scrollTop : scrollY;
    const restoreScroll = (top) => {
      const env = window.__portfolioProjectContactScrollEnv;
      if (env) env.lenisScrollTo(top, { immediate: true });
      else if (scroller) scroller.scrollTo({ top, behavior: "instant" });
      else scrollTo({ top, behavior: "instant" });
    };
    let manifest, painter, stats, frame = 0, percent = 100, fitWidth = 0, docWidth = 0;
    let panX = 0, anchor = null, drag = null, initializing = false, disposed = false, initVersion = 0;
    const desktop = matchMedia("(min-width: 1100px) and (hover: hover) and (pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const events = new AbortController();
    let dirty = true, wide = 0, narrow = 0, start = 0, distance = 1, progress = 0, manualBase = null;
    const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
    const schedule = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(paint);
    };
    const updateControls = () => {
      const rect = reader.getBoundingClientRect();
      const active = rect.top <= 56 && rect.bottom > 80;
      feather.style.left = rect.left + "px";
      feather.style.width = rect.width + "px";
      feather.style.setProperty("--pdf-edge-top", rect.top + "px");
      feather.style.setProperty("--pdf-edge-bottom", rect.bottom + "px");
      feather.style.setProperty("--pdf-edge-radius", rect.top > 0 ? getComputedStyle(reader).borderTopLeftRadius : "0px");
      feather.dataset.active = String(active);
      controls.dataset.active = String(active);
      controls.inert = !active;
      controls.setAttribute("aria-hidden", String(!active));
    };
    const focusY = () => Math.max(controls.getBoundingClientRect().bottom + 24, (innerHeight + controls.offsetHeight + 16) / 2);
    const capture = () => {
      if (!manifest || !docWidth) return null;
      const r = reader.getBoundingClientRect(), scale = docWidth / manifest.maxWidth;
      return { y: clamp((focusY() - r.top) / scale, 0, manifest.totalHeight), screenY: focusY(), pan: panX / scale };
    };
    const setPercent = (value) => {
      anchor = capture();
      if (value === 100) manualBase = null;
      else if (manualBase === null) manualBase = docWidth;
      percent = value;
      schedule();
    };
    minus.onclick = () => setPercent(percent - 10);
    plus.onclick = () => setPercent(percent + 10);
    reset.onclick = () => setPercent(100);
    retry.onclick = () => {
      failure.hidden = true;
      if (painter) {
        painter.retry();
        schedule();
      } else initialize();
    };
    async function initialize() {
      if (initializing || disposed) return;
      initializing = true;
      const version = ++initVersion;
      try {
        const response = await fetch(reader.dataset.manifest);
        if (!response.ok) throw Error("PDF manifest unavailable");
        const parsed = await response.json();
        if (parsed.sha256 !== reader.dataset.sourceHash || !parsed.staticResources?.complete || (segmented ? parsed.kind !== "continuous-webp" || parsed.spec?.width !== 3200 || parsed.spec?.quality !== 92 : parsed.resolutionPolicy?.level8 !== "precomputed-static")) throw Error("PDF resource version mismatch");
        if (disposed || version !== initVersion) return;
        manifest = parsed;
        painter = segmented ? new PdfSegmentPainter(canvas, manifest, schedule) : new PdfTilePainter(canvas, manifest, schedule);
        reset.disabled = false;
        schedule();
      } catch (error) {
        if (!disposed && version === initVersion) {
          failure.hidden = false;
          schedule();
          console.error(error);
        }
      } finally {
        initializing = false;
      }
    }
    function configure() {
      const previous = wide;
      wide = shell.clientWidth;
      narrow = Math.min(wide, clamp(document.documentElement.clientWidth * 0.44, 640, 760));
      if (manualBase !== null && previous) manualBase *= wide / previous;
      start = Math.max(0, reader.getBoundingClientRect().top + scrollPosition() - innerHeight * 0.72);
      distance = Math.max(640, innerHeight * 1.05);
      dirty = false;
    }
    function paint(time) {
      frame = 0;
      if (disposed) return;
      updateControls();
      if (!painter) return;
      if (dirty) configure();
      const progressAt = (y) => desktop.matches && !reduced.matches ? clamp((y - start) / distance, 0, 1) : 0;
      const widthAt = (y) => {
        const p = progressAt(y);
        return wide + (narrow - wide) * p * p * (3 - 2 * p);
      };
      let layoutScroll = scrollPosition();
      if (anchor && manualBase === null) {
        const absoluteTop = reader.getBoundingClientRect().top + scrollPosition();
        const targetAt = (y) => absoluteTop + anchor.y * widthAt(y) / manifest.maxWidth - anchor.screenY;
        let low = 0, high = Math.max(0, targetAt(0));
        for (let n = 0; n < 24; n++) {
          const mid = (low + high) / 2;
          if (mid < targetAt(mid)) low = mid;
          else high = mid;
        }
        layoutScroll = (low + high) / 2;
      }
      progress = progressAt(layoutScroll);
      const automaticWidth = widthAt(layoutScroll), base = manualBase ?? automaticWidth;
      const maxScale = segmented ? manifest.resolutionPolicy.maxCssZoom : Math.min(manifest.resolutionPolicy.maxCssZoom, Math.max(...manifest.levels) / (devicePixelRatio || 1));
      const maximum = Math.max(100, Math.floor(maxScale / (base / manifest.maxWidth) * 10) * 10);
      percent = clamp(percent, 50, maximum);
      docWidth = manualBase === null ? automaticWidth : manualBase * percent / 100;
      fitWidth = Math.min(wide, docWidth);
      reader.style.width = fitWidth + "px";
      reader.closest(".project-main,.canvasflow-main").style.setProperty("--project-reading-width", fitWidth + "px");
      const scale = docWidth / manifest.maxWidth;
      reader.style.height = manifest.totalHeight * scale + "px";
      if (docWidth > fitWidth + 0.5) canvas.dataset.horizontalPan = "true";
      else delete canvas.dataset.horizontalPan;
      if (anchor) {
        const absoluteTop = reader.getBoundingClientRect().top + scrollPosition();
        panX = anchor.pan * scale;
        restoreScroll(absoluteTop + anchor.y * scale - anchor.screenY);
        anchor = null;
      }
      panX = clamp(panX, -Math.max(0, (docWidth - fitWidth) / 2), Math.max(0, (docWidth - fitWidth) / 2));
      const rect = reader.getBoundingClientRect(), height = Math.min(innerHeight, rect.height);
      canvas.style.height = height + "px";
      const canvasRect = canvas.getBoundingClientRect();
      if (rect.top < innerHeight * 1.5 && rect.bottom > 0) {
        stats = painter.draw({ scale, x: (fitWidth - docWidth) / 2 + panX, y: rect.top - canvasRect.top, width: fitWidth, height });
        failure.hidden = stats.failedVisible === 0;
      } else failure.hidden = true;
      minus.disabled = percent <= 50;
      plus.disabled = percent >= maximum;
      reader.dataset.zoom = String(percent);
      updateControls();
      paintNavigation(time);
    }
    const nav = document.createElement("a");
    nav.className = "project-pdf-context-link";
    nav.tabIndex = -1;
    nav.setAttribute("aria-hidden", "true");
    const content = document.createElement("span");
    content.className = "project-pdf-context-link-content";
    nav.appendChild(content);
    document.body.appendChild(nav);
    const routes = {
      left: { label: "\u2190 " + reader.dataset.previousTitle, href: reader.dataset.previous },
      right: { label: reader.dataset.nextTitle + " \u2192", href: reader.dataset.next }
    };
    let pointer = null, side = null, position = null, previousTime = 0;
    function hideNavigation() {
      side = null;
      position = null;
      previousTime = 0;
      nav.dataset.visible = "false";
      nav.setAttribute("aria-hidden", "true");
      delete document.documentElement.dataset.projectPdfCursor;
    }
    function region(point) {
      if (!desktop.matches || reduced.matches || progress < 0.88 || !point || document.hidden) return null;
      if (point.x < 24 || point.x >= document.documentElement.clientWidth - 24) return null;
      const target = document.elementFromPoint(point.x, point.y);
      if (target?.closest('a,button,input,textarea,select,[role="button"]')) return null;
      const box = reader.getBoundingClientRect();
      if (point.y < Math.max(28, box.top + 28) || point.y > Math.min(innerHeight - 28, box.bottom - 28)) return null;
      return point.x < box.left - 32 ? "left" : point.x > box.right + 32 ? "right" : null;
    }
    function paintNavigation(time) {
      const next = region(pointer);
      if (!next) {
        hideNavigation();
        return;
      }
      const changed = side !== next;
      if (changed) {
        side = next;
        content.textContent = routes[side].label;
        nav.href = routes[side].href;
        nav.dataset.side = side;
      }
      const box = reader.getBoundingClientRect(), w = nav.offsetWidth, h = nav.offsetHeight;
      const minX = side === "left" ? 24 + w / 2 : box.right + 40 + w / 2;
      const maxX = side === "left" ? box.left - 40 - w / 2 : document.documentElement.clientWidth - 24 - w / 2;
      if (maxX < minX) {
        hideNavigation();
        return;
      }
      const target = { x: clamp(pointer.x, minX, maxX), y: clamp(pointer.y, Math.max(24, box.top + 24) + h / 2, Math.min(innerHeight, box.bottom) - h / 2 - 24) };
      if (!position || changed) {
        position = target;
        previousTime = 0;
      } else {
        const dt = previousTime ? Math.min(64, time - previousTime) : 16.67, weight = 1 - Math.exp(-dt / 65);
        position = { x: position.x + (target.x - position.x) * weight, y: position.y + (target.y - position.y) * weight };
      }
      previousTime = time;
      const settled = Math.hypot(target.x - position.x, target.y - position.y) < 0.1;
      if (settled) {
        position = target;
        previousTime = 0;
      }
      nav.style.setProperty("--project-pdf-nav-x", position.x + "px");
      nav.style.setProperty("--project-pdf-nav-y", position.y + "px");
      nav.dataset.visible = "true";
      nav.setAttribute("aria-hidden", "false");
      document.documentElement.dataset.projectPdfCursor = "true";
      if (!settled) schedule();
    }
    addEventListener("pointermove", (event) => {
      if (event.pointerType !== "touch") {
        pointer = { x: event.clientX, y: event.clientY };
        schedule();
      }
    }, { passive: true, signal: events.signal });
    document.documentElement.addEventListener("pointerleave", () => {
      pointer = null;
      hideNavigation();
    }, { signal: events.signal });
    addEventListener("blur", () => {
      pointer = null;
      hideNavigation();
    }, { signal: events.signal });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        pointer = null;
        hideNavigation();
      }
    }, { signal: events.signal });
    document.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.target.closest('a,button,input,textarea,select,[role="button"]')) return;
      const clicked = region({ x: event.clientX, y: event.clientY });
      if (clicked && nav.dataset.visible === "true") {
        nav.href = routes[clicked].href;
        nav.click();
      }
    }, { signal: events.signal });
    for (const media of [desktop, reduced]) media.addEventListener("change", () => {
      dirty = true;
      schedule();
    }, { signal: events.signal });
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || docWidth <= fitWidth || event.pointerType === "touch" && !event.isPrimary) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, pan: panX, touch: event.pointerType === "touch", axis: event.pointerType === "touch" ? null : "x" };
      if (!drag.touch) canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (drag.axis === null) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
        drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (drag.axis === "x") canvas.setPointerCapture(event.pointerId);
      }
      if (drag.axis !== "x") return;
      if (drag.touch && event.cancelable) event.preventDefault();
      panX = drag.pan + dx;
      schedule();
    });
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) canvas.addEventListener(event, (e) => {
      if (drag?.id === e.pointerId) drag = null;
    });
    const resize = () => {
      anchor = capture();
      dirty = true;
      schedule();
    };
    scrollHost.addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", resize, { passive: true });
    document.fonts.ready.then(() => {
      dirty = true;
      schedule();
    });
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      initVersion++;
      cancelAnimationFrame(frame);
      painter?.destroy();
      events.abort();
      hideNavigation();
      nav.remove();
      feather.remove();
      scrollHost.removeEventListener("scroll", schedule);
      removeEventListener("resize", resize);
    };
    addEventListener("pagehide", (event) => {
      if (!event.persisted) dispose();
    }, { signal: events.signal });
    reader.pdfReview = {
      get manifest() {
        return manifest;
      },
      get stats() {
        return { render: stats, percent, scale: manifest ? docWidth / manifest.maxWidth : 0, panX, fitWidth, docWidth, wide, narrow, start, distance, progress, manual: manualBase !== null, running: painter?.running || 0 };
      },
      async idle() {
        for (let n = 0; n < 400; n++) {
          await new Promise((r) => setTimeout(r, 25));
          if (stats?.ready && !painter.running) return;
        }
        throw Error("PDF resources not ready");
      }
    };
    initialize();
    return dispose;
  }
})();
