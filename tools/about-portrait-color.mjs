// The captured image shader mixes negative RGB with original RGB on entry.
// Keep that legacy behavior for other layers; About always uses original RGB.
function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (source.split(before).length !== 2) {
    throw new Error(`${label}: expected exactly one original insertion point.`);
  }
  return source.replace(before, after);
}

export function preserveAboutPortraitColors(chunk) {
  const from = chunk.indexOf("function cE({ready:");
  const to = chunk.indexOf("function cw(e)", from);
  if (from < 0 || to < from) throw new Error("Captured image-layer component not found.");
  let imageLayer = chunk.slice(from, to);
  imageLayer = replaceOnce(imageLayer,
    "getTargetRect:o,onTextureReady:a})",
    "getTargetRect:o,onTextureReady:a,preserveOriginalColors:keepOriginalColors=!1})",
    "Original-color option");
  imageLayer = replaceOnce(imageLayer,
    "uPolarityPositive:{value:0}",
    "uPolarityPositive:{value:keepOriginalColors?1:0}",
    "Initial image polarity");
  imageLayer = replaceOnce(imageLayer,
    "b.uniforms.uPolarityPositive.value=0",
    "b.uniforms.uPolarityPositive.value=keepOriginalColors?1:0",
    "Offscreen image polarity");
  imageLayer = replaceOnce(imageLayer,
    "b.uniforms.uPolarityPositive.value=G",
    "b.uniforms.uPolarityPositive.value=keepOriginalColors?1:G",
    "Per-frame image polarity");
  imageLayer = replaceOnce(imageLayer,
    "alphaToCoverage:!1}),[]),x=!!r",
    "alphaToCoverage:!1}),[keepOriginalColors]),x=!!r",
    "Material option dependency");
  chunk = chunk.slice(0, from) + imageLayer + chunk.slice(to);
  chunk = replaceOnce(chunk,
    "layerKey:e.key,getTargetRect:B,onTextureReady:()=>d(e.key)",
    "layerKey:e.key,preserveOriginalColors:e.preserveOriginalColors,getTargetRect:B,onTextureReady:()=>d(e.key)",
    "Image-layer option forwarding");
  return replaceOnce(chunk,
    '{key:"about",imageUrl:portfolioAboutPortrait.src,targetRef:f}',
    '{key:"about",imageUrl:portfolioAboutPortrait.src,targetRef:f,preserveOriginalColors:!0}',
    "About-only original colors");
}
