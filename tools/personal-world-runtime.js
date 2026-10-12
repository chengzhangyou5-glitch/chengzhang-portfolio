// Runs inside the captured page's existing React (u) and JSX runtime (s).
// The build script injects the local asset manifest; no additional scroll engine.
const portfolioPersonalWorldGroups = __PORTFOLIO_PERSONAL_WORLD_CONTENT__;
const portfolioWorldResponsive = __PORTFOLIO_PERSONAL_WORLD_RESPONSIVE__;
const portfolioWorldLoaded = new Set();
const portfolioWorldSourceCache = new Map();
const portfolioWorldSizes = "(max-width: 767px) min(46.5vw, 192px), (max-height: 620px) min(21.4vw, 241px), (max-width: 1023px) clamp(182px, 25.5vw, 257px), clamp(192px, 19.2vw, 302px)";

function portfolioWorldImageSource(image) {
  if (portfolioWorldSourceCache.has(image.id)) return portfolioWorldSourceCache.get(image.id);
  const variants = portfolioWorldResponsive[image.id]?.variants;
  const source = variants?.length ? {
    src: variants[Math.min(1, variants.length - 1)].src,
    srcSet: variants.map(item => `${item.src} ${item.width}w`).join(", "), sizes: portfolioWorldSizes
  } : { src: image.src };
  portfolioWorldSourceCache.set(image.id, source);
  return source;
}

// Warm only the first pair before the middle stage. No photo/physics entities are rebuilt.
function PortfolioPersonalWorldPrewarm({ sectionPosition }) {
  u.useEffect(() => {
    let observer, frame = 0, attempts = 0;
    const warm = () => {
      for (const image of portfolioPersonalWorldImages.slice(0, 2)) {
        if (portfolioWorldLoaded.has(image.id)) continue;
        const bitmap = new Image();
        const source = portfolioWorldImageSource(image);
        if (source.sizes) bitmap.sizes = source.sizes;
        if (source.srcSet) bitmap.srcset = source.srcSet;
        bitmap.src = source.src;
        bitmap.decode().then(() => portfolioWorldLoaded.add(image.id)).catch(() => {});
      }
      observer?.disconnect();
    };
    const attach = () => {
      const element = s0.findSection(sectionPosition, "hyper-space")?.ref?.current;
      if (!element) { if (++attempts < 120) frame = requestAnimationFrame(attach); return; }
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) warm();
      }, { rootMargin: `${Math.round(s0.getViewportHeightPx() * 2)}px 0px` });
      observer.observe(element);
    };
    attach();
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); };
  }, [sectionPosition]);
  return null;
}

function portfolioWorldClamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function portfolioWorldEase(start, end, progress) {
  const t = portfolioWorldClamp((progress - start) / (end - start));
  return t * t * (3 - 2 * t);
}

// Interleave the two themes in each existing group into one photo sequence.
const portfolioPersonalWorldImages = portfolioPersonalWorldGroups.flatMap(group => {
  const [left, right] = group.topics.map(topic => topic.images);
  return Array.from({ length: Math.max(left.length, right.length) }, (_, index) =>
    [left[index], right[index]].filter(Boolean)).flat();
});
// Keep every added photo's full flight inside the existing middle-stage range.
const portfolioWorldLaunch = {
  first: .012,
  interval: Math.min(.074, .83 / Math.max(1, portfolioPersonalWorldImages.length - 1)),
  flight: .115
};
const portfolioWorldLandings = [
  [-.245, -.255, -4], [.235, .265, 3], [.27, -.235, 3.5],
  [-.265, .255, -2], [-.315, .015, 1.5], [.31, -.015, -2.5]
];
const portfolioWorldMobileLandings = [
  [-.245, -.30, -3], [.235, .285, 2], [.245, -.235, 2.5],
  [-.235, .26, -2], [-.255, .025, 1.5], [.255, -.02, -2]
];

