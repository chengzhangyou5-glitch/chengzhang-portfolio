import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../tools/works-layout-runtime.js', import.meta.url), 'utf8');
function boot(width, height, storage = new Map()) {
  const listeners = new Map(), properties = new Map();
  const root = { dataset: {}, style: { setProperty: (k,v) => properties.set(k,v), removeProperty: k => properties.delete(k) } };
  const env = { innerWidth: width, innerHeight: height, document: { documentElement: root },
    sessionStorage: { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v) },
    Event: class { constructor(type) { this.type=type; } }, dispatchEvent() {},
    matchMedia: () => ({ matches: env.innerWidth <= 900 || env.innerHeight <= 620 }),
    addEventListener: (k,v) => listeners.set(k,v) };
  env.window = env; runInNewContext(source, env);
  return { env, root, storage, resize(w,h) { env.innerWidth=w; env.innerHeight=h; listeners.get('resize')(); } };
}
test('short and tall phone modes survive address-bar height cycles', () => {
  for (const [height,mode] of [[740,'list'],[844,'stage']]) {
    const page=boot(390,height);
    for (const next of [844,740,844,740]) { page.resize(390,next); assert.equal(page.root.dataset.worksPhoneMode,mode); }
  }
});
test('full detail navigation and returning at another height retain the tab decision', () => {
  for (const [start,end,mode] of [[740,844,'list'],[844,740,'stage']]) {
    const first=boot(390,start),returned=boot(390,end,first.storage);
    assert.equal(returned.root.dataset.worksPhoneMode,mode);
  }
});
test('width changes retain normal responsive behavior and restore the phone decision', () => {
  const page=boot(390,844); page.resize(1024,932);
  assert.equal(page.root.dataset.worksPhoneMode,undefined);assert.equal(page.env.__portfolioWorksLayout.get().reading,false);
  page.resize(844,390);assert.equal(page.root.dataset.worksPhoneMode,'list');
  page.resize(390,740);assert.equal(page.root.dataset.worksPhoneMode,'stage');
});
test('stage travel uses the real minimum-height geometry after shrinking', () => {
  const page=boot(390,844);page.resize(390,740);
  const host={querySelector:()=>({getBoundingClientRect:()=>({height:800})})};
  assert.equal(page.env.__portfolioWorksLayout.stageHeight(host,740),800);
});
