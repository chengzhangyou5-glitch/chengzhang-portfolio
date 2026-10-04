// Runs inside the captured page's existing React (u) and JSX runtime (s).
// The build script injects the local asset manifest; no additional scroll engine.
const portfolioPersonalWorldGroups = __PORTFOLIO_PERSONAL_WORLD_CONTENT__;

function portfolioWorldClamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function portfolioWorldEase(start, end, progress) {
  const t = portfolioWorldClamp((progress - start) / (end - start));
  return t * t * (3 - 2 * t);
}

// Interleave the two themes in each existing group into one photo sequence.
const portfolioPersonalWorldImages = portfolioPersonalWorldGroups.flatMap(group =>
  group.topics[0].images.flatMap((image, index) => [image, group.topics[1].images[index]])
);
const portfolioWorldLaunch = { first: .012, interval: .074, flight: .115 };
const portfolioWorldLandings = [
  [-.30, -.29, -4], [.285, .315, 3], [.33, -.25, 3.5],
  [-.325, .29, -2], [-.43, .055, 1.5], [.425, -.035, -2.5]
];
const portfolioWorldMobileLandings = [
  [-.285, -.33, -3], [.275, .31, 2], [.285, -.26, 2.5],
  [-.275, .285, -2], [-.295, .03, 1.5], [.295, -.025, -2]
];

function PortfolioMemoryPhoto({ image, index, progress, size, reducedMotion, active }) {
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
      src: image.src,
      alt: image.alt,
      width: image.width,
      height: image.height,
      decoding: "async",
      loading: index < 2 ? "eager" : "lazy",
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
