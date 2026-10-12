// Uses the page's existing JSX runtime (s) and React (u).
const portfolioAboutPortrait = { src: "/img/portrait-gray.png", width: 1246, height: 1578 };
const portfolioAboutCopy = {
  name: "游承樟",
  school: "福州大学 · 211",
  focus: "UI/UX & 产品设计 & AIGC",
  introduction: [
    "拥有3年设计实践经验，参与过C端、B端产品、运营设计及AIGC相关项目。",
    "持续关注AI前沿，探索AI在设计流程中的应用。"
  ]
};

const portfolioAboutSkills = [
  { label: "UI/UX", icon: "brush" },
  { label: "产品设计", icon: "cube" },
  { label: "用户研究", icon: "users" },
  { label: "C端 / B端", icon: "devices" },
  { label: "AIGC", icon: "sparkles" },
  { label: "Vibe Coding", icon: "code" },
  { label: "AI工作流", icon: "sitemap" }
];

function PortfolioAbout({ portraitRef, lenis } = {}) {
  const sectionRef = u.useRef(null);
  const skillsRef = u.useRef(null);
  const trackRef = u.useRef(null);

  u.useEffect(() => {
    const section = sectionRef.current;
    const skills = skillsRef.current;
    const track = trackRef.current;
    if (!section || !skills || !track) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scrollContainer = sW.scrollEnv.getContainerEl() || null;
    const scrollTarget = scrollContainer || window;
    const readScroll = () => lenis?.animatedScroll ?? sW.scrollEnv.getScrollTopPx();
    let visible = false;
    let active = false;
    let groupWidth = 1;
    let sectionTop = 0;
    let travelScale = .9;
    let position = 0;
    let target = 0;
    let frame = 0;
    let previousTime = 0;

    function paint() {
      // Both copies share the same wave phase; wrapping one group is visually identical.
      const offset = ((position % groupWidth) + groupWidth) % groupWidth;
      track.style.transform = `translate3d(${(-offset).toFixed(3)}px, 0, 0)`;
    }

    function tick(time) {
      frame = 0;
      if (!active) return;
      const elapsed = previousTime ? Math.max(0, time - previousTime) : 16.7;
      previousTime = time;
      position += (target - position) * (1 - Math.exp(-elapsed / 100));
      if (Math.abs(target - position) < .02) position = target;
      paint();
      if (position !== target) frame = requestAnimationFrame(tick);
      else previousTime = 0;
    }

    function onScroll() {
      if (!active) return;
      target = (readScroll() - sectionTop) * travelScale + groupWidth / (portfolioAboutSkills.length * 2);
      if (!frame && Math.abs(target - position) >= .02) frame = requestAnimationFrame(tick);
    }

    function measure() {
      // Layout reads happen only on entry/resize, never inside the animation frame.
      groupWidth = Math.max(1, track.firstElementChild.getBoundingClientRect().width);
      sectionTop = section.getBoundingClientRect().top + readScroll();
      travelScale = window.innerWidth < 768 ? .6 : .9;
      position = target = (readScroll() - sectionTop) * travelScale + groupWidth / (portfolioAboutSkills.length * 2);
      if (reducedMotion.matches) position = target = 0;
      paint();
    }

    function updateActivity() {
      active = visible && !reducedMotion.matches && !document.hidden;
      section.dataset.motionActive = String(active);
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      if (active || reducedMotion.matches) measure();
    }

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateActivity();
    }, { root: scrollContainer, rootMargin: "80px" });
    const resizeObserver = new ResizeObserver(measure);
    visibilityObserver.observe(skills);
    resizeObserver.observe(skills);
    const unsubscribe = lenis?.on("scroll", onScroll);
    if (!lenis) scrollTarget.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", updateActivity);
    reducedMotion.addEventListener("change", updateActivity);
    measure();

    return () => {
      cancelAnimationFrame(frame);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      scrollTarget.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", updateActivity);
      reducedMotion.removeEventListener("change", updateActivity);
      if (typeof unsubscribe === "function") unsubscribe();
      else lenis?.off("scroll", onScroll);
    };
  }, [lenis]);

  return s.jsxs("section", {
    id: "about",
    className: "portfolio-about",
    ref: sectionRef,
    "aria-labelledby": "about-name",
    "data-motion-active": "false",
    children: [
      s.jsxs("div", {
        className: "about-main",
        children: [
          s.jsx("figure", {
            className: "about-photo",
            children: s.jsx("div", {
              className: "portfolio-portrait",
              ref: portraitRef,
              role: "img",
              "aria-label": "游承樟的照片",
              "data-photo-src": portfolioAboutPortrait.src
            })
          }),
          s.jsxs("div", {
            className: "about-information",
            children: [
              s.jsx("img", {
                className: "about-name-art",
                src: "/assets/about/YOUCHENGZHANGZ.svg",
                width: 1441,
                height: 781,
                alt: "",
                "aria-hidden": true,
                draggable: false,
                decoding: "async",
                loading: "lazy"
              }),
              s.jsx("h2", { id: "about-name", className: "about-name", children: portfolioAboutCopy.name }),
              s.jsx("p", { className: "about-school", children: portfolioAboutCopy.school }),
              s.jsx("p", { className: "about-focus", children: portfolioAboutCopy.focus }),
              s.jsx("div", {
                className: "about-introduction",
                children: portfolioAboutCopy.introduction.map((line, index) => s.jsx("p", { children: line }, index))
              })
            ]
          })
        ]
      }),
      s.jsx("div", {
        className: "about-skills",
        ref: skillsRef,
        role: "region",
        "aria-label": "设计能力与个人特质",
        style: { "--about-skill-count": portfolioAboutSkills.length },
        children: s.jsx("div", {
          className: "about-skill-track",
          ref: trackRef,
          children: [0, 1].map(copy => s.jsx("ul", {
            className: "about-skill-group",
            "aria-hidden": copy === 1,
            children: portfolioAboutSkills.map((skill, index) => s.jsxs("li", {
              className: "about-skill-item",
              style: { "--about-wave-delay": `${(-index * 6.8 / portfolioAboutSkills.length).toFixed(3)}s` },
              children: [
                s.jsx("span", {
                  className: "about-skill-orb",
                  "aria-hidden": true,
                  children: s.jsx("svg", {
                    viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75,
                    strokeLinecap: "round", strokeLinejoin: "round",
                    children: s.jsx("use", { href: `/assets/icons/about-tabler.svg#${skill.icon}` })
                  })
                }),
                s.jsx("span", { className: "about-skill-label", children: skill.label })
              ]
            }, skill.label))
          }, copy))
        })
      })
    ]
  });
}
