import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Volume2, Sparkles, RefreshCw, Eye } from 'lucide-react';
import { audioService } from '../utils/audio';

interface WaveformVisualizerProps {
  className?: string;
  defaultTheme?: 'dark' | 'monochrome';
  viewportClassName?: string;
  children?: React.ReactNode;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  className = '',
  defaultTheme = 'dark',
  viewportClassName,
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(true);
  const [visualizerTheme, setVisualizerTheme] = useState<'dark' | 'monochrome'>(defaultTheme);
  const [scrubX, setScrubX] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [soundAuditioning, setSoundAuditioning] = useState(false);

  // Time accumulator
  const timeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Fixed pseudo-random seeded buffers for consistent organic waveform shapes
  const noiseSeedRef = useRef<number[]>([]);
  if (noiseSeedRef.current.length === 0) {
    const arr: number[] = [];
    for (let i = 0; i < 300; i++) {
      arr.push(Math.sin(i * 12.9898 + 78.233) * 43758.5453 % 1);
    }
    noiseSeedRef.current = arr;
  }

  // Animation rendering function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = width / dpr;
    const cssHeight = height / dpr;

    // Advance time if playing
    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    if (isPlaying) {
      timeRef.current += dt * 1.35;
    }
    const t = timeRef.current;

    // Visual Palette: Dark (Black, Grey, White) with 3 Purple Accents
    const bgColor = '#0b0c10';
    const mainColor = '#f3f4f6';
    const mutedColor = '#c084fc'; // Accent 1: Light Lavender
    const gridLineColor = 'rgba(124, 58, 237, 0.12)'; // Accent 3: Deep Amethyst
    const playheadColor = '#a855f7'; // Accent 2: Vivid Royal Purple

    // Clear canvas
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // Subtle track dividing lines
    const trackHeight = cssHeight / 4;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.strokeStyle = gridLineColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.moveTo(16, i * trackHeight);
      ctx.lineTo(cssWidth - 16, i * trackHeight);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // -------------------------------------------------------------
    // TRACK 1: Dotted / Point-based Vertical Waveform (Granular)
    // -------------------------------------------------------------
    const track1Y = trackHeight * 0.5;
    const numColumns = Math.floor(cssWidth / 8);
    const colSpacing = cssWidth / numColumns;

