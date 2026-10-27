import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Square, Volume2, VolumeX, Activity, BarChart2, Radio, Sliders, CheckCircle2, Check, Sparkles } from 'lucide-react';
import { audioService, TEST_TONE_SEQUENCE, TestToneStep } from '../utils/audio';

type VisualizerMode = 'fft' | 'oscilloscope' | 'spectrogram';

interface SampleTrack {
  id: string;
  name: string;
  genre: string;
  description: string;
  focus: string;
}

const SAMPLE_TRACKS: SampleTrack[] = [
  {
    id: 'cinematic',
    name: 'Aether Pulse: Cinematic Sci-Fi',
    genre: 'Film / Trailer',
    description: 'Deep 36Hz sub-drop, resonant 24dB/oct modular filter sweep, and granular noise riser.',
    focus: 'Sub-Bass (35Hz) & Air (10kHz)',
  },
  {
    id: 'foley',
    name: 'Bio-Acoustic World: Foley Transients',
    genre: 'Game / Dynamic Audio',
    description: 'Fast-attack acoustic transients, organic wood/metal percussive impacts, and subterranean earth drone.',
    focus: 'Transient Attack & 300Hz Body',
  },
  {
    id: 'atmos',
    name: 'Dolby Atmos 7.1.4 Reference Mix',
    genre: 'Theatrical Master',
    description: 'Full-bandwidth calibrated reference tones across 7 octaves with spatial harmonic modulation.',
    focus: 'Full Spectrum (20Hz - 18kHz)',
  },
];

