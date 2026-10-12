// Analyse the existing BGM without rerouting its playback, changing its volume,
// creating a second player, or asking for microphone access. The cached PCM
// envelope follows the player's currentTime while audible. When playback is
// off, a silent visual clock continues sampling the same track and wave shapes.
const portfolioWorksRhythmCache = new Map();
const portfolioWorksClamp = value => Math.max(0, Math.min(1, value));

function portfolioWorksPrepareRhythm(src) {
  if (portfolioWorksRhythmCache.has(src)) return portfolioWorksRhythmCache.get(src);
  const promise = (async () => {
    const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineContext) throw new Error("Offline audio decoding unavailable");
    const response = await fetch(src, { cache: "force-cache" });
    if (!response.ok) throw new Error("BGM could not be read");
    const context = new OfflineContext(1, 1, 22050);
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
    const step = .02, samplesPerFrame = Math.round(buffer.sampleRate * step);
    const count = Math.ceil(buffer.length / samplesPerFrame);
    const bass = new Float32Array(count), mid = new Float32Array(count), high = new Float32Array(count), energy = new Float32Array(count);
    const lowCoefficient = 1 - Math.exp(-2 * Math.PI * 180 / buffer.sampleRate);
    const midCoefficient = 1 - Math.exp(-2 * Math.PI * 2200 / buffer.sampleRate);
    let low = 0, middle = 0;
    for (let frame = 0; frame < count; frame++) {
      const start = frame * samplesPerFrame, end = Math.min(buffer.length, start + samplesPerFrame);
      let lowSum = 0, midSum = 0, highSum = 0, fullSum = 0;
      for (let sample = start; sample < end; sample++) {
        let value = 0;
        for (const channel of channels) value += channel[sample] / channels.length;
        low += (value - low) * lowCoefficient;
        middle += (value - middle) * midCoefficient;
        const midValue = middle - low, highValue = value - middle;
        lowSum += low * low; midSum += midValue * midValue;
        highSum += highValue * highValue; fullSum += value * value;
      }
      const size = Math.max(1, end - start);
      bass[frame] = Math.sqrt(lowSum / size); mid[frame] = Math.sqrt(midSum / size);
      high[frame] = Math.sqrt(highSum / size); energy[frame] = Math.sqrt(fullSum / size);
      // Short chunks let the page keep painting while the track is analysed.
      if (frame % 120 === 119) await new Promise(resolve => setTimeout(resolve, 0));
    }
    for (const values of [bass, mid, high, energy]) {
      const sorted = [...values].sort((a, b) => a - b);
      const floor = sorted[Math.floor(count * .08)] * .4;
      const range = Math.max(.001, sorted[Math.floor(count * .90)] - floor);
      for (let index = 0; index < count; index++) values[index] = portfolioWorksClamp((values[index] - floor) / range);
    }
    const onsets = new Float32Array(count), beats = [];
    let lastOnset = -10, onsetCount = 0;
    for (let index = 3; index < count; index++) {
      const lowRise = bass[index] - (bass[index - 1] + bass[index - 2] + bass[index - 3]) / 3;
      const fullRise = energy[index] - (energy[index - 1] + energy[index - 2]) / 2;
      // Require a low-frequency attack, not every fluctuation in the melody.
      // A refractory interval prevents a drum's tail becoming repeated beats.
      if (bass[index] > .38 && (lowRise > .16 && fullRise > .04 || lowRise > .24) && (index - lastOnset) * step > .34) {
        onsets[index] = portfolioWorksClamp(lowRise * 4.2 + fullRise * 2.8);
        beats.push({ time: index * step, index: onsetCount, strength: onsets[index], bass: bass[index], mid: mid[index], high: high[index] });
        lastOnset = index; onsetCount++;
      }
    }
    return { bass, mid, high, onsets, beats, count, step, duration: buffer.duration, onsetCount };
  })();
  portfolioWorksRhythmCache.set(src, promise);
  return promise;
}

function portfolioWorksReadRhythm(table, time) {
  const position = Math.max(0, Math.min(table.count - 1, time / table.step));
  const index = Math.floor(position), next = Math.min(table.count - 1, index + 1), mix = position - index;
  const read = values => values[index] * (1 - mix) + values[next] * mix;
  let kick = 0;
  for (let previous = Math.max(0, index - 14); previous <= index; previous++) {
    kick = Math.max(kick, table.onsets[previous] * Math.exp(-(position - previous) * table.step / .115));
  }
  const beats = table.beats.filter(beat => time >= beat.time && time - beat.time < .9)
    .map(beat => ({ ...beat, age: time - beat.time }));
  return { bass: read(table.bass), mid: read(table.mid), high: read(table.high), kick, beats };
}

