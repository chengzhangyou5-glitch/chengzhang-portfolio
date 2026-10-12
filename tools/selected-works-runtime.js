// Shares the page's existing React/JSX and scroll environment. No second scroll engine.
// Existing resume data is retained. Entry overviews are separate from detail-page notes.
const portfolioSelectedProjects = [
  {
    id: "canvasflow-art-preview", title: "Vibe Coding生成产品实践", shortTitle: "Vibe Coding生成产品实践",
    titleLines: ["Vibe Coding", "生成产品实践"],
    type: "产品设计 / AI 工作流", tags: ["高保真原型"], period: "2026.08 — 2026.09",
    role: "产品设计与原型实现", cover: "/assets/works/canvasflow-vibe-coding.png", width: 3840, height: 2010, color: "#6861de",
    overview: "以 CanvasFlow AI 为实践载体，围绕 Vibe Coding 工作流，探索从需求拆解、产品设计到 AI 协同开发与迭代验证的完整链路，呈现人机协作下的产品落地过程。",
    background: "装饰画场景图需要兼顾空间表现与商品真实性。项目围绕受约束的场景生成、可解释的商品保真检查和人工确认后导出展开。",
    responsibility: "梳理产品流程、交互方案与高保真原型，将场景创建、结果对比和保真检查串成连续体验。",
    work: "设计原画上传、尺寸与场景设置、挂画区域选择及生成状态；在结果页提供方案对比，并围绕图案、颜色、画框、比例、空间尺度与挂画位置组织保真检查。",
    coverCaption: "Vibe Coding 项目主视觉。"
  },
  {
    id: "aigc-design-efficiency", title: "AIGC 设计提效项目", shortTitle: "AIGC 设计提效",
    type: "AIGC / 工作流", tags: ["模型训练", "资源体系", "流程优化"], period: "2025.05 — 2025.06",
    role: "AIGC 设计师", cover: "/assets/works/aigc-efficiency.png", width: 1712, height: 964, color: "#6d465d",
    overview: "探索 AI 在运营设计中的实际应用，通过模型训练、资源整理与效果验证，提升素材生成质量和复用效率。",
    background: "面向运营素材生产，探索 AI 在设计流程中的实际应用，提升生成质量与素材复用效率。",
    responsibility: "参与设计资源流程搭建、模型训练与生成效果验证。",
    work: "整理素材分类与动态资源库；参与 XL / FLUX 模型训练，调整场景数据、标注与参数；结合合成效率和素材复用率复盘，沉淀优化策略。"
  },
  {
    id: "fliggy-lele-run", title: "飞猪乐乐跑运营活动", shortTitle: "飞猪乐乐跑",
    type: "运营设计 / AIGC", tags: ["活动视觉", "IP 场景"], period: "2025.03 — 2025.05",
    role: "AIGC 设计师", cover: "/assets/works/fliggy-lele-run.png", width: 1712, height: 964, color: "#ab6744",
    overview: "围绕飞猪乐乐跑运营活动，参与 IP 形象、活动场景与视觉素材设计，结合 AIGC 工具提升素材生产效率。",
    background: "围绕飞猪乐乐跑活动，梳理玩法与竞品视觉，建立统一的活动视觉基调。",
    responsibility: "参与需求共创、视觉草图制定和活动素材生产。",
    work: "使用 SD、MJ 等工具生成猪猪 IP 及主要图标，再通过 PS 二次优化；协助飞猪 IP 场景化模型训练，复盘业务反馈并沉淀可复用的 AIGC 方法。"
  },
  {
    id: "lexin-health-app", title: "乐心健康运动 APP", shortTitle: "乐心健康运动 APP",
    type: "产品设计 / UI·UX", typeTags: ["UI·UX"], tags: ["用户研究", "交互设计", "设计系统"], period: "2024.07 — 2024.12",
    role: "UX 设计师", cover: "/assets/works/lexin-health-app.png", width: 1712, height: 1160, color: "#436b8f",
    overview: "围绕运动与健康数据的核心体验，梳理用户需求和关键路径，优化首页、运动页及数据详情的交互与视觉。",
    background: "以健康类 APP 的核心体验为切入点，梳理首页、运动与健康数据中的使用痛点。",
    responsibility: "参与用户调研、信息架构整理、交互与高保真界面设计。",
    work: "结合行为访谈和反馈分析明确优化方向；协同产品经理梳理页面信息和关键路径；输出首页、运动页、详情页原型，并参与色彩、图标、动效及健康图表规范优化。"
  }
];
const portfolioWorksLastIndex = portfolioSelectedProjects.length - 1;
const portfolioWorksTotal = String(portfolioSelectedProjects.length).padStart(2, "0");
const portfolioWorksResponsive = __PORTFOLIO_WORKS_RESPONSIVE__;

