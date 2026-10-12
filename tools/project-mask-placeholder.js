// Same SSR shape as the original R3F entry canvas, without allocating a second
// WebGL renderer. It is used only while the project glass cover owns the entry.
function PortfolioProjectMaskPlaceholder() {
  return t.jsx('div', {
    style: { position: 'relative', width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'auto' },
    className: 'z-30 fixed inset-0 pointer-events-none',
    children: t.jsx('div', { style: { width: '100%', height: '100%' }, children: t.jsx('canvas', { style: { display: 'block' } }) })
  });
}
