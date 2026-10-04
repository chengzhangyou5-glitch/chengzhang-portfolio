// CSS mix-blend-mode: difference operates in sRGB. The scene can render to a
// linear offscreen target, so blend in sRGB, then return to linear before the
// existing output conversion. Leave the original background alpha untouched.
if (uPortfolioGridReady > 0.5) {
  vec4 grid = texture2D(uPortfolioGrid, vUv);
  vec3 backdrop = sRGBTransferOETF(vec4(gl_FragColor.rgb, 1.0)).rgb;
  vec3 blended = mix(backdrop, abs(backdrop - grid.rgb), grid.a);
  gl_FragColor.rgb = sRGBTransferEOTF(vec4(blended, 1.0)).rgb;
}