function portfolioWorksCoverSource(project, ready) {
  if (!ready) return {};
  const name = project.cover.split("/").pop().replace(/\.png$/, "");
  const variants = portfolioWorksResponsive[name]?.variants;
  return variants?.length ? { src: variants[1]?.src || variants[0].src,
    srcSet: variants.map(item => `${item.src} ${item.width}w`).join(", "), sizes: "100vw" }
    : { src: project.cover };
}
function portfolioWorksCoverFallback(event, project) {
  const image = event.currentTarget;
  if (!image.currentSrc.endsWith(".webp")) return;
  image.removeAttribute("srcset"); image.src = project.cover;
}

function portfolioRememberProject(id) {
  try {
    sessionStorage.setItem("portfolio:works-last", id);
    sessionStorage.setItem("portfolio:works-origin", window.location.search);
  } catch { /* A disabled storage setting must not block a project link. */ }
}

function PortfolioWorksCopy({ project, index, active }) {
  return e.jsxs("div", {
    className: "works-copy", "data-active": active, "aria-hidden": !active,
    inert: active ? undefined : true, "data-project-id": project.id,
    children: [
      e.jsx("p", { className: "works-type", children: project.type }),
      e.jsx("h3", { className: "works-name", "aria-label": project.title, children: project.titleLines ? project.titleLines.map(line => e.jsx("span", { className: "works-name-line", children: line }, line)) : project.title }),
      e.jsx("ul", { className: "works-tags", children: [
        ...(project.typeTags || project.type.split(" / ")).map(tag => e.jsx("li", { className: "works-type-tag", children: tag }, "type:" + tag)),
        ...project.tags.map(tag => e.jsx("li", { children: tag }, tag))
      ] }),
      e.jsxs("dl", { className: "works-meta", children: [
        e.jsxs("div", { children: [e.jsx("dt", { children: "项目时间" }), e.jsx("dd", { lang: "en", children: project.period })] })
      ] }),
      e.jsx("span", { className: "works-mobile-number", children: String(index + 1).padStart(2, "0") + " / " + portfolioWorksTotal })
    ]
  });
}

function PortfolioWorksDescription({ project, active }) {
  return e.jsxs("div", {
    className: "works-description", "data-active": active, "aria-hidden": !active,
    inert: active ? undefined : true, "data-project-id": project.id,
    children: [
      e.jsx("p", { className: "works-summary", children: project.overview }),
      e.jsxs("a", { className: "works-detail-link", href: "/projects/" + project.id + "/", onClick: () => portfolioRememberProject(project.id), children: ["查看项目", e.jsx("span", { "aria-hidden": true, children: "↗" })] })
    ]
  });
}

// The existing canvas pointer uses 16 CSS pixels per cell. Keep outline cells
// at that size rather than scaling an SVG grid with the cover's aspect ratio.
const portfolioWorksPixelSize = 16;

function portfolioWorksOutlineCells(width, height, imageWidth, imageHeight) {
  const size = portfolioWorksPixelSize;
  const pitch = 24;
  const gap = width < 400 ? 17 : 22;
  const left = (width - imageWidth) / 2, top = (height - imageHeight) / 2;
  const right = left + imageWidth, bottom = top + imageHeight;
  const cells = new Map();
  const add = (x, y, normalX, normalY, group, cluster = false) => {
    // Reserve the entire motion envelope, including assembly and micro-scale.
    // Never clamp candidates together: an unsafe candidate is simply omitted.
    if (x < 14 || y < 14 || x + size > width - 14 || y + size > height - 14) return;
    const swept = {
      left: x - .4 - Math.abs(normalX) * 8.5,
      top: y - .4 - Math.abs(normalY) * 8.5,
      right: x + size + .4 + Math.abs(normalX) * 8.5,
      bottom: y + size + .4 + Math.abs(normalY) * 8.5
    };
    for (const cell of cells.values()) {
      const other = cell.swept;
      if (swept.right + 4 > other.left && swept.left < other.right + 4 &&
          swept.bottom + 4 > other.top && swept.top < other.bottom + 4) return;
    }
    const key = `${x.toFixed(2)}:${y.toFixed(2)}`;
    if (cells.has(key)) return;
    const horizontal = Math.max(0, Math.min(1, (x + size / 2 - left) / imageWidth));
    const vertical = Math.max(0, Math.min(1, (y + size / 2 - top) / imageHeight));
    const perimeter = 2 * (imageWidth + imageHeight);
    const arc = normalY < 0 ? horizontal * imageWidth
      : normalX > 0 ? imageWidth + vertical * imageHeight
      : normalY > 0 ? imageWidth + imageHeight + (1 - horizontal) * imageWidth
      : 2 * imageWidth + imageHeight + (1 - vertical) * imageHeight;
    cells.set(key, {
      key, x, y, normalX, normalY, swept, cluster, position: arc / perimeter,
      delay: group % 7 * .022
    });
  };
  // Use the actual contained image, not the far edge of its 16:10 envelope.
  // Each edge has its own rhythm of clusters and empty space.
  const fragments = [
    [[.00, 5], [.36, 4], [.68, 5]],
    [[.04, 3], [.38, 3], [.73, 3]],
    [[.05, 4], [.35, 4], [.69, 5]],
    [[.06, 4], [.53, 4]]
  ];
  fragments.forEach((edge, side) => {
    const length = side % 2 ? imageHeight : imageWidth;
    const count = Math.max(2, Math.floor((length - size) / pitch) + 1);
    const startAt = (side % 2 ? top : left) + (length - (count - 1) * pitch - size) / 2;
    edge.forEach(([start, run], group) => {
      const from = Math.round(start * (count - 1));
      for (let offset = 0; offset < run && from + offset < count; offset++) {
        const along = startAt + (from + offset) * pitch;
        // Small stepped shoulders make each chain read as a shared contour
        // without forcing all four sides onto a ruler-straight rectangle.
        const shoulders = [[2, 0, -2, 1, 4], [-3, -3, 0, 3, 2], [0, 2, 5, 3, 0]];
        const stagger = shoulders[(side + group) % shoulders.length][offset];
        const band = side * 4 + group;
        if (side === 0) add(along, top - gap - size - stagger, 0, -1, band);
        if (side === 1) add(right + gap + stagger, along, 1, 0, band);
        if (side === 2) add(along, bottom + gap + stagger, 0, 1, band);
        if (side === 3) add(left - gap - size - stagger, along, -1, 0, band);
      }
    });
  });
  [[left - gap - size, top - gap - size, -1, -1],
    [right + gap, top - gap - size, 1, -1],
    [right + gap, bottom + gap, 1, 1],
    [left - gap - size, bottom + gap, -1, 1]]
    .forEach(([x, y, nx, ny], corner) => {
      add(x, y, nx, ny, corner + 16, true);
      if (corner === 0 || corner === 2) add(x + nx * pitch, y - ny * pitch, nx, 0, corner + 20, true);
    });
  // Two quiet satellites retain some looseness; longer chains do most of the
  // work. These share the same spacing guard as every other candidate.
  add(left - gap - size - 7, top + imageHeight * .46, -1, 0, 24);
  add(right + gap + 7, top + imageHeight * .77, 1, 0, 25);
  return [...cells.values()];
}

