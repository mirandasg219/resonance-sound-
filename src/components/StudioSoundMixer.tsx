import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sliders,
  Play,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Headphones,
  Radio,
  Music2,
  Zap,
  Mic,
  Activity,
  Layers,
} from 'lucide-react';
import {
  audioService,
  StemId,
  StemConfig,
  MixerState,
} from '../utils/audio';

// Helper to convert linear volume (0..1.2) to dB string
function volumeToDb(vol: number): string {
  if (vol <= 0.001) return '-inf dB';
  const db = 20 * Math.log10(vol);
  const rounded = Math.round(db * 10) / 10;
  return rounded > 0 ? `+${rounded} dB` : `${rounded} dB`;
}

// 12-Segment LED Meter component
interface LedMeterProps {
  level: number; // 0..100
  color: string;
}

const LedMeter: React.FC<LedMeterProps> = ({ level, color }) => {
  const segments = 12;
  return (
    <div className="flex flex-col-reverse gap-[2px] w-3 h-44 bg-[#0a0b0e] p-[2px] rounded border border-[#1f212a]">
      {Array.from({ length: segments }).map((_, i) => {
        const threshold = ((i + 1) / segments) * 100;
        const isActive = level >= threshold;

        // Top 2 are Red (peaks), next 3 are Amber/Yellow, bottom 7 are Green or Channel Color
        let activeColor = '#22c55e'; // Green
        if (i >= segments - 2) {
          activeColor = '#ef4444'; // Red peak
        } else if (i >= segments - 5) {
          activeColor = '#f59e0b'; // Amber warning
        } else {
          activeColor = color;
        }

        return (
          <div
            key={i}
            className="w-full flex-1 rounded-[1px] transition-all duration-75"
            style={{
              backgroundColor: isActive ? activeColor : '#161821',
              boxShadow: isActive ? `0 0 4px ${activeColor}99` : 'none',
              opacity: isActive ? 1 : 0.35,
            }}
          />
        );
      })}
    </div>
  );
};

