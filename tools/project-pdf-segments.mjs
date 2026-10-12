// Full-width continuous WebP strips. Shares the accepted reader's painter API;
// no tile pyramid, PDF parsing or rendering endpoint is used in the browser.
export class PdfSegmentPainter {
  constructor(canvas, manifest, onChange) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false });
    this.manifest = manifest; this.onChange = onChange; this.cache = new Map();
    this.queue = []; this.visible = []; this.running = 0; this.retryGeneration = 0; this.destroyed = false;
    this.metrics = { bytes: 0, loaded: 0, decoded: 0, evicted: 0 };
  }
  key(segment) { return this.manifest.sha256 + ':' + segment.src; }
  draw({ scale, x, y, width, height }) {
    if (this.destroyed) return;
    const dpr = devicePixelRatio || 1, ctx = this.ctx;
    if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) {
      this.canvas.width = Math.round(width * dpr); this.canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#0f1111'; ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    this.visible = this.manifest.segments.filter(segment => y + segment.top * scale < height && y + (segment.top + segment.height) * scale > 0);
    // Keep small mobile/zoomed-out strips small in memory. Re-decode from the
    // retained compressed Blob when necessary; no duplicate HTTP request.
    const target = Math.min(this.manifest.maxWidth, Math.max(512, Math.ceil(this.manifest.maxWidth * scale * dpr / 256) * 256));
    const wanted = new Set(this.visible.map(segment => this.key(segment)));
    this.queue = this.queue.filter(job => wanted.has(this.key(job.segment)));
    for (const segment of this.visible) {
      const key = this.key(segment); let entry = this.cache.get(key);
      if (!entry) { entry = { segment, bitmap: null, blob: null, bitmapWidth: 0, pending: false, failed: false, removed: false }; this.cache.set(key, entry); }
      if (entry.bitmap) {
        const top = y + segment.top * scale;
        ctx.save(); ctx.beginPath(); ctx.rect(x, top - .5 / dpr, segment.width * scale, segment.height * scale + 1 / dpr); ctx.clip();
        ctx.drawImage(entry.bitmap, x, y + segment.imageTop * scale, segment.width * scale, segment.imageHeight * scale); ctx.restore();
      }
      if (!entry.failed && !entry.pending && (!entry.bitmap || entry.bitmapWidth < target || entry.bitmapWidth > target * 1.75) && !this.queue.some(job => this.key(job.segment) === key)) this.queue.push({ segment, target });
      this.cache.delete(key); this.cache.set(key, entry);
    }
    this.evict(wanted); this.pump();
    const entries = this.visible.map(segment => this.cache.get(this.key(segment)));
    return {
      ready: !!entries.length && entries.every(entry => entry.bitmap && !entry.failed && !entry.pending && entry.bitmapWidth >= target),
      failedVisible: entries.filter(entry => entry.failed).length,
      visible: entries.length, loadedVisible: entries.filter(entry => entry.bitmap).length,
      segments: this.cache.size, dpr, targetBitmapWidth: target,
      bitmapBytes: [...this.cache.values()].reduce((bytes, entry) => bytes + (entry.bitmap ? entry.bitmap.width * entry.bitmap.height * 4 : 0), 0),
      ...this.metrics
    };
  }
  evict(wanted) {
    while (this.cache.size > Math.max(3, wanted.size)) {
      const key = [...this.cache.keys()].find(key => !wanted.has(key)); if (!key) break;
      const entry = this.cache.get(key); entry.removed = true; entry.controller?.abort(); entry.bitmap?.close();
      this.cache.delete(key); this.metrics.evicted++;
    }
  }
  pump() {
    while (!this.destroyed && this.running < 2 && this.queue.length) {
      const job = this.queue.shift(), entry = this.cache.get(this.key(job.segment));
      if (!entry || entry.pending || entry.failed) continue;
      const generation = this.retryGeneration; entry.pending = true; entry.controller = new AbortController(); this.running++;
      let timeout;
      (async () => {
        const operation = (async () => {
          if (!entry.blob) {
            const response = await fetch(job.segment.src, { signal: entry.controller.signal });
            if (!response.ok) throw Error('PDF segment ' + response.status);
            entry.blob = await response.blob(); this.metrics.bytes += entry.blob.size; this.metrics.loaded++;
          }
          const bitmap = await createImageBitmap(entry.blob, { resizeWidth: job.target, resizeHeight: Math.round(job.segment.imageHeight * job.target / job.segment.width), resizeQuality: 'high' });
          if (this.destroyed || entry.removed || entry.controller.signal.aborted) { bitmap.close(); return; }
          entry.bitmap?.close(); entry.bitmap = bitmap; entry.bitmapWidth = job.target; this.metrics.decoded++;
        })();
        await Promise.race([operation, new Promise((_, reject) => { timeout = setTimeout(() => { entry.controller.abort(); reject(Error('PDF segment load timeout')); }, 20000); })]);
      })().catch(error => {
        if (!this.destroyed && !entry.removed && generation === this.retryGeneration) { entry.failed = true; console.error(error); }
      }).finally(() => { clearTimeout(timeout); entry.pending = false; this.running--; this.onChange(); this.pump(); });
    }
  }
  retry() {
    this.retryGeneration++;
    for (const entry of this.cache.values()) if (entry.failed) { entry.failed = false; entry.blob = null; }
    this.onChange();
  }
  destroy() {
    this.destroyed = true; this.queue = [];
    for (const entry of this.cache.values()) { entry.removed = true; entry.controller?.abort(); entry.bitmap?.close(); }
    this.cache.clear();
  }
}
