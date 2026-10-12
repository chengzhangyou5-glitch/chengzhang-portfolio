// Uses the captured page's existing React (i), scroll environment (g), and scroll hooks (A).
// No extra animation loop or scrolling engine is introduced.
function PortfolioMenuSoundToggle({ className }) {
  const { soundEnabled, setSoundEnabled } = S.useShellMedia();
  const [activated, setActivated] = i.useState(false);
  return e.jsx("button", {
    type: "button", className: className + " portfolio-menu-control normal-case",
    "aria-label": soundEnabled ? "声音：开启，点击关闭" : "声音：关闭，点击开启",
    "aria-pressed": soundEnabled,
    onClick: () => { setActivated(true); setSoundEnabled(!soundEnabled); },
    children: e.jsx(c.default, { text: soundEnabled ? "声音：开启" : "声音：关闭", startDelayMs: activated ? 100 : 300, letterDelayMs: 80, scrambleColors: false }, soundEnabled ? "sound-on" : "sound-off")
  });
}

function usePortfolioMenuKeyboard(open, setOpen) {
  i.useEffect(() => {
    if (!open) return;
    const close = event => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      document.querySelector(".portfolio-menu-trigger")?.focus();
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open, setOpen]);
}

function portfolioNavigationTarget(anchor) {
  if (anchor !== "#featured-projects") return anchor;
  return document.querySelector("#selected-work > .grid > article") || "#selected-work";
}

function usePortfolioNavigationSection(pathname, width, height) {
  const scrollTop = A.useScrollTopPx();
  const container = g.scrollEnv.useContainerEl();
  const [active, setActive] = i.useState(null);

  const update = i.useCallback(() => {
    if (pathname !== "/") {
      setActive(previous => previous === null ? previous : null);
      return;
    }
    const viewportTop = container?.getBoundingClientRect().top || 0;
    const readingLine = viewportTop + g.scrollEnv.getViewportHeightPx() * 0.35;
    const markers = [
      ["about", document.querySelector("#about")],
      ["experience", document.querySelector("#work-experience")],
      ["projects", document.querySelector("#selected-work > .grid > article")],
      ["contact", document.querySelector("#contact")]
    ].filter(([, element]) => element)
      .map(([name, element]) => {
        const { top, bottom } = element.getBoundingClientRect();
        return { name, top, bottom };
      })
      .sort((first, second) => first.top - second.top);
    let next = null;
    for (const marker of markers) {
      if (marker.top <= readingLine) {
        // The tunnel/personal world is outside the four navigation destinations.
        next = marker.name === "projects" && marker.bottom <= readingLine ? null : marker.name;
      }
    }
    setActive(previous => previous === next ? previous : next);
  }, [pathname, container]);

  i.useEffect(update, [update, scrollTop, width, height]);
  i.useEffect(() => {
    const observer = new ResizeObserver(update);
    for (const selector of ["#about", "#selected-work", "#contact"]) {
      const element = document.querySelector(selector);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [update]);

  return active;
}
