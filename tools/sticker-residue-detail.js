import { getResidueState, base64ToBytes, onResidueRestored, residueSceneReady } from './sticker-residue-state.js';
import { ResiduePointerOverlay, pointerFragment, parallaxSettings } from './sticker-residue-motion.generated.js';
import { ResidueVector2, ResidueColor, cameraPosition, cameraView } from './sticker-residue-math.js';

// The three lightweight HTML details replay the originating GPU state with the
// original shaders/atlas. They do not mount the homepage or a second scroll app.
const path = window.__portfolioEntryPath || location.pathname;
const detail = /^\/projects\/(canvasflow-art-preview|aigc-design-efficiency|fliggy-lele-run|lexin-health-app)\/$/.test(path);
const api = window.__portfolioStickerResidue;
const saved = getResidueState();
if (detail && saved) {
  api.ready = new Promise(resolve => {
    if (path.includes('canvasflow-art-preview')) {
      const unsubscribe = onResidueRestored(() => {
        if (!residueSceneReady()) return;
        document.documentElement.dataset.stickerResidue = 'ready';
        unsubscribe(); resolve();
      });
      return;
    }
    const start = () => renderResidue(saved).then(() => {
      document.documentElement.dataset.stickerResidue = 'ready'; resolve();
    }).catch(error => { console.error('Sticker residue renderer failed', error); resolve(); });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
  });
}

