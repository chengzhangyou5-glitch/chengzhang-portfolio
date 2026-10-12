// Start a cold scene partway through the existing falling cycle. Reuse the
// existing twelve particles, their speeds, rotations, wind and fade curve.
// Restored residue bypasses this helper, so navigation never reseeds its field.
function portfolioSeedInitialStickers(particles, settings, camera) {
  particles.forEach((particle, index) => {
    const progress = .08 + .78 * (index + Math.random()) / particles.length;
    particle.position.y = particle.startY - settings.fallDistance * progress;
  });
  const first = particles[0];
  if (!first || !camera.isPerspectiveCamera) return;
  const halfHeight = Math.max(1, camera.position.z - first.position.z) * Math.tan(camera.fov * Math.PI / 360);
  first.position.y = Math.min(first.startY - settings.fallDistance * .08, halfHeight * .8);
  const halfWidth = halfHeight * camera.aspect;
  first.position.x = Math.max(-halfWidth * .7, Math.min(halfWidth * .7, first.position.x));
}
