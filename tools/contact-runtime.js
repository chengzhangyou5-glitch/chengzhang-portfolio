// Uses the existing page's JSX runtime (e) and React (i).
// Set a local asset URL in downloads when the final files are ready.
const portfolioContactData = {
  email: "3195467418@qq.com",
  city: "中国 · 重庆",
  phone: "+86 19923447274",
  wechat: "YCZZMAX",
  signature: "游承樟 © 2026",
  qrImage: "/assets/contact/wechat-qr.png",
  downloads: [
    { key: "resume", label: "下载简历", href: null, notice: "简历文件准备中" },
    { key: "portfolio", label: "下载作品集 PDF", href: null, notice: "作品集 PDF 准备中" }
  ]
};

function PortfolioContactIcon({ type, className = "" }) {
  const icons = {
    email: [e.jsx("rect", { x: 3, y: 5, width: 18, height: 14, rx: 2 }, "box"), e.jsx("path", { d: "m3 6 9 7 9-7" }, "flap")],
    city: [e.jsx("path", { d: "M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" }, "pin"), e.jsx("circle", { cx: 12, cy: 10, r: 2.5 }, "center")],
    phone: [e.jsx("path", { d: "M8.5 3H5a2 2 0 0 0-2 2c0 9 7 16 16 16a2 2 0 0 0 2-2v-3.5l-5-1.5-1.5 2c-3-1.3-5.2-3.5-6.5-6.5l2-1.5L8.5 3Z" }, "phone")],
    // Original Tabler Icons paths, kept locally with source and MIT license.
    wechat: [e.jsx("use", { href: "/assets/icons/contact-tabler.svg#brand-wechat" }, "brand")],
    resume: [e.jsx("use", { href: "/assets/icons/contact-tabler.svg#file-cv" }, "cv")],
    portfolio: [e.jsx("use", { href: "/assets/icons/contact-tabler.svg#files" }, "pages")],
    copy: [e.jsx("rect", { x: 9, y: 9, width: 11, height: 12, rx: 1.5 }, "front"), e.jsx("path", { d: "M6 16H4V3h11v3" }, "back")],
    check: [e.jsx("path", { d: "m5 12 4 4L19 6" }, "check")],
    file: [e.jsx("path", { d: "M14 2H5v20h14V7l-5-5Z M14 2v5h5 M8 12h8 M8 16h8" }, "file")],
    arrow: [e.jsx("path", { d: "M5 12h14m-5-5 5 5-5 5" }, "arrow")],
    download: [e.jsx("path", { d: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" }, "download")],
    close: [e.jsx("path", { d: "m6 6 12 12M18 6 6 18" }, "close")]
  };
  return e.jsxs("svg", {
    className: `contact-icon ${className}`,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    children: icons[type] || icons.file
  });
}

// Original supplied SVGs, copied intact into this worktree's local assets.
function PortfolioContactDoodle({ type }) {
  const assets = {
    "white-rays": [177, 177], "blue-star": [87, 87],
    "curved-arrow": [154, 129], "yellow-rays": [191, 172], "eyes": [93, 64]
  };
  const [width, height] = assets[type];
  return e.jsx("img", {
    className: `contact-connect-doodle contact-connect-doodle-${type}`,
    src: `./assets/contact/decor/${type}.svg`,
    alt: "", "aria-hidden": true, draggable: false,
    width, height, loading: "lazy", decoding: "async"
  });
}

function PortfolioContact(props, forwardedRef) {
  const [copied, setCopied] = i.useState(null);
  const [notice, setNotice] = i.useState("");
  const [isOpen, setIsOpen] = i.useState(false);
  const [isClosing, setIsClosing] = i.useState(false);
  const dialogRef = i.useRef(null);
  const triggerRef = i.useRef(null);
  const backdropPointer = i.useRef(false);
  const closeTimer = i.useRef(null);
  const copyTimer = i.useRef(null);
  const noticeTimer = i.useRef(null);
  i.useEffect(() => () => {
    clearTimeout(copyTimer.current);
    clearTimeout(noticeTimer.current);
    clearTimeout(closeTimer.current);
  }, []);

  i.useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const container = contactScrollEnv.getContainerEl();
    const scrollTop = contactScrollEnv.getScrollTopPx();
    const overflow = container?.style.getPropertyValue("overflow");
    const overflowPriority = container?.style.getPropertyPriority("overflow");
    // Finish any in-flight smooth scroll using the existing scroll engine.
    contactScrollEnv.lenisScrollTo(scrollTop, { immediate: true });
    container?.style.setProperty("overflow", "hidden");
    dialog.scrollTop = 0;
    dialog.showModal();
    const preventBackgroundScroll = event => {
      if (!dialog.contains(event.target) || event.target === dialog) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("wheel", preventBackgroundScroll, { capture: true, passive: false });
    window.addEventListener("touchmove", preventBackgroundScroll, { capture: true, passive: false });
    return () => {
      window.removeEventListener("wheel", preventBackgroundScroll, true);
      window.removeEventListener("touchmove", preventBackgroundScroll, true);
      if (dialog.open) dialog.close();
      if (overflow) container?.style.setProperty("overflow", overflow, overflowPriority);
      else container?.style.removeProperty("overflow");
      contactScrollEnv.lenisScrollTo(scrollTop, { immediate: true });
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  function openContact() {
    clearTimeout(closeTimer.current);
    clearTimeout(copyTimer.current);
    clearTimeout(noticeTimer.current);
    setCopied(null);
    setNotice("");
    setIsClosing(false);
    setIsOpen(true);
  }

  function closeContact() {
    if (isClosing) return;
    setIsClosing(true);
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180;
    closeTimer.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, duration);
  }

  function isBackdrop(event) {
    if (event.target !== event.currentTarget) return false;
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }

  function handleDialogKeyDown(event) {
    // Keep the site's T/B scroll shortcuts out of this modal.
    event.stopPropagation();
    if (event.key !== "Tab") return;
    const controls = [...dialogRef.current.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  function showNotice(message) {
    clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = setTimeout(() => setNotice(""), 2400);
  }

  function showCopied(key) {
    clearTimeout(copyTimer.current);
    clearTimeout(noticeTimer.current);
    setNotice("");
    setCopied(key);
    copyTimer.current = setTimeout(() => setCopied(null), 2400);
  }

  function copyFallback(value) {
    const active = document.activeElement;
    const field = document.createElement("textarea");
    field.value = value;
    field.readOnly = true;
    field.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    // A modal dialog makes the rest of the document inert, including body children.
    (dialogRef.current?.open ? dialogRef.current : document.body).appendChild(field);
    field.select();
    field.setSelectionRange(0, value.length);
    const success = document.execCommand("copy");
    field.remove();
    active?.focus?.({ preventScroll: true });
    return success;
  }

  async function copyContact(value, key) {
    let success = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        success = true;
      }
    } catch { /* Try the browser's legacy copy action within the same click. */ }
    if (!success) {
      try { success = copyFallback(value); } catch { success = false; }
    }
    if (success) showCopied(key);
    else {
      clearTimeout(copyTimer.current);
      setCopied(null);
      showNotice("暂未复制，请手动选择文字复制");
    }
  }

  const cards = [
    { key: "wechat", label: "微信", value: portfolioContactData.wechat, copy: true, latin: true },
    { key: "email", label: "电子邮箱", value: portfolioContactData.email, href: `mailto:${portfolioContactData.email}`, copy: true, latin: true },
    { key: "phone", label: "联系电话", value: portfolioContactData.phone, href: `tel:${portfolioContactData.phone.replace(/\s+/g, "")}`, copy: true, latin: true },
    { key: "city", label: "所在城市", value: portfolioContactData.city }
  ];

  return e.jsxs("footer", {
    id: "contact",
    ref: forwardedRef,
    className: "portfolio-contact",
    "aria-labelledby": "contact-heading",
    children: [
      e.jsxs("div", {
        className: "contact-profession",
        children: [
          e.jsx("span", { children: "Product &" }),
          e.jsx("span", { children: "AIGC UI/UX" })
        ]
      }),
      e.jsxs("div", {
        className: "contact-stage",
        children: [
          e.jsxs("h2", {
            id: "contact-heading",
            className: "contact-message contact-message-en",
            children: [
              e.jsx("span", { className: "contact-line contact-line-first", children: "LET'S BUILD" }),
              e.jsx("span", { className: "contact-line contact-line-second", children: "SOMETHING TOGETHER." })
            ]
          })
        ]
      }),
      e.jsx("div", {
        className: "contact-connect-action",
        children: e.jsxs("button", {
          type: "button",
          ref: triggerRef,
          className: "contact-connect-trigger",
          "aria-haspopup": "dialog",
          "aria-controls": "contact-connect-dialog",
          "aria-expanded": isOpen,
          onClick: openContact,
          children: [e.jsx("span", { children: "查看联系方式" }), e.jsx(PortfolioContactIcon, { type: "arrow" })]
        })
      }),
      e.jsx("div", {
        className: "contact-bottomline",
        children: e.jsx("small", { className: "contact-signature", children: portfolioContactData.signature })
      }),
      e.jsxs("dialog", {
        id: "contact-connect-dialog",
        ref: dialogRef,
        className: "contact-connect-dialog",
        "aria-labelledby": "contact-connect-heading",
        "aria-describedby": "contact-connect-description",
        "data-lenis-prevent": "",
        "data-closing": isClosing ? "true" : "false",
        onCancel: event => { event.preventDefault(); closeContact(); },
        onClose: () => { setIsOpen(false); setIsClosing(false); },
        onKeyDown: handleDialogKeyDown,
        onPointerDown: event => { backdropPointer.current = isBackdrop(event); },
        onClick: event => { if (backdropPointer.current && isBackdrop(event)) closeContact(); },
        children: [
          e.jsx("div", {
            className: "contact-connect-close-anchor",
            children: e.jsx("button", {
              type: "button",
              className: "contact-connect-close",
              "aria-label": "关闭联系面板",
              autoFocus: true,
              onClick: closeContact,
              children: e.jsx(PortfolioContactIcon, { type: "close" })
            })
          }),
          e.jsxs("div", {
            className: "contact-connect-header",
            children: [
              e.jsx("h2", {
                id: "contact-connect-heading",
                children: e.jsxs("span", {
                  className: "contact-connect-title",
                  children: ["LET'S CONNECT.", e.jsx(PortfolioContactDoodle, { type: "yellow-rays" })]
                })
              }),
              e.jsx("p", { id: "contact-connect-description", children: "如果你对我的作品、岗位机会或合作感兴趣，欢迎随时联系我。" })
            ]
          }),
          e.jsxs("div", {
            className: "contact-connect-content",
            children: [
              e.jsxs("figure", {
                className: "contact-connect-qr",
                children: [
                  e.jsxs("div", {
                    className: "contact-connect-qr-scene",
                    children: [
                      e.jsx("div", {
                        className: "contact-connect-qr-sticker",
                        children: e.jsx("img", { src: portfolioContactData.qrImage, alt: "游承樟的微信二维码", width: 800, height: 800, loading: "lazy", decoding: "async" })
                      }),
                      ...["white-rays", "eyes", "curved-arrow", "blue-star"].map(type => e.jsx(PortfolioContactDoodle, { type }, type))
                    ]
                  }),
                  e.jsxs("figcaption", {
                    children: [e.jsx("strong", { children: "扫码添加微信" }), e.jsx("span", { children: "欢迎随时交流" })]
                  })
                ]
              }),
              e.jsx("div", {
                className: "contact-connect-details",
                children: cards.map(card => e.jsxs("article", {
                  className: "contact-connect-row",
                  "data-contact": card.key,
                  children: [
                    e.jsx(PortfolioContactIcon, { type: card.key, className: "contact-connect-row-icon" }),
                    e.jsxs("dl", {
                      children: [
                        e.jsx("dt", { children: card.label }),
                        e.jsx("dd", {
                          className: card.latin ? "contact-connect-value contact-connect-value-en" : "contact-connect-value",
                          children: card.href ? e.jsx("a", {
                            href: card.href,
                            children: card.key === "email"
                              ? e.jsxs(i.Fragment, { children: [card.value.split("@")[0], e.jsx("wbr", {}), `@${card.value.split("@")[1]}`] })
                              : card.value
                          }) : e.jsx("span", { children: card.value })
                        })
                      ]
                    }),
                    card.copy && e.jsxs("button", {
                      type: "button",
                      className: "contact-connect-copy",
                      "aria-label": copied === card.key ? `${card.label}已复制` : `复制${card.label}`,
                      "aria-live": "polite",
                      "aria-atomic": true,
                      "data-copied": copied === card.key ? "true" : "false",
                      onClick: () => copyContact(card.value, card.key),
                      children: [e.jsx(PortfolioContactIcon, { type: copied === card.key ? "check" : "copy" }), e.jsx("span", { children: copied === card.key ? "已复制" : "复制" })]
                    })
                  ]
                }, card.key))
              })
            ]
          }),
          e.jsx("div", {
            className: "contact-connect-downloads",
            "aria-label": "下载资料",
            children: portfolioContactData.downloads.map(item => {
              const children = [
                e.jsx(PortfolioContactIcon, { type: item.key }, "icon"),
                e.jsx("span", { children: item.label }, "label"),
                e.jsx(PortfolioContactIcon, { type: "download", className: "contact-connect-download-arrow" }, "arrow")
              ];
              return item.href
                ? e.jsxs("a", { className: "contact-connect-download", href: item.href, download: true, children }, item.key)
                : e.jsxs("button", { type: "button", className: "contact-connect-download", onClick: () => showNotice(item.notice), children }, item.key);
            })
          }),
          e.jsx("div", { className: "contact-connect-notice", role: "status", "aria-live": "polite", "aria-atomic": true, children: notice })
        ]
      })
    ]
  });
}