// Move the contour as one light body between beats. Its relative geometry
// stays still; the drift takes roughly twenty seconds to complete a cycle.
function portfolioWorksOutlineFloat(time) {
  return { x: Math.sin(time * Math.PI * 2 / 26) * 1.5, y: Math.sin(time * Math.PI * 2 / 21 + .6) * 2.2 };
}

function portfolioWorksBeatEnvelope(age) {
  const smooth = value => { const t = portfolioWorksClamp(value); return t * t * (3 - 2 * t); };
  return age < .12 ? smooth(age / .12) : 1 - smooth((age - .12) / .78);
}

// Sample smooth wave crests, not raw audio amplitudes on every frame. Each
// real drum attack creates one rise and a long return. The band mix is frozen
// at that attack, and successive attacks visit different parts of the contour.
function portfolioWorksPixelMotion(cell, time, signal) {
  const tau = Math.PI * 2;
  let displacement = 0, illumination = 0;
  for (const beat of signal.beats || []) {
    const envelope = portfolioWorksBeatEnvelope(beat.age) * beat.strength;
    const center = (beat.index * .381966 + .12) % 1;
    const difference = ((cell.position - center + 1.5) % 1) - .5;
    const support = Math.exp(-.5 * (difference / .23) ** 2);
    const phase = difference * tau * 1.6;
    const low = Math.sin(phase) * (4.5 + beat.bass * 2);
    const mid = Math.sin(phase * 1.45 + .7) * beat.mid * 1.7;
    const high = Math.sin(phase * 1.9 - .6) * beat.high * .6;
    displacement += (low + mid + high) * support * envelope;
    illumination = Math.max(illumination, support * envelope);
  }
  const normal = 6.5 * Math.tanh(displacement / 6.5);
  const magnitude = Math.hypot(cell.normalX, cell.normalY) || 1;
  const nx = cell.normalX / magnitude, ny = cell.normalY / magnitude;
  return {
    x: nx * normal, y: ny * normal, scale: 1,
    light: .9 + Math.min(1, illumination) * .1
  };
}

