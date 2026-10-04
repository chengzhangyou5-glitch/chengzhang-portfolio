// Original homepage grid geometry, extracted without changing its spacing,
// cross markers or 1 px line style (module 13717 in 1ed7a178f7acd3df.js).
export function portfolioGridGeometry(width, height) {
  const margin = width < 1024 ? 16 : 56;
  const innerWidth = Math.max(0, width - 2 * margin);
  const rowHeight = Math.max(0, height / 3 - 12);
  const secondStart = rowHeight + 24;
  const secondEnd = secondStart + rowHeight;
  const columns = width < 1280 ? 2 : 3;
  const xs = Array.from({ length: columns + 1 }, (_, i) => Math.round(margin + i / columns * innerWidth) + .5);
  const ys = [rowHeight + 12, secondEnd + 12];
  const spans = [[0, rowHeight], [secondStart, secondEnd], [secondEnd + 24, height]];
  return {
    vertical: spans.map(([start, end]) => xs.map(x => `M${x} ${start}V${end}`).join("")).join(""),
    horizontal: ys.map(y => [`M0 ${y}H${xs[0] - 12}`, ...xs.slice(0, -1).map((x, i) => `M${x + 12} ${y}H${xs[i + 1] - 12}`), `M${xs.at(-1) + 12} ${y}H${width}`].join("")).join(""),
    crosses: xs.flatMap(x => ys.flatMap(y => [`M${x} ${y - 6}V${y + 6}`, `M${x - 6} ${y}H${x + 6}`])).join(""),
  };
}