const colorFunctions = `
vec4 sRGBTransferOETF(vec4 value) {
 return vec4(mix(pow(value.rgb,vec3(.41666))*1.055-vec3(.055),value.rgb*12.92,lessThanEqual(value.rgb,vec3(.0031308))),value.a);
}
vec4 sRGBTransferEOTF(vec4 value) {
 return vec4(mix(pow(value.rgb*.9478672986+vec3(.0521327014),vec3(2.4)),value.rgb*.0773993808,lessThanEqual(value.rgb,vec3(.04045))),value.a);
}
// Original scene passes blend in a linear offscreen buffer; convert only at the
// final screen pass, matching the homepage composer rather than sRGB blending.
vec4 linearToOutputTexel(vec4 value) { return value; }
`;
function program(gl, vertex, fragment) {
  const make = (type, source) => {
    source = source.replace(/#include <tonemapping_fragment>/g, '').replace(/#include <colorspace_fragment>/g, 'gl_FragColor=linearToOutputTexel(gl_FragColor);');
    if (type === gl.FRAGMENT_SHADER) source = 'precision highp float;\n' + colorFunctions + '\n' + source;
    if (type === gl.VERTEX_SHADER) source = 'precision highp float;\nattribute vec3 position;attribute vec2 uv;uniform mat4 projectionMatrix;uniform mat4 modelViewMatrix;\n' + (source.includes('instanceMatrix') ? 'attribute mat4 instanceMatrix;\n' : '') + source;
    source = '#version 300 es\n' + source.replace(/\battribute\b/g, 'in').replace(/\bvarying\b/g, type === gl.VERTEX_SHADER ? 'out' : 'in').replace(/\btexture2D\b/g, 'texture').replace(/\bgl_FragColor\b/g, 'residueColor');
    if (type === gl.FRAGMENT_SHADER) source = source.replace('precision highp float;', 'precision highp float;\nout vec4 residueColor;');
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };
  const p = gl.createProgram(), v = make(gl.VERTEX_SHADER, vertex), f = make(gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p); gl.deleteShader(v); gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const uniforms = new Map();
  for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) { const info = gl.getActiveUniform(p, i); uniforms.set(info.name.replace(/\[0\]$/, ''), { type: info.type, size: info.size, location: gl.getUniformLocation(p, info.name) }); }
  return { p, uniforms };
}
function uniform(gl, material, name, value) {
  const u = material.uniforms.get(name); if (!u) return;
  if (u.type === gl.FLOAT_MAT4) gl.uniformMatrix4fv(u.location, false, value);
  else if (u.type === gl.FLOAT_VEC4) gl.uniform4fv(u.location, value);
  else if (u.type === gl.FLOAT_VEC3) gl.uniform3fv(u.location, value);
  else if (u.type === gl.FLOAT_VEC2) gl.uniform2fv(u.location, value);
  else if (u.type === gl.FLOAT) { if (u.size > 1) gl.uniform1fv(u.location, value); else gl.uniform1f(u.location, value); }
  else gl.uniform1i(u.location, value);
}
function geometry(gl, material, values) {
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  for (const [name, data, size] of values) {
    const at = gl.getAttribLocation(material.p, name); if (at < 0) continue;
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, size, gl.FLOAT, false, 0, 0);
  }
  return vao;
}
function texture(gl, source, width, height, srgb = false) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (source instanceof Uint8Array) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
  else { gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, srgb ? gl.SRGB8_ALPHA8 : gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, source); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); }
  return t;
}
function multiply(a, b) {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) for (let row = 0; row < 4; row++) for (let k = 0; k < 4; k++) out[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
  return out;
}
function residueThemeUniforms(state) {
  const theme = window.PortfolioTheme?.getResolved();
  if (!theme || !state.theme || theme === state.theme) return null;
  const tokens = getComputedStyle(document.documentElement);
  const color = name => new ResidueColor(tokens.getPropertyValue(name).trim()).toArray();
  // Re-map only the captured background feedback field between its existing
  // background/vignette colors. Sticker atlas and project/PDF pixels are separate.
  const oldBg = color('--scene-' + state.theme + '-background'), oldEdge = color('--scene-' + state.theme + '-vignette');
  const newBg = color('--scene-background'), newEdge = color('--scene-vignette');
  const axis = oldBg.map((value, index) => value - oldEdge[index]);
  const length = Math.max(1e-9, axis.reduce((total, value) => total + value * value, 0));
  const input = base64ToBytes(state.background.pixels);
  for (let pixel = 0; pixel < input.length; pixel += 4) {
    const weight = Math.max(0, Math.min(1, axis.reduce((total, value, index) => total + (input[pixel + index] / 255 - oldEdge[index]) * value, 0) / length));
    for (let channel = 0; channel < 3; channel++) input[pixel + channel] = Math.round(255 * (newEdge[channel] + weight * (newBg[channel] - newEdge[channel])));
  }
  return {
    input,
    background: { uBgColor: newBg, uOutputColor: color('--scene-output'), uOutputMix: Number(tokens.getPropertyValue('--scene-output-mix')) },
    mask: { uColor: color('--scene-mask') }
  };
}
async function renderResidue(state) {
  const host = document.querySelector('.project-background'); if (!host) throw new Error('Project background layer missing');
  const canvas = document.createElement('canvas'); canvas.className = 'project-sticker-residue'; canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' });
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: true }); if (!gl) throw new Error('WebGL2 unavailable');
  const background = program(gl, state.background.vertex, state.background.fragment), mask = program(gl, state.mask.vertex, state.mask.fragment), stickers = program(gl, state.stickers.vertex, state.stickers.fragment);
  const positions = [-1,-1,0, 1,-1,0, -1,1,0, 1,1,0], uvs = [0,0,1,0,0,1,1,1];
  const bgQuad = geometry(gl, background, [['position', positions, 3], ['uv', uvs, 2]]), maskQuad = geometry(gl, mask, [['position', positions, 3], ['uv', uvs, 2]]), stickerQuad = geometry(gl, stickers, [['position', positions, 3], ['uv', uvs, 2]]);
  const input = texture(gl, base64ToBytes(state.background.pixels), state.background.width, state.background.height);
  const images = await Promise.all(state.stickers.images.map(src => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; })));
  const atlasCanvas = document.createElement('canvas'); [atlasCanvas.width, atlasCanvas.height] = state.stickers.atlasSize;
  const ctx = atlasCanvas.getContext('2d'), cols = Math.ceil(Math.sqrt(images.length)), cellW = Math.max(...images.map(i => i.width)) + 4, cellH = Math.max(...images.map(i => i.height)) + 4;
  images.forEach((image, i) => ctx.drawImage(image, i % cols * cellW + 2, Math.floor(i / cols) * cellH + 2));
  const atlas = texture(gl, atlasCanvas, 0, 0, true);
  const screen = program(gl, 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}', pointerFragment.replace('#include <colorspace_fragment>', 'gl_FragColor=sRGBTransferOETF(gl_FragColor);'));
  const screenQuad = geometry(gl, screen, [['position', positions, 3], ['uv', uvs, 2]]), linear = gl.createTexture(), framebuffer = gl.createFramebuffer();
  const pointerOverlay = new ResiduePointerOverlay(), pointer = new ResidueVector2(.5, .5);
  const eye = cameraPosition(state.stickers.view), target = [0, 0, 0], cameraZ = eye[2]; let view = state.stickers.view;
  let inside = false, frame = 0, lastTime = 0, motionFrames = 0, disposed = false, allocated = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)'), mobile = () => innerWidth < 1024;
  gl.bindVertexArray(stickerQuad);
  const matrixAt = gl.getAttribLocation(stickers.p, 'instanceMatrix'), uvAt = gl.getAttribLocation(stickers.p, 'uvRect');
  const matrixBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(state.stickers.matrices), gl.STATIC_DRAW);
  for (let col = 0; col < 4; col++) { gl.enableVertexAttribArray(matrixAt + col); gl.vertexAttribPointer(matrixAt + col, 4, gl.FLOAT, false, 64, col * 16); gl.vertexAttribDivisor(matrixAt + col, 1); }
  const uvBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(state.stickers.uvRects), gl.STATIC_DRAW); gl.enableVertexAttribArray(uvAt); gl.vertexAttribPointer(uvAt, 4, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(uvAt, 1);
  let themeUniforms = residueThemeUniforms(state);
  const updateInput = () => {
    gl.bindTexture(gl.TEXTURE_2D, input);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, state.background.width, state.background.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, themeUniforms?.input || base64ToBytes(state.background.pixels));
  };
  updateInput();
  const draw = () => {
    const ratio = Math.min(devicePixelRatio, 2), width = Math.round(innerWidth * ratio), height = Math.round(innerHeight * ratio);
    if (!allocated || canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height;
      gl.bindTexture(gl.TEXTURE_2D, linear); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      allocated = true;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    pointerOverlay.setDisplayMetrics(innerWidth, innerHeight, ratio); pointerOverlay.setResolution(canvas.width, canvas.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, linear, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('Residue framebuffer unavailable');
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
    gl.useProgram(background.p); gl.bindVertexArray(bgQuad); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, input);
    for (const [name, value] of Object.entries({ ...state.background.uniforms, ...themeUniforms?.background })) uniform(gl, background, name, name === 'uPortfolioGridReady' ? 0 : value);
    uniform(gl, background, 'tInput', 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(stickers.p); gl.bindVertexArray(stickerQuad); gl.bindTexture(gl.TEXTURE_2D, atlas); uniform(gl, stickers, 'map', 0);
    const projection = state.stickers.projection.slice(); projection[5] = projection[0] * innerWidth / innerHeight;
    uniform(gl, stickers, 'projectionMatrix', projection); uniform(gl, stickers, 'modelViewMatrix', multiply(view, state.stickers.model));
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, state.stickers.count);
    gl.useProgram(mask.p); gl.bindVertexArray(maskQuad);
    for (const [name, value] of Object.entries({ ...state.mask.uniforms, ...themeUniforms?.mask })) uniform(gl, mask, name, name === 'uPortfolioGridReady' ? 0 : name === 'uResolution' ? [innerWidth, innerHeight] : value);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.disable(gl.BLEND); gl.useProgram(screen.p); gl.bindVertexArray(screenQuad); gl.bindTexture(gl.TEXTURE_2D, linear); uniform(gl, screen, 'tDiffuse', 0);
    for (const [name, entry] of Object.entries(pointerOverlay.uniforms)) {
      const value = entry.value;
      uniform(gl, screen, name, Array.isArray(value) ? value.flatMap(v => v?.toArray ? v.toArray() : v) : value?.toArray ? value.toArray() : value);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (gl.getError() !== gl.NO_ERROR) throw new Error('Residue draw failed');
  };
  draw(); host.insertBefore(canvas, host.firstChild); host.querySelector('.project-background-pixels')?.setAttribute('hidden', '');
  // Same camera parallax and pixel-trail class/shader as CanvasFlow. Instance
  // matrices stay intact; moving the camera gives the frozen residue its motion.
  const tick = now => {
    frame = 0; if (disposed || document.hidden) return;
    const dt = Math.min((now - (lastTime || now - 16.667)) / 1000, .1); lastTime = now;
    const active = inside && !mobile() && !reduced.matches;
    // Keep the original trail. Only the actual side-navigation cursor replaces it.
    const cursorSuppressed = document.documentElement.hasAttribute('data-project-pdf-cursor');
    pointerOverlay.uniforms.uPointerOpacity.value = cursorSuppressed ? 0 : 1;
    pointerOverlay.updatePointer(pointer, active && !cursorSuppressed, dt);
    const p = parallaxSettings, desired = active && p.parallaxEnabled ? [(0.5 - pointer.x) * 2 * p.parallaxStrength, (0.5 - pointer.y) * 2 * p.parallaxStrength * .6] : [0, 0];
    const lag = active ? p.parallaxLag : p.leaveParallaxLag;
    for (let i = 0; i < 2; i++) { eye[i] += (desired[i] - eye[i]) * lag; target[i] += (-desired[i] * p.parallaxRotate - target[i]) * lag; }
    eye[2] = cameraZ; view = cameraView(eye, target); draw(); motionFrames++;
    api.detail.motion = { frames: motionFrames, eye: eye.slice(), trailCount: pointerOverlay.trailStrength.filter(n => n > .01).length, pointerActive: active };
    const settling = eye.some((n, i) => i < 2 && Math.abs(n - desired[i]) > 1e-5) || target.some((n, i) => i < 2 && Math.abs(n + desired[i] * p.parallaxRotate) > 1e-5);
    if (settling || pointerOverlay.trailStrength.slice(active ? 1 : 0, 14).some(n => n > .001)) wake();
  };
  const wake = () => { if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(tick); };
  const move = event => { if (event.pointerType === 'touch') return; inside = true; pointer.set(event.clientX / innerWidth, 1 - event.clientY / innerHeight); wake(); };
  const leave = () => { inside = false; pointer.set(.5, .5); wake(); };
  const resize = () => { draw(); wake(); };
  // The reading cursor is painted after pointer events; redraw on its state
  // change even when the pointer stops, or the last green frame could remain.
  const cursorObserver = new MutationObserver(() => {
    const hidden = document.documentElement.hasAttribute('data-project-pdf-cursor');
    pointerOverlay.uniforms.uPointerOpacity.value = hidden ? 0 : 1;
    if (hidden) pointerOverlay.trailStrength.fill(0);
    draw(); wake();
  });
  cursorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-project-pdf-cursor'] });
  const listeners = [[window, 'pointermove', move], [window, 'pointerdown', move], [window, 'pointerover', move], [window, 'blur', leave], [document, 'mouseleave', leave], [document, 'visibilitychange', leave], [window, 'resize', resize]];
  const unsubscribeTheme = window.PortfolioTheme?.subscribe(() => { themeUniforms = residueThemeUniforms(state); updateInput(); draw(); wake(); });
  for (const [host, type, listener] of listeners) host.addEventListener(type, listener, { capture: true, passive: true });
  addEventListener('pagehide', event => { cancelAnimationFrame(frame); frame = 0; lastTime = 0; if (!event.persisted) { disposed = true; cursorObserver.disconnect(); unsubscribeTheme?.(); for (const [host, type, listener] of listeners) host.removeEventListener(type, listener, true); } });
  addEventListener('pageshow', () => { inside = false; wake(); });
  api.detail = { canvas, count: state.stickers.count, created: state.created, source: 'live-gpu-checkpoint', interactive: true, motion: { frames: 0 } };
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  for (const part of ['stickers', 'background', 'mask']) api.restored(part);
}