export const StudioSoundMixer: React.FC = () => {
  const [mixerState, setMixerState] = useState<MixerState>(audioService.getMixerState());
  const [stemLevels, setStemLevels] = useState<Record<StemId, number>>({
    dialogue: 0,
    music: 0,
    sfx: 0,
  });
  const [masterLevel, setMasterLevel] = useState<{ left: number; right: number }>({ left: 0, right: 0 });

  // Track animation frame for live VU meter polling
  const meterAnimRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = audioService.subscribeMixer((state) => {
      setMixerState(state);
    });

    const updateMeters = () => {
      if (mixerState.isPlaying) {
        setStemLevels({
          dialogue: audioService.getStemLevel('dialogue'),
          music: audioService.getStemLevel('music'),
          sfx: audioService.getStemLevel('sfx'),
        });
        setMasterLevel(audioService.getMasterMixerLevel());
      } else {
        setStemLevels({ dialogue: 0, music: 0, sfx: 0 });
        setMasterLevel({ left: 0, right: 0 });
      }
      meterAnimRef.current = requestAnimationFrame(updateMeters);
    };

    meterAnimRef.current = requestAnimationFrame(updateMeters);

    return () => {
      unsub();
      if (meterAnimRef.current) {
        cancelAnimationFrame(meterAnimRef.current);
      }
    };
  }, [mixerState.isPlaying]);

  const handleTogglePlay = () => {
    audioService.toggleStemDemoTrack();
  };

  const handleStop = () => {
    audioService.stopStemDemoTrack();
    audioService.playUiBlip();
  };

  const handleVolumeChange = (stemId: StemId, vol: number) => {
    audioService.setStemVolume(stemId, vol);
  };

  const handlePanChange = (stemId: StemId, pan: number) => {
    audioService.setStemPan(stemId, pan);
  };

  const handleMuteToggle = (stemId: StemId) => {
    audioService.toggleStemMute(stemId);
  };

  const handleSoloToggle = (stemId: StemId) => {
    audioService.toggleStemSolo(stemId);
  };

  const handleMasterVolumeChange = (vol: number) => {
    audioService.setMasterMixerVolume(vol);
  };

  const handleMasterMuteToggle = () => {
    audioService.toggleMasterMute();
  };

  const handleCue = (stemId: StemId) => {
    audioService.cueStem(stemId);
  };

  const handleResetFaders = () => {
    audioService.resetMixerFaders();
  };

  const handlePreset = (preset: 'balanced' | 'dialogue' | 'action' | 'music_only' | 'sfx_only') => {
    audioService.applyMixerPreset(preset);
  };

  const stemsList: StemId[] = ['dialogue', 'music', 'sfx'];

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[#262732] bg-[#10121a] shadow-2xl text-[#f3f4f6]">
      {/* Top Mixer Console Header Bar */}
      <div className="p-4 sm:p-6 bg-[#0b0c10] border-b border-[#262732] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                mixerState.isPlaying
                  ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse'
                  : 'bg-[#6b7280]'
              }`}
            />
            <h2 className="font-halftone text-xl sm:text-2xl font-bold tracking-wide text-[#f3f4f6]">
              Resonance Multi-Stem Sound Mixer
            </h2>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-tech font-bold uppercase tracking-widest bg-[#1f212d] border border-[#3b3e54] text-[#c084fc]">
              3-Stem Hardware Matrix
            </span>
          </div>
          <p className="text-xs text-[#9ca3af] mt-1">
            Drag virtual faders to balance Dialogue, Music, and SFX stems in real time. Solo, mute, pan, and verify calibrated stem separation.
          </p>
        </div>

        {/* Master Transport & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleTogglePlay}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
              mixerState.isPlaying
                ? 'bg-[#c084fc] text-[#0b0c10] shadow-[0_0_22px_rgba(192,132,252,0.6)] font-bold'
                : 'bg-[#a855f7] text-[#0b0c10] hover:bg-[#9333ea] shadow-[0_0_18px_rgba(168,85,247,0.4)]'
            }`}
          >
            {mixerState.isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Pause Demo Track</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Demo Track</span>
              </>
            )}
          </button>

          <button
            onClick={handleStop}
            disabled={!mixerState.isPlaying}
            className="px-4 py-2.5 rounded-full text-xs font-medium bg-[#161822] hover:bg-[#1f212e] border border-[#262732] text-[#9ca3af] hover:text-[#f3f4f6] transition-colors disabled:opacity-40"
          >
            Stop
          </button>

          <button
            onClick={handleResetFaders}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-medium bg-[#161822] hover:bg-[#1f212e] border border-[#262732] text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
            title="Reset all faders to unity gain (0.0 dB)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#c084fc]" />
            <span>Reset Faders</span>
          </button>
        </div>
      </div>

      {/* Preset Mixer Scenes Ribbon */}
      <div className="px-4 sm:px-6 py-3 bg-[#0d0f15] border-b border-[#262732] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#9ca3af]">
          <Layers className="w-3.5 h-3.5 text-[#c084fc]" />
          <span className="font-tech text-xs uppercase tracking-wider text-[#c084fc]">Mix Presets:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'balanced', label: 'Balanced Mix' },
            { id: 'dialogue', label: 'Dialogue Focus' },
            { id: 'action', label: 'Action Trailer' },
            { id: 'music_only', label: 'Music Bed Only' },
            { id: 'sfx_only', label: 'SFX & Foley' },
          ].map((preset) => {
            const isSelected = mixerState.activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePreset(preset.id as any)}
                className={`px-3 py-1 rounded-full text-[11px] font-tech font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#a855f7] text-[#0b0c10] shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                    : 'bg-[#151722] text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#1c1e2c] border border-[#262732]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Channel Strips Console Surface */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Stem 1: Dialogue, Stem 2: Music, Stem 3: SFX */}
        {stemsList.map((stemId) => {
          const stem = mixerState.stems[stemId];
          const level = stemLevels[stemId];
          const hasAnySolo = Object.values(mixerState.stems).some((s) => s.solo);
          const isSilenced = stem.muted || (hasAnySolo && !stem.solo);

          const icon =
            stemId === 'dialogue' ? (
              <Mic className="w-4 h-4" />
            ) : stemId === 'music' ? (
              <Music2 className="w-4 h-4" />
            ) : (
              <Zap className="w-4 h-4" />
            );

          return (
            <div
              key={stemId}
              className={`rounded-xl border transition-all p-4 bg-[#141620] flex flex-col justify-between ${
                isSilenced
                  ? 'border-[#262732] opacity-75'
                  : stem.solo
                  ? 'border-[#38bdf8] shadow-[0_0_16px_rgba(56,189,248,0.25)] ring-1 ring-[#38bdf8]/40'
                  : 'border-[#262732] hover:border-[#3b3e54]'
              }`}
            >
              {/* Channel Header Strip */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#262732]">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${stem.color}15`,
                        color: stem.color,
                        border: `1px solid ${stem.color}35`,
                      }}
                    >
                      {icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider block" style={{ color: stem.color }}>
                        {stem.badge}
                      </span>
                      <h4 className="font-futuristic text-sm font-bold text-[#f3f4f6] line-clamp-1">
                        {stem.name}
                      </h4>
                    </div>
                  </div>

                  {/* Cue Audition Button */}
                  <button
                    onClick={() => handleCue(stemId)}
                    className="px-2 py-1 rounded text-[10px] font-tech font-bold uppercase tracking-wider bg-[#1c1f2d] hover:bg-[#25293c] border border-[#2f3348] text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"
                    title={`Audition 1-second sample of ${stem.name}`}
                  >
                    Audition
                  </button>
                </div>

                {/* Subcategory & Target Range */}
                <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-[#9ca3af]">
                  <span>{stem.category}</span>
                  <span className="text-[#6b7280]">{stem.freqFocus}</span>
                </div>

                {/* Stereo Pan Control */}
                <div className="mt-4 pt-3 border-t border-[#262732]/70">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1 text-[#9ca3af]">
                    <span>PAN</span>
                    <span className="text-[#f3f4f6]">
                      {stem.pan === 0
                        ? '< C >'
                        : stem.pan < 0
                        ? `L ${Math.round(Math.abs(stem.pan) * 100)}%`
                        : `R ${Math.round(stem.pan * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={stem.pan}
                    onChange={(e) => handlePanChange(stemId, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-[#0a0b0e] rounded-lg appearance-none cursor-pointer accent-[#c084fc]"
                    title="Stereo Pan"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-[#6b7280] mt-0.5">
                    <span>L</span>
                    <span>C</span>
                    <span>R</span>
                  </div>
                </div>

                {/* Solo & Mute Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => handleSoloToggle(stemId)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
                      stem.solo
                        ? 'bg-[#eab308] text-[#0b0c10] border-[#eab308] shadow-[0_0_12px_rgba(234,179,8,0.5)]'
                        : 'bg-[#181a24] text-[#9ca3af] hover:text-[#f3f4f6] border-[#262732] hover:bg-[#1f212d]'
                    }`}
                    title="Solo Stem"
                  >
                    SOLO (S)
                  </button>

                  <button
                    onClick={() => handleMuteToggle(stemId)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
                      stem.muted
                        ? 'bg-[#ef4444] text-[#ffffff] border-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                        : 'bg-[#181a24] text-[#9ca3af] hover:text-[#f3f4f6] border-[#262732] hover:bg-[#1f212d]'
                    }`}
                    title="Mute Stem"
                  >
                    MUTE (M)
                  </button>
                </div>
              </div>

              {/* Fader & LED Meter Section */}
              <div className="mt-6 pt-4 border-t border-[#262732] flex items-center justify-center gap-4">
                {/* Visual dB Scale Markings */}
                <div className="flex flex-col justify-between h-44 text-[9px] font-mono text-[#6b7280] select-none text-right">
                  <span>+6</span>
                  <span>+3</span>
                  <span className="text-[#c084fc] font-bold">0</span>
                  <span>-6</span>
                  <span>-12</span>
                  <span>-24</span>
                  <span>-inf</span>
                </div>

                {/* Vertical Slider Track Container */}
                <div className="relative h-44 w-10 flex items-center justify-center bg-[#0a0b0e] rounded-xl border border-[#1f212a] p-1">
                  {/* Unity (0 dB) Center Reference Line */}
                  <div className="absolute top-[28%] left-1 right-1 h-[1px] bg-[#c084fc]/50 pointer-events-none" />

                  {/* Rotated Input Range as Tactile Hardware Fader */}
                  <input
                    type="range"
                    min="0"
                    max="1.2"
                    step="0.01"
                    value={stem.volume}
                    onChange={(e) => handleVolumeChange(stemId, parseFloat(e.target.value))}
                    className="w-40 -rotate-90 origin-center cursor-pointer appearance-none bg-transparent fader-slider"
                    style={{ accentColor: stem.color }}
                    title={`${stem.name} Fader`}
                  />
                </div>

                {/* Live Real-Time Peak LED VU Meter */}
                <div className="flex flex-col items-center">
                  <LedMeter level={isSilenced ? 0 : level} color={stem.color} />
                  <span className="text-[8px] font-mono text-[#6b7280] mt-1">PEAK</span>
                </div>
              </div>

              {/* Numeric Readout Badge */}
              <div className="mt-4 pt-3 border-t border-[#262732]/80 flex items-center justify-between text-xs font-mono">
                <span className="text-[#9ca3af]">LEVEL</span>
                <span
                  className="font-bold px-2 py-0.5 rounded bg-[#0b0c10] border border-[#262732]"
                  style={{ color: stem.color }}
                >
                  {isSilenced ? 'MUTED' : volumeToDb(stem.volume)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Channel 4: Master Output Bus Strip */}
        <div className="rounded-xl border border-[#7c3aed]/50 bg-gradient-to-b from-[#181528] to-[#12131d] p-4 flex flex-col justify-between shadow-lg">
          <div>
            {/* Master Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#262732]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#a855f7]/20 border border-[#a855f7]/40 text-[#c084fc] flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#c084fc] block">
                    MASTER BUS
                  </span>
                  <h4 className="font-futuristic text-sm font-bold text-[#f3f4f6]">
                    Stereo Output
                  </h4>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-[#231e3d] text-[#c084fc] border border-[#3b335c]">
                24-bit / 48k
              </span>
            </div>

            {/* Spec readout */}
            <div className="mt-2 text-[10px] font-mono text-[#9ca3af] flex justify-between">
              <span>Main Console Out</span>
              <span className="text-[#a855f7]">0 VU Calibrated</span>
            </div>

            {/* Master Mute Button */}
            <div className="mt-5">
              <button
                onClick={handleMasterMuteToggle}
                className={`w-full py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
                  mixerState.isMasterMuted
                    ? 'bg-[#ef4444] text-[#ffffff] border-[#ef4444] shadow-[0_0_14px_rgba(239,68,68,0.5)]'
                    : 'bg-[#1e1b2e] text-[#c084fc] hover:text-[#f3f4f6] border-[#3b335c] hover:bg-[#25223a]'
                }`}
                title="Master Mute Toggle"
              >
                {mixerState.isMasterMuted ? 'MASTER MUTED' : 'MASTER MUTE (ALL)'}
              </button>
            </div>
          </div>

          {/* Master Fader & Stereo Dual LED Meter */}
          <div className="mt-6 pt-4 border-t border-[#262732] flex items-center justify-center gap-4">
            {/* dB Scale */}
            <div className="flex flex-col justify-between h-44 text-[9px] font-mono text-[#6b7280] select-none text-right">
              <span>+6</span>
              <span>+3</span>
              <span className="text-[#c084fc] font-bold">0</span>
              <span>-6</span>
              <span>-12</span>
              <span>-24</span>
              <span>-inf</span>
            </div>

            {/* Vertical Slider Track Container */}
            <div className="relative h-44 w-10 flex items-center justify-center bg-[#0a0b0e] rounded-xl border border-[#3b335c] p-1">
              <div className="absolute top-[28%] left-1 right-1 h-[1px] bg-[#c084fc] pointer-events-none" />
              <input
                type="range"
                min="0"
                max="1.2"
                step="0.01"
                value={mixerState.masterVolume}
                onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                className="w-40 -rotate-90 origin-center cursor-pointer appearance-none bg-transparent fader-slider"
                style={{ accentColor: '#c084fc' }}
                title="Master Output Fader"
              />
            </div>

            {/* Stereo Dual LED VU Meter (L & R) */}
            <div className="flex flex-col items-center">
              <div className="flex gap-1">
                <LedMeter level={mixerState.isMasterMuted ? 0 : masterLevel.left} color="#c084fc" />
                <LedMeter level={mixerState.isMasterMuted ? 0 : masterLevel.right} color="#c084fc" />
              </div>
              <div className="flex justify-between w-full text-[8px] font-mono text-[#6b7280] mt-1 px-0.5">
                <span>L</span>
                <span>R</span>
              </div>
            </div>
          </div>

          {/* Master Numeric Readout */}
          <div className="mt-4 pt-3 border-t border-[#262732]/80 flex items-center justify-between text-xs font-mono">
            <span className="text-[#9ca3af]">MASTER GAIN</span>
            <span className="font-bold px-2 py-0.5 rounded bg-[#0b0c10] border border-[#3b335c] text-[#c084fc]">
              {mixerState.isMasterMuted ? 'MUTED' : volumeToDb(mixerState.masterVolume)}
            </span>
          </div>
        </div>
      </div>

      {/* Mixer Console Footer Tip */}
      <div className="p-4 bg-[#0a0b0e] border-t border-[#262732] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9ca3af]">
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-[#c084fc] shrink-0" />
          <span>
            Pro tip: Click <strong className="text-[#f3f4f6]">SOLO</strong> on any stem to isolate dialogue or sound design transients, or select preset mixes above.
          </span>
        </div>
        <div className="font-tech text-[11px] text-[#c084fc] flex items-center gap-2">
          <span>REAL-TIME MULTI-STEM WEB AUDIO API ENGINE</span>
        </div>
      </div>
    </div>
  );
};