function PortfolioWorksPixelOutline({ project }) {
  const frame = i.useRef(null);
  const ratio = project.width / project.height;
  const initialHeight = Math.min(300.25, 514 / ratio);
  const [dimensions, setDimensions] = i.useState({ width: 666, height: 416.25, imageWidth: initialHeight * ratio, imageHeight: initialHeight });
  i.useEffect(() => {
    const element = frame.current;
    const image = element?.parentElement.querySelector("img");
    if (!element || !image) return;
    const measure = () => {
      const width = element.clientWidth, height = element.clientHeight;
      const imageWidth = image.clientWidth, imageHeight = image.clientHeight;
      if (!width || !height || !imageWidth || !imageHeight) return;
      setDimensions(previous => previous.width === width && previous.height === height && previous.imageWidth === imageWidth && previous.imageHeight === imageHeight
        ? previous : { width, height, imageWidth, imageHeight });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element); observer.observe(image); measure();
    return () => observer.disconnect();
  }, []);
  const cells = i.useMemo(() => portfolioWorksOutlineCells(dimensions.width, dimensions.height, dimensions.imageWidth, dimensions.imageHeight), [dimensions]);
  return e.jsx("span", {
    ref: frame, className: "works-pixel-outline", "aria-hidden": true, "data-visible": false,
    children: cells.map(cell => e.jsx("span", {
      className: "works-outline-cell", "data-cluster": cell.cluster, "data-arc": cell.position,
      style: {
        left: cell.x, top: cell.y,
        "--normal-x": cell.normalX, "--normal-y": cell.normalY,
        "--assemble-delay": cell.delay
      }
    }, cell.key))
  });
}

function PortfolioWorksVisual({ project, active, onPointerMove, resourceReady }) {
  return e.jsxs("a", {
    className: "works-visual", href: "/projects/" + project.id + "/", tabIndex: active ? 0 : -1,
    onClick: () => portfolioRememberProject(project.id),
    "aria-label": "查看" + project.title + "项目详情",
    onPointerMove: event => {
      onPointerMove?.(event);
      if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      event.currentTarget.style.setProperty("--hover-x", `${x * 2.4}deg`);
      event.currentTarget.style.setProperty("--hover-y", `${-y * 2.4}deg`);
      event.currentTarget.style.setProperty("--pointer-x", x);
      event.currentTarget.style.setProperty("--pointer-y", y);
    },
    onPointerLeave: event => { ["--hover-x", "--hover-y", "--pointer-x", "--pointer-y"].forEach(name => event.currentTarget.style.removeProperty(name)); },
    children: [
      e.jsx(PortfolioWorksPixelOutline, { project }),
      e.jsx("span", { className: "works-image-window", children: e.jsx("img", { ...portfolioWorksCoverSource(project, resourceReady), onError: event => portfolioWorksCoverFallback(event, project), alt: project.title + "主视觉", width: project.width, height: project.height, decoding: "async", draggable: false }) }),
      e.jsx("span", { className: "works-open", "aria-hidden": true, children: "查看项目 ↗" })
    ]
  });
}

