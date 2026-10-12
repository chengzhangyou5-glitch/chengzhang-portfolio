// Injected into the captured scene. React u, Three sy and R3F sA are existing.
function portfolioResidueUniforms(uniforms) {
  const values = {};
  for (const [name, uniform] of Object.entries(uniforms)) {
    const value = uniform.value;
    if (typeof value === 'number') values[name] = value;
    else if (value?.isColor) values[name] = [value.r, value.g, value.b];
    else if (value?.isVector2 || value?.isVector3) values[name] = value.toArray();
  }
  return values;
}
function portfolioRestoreStickerMesh({ mesh, geometry, particlesRef, timeRef, emitRef, initializedRef }) {
  const api = window.__portfolioStickerResidue, saved = api?.getState()?.stickers;
  if (!saved || !mesh) { api?.restored('stickers'); return false; }
  particlesRef.current = saved.particles.map(value => ({ ...value, position: new sy.Vector3(...value.position) }));
  timeRef.current = saved.time; emitRef.current = saved.emit; initializedRef.current = true;
  mesh.instanceMatrix.array.set(saved.matrices);
  geometry.getAttribute('uvRect').array.set(saved.uvRects);
  mesh.count = saved.count; mesh.visible = saved.count > 0;
  mesh.instanceMatrix.needsUpdate = true; geometry.getAttribute('uvRect').needsUpdate = true;
  mesh.userData.portfolioResidueRestored = true;
  api.restored('stickers');
  return true;
}
function usePortfolioStickerCheckpoint({ meshRef, geometry, atlas, particlesRef, timeRef, emitRef, camera, images, material }) {
  u.useEffect(() => {
    const api = window.__portfolioStickerResidue;
    if (!api || !atlas || !material) return;
    return api.register('stickers', () => {
      const mesh = meshRef.current; if (!mesh) return null;
      mesh.updateWorldMatrix(true, false); camera.updateMatrixWorld();
      const count = mesh.count;
      return { count, particles: particlesRef.current.map(value => ({ ...value, position: value.position.toArray() })), time: timeRef.current, emit: emitRef.current,
        matrices: Array.from(mesh.instanceMatrix.array.subarray(0, count * 16)), uvRects: Array.from(geometry.getAttribute('uvRect').array.subarray(0, count * 4)),
        model: mesh.matrixWorld.toArray(), view: camera.matrixWorldInverse.toArray(), projection: camera.projectionMatrix.toArray(),
        images, atlasSize: [atlas.texture.image.width, atlas.texture.image.height],
        vertex: material.vertexShader, fragment: material.fragmentShader };
    });
  }, [meshRef, geometry, atlas, particlesRef, timeRef, emitRef, camera, images, material]);
}
function portfolioRestoreResidueBackground(renderer, target) {
  const api = window.__portfolioStickerResidue, saved = api?.getState()?.background;
  if (!saved) { api?.restored('background'); return; }
  const texture = new sy.DataTexture(api.decode(saved.pixels), saved.width, saved.height, sy.RGBAFormat, sy.UnsignedByteType);
  texture.minFilter = sy.LinearFilter; texture.magFilter = sy.LinearFilter; texture.needsUpdate = true;
  const material = new sy.ShaderMaterial({ uniforms: { map: { value: texture } }, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}', fragmentShader: 'uniform sampler2D map;varying vec2 vUv;void main(){gl_FragColor=texture2D(map,vUv);}', depthTest: false, depthWrite: false, toneMapped: false, blending: sy.NoBlending });
  const geometry = new sy.PlaneGeometry(2, 2), scene = new sy.Scene(); scene.add(new sy.Mesh(geometry, material));
  const previous = renderer.getRenderTarget();
  renderer.setRenderTarget(target); renderer.render(scene, new sy.OrthographicCamera(-1, 1, 1, -1, 0, 1)); renderer.setRenderTarget(previous);
  geometry.dispose(); material.dispose(); texture.dispose(); api.restored('background');
}
function usePortfolioResidueBackground(renderer, targetRef, material) {
  u.useEffect(() => {
    const api = window.__portfolioStickerResidue; if (!api) return;
    return api.register('background', () => {
      const target = targetRef.current.read, pixels = new Uint8Array(target.width * target.height * 4);
      renderer.readRenderTargetPixels(target, 0, 0, target.width, target.height, pixels);
      return { width: target.width, height: target.height, pixels: api.encode(pixels), uniforms: portfolioResidueUniforms(material.uniforms), vertex: material.vertexShader, fragment: material.fragmentShader };
    });
  }, [renderer, targetRef, material]);
}
function usePortfolioResidueMask(materialRef) {
  u.useEffect(() => {
    const api = window.__portfolioStickerResidue; if (!api) return;
    api.restored('mask');
    return api.register('mask', () => {
      const material = materialRef.current; if (!material) return null;
      return { uniforms: portfolioResidueUniforms(material.uniforms), vertex: material.vertexShader, fragment: material.fragmentShader };
    });
  }, [materialRef]);
}
