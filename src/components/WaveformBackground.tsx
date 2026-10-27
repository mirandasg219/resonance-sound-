import React, { useRef, useEffect } from 'react';
import { audioService } from '../utils/audio';

interface WaveformBackgroundProps {
  opacity?: number;
  interactive?: boolean;
}

type WaveformChannelType = 'dot' | 'block' | 'sine' | 'transient';

interface TrailPoint {
  x: number;
  y: number;
  nx: number; // Normal vector X (perpendicular to trajectory)
  ny: number; // Normal vector Y
  waveType: WaveformChannelType;
  amplitude: number;
  life: number; // 1 down to 0
  index: number;
}

interface SoundwaveSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

export const WaveformBackground: React.FC<WaveformBackgroundProps> = ({
  opacity = 0.45,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking with history
  const mouseRef = useRef<{
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    speed: number;
    active: boolean;
  }>({
    x: -1000,
    y: -1000,
    prevX: -1000,
    prevY: -1000,
    speed: 0,
    active: false,
  });

  // Soundwave trail points following the cursor trajectory
  const trailPointsRef = useRef<TrailPoint[]>([]);
  const trailCounterRef = useRef<number>(0);

  // Micro sparks at the cursor head
  const sparksRef = useRef<SoundwaveSpark[]>([]);

  // Sound state
  const isSoundActiveRef = useRef(false);

  useEffect(() => {
    isSoundActiveRef.current = audioService.getSoundEnabled();
    const unsub = audioService.subscribe((enabled) => {
      isSoundActiveRef.current = enabled;
    });

    const handlePointerMove = (e: MouseEvent) => {
      if (!interactive) return;
      const currentX = e.clientX;
      const currentY = e.clientY + window.scrollY;

      const prevX = mouseRef.current.x === -1000 ? currentX : mouseRef.current.x;
      const prevY = mouseRef.current.y === -1000 ? currentY : mouseRef.current.y;
      const dist = Math.hypot(currentX - prevX, currentY - prevY);

      mouseRef.current = {
        x: currentX,
        y: currentY,
        prevX,
        prevY,
        speed: dist,
        active: true,
      };
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);

    return () => {
      unsub();
      window.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    let lastTimestamp = performance.now();

    // Seeded noise array for Channel 4 organic transients
    const noiseSeeds: number[] = [];
    for (let i = 0; i < 400; i++) {
      noiseSeeds.push(Math.sin(i * 12.9898 + 78.233) * 43758.5453 % 1);
    }

    // Resize handler matching parent container full height & width
    const resizeCanvas = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollHeight = containerRef.current.scrollHeight || document.documentElement.scrollHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(scrollHeight * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${scrollHeight}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Main 60fps render loop
    const render = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const speed = prefersReduced ? 0.2 : (isSoundActiveRef.current ? 1.4 : 0.85);
      time += dt * speed;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Base waveform neutral shading (kept pristine as requested)
      const waveColor = 'rgba(234, 238, 248, ';
      
      // The 3 Purple Accents
      const purpleLight = 'rgba(192, 132, 252, '; // #c084fc - Light Lavender
      const purpleVivid = 'rgba(168, 85, 247, '; // #a855f7 - Vivid Royal Purple
      const purpleDeep = 'rgba(124, 58, 237, ';  // #7c3aed - Deep Amethyst

      // Four track baseline positions distributed across the page height
      const trackPositions = [
        Math.max(220, Math.min(300, height * 0.12)),
        height * 0.36,
        height * 0.62,
        height * 0.86,
      ];

      // Subtle horizontal track guides in muted purple/dark lines
      trackPositions.forEach((y) => {
        ctx.beginPath();
        ctx.strokeStyle = `${purpleDeep}0.12)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 12]);
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // -------------------------------------------------------------
      // 1. TRACK 01: Granular Dotted Vertical Waveform (Hero Upper)
      // -------------------------------------------------------------
      const t1Y = trackPositions[0];
      const dotColumns = Math.floor(width / 9);
      const colWidth = width / dotColumns;

      for (let i = 0; i < dotColumns; i++) {
        const x = i * colWidth + colWidth / 2;
        const normX = x / width;

        const burstA = Math.exp(-Math.pow((normX - 0.45 - Math.sin(time * 0.3) * 0.12) / 0.08, 2));
        const burstB = Math.exp(-Math.pow((normX - 0.72 - Math.sin(time * 0.4) * 0.08) / 0.06, 2));
        const burstC = Math.exp(-Math.pow((normX - 0.22 + Math.cos(time * 0.25) * 0.07) / 0.07, 2));
        const ambient = Math.sin(normX * 14 + time * 1.8) * 0.12 + 0.18;

        let mouseBoost = 0;
        if (mouseRef.current.active) {
          const dist = Math.hypot(x - mouseRef.current.x, t1Y - mouseRef.current.y);
          if (dist < 260) {
            mouseBoost = (1 - dist / 260) * 0.6;
          }
        }

        const amp = Math.min(1.4, (burstA * 1.3 + burstB * 0.85 + burstC * 0.6 + ambient + mouseBoost));
        const maxDots = Math.floor(amp * 16);
        const dotGap = 3.6;

        ctx.fillStyle = `${waveColor}${opacity * (0.6 + amp * 0.4)})`;

        ctx.beginPath();
        ctx.arc(x, t1Y, 1.3, 0, Math.PI * 2);
        ctx.fill();

        for (let d = 1; d <= maxDots; d++) {
          const dotRadius = d > maxDots - 3 ? 1.0 : 1.3;
          ctx.beginPath();
          ctx.arc(x, t1Y - d * dotGap, dotRadius, 0, Math.PI * 2);
          ctx.arc(x, t1Y + d * dotGap, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // -------------------------------------------------------------
      // 2. TRACK 02: Quantized Stepped Digital Blocks (Hero / What We Do)
      // -------------------------------------------------------------
      const t2Y = trackPositions[1];
      const blockWidth = 8;
      const numBlocks = Math.floor(width / blockWidth);

      for (let i = 0; i < numBlocks; i++) {
        const x = i * blockWidth;
        const normX = x / width;

        const cluster1 = Math.exp(-Math.pow((normX - 0.58 + Math.sin(time * 0.5) * 0.06) / 0.1, 2));
        const cluster2 = Math.exp(-Math.pow((normX - 0.32 - Math.cos(time * 0.4) * 0.05) / 0.08, 2));
        const cluster3 = Math.exp(-Math.pow((normX - 0.84) / 0.07, 2));
        const cluster4 = Math.exp(-Math.pow((normX - 0.15) / 0.06, 2));

        let mouseBoost = 0;
        if (mouseRef.current.active) {
          const dist = Math.hypot(x - mouseRef.current.x, t2Y - mouseRef.current.y);
          if (dist < 280) {
            mouseBoost = (1 - dist / 280) * 0.7;
          }
        }

        const amp = cluster1 * 1.25 + cluster2 * 0.9 + cluster3 * 0.7 + cluster4 * 0.5 + 0.1 + mouseBoost;
        const steps = Math.round(amp * 8);
        const halfHeight = Math.max(2, steps * 4.8);

        ctx.fillStyle = `${waveColor}${opacity * (0.55 + Math.min(0.45, amp * 0.3))})`;
        ctx.fillRect(x + 0.5, t2Y - halfHeight, blockWidth - 1, halfHeight * 2);
      }

      // -------------------------------------------------------------
      // 3. TRACK 03: Sinusoidal Harmonic Oscillation with Wave Packet (What We Do / Work)
      // -------------------------------------------------------------
      const t3Y = trackPositions[2];

      ctx.strokeStyle = `${waveColor}${opacity * 1.15})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      const step = 2;
      for (let x = 0; x <= width; x += step) {
        const normX = x / width;

        const packetCenter = 0.5 + Math.sin(time * 0.5) * 0.22;
        const packetWidth = 0.14;
        const packetEnvelope = Math.exp(-Math.pow((normX - packetCenter) / packetWidth, 2));

        let mouseEnvelope = 0;
        if (mouseRef.current.active) {
          const dist = Math.abs(x - mouseRef.current.x);
          if (dist < 220) {
            mouseEnvelope = (1 - dist / 220) * 0.5;
          }
        }

        const carrierFreq = 38;
        const carrier = Math.sin(normX * carrierFreq + time * 3.5);
        const backgroundRipple = Math.sin(normX * 18 + time * 1.2) * 4;

        const amp = (packetEnvelope + mouseEnvelope) * 48;
        const yOffset = carrier * amp + backgroundRipple;
        const y = t3Y + yOffset;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      ctx.strokeStyle = `${purpleVivid}${opacity * 0.35})`;
      ctx.lineWidth = 4.0;
      ctx.stroke();

      // -------------------------------------------------------------
      // 4. TRACK 04: Acoustic Transient Spikes & Foley (Recent Work / CTA)
      // -------------------------------------------------------------
      const t4Y = trackPositions[3];
      const samples = Math.floor(width / 3.2);
      const sampleWidth = width / samples;

      for (let i = 0; i < samples; i++) {
        const x = i * sampleWidth;
        const seedIndex = (i + Math.floor(time * 10)) % noiseSeeds.length;
        const randVal = Math.abs(noiseSeeds[seedIndex]);

        const normX = x / width;
        const burst1 = Math.exp(-Math.pow((normX - 0.52) / 0.15, 2));
        const burst2 = Math.exp(-Math.pow((normX - 0.78) / 0.09, 2));
        const burst3 = Math.exp(-Math.pow((normX - 0.24) / 0.12, 2));

        let mouseBoost = 0;
        if (mouseRef.current.active) {
          const dist = Math.hypot(x - mouseRef.current.x, t4Y - mouseRef.current.y);
          if (dist < 260) {
            mouseBoost = (1 - dist / 260) * 0.8;
          }
        }

        const intensity = Math.min(1.5, (burst1 * 1.3 + burst2 * 1.0 + burst3 * 0.85 + 0.18 + mouseBoost) * (0.35 + randVal * 0.85));
        const spikeHeight = Math.max(3, intensity * 32);

        ctx.fillStyle = `${waveColor}${opacity * (0.55 + intensity * 0.35)})`;
        ctx.fillRect(x, t4Y - spikeHeight, 1.8, spikeHeight * 2);
      }

      // -------------------------------------------------------------
      // 5. MOUSE SOUNDWAVE TRAIL (MORPHS INTO EACH SOUNDWAVE IT PASSES)
      // -------------------------------------------------------------
      if (mouseRef.current.active) {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const prevX = mouseRef.current.prevX;
        const prevY = mouseRef.current.prevY;
        const distMoved = Math.hypot(mx - prevX, my - prevY);

        if (distMoved > 3) {
          // Identify which soundwave channel the cursor is closest to or passing
          const d1 = Math.abs(my - t1Y);
          const d2 = Math.abs(my - t2Y);
          const d3 = Math.abs(my - t3Y);
          const d4 = Math.abs(my - t4Y);

          const minDist = Math.min(d1, d2, d3, d4);
          let activeWaveType: WaveformChannelType = 'dot';
          if (minDist === d1) activeWaveType = 'dot';
          else if (minDist === d2) activeWaveType = 'block';
          else if (minDist === d3) activeWaveType = 'sine';
          else activeWaveType = 'transient';

          // Compute perpendicular normal vector to the motion trajectory
          const dx = mx - prevX;
          const dy = my - prevY;
          const len = Math.hypot(dx, dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;

          const proximityFactor = Math.max(0.4, 1 - minDist / 400);
          const amp = Math.min(26, (distMoved * 0.6 + 6) * proximityFactor);

          trailCounterRef.current += 1;
          trailPointsRef.current.unshift({
            x: mx,
            y: my,
            nx,
            ny,
            waveType: activeWaveType,
            amplitude: amp,
            life: 1.0,
            index: trailCounterRef.current,
          });

          // Cap trail buffer
          if (trailPointsRef.current.length > 55) {
            trailPointsRef.current.pop();
          }

          // Emit small head spark in 3 purple shades
          if (Math.random() > 0.4 && sparksRef.current.length < 30) {
            const purplePalette = ['#c084fc', '#a855f7', '#7c3aed'];
            const sparkColor = purplePalette[Math.floor(Math.random() * purplePalette.length)];
            sparksRef.current.push({
              x: mx,
              y: my,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              color: sparkColor,
              size: 2 + Math.random() * 2,
              life: 1.0,
            });
          }
        }
      }

      // Age & render the trailing soundwave points
      const trail = trailPointsRef.current;
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].life -= dt * 1.7; // fade over ~0.6s
        if (trail[i].life <= 0) {
          trail.splice(i, 1);
        }
      }

      // Render the soundwave trail using the 3 shades of purple defined above:
      // purpleLight (#c084fc), purpleVivid (#a855f7), purpleDeep (#7c3aed)

      // Render the soundwave trail according to each point's waveType
      if (trail.length > 1) {
        for (let i = 0; i < trail.length; i++) {
          const pt = trail[i];
          const alpha = pt.life * 0.95;
          const amp = pt.amplitude * pt.life;

          if (pt.waveType === 'dot') {
            // === TRACK 1: GRANULAR DOTTED WAVE TRAIL (Light Lavender Purple #c084fc) ===
            ctx.fillStyle = `${purpleLight}${alpha})`;
            const numDots = Math.floor(amp / 2.8);

            // Baseline center dot
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.5 * pt.life, 0, Math.PI * 2);
            ctx.fill();

            // Symmetrical vertical/normal dots
            for (let d = 1; d <= numDots; d++) {
              const offset = d * 3.4;
              ctx.beginPath();
              ctx.arc(pt.x + pt.nx * offset, pt.y + pt.ny * offset, 1.25 * pt.life, 0, Math.PI * 2);
              ctx.arc(pt.x - pt.nx * offset, pt.y - pt.ny * offset, 1.25 * pt.life, 0, Math.PI * 2);
              ctx.fill();
            }

          } else if (pt.waveType === 'block') {
            // === TRACK 2: STEPPED DIGITAL BLOCK WAVE TRAIL (Deep Violet #7c3aed with Light Purple border) ===
            ctx.fillStyle = `${purpleDeep}${alpha * 0.85})`;
            const steps = Math.max(1, Math.round((amp / 22) * 5));
            const halfH = steps * 3.8;
            const blockThickness = 4.5 * pt.life;

            ctx.save();
            ctx.translate(pt.x, pt.y);
            const angle = Math.atan2(pt.ny, pt.nx);
            ctx.rotate(angle);
            ctx.fillRect(-blockThickness / 2, -halfH, blockThickness, halfH * 2);
            ctx.strokeStyle = `${purpleLight}${alpha * 0.8})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(-blockThickness / 2, -halfH, blockThickness, halfH * 2);
            ctx.restore();

          } else if (pt.waveType === 'sine') {
            // === TRACK 3: OSCILLATING HARMONIC SINE WAVE TRAIL (Vivid Purple #a855f7) ===
            if (i < trail.length - 1) {
              const nextPt = trail[i + 1];
              const sineOffset1 = Math.sin(pt.index * 0.65 + time * 7) * amp;
              const sineOffset2 = Math.sin(nextPt.index * 0.65 + time * 7) * (nextPt.amplitude * nextPt.life);

              const x1 = pt.x + pt.nx * sineOffset1;
              const y1 = pt.y + pt.ny * sineOffset1;
              const x2 = nextPt.x + nextPt.nx * sineOffset2;
              const y2 = nextPt.y + nextPt.ny * sineOffset2;

              ctx.strokeStyle = `${purpleVivid}${alpha})`;
              ctx.lineWidth = 2.4 * pt.life;
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();

              // Thin central baseline guide in deep violet
              ctx.strokeStyle = `${purpleDeep}${alpha * 0.4})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(pt.x, pt.y);
              ctx.lineTo(nextPt.x, nextPt.y);
              ctx.stroke();
            }

          } else {
            // === TRACK 4: JAGGED ACOUSTIC TRANSIENT SPIKE TRAIL (Deep & Vivid Purple with Light Purple tip) ===
            const randSeed = ((pt.index * 13.37) % 1);
            const spikeLen = amp * (0.5 + randSeed * 1.1);

            ctx.strokeStyle = `${purpleDeep}${alpha})`;
            ctx.lineWidth = 1.8 * pt.life;
            ctx.beginPath();
            ctx.moveTo(pt.x - pt.nx * spikeLen, pt.y - pt.ny * spikeLen);
            ctx.lineTo(pt.x + pt.nx * spikeLen, pt.y + pt.ny * spikeLen);
            ctx.stroke();

            // Light purple transient impact bead
            ctx.fillStyle = `${purpleLight}${alpha})`;
            ctx.beginPath();
            ctx.arc(pt.x + pt.nx * spikeLen, pt.y + pt.ny * spikeLen, 1.4, 0, Math.PI * 2);
            ctx.arc(pt.x - pt.nx * spikeLen, pt.y - pt.ny * spikeLen, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Render micro sparks in 3 purple shades
      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const s = sparksRef.current[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= dt * 2.2;
        if (s.life <= 0) {
          sparksRef.current.splice(i, 1);
          continue;
        }
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.life * 0.9;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [opacity]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </div>
  );
};
