// Small value adapters for the original pointer-overlay class; no second Three
// library or full homepage is needed in the lightweight document readers.
export class ResidueVector2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  set(x, y) { this.x = x; this.y = y; return this; }
  copy(value) { return this.set(value.x, value.y); }
  toArray() { return [this.x, this.y]; }
}
export class ResidueColor {
  constructor(value) { this.set(value); }
  set(value) {
    const hex = parseInt(value.replace('#', ''), 16);
    const linear = n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
    this.r = linear((hex >> 16 & 255) / 255); this.g = linear((hex >> 8 & 255) / 255); this.b = linear((hex & 255) / 255);
    return this;
  }
  toArray() { return [this.r, this.g, this.b]; }
}
export const residueMath = { damp: (x, y, lambda, dt) => y + (x - y) * Math.exp(-lambda * dt) };

export function cameraPosition(view) {
  return [0, 1, 2].map(i => -(view[i * 4] * view[12] + view[i * 4 + 1] * view[13] + view[i * 4 + 2] * view[14]));
}
export function cameraView(eye, target) {
  let z = eye.map((n, i) => n - target[i]); const length = Math.hypot(...z) || 1; z = z.map(n => n / length);
  const xLength = Math.hypot(z[2], z[0]) || 1, x = [z[2] / xLength, 0, -z[0] / xLength];
  const y = [z[1] * x[2], z[2] * x[0] - z[0] * x[2], -z[1] * x[0]];
  const dot = a => a.reduce((total, n, i) => total + n * eye[i], 0);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x), -dot(y), -dot(z), 1];
}