function PortfolioWorksRhythm({ host }) {
  const media = worksMediaEnv.useShellMedia();
  const mediaRef = i.useRef(media);
  mediaRef.current = media;
  i.useEffect(() => {
    const element = host.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, disposed = false, previousTime = performance.now();
    let player = null, table = null, failed = false, preparing = false;
    let rhythmSource = new URL("/bgm.mp3", window.location.href).href, visualTime = 0, playbackActive = false, clockSwitchUntil = 0;
    let currentOutline = null, reveal = 0, cellNodes = [], firstCell = null;
    const smoothed = { kick: 0, bass: 0, mid: 0, high: 0 };
    const paint = now => {
      frame = 0;
      if (disposed) return;
      if (document.hidden) return;
      const elapsed = previousTime ? Math.max(0, (now - previousTime) / 1000) : 0;
      const dt = Math.min(.06, elapsed || .016);
      previousTime = now;
      const shell = mediaRef.current;
      player = shell.getBgmElement?.() || null;
      // The shell creates its player only after sound is enabled. Decode its
      // existing track independently so a first visit with sound off also works.
      const source = player?.currentSrc || player?.src || new URL("/bgm.mp3", window.location.href).href;
      if (source !== rhythmSource) {
        rhythmSource = source; table = null; failed = false; preparing = false;
        visualTime = player?.currentTime || 0;
      }
      const playing = shell.soundEnabled && player && !player.paused && !player.muted && player.volume > 0 && !player.ended;
      if (Boolean(playing) !== playbackActive) {
        playbackActive = Boolean(playing); clockSwitchUntil = now + 300;
      }
      visualTime = playing ? player.currentTime : visualTime + elapsed;
      if (table) visualTime %= table.duration;
      const activePlane = element.querySelector('.works-plane[data-active="true"]');
      const outline = activePlane?.querySelector(".works-pixel-outline");
      if (outline !== currentOutline) {
        if (currentOutline) { currentOutline.dataset.visible = "false"; currentOutline.style.setProperty("--outline-reveal", "0"); }
        currentOutline = outline; reveal = 0; firstCell = null;
      }
      const stageActive = element.dataset.stageActive === "true";
      if (!stageActive || !outline) {
        if (outline) outline.dataset.visible = "false";
        reveal = 0;
        return;
      }
      if (!reduced.matches) frame = requestAnimationFrame(paint);
      const distance = Math.abs(parseFloat(activePlane.style.getPropertyValue("--plane-y")) || 0);
      const targetReveal = portfolioWorksClamp((90 - distance) / 36);
      reveal = reduced.matches ? targetReveal : reveal + (targetReveal - reveal) * (1 - Math.exp(-dt / .075));
      outline.dataset.visible = reveal > .015 && targetReveal > 0 ? "true" : "false";
      outline.style.setProperty("--outline-reveal", reveal.toFixed(4));
      if (!preparing && !table && !failed) {
        preparing = true;
        portfolioWorksPrepareRhythm(source).then(result => {
          if (!disposed && source === rhythmSource) {
            table = result; element.dataset.rhythmOnsets = String(result.onsetCount);
            wake();
          }
        }).catch(() => { if (!disposed && source === rhythmSource) failed = true; });
      }
      let signal = { kick: 0, bass: 0, mid: 0, high: 0, beats: [] };
      let mode = !table && !failed ? "loading" : "quiet";
      if (table) {
        signal = portfolioWorksReadRhythm(table, visualTime);
        mode = playing ? "audio-pcm" : "audio-pcm-silent";
      } else if (failed) {
        // The same four-beat fallback is used in both sound states only when
        // the track cannot be decoded. Silent playback is explicitly labelled.
        const beat = visualTime / .625, accent = [1, .35, .72, .45][Math.floor(beat) % 4];
        const kick = accent * Math.exp(-(beat % 1) * 7);
        signal = { kick, bass: kick * .65, mid: kick * .4, high: kick * .25,
          beats: [0, 1].map(offset => ({ index: Math.floor(beat) - offset, age: (beat % 1 + offset) * .625, strength: [1, .35, .72, .45][(Math.floor(beat) - offset + 4) % 4], bass: .65, mid: .4, high: .25 })).filter(beat => beat.index >= 0 && beat.age < .9) };
        mode = playing ? "simulated" : "simulated-silent";
      }
      element.dataset.rhythmSource = mode;
      element.dataset.rhythmTime = visualTime.toFixed(3);
      element.dataset.rhythmBeats = String(signal.beats.length);
      const float = reduced.matches ? { x: 0, y: 0 } : portfolioWorksOutlineFloat(now / 1000);
      outline.style.setProperty("--outline-float-x", float.x.toFixed(3) + "px");
      outline.style.setProperty("--outline-float-y", float.y.toFixed(3) + "px");
      for (const name of Object.keys(smoothed)) {
        const value = reduced.matches ? 0 : signal[name];
        const smoothing = value > smoothed[name] ? .025 : name === "kick" ? .065 : .13;
        smoothed[name] += (value - smoothed[name]) * (1 - Math.exp(-dt / smoothing));
        outline.style.setProperty("--works-" + name, smoothed[name].toFixed(4));
      }
      // Cache inline geometry; no per-frame layout measurement is needed.
      if (outline.firstElementChild !== firstCell) {
        firstCell = outline.firstElementChild;
        cellNodes = [...outline.children].map(node => ({
          node, position: Number(node.dataset.arc),
          normalX: Number(node.style.getPropertyValue("--normal-x")),
          normalY: Number(node.style.getPropertyValue("--normal-y")), x: 0, y: 0, light: .9
        }));
      }
      for (const cell of cellNodes) {
        const motion = reduced.matches ? { x: 0, y: 0, scale: 1, light: .9 }
          : portfolioWorksPixelMotion(cell, now / 1000, signal);
        const blend = reduced.matches ? 1 : 1 - Math.exp(-dt / (now < clockSwitchUntil ? .16 : .055));
        cell.x += (motion.x - cell.x) * blend; cell.y += (motion.y - cell.y) * blend;
        cell.light += (motion.light - cell.light) * blend;
        cell.node.style.setProperty("--cell-shift-x", cell.x.toFixed(3) + "px");
        cell.node.style.setProperty("--cell-shift-y", cell.y.toFixed(3) + "px");
        cell.node.style.setProperty("--cell-scale", motion.scale.toFixed(4));
        cell.node.style.setProperty("--cell-light", cell.light.toFixed(4));
      }
    };
    function wake() {
      if (disposed) return;
      if (document.hidden || element.dataset.stageActive !== "true") {
        cancelAnimationFrame(frame); frame = 0;
        if (currentOutline) currentOutline.dataset.visible = "false";
        reveal = 0;
        return;
      }
      // previousTime is retained: silent time advances across sleep, PCM uses the player clock.
      if (!frame) frame = requestAnimationFrame(paint);
    }
    const observer = new MutationObserver(wake);
    observer.observe(element, { attributes: true, attributeFilter: ["data-stage-active"] });
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("resize", wake, { passive: true });
    reduced.addEventListener("change", wake);
    wake();
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("resize", wake); reduced.removeEventListener("change", wake);
    };
  }, [host]);
  return null;
}
