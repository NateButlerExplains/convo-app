import { useEffect, useRef } from "react";

type Spark = { angle: number; distance: number; speed: number; size: number; alpha: number; phase: number };

type Ring = { radius: number; speed: number; phase: number; color: "gold" | "teal" };

const TAU = Math.PI * 2;
const POINTS = 128;

export function Waveform({ stream, active }: { stream: MediaStream | null; active: boolean }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const canvas = document.createElement("canvas");
    canvas.className = "waveform voice-aura-canvas";
    wrap.prepend(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let time = 0;
    let audioContext: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let frequencyData: Uint8Array<ArrayBuffer> | null = null;
    let timeData: Uint8Array<ArrayBuffer> | null = null;
    let smoothBands = Array.from({ length: POINTS }, () => 0);
    let smoothWave = Array.from({ length: POINTS }, () => 0);
    let energy = 0.06;
    let width = 0;
    let height = 0;

    const rings: Ring[] = [
      { radius: 1.43, speed: 0.0018, phase: 0.4, color: "gold" },
      { radius: 1.78, speed: -0.0012, phase: 2.2, color: "teal" },
      { radius: 2.18, speed: 0.0008, phase: 4.1, color: "gold" },
    ];
    const sparks: Spark[] = Array.from({ length: 46 }, () => ({
      angle: Math.random() * TAU,
      distance: 1.35 + Math.random() * 2.2,
      speed: (0.001 + Math.random() * 0.0025) * (Math.random() > 0.5 ? 1 : -1),
      size: 0.4 + Math.random() * 1.5,
      alpha: 0.08 + Math.random() * 0.3,
      phase: Math.random() * TAU,
    }));

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      width = Math.max(320, wrap.clientWidth);
      height = Math.max(260, wrap.clientHeight);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spectrum = () => {
      if (!analyser || !frequencyData) {
        return smoothBands.map((_, index) =>
          0.045 + Math.sin(time * 0.018 + index * 0.18) * 0.014 + Math.sin(time * 0.007 - index * 0.07) * 0.01,
        );
      }
      analyser.getByteFrequencyData(frequencyData);
      const data = frequencyData!;
      const usefulBins = Math.floor(data.length * 0.72);
      return smoothBands.map((_, index) => {
        const mirrored = index < POINTS / 2 ? index : POINTS - index - 1;
        const normalized = mirrored / (POINTS / 2);
        const curved = Math.pow(normalized, 1.65);
        const bin = Math.min(usefulBins - 1, Math.floor(curved * usefulBins));
        const near = data[Math.min(usefulBins - 1, bin + 1)] / 255;
        const raw = data[bin] / 255;
        return Math.pow(raw * 0.72 + near * 0.28, 0.58);
      });
    };

    const waveform = () => {
      if (!analyser || !timeData) {
        return smoothWave.map((_, index) =>
          Math.sin(index * 0.2 - time * 0.025) * 0.08 + Math.sin(index * 0.067 + time * 0.012) * 0.04,
        );
      }
      analyser.getByteTimeDomainData(timeData);
      const data = timeData!;
      return smoothWave.map((_, index) => {
        const sample = data[Math.floor((index / POINTS) * data.length)] / 128 - 1;
        return Math.max(-1, Math.min(1, sample * 1.85 + Math.sin(index * 0.105 - time * 0.02) * 0.035));
      });
    };

    const voiceRibbon = (cy: number, wave: number[]) => {
      const left = width * 0.055;
      const span = width * 0.89;
      const amplitude = 34 + energy * 104;
      const gradient = ctx.createLinearGradient(left, 0, left + span, 0);
      gradient.addColorStop(0, "rgba(88, 202, 214, 0)");
      gradient.addColorStop(0.16, "rgba(88, 202, 214, .34)");
      gradient.addColorStop(0.47, "rgba(255, 221, 126, .52)");
      gradient.addColorStop(0.7, "rgba(255, 193, 67, .34)");
      gradient.addColorStop(1, "rgba(255, 220, 126, 0)");

      const pointAt = (index: number, trail: number) => {
        const progress = index / (POINTS - 1);
        const shifted = (index + trail * 4 + POINTS) % POINTS;
        const envelope = Math.pow(Math.sin(progress * Math.PI), 0.5);
        const drift = Math.sin(progress * TAU * 2.2 - time * 0.018 + trail * 0.6) * (3 + energy * 5);
        return {
          x: left + progress * span,
          y: cy + wave[shifted] * amplitude * envelope + drift + trail * 5.2,
        };
      };

      const traceRibbon = (trail: number, reverse = false, connected = false) => {
        const step = reverse ? -1 : 1;
        const start = reverse ? POINTS - 1 : 0;
        const end = reverse ? 0 : POINTS - 1;
        const first = pointAt(start, trail);
        connected ? ctx.lineTo(first.x, first.y) : ctx.moveTo(first.x, first.y);
        for (let index = start + step; index !== end; index += step) {
          const point = pointAt(index, trail);
          const next = pointAt(index + step, trail);
          ctx.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
        }
        const last = pointAt(end, trail);
        ctx.lineTo(last.x, last.y);
      };

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      // A translucent surface between the outer echoes makes the signal feel physical.
      ctx.beginPath();
      traceRibbon(-2);
      traceRibbon(2, true, true);
      ctx.closePath();
      ctx.globalAlpha = 0.11 + energy * 0.12;
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 18 + energy * 24;
      ctx.shadowColor = "rgba(102, 215, 224, .42)";
      ctx.fill();

      for (let trail = -2; trail <= 2; trail++) {
        ctx.beginPath();
        traceRibbon(trail);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = trail === 0 ? 2.1 : 0.8;
        ctx.globalAlpha = trail === 0 ? 0.92 : 0.28;
        ctx.shadowBlur = trail === 0 ? 15 + energy * 26 : 5;
        ctx.shadowColor = trail < 0 ? "rgba(91, 215, 225, .8)" : "rgba(255, 202, 83, .85)";
        ctx.stroke();
      }

      const travel = (time * (0.0028 + energy * 0.002)) % 1;
      const photon = pointAt(Math.min(POINTS - 1, Math.floor(travel * POINTS)), 0);
      const glowRadius = 14 + energy * 18;
      const photonGlow = ctx.createRadialGradient(photon.x, photon.y, 0, photon.x, photon.y, glowRadius);
      photonGlow.addColorStop(0, "rgba(255, 255, 240, .95)");
      photonGlow.addColorStop(0.16, "rgba(255, 222, 126, .62)");
      photonGlow.addColorStop(0.48, "rgba(87, 213, 224, .15)");
      photonGlow.addColorStop(1, "rgba(87, 213, 224, 0)");
      ctx.globalAlpha = 0.72 + energy * 0.22;
      ctx.fillStyle = photonGlow;
      ctx.beginPath();
      ctx.arc(photon.x, photon.y, glowRadius, 0, TAU);
      ctx.fill();
      ctx.restore();
    };

    const membranePath = (
      cx: number,
      cy: number,
      baseRadius: number,
      bands: number[],
      layer: number,
      amplitude: number,
    ) => {
      ctx.beginPath();
      for (let index = 0; index <= POINTS; index++) {
        const point = index % POINTS;
        const angle = (point / POINTS) * TAU - Math.PI / 2;
        const voice = bands[point] * amplitude;
        const broad = Math.sin(angle * 3 + time * (0.011 + layer * 0.002) + layer) * (4 + energy * 8);
        const fine = Math.sin(angle * 7 - time * 0.018 + layer * 1.7) * (1.5 + bands[point] * 4);
        const asymmetry = Math.sin(angle - time * 0.004) * 5;
        const radius = baseRadius + voice + broad + fine + asymmetry;
        const x = cx + Math.cos(angle) * radius * (1 + Math.sin(time * 0.004) * 0.018);
        const y = cy + Math.sin(angle) * radius;
        index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const draw = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);
      const cx = width * 0.5;
      const cy = height * 0.47;
      const baseRadius = Math.min(width, height) * 0.165;
      const rawBands = spectrum();
      smoothBands = smoothBands.map((value, index) => value + (rawBands[index] - value) * (rawBands[index] > value ? 0.32 : 0.09));
      const rawWave = waveform();
      smoothWave = smoothWave.map((value, index) =>
        value + (rawWave[index] - value) * (Math.abs(rawWave[index]) > Math.abs(value) ? 0.4 : 0.16),
      );
      const average = smoothBands.reduce((sum, value) => sum + value, 0) / POINTS;
      energy += ((active ? average : 0.055) - energy) * 0.1;

      // Deep cinematic atmosphere: teal shadow, warm bloom, subtle vignette.
      const atmosphere = ctx.createRadialGradient(cx, cy, 2, cx, cy, Math.max(width, height) * 0.62);
      atmosphere.addColorStop(0, `rgba(255, 239, 163, ${0.2 + energy * 0.2})`);
      atmosphere.addColorStop(0.18, `rgba(229, 167, 55, ${0.09 + energy * 0.12})`);
      atmosphere.addColorStop(0.48, "rgba(29, 105, 122, .13)");
      atmosphere.addColorStop(1, "rgba(4, 28, 37, 0)");
      ctx.fillStyle = atmosphere;
      ctx.fillRect(0, 0, width, height);

      // Distant dust adds scale and parallax.
      for (const spark of sparks) {
        spark.angle += spark.speed * (1 + energy * 2.5);
        spark.phase += 0.009;
        const distance = baseRadius * (spark.distance + Math.sin(spark.phase) * 0.12);
        const x = cx + Math.cos(spark.angle) * distance * 1.42;
        const y = cy + Math.sin(spark.angle) * distance * 0.9;
        const pulse = 0.45 + Math.sin(spark.phase * 1.8) * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, spark.size * (1 + energy * 0.7), 0, TAU);
        ctx.fillStyle = `rgba(${spark.distance > 2.4 ? "105, 205, 215" : "255, 220, 126"}, ${spark.alpha * pulse})`;
        ctx.fill();
      }

      // The real time-domain signal becomes a luminous ribbon through the field.
      voiceRibbon(cy, smoothWave);

      // Elliptical energy orbits sit behind and in front of the organism.
      rings.forEach((ring, index) => {
        ring.phase += ring.speed * (1 + energy * 5);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ring.phase);
        ctx.scale(1, 0.42 + index * 0.08);
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * ring.radius * (1 + energy * 0.16), 0, TAU);
        const alpha = 0.08 + energy * 0.12 - index * 0.012;
        ctx.strokeStyle = ring.color === "gold" ? `rgba(255, 219, 121, ${alpha})` : `rgba(107, 214, 222, ${alpha})`;
        ctx.lineWidth = 0.8 + energy * 1.5;
        ctx.shadowBlur = 9 + energy * 16;
        ctx.shadowColor = ring.color === "gold" ? "rgba(255, 203, 82, .5)" : "rgba(76, 183, 198, .4)";
        ctx.stroke();
        ctx.restore();
      });

      // Three fluid membranes create refraction and dimensional depth.
      const membranes = [
        { scale: 1.3, amplitude: 24, fill: "rgba(44, 144, 158, .075)", stroke: "rgba(95, 208, 215, .18)" },
        { scale: 1.08, amplitude: 19, fill: "rgba(245, 177, 55, .12)", stroke: "rgba(255, 217, 118, .24)" },
        { scale: 0.86, amplitude: 13, fill: "rgba(255, 244, 199, .22)", stroke: "rgba(255, 249, 218, .34)" },
      ];
      membranes.forEach((layer, index) => {
        membranePath(cx, cy, baseRadius * layer.scale, smoothBands, index, layer.amplitude);
        ctx.fillStyle = layer.fill;
        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = index === 0 ? 1 : 1.25;
        ctx.shadowBlur = 16 + energy * 28;
        ctx.shadowColor = index === 0 ? "rgba(39, 173, 188, .5)" : "rgba(255, 192, 65, .55)";
        ctx.fill();
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // Hot volumetric core with teal occlusion gives the orb a glass-like body.
      const coreRadius = baseRadius * (0.73 + energy * 0.2);
      const core = ctx.createRadialGradient(cx - coreRadius * 0.24, cy - coreRadius * 0.28, 0, cx, cy, coreRadius);
      core.addColorStop(0, "rgba(255, 255, 250, .99)");
      core.addColorStop(0.2, "rgba(255, 249, 209, .96)");
      core.addColorStop(0.48, "rgba(255, 211, 104, .8)");
      core.addColorStop(0.76, "rgba(224, 151, 43, .3)");
      core.addColorStop(0.92, "rgba(54, 143, 154, .13)");
      core.addColorStop(1, "rgba(26, 91, 105, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, TAU);
      ctx.fill();

      // Moving caustic highlight across the core.
      const causticX = cx + Math.sin(time * 0.012) * coreRadius * 0.28;
      const causticY = cy + Math.cos(time * 0.009) * coreRadius * 0.2;
      const caustic = ctx.createRadialGradient(causticX, causticY, 0, causticX, causticY, coreRadius * 0.5);
      caustic.addColorStop(0, `rgba(255, 255, 255, ${0.38 + energy * 0.35})`);
      caustic.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = caustic;
      ctx.beginPath();
      ctx.arc(causticX, causticY, coreRadius * 0.5, 0, TAU);
      ctx.fill();

      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);

    if (stream && active) {
      const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextCtor) {
        audioContext = new AudioContextCtor();
        source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.78;
        frequencyData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
        timeData = new Uint8Array(new ArrayBuffer(analyser.fftSize));
        source.connect(analyser);
      }
    }
    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.remove();
      try { source?.disconnect(); } catch { /* no-op */ }
      audioContext?.close().catch(() => undefined);
    };
  }, [stream, active]);

  return (
    <div ref={wrapRef} className={`waveform-shell voice-aura-shell ${active ? "is-live" : "is-idle"}`} aria-hidden="true">
      <div className="waveform-caption"><span />{active ? "Voice field live" : "Listening suspended"}</div>
    </div>
  );
}