function PortfolioWorksCoverCursor({ host }) {
  const cursor = i.useRef(null);
  i.useEffect(() => {
    const label = cursor.current, section = label?.closest(".portfolio-works");
    if (!section || !label) return;
    const desktop = window.matchMedia("(min-width: 901px) and (min-height: 621px) and (hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, checkFrame = 0, point = null, inside = false, image = null;
    let currentX = 0, currentY = 0, previousTime = 0;
    const hide = (clearPoint = false) => {
      if (clearPoint) point = null;
      inside = false;
      cancelAnimationFrame(frame); frame = 0; previousTime = 0;
      if (label.dataset.visible !== "false") label.dataset.visible = "false";
      delete document.documentElement.dataset.worksCoverCursor;
    };
    const draw = () => { label.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`; };
    const paint = time => {
      frame = 0;
      if (!inside || !point) return;
      // Frame-rate independent damping: a short, soft pursuit without overshoot.
      const delta = previousTime ? Math.min(64, time - previousTime) : 16.67;
      previousTime = time;
      const weight = reduced.matches ? 1 : 1 - Math.exp(-delta / 65);
      currentX += (point.x - currentX) * weight;
      currentY += (point.y - currentY) * weight;
      const settled = Math.hypot(point.x - currentX, point.y - currentY) < .1;
      if (settled) { currentX = point.x; currentY = point.y; }
      draw();
      if (!settled) frame = requestAnimationFrame(paint);
      else previousTime = 0;
    };
    const enter = () => {
      if (!inside) {
        inside = true;
        // Start at the actual entry point, not the previous project's position.
        currentX = point.x; currentY = point.y; previousTime = 0;
        draw();
        label.dataset.visible = "true";
        document.documentElement.dataset.worksCoverCursor = "true";
      }
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const hit = target => {
      if (!point || !desktop.matches || document.hidden || section.dataset.stageActive !== "true") return false;
      const nextImage = section.querySelector('.works-plane[data-active="true"] .works-visual img');
      image = nextImage;
      if (!image || !(target instanceof Element)) return false;
      if (target === image) return true;
      // Perspective + the plane's blur/mask can make Chromium hit the plane
      // itself instead of its visible image. Its rounded image area remains
      // the same hover surface; container margins and unrelated overlays do not.
      if (!image.closest(".works-plane").contains(target)) return false;
      const rect = image.getBoundingClientRect();
      const edgeX = Math.min(point.x - rect.left, rect.right - point.x);
      const edgeY = Math.min(point.y - rect.top, rect.bottom - point.y);
      if (edgeX < 0 || edgeY < 0) return false;
      const radius = parseFloat(getComputedStyle(image).borderTopLeftRadius) * rect.width / image.clientWidth;
      return edgeX >= radius || edgeY >= radius || Math.hypot(radius - edgeX, radius - edgeY) <= radius;
    };
    const move = event => {
      if (event.pointerType !== "mouse") return;
      point = { x: event.clientX, y: event.clientY };
      if (hit(event.target)) enter();
      else hide();
    };
    const check = () => {
      checkFrame = 0;
      if (point && hit(document.elementFromPoint(point.x, point.y))) enter();
      else hide();
    };
    const refresh = () => { if (!checkFrame) checkFrame = requestAnimationFrame(check); };
    const leave = () => { hide(true); };
    const visibility = () => { if (document.hidden) leave(); };
    let stage = section.dataset.stageActive, project = section.dataset.activeProject;
    const observer = new MutationObserver(() => {
      const nextStage = section.dataset.stageActive, nextProject = section.dataset.activeProject;
      if (nextStage === stage && nextProject === project) return;
      stage = nextStage; project = nextProject; refresh();
    });
    observer.observe(section, { attributes: true, attributeFilter: ["data-stage-active", "data-active-project"] });
    // Capture observes the real pointer before the card's Tilt updates its geometry.
    document.addEventListener("pointermove", move, { capture: true, passive: true });
    document.addEventListener("pointerover", move, { capture: true, passive: true });
    document.addEventListener("pointerleave", leave);
    document.addEventListener("pointercancel", leave);
    window.addEventListener("scroll", refresh, { capture: true, passive: true });
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", visibility);
    desktop.addEventListener("change", refresh);
    reduced.addEventListener("change", refresh);
    return () => {
      leave(); cancelAnimationFrame(checkFrame); observer.disconnect();
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerover", move, true);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("pointercancel", leave);
      window.removeEventListener("scroll", refresh, true);
      window.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", visibility);
      desktop.removeEventListener("change", refresh);
      reduced.removeEventListener("change", refresh);
    };
  }, [host]);
  return e.jsx("span", { ref: cursor, className: "works-cover-cursor", "data-visible": false, "aria-hidden": true,
    children: e.jsx("span", { className: "works-cover-cursor-content", children: "查看详情" }) });
}

function portfolioWorksDominantProject(boxes, focus, previous, fallback) {
  const areas = boxes.map(box => Math.max(0, Math.min(box.right, focus.right) - Math.max(box.left, focus.left)) *
    Math.max(0, Math.min(box.bottom, focus.bottom) - Math.max(box.top, focus.top)));
  const maximum = Math.max(...areas);
  if (!maximum) return { index: fallback, areas };
  const winner = areas.indexOf(maximum);
  // A close tie retains the current project, avoiding flicker at the midpoint.
  return { index: winner !== previous && maximum <= areas[previous] * 1.06 ? previous : winner, areas };
}

function PortfolioSelectedWorks() {
  const host = i.useRef(null);
  const container = worksScrollEnv.useContainerEl();
  const loading = worksLoadingGate.useHomeLoadingGate();
  const [resourceReady, setResourceReady] = i.useState(false);
  i.useLayoutEffect(() => {
    if (resourceReady || !host.current) return;
    let returning = location.hash === "#featured-projects" || !!window.__portfolioReturnPresentation;
    try { returning ||= !!sessionStorage.getItem("portfolio:works-return"); } catch {}
    if (returning) { setResourceReady(true); return; }
    const activate = () => {
      setResourceReady(true); observer?.disconnect();
      // Prepare the same silent PCM table before the stage, not during its first animation.
      portfolioWorksPrepareRhythm(new URL("/bgm.mp3", location.href).href).catch(() => {});
    };
    const intent = event => {
      const target = event.target?.closest?.('[data-portfolio-nav]');
      if (["projects", "featured-projects", "experience"].includes(target?.dataset.portfolioNav)) activate();
    };
    if (typeof IntersectionObserver === "undefined") { setResourceReady(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) activate();
    }, { rootMargin: `${Math.round(innerHeight)}px 0px` });
    observer.observe(host.current);
    document.addEventListener("pointerover", intent, { passive: true });
    document.addEventListener("focusin", intent);
    document.addEventListener("click", intent, { passive: true });
    return () => {
      observer.disconnect(); document.removeEventListener("pointerover", intent);
      document.removeEventListener("focusin", intent); document.removeEventListener("click", intent);
    };
  }, [resourceReady, loading]);
  const [active, setActive] = i.useState(0);
  const activeRef = i.useRef(0);
  const cancelSettle = i.useRef(null);
  const [mobile, setMobile] = i.useState(false);

  // Experience tags reveal a selected work in this document, without opening a detail route.
  i.useEffect(() => {
    const revealWork = event => {
      const index = portfolioSelectedProjects.findIndex(project => project.id === event.detail?.projectId);
      if (index < 0 || !host.current) return;
      setResourceReady(true);
      selectProject(index);
    };
    window.addEventListener("portfolio:select-work", revealWork);
    return () => window.removeEventListener("portfolio:select-work", revealWork);
  }, [container, mobile]);

  i.useEffect(() => {
    if (loading || !container || !host.current) return;
    const restoreReturn = () => {
      const back = performance.getEntriesByType("navigation")[0]?.type === "back_forward";
      const returnId = sessionStorage.getItem("portfolio:works-return") || (back ? sessionStorage.getItem("portfolio:works-last") : null);
      if (window.location.hash !== "#featured-projects" && !returnId) return;
      const index = Math.max(0, portfolioSelectedProjects.findIndex(project => project.id === returnId));
      const element = host.current;
      const narrow = window.matchMedia("(max-width: 900px), (max-height: 620px)").matches;
      const pinnedPhone = window.matchMedia("(min-width: 360px) and (max-width: 900px) and (min-height: 800px)").matches;
      const reading = narrow && !pinnedPhone;
      const target = reading && returnId ? element.querySelectorAll(".works-mobile-project")[index] : element;
      // Rectangles and scrollTop must come from the same presented DOM frame.
      // Retain fractional height: paint() uses rect.height, not offsetHeight.
      const top = container.scrollTop + target.getBoundingClientRect().top - container.getBoundingClientRect().top;
      const travel = reading ? 0 : element.getBoundingClientRect().height - worksScrollEnv.getViewportHeightPx();
      worksScrollEnv.lenisScrollTo(top + travel * index / portfolioWorksLastIndex - (reading ? 90 : 0), { immediate: true });
      sessionStorage.removeItem("portfolio:works-return");
    };
    restoreReturn();
    window.addEventListener("portfolio:history-return", restoreReturn);
    return () => window.removeEventListener("portfolio:history-return", restoreReturn);
  }, [loading, container]);

  i.useEffect(() => {
    const element = host.current;
    if (!element) return;
    const narrow = window.matchMedia("(max-width: 900px), (max-height: 620px)");
    const pinnedPhone = window.matchMedia("(min-width: 360px) and (max-width: 900px) and (min-height: 800px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scrollContainer = container || worksScrollEnv.getContainerEl() || window;
    let frame = 0;
    let inView = true;
    let progressNow = 0;
    let dominantNow = 0;
    let alignedImageHeight = 0;
    let gesturePending = false;
    let settleTimer = 0;
    let touchY = null;

    // Let native/Lenis scrolling move every plane continuously, then gently
    // settle the current gesture on a project. No wheel or touch is cancelled.
    const settle = () => {
      settleTimer = 0;
      const pending = gesturePending;
      gesturePending = false;
      element.dataset.worksSnapState = `settle:${pending}:${progressNow.toFixed(4)}:${dominantNow}`;
      if (!pending || reduced.matches || element.dataset.stageActive !== "true") return;
      const index = dominantNow;
      if (Math.abs(progressNow - index) * worksScrollEnv.getViewportHeightPx() < .5) return;
      // DOM rectangles and DOM scrollTop belong to the same rendered frame.
      // The Lenis snapshot may be ahead of that frame during deceleration.
      const top = (container ? container.scrollTop : window.scrollY) + element.getBoundingClientRect().top - (container?.getBoundingClientRect().top || 0);
      const destination = top + (element.offsetHeight - worksScrollEnv.getViewportHeightPx()) * index / portfolioWorksLastIndex;
      element.dataset.worksSnapTarget = destination.toFixed(3);
      worksScrollEnv.lenisScrollTo(destination, { duration: .8, onComplete: () => { element.dataset.worksSnapState = 'complete'; schedule(); } });
    };
    const intent = direction => {
      if (element.dataset.stageActive !== "true" || reduced.matches || !direction) return;
      gesturePending = true;
      element.dataset.worksSnapState = 'gesture';
      clearTimeout(settleTimer);
    };
    cancelSettle.current = () => { gesturePending = false; clearTimeout(settleTimer); };
    const projectOpen = () => cancelSettle.current?.();
    window.addEventListener('portfolio:project-open', projectOpen);
    const wheel = event => { if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) intent(Math.sign(event.deltaY)); };
    const touchStart = event => { touchY = event.touches.length === 1 ? event.touches[0].clientY : null; };
    const touchMove = event => {
      if (touchY === null || event.touches.length !== 1) return;
      const next = event.touches[0].clientY;
      if (Math.abs(next - touchY) > 10) { intent(Math.sign(touchY - next)); touchY = next; }
    };

    const paint = () => {
      frame = 0;
      const isMobile = narrow.matches;
      const isCompact = pinnedPhone.matches;
      const reading = isMobile && !isCompact;
      setMobile(previous => previous === reading ? previous : reading);
      let progress;
      if (reading) {
        const rect = element.getBoundingClientRect();
        element.dataset.stageActive = String(rect.top <= 110 && rect.bottom >= window.innerHeight);
        const line = window.innerHeight * .4;
        const rows = [...element.querySelectorAll(".works-mobile-project")];
        progress = rows.reduce((selected, row, index) => row.getBoundingClientRect().top <= line ? index : selected, 0);
        // Short screens keep all projects in the document, with a mild spatial
        // entrance on each cover instead of a clipped fixed stage.
        rows.forEach(row => {
          const rect = row.querySelector(".works-mobile-visual").getBoundingClientRect();
          const distance = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight));
          row.style.setProperty("--mobile-yaw", `${reduced.matches ? 0 : distance * -18}deg`);
          row.style.setProperty("--mobile-turn", `${reduced.matches ? 0 : distance * 5}deg`);
        });
      } else {
        const rect = element.getBoundingClientRect();
        const viewport = worksScrollEnv.getViewportHeightPx() || window.innerHeight;
        const containerTop = container?.getBoundingClientRect().top || 0;
        const travel = Math.max(1, rect.height - viewport);
        progress = Math.max(0, Math.min(portfolioWorksLastIndex, (containerTop - rect.top) / travel * portfolioWorksLastIndex));
        element.dataset.stageActive = String(rect.top <= containerTop + 1 && rect.bottom >= containerTop + viewport - 1);
        // All three columns use this same continuous scroll position.
        element.querySelectorAll(".works-plane").forEach((plane, index) => {
          const distance = index - progress;
          const depth = Math.min(1.8, Math.abs(distance));
          plane.style.setProperty("--plane-y", `${distance * viewport * (isCompact ? distance < 0 ? .54 : .64 : .49)}px`);
          // On phones, neighboring covers stay in the corners and clear the
          // fixed wordmark/menu instead of crossing the metadata.
          plane.style.setProperty("--plane-x", `${reduced.matches ? 0 : -distance * window.innerWidth * (isCompact ? distance < 0 ? .60 : .38 : .055)}px`);
          plane.style.setProperty("--plane-z", `${reduced.matches ? 0 : -depth * 50}px`);
          plane.style.setProperty("--plane-scale", String(reduced.matches ? 1 : 1 + Math.min(1, depth) * .04));
          plane.style.setProperty("--plane-rotation", `${reduced.matches ? 0 : Math.min(1, depth) * 8}deg`);
          plane.style.setProperty("--plane-yaw", `${reduced.matches ? 0 : distance * -12}deg`);
          plane.style.setProperty("--plane-opacity", String(Math.max(.02, 1 - depth * .80)));
          plane.style.setProperty("--plane-blur", `${Math.min(1, depth) * 1.8}px`);
          plane.style.setProperty("--plane-brightness", String(1 - Math.min(1, depth) * .32));
          plane.style.setProperty("--plane-edge-alpha", String(1 - Math.min(1, depth)));
          plane.style.zIndex = String(10 - Math.round(depth * 3));
        });
        element.querySelectorAll(".works-copy-stack .works-copy, .works-right .works-description").forEach(copy => {
          const index = portfolioSelectedProjects.findIndex(project => project.id === copy.dataset.projectId);
          const distance = index - progress;
          copy.style.setProperty("--copy-y", `${distance * (isCompact ? 8 : 14)}px`);
          copy.style.setProperty("--copy-opacity", String(1 - Math.min(1, Math.abs(distance)) * .45));
        });
        element.style.setProperty("--works-progress", String(progress / portfolioWorksLastIndex));
      }
      progressNow = progress;
      let next = Math.max(0, Math.min(portfolioWorksLastIndex, Math.floor(progress + .5)));
      if (!reading) {
        const space = element.querySelector('.works-space').getBoundingClientRect();
        const visuals = [...element.querySelectorAll('.works-plane .works-visual')];
        const width = visuals[0].clientWidth, height = visuals[0].clientHeight;
        const centerX = space.left + space.width / 2, centerY = space.top + space.height * (isCompact ? .48 : .5);
        const focus = { left: centerX - width / 2, right: centerX + width / 2, top: centerY - height / 2, bottom: centerY + height / 2 };
        const dominance = portfolioWorksDominantProject(visuals.map(visual => visual.getBoundingClientRect()), focus, activeRef.current, next);
        next = dominance.index;
        element.dataset.worksDominance = dominance.areas.map(area => (area / (width * height)).toFixed(3)).join(',');
        // The title and summary share the current contained image's top edge;
        // the project entry shares its bottom edge, including taller covers.
        const imageHeight = visuals[next].querySelector('img').clientHeight;
        if (!isMobile && imageHeight && imageHeight !== alignedImageHeight) {
          alignedImageHeight = imageHeight;
          element.style.setProperty('--works-cover-height', `${imageHeight}px`);
        }
      }
      dominantNow = next;
      element.dataset.worksScrollProgress = progress.toFixed(4);
      element.dataset.activeProject = portfolioSelectedProjects[next].id;
      if (next !== activeRef.current) {
        activeRef.current = next;
        setActive(next);
      }
    };
    const schedule = () => { if (inView && !frame) frame = requestAnimationFrame(paint); };
    const scroll = () => {
      schedule();
      clearTimeout(settleTimer);
      if (gesturePending) settleTimer = setTimeout(settle, 240);
    };
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (inView) schedule();
    }, { root: container || null, rootMargin: "100px" });
    observer.observe(element);
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    if (container) resize.observe(container);
    scrollContainer.addEventListener("scroll", scroll, { passive: true });
    scrollContainer.addEventListener("wheel", wheel, { passive: true });
    scrollContainer.addEventListener("touchstart", touchStart, { passive: true });
    scrollContainer.addEventListener("touchmove", touchMove, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    narrow.addEventListener("change", schedule);
    pinnedPhone.addEventListener("change", schedule);
    reduced.addEventListener("change", schedule);
    paint();
    return () => {
      element.dataset.worksSnapState = 'cleanup';
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      cancelSettle.current = null;
      window.removeEventListener('portfolio:project-open', projectOpen);
      delete element.dataset.stageActive;
      observer.disconnect(); resize.disconnect();
      scrollContainer.removeEventListener("scroll", scroll);
      scrollContainer.removeEventListener("wheel", wheel);
      scrollContainer.removeEventListener("touchstart", touchStart);
      scrollContainer.removeEventListener("touchmove", touchMove);
      window.removeEventListener("resize", schedule);
      narrow.removeEventListener("change", schedule);
      pinnedPhone.removeEventListener("change", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, [container]);

  function selectProject(index) {
    cancelSettle.current?.();
    const element = host.current;
    if (mobile) {
      worksScrollEnv.lenisScrollTo(element.querySelectorAll(".works-mobile-project")[index], { offset: -80 });
      return;
    }
    const top = (container ? container.scrollTop : window.scrollY) + element.getBoundingClientRect().top - (container?.getBoundingClientRect().top || 0);
    const travel = element.offsetHeight - worksScrollEnv.getViewportHeightPx();
    worksScrollEnv.lenisScrollTo(top + travel * index / portfolioWorksLastIndex, {
      immediate: window.matchMedia("(prefers-reduced-motion: reduce)").matches
    });
  }

  function tilt(event) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--hover-x", `${(event.clientX - rect.left) / rect.width * 6 - 3}deg`);
    event.currentTarget.style.setProperty("--hover-y", `${3 - (event.clientY - rect.top) / rect.height * 6}deg`);
  }

  return e.jsxs("article", {
    ref: host, id: "featured-projects", className: "portfolio-works", "aria-labelledby": "selected-works-title",
    "data-active-project": portfolioSelectedProjects[active].id,
    children: [
      e.jsx(PortfolioWorksRhythm, { host }),
      e.jsxs("div", { className: "works-stage", children: [
        e.jsxs("div", { className: "works-heading", children: [
          e.jsxs("div", { children: [e.jsx("h2", { id: "selected-works-title", children: "精选项目" }), e.jsx("span", { lang: "en", children: "SELECTED WORKS" })] })
        ] }),
        e.jsxs("div", { className: "works-columns", children: [
          e.jsxs("div", { className: "works-left", children: [
            e.jsx("div", { className: "works-copy-stack", children: portfolioSelectedProjects.map((project, index) => e.jsx(PortfolioWorksCopy, { project, index, active: active === index }, project.id)) }),
            e.jsxs("div", { className: "works-index", children: [
              e.jsx("span", { className: "works-current", children: String(active + 1).padStart(2, "0") }),
              e.jsx("span", { className: "works-total", children: "/ " + portfolioWorksTotal }),
              e.jsx("nav", { className: "works-select", "aria-label": "选择精选项目", children: portfolioSelectedProjects.map((project, index) => e.jsx("button", {
                type: "button", "aria-label": project.shortTitle, "aria-current": index === active ? "step" : undefined,
                onClick: () => selectProject(index), children: String(index + 1).padStart(2, "0")
              }, project.id)) })
            ] })
          ] }),
          e.jsxs("div", { className: "works-space", children: [
            e.jsx("div", { className: "works-deck", children: portfolioSelectedProjects.map((project, index) => e.jsx("div", {
              className: "works-plane", "data-project-id": project.id, "data-active": active === index, "aria-hidden": active !== index,
              style: { "--plane-y": `${index * 49}dvh`, "--plane-x": `${-index * 5.5}vw`, "--plane-z": `${-index * 50}px`, "--plane-scale": 1, "--plane-rotation": index === 0 ? "0deg" : "8deg", "--plane-yaw": `${index * -12}deg`, "--plane-opacity": index === 0 ? 1 : .2, "--plane-blur": index === 0 ? "0px" : "1.8px", "--plane-brightness": index === 0 ? 1 : .68, "--plane-edge-alpha": index === 0 ? 1 : 0 },
              children: e.jsx(PortfolioWorksVisual, { project, active: active === index, onPointerMove: tilt, resourceReady })
            }, project.id)) })
          ] }),
          e.jsx("div", { className: "works-right", children: portfolioSelectedProjects.map((project, index) => e.jsx(PortfolioWorksDescription, { project, active: active === index }, project.id)) })
        ] }),
        e.jsx(PortfolioWorksCoverCursor, { host, active }),
        e.jsxs("div", { className: "works-scroll-cue", "aria-hidden": true, children: [e.jsx("span", { children: "SCROLL TO EXPLORE" }), e.jsx("span", { children: "↓" }), e.jsx("span", { className: "works-progress" })] })
      ] }),
      e.jsx("div", { className: "works-mobile-list", children: portfolioSelectedProjects.map((project, index) => e.jsxs("section", {
        className: "works-mobile-project", "aria-label": project.title, children: [
          e.jsx(PortfolioWorksCopy, { project, index, active: true }),
          e.jsx("a", { className: "works-mobile-visual", href: "/projects/" + project.id + "/", onClick: () => portfolioRememberProject(project.id), "aria-label": "查看" + project.title + "项目详情", children: e.jsx("img", { ...portfolioWorksCoverSource(project, resourceReady), onError: event => portfolioWorksCoverFallback(event, project), alt: project.title + "主视觉", width: project.width, height: project.height, loading: "lazy", decoding: "async" }) }),
          e.jsx(PortfolioWorksDescription, { project, active: true })
        ]
      }, project.id)) })
    ]
  });
}

function PortfolioWorksSection({ onImagesChange }) {
  i.useEffect(() => { onImagesChange?.([]); return () => onImagesChange?.([]); }, [onImagesChange]);
  return e.jsx("section", { id: "selected-work", className: "px-4 lg:px-14 py-18 lg:py-24 w-full", children:
    e.jsxs("div", { className: "grid grid-cols-12 w-full", style: { rowGap: "0px" }, children: [e.jsx(PortfolioWorkExperience, {}), e.jsx(PortfolioSelectedWorks, {})] })
  });
}
