(() => {
  // tools/sticker-residue-state.js
  var residueKey = "portfolio:sticker-residue:v1";
  var sources = /* @__PURE__ */ new Map();
  var state = null;
  try {
    const value = JSON.parse(sessionStorage.getItem(residueKey) || "null");
    if (value?.version === 1 && value.stickers?.count > 0) state = value;
  } catch {
  }
  var restored = /* @__PURE__ */ new Set();
  var subscribers = /* @__PURE__ */ new Set();
  var notify = () => subscribers.forEach((fn) => fn());
  function getResidueState() {
    return state;
  }
  function registerResidueSource(name, capture) {
    sources.set(name, capture);
    return () => {
      if (sources.get(name) === capture) sources.delete(name);
    };
  }
  function markResidueRestored(name) {
    restored.add(name);
    notify();
  }
  function residueSceneReady() {
    return !state || ["stickers", "background", "mask"].every((name) => restored.has(name));
  }
  function onResidueRestored(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }
  function checkpointResidue() {
    if ((window.__portfolioEntryPath || location.pathname) !== "/") return state;
    try {
      const next = { version: 1, created: Date.now(), viewport: [innerWidth, innerHeight], theme: document.documentElement.classList.contains("dark") ? "dark" : "light" };
      for (const [name, capture] of sources) next[name] = capture();
      if (!next.stickers?.count || !next.background?.pixels || !next.mask) return state;
      sessionStorage.setItem(residueKey, JSON.stringify(next));
      state = next;
      return state;
    } catch (error) {
      console.warn("Sticker residue checkpoint unavailable", error);
      return state;
    }
  }
  function bytesToBase64(bytes) {
    let value = "";
    for (let i = 0; i < bytes.length; i += 8192) value += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(value);
  }
  function base64ToBytes(value) {
    return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  }
  window.__portfolioStickerResidue = { getState: getResidueState, register: registerResidueSource, restored: markResidueRestored, sceneReady: residueSceneReady, checkpoint: checkpointResidue, encode: bytesToBase64, decode: base64ToBytes, ready: Promise.resolve() };
  addEventListener("portfolio:project-open", checkpointResidue);
  addEventListener("pagehide", checkpointResidue);

  // tools/sticker-residue-math.js
  var ResidueVector2 = class {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
    set(x, y) {
      this.x = x;
      this.y = y;
      return this;
    }
    copy(value) {
      return this.set(value.x, value.y);
    }
    toArray() {
      return [this.x, this.y];
    }
  };
  var ResidueColor = class {
    constructor(value) {
      this.set(value);
    }
    set(value) {
      const hex = parseInt(value.replace("#", ""), 16);
      const linear = (n) => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
      this.r = linear((hex >> 16 & 255) / 255);
      this.g = linear((hex >> 8 & 255) / 255);
      this.b = linear((hex & 255) / 255);
      return this;
    }
    toArray() {
      return [this.r, this.g, this.b];
    }
  };
  var residueMath = { damp: (x, y, lambda, dt) => y + (x - y) * Math.exp(-lambda * dt) };
  function cameraPosition(view) {
    return [0, 1, 2].map((i) => -(view[i * 4] * view[12] + view[i * 4 + 1] * view[13] + view[i * 4 + 2] * view[14]));
  }
  function cameraView(eye, target) {
    let z = eye.map((n, i) => n - target[i]);
    const length = Math.hypot(...z) || 1;
    z = z.map((n) => n / length);
    const xLength = Math.hypot(z[2], z[0]) || 1, x = [z[2] / xLength, 0, -z[0] / xLength];
    const y = [z[1] * x[2], z[2] * x[0] - z[0] * x[2], -z[1] * x[0]];
    const dot = (a) => a.reduce((total, n, i) => total + n * eye[i], 0);
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x), -dot(y), -dot(z), 1];
  }

  // tools/sticker-residue-motion.generated.js
  var sy = { Vector2: ResidueVector2, Color: ResidueColor, MathUtils: residueMath };
  var cF = "#c0fe04";
  var cP = class {
    cssResolution = new sy.Vector2(1, 1);
    devicePixelRatio = 1;
    trail = Array.from({ length: 16 }, () => new sy.Vector2(0.5, 0.5));
    trailStrength = Array.from({ length: 16 }, () => 0);
    lastPointerCell = new sy.Vector2(-1, -1);
    pixelSize = 16;
    uniforms = { uTrail: { value: this.trail }, uTrailStrength: { value: this.trailStrength }, uTrailCount: { value: 14 }, uPointerColor: { value: new sy.Color(cF) }, uPointerOpacity: { value: 1 }, uPointerDotRadius: { value: 0.8 }, uPointerPixelSize: { value: this.pixelSize }, uResolution: { value: new sy.Vector2(1, 1) }, uDevicePixelRatio: { value: this.devicePixelRatio } };
    setColor(e10) {
      this.uniforms.uPointerColor.value.set(e10);
    }
    setPixelSize(e10) {
      this.pixelSize = e10, this.uniforms.uPointerPixelSize.value = e10;
    }
    setDisplayMetrics(e10, t10, r10) {
      this.cssResolution.set(Math.max(1, e10), Math.max(1, t10)), this.devicePixelRatio = Math.max(1, r10), this.uniforms.uDevicePixelRatio.value = this.devicePixelRatio;
    }
    setResolution(e10, t10) {
      this.uniforms.uResolution.value.set(Math.max(1, e10), Math.max(1, t10));
    }
    updatePointer(e10, t10, r10) {
      let n10 = Math.max(this.pixelSize / Math.max(this.cssResolution.x, 1), 1e-6), i10 = Math.max(this.pixelSize / Math.max(this.cssResolution.y, 1), 1e-6);
      for (let e11 = +!!t10; e11 < 14; e11 += 1) this.trailStrength[e11] = sy.MathUtils.damp(this.trailStrength[e11], 0, 2, r10);
      if (t10) {
        let t11 = Math.floor(e10.x / n10), r11 = Math.floor(e10.y / i10);
        if (t11 !== this.lastPointerCell.x || r11 !== this.lastPointerCell.y) {
          for (let e11 = 13; e11 > 0; e11 -= 1) this.trail[e11].copy(this.trail[e11 - 1]), this.trailStrength[e11] = this.trailStrength[e11 - 1];
          this.lastPointerCell.set(t11, r11);
        }
        this.trail[0].set(e10.x, e10.y), this.trailStrength[0] = 1;
        return;
      }
      this.lastPointerCell.set(-1, -1);
    }
  };
  var pointerFragment = "uniform sampler2D tDiffuse;\nuniform vec2 uTrail[16];\nuniform float uTrailStrength[16];\nuniform float uTrailCount;\nuniform vec3 uPointerColor;\nuniform float uPointerOpacity;\nuniform float uPointerDotRadius;\nuniform float uPointerPixelSize;\nuniform vec2 uResolution;\nuniform float uDevicePixelRatio;\n\nfloat cellEquals(vec2 a, vec2 b) {\n  vec2 d = abs(a - b);\n  return 1.0 - step(0.5, max(d.x, d.y));\n}\n\nvec4 applyPointerOverlay(vec2 uv, vec4 baseColor) {\n  float cssPixelSize = uPointerPixelSize * max(uDevicePixelRatio, 1.0);\n  vec2 normalizedPixelSize = vec2(\n    cssPixelSize / max(uResolution.x, 1.0),\n    cssPixelSize / max(uResolution.y, 1.0)\n  );\n\n  vec2 safePixelSize = max(normalizedPixelSize, vec2(1e-6));\n  vec2 cellId = floor(uv / safePixelSize);\n  vec2 cellUV = fract(uv / safePixelSize);\n\n  float highlight = 0.0;\n  for (int i = 0; i < 16; i++) {\n    float enabled = step(float(i), uTrailCount - 1.0);\n    vec2 pointerCell = floor(uTrail[i] / safePixelSize);\n    float isSame = cellEquals(cellId, pointerCell);\n    float weight = clamp(uTrailStrength[i], 0.0, 1.0);\n    highlight = max(highlight, enabled * isSame * weight);\n  }\n\n  float distToCenter = distance(cellUV, vec2(0.5));\n  float aa = fwidth(distToCenter) * 1.5;\n  float radius = clamp(uPointerDotRadius, 0.0, 1.0);\n  float circleMask = smoothstep(radius, radius - aa, distToCenter);\n  float overlayAlpha = circleMask * highlight * clamp(uPointerOpacity, 0.0, 1.0);\n  baseColor.rgb = mix(baseColor.rgb, uPointerColor, overlayAlpha);\n\n  return baseColor;\n}\n\nvarying vec2 vUv;\nvoid main(){gl_FragColor=applyPointerOverlay(vUv,texture2D(tDiffuse,vUv));\n#include <colorspace_fragment>\n}";
  var parallaxSettings = { "parallaxEnabled": true, "parallaxStrength": 1.4, "parallaxLag": 0.18, "parallaxRotate": 0.12, "leaveParallaxLag": 0.05 };

  // tools/sticker-residue-detail.js
  var path = window.__portfolioEntryPath || location.pathname;
  var detail = /^\/projects\/(canvasflow-art-preview|aigc-design-efficiency|fliggy-lele-run|lexin-health-app)\/$/.test(path);
  var api = window.__portfolioStickerResidue;
  var saved = getResidueState();
  if (detail && saved) {
    api.ready = new Promise((resolve) => {
      if (path.includes("canvasflow-art-preview")) {
        const unsubscribe = onResidueRestored(() => {
          if (!residueSceneReady()) return;
          document.documentElement.dataset.stickerResidue = "ready";
          unsubscribe();
          resolve();
        });
        return;
      }
      const start = () => renderResidue(saved).then(() => {
        document.documentElement.dataset.stickerResidue = "ready";
        resolve();
      }).catch((error) => {
        console.error("Sticker residue renderer failed", error);
        resolve();
      });
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
      else start();
    });
  }
  var colorFunctions = `
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
      source = source.replace(/#include <tonemapping_fragment>/g, "").replace(/#include <colorspace_fragment>/g, "gl_FragColor=linearToOutputTexel(gl_FragColor);");
      if (type === gl.FRAGMENT_SHADER) source = "precision highp float;\n" + colorFunctions + "\n" + source;
      if (type === gl.VERTEX_SHADER) source = "precision highp float;\nattribute vec3 position;attribute vec2 uv;uniform mat4 projectionMatrix;uniform mat4 modelViewMatrix;\n" + (source.includes("instanceMatrix") ? "attribute mat4 instanceMatrix;\n" : "") + source;
      source = "#version 300 es\n" + source.replace(/\battribute\b/g, "in").replace(/\bvarying\b/g, type === gl.VERTEX_SHADER ? "out" : "in").replace(/\btexture2D\b/g, "texture").replace(/\bgl_FragColor\b/g, "residueColor");
      if (type === gl.FRAGMENT_SHADER) source = source.replace("precision highp float;", "precision highp float;\nout vec4 residueColor;");
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const p = gl.createProgram(), v = make(gl.VERTEX_SHADER, vertex), f = make(gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const uniforms = /* @__PURE__ */ new Map();
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
      const info = gl.getActiveUniform(p, i);
      uniforms.set(info.name.replace(/\[0\]$/, ""), { type: info.type, size: info.size, location: gl.getUniformLocation(p, info.name) });
    }
    return { p, uniforms };
  }
  function uniform(gl, material, name, value) {
    const u = material.uniforms.get(name);
    if (!u) return;
    if (u.type === gl.FLOAT_MAT4) gl.uniformMatrix4fv(u.location, false, value);
    else if (u.type === gl.FLOAT_VEC4) gl.uniform4fv(u.location, value);
    else if (u.type === gl.FLOAT_VEC3) gl.uniform3fv(u.location, value);
    else if (u.type === gl.FLOAT_VEC2) gl.uniform2fv(u.location, value);
    else if (u.type === gl.FLOAT) {
      if (u.size > 1) gl.uniform1fv(u.location, value);
      else gl.uniform1f(u.location, value);
    } else gl.uniform1i(u.location, value);
  }
  function geometry(gl, material, values) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    for (const [name, data, size] of values) {
      const at = gl.getAttribLocation(material.p, name);
      if (at < 0) continue;
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(at);
      gl.vertexAttribPointer(at, size, gl.FLOAT, false, 0, 0);
    }
    return vao;
  }
  function texture(gl, source, width, height, srgb = false) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (source instanceof Uint8Array) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
    else {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, srgb ? gl.SRGB8_ALPHA8 : gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    }
    return t;
  }
  function multiply(a, b) {
    const out = new Float32Array(16);
    for (let col = 0; col < 4; col++) for (let row = 0; row < 4; row++) for (let k = 0; k < 4; k++) out[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
    return out;
  }
  function residueThemeUniforms(state2) {
    const theme = window.PortfolioTheme?.getResolved();
    if (!theme || !state2.theme || theme === state2.theme) return null;
    const tokens = getComputedStyle(document.documentElement);
    const color = (name) => new ResidueColor(tokens.getPropertyValue(name).trim()).toArray();
    const oldBg = color("--scene-" + state2.theme + "-background"), oldEdge = color("--scene-" + state2.theme + "-vignette");
    const newBg = color("--scene-background"), newEdge = color("--scene-vignette");
    const axis = oldBg.map((value, index) => value - oldEdge[index]);
    const length = Math.max(1e-9, axis.reduce((total, value) => total + value * value, 0));
    const input = base64ToBytes(state2.background.pixels);
    for (let pixel = 0; pixel < input.length; pixel += 4) {
      const weight = Math.max(0, Math.min(1, axis.reduce((total, value, index) => total + (input[pixel + index] / 255 - oldEdge[index]) * value, 0) / length));
      for (let channel = 0; channel < 3; channel++) input[pixel + channel] = Math.round(255 * (newEdge[channel] + weight * (newBg[channel] - newEdge[channel])));
    }
    return {
      input,
      background: { uBgColor: newBg, uOutputColor: color("--scene-output"), uOutputMix: Number(tokens.getPropertyValue("--scene-output-mix")) },
      mask: { uColor: color("--scene-mask") }
    };
  }
  async function renderResidue(state2) {
    const host = document.querySelector(".project-background");
    if (!host) throw new Error("Project background layer missing");
    const canvas = document.createElement("canvas");
    canvas.className = "project-sticker-residue";
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none" });
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: true });
    if (!gl) throw new Error("WebGL2 unavailable");
    const background = program(gl, state2.background.vertex, state2.background.fragment), mask = program(gl, state2.mask.vertex, state2.mask.fragment), stickers = program(gl, state2.stickers.vertex, state2.stickers.fragment);
    const positions = [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], uvs = [0, 0, 1, 0, 0, 1, 1, 1];
    const bgQuad = geometry(gl, background, [["position", positions, 3], ["uv", uvs, 2]]), maskQuad = geometry(gl, mask, [["position", positions, 3], ["uv", uvs, 2]]), stickerQuad = geometry(gl, stickers, [["position", positions, 3], ["uv", uvs, 2]]);
    const input = texture(gl, base64ToBytes(state2.background.pixels), state2.background.width, state2.background.height);
    const images = await Promise.all(state2.stickers.images.map((src) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    })));
    const atlasCanvas = document.createElement("canvas");
    [atlasCanvas.width, atlasCanvas.height] = state2.stickers.atlasSize;
    const ctx = atlasCanvas.getContext("2d"), cols = Math.ceil(Math.sqrt(images.length)), cellW = Math.max(...images.map((i) => i.width)) + 4, cellH = Math.max(...images.map((i) => i.height)) + 4;
    images.forEach((image, i) => ctx.drawImage(image, i % cols * cellW + 2, Math.floor(i / cols) * cellH + 2));
    const atlas = texture(gl, atlasCanvas, 0, 0, true);
    const screen = program(gl, "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}", pointerFragment.replace("#include <colorspace_fragment>", "gl_FragColor=sRGBTransferOETF(gl_FragColor);"));
    const screenQuad = geometry(gl, screen, [["position", positions, 3], ["uv", uvs, 2]]), linear = gl.createTexture(), framebuffer = gl.createFramebuffer();
    const pointerOverlay = new cP(), pointer = new ResidueVector2(0.5, 0.5);
    const eye = cameraPosition(state2.stickers.view), target = [0, 0, 0], cameraZ = eye[2];
    let view = state2.stickers.view;
    let inside = false, frame = 0, lastTime = 0, motionFrames = 0, disposed = false, allocated = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)"), mobile = () => innerWidth < 1024;
    gl.bindVertexArray(stickerQuad);
    const matrixAt = gl.getAttribLocation(stickers.p, "instanceMatrix"), uvAt = gl.getAttribLocation(stickers.p, "uvRect");
    const matrixBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(state2.stickers.matrices), gl.STATIC_DRAW);
    for (let col = 0; col < 4; col++) {
      gl.enableVertexAttribArray(matrixAt + col);
      gl.vertexAttribPointer(matrixAt + col, 4, gl.FLOAT, false, 64, col * 16);
      gl.vertexAttribDivisor(matrixAt + col, 1);
    }
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(state2.stickers.uvRects), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(uvAt);
    gl.vertexAttribPointer(uvAt, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(uvAt, 1);
    let themeUniforms = residueThemeUniforms(state2);
    const updateInput = () => {
      gl.bindTexture(gl.TEXTURE_2D, input);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, state2.background.width, state2.background.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, themeUniforms?.input || base64ToBytes(state2.background.pixels));
    };
    updateInput();
    const draw = () => {
      const ratio = Math.min(devicePixelRatio, 2), width = Math.round(innerWidth * ratio), height = Math.round(innerHeight * ratio);
      if (!allocated || canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.bindTexture(gl.TEXTURE_2D, linear);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        allocated = true;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      pointerOverlay.setDisplayMetrics(innerWidth, innerHeight, ratio);
      pointerOverlay.setResolution(canvas.width, canvas.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, linear, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Residue framebuffer unavailable");
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.useProgram(background.p);
      gl.bindVertexArray(bgQuad);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, input);
      for (const [name, value] of Object.entries({ ...state2.background.uniforms, ...themeUniforms?.background })) uniform(gl, background, name, name === "uPortfolioGridReady" ? 0 : value);
      uniform(gl, background, "tInput", 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(stickers.p);
      gl.bindVertexArray(stickerQuad);
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      uniform(gl, stickers, "map", 0);
      const projection = state2.stickers.projection.slice();
      projection[5] = projection[0] * innerWidth / innerHeight;
      uniform(gl, stickers, "projectionMatrix", projection);
      uniform(gl, stickers, "modelViewMatrix", multiply(view, state2.stickers.model));
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, state2.stickers.count);
      gl.useProgram(mask.p);
      gl.bindVertexArray(maskQuad);
      for (const [name, value] of Object.entries({ ...state2.mask.uniforms, ...themeUniforms?.mask })) uniform(gl, mask, name, name === "uPortfolioGridReady" ? 0 : name === "uResolution" ? [innerWidth, innerHeight] : value);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.BLEND);
      gl.useProgram(screen.p);
      gl.bindVertexArray(screenQuad);
      gl.bindTexture(gl.TEXTURE_2D, linear);
      uniform(gl, screen, "tDiffuse", 0);
      for (const [name, entry] of Object.entries(pointerOverlay.uniforms)) {
        const value = entry.value;
        uniform(gl, screen, name, Array.isArray(value) ? value.flatMap((v) => v?.toArray ? v.toArray() : v) : value?.toArray ? value.toArray() : value);
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (gl.getError() !== gl.NO_ERROR) throw new Error("Residue draw failed");
    };
    draw();
    host.insertBefore(canvas, host.firstChild);
    host.querySelector(".project-background-pixels")?.setAttribute("hidden", "");
    const tick = (now) => {
      frame = 0;
      if (disposed || document.hidden) return;
      const dt = Math.min((now - (lastTime || now - 16.667)) / 1e3, 0.1);
      lastTime = now;
      const active = inside && !mobile() && !reduced.matches;
      const cursorSuppressed = document.documentElement.hasAttribute("data-project-pdf-cursor");
      pointerOverlay.uniforms.uPointerOpacity.value = cursorSuppressed ? 0 : 1;
      pointerOverlay.updatePointer(pointer, active && !cursorSuppressed, dt);
      const p = parallaxSettings, desired = active && p.parallaxEnabled ? [(0.5 - pointer.x) * 2 * p.parallaxStrength, (0.5 - pointer.y) * 2 * p.parallaxStrength * 0.6] : [0, 0];
      const lag = active ? p.parallaxLag : p.leaveParallaxLag;
      for (let i = 0; i < 2; i++) {
        eye[i] += (desired[i] - eye[i]) * lag;
        target[i] += (-desired[i] * p.parallaxRotate - target[i]) * lag;
      }
      eye[2] = cameraZ;
      view = cameraView(eye, target);
      draw();
      motionFrames++;
      api.detail.motion = { frames: motionFrames, eye: eye.slice(), trailCount: pointerOverlay.trailStrength.filter((n) => n > 0.01).length, pointerActive: active };
      const settling = eye.some((n, i) => i < 2 && Math.abs(n - desired[i]) > 1e-5) || target.some((n, i) => i < 2 && Math.abs(n + desired[i] * p.parallaxRotate) > 1e-5);
      if (settling || pointerOverlay.trailStrength.slice(active ? 1 : 0, 14).some((n) => n > 1e-3)) wake();
    };
    const wake = () => {
      if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const move = (event) => {
      if (event.pointerType === "touch") return;
      inside = true;
      pointer.set(event.clientX / innerWidth, 1 - event.clientY / innerHeight);
      wake();
    };
    const leave = () => {
      inside = false;
      pointer.set(0.5, 0.5);
      wake();
    };
    const resize = () => {
      draw();
      wake();
    };
    const cursorObserver = new MutationObserver(() => {
      const hidden = document.documentElement.hasAttribute("data-project-pdf-cursor");
      pointerOverlay.uniforms.uPointerOpacity.value = hidden ? 0 : 1;
      if (hidden) pointerOverlay.trailStrength.fill(0);
      draw();
      wake();
    });
    cursorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-project-pdf-cursor"] });
    const listeners = [[window, "pointermove", move], [window, "pointerdown", move], [window, "pointerover", move], [window, "blur", leave], [document, "mouseleave", leave], [document, "visibilitychange", leave], [window, "resize", resize]];
    const unsubscribeTheme = window.PortfolioTheme?.subscribe(() => {
      themeUniforms = residueThemeUniforms(state2);
      updateInput();
      draw();
      wake();
    });
    for (const [host2, type, listener] of listeners) host2.addEventListener(type, listener, { capture: true, passive: true });
    addEventListener("pagehide", (event) => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      if (!event.persisted) {
        disposed = true;
        cursorObserver.disconnect();
        unsubscribeTheme?.();
        for (const [host2, type, listener] of listeners) host2.removeEventListener(type, listener, true);
      }
    });
    addEventListener("pageshow", () => {
      inside = false;
      wake();
    });
    api.detail = { canvas, count: state2.stickers.count, created: state2.created, source: "live-gpu-checkpoint", interactive: true, motion: { frames: 0 } };
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    for (const part of ["stickers", "background", "mask"]) api.restored(part);
  }
})();