    for (let i = 0; i < numColumns; i++) {
      const x = i * colSpacing + colSpacing / 2;
      const normalizedX = x / cssWidth;

      // Amplitude envelope with traveling wave bursts (matching video)
      const burst1 = Math.exp(-Math.pow((normalizedX - 0.48 - Math.sin(t * 0.4) * 0.06) / 0.09, 2));
      const burst2 = Math.exp(-Math.pow((normalizedX - 0.65 - Math.sin(t * 0.5) * 0.05) / 0.07, 2));
      const burst3 = Math.exp(-Math.pow((normalizedX - 0.22 - Math.sin(t * 0.3) * 0.04) / 0.08, 2));
      const ambientSwell = Math.sin(normalizedX * 12 + t * 2) * 0.15 + 0.2;

      const rawAmp = (burst1 * 1.1 + burst2 * 0.7 + burst3 * 0.45 + ambientSwell * 0.25);
      const amp = Math.max(0.08, Math.min(rawAmp, 1.25));

      // Calculate number of vertical dots above and below
      const maxDots = Math.floor(amp * 13);
      const dotRadius = 1.25;
      const dotGap = 3.2;

      ctx.fillStyle = mainColor;

      // Center baseline dot
      ctx.beginPath();
      ctx.arc(x, track1Y, dotRadius, 0, Math.PI * 2);
      ctx.fill();

      // Symmetrical vertical dots
      for (let d = 1; d <= maxDots; d++) {
        // Upper dot
        ctx.beginPath();
        ctx.arc(x, track1Y - d * dotGap, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        // Lower dot
        ctx.beginPath();
        ctx.arc(x, track1Y + d * dotGap, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // -------------------------------------------------------------
    // TRACK 2: Pixelated / Stepped Digital Block Waveform
    // -------------------------------------------------------------
    const track2Y = trackHeight * 1.5;
    const blockWidth = 7;
    const numBlocks = Math.floor(cssWidth / blockWidth);

    ctx.fillStyle = mainColor;

    for (let i = 0; i < numBlocks; i++) {
      const x = i * blockWidth;
      const normalizedX = x / cssWidth;

      // Grouped energy blocks
      const cluster1 = Math.exp(-Math.pow((normalizedX - 0.62 + Math.sin(t * 0.6) * 0.04) / 0.11, 2));
      const cluster2 = Math.exp(-Math.pow((normalizedX - 0.35 + Math.cos(t * 0.5) * 0.05) / 0.08, 2));
      const cluster3 = Math.exp(-Math.pow((normalizedX - 0.82) / 0.07, 2));
      const cluster4 = Math.exp(-Math.pow((normalizedX - 0.18) / 0.06, 2));

      // Quantized height steps (pixel blocks of 4px)
      const rawAmp = cluster1 * 1.2 + cluster2 * 0.85 + cluster3 * 0.7 + cluster4 * 0.5 + 0.08;
      const stepUnits = Math.round(rawAmp * 7); // Quantized steps
      const halfHeight = Math.max(2, stepUnits * 4.5);

      ctx.fillRect(x + 0.5, track2Y - halfHeight, blockWidth - 1, halfHeight * 2);
    }

    // -------------------------------------------------------------
    // TRACK 3: Sinusoidal Harmonic Oscillation with Wave Packet
    // -------------------------------------------------------------
    const track3Y = trackHeight * 2.5;

    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2.0;
    ctx.beginPath();

    const step = 2;
    for (let x = 0; x <= cssWidth; x += step) {
      const normalizedX = x / cssWidth;

      // Traveling wave packet envelope (Gaussian bell curve)
      const packetCenter = 0.48 + Math.sin(t * 0.7) * 0.14;
      const packetWidth = 0.12;
      const packetEnvelope = Math.exp(-Math.pow((normalizedX - packetCenter) / packetWidth, 2));

      // Wave oscillation frequency and phase
      const carrierFreq = 34; // dense sine waves
      const carrier = Math.sin(normalizedX * carrierFreq + t * 4);

      // Low residual baseline ripple outside the main packet
      const backgroundRipple = Math.sin(normalizedX * 18 + t * 1.5) * 2.5;

      const yOffset = carrier * (packetEnvelope * 38) + backgroundRipple;
      const y = track3Y + yOffset;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // -------------------------------------------------------------
    // TRACK 4: Jagged Acoustic Transient & Foley Waveform
    // -------------------------------------------------------------
    const track4Y = trackHeight * 3.5;
    const numSamples = Math.floor(cssWidth / 3);
    const sampleWidth = cssWidth / numSamples;

    ctx.fillStyle = mainColor;
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 1.4;

    ctx.beginPath();
    for (let i = 0; i < numSamples; i++) {
      const x = i * sampleWidth;
      const seedIndex = (i + Math.floor(t * 12)) % noiseSeedRef.current.length;
      const randVal = Math.abs(noiseSeedRef.current[seedIndex]);

      const normalizedX = x / cssWidth;
      // Irregular burst zones
      const burstA = Math.exp(-Math.pow((normalizedX - 0.55) / 0.14, 2));
      const burstB = Math.exp(-Math.pow((normalizedX - 0.76) / 0.08, 2));
      const burstC = Math.exp(-Math.pow((normalizedX - 0.28) / 0.12, 2));
      const baseline = 0.18;

      const intensity = Math.min(1.4, (burstA * 1.3 + burstB * 1.1 + burstC * 0.9 + baseline) * (0.35 + randVal * 0.85));
      const spikeHeight = Math.max(3, intensity * 26);

      // Symmetrical vertical acoustic spike with top/bottom contour
      ctx.fillRect(x, track4Y - spikeHeight, 1.8, spikeHeight * 2);
    }

    // -------------------------------------------------------------
    // PLAYHEAD & SCRUB INDICATOR
    // -------------------------------------------------------------
    if (scrubX !== null) {
      ctx.strokeStyle = playheadColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(scrubX, 0);
      ctx.lineTo(scrubX, cssHeight);
      ctx.stroke();

      // Glowing dot at intersection with current track
      ctx.fillStyle = playheadColor;
      ctx.beginPath();
      ctx.arc(scrubX, track1Y, 3.5, 0, Math.PI * 2);
      ctx.arc(scrubX, track2Y, 3.5, 0, Math.PI * 2);
      ctx.arc(scrubX, track3Y, 3.5, 0, Math.PI * 2);
      ctx.arc(scrubX, track4Y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Loop
    animationFrameId.current = requestAnimationFrame(render);
  }, [isPlaying, visualizerTheme, scrubX]);

  // Handle canvas sizing and responsiveness
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [render]);

  // Mouse / Pointer scrub handler
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, currentX / rect.width));
    setScrubX(currentX);

    // Audio feedback on scrub if sound is enabled
    if (audioService.getSoundEnabled() && Math.random() > 0.4) {
      audioService.playScrubTone(fraction);
    }
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setScrubX(null);
  };

  const handleAuditionHeroSound = () => {
    setSoundAuditioning(true);
    audioService.playHeroSoundscape();
    setTimeout(() => setSoundAuditioning(false), 2000);
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-[#262732] shadow-2xl bg-[#0b0c10] transition-all ${className}`}>
      
      {/* Top Console Bar */}
      <div className="px-5 py-3.5 bg-[#13141b]/95 border-b border-[#262732] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7] animate-pulse" />
            <span className="font-halftone font-bold uppercase tracking-wider text-[#f3f4f6]">
              Multi-Channel Waveform Monitor
            </span>
          </div>
          <span className="text-[#9ca3af] hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-[#9ca3af] font-mono hidden sm:inline">
            4-Band Acoustic Synthesis Engine
          </span>
        </div>

        {/* Interactive Bar Tools */}
        <div className="flex items-center gap-2">
          {/* Audition Button */}
          <button
            onClick={handleAuditionHeroSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              soundAuditioning
                ? 'bg-[#a855f7] text-[#0b0c10] shadow-[0_0_18px_rgba(168,85,247,0.45)] hover:bg-[#9333ea]'
                : 'bg-[#1a1b24] hover:bg-[#262732] text-[#f3f4f6] border border-[#262732]'
            }`}
            title="Audition 4-track synthesized acoustic profile"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{soundAuditioning ? 'Auditioning...' : 'Audition Audio'}</span>
          </button>

          {/* Play / Pause Animation */}
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              audioService.playUiBlip();
            }}
            className="p-1.5 rounded-full bg-[#1a1b24] hover:bg-[#262732] text-[#f3f4f6] border border-[#262732] transition-colors"
            title={isPlaying ? 'Pause visualizer wave' : 'Play visualizer wave'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
        </div>
      </div>

      {/* Main Waveform Canvas Viewport */}
      <div className={`relative w-full ${viewportClassName || 'aspect-[21/10] sm:aspect-[21/9] min-h-[280px] max-h-[460px]'}`}>
        <canvas
          ref={canvasRef}
          onPointerEnter={() => setIsHovered(true)}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="w-full h-full block cursor-crosshair"
        />

        {/* Overlay Children (e.g. Headlines with mix-blend-color-dodge) */}
        {children && (
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-12 md:px-16 pointer-events-none">
            {children}
          </div>
        )}

        {/* Channel Labels Overlay (Left Margin) */}
        <div className="absolute top-0 bottom-0 left-4 flex flex-col justify-around py-3 pointer-events-none select-none">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#13141b]/90 text-[#c084fc] border border-[#262732]">
              CH 01
            </span>
            <span className="text-[11px] font-semibold hidden md:inline text-[#9ca3af]">
              Granular Particles (Dots)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#13141b]/90 text-[#c084fc] border border-[#262732]">
              CH 02
            </span>
            <span className="text-[11px] font-semibold hidden md:inline text-[#9ca3af]">
              Quantized Blocks (Digital)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#13141b]/90 text-[#c084fc] border border-[#262732]">
              CH 03
            </span>
            <span className="text-[11px] font-semibold hidden md:inline text-[#9ca3af]">
              Harmonic Sine Wave (Oscillation)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#13141b]/90 text-[#c084fc] border border-[#262732]">
              CH 04
            </span>
            <span className="text-[11px] font-semibold hidden md:inline text-[#9ca3af]">
              Acoustic Foley (Transients)
            </span>
          </div>
        </div>

        {/* Hover Scrubbing Tip */}
        <div className="absolute bottom-3 right-4 pointer-events-none">
          <span className="text-[11px] px-2.5 py-1 rounded-full backdrop-blur-md border bg-[#13141b]/80 border-[#262732] text-[#9ca3af]">
            {scrubX !== null ? 'Scrubbing Audio Stream' : 'Hover / drag to scrub waveform'}
          </span>
        </div>
      </div>

      {/* Bottom Status Telemetry Footer */}
      <div className="px-5 py-2.5 bg-[#13141b]/95 border-t border-[#262732] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#9ca3af]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
            <span>Sample Rate: 96 kHz / 32-bit Float</span>
          </span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span className="hidden sm:inline">True Peak: -0.8 dBTP</span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span className="hidden sm:inline">Loudness: -23 LUFS (EBU R128)</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[#c084fc]">
          <span>REAL-TIME MULTI-TRACK MONITOR</span>
        </div>
      </div>
    </div>
  );
};