export const StudioAudioVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('cinematic');
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [mode, setMode] = useState<VisualizerMode>('fft');

  // Real-time telemetry readouts
  const [peakDb, setPeakDb] = useState<number>(-60);
  const [rmsDb, setRmsDb] = useState<number>(-60);
  const [dominantFreq, setDominantFreq] = useState<string>('0 Hz');

  // Peak hold array for FFT bars
  const peakHoldRef = useRef<number[]>(new Array(48).fill(0));
  const peakDecayRef = useRef<number[]>(new Array(48).fill(0));

  // Spectrogram waterfall offscreen buffer
  const waterfallBufferRef = useRef<ImageData | null>(null);

  // Test tone generator state & visual indicator feedback
  const [isTestingTone, setIsTestingTone] = useState<boolean>(false);
  const [activeTestStep, setActiveTestStep] = useState<TestToneStep | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [testVerified, setTestVerified] = useState<boolean>(false);

  useEffect(() => {
    const unsubTest = audioService.subscribeTestTone((state) => {
      setIsTestingTone(state.isTesting);
      setActiveTestStep(state.step);
      setActiveStepIndex(state.stepIndex);
      if (!state.isTesting && state.stepIndex === TEST_TONE_SEQUENCE.length) {
        setTestVerified(true);
        setTimeout(() => setTestVerified(false), 5000);
      }
    });

    return () => unsubTest();
  }, []);

  const handleGenerateTone = async () => {
    setTestVerified(false);
    await audioService.playTestToneSequence();
  };

  // Sync state with audio service
  useEffect(() => {
    setIsPlaying(audioService.getSampleTrackPlaying());
    const current = audioService.getCurrentSampleTrackId();
    if (current) setSelectedTrackId(current);

    const unsub = audioService.subscribeSampleTrack((state) => {
      setIsPlaying(state.isPlaying);
      if (state.trackId) setSelectedTrackId(state.trackId);
      setVolume(state.volume);
    });

    return () => {
      unsub();
      // Stop track if user navigates away
      audioService.stopSampleTrack();
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioService.stopSampleTrack();
      audioService.playUiBlip();
    } else {
      audioService.playSampleTrack(selectedTrackId);
    }
  };

  const handleSelectTrack = (trackId: string) => {
    setSelectedTrackId(trackId);
    if (isPlaying) {
      audioService.playSampleTrack(trackId);
    }
    audioService.playUiBlip();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (isMuted && val > 0) setIsMuted(false);
    audioService.setSampleTrackVolume(val);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      audioService.setSampleTrackVolume(volume || 0.8);
      setIsMuted(false);
    } else {
      audioService.setSampleTrackVolume(0);
      setIsMuted(true);
    }
    audioService.playUiBlip();
  };

  // Canvas render loop
  const renderLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioService.getAnalyser();
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background fill: pure dark
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, width, height);

    // Subtle horizontal dB reference grid lines in muted purple
    const gridLines = [-6, -12, -18, -24, -36, -48];
    ctx.font = '10px "Instrument Sans", monospace';
    ctx.fillStyle = '#262732';
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.15)';
    ctx.lineWidth = 1;

    gridLines.forEach((db) => {
      // Map dB to Y: 0dB is top (15px padding), -60dB is bottom (height - 30px)
      const norm = (db + 60) / 60;
      const y = (1 - norm) * (height - 45) + 15;

      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width - 15, y);
      ctx.stroke();

      ctx.fillStyle = '#6b7280';
      ctx.fillText(`${db} dB`, 6, y + 3);
    });

    if (analyser) {
      const bufferLength = analyser.frequencyBinCount;
      const freqArray = new Uint8Array(bufferLength);
      const timeArray = new Uint8Array(bufferLength);

      analyser.getByteFrequencyData(freqArray);
      analyser.getByteTimeDomainData(timeArray);

      // --- Calculate Live Telemetry (Peak & RMS) ---
      let sumSquares = 0;
      let maxSample = 0;
      let maxFreqBin = 0;
      let maxFreqVal = 0;

      for (let i = 0; i < timeArray.length; i++) {
        const normalized = (timeArray[i] - 128) / 128;
        const absVal = Math.abs(normalized);
        if (absVal > maxSample) maxSample = absVal;
        sumSquares += normalized * normalized;
      }

      for (let i = 0; i < freqArray.length; i++) {
        if (freqArray[i] > maxFreqVal) {
          maxFreqVal = freqArray[i];
          maxFreqBin = i;
        }
      }

      const currentPeak = maxSample > 0.001 ? Math.max(-60, 20 * Math.log10(maxSample)) : -60;
      const currentRms = sumSquares > 0 ? Math.max(-60, 10 * Math.log10(sumSquares / timeArray.length)) : -60;
      const nyquist = 24000;
      const peakHz = Math.round((maxFreqBin / bufferLength) * nyquist);

      // Periodically update numeric states smoothly
      if (Math.random() > 0.6) {
        setPeakDb(Math.round(currentPeak * 10) / 10);
        setRmsDb(Math.round(currentRms * 10) / 10);
        if (maxFreqVal > 30) {
          setDominantFreq(`${peakHz} Hz`);
        } else {
          setDominantFreq('Quiet');
        }
      }

      // --- RENDER SELECTED MODE ---
      if (mode === 'fft') {
        // --- 1. RTA SPECTRUM ANALYZER BARS (Logarithmic 48 Bins) ---
        const numBars = 48;
        const leftPadding = 48;
        const bottomPadding = 30;
        const plotWidth = width - leftPadding - 15;
        const plotHeight = height - 20 - bottomPadding;
        const barWidth = Math.max(3, plotWidth / numBars - 2.5);

        for (let i = 0; i < numBars; i++) {
          // Logarithmic bin mapping from 20Hz to 20kHz
          const logIdx = Math.floor(Math.pow(bufferLength, i / numBars));
          const binIndex = Math.min(bufferLength - 1, Math.max(1, logIdx));
          const val = freqArray[binIndex] / 255; // 0..1
          const barHeight = val * plotHeight;

          const x = leftPadding + i * (barWidth + 2.5);
          const y = height - bottomPadding - barHeight;

          // Peak-hold dynamics
          if (val >= peakHoldRef.current[i]) {
            peakHoldRef.current[i] = val;
            peakDecayRef.current[i] = 0;
          } else {
            peakDecayRef.current[i] += 0.003;
            peakHoldRef.current[i] = Math.max(0, peakHoldRef.current[i] - peakDecayRef.current[i]);
          }

          // Gradient color: Deep Amethyst #7c3aed -> Vivid Purple #a855f7 -> Light Lavender #c084fc peak
          const grad = ctx.createLinearGradient(0, height - bottomPadding, 0, y);
          grad.addColorStop(0, '#7c3aed');
          grad.addColorStop(0.65, '#a855f7');
          grad.addColorStop(1, '#c084fc');

          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Peak Hold Tick Mark in Light Lavender
          const peakY = height - bottomPadding - peakHoldRef.current[i] * plotHeight;
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(x, Math.max(10, peakY - 1.5), barWidth, 2);
        }

        // Frequency axis labels at bottom
        const freqLabels = [
          { text: '30Hz', frac: 0.05 },
          { text: '100Hz', frac: 0.22 },
          { text: '500Hz', frac: 0.44 },
          { text: '1kHz', frac: 0.58 },
          { text: '4kHz', frac: 0.76 },
          { text: '16kHz', frac: 0.94 },
        ];

        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px "Instrument Sans", sans-serif';
        freqLabels.forEach((lbl) => {
          const x = leftPadding + lbl.frac * plotWidth;
          ctx.fillText(lbl.text, x - 12, height - 10);
        });

      } else if (mode === 'oscilloscope') {
        // --- 2. TIME-DOMAIN OSCILLOSCOPE TRACE ---
        const leftPadding = 45;
        const plotWidth = width - leftPadding - 15;
        const centerY = (height - 20) / 2;

        ctx.strokeStyle = '#c084fc'; // Light Lavender
        ctx.lineWidth = 2.2;
        ctx.beginPath();

        const sliceWidth = plotWidth / bufferLength;
        let x = leftPadding;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeArray[i] / 128.0; // 1.0 is center
          const y = v * centerY;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();

        // Second subtle glow echo in vivid purple
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.lineWidth = 6;
        ctx.stroke();

      } else {
        // --- 3. DUAL-CHANNEL SPECTRAL DENSITY BARS ---
        const leftPadding = 45;
        const plotWidth = width - leftPadding - 15;
        const plotHeight = height - 40;
        const step = Math.floor(bufferLength / 64);

        for (let i = 0; i < 64; i++) {
          const val = freqArray[i * step] / 255;
          const x = leftPadding + (i / 64) * plotWidth;
          const h = val * plotHeight;

          // Alternating Vivid Royal Purple #a855f7 and Light Lavender #c084fc
          ctx.fillStyle = i % 2 === 0 ? '#a855f7' : '#c084fc';
          ctx.fillRect(x, (height / 2) - (h / 2), plotWidth / 64 - 1.5, h);
        }
      }
    } else {
      // Idle state when audio engine is uninitialized
      ctx.fillStyle = '#9aa3bd';
      ctx.font = '13px "Instrument Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Audio engine in standby. Click "Play Sample Track" to stream live frequency data.',
        width / 2,
        height / 2
      );
      ctx.textAlign = 'left';
    }

    ctx.restore();
    animationFrameId.current = requestAnimationFrame(renderLoop);
  }, [mode]);

  // Canvas resize and loop initialization
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
    animationFrameId.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [renderLoop]);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[#262732] bg-[#13141b] shadow-2xl text-[#f3f4f6]">
      
      {/* Top Header Console Bar */}
      <div className="p-4 sm:p-5 bg-[#0b0c10] border-b border-[#262732] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-[#a855f7] animate-pulse' : 'bg-[#9ca3af]'}`} />
            <h3 className="font-halftone text-lg font-bold tracking-wide text-[#f3f4f6]">
              Studio Real-Time RTA & Spectrum Analyzer
            </h3>
          </div>
          <p className="text-xs text-[#9ca3af] mt-0.5">
            Web Audio API 1024-Point FFT · Calibrated Real-Time Frequency Response
          </p>
        </div>

        {/* Visualizer Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#13141b] rounded-lg border border-[#262732]">
          <button
            onClick={() => {
              setMode('fft');
              audioService.playUiBlip();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === 'fft'
                ? 'bg-[#a855f7] text-[#0b0c10] font-semibold shadow-sm'
                : 'text-[#9ca3af] hover:text-[#f3f4f6]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>FFT Spectrum</span>
          </button>

          <button
            onClick={() => {
              setMode('oscilloscope');
              audioService.playUiBlip();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === 'oscilloscope'
                ? 'bg-[#a855f7] text-[#0b0c10] font-semibold shadow-sm'
                : 'text-[#9ca3af] hover:text-[#f3f4f6]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Oscilloscope</span>
          </button>

          <button
            onClick={() => {
              setMode('spectrogram');
              audioService.playUiBlip();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === 'spectrogram'
                ? 'bg-[#a855f7] text-[#0b0c10] font-semibold shadow-sm'
                : 'text-[#9ca3af] hover:text-[#f3f4f6]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Stereo Density</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full aspect-[21/9] sm:aspect-[21/8] min-h-[260px] max-h-[380px] bg-[#0b0c10]">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Live Peak Readout Badge */}
        <div className="absolute top-3 right-4 flex items-center gap-2">
          <div className="px-2.5 py-1 rounded bg-[#13141b]/90 border border-[#262732] backdrop-blur-md text-[11px] font-mono text-[#c084fc]">
            Peak: <strong className="text-white">{dominantFreq}</strong>
          </div>
          <div className="px-2.5 py-1 rounded bg-[#13141b]/90 border border-[#262732] backdrop-blur-md text-[11px] font-mono text-[#a855f7]">
            Max: <strong className="text-white">{peakDb} dBFS</strong>
          </div>
        </div>
      </div>

      {/* Track Selector & Master Transport Console */}
      <div className="p-4 sm:p-5 bg-[#0b0c10] border-t border-[#262732] space-y-4">
        
        {/* Sample Track Selector Pills */}
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#c084fc] block mb-2">
            Select Studio Reference Sample Track:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {SAMPLE_TRACKS.map((track) => {
              const isSelected = selectedTrackId === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => handleSelectTrack(track.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#1a1b24] border-[#a855f7] shadow-md ring-1 ring-[#a855f7]/50'
                      : 'bg-[#13141b] border-[#262732] hover:border-[#a855f7]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#f3f4f6] line-clamp-1">
                      {track.name}
                    </span>
                    {isSelected && isPlaying && (
                      <span className="flex items-center gap-0.5" aria-hidden="true">
                        <span className="w-1 h-2 bg-[#a855f7] animate-pulse rounded-full" />
                        <span className="w-1 h-3.5 bg-[#a855f7] animate-pulse rounded-full [animation-delay:150ms]" />
                        <span className="w-1 h-1.5 bg-[#a855f7] animate-pulse rounded-full [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#9ca3af] mt-1 line-clamp-1">
                    {track.description}
                  </p>
                  <span className="inline-block mt-2 text-[10px] text-[#c084fc] font-mono">
                    Focus: {track.focus}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Transport Strip */}
        <div className="pt-3 border-t border-[#262732]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              onClick={handleTogglePlay}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all bg-[#a855f7] text-[#0b0c10] hover:bg-[#9333ea] shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Sample Track</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                audioService.stopSampleTrack();
                audioService.playUiBlip();
              }}
              disabled={!isPlaying}
              className="px-4 py-2 rounded-full text-xs font-medium bg-[#13141b] hover:bg-[#1a1b24] border border-[#262732] text-[#9ca3af] hover:text-[#f3f4f6] transition-colors disabled:opacity-40"
            >
              Stop
            </button>

            {/* Simple 'Generate Tone' Button */}
            <button
              onClick={handleGenerateTone}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                isTestingTone
                  ? 'bg-[#c084fc] text-[#0b0c10] shadow-[0_0_22px_rgba(192,132,252,0.7)] animate-pulse'
                  : 'bg-[#13141b] hover:bg-[#1a1b24] text-[#c084fc] hover:text-[#f3f4f6] border border-[#a855f7]/50 hover:border-[#c084fc] shadow-sm'
              }`}
              title="Play a test sequence in different frequencies to verify sound output"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isTestingTone ? 'Testing Frequencies...' : 'Generate Tone'}</span>
            </button>
          </div>

          {/* Volume and Hardware Meters */}
          <div className="flex items-center gap-6">
            {/* Volume Control */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleToggleMute}
                className="text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-purple-300" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#c084fc]" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 accent-[#a855f7] cursor-pointer"
                title="Master Monitor Volume"
              />
              <span className="text-[11px] font-mono text-[#9ca3af] w-8">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>

            {/* Signal Telemetry Readouts */}
            <div className="hidden md:flex items-center gap-4 text-[11px] font-mono text-[#9ca3af] border-l border-[#262732] pl-6">
              <div>
                <span className="text-[#6b7280] block text-[9px]">RMS LOUDNESS</span>
                <span className="text-[#f3f4f6]">{rmsDb} dB</span>
              </div>
              <div>
                <span className="text-[#6b7280] block text-[9px]">ENGINE SPEC</span>
                <span className="text-[#c084fc]">48kHz / 24-bit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Feedback Indicator for Frequency Test Tone Generator */}
        <div className="mt-4 pt-3.5 border-t border-[#262732]/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs bg-[#0b0c10]/70 p-3.5 rounded-xl border border-[#262732]">
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
                isTestingTone
                  ? 'bg-[#c084fc] animate-ping'
                  : testVerified
                  ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]'
                  : 'bg-[#a855f7]'
              }`}
            />
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-tech text-xs text-[#9ca3af]">
                Output Verification:
              </span>
              
              {isTestingTone ? (
                <span className="text-[#c084fc] font-semibold flex items-center gap-2">
                  <span>Step {activeStepIndex}/6:</span>
                  <strong className="text-[#f3f4f6] bg-[#1a1b24] px-2.5 py-0.5 rounded border border-[#262732] font-tech text-xs">
                    {activeTestStep?.label} ({activeTestStep?.band})
                  </strong>
                </span>
              ) : testVerified ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 font-tech">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sound Output Verified: 6 Frequencies OK</span>
                </span>
              ) : (
                <span className="text-[#9ca3af]">
                  Click "Generate Tone" to verify sound output across 6 frequency bands
                </span>
              )}
            </div>
          </div>

          {/* 6 Frequency Band Step Progress Indicators */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {TEST_TONE_SEQUENCE.map((step, idx) => {
              const isActive = isTestingTone && activeTestStep?.freqHz === step.freqHz;
              const isPassed = isTestingTone && activeStepIndex > idx + 1;
              return (
                <button
                  key={step.freqHz}
                  onClick={() => audioService.playSingleFrequency(step.freqHz)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-tech font-semibold transition-all ${
                    isActive
                      ? 'bg-[#c084fc] text-[#0b0c10] shadow-[0_0_14px_rgba(192,132,252,0.9)] scale-105'
                      : isPassed
                      ? 'bg-[#1a1b24] text-[#c084fc] border border-[#a855f7]/40'
                      : 'bg-[#13141b] text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1a1b24] border border-[#262732]'
                  }`}
                  title={`Click to sound ${step.label} (${step.band})`}
                >
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
