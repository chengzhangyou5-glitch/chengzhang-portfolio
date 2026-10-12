// Cross-document checkpoint of the real sticker simulation and GPU background.
// No screen capture, PNG, generated dots or foreground content is stored.
export const residueKey = 'portfolio:sticker-residue:v1';
const sources = new Map();
let state = null;
try { const value = JSON.parse(sessionStorage.getItem(residueKey) || 'null'); if (value?.version === 1 && value.stickers?.count > 0) state = value; } catch {}
const restored = new Set();
const subscribers = new Set();
const notify = () => subscribers.forEach(fn => fn());
export function getResidueState() { return state; }
export function registerResidueSource(name, capture) {
  sources.set(name, capture);
  return () => { if (sources.get(name) === capture) sources.delete(name); };
}
export function markResidueRestored(name) { restored.add(name); notify(); }
export function residueSceneReady() { return !state || ['stickers', 'background', 'mask'].every(name => restored.has(name)); }
export function onResidueRestored(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }
export function checkpointResidue() {
  // A detail reading surface must never replace the originating home simulation.
  if ((window.__portfolioEntryPath || location.pathname) !== '/') return state;
  try {
    const next = { version: 1, created: Date.now(), viewport: [innerWidth, innerHeight], theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' };
    for (const [name, capture] of sources) next[name] = capture();
    if (!next.stickers?.count || !next.background?.pixels || !next.mask) return state;
    // Publish only a complete checkpoint. A partial/loading scene keeps its last
    // valid checkpoint rather than clearing an already visible residue field.
    sessionStorage.setItem(residueKey, JSON.stringify(next));
    state = next;
    return state;
  } catch (error) { console.warn('Sticker residue checkpoint unavailable', error); return state; }
}
export function bytesToBase64(bytes) {
  let value = ''; for (let i = 0; i < bytes.length; i += 8192) value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value);
}
export function base64ToBytes(value) { return Uint8Array.from(atob(value), char => char.charCodeAt(0)); }

window.__portfolioStickerResidue = { getState: getResidueState, register: registerResidueSource, restored: markResidueRestored, sceneReady: residueSceneReady, checkpoint: checkpointResidue, encode: bytesToBase64, decode: base64ToBytes, ready: Promise.resolve() };
addEventListener('portfolio:project-open', checkpointResidue);
addEventListener('pagehide', checkpointResidue);
