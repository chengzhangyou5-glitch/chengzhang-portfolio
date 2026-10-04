// Keep the existing refraction shader, geometry and dark profile intact.
// This adjustment applies only to the Contact model in the light theme.
function portfolioContactLightGlass(base, theme, sectionName, model) {
  if (theme !== "light" || sectionName !== "footer" || model !== "model/cnt.gltf") return base;
  return {
    ...base,
    brightness: base.brightness * .96,
    contrast: Math.max(base.contrast, 1.04),
    diffuseness: base.diffuseness * .7,
    fresnelPower: Math.max(base.fresnelPower, 2.1),
    fresnelStrength: base.fresnelStrength * .9,
    specularStrength: base.specularStrength * .9
  };
}
