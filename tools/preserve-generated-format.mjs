// Captured chunks contain mixed LF/CRLF. Retain unchanged lines verbatim so
// rebuilding a small source block does not rewrite unrelated generated code.
export function preserveGeneratedFormat(before, after) {
  const lines = text => (text.match(/[^\n]*\n|[^\n]+$/g) || []).map(raw => ({ raw, text: raw.replace(/\r?\n$/, "") }));
  const old = lines(before), next = lines(after), width = next.length + 1;
  const common = new Uint16Array((old.length + 1) * width);
  for (let a = old.length - 1; a >= 0; a--) for (let b = next.length - 1; b >= 0; b--) {
    common[a * width + b] = old[a].text === next[b].text ? 1 + common[(a + 1) * width + b + 1] : Math.max(common[(a + 1) * width + b], common[a * width + b + 1]);
  }
  const output = [];
  let a = 0, b = 0;
  while (b < next.length) {
    if (a < old.length && old[a].text === next[b].text) { output.push(old[a++].raw); b++; }
    else if (a < old.length && common[(a + 1) * width + b] > common[a * width + b + 1]) a++;
    else { output.push(next[b++].raw.replace(/\r\n$/, "\n")); }
  }
  return output.join("");
}