function PortfolioMemoryPhoto({ image, index, progress, size, reducedMotion, active }) {
  const requested = u.useRef(portfolioWorldLoaded.has(image.id));
  const loaded = u.useCallback(() => portfolioWorldLoaded.add(image.id), [image.id]);
  const failed = u.useCallback(event => {
    const bitmap = event.currentTarget;
    if (!bitmap.currentSrc.endsWith(".webp")) return;
    bitmap.removeAttribute("srcset"); bitmap.src = image.src;
  }, [image.src]);
  if (index <= active + 2 && index >= Math.max(0, active - 7)) requested.current = true;
  const release = (progress - portfolioWorldLaunch.first) / portfolioWorldLaunch.interval;
  const age = release - index;
  const start = portfolioWorldLaunch.first + index * portfolioWorldLaunch.interval;
  const flight = portfolioWorldClamp((progress - start) / portfolioWorldLaunch.flight);
  const launched = progress > start;
  // Retire the earlier photo outward before another photo arrives at that landing.
  const retirement = index + 6 < portfolioPersonalWorldImages.length
    ? portfolioWorldEase(5.35, 6.25, age) : 0;
  const fresh = 1 - portfolioWorldEase(1.2, 2.05, age);
  const landing = (size.mobile ? portfolioWorldMobileLandings : portfolioWorldLandings)[index % 6];
  const travel = reducedMotion ? 1 : 1 - Math.pow(1 - flight, 2);
  const outward = travel * (1 + retirement * .38);
  const bend = reducedMotion ? 0 : Math.sin(Math.PI * travel) * (index % 2 ? -1 : 1);
  const bendPixels = size.mobile ? 9 : 24;
  const horizontalSpread = size.mobile ? .86 : .93;
  const x = (landing[0] * size.width * outward - landing[1] * bend * bendPixels) * horizontalSpread;
  const y = landing[1] * size.height * outward + landing[0] * bend * bendPixels;
  const arrival = reducedMotion ? 1 : portfolioWorldEase(.02, .20, flight);
  const sceneExit = 1 - portfolioWorldEase(.962, 1, progress);
  const opacity = launched ? arrival * (.97 + fresh * .03) * (1 - retirement) * sceneExit : 0;
  const scale = reducedMotion ? .97
    : (.12 + .85 * portfolioWorldEase(0, .76, flight) + .045 * Math.sin(Math.PI * flight)) * (1 + fresh * .04);
  const rotation = reducedMotion ? landing[2] : landing[2] * (.2 + .8 * travel);
  const state = !launched ? "waiting" : retirement >= .999 ? "departed" : flight < .999 ? "flying" : "settled";

  return s.jsx("figure", {
    className: "personal-world-card",
    "data-card-id": image.id,
    "data-raw-photo": image.raw ? "true" : undefined,
    "data-card-current": index === active && opacity > .01 ? "true" : "false",
    "data-memory-state": state,
    "data-flight-progress": flight.toFixed(4),
    "data-landing": index % 6,
    "aria-hidden": opacity < .02,
    style: {
      zIndex: index === active ? 50 : 10 + index,
      opacity,
      visibility: opacity > .001 ? "visible" : "hidden",
      transform: `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) rotate(${rotation}deg) scale(${scale})`,
      "--world-shadow-alpha": .30 + fresh * .22,
      "--world-shadow-depth": `${14 + fresh * 12}px`,
      "--world-shadow-blur": `${24 + fresh * 14}px`
    },
    children: s.jsx("img", {
      ...(requested.current ? portfolioWorldImageSource(image) : {}),
      onLoad: loaded,
      onError: failed,
      alt: image.alt,
      width: image.width,
      height: image.height,
      decoding: "async",
      loading: requested.current ? "eager" : "lazy",
      fetchPriority: index === active || index === active + 1 ? "high" : "low",
      draggable: false
    })
  }, image.id);
}

function PortfolioPersonalWorld({ progress }) {
  const fieldRef = u.useRef(null);
  const [size, setSize] = u.useState(null);
  const [reducedMotion, setReducedMotion] = u.useState(false);
  u.useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const measure = () => {
      const width = field.clientWidth;
      const height = field.clientHeight;
      const mobile = window.innerWidth < 768;
      setSize(previous => previous?.width === width && previous.height === height && previous.mobile === mobile
        ? previous : { width, height, mobile });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(field);
    return () => observer.disconnect();
  }, []);
  u.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const release = (progress - portfolioWorldLaunch.first) / portfolioWorldLaunch.interval;
  const active = release < 0 ? -1 : Math.min(portfolioPersonalWorldImages.length - 1, Math.floor(release));
  return s.jsx("section", {
    className: "personal-world",
    "aria-label": "工作之外的个人世界",
    "data-release-index": active,
    children: s.jsx("div", {
      className: "personal-world-field",
      ref: fieldRef,
      children: size && portfolioPersonalWorldImages.map((image, index) => s.jsx(PortfolioMemoryPhoto, {
        image, index, progress, size, reducedMotion, active
      }, image.id))
    })
  });
}

function fm({ringProgress01:e}) {
  return s.jsxs(s.Fragment, { children: [
    s.jsx(c7, { progress01: e }),
    s.jsx(PortfolioPersonalWorld, { progress: e })
  ] });
}
