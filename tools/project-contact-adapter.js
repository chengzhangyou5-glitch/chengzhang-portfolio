// These callbacks adapt the existing component to either scroll host. Its
// dialog, copies, downloads, backdrop/ESC and close animation stay unchanged.
const contactScrollEnv = {
  getContainerEl: () => window.__portfolioProjectContactScrollEnv?.getContainerEl() || document.scrollingElement,
  getScrollTopPx: () => window.__portfolioProjectContactScrollEnv?.getScrollTopPx() ?? scrollY,
  lenisScrollTo(top, options) {
    if (window.__portfolioProjectContactScrollEnv) window.__portfolioProjectContactScrollEnv.lenisScrollTo(top, options);
    else scrollTo({ top, behavior: 'instant' });
  }
};
let host, trigger;
const Contact = i.forwardRef(PortfolioContact);
export function openProjectContact(button) {
  trigger = button;
  if (!host) {
    host = document.createElement('div');
    host.className = 'project-contact-host';
    document.body.appendChild(host);
    flushSync(() => createRoot(host).render(e.jsx(Contact, {})));
    host.querySelector('dialog').addEventListener('close', () => {
      requestAnimationFrame(() => trigger?.isConnected && trigger.focus({ preventScroll: true }));
    });
  }
  host.querySelector('.contact-connect-trigger').click();
}
