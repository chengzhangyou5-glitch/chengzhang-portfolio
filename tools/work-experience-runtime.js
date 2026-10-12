// Uses the captured page's existing JSX runtime (e) and React (i).
// Dates retain the year-level precision from the supplied resume.
// Verified project routes are explicit; unconfigured entries retain Stage A disabled states.
const portfolioExperienceItems = [
  {
    number: "01", company: "中国电子云计算技术有限公司", role: "UI 设计师", period: "2025–2026",
    work: "参与产品 UI 设计迭代，负责页面优化与体验走查。",
    output: "完善组件规范、Icon 体系及产品视觉规范；负责 Loading、AI 生成等待等交互动效，推动官网视觉迭代。",
    projects: []
  },
  {
    number: "02", company: "浙江飞猪网络技术有限公司", role: "AIGC 设计师", period: "2025",
    work: "参与活动运营视觉设计，负责活动页面及品牌宣传物料设计。",
    output: "负责 KV、H5、海报等物料；参与视觉体系搭建与规范建设，结合 AI 制作 IP 形象及场景素材，优化生产流程。",
    projects: [
      { id: "aigc-design-efficiency", href: "/projects/aigc-design-efficiency/", title: "AIGC 设计提效项目" },
      { id: "fliggy-lele-run", href: "/projects/fliggy-lele-run/", title: "飞猪乐乐跑运营活动" }
    ]
  },
  {
    number: "03", company: "广东乐心医疗电子股份有限公司", role: "UX 设计师", period: "2024–2025",
    work: "参与健康类 APP 的 UI/UX 迭代，负责用户体验分析、交互设计及高保真界面设计。",
    output: "推进首页、运动、健康数据等核心模块优化，完善信息架构、组件规范、图标体系及数据可视化。",
    projects: [{ id: "lexin-health-app", href: "/projects/lexin-health-app/", title: "乐心健康 APP 迭代升级项目" }]
  }
];

function PortfolioWorkExperience() {
  const [expanded, setExpanded] = i.useState(null);
  const interaction = i.useRef("pointer");
  const canHover = () => window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)").matches;

  function enter(event, number) {
    if (event.pointerType !== "mouse" || !canHover()) return;
    interaction.current = "pointer";
    setExpanded(number);
  }

  function leave(event, number) {
    if (event.pointerType !== "mouse" || !canHover() || interaction.current !== "pointer") return;
    setExpanded(current => current === number ? null : current);
  }

  function activate(event, number) {
    if (canHover() && event.detail !== 0) return;
    interaction.current = event.detail === 0 ? "keyboard" : "touch";
    setExpanded(current => current === number ? null : number);
  }

  return e.jsxs("section", {
    id: "work-experience",
    className: "portfolio-experience",
    "aria-labelledby": "work-experience-title",
    children: [
      e.jsxs("div", {
        className: "experience-heading",
        children: [
          e.jsxs("div", {
            className: "experience-title-group",
            children: [
              e.jsx("h2", { id: "work-experience-title", children: "工作经历" }),
              e.jsx("span", { className: "experience-eyebrow experience-en", lang: "en", children: "WORK EXPERIENCE" })
            ]
          }),
          e.jsx("span", { className: "experience-index experience-en", children: "EXPERIENCE / 01 — 03" })
        ]
      }),
      e.jsx("div", {
        className: "experience-list",
        children: portfolioExperienceItems.map(item => {
          const isExpanded = expanded === item.number;
          const triggerId = "experience-trigger-" + item.number;
          const panelId = "experience-panel-" + item.number;
          return e.jsxs("article", {
            className: "experience-item",
            "data-expanded": isExpanded,
            onPointerEnter: event => enter(event, item.number),
            onPointerLeave: event => leave(event, item.number),
            onFocusCapture: event => {
              if (event.target.matches(":focus-visible")) interaction.current = "keyboard";
            },
            onBlurCapture: event => {
              if (interaction.current === "keyboard" && !event.currentTarget.contains(event.relatedTarget)) {
                setExpanded(current => current === item.number ? null : current);
              }
            },
            onKeyDown: event => { if (event.key === "Escape") setExpanded(null); },
            children: [
              e.jsx("h3", {
                children: e.jsxs("button", {
                  id: triggerId, type: "button", className: "experience-trigger",
                  "aria-expanded": isExpanded, "aria-controls": panelId,
                  onClick: event => activate(event, item.number),
                  children: [
                    e.jsx("span", { className: "experience-number experience-en", children: item.number }),
                    e.jsx("span", { className: "experience-dash", "aria-hidden": true }),
                    e.jsx("span", {
                      className: "experience-company",
                      children: e.jsx("span", { className: "experience-company-text", children: item.company })
                    }),
                    e.jsxs("span", {
                      className: "experience-meta",
                      children: [
                        e.jsx("span", { children: item.role }),
                        e.jsx("span", { className: "experience-period experience-en", children: item.period })
                      ]
                    }),
                    e.jsx("svg", {
                      className: "experience-arrow", viewBox: "0 0 24 24", fill: "none",
                      stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round",
                      "aria-hidden": true,
                      children: e.jsx("use", { href: "/assets/icons/experience-tabler.svg#chevron-down" })
                    })
                  ]
                })
              }),
              e.jsx("div", {
                id: panelId, className: "experience-panel", role: "region",
                "aria-labelledby": triggerId, inert: !isExpanded,
                children: e.jsx("div", {
                  className: "experience-panel-clip",
                  children: e.jsxs("div", {
                    className: "experience-detail",
                    children: [
                      e.jsxs("dl", {
                        className: "experience-copy",
                        children: [
                          e.jsxs("div", { className: "experience-copy-row", children: [
                            e.jsx("dt", { children: "工作内容" }),
                            e.jsx("dd", { children: item.work })
                          ] }),
                          e.jsxs("div", { className: "experience-copy-row", children: [
                            e.jsx("dt", { children: "工作产出" }),
                            e.jsx("dd", { children: item.output })
                          ] })
                        ]
                      }),
                      item.projects.length > 0 ? e.jsx("div", {
                        className: "experience-projects",
                        children: item.projects.map(project => e.jsxs(project.href ? "a" : "button", {
                          type: project.href ? undefined : "button", className: "experience-project-tag",
                          href: project.href ? "#featured-projects" : undefined, disabled: !project.href,
                          onClick: event => {
                            if (!project.href || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                            event.preventDefault();
                            event.stopPropagation();
                            // Keep the expanded row stable while scrolling to the work.
                            interaction.current = "navigation";
                            window.dispatchEvent(new CustomEvent("portfolio:select-work", { detail: { projectId: project.id } }));
                          },
                          "aria-label": project.href ? `查看${project.title}` : undefined,
                          "data-project-id": project.id, "data-state": project.href ? "available" : "unavailable",
                          "aria-disabled": project.href ? undefined : true, title: project.href ? undefined : "项目入口暂不可用",
                          children: [
                            e.jsx("span", { children: project.title }),
                            project.href ? e.jsx("svg", {
                              viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75,
                              strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true,
                              children: e.jsx("use", { href: "/assets/icons/experience-tabler.svg#arrow-up-right" })
                            }) : e.jsx("span", { className: "experience-project-state", children: "暂不可用" })
                          ]
                        }, project.id))
                      }) : null
                    ]
                  })
                })
              })
            ]
          }, item.number);
        })
      })
    ]
  });
}
