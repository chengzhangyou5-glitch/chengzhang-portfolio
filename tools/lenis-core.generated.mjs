// Generated from the existing CanvasFlow Lenis 1.3.23 core by extract-project-scroll-core.mjs.
var t = "1.3.23";
function n(e, t2, n2) {
  return Math.max(e, Math.min(t2, n2));
}
var r = class {
  isRunning = false;
  value = 0;
  from = 0;
  to = 0;
  currentTime = 0;
  lerp;
  duration;
  easing;
  onUpdate;
  advance(e) {
    if (!this.isRunning) return;
    let t2 = false;
    if (this.duration && this.easing) {
      this.currentTime += e;
      let r3 = n(0, this.currentTime / this.duration, 1), i3 = (t2 = r3 >= 1) ? 1 : this.easing(r3);
      this.value = this.from + (this.to - this.from) * i3;
    } else if (this.lerp) {
      var r2, i2, a2, o2;
      this.value = (r2 = this.value, i2 = this.to, a2 = 60 * this.lerp, (1 - (o2 = 1 - Math.exp(-a2 * e))) * r2 + o2 * i2), Math.round(this.value) === Math.round(this.to) && (this.value = this.to, t2 = true);
    } else this.value = this.to, t2 = true;
    t2 && this.stop(), this.onUpdate?.(this.value, t2);
  }
  stop() {
    this.isRunning = false;
  }
  fromTo(e, t2, { lerp: n2, duration: r2, easing: i2, onStart: a2, onUpdate: o2 }) {
    this.from = this.value = e, this.to = t2, this.lerp = n2, this.duration = r2, this.easing = i2, this.currentTime = 0, this.isRunning = true, a2?.(), this.onUpdate = o2;
  }
}, i = class {
  width = 0;
  height = 0;
  scrollHeight = 0;
  scrollWidth = 0;
  debouncedResize;
  wrapperResizeObserver;
  contentResizeObserver;
  constructor(e, t2, { autoResize: n2 = true, debounce: r2 = 250 } = {}) {
    this.wrapper = e, this.content = t2, n2 && (this.debouncedResize = /* @__PURE__ */ (function(e2, t3) {
      let n3;
      return function(...r3) {
        clearTimeout(n3), n3 = setTimeout(() => {
          n3 = void 0, e2.apply(this, r3);
        }, t3);
      };
    })(this.resize, r2), this.wrapper instanceof Window ? window.addEventListener("resize", this.debouncedResize) : (this.wrapperResizeObserver = new ResizeObserver(this.debouncedResize), this.wrapperResizeObserver.observe(this.wrapper)), this.contentResizeObserver = new ResizeObserver(this.debouncedResize), this.contentResizeObserver.observe(this.content)), this.resize();
  }
  destroy() {
    this.wrapperResizeObserver?.disconnect(), this.contentResizeObserver?.disconnect(), this.wrapper === window && this.debouncedResize && window.removeEventListener("resize", this.debouncedResize);
  }
  resize = () => {
    this.onWrapperResize(), this.onContentResize();
  };
  onWrapperResize = () => {
    this.wrapper instanceof Window ? (this.width = window.innerWidth, this.height = window.innerHeight) : (this.width = this.wrapper.clientWidth, this.height = this.wrapper.clientHeight);
  };
  onContentResize = () => {
    this.wrapper instanceof Window ? (this.scrollHeight = this.content.scrollHeight, this.scrollWidth = this.content.scrollWidth) : (this.scrollHeight = this.wrapper.scrollHeight, this.scrollWidth = this.wrapper.scrollWidth);
  };
  get limit() {
    return { x: this.scrollWidth - this.width, y: this.scrollHeight - this.height };
  }
}, a = class {
  events = {};
  emit(e, ...t2) {
    let n2 = this.events[e] || [];
    for (let e2 = 0, r2 = n2.length; e2 < r2; e2++) n2[e2]?.(...t2);
  }
  on(e, t2) {
    return this.events[e] ? this.events[e].push(t2) : this.events[e] = [t2], () => {
      this.events[e] = this.events[e]?.filter((e2) => t2 !== e2);
    };
  }
  off(e, t2) {
    this.events[e] = this.events[e]?.filter((e2) => t2 !== e2);
  }
  destroy() {
    this.events = {};
  }
};
let o = 100 / 6, s = { passive: false };
function l(e, t2) {
  return 1 === e ? o : 2 === e ? t2 : 1;
}
var u = class {
  touchStart = { x: 0, y: 0 };
  lastDelta = { x: 0, y: 0 };
  window = { width: 0, height: 0 };
  emitter = new a();
  constructor(e, t2 = { wheelMultiplier: 1, touchMultiplier: 1 }) {
    this.element = e, this.options = t2, window.addEventListener("resize", this.onWindowResize), this.onWindowResize(), this.element.addEventListener("wheel", this.onWheel, s), this.element.addEventListener("touchstart", this.onTouchStart, s), this.element.addEventListener("touchmove", this.onTouchMove, s), this.element.addEventListener("touchend", this.onTouchEnd, s);
  }
  on(e, t2) {
    return this.emitter.on(e, t2);
  }
  destroy() {
    this.emitter.destroy(), window.removeEventListener("resize", this.onWindowResize), this.element.removeEventListener("wheel", this.onWheel, s), this.element.removeEventListener("touchstart", this.onTouchStart, s), this.element.removeEventListener("touchmove", this.onTouchMove, s), this.element.removeEventListener("touchend", this.onTouchEnd, s);
  }
  onTouchStart = (e) => {
    let { clientX: t2, clientY: n2 } = e.targetTouches ? e.targetTouches[0] : e;
    this.touchStart.x = t2, this.touchStart.y = n2, this.lastDelta = { x: 0, y: 0 }, this.emitter.emit("scroll", { deltaX: 0, deltaY: 0, event: e });
  };
  onTouchMove = (e) => {
    let { clientX: t2, clientY: n2 } = e.targetTouches ? e.targetTouches[0] : e, r2 = -(t2 - this.touchStart.x) * this.options.touchMultiplier, i2 = -(n2 - this.touchStart.y) * this.options.touchMultiplier;
    this.touchStart.x = t2, this.touchStart.y = n2, this.lastDelta = { x: r2, y: i2 }, this.emitter.emit("scroll", { deltaX: r2, deltaY: i2, event: e });
  };
  onTouchEnd = (e) => {
    this.emitter.emit("scroll", { deltaX: this.lastDelta.x, deltaY: this.lastDelta.y, event: e });
  };
  onWheel = (e) => {
    let { deltaX: t2, deltaY: n2, deltaMode: r2 } = e, i2 = l(r2, this.window.width), a2 = l(r2, this.window.height);
    t2 *= i2, n2 *= a2, t2 *= this.options.wheelMultiplier, n2 *= this.options.wheelMultiplier, this.emitter.emit("scroll", { deltaX: t2, deltaY: n2, event: e });
  };
  onWindowResize = () => {
    this.window = { width: window.innerWidth, height: window.innerHeight };
  };
};
let c = (e) => Math.min(1, 1.001 - 2 ** (-10 * e));
var d = class {
  _isScrolling = false;
  _isStopped = false;
  _isLocked = false;
  _preventNextNativeScrollEvent = false;
  _resetVelocityTimeout = null;
  _rafId = null;
  isTouching;
  time = 0;
  userData = {};
  lastVelocity = 0;
  velocity = 0;
  direction = 0;
  options;
  targetScroll;
  animatedScroll;
  animate = new r();
  emitter = new a();
  dimensions;
  virtualScroll;
  constructor({ wrapper: e = window, content: n2 = document.documentElement, eventsTarget: r2 = e, smoothWheel: a2 = true, syncTouch: o2 = false, syncTouchLerp: s2 = 0.075, touchInertiaExponent: l2 = 1.7, duration: d2, easing: f, lerp: p = 0.1, infinite: h = false, orientation: m = "vertical", gestureOrientation: g = "horizontal" === m ? "both" : "vertical", touchMultiplier: v = 1, wheelMultiplier: S = 1, autoResize: E = true, prevent: A, virtualScroll: T, overscroll: x = true, autoRaf: M = false, anchors: C = false, autoToggle: _ = false, allowNestedScroll: b = false, __experimental__naiveDimensions: y = false, naiveDimensions: w = y, stopInertiaOnNavigate: R = false } = {}) {
    window.lenisVersion = t, window.lenis || (window.lenis = {}), window.lenis.version = t, "horizontal" === m && (window.lenis.horizontal = true), true === o2 && (window.lenis.touch = true), e && e !== document.documentElement || (e = window), "number" == typeof d2 && "function" != typeof f ? f = c : "function" == typeof f && "number" != typeof d2 && (d2 = 1), this.options = { wrapper: e, content: n2, eventsTarget: r2, smoothWheel: a2, syncTouch: o2, syncTouchLerp: s2, touchInertiaExponent: l2, duration: d2, easing: f, lerp: p, infinite: h, gestureOrientation: g, orientation: m, touchMultiplier: v, wheelMultiplier: S, autoResize: E, prevent: A, virtualScroll: T, overscroll: x, autoRaf: M, anchors: C, autoToggle: _, allowNestedScroll: b, naiveDimensions: w, stopInertiaOnNavigate: R }, this.dimensions = new i(e, n2, { autoResize: E }), this.updateClassName(), this.targetScroll = this.animatedScroll = this.actualScroll, this.options.wrapper.addEventListener("scroll", this.onNativeScroll), this.options.wrapper.addEventListener("scrollend", this.onScrollEnd, { capture: true }), (this.options.anchors || this.options.stopInertiaOnNavigate) && this.options.wrapper.addEventListener("click", this.onClick), this.options.wrapper.addEventListener("pointerdown", this.onPointerDown), this.virtualScroll = new u(r2, { touchMultiplier: v, wheelMultiplier: S }), this.virtualScroll.on("scroll", this.onVirtualScroll), this.options.autoToggle && (this.checkOverflow(), this.rootElement.addEventListener("transitionend", this.onTransitionEnd)), this.options.autoRaf && (this._rafId = requestAnimationFrame(this.raf));
  }
  destroy() {
    this.emitter.destroy(), this.options.wrapper.removeEventListener("scroll", this.onNativeScroll), this.options.wrapper.removeEventListener("scrollend", this.onScrollEnd, { capture: true }), this.options.wrapper.removeEventListener("pointerdown", this.onPointerDown), (this.options.anchors || this.options.stopInertiaOnNavigate) && this.options.wrapper.removeEventListener("click", this.onClick), this.virtualScroll.destroy(), this.dimensions.destroy(), this.cleanUpClassName(), this._rafId && cancelAnimationFrame(this._rafId);
  }
  on(e, t2) {
    return this.emitter.on(e, t2);
  }
  off(e, t2) {
    return this.emitter.off(e, t2);
  }
  onScrollEnd = (e) => {
    e instanceof CustomEvent || "smooth" !== this.isScrolling && false !== this.isScrolling || e.stopPropagation();
  };
  dispatchScrollendEvent = () => {
    this.options.wrapper.dispatchEvent(new CustomEvent("scrollend", { bubbles: this.options.wrapper === window, detail: { lenisScrollEnd: true } }));
  };
  get overflow() {
    let e = this.isHorizontal ? "overflow-x" : "overflow-y";
    return getComputedStyle(this.rootElement)[e];
  }
  checkOverflow() {
    ["hidden", "clip"].includes(this.overflow) ? this.internalStop() : this.internalStart();
  }
  onTransitionEnd = (e) => {
    e.propertyName?.includes("overflow") && e.target === this.rootElement && this.checkOverflow();
  };
  setScroll(e) {
    this.isHorizontal ? this.options.wrapper.scrollTo({ left: e, behavior: "instant" }) : this.options.wrapper.scrollTo({ top: e, behavior: "instant" });
  }
  onClick = (e) => {
    let t2 = e.composedPath().filter((e2) => e2 instanceof HTMLAnchorElement && e2.href).map((e2) => new URL(e2.href)), n2 = new URL(window.location.href);
    if (this.options.anchors) {
      let e2 = t2.find((e3) => n2.host === e3.host && n2.pathname === e3.pathname && e3.hash);
      if (e2) {
        let t3 = "object" == typeof this.options.anchors && this.options.anchors ? this.options.anchors : void 0, n3 = `#${e2.hash.split("#")[1]}`;
        this.scrollTo(n3, t3);
        return;
      }
    }
    if (this.options.stopInertiaOnNavigate && t2.some((e2) => n2.host === e2.host && n2.pathname !== e2.pathname)) return void this.reset();
  };
  onPointerDown = (e) => {
    1 === e.button && this.reset();
  };
  onVirtualScroll = (e) => {
    if ("function" == typeof this.options.virtualScroll && false === this.options.virtualScroll(e)) return;
    let { deltaX: t2, deltaY: n2, event: r2 } = e;
    if (this.emitter.emit("virtual-scroll", { deltaX: t2, deltaY: n2, event: r2 }), r2.ctrlKey || r2.lenisStopPropagation) return;
    let i2 = r2.type.includes("touch"), a2 = r2.type.includes("wheel");
    this.isTouching = "touchstart" === r2.type || "touchmove" === r2.type;
    let o2 = 0 === t2 && 0 === n2;
    if (this.options.syncTouch && i2 && "touchstart" === r2.type && o2 && !this.isStopped && !this.isLocked) return void this.reset();
    let s2 = "vertical" === this.options.gestureOrientation && 0 === n2 || "horizontal" === this.options.gestureOrientation && 0 === t2;
    if (o2 || s2) return;
    let l2 = r2.composedPath();
    l2 = l2.slice(0, l2.indexOf(this.rootElement));
    let u2 = this.options.prevent, c2 = Math.abs(t2) >= Math.abs(n2) ? "horizontal" : "vertical";
    if (l2.find((e2) => e2 instanceof HTMLElement && ("function" == typeof u2 && u2?.(e2) || e2.hasAttribute?.("data-lenis-prevent") || "vertical" === c2 && e2.hasAttribute?.("data-lenis-prevent-vertical") || "horizontal" === c2 && e2.hasAttribute?.("data-lenis-prevent-horizontal") || i2 && e2.hasAttribute?.("data-lenis-prevent-touch") || a2 && e2.hasAttribute?.("data-lenis-prevent-wheel") || this.options.allowNestedScroll && this.hasNestedScroll(e2, { deltaX: t2, deltaY: n2 })))) return;
    if (this.isStopped || this.isLocked) {
      r2.cancelable && r2.preventDefault();
      return;
    }
    if (!(this.options.syncTouch && i2 || this.options.smoothWheel && a2)) {
      this.isScrolling = "native", this.animate.stop(), r2.lenisStopPropagation = true;
      return;
    }
    let d2 = n2;
    "both" === this.options.gestureOrientation ? d2 = Math.abs(n2) > Math.abs(t2) ? n2 : t2 : "horizontal" === this.options.gestureOrientation && (d2 = t2), (!this.options.overscroll || this.options.infinite || this.options.wrapper !== window && this.limit > 0 && (this.animatedScroll > 0 && this.animatedScroll < this.limit || 0 === this.animatedScroll && n2 > 0 || this.animatedScroll === this.limit && n2 < 0)) && (r2.lenisStopPropagation = true), r2.cancelable && r2.preventDefault();
    let f = i2 && this.options.syncTouch, p = i2 && "touchend" === r2.type;
    p && (d2 = Math.sign(d2) * Math.abs(this.velocity) ** this.options.touchInertiaExponent), this.scrollTo(this.targetScroll + d2, { programmatic: false, ...f ? { lerp: p ? this.options.syncTouchLerp : 1 } : { lerp: this.options.lerp, duration: this.options.duration, easing: this.options.easing } });
  };
  resize() {
    this.dimensions.resize(), this.animatedScroll = this.targetScroll = this.actualScroll, this.emit();
  }
  emit() {
    this.emitter.emit("scroll", this);
  }
  onNativeScroll = () => {
    if (null !== this._resetVelocityTimeout && (clearTimeout(this._resetVelocityTimeout), this._resetVelocityTimeout = null), this._preventNextNativeScrollEvent) {
      this._preventNextNativeScrollEvent = false;
      return;
    }
    if (false === this.isScrolling || "native" === this.isScrolling) {
      let e = this.animatedScroll;
      this.animatedScroll = this.targetScroll = this.actualScroll, this.lastVelocity = this.velocity, this.velocity = this.animatedScroll - e, this.direction = Math.sign(this.animatedScroll - e), this.isStopped || (this.isScrolling = "native"), this.emit(), 0 !== this.velocity && (this._resetVelocityTimeout = setTimeout(() => {
        this.lastVelocity = this.velocity, this.velocity = 0, this.isScrolling = false, this.emit();
      }, 400));
    }
  };
  reset() {
    this.isLocked = false, this.isScrolling = false, this.animatedScroll = this.targetScroll = this.actualScroll, this.lastVelocity = this.velocity = 0, this.animate.stop();
  }
  start() {
    if (this.isStopped) {
      if (this.options.autoToggle) return void this.rootElement.style.removeProperty("overflow");
      this.internalStart();
    }
  }
  internalStart() {
    this.isStopped && (this.reset(), this.isStopped = false, this.emit());
  }
  stop() {
    if (!this.isStopped) {
      if (this.options.autoToggle) return void this.rootElement.style.setProperty("overflow", "clip");
      this.internalStop();
    }
  }
  internalStop() {
    this.isStopped || (this.reset(), this.isStopped = true, this.emit());
  }
  raf = (e) => {
    let t2 = e - (this.time || e);
    this.time = e, this.animate.advance(1e-3 * t2), this.options.autoRaf && (this._rafId = requestAnimationFrame(this.raf));
  };
  scrollTo(e, { offset: t2 = 0, immediate: r2 = false, lock: i2 = false, programmatic: a2 = true, lerp: o2 = a2 ? this.options.lerp : void 0, duration: s2 = a2 ? this.options.duration : void 0, easing: l2 = a2 ? this.options.easing : void 0, onStart: u2, onComplete: d2, force: f = false, userData: p } = {}) {
    if ((this.isStopped || this.isLocked) && !f) return;
    let h = e, m = t2;
    if ("string" == typeof h && ["top", "left", "start", "#"].includes(h)) h = 0;
    else if ("string" == typeof h && ["bottom", "right", "end"].includes(h)) h = this.limit;
    else {
      let e2 = null;
      if ("string" == typeof h ? (e2 = document.querySelector(h)) || ("#top" === h ? h = 0 : console.warn("Lenis: Target not found", h)) : h instanceof HTMLElement && h?.nodeType && (e2 = h), e2) {
        if (this.options.wrapper !== window) {
          let e3 = this.rootElement.getBoundingClientRect();
          m -= this.isHorizontal ? e3.left : e3.top;
        }
        let t3 = e2.getBoundingClientRect(), n2 = getComputedStyle(e2), r3 = this.isHorizontal ? Number.parseFloat(n2.scrollMarginLeft) : Number.parseFloat(n2.scrollMarginTop), i3 = getComputedStyle(this.rootElement), a3 = this.isHorizontal ? Number.parseFloat(i3.scrollPaddingLeft) : Number.parseFloat(i3.scrollPaddingTop);
        h = (this.isHorizontal ? t3.left : t3.top) + this.animatedScroll - (Number.isNaN(r3) ? 0 : r3) - (Number.isNaN(a3) ? 0 : a3);
      }
    }
    if ("number" == typeof h) {
      if (h += m, this.options.infinite) {
        if (a2) {
          this.targetScroll = this.animatedScroll = this.scroll;
          let e2 = h - this.animatedScroll;
          e2 > this.limit / 2 ? h -= this.limit : e2 < -this.limit / 2 && (h += this.limit);
        }
      } else h = n(0, h, this.limit);
      if (h === this.targetScroll) {
        u2?.(this), d2?.(this);
        return;
      }
      if (this.userData = p ?? {}, r2) {
        this.animatedScroll = this.targetScroll = h, this.setScroll(this.scroll), this.reset(), this.preventNextNativeScrollEvent(), this.emit(), d2?.(this), this.userData = {}, requestAnimationFrame(() => {
          this.dispatchScrollendEvent();
        });
        return;
      }
      a2 || (this.targetScroll = h), "number" == typeof s2 && "function" != typeof l2 ? l2 = c : "function" == typeof l2 && "number" != typeof s2 && (s2 = 1), this.animate.fromTo(this.animatedScroll, h, { duration: s2, easing: l2, lerp: o2, onStart: () => {
        i2 && (this.isLocked = true), this.isScrolling = "smooth", u2?.(this);
      }, onUpdate: (e2, t3) => {
        this.isScrolling = "smooth", this.lastVelocity = this.velocity, this.velocity = e2 - this.animatedScroll, this.direction = Math.sign(this.velocity), this.animatedScroll = e2, this.setScroll(this.scroll), a2 && (this.targetScroll = e2), t3 || this.emit(), t3 && (this.reset(), this.emit(), d2?.(this), this.userData = {}, requestAnimationFrame(() => {
          this.dispatchScrollendEvent();
        }), this.preventNextNativeScrollEvent());
      } });
    }
  }
  preventNextNativeScrollEvent() {
    this._preventNextNativeScrollEvent = true, requestAnimationFrame(() => {
      this._preventNextNativeScrollEvent = false;
    });
  }
  hasNestedScroll(e, { deltaX: t2, deltaY: n2 }) {
    let r2, i2, a2, o2, s2, l2, u2, c2, d2, f, p, h, m, g, v, S, E = Date.now();
    e._lenis || (e._lenis = {});
    let A = e._lenis;
    if (E - (A.time ?? 0) > 2e3) {
      A.time = Date.now();
      let t3 = window.getComputedStyle(e);
      if (A.computedStyle = t3, r2 = ["auto", "overlay", "scroll"].includes(t3.overflowX), i2 = ["auto", "overlay", "scroll"].includes(t3.overflowY), s2 = ["auto"].includes(t3.overscrollBehaviorX), l2 = ["auto"].includes(t3.overscrollBehaviorY), A.hasOverflowX = r2, A.hasOverflowY = i2, !(r2 || i2)) return false;
      u2 = e.scrollWidth, c2 = e.scrollHeight, d2 = e.clientWidth, f = e.clientHeight, a2 = u2 > d2, o2 = c2 > f, A.isScrollableX = a2, A.isScrollableY = o2, A.scrollWidth = u2, A.scrollHeight = c2, A.clientWidth = d2, A.clientHeight = f, A.hasOverscrollBehaviorX = s2, A.hasOverscrollBehaviorY = l2;
    } else a2 = A.isScrollableX, o2 = A.isScrollableY, r2 = A.hasOverflowX, i2 = A.hasOverflowY, u2 = A.scrollWidth, c2 = A.scrollHeight, d2 = A.clientWidth, f = A.clientHeight, s2 = A.hasOverscrollBehaviorX, l2 = A.hasOverscrollBehaviorY;
    if (!(r2 && a2 || i2 && o2)) return false;
    let T = Math.abs(t2) >= Math.abs(n2) ? "horizontal" : "vertical";
    if ("horizontal" === T) p = Math.round(e.scrollLeft), h = u2 - d2, m = t2, g = r2, v = a2, S = s2;
    else {
      if ("vertical" !== T) return false;
      p = Math.round(e.scrollTop), h = c2 - f, m = n2, g = i2, v = o2, S = l2;
    }
    return !S && (p >= h || p <= 0) || (m > 0 ? p < h : p > 0) && g && v;
  }
  get rootElement() {
    return this.options.wrapper === window ? document.documentElement : this.options.wrapper;
  }
  get limit() {
    return this.options.naiveDimensions ? this.isHorizontal ? this.rootElement.scrollWidth - this.rootElement.clientWidth : this.rootElement.scrollHeight - this.rootElement.clientHeight : this.dimensions.limit[this.isHorizontal ? "x" : "y"];
  }
  get isHorizontal() {
    return "horizontal" === this.options.orientation;
  }
  get actualScroll() {
    let e = this.options.wrapper;
    return this.isHorizontal ? e.scrollX ?? e.scrollLeft : e.scrollY ?? e.scrollTop;
  }
  get scroll() {
    var e;
    return this.options.infinite ? (this.animatedScroll % (e = this.limit) + e) % e : this.animatedScroll;
  }
  get progress() {
    return 0 === this.limit ? 1 : this.scroll / this.limit;
  }
  get isScrolling() {
    return this._isScrolling;
  }
  set isScrolling(e) {
    this._isScrolling !== e && (this._isScrolling = e, this.updateClassName());
  }
  get isStopped() {
    return this._isStopped;
  }
  set isStopped(e) {
    this._isStopped !== e && (this._isStopped = e, this.updateClassName());
  }
  get isLocked() {
    return this._isLocked;
  }
  set isLocked(e) {
    this._isLocked !== e && (this._isLocked = e, this.updateClassName());
  }
  get isSmooth() {
    return "smooth" === this.isScrolling;
  }
  get className() {
    let e = "lenis";
    return this.options.autoToggle && (e += " lenis-autoToggle"), this.isStopped && (e += " lenis-stopped"), this.isLocked && (e += " lenis-locked"), this.isScrolling && (e += " lenis-scrolling"), "smooth" === this.isScrolling && (e += " lenis-smooth"), e;
  }
  updateClassName() {
    this.cleanUpClassName(), this.className.split(" ").forEach((e) => {
      this.rootElement.classList.add(e);
    });
  }
  cleanUpClassName() {
    for (let e of Array.from(this.rootElement.classList)) ("lenis" === e || e.startsWith("lenis-")) && this.rootElement.classList.remove(e);
  }
};
export {
  d as Lenis
};
