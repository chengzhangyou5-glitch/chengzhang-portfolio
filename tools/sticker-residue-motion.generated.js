/* Generated from the original live scene; do not edit. */
import { ResidueVector2, ResidueColor, residueMath } from "./sticker-residue-math.js";
const sy={Vector2:ResidueVector2,Color:ResidueColor,MathUtils:residueMath};
const cF="#c0fe04";
class cP {
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
  }

export {cP as ResiduePointerOverlay};
export const pointerFragment="uniform sampler2D tDiffuse;\nuniform vec2 uTrail[16];\nuniform float uTrailStrength[16];\nuniform float uTrailCount;\nuniform vec3 uPointerColor;\nuniform float uPointerOpacity;\nuniform float uPointerDotRadius;\nuniform float uPointerPixelSize;\nuniform vec2 uResolution;\nuniform float uDevicePixelRatio;\n\nfloat cellEquals(vec2 a, vec2 b) {\n  vec2 d = abs(a - b);\n  return 1.0 - step(0.5, max(d.x, d.y));\n}\n\nvec4 applyPointerOverlay(vec2 uv, vec4 baseColor) {\n  float cssPixelSize = uPointerPixelSize * max(uDevicePixelRatio, 1.0);\n  vec2 normalizedPixelSize = vec2(\n    cssPixelSize / max(uResolution.x, 1.0),\n    cssPixelSize / max(uResolution.y, 1.0)\n  );\n\n  vec2 safePixelSize = max(normalizedPixelSize, vec2(1e-6));\n  vec2 cellId = floor(uv / safePixelSize);\n  vec2 cellUV = fract(uv / safePixelSize);\n\n  float highlight = 0.0;\n  for (int i = 0; i < 16; i++) {\n    float enabled = step(float(i), uTrailCount - 1.0);\n    vec2 pointerCell = floor(uTrail[i] / safePixelSize);\n    float isSame = cellEquals(cellId, pointerCell);\n    float weight = clamp(uTrailStrength[i], 0.0, 1.0);\n    highlight = max(highlight, enabled * isSame * weight);\n  }\n\n  float distToCenter = distance(cellUV, vec2(0.5));\n  float aa = fwidth(distToCenter) * 1.5;\n  float radius = clamp(uPointerDotRadius, 0.0, 1.0);\n  float circleMask = smoothstep(radius, radius - aa, distToCenter);\n  float overlayAlpha = circleMask * highlight * clamp(uPointerOpacity, 0.0, 1.0);\n  baseColor.rgb = mix(baseColor.rgb, uPointerColor, overlayAlpha);\n\n  return baseColor;\n}\n\nvarying vec2 vUv;\nvoid main(){gl_FragColor=applyPointerOverlay(vUv,texture2D(tDiffuse,vUv));\n#include <colorspace_fragment>\n}";
export const parallaxSettings={"parallaxEnabled":true,"parallaxStrength":1.4,"parallaxLag":0.18,"parallaxRotate":0.12,"leaveParallaxLag":0.05};
