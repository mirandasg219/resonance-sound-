/**
 * Web Audio Engine for Resonance Sound Design
 * Handles base background soundtrack playback (default + custom uploaded audio),
 * real-time FFT frequency analysis, and interactive project pitch tones.
 * Sound remains strictly off until user explicitly clicks "Sound on".
 */

import {
  saveBaseAudioToIndexedDB,
  getBaseAudioFromIndexedDB,
  deleteBaseAudioFromIndexedDB,
} from './audioStorage';

export interface BaseTrackInfo {
  isPlaying: boolean;
  trackName: string;
  isCustom: boolean;
  volume: number;
  size?: number;
}

export type StemId = 'dialogue' | 'music' | 'sfx';

export interface StemConfig {
  id: StemId;
  name: string;
  badge: string;
  category: string;
  volume: number; // 0.0 to 1.2
  muted: boolean;
  solo: boolean;
  pan: number; // -1.0 to 1.0
  color: string;
  freqFocus: string;
}

export interface MixerState {
  isPlaying: boolean;
  masterVolume: number;
  isMasterMuted: boolean;
  activePreset: string | null;
  stems: Record<StemId, StemConfig>;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = false;
  private listeners: Set<(enabled: boolean) => void> = new Set();
  private analyser: AnalyserNode | null = null;

  // Base Audio Soundtrack System
  private baseAudioElement: HTMLAudioElement | null = null;
  private baseAudioSourceNode: MediaElementAudioSourceNode | null = null;
  private baseAudioGain: GainNode | null = null;
  private baseAudioVolume: number = 0.55;
  private baseTrackName: string = 'Resonance Base Soundtrack';
  private isCustomTrack: boolean = false;
  private customBlobUrl: string | null = null;
  private baseTrackListeners: Set<(info: BaseTrackInfo) => void> = new Set();

  // Auxiliary Ambient Sub-Drone Layer
  private ambientGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;

  // Studio Visualizer Sample Track System
  private sampleTrackGain: GainNode | null = null;
  private sampleTrackInterval: number | null = null;
  private currentSampleTrackId: string | null = null;
  private isSampleTrackPlaying: boolean = false;
  private sampleTrackVolume: number = 0.8;
  private activeTrackNodes: (AudioNode | number)[] = [];
  private sampleTrackListeners: Set<(state: { isPlaying: boolean; trackId: string | null; volume: number }) => void> = new Set();

  // --- Dedicated Stem Sound Mixer System ---
  private stemNodes: Record<StemId, {
    gainNode: GainNode;
    pannerNode: StereoPannerNode | PannerNode | null;
    analyserNode: AnalyserNode;
  }> | null = null;
  private masterMixerGain: GainNode | null = null;
  private isMixerPlaying: boolean = false;
  private mixerInterval: number | null = null;
  private mixerBarIndex: number = 0;
  private mixerMasterVolume: number = 0.85;
  private isMasterMuted: boolean = false;
  private activeMixerPreset: string | null = 'balanced';
  private stemStates: Record<StemId, StemConfig> = {
    dialogue: {
      id: 'dialogue',
      name: 'Dialogue / VO',
      badge: 'CH 01',
      category: 'Voiceover & Comms',
      volume: 0.85,
      muted: false,
      solo: false,
      pan: 0,
      color: '#38bdf8',
      freqFocus: '300Hz - 4kHz',
    },
    music: {
      id: 'music',
      name: 'Music Bed',
      badge: 'CH 02',
      category: 'Harmonics & Synth',
      volume: 0.8,
      muted: false,
      solo: false,
      pan: 0,
      color: '#a855f7',
      freqFocus: '40Hz - 16kHz',
    },
    sfx: {
      id: 'sfx',
      name: 'Sound Effects',
      badge: 'CH 03',
      category: 'Impacts & Foley',
      volume: 0.85,
      muted: false,
      solo: false,
      pan: 0,
      color: '#f59e0b',
      freqFocus: '20Hz - 20kHz',
    },
  };
  private mixerListeners: Set<(state: MixerState) => void> = new Set();

  constructor() {
    // Attempt to load stored custom audio from IndexedDB on startup
    if (typeof window !== 'undefined') {
      this.initStoredTrack();
    }
  }

  private async initStoredTrack() {
    try {
      const stored = await getBaseAudioFromIndexedDB();
      if (stored && stored.blob) {
        this.customBlobUrl = URL.createObjectURL(stored.blob);
        this.baseTrackName = stored.name;
        this.isCustomTrack = true;
        if (this.baseAudioElement) {
          this.baseAudioElement.src = this.customBlobUrl;
          this.baseAudioElement.load();
        }
        this.notifyBaseAudio();
      }
    } catch (err) {
      console.warn('Could not restore audio track from storage:', err);
    }
  }

  public subscribe(listener: (enabled: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeBaseAudio(listener: (info: BaseTrackInfo) => void): () => void {
    this.baseTrackListeners.add(listener);
    // Send initial state immediately
    listener(this.getBaseAudioInfo());
    return () => this.baseTrackListeners.delete(listener);
  }

  public subscribeSampleTrack(listener: (state: { isPlaying: boolean; trackId: string | null; volume: number }) => void): () => void {
    this.sampleTrackListeners.add(listener);
    return () => this.sampleTrackListeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.isEnabled));
    this.notifyBaseAudio();
  }

  private notifyBaseAudio() {
    const info = this.getBaseAudioInfo();
    this.baseTrackListeners.forEach((l) => l(info));
  }

  private notifySampleTrack() {
    this.sampleTrackListeners.forEach((l) =>
      l({
        isPlaying: this.isSampleTrackPlaying,
        trackId: this.currentSampleTrackId,
        volume: this.sampleTrackVolume,
      })
    );
  }

  public getSoundEnabled(): boolean {
    return this.isEnabled;
  }

  public getBaseAudioInfo(): BaseTrackInfo {
    return {
      isPlaying: this.isEnabled,
      trackName: this.baseTrackName,
      isCustom: this.isCustomTrack,
      volume: this.baseAudioVolume,
    };
  }

  public getAnalyser(): AnalyserNode | null {
    if (!this.analyser && this.isEnabled) {
      this.ensureContext();
    }
    return this.analyser;
  }

  public ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Analyser Node for Real-Time Visualizers (Waveforms, Studio FFT, Oscilloscope)
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.82;
      this.analyser.connect(this.ctx.destination);

      // Connect Base Audio Element into Web Audio Graph
      this.setupBaseAudioGraph(this.ctx);

      // Connect Sample Track Gain into Analyser
      this.sampleTrackGain = this.ctx.createGain();
      this.sampleTrackGain.gain.setValueAtTime(this.sampleTrackVolume, this.ctx.currentTime);
      this.sampleTrackGain.connect(this.analyser);

      // Connect Stem Mixer Graph into Analyser
      this.setupStemMixerGraph(this.ctx);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private setupBaseAudioGraph(ctx: AudioContext) {
    if (!this.baseAudioElement) {
      this.baseAudioElement = new Audio();
      this.baseAudioElement.crossOrigin = 'anonymous';
      this.baseAudioElement.loop = true;
      this.baseAudioElement.preload = 'auto';
      this.baseAudioElement.src = this.customBlobUrl || '/audio/base-track.wav';
    }

    if (!this.baseAudioSourceNode && this.baseAudioElement) {
      try {
        this.baseAudioSourceNode = ctx.createMediaElementSource(this.baseAudioElement);
        this.baseAudioGain = ctx.createGain();
        this.baseAudioGain.gain.setValueAtTime(0, ctx.currentTime);

        // Pipe base audio into the FFT Analyser node so that all visuals dynamically respond!
        this.baseAudioSourceNode.connect(this.baseAudioGain);
        this.baseAudioGain.connect(this.analyser!);
      } catch (err) {
        console.warn('MediaElementSource initialization notice:', err);
      }
    }
  }

  /**
   * Main Toggle: Sound On / Sound Off
   */
  public toggleSound(): boolean {
    if (this.isEnabled) {
      this.stop();
    } else {
      this.start();
    }
    return this.isEnabled;
  }

  /**
   * Starts base audio playback through the website
   */
  public start() {
    if (this.isEnabled) return;
    try {
      const ctx = this.ensureContext();
      this.isEnabled = true;

      // Play the base audio track
      this.startBaseAudio(ctx);

      // Layer in warm sub-harmonic presence
      this.startAmbientDrone(ctx);

      this.notify();
    } catch (err) {
      console.warn('Audio start error:', err);
    }
  }

  /**
   * Stops base audio playback through the website
   */
  public stop() {
    if (!this.isEnabled) return;
    this.isEnabled = false;

    // Stop base audio with smooth fade-out
    this.stopBaseAudio();

    // Stop ambient sub-drone
    this.stopAmbientDrone();

    // Stop studio sample track if active
    if (this.isSampleTrackPlaying) {
      this.stopSampleTrack();
    }

    // Stop stem mixer demo if active
    if (this.isMixerPlaying) {
      this.stopStemDemoTrack();
    }

    this.notify();
  }

  private startBaseAudio(ctx: AudioContext) {
    if (!this.baseAudioElement) {
      this.setupBaseAudioGraph(ctx);
    }

    if (this.baseAudioElement && this.baseAudioGain) {
      const now = ctx.currentTime;
      this.baseAudioGain.gain.cancelScheduledValues(now);
      this.baseAudioGain.gain.setValueAtTime(this.baseAudioGain.gain.value || 0.0001, now);
      // Smooth fade-in
      this.baseAudioGain.gain.linearRampToValueAtTime(this.baseAudioVolume, now + 0.6);

      this.baseAudioElement.play().catch((err) => {
        console.warn('Audio play request was handled or requires direct user interaction:', err);
      });
    }
  }

  private stopBaseAudio() {
    if (this.baseAudioGain && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        this.baseAudioGain.gain.cancelScheduledValues(now);
        this.baseAudioGain.gain.setValueAtTime(this.baseAudioGain.gain.value, now);
        this.baseAudioGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      } catch {}

      setTimeout(() => {
        if (!this.isEnabled && this.baseAudioElement) {
          this.baseAudioElement.pause();
        }
      }, 380);
    } else if (this.baseAudioElement) {
      this.baseAudioElement.pause();
    }
  }

  /**
   * Load custom audio file (e.g. user-provided MP3/WAV) as the base audio track
   */
  public async loadCustomBaseAudio(file: File): Promise<void> {
    try {
      // 1. Save to IndexedDB for permanent persistence across sessions
      await saveBaseAudioToIndexedDB(file, file.name);

      // 2. Revoke old blob URL if any
      if (this.customBlobUrl) {
        URL.revokeObjectURL(this.customBlobUrl);
      }

      // 3. Create fresh object URL
      this.customBlobUrl = URL.createObjectURL(file);
      this.baseTrackName = file.name;
      this.isCustomTrack = true;

      // 4. Update audio element
      const ctx = this.ensureContext();
      if (!this.baseAudioElement) {
        this.setupBaseAudioGraph(ctx);
      }

      if (this.baseAudioElement) {
        this.baseAudioElement.src = this.customBlobUrl;
        this.baseAudioElement.load();

        if (this.isEnabled) {
          this.startBaseAudio(ctx);
        }
      }

      this.notifyBaseAudio();
    } catch (err) {
      console.error('Failed to load custom base audio:', err);
      throw err;
    }
  }

  /**
   * Reset base audio back to default soundtrack
   */
  public async resetDefaultBaseAudio(): Promise<void> {
    try {
      await deleteBaseAudioFromIndexedDB();

      if (this.customBlobUrl) {
        URL.revokeObjectURL(this.customBlobUrl);
        this.customBlobUrl = null;
      }

      this.baseTrackName = 'Resonance Base Soundtrack';
      this.isCustomTrack = false;

      const ctx = this.ensureContext();
      if (this.baseAudioElement) {
        this.baseAudioElement.src = '/audio/base-track.wav';
        this.baseAudioElement.load();

        if (this.isEnabled) {
          this.startBaseAudio(ctx);
        }
      }

      this.notifyBaseAudio();
    } catch (err) {
      console.error('Failed to reset default base audio:', err);
    }
  }

  public setBaseAudioVolume(vol: number) {
    this.baseAudioVolume = Math.max(0, Math.min(1, vol));
    if (this.baseAudioGain && this.ctx && this.isEnabled) {
      this.baseAudioGain.gain.setValueAtTime(this.baseAudioVolume, this.ctx.currentTime);
    }
    this.notifyBaseAudio();
  }

  private startAmbientDrone(ctx: AudioContext) {
    this.stopAmbientDrone();

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    // Subtle low-end presence
    masterGain.gain.exponentialRampToValueAtTime(0.018, now + 1.2);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, now);
    filter.Q.setValueAtTime(1.0, now);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(110.25, now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(this.analyser || ctx.destination);

    osc1.start(now);
    osc2.start(now);

    this.droneOsc1 = osc1;
    this.droneOsc2 = osc2;
    this.droneFilter = filter;
    this.ambientGain = masterGain;
  }

  private stopAmbientDrone() {
    if (this.ambientGain && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      } catch {}
      const osc1 = this.droneOsc1;
      const osc2 = this.droneOsc2;
      setTimeout(() => {
        try {
          osc1?.stop();
          osc2?.stop();
          osc1?.disconnect();
          osc2?.disconnect();
        } catch {}
      }, 450);
    }
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneFilter = null;
    this.ambientGain = null;
  }

  /**
   * Plays a soft chime tone at project's specific pitch in Hz
   */
  public playProjectTone(pitchHz: number) {
    if (!this.isEnabled) return;
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.0001, now);
      mainGain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(pitchHz * 2.8, now);
      filter.frequency.exponentialRampToValueAtTime(pitchHz * 0.9, now + 1.0);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitchHz, now);

      const shimmerOsc = ctx.createOscillator();
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(pitchHz * 2, now);

      const shimmerGain = ctx.createGain();
      shimmerGain.gain.setValueAtTime(0.04, now);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(filter);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(filter);
      filter.connect(mainGain);
      mainGain.connect(this.analyser || ctx.destination);

      osc.start(now);
      shimmerOsc.start(now);
      osc.stop(now + 1.2);
      shimmerOsc.stop(now + 0.7);
    } catch (e) {
      console.warn('Tone playback error:', e);
    }
  }

  /**
   * Generates a 2-second synthesized sound design preview based on project category
   */
  public playPreviewSoundscape(pitchHz: number, type: 'Game' | 'TV' | 'Film' | 'Electronic Music' | string) {
    if (!this.isEnabled) {
      this.start();
    }
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      if (type === 'Electronic Music') {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(pitchHz, now);
        osc.frequency.linearRampToValueAtTime(pitchHz * 1.5, now + 0.3);
        osc.frequency.linearRampToValueAtTime(pitchHz, now + 0.8);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(3600, now + 0.4);
        filter.frequency.exponentialRampToValueAtTime(500, now + 1.5);
        filter.Q.setValueAtTime(4.5, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.analyser || ctx.destination);

        osc.start(now);
        osc.stop(now + 1.7);
      } else if (type === 'Game') {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(pitchHz * 1.5, now);
        osc.frequency.exponentialRampToValueAtTime(pitchHz * 0.4, now + 0.45);
        osc.frequency.exponentialRampToValueAtTime(pitchHz, now + 0.9);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + 1.2);
        filter.Q.setValueAtTime(4.0, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.analyser || ctx.destination);

        osc.start(now);
        osc.stop(now + 1.4);
      } else if (type === 'Film') {
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(pitchHz * 0.5, now);

        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(pitchHz, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(pitchHz * 2, now);
        filter.frequency.linearRampToValueAtTime(pitchHz * 0.8, now + 1.7);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.analyser || ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.9);
        osc2.stop(now + 1.9);
      } else {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitchHz, now);

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(5, now);

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.04, now);

        const tremoloGain = ctx.createGain();
        tremoloGain.gain.setValueAtTime(0.08, now);

        lfo.connect(lfoGain);
        lfoGain.connect(tremoloGain.gain);

        const envelope = ctx.createGain();
        envelope.gain.setValueAtTime(0.0001, now);
        envelope.gain.linearRampToValueAtTime(0.12, now + 0.2);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

        osc.connect(tremoloGain);
        tremoloGain.connect(envelope);
        envelope.connect(this.analyser || ctx.destination);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + 1.7);
        osc.stop(now + 1.7);
      }
    } catch (err) {
      console.warn('Preview sound error:', err);
    }
  }

  public playUiBlip() {
    if (!this.isEnabled) return;
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.04);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.analyser || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  public playScrubTone(fraction: number) {
    if (!this.isEnabled) return;
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = 140 + fraction * 520;
      osc.type = fraction > 0.6 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.analyser || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  public playHeroSoundscape() {
    if (!this.isEnabled) {
      this.start();
    }
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      // Track 1: Granular particle chimes
      const pOsc = ctx.createOscillator();
      const pGain = ctx.createGain();
      pOsc.type = 'sine';
      pOsc.frequency.setValueAtTime(1760, now);
      pOsc.frequency.exponentialRampToValueAtTime(880, now + 0.8);
      pGain.gain.setValueAtTime(0.0001, now);
      pGain.gain.linearRampToValueAtTime(0.05, now + 0.05);
      pGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      pOsc.connect(pGain);
      pGain.connect(this.analyser || ctx.destination);
      pOsc.start(now);
      pOsc.stop(now + 1.0);

      // Track 2: 8-Bit stepped digital arpeggiation
      const dOsc = ctx.createOscillator();
      const dGain = ctx.createGain();
      dOsc.type = 'square';
      dOsc.frequency.setValueAtTime(220, now + 0.2);
      dOsc.frequency.setValueAtTime(330, now + 0.35);
      dOsc.frequency.setValueAtTime(440, now + 0.5);
      dOsc.frequency.setValueAtTime(293.66, now + 0.7);
      dGain.gain.setValueAtTime(0.0001, now + 0.2);
      dGain.gain.linearRampToValueAtTime(0.04, now + 0.25);
      dGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      dOsc.connect(dGain);
      dGain.connect(this.analyser || ctx.destination);
      dOsc.start(now + 0.2);
      dOsc.stop(now + 1.3);

      // Track 3: Smooth continuous sinusoidal harmonic oscillation
      const sOsc = ctx.createOscillator();
      const sGain = ctx.createGain();
      sOsc.type = 'sine';
      sOsc.frequency.setValueAtTime(110, now);
      sOsc.frequency.linearRampToValueAtTime(165, now + 0.6);
      sOsc.frequency.linearRampToValueAtTime(82.4, now + 1.6);
      sGain.gain.setValueAtTime(0.0001, now);
      sGain.gain.linearRampToValueAtTime(0.08, now + 0.3);
      sGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      sOsc.connect(sGain);
      sGain.connect(this.analyser || ctx.destination);
      sOsc.start(now);
      sOsc.stop(now + 1.9);

      // Track 4: Acoustic transient / foley rumble
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(2.0, now);

      const tOsc = ctx.createOscillator();
      const tGain = ctx.createGain();
      tOsc.type = 'sawtooth';
      tOsc.frequency.setValueAtTime(65, now + 0.1);
      tGain.gain.setValueAtTime(0.0001, now + 0.1);
      tGain.gain.linearRampToValueAtTime(0.06, now + 0.2);
      tGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
      tOsc.connect(filter);
      filter.connect(tGain);
      tGain.connect(this.analyser || ctx.destination);
      tOsc.start(now + 0.1);
      tOsc.stop(now + 1.5);
    } catch (e) {
      console.warn('Hero soundscape error:', e);
    }
  }

  /**
   * Continuous Studio Sample Track Player for Real-Time Visualizer
   */
  public playSampleTrack(trackId: string = 'cinematic') {
    const ctx = this.ensureContext();
    this.stopSampleTrack();

    this.isSampleTrackPlaying = true;
    this.currentSampleTrackId = trackId;
    this.isEnabled = true;
    this.notify();
    this.notifySampleTrack();

    const triggerCycle = () => {
      if (!this.isSampleTrackPlaying || !this.ctx || !this.sampleTrackGain) return;
      const now = this.ctx.currentTime;

      if (trackId === 'cinematic') {
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(75, now);
        subOsc.frequency.exponentialRampToValueAtTime(36, now + 0.6);
        subGain.gain.setValueAtTime(0.35, now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        subOsc.connect(subGain);
        subGain.connect(this.sampleTrackGain);
        subOsc.start(now);
        subOsc.stop(now + 1.3);

        const padOsc = this.ctx.createOscillator();
        const padFilter = this.ctx.createBiquadFilter();
        const padGain = this.ctx.createGain();
        padOsc.type = 'sawtooth';
        padOsc.frequency.setValueAtTime(146.83, now);
        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(400, now);
        padFilter.frequency.exponentialRampToValueAtTime(2200, now + 1.2);
        padFilter.frequency.exponentialRampToValueAtTime(300, now + 2.8);
        padFilter.Q.setValueAtTime(3.5, now);

        padGain.gain.setValueAtTime(0.001, now);
        padGain.gain.linearRampToValueAtTime(0.18, now + 0.4);
        padGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
        padOsc.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(this.sampleTrackGain);
        padOsc.start(now);
        padOsc.stop(now + 3.1);

        const hiOsc = this.ctx.createOscillator();
        const hiGain = this.ctx.createGain();
        hiOsc.type = 'sine';
        hiOsc.frequency.setValueAtTime(587.33, now + 0.5);
        hiGain.gain.setValueAtTime(0.001, now + 0.5);
        hiGain.gain.linearRampToValueAtTime(0.08, now + 0.7);
        hiGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
        hiOsc.connect(hiGain);
        hiGain.connect(this.sampleTrackGain);
        hiOsc.start(now + 0.5);
        hiOsc.stop(now + 2.5);
      } else if (trackId === 'game') {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(110, now);
        bassOsc.frequency.exponentialRampToValueAtTime(55, now + 0.4);
        bassGain.gain.setValueAtTime(0.3, now);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
        bassOsc.connect(bassGain);
        bassGain.connect(this.sampleTrackGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.8);

        const synthOsc = this.ctx.createOscillator();
        const synthFilter = this.ctx.createBiquadFilter();
        const synthGain = this.ctx.createGain();
        synthOsc.type = 'sawtooth';
        synthOsc.frequency.setValueAtTime(329.63, now + 0.2);
        synthFilter.type = 'bandpass';
        synthFilter.frequency.setValueAtTime(1200, now + 0.2);
        synthFilter.Q.setValueAtTime(5, now + 0.2);
        synthGain.gain.setValueAtTime(0.001, now + 0.2);
        synthGain.gain.linearRampToValueAtTime(0.15, now + 0.3);
        synthGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        synthOsc.connect(synthFilter);
        synthFilter.connect(synthGain);
        synthGain.connect(this.sampleTrackGain);
        synthOsc.start(now + 0.2);
        synthOsc.stop(now + 1.3);
      } else {
        const drone = this.ctx.createOscillator();
        const dFilter = this.ctx.createBiquadFilter();
        const dGain = this.ctx.createGain();
        drone.type = 'sawtooth';
        drone.frequency.setValueAtTime(65.41, now);
        dFilter.type = 'lowpass';
        dFilter.frequency.setValueAtTime(250, now);
        dFilter.frequency.linearRampToValueAtTime(900, now + 1.5);
        dFilter.frequency.linearRampToValueAtTime(200, now + 3.2);
        dGain.gain.setValueAtTime(0.01, now);
        dGain.gain.linearRampToValueAtTime(0.2, now + 0.8);
        dGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);
        drone.connect(dFilter);
        dFilter.connect(dGain);
        dGain.connect(this.sampleTrackGain);
        drone.start(now);
        drone.stop(now + 3.5);
      }
    };

    triggerCycle();
    this.sampleTrackInterval = window.setInterval(triggerCycle, 3200);
  }

  public stopSampleTrack() {
    if (this.sampleTrackInterval) {
      clearInterval(this.sampleTrackInterval);
      this.sampleTrackInterval = null;
    }
    if (this.sampleTrackGain && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        this.sampleTrackGain.gain.setValueAtTime(this.sampleTrackGain.gain.value, now);
        this.sampleTrackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        setTimeout(() => {
          if (this.sampleTrackGain && this.ctx) {
            this.sampleTrackGain.gain.setValueAtTime(this.sampleTrackVolume, this.ctx.currentTime);
          }
        }, 280);
      } catch {}
    }
    this.isSampleTrackPlaying = false;
    this.notifySampleTrack();
  }

  public setSampleTrackVolume(vol: number) {
    this.sampleTrackVolume = Math.max(0, Math.min(1, vol));
    if (this.sampleTrackGain && this.ctx) {
      this.sampleTrackGain.gain.setValueAtTime(this.sampleTrackVolume, this.ctx.currentTime);
    }
    this.notifySampleTrack();
  }

  public getSampleTrackPlaying(): boolean {
    return this.isSampleTrackPlaying;
  }

  public getCurrentSampleTrackId(): string | null {
    return this.currentSampleTrackId;
  }

  // --- Test Tone Sequence Generation ---
  private isTestingTone: boolean = false;
  private currentTestStep: TestToneStep | null = null;
  private currentTestStepIndex: number = 0;
  private testCancelSignal: boolean = false;
  private testToneListeners: Set<(state: { isTesting: boolean; step: TestToneStep | null; stepIndex: number; total: number }) => void> = new Set();

  public subscribeTestTone(listener: (state: { isTesting: boolean; step: TestToneStep | null; stepIndex: number; total: number }) => void): () => void {
    this.testToneListeners.add(listener);
    listener({
      isTesting: this.isTestingTone,
      step: this.currentTestStep,
      stepIndex: this.currentTestStepIndex,
      total: TEST_TONE_SEQUENCE.length,
    });
    return () => this.testToneListeners.delete(listener);
  }

  private notifyTestTone() {
    this.testToneListeners.forEach((l) =>
      l({
        isTesting: this.isTestingTone,
        step: this.currentTestStep,
        stepIndex: this.currentTestStepIndex,
        total: TEST_TONE_SEQUENCE.length,
      })
    );
  }

  public async playTestToneSequence(): Promise<void> {
    if (this.isTestingTone) {
      this.stopTestToneSequence();
      return;
    }

    const ctx = this.ensureContext();
    this.isTestingTone = true;
    this.testCancelSignal = false;
    this.currentTestStepIndex = 0;
    this.notifyTestTone();

    try {
      for (let i = 0; i < TEST_TONE_SEQUENCE.length; i++) {
        if (this.testCancelSignal || !this.isTestingTone) break;

        const step = TEST_TONE_SEQUENCE[i];
        this.currentTestStep = step;
        this.currentTestStepIndex = i + 1;
        this.notifyTestTone();

        const now = ctx.currentTime;
        const durSec = step.durationMs / 1000;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(step.freqHz, now);

        // Smooth non-clicking envelope
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.015);
        gain.gain.setValueAtTime(0.22, now + durSec - 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

        osc.connect(gain);
        gain.connect(this.analyser || ctx.destination);

        osc.start(now);
        osc.stop(now + durSec + 0.01);

        await new Promise((resolve) => setTimeout(resolve, step.durationMs + 60));
      }
    } finally {
      this.isTestingTone = false;
      this.currentTestStep = null;
      this.notifyTestTone();
    }
  }

  public stopTestToneSequence() {
    this.testCancelSignal = true;
    this.isTestingTone = false;
    this.currentTestStep = null;
    this.currentTestStepIndex = 0;
    this.notifyTestTone();
  }

  public playSingleFrequency(freqHz: number, durationMs: number = 500) {
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const durSec = durationMs / 1000;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqHz, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
      gain.gain.setValueAtTime(0.22, now + durSec - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durSec);

      osc.connect(gain);
      gain.connect(this.analyser || ctx.destination);

      osc.start(now);
      osc.stop(now + durSec + 0.01);
    } catch (e) {
      console.warn('Single tone error:', e);
    }
  }

  // ==========================================
  // --- SOUND MIXER STEM ENGINE IMPLEMENTATION ---
  // ==========================================

  public subscribeMixer(listener: (state: MixerState) => void): () => void {
    this.mixerListeners.add(listener);
    listener(this.getMixerState());
    return () => this.mixerListeners.delete(listener);
  }

  public getMixerState(): MixerState {
    return {
      isPlaying: this.isMixerPlaying,
      masterVolume: this.mixerMasterVolume,
      isMasterMuted: this.isMasterMuted,
      activePreset: this.activeMixerPreset,
      stems: { ...this.stemStates },
    };
  }

  private notifyMixer() {
    const state = this.getMixerState();
    this.mixerListeners.forEach((l) => l(state));
  }

  public setupStemMixerGraph(ctx: AudioContext) {
    if (this.stemNodes) return;

    this.masterMixerGain = ctx.createGain();
    this.masterMixerGain.gain.setValueAtTime(this.isMasterMuted ? 0 : this.mixerMasterVolume, ctx.currentTime);
    this.masterMixerGain.connect(this.analyser || ctx.destination);

    const stemIds: StemId[] = ['dialogue', 'music', 'sfx'];
    const nodes: Partial<Record<StemId, {
      gainNode: GainNode;
      pannerNode: StereoPannerNode | PannerNode | null;
      analyserNode: AnalyserNode;
    }>> = {};

    stemIds.forEach((id) => {
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(this.stemStates[id].volume, ctx.currentTime);

      let pannerNode: StereoPannerNode | PannerNode | null = null;
      if (typeof ctx.createStereoPanner === 'function') {
        pannerNode = ctx.createStereoPanner();
        pannerNode.pan.setValueAtTime(this.stemStates[id].pan, ctx.currentTime);
      }

      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.72;

      if (pannerNode) {
        gainNode.connect(pannerNode);
        pannerNode.connect(analyserNode);
      } else {
        gainNode.connect(analyserNode);
      }
      analyserNode.connect(this.masterMixerGain!);

      nodes[id] = { gainNode, pannerNode, analyserNode };
    });

    this.stemNodes = nodes as Record<StemId, {
      gainNode: GainNode;
      pannerNode: StereoPannerNode | PannerNode | null;
      analyserNode: AnalyserNode;
    }>;

    this.updateStemGains();
  }

  private updateStemGains() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const hasSolo = Object.values(this.stemStates).some((s) => s.solo);
    const masterEffective = this.isMasterMuted ? 0 : this.mixerMasterVolume;

    if (this.masterMixerGain) {
      this.masterMixerGain.gain.cancelScheduledValues(now);
      this.masterMixerGain.gain.setValueAtTime(this.masterMixerGain.gain.value, now);
      this.masterMixerGain.gain.linearRampToValueAtTime(masterEffective, now + 0.03);
    }

    if (this.stemNodes) {
      (Object.keys(this.stemStates) as StemId[]).forEach((id) => {
        const node = this.stemNodes?.[id];
        if (!node) return;
        const stem = this.stemStates[id];
        let effective = stem.volume;

        if (stem.muted || (hasSolo && !stem.solo)) {
          effective = 0.0001;
        }

        node.gainNode.gain.cancelScheduledValues(now);
        node.gainNode.gain.setValueAtTime(node.gainNode.gain.value, now);
        node.gainNode.gain.linearRampToValueAtTime(effective, now + 0.03);

        if (node.pannerNode && 'pan' in node.pannerNode) {
          node.pannerNode.pan.setValueAtTime(stem.pan, now);
        }
      });
    }
  }

  public setStemVolume(stemId: StemId, vol: number) {
    this.stemStates[stemId].volume = Math.max(0, Math.min(1.2, vol));
    this.activeMixerPreset = null;
    this.updateStemGains();
    this.notifyMixer();
  }

  public setStemPan(stemId: StemId, pan: number) {
    this.stemStates[stemId].pan = Math.max(-1, Math.min(1, pan));
    this.activeMixerPreset = null;
    this.updateStemGains();
    this.notifyMixer();
  }

  public toggleStemMute(stemId: StemId) {
    this.stemStates[stemId].muted = !this.stemStates[stemId].muted;
    this.activeMixerPreset = null;
    this.updateStemGains();
    this.notifyMixer();
    this.playUiBlip();
  }

  public toggleStemSolo(stemId: StemId) {
    this.stemStates[stemId].solo = !this.stemStates[stemId].solo;
    this.activeMixerPreset = null;
    this.updateStemGains();
    this.notifyMixer();
    this.playUiBlip();
  }

  public setMasterMixerVolume(vol: number) {
    this.mixerMasterVolume = Math.max(0, Math.min(1.2, vol));
    this.updateStemGains();
    this.notifyMixer();
  }

  public toggleMasterMute() {
    this.isMasterMuted = !this.isMasterMuted;
    this.updateStemGains();
    this.notifyMixer();
    this.playUiBlip();
  }

  public applyMixerPreset(preset: 'balanced' | 'dialogue' | 'action' | 'music_only' | 'sfx_only') {
    this.activeMixerPreset = preset;
    if (preset === 'balanced') {
      this.stemStates.dialogue.volume = 0.85;
      this.stemStates.dialogue.muted = false;
      this.stemStates.dialogue.solo = false;
      this.stemStates.dialogue.pan = 0;

      this.stemStates.music.volume = 0.8;
      this.stemStates.music.muted = false;
      this.stemStates.music.solo = false;
      this.stemStates.music.pan = -0.2;

      this.stemStates.sfx.volume = 0.85;
      this.stemStates.sfx.muted = false;
      this.stemStates.sfx.solo = false;
      this.stemStates.sfx.pan = 0.25;
    } else if (preset === 'dialogue') {
      this.stemStates.dialogue.volume = 1.05;
      this.stemStates.dialogue.muted = false;
      this.stemStates.dialogue.solo = false;
      this.stemStates.dialogue.pan = 0;

      this.stemStates.music.volume = 0.32;
      this.stemStates.music.muted = false;
      this.stemStates.music.solo = false;
      this.stemStates.music.pan = -0.3;

      this.stemStates.sfx.volume = 0.35;
      this.stemStates.sfx.muted = false;
      this.stemStates.sfx.solo = false;
      this.stemStates.sfx.pan = 0.3;
    } else if (preset === 'action') {
      this.stemStates.dialogue.volume = 0.65;
      this.stemStates.dialogue.muted = false;
      this.stemStates.dialogue.solo = false;
      this.stemStates.dialogue.pan = 0;

      this.stemStates.music.volume = 0.9;
      this.stemStates.music.muted = false;
      this.stemStates.music.solo = false;
      this.stemStates.music.pan = -0.25;

      this.stemStates.sfx.volume = 1.15;
      this.stemStates.sfx.muted = false;
      this.stemStates.sfx.solo = false;
      this.stemStates.sfx.pan = 0.25;
    } else if (preset === 'music_only') {
      this.stemStates.dialogue.volume = 0.85;
      this.stemStates.dialogue.muted = true;
      this.stemStates.dialogue.solo = false;

      this.stemStates.music.volume = 0.95;
      this.stemStates.music.muted = false;
      this.stemStates.music.solo = true;

      this.stemStates.sfx.volume = 0.85;
      this.stemStates.sfx.muted = true;
      this.stemStates.sfx.solo = false;
    } else if (preset === 'sfx_only') {
      this.stemStates.dialogue.volume = 0.85;
      this.stemStates.dialogue.muted = true;
      this.stemStates.dialogue.solo = false;

      this.stemStates.music.volume = 0.8;
      this.stemStates.music.muted = true;
      this.stemStates.music.solo = false;

      this.stemStates.sfx.volume = 1.05;
      this.stemStates.sfx.muted = false;
      this.stemStates.sfx.solo = true;
    }

    this.updateStemGains();
    this.notifyMixer();
    this.playUiBlip();
  }

  public resetMixerFaders() {
    this.activeMixerPreset = 'balanced';
    (Object.keys(this.stemStates) as StemId[]).forEach((id) => {
      this.stemStates[id].volume = 0.85;
      this.stemStates[id].muted = false;
      this.stemStates[id].solo = false;
      this.stemStates[id].pan = 0;
    });
    this.mixerMasterVolume = 0.85;
    this.isMasterMuted = false;
    this.updateStemGains();
    this.notifyMixer();
    this.playUiBlip();
  }

  public toggleStemDemoTrack() {
    if (this.isMixerPlaying) {
      this.stopStemDemoTrack();
    } else {
      this.playStemDemoTrack();
    }
  }

  public playStemDemoTrack() {
    const ctx = this.ensureContext();
    this.setupStemMixerGraph(ctx);

    // Stop sample track if active to prevent clashing
    if (this.isSampleTrackPlaying) {
      this.stopSampleTrack();
    }

    this.isMixerPlaying = true;
    this.isEnabled = true;
    this.mixerBarIndex = 0;
    this.updateStemGains();
    this.notifyMixer();
    this.notify();

    // Trigger immediately
    this.triggerStemBar(ctx, this.mixerBarIndex);

    // Cycle every 2400ms (4 bars = 9.6s continuous progression)
    if (this.mixerInterval) clearInterval(this.mixerInterval);
    this.mixerInterval = window.setInterval(() => {
      if (!this.isMixerPlaying) return;
      this.mixerBarIndex = (this.mixerBarIndex + 1) % 4;
      this.triggerStemBar(ctx, this.mixerBarIndex);
    }, 2400);
  }

  public stopStemDemoTrack() {
    if (this.mixerInterval) {
      clearInterval(this.mixerInterval);
      this.mixerInterval = null;
    }
    this.isMixerPlaying = false;
    this.notifyMixer();
  }

  public cueStem(stemId: StemId) {
    const ctx = this.ensureContext();
    this.setupStemMixerGraph(ctx);
    this.isEnabled = true;
    this.notify();

    if (stemId === 'dialogue') {
      this.synthDialogueComms(ctx, 0);
    } else if (stemId === 'music') {
      this.synthMusicBar(ctx, 0);
    } else {
      this.synthSfxBar(ctx, 0);
    }
  }

  public getStemLevel(stemId: StemId): number {
    if (!this.stemNodes || !this.stemNodes[stemId]) return 0;
    const analyser = this.stemNodes[stemId].analyserNode;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    return Math.min(100, Math.round((rms / 0.32) * 100));
  }

  public getMasterMixerLevel(): { left: number; right: number } {
    if (!this.analyser) return { left: 0, right: 0 };
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    const base = Math.min(100, Math.round((rms / 0.35) * 100));
    return {
      left: Math.min(100, Math.max(0, Math.round(base * 0.98))),
      right: Math.min(100, Math.max(0, Math.round(base * 1.02))),
    };
  }

  private triggerStemBar(ctx: AudioContext, bar: number) {
    if (!this.stemNodes) return;
    this.synthMusicBar(ctx, bar);
    this.synthDialogueComms(ctx, bar);
    this.synthSfxBar(ctx, bar);
  }

  // --- Stem 1: Dialogue Synthetic Formants & Voice Comms ---
  private synthDialogueComms(ctx: AudioContext, bar: number) {
    if (!this.stemNodes) return;
    const now = ctx.currentTime;
    const dest = this.stemNodes.dialogue.gainNode;

    try {
      // 1. Radio squelch chirp
      const squelchOsc = ctx.createOscillator();
      const squelchGain = ctx.createGain();
      squelchOsc.type = 'sine';
      squelchOsc.frequency.setValueAtTime(2400, now);
      squelchOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
      squelchGain.gain.setValueAtTime(0.08, now);
      squelchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      squelchOsc.connect(squelchGain);
      squelchGain.connect(dest);
      squelchOsc.start(now);
      squelchOsc.stop(now + 0.06);

      // 2. Speech-formant vowel resonance synthesis (F1, F2, F3)
      const speechOsc = ctx.createOscillator();
      speechOsc.type = 'sawtooth';
      const f0 = 130 + (bar % 3) * 15;
      speechOsc.frequency.setValueAtTime(f0, now + 0.06);
      speechOsc.frequency.linearRampToValueAtTime(f0 + 25, now + 0.35);
      speechOsc.frequency.linearRampToValueAtTime(f0 - 15, now + 0.85);

      // 3 Parallel vocal formant filters
      const f1 = ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.setValueAtTime(650, now);
      f1.Q.setValueAtTime(5.5, now);

      const f2 = ctx.createBiquadFilter();
      f2.type = 'bandpass';
      f2.frequency.setValueAtTime(1750, now);
      f2.Q.setValueAtTime(6.0, now);

      const f3 = ctx.createBiquadFilter();
      f3.type = 'bandpass';
      f3.frequency.setValueAtTime(2700, now);
      f3.Q.setValueAtTime(7.5, now);

      // Syllable rhythmic gate
      const syllGain = ctx.createGain();
      syllGain.gain.setValueAtTime(0.0001, now + 0.06);
      syllGain.gain.linearRampToValueAtTime(0.28, now + 0.12);
      syllGain.gain.setValueAtTime(0.08, now + 0.28);
      syllGain.gain.linearRampToValueAtTime(0.32, now + 0.38);
      syllGain.gain.setValueAtTime(0.12, now + 0.52);
      syllGain.gain.linearRampToValueAtTime(0.25, now + 0.65);
      syllGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);

      speechOsc.connect(f1);
      speechOsc.connect(f2);
      speechOsc.connect(f3);

      f1.connect(syllGain);
      f2.connect(syllGain);
      f3.connect(syllGain);
      syllGain.connect(dest);

      speechOsc.start(now + 0.06);
      speechOsc.stop(now + 1.2);

      // 3. Optional tactical speech synthesis announcement
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.isMixerPlaying && bar % 2 === 0) {
        const lines = [
          'Resonance dialogue stem verified.',
          'Comms link nominal. Frequency response locked.',
          'Dialogue channel focal priority.',
          'Acoustic stem matrix online.',
        ];
        const line = lines[bar % lines.length];
        try {
          if (!window.speechSynthesis.speaking) {
            const utt = new SpeechSynthesisUtterance(line);
            utt.rate = 1.05;
            utt.pitch = 0.95;
            utt.volume = Math.min(1, this.stemStates.dialogue.volume * (this.stemStates.dialogue.muted ? 0 : 0.6));
            window.speechSynthesis.speak(utt);
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Dialogue synth error:', e);
    }
  }

  // --- Stem 2: Music Bed Harmonics & Arpeggios ---
  private synthMusicBar(ctx: AudioContext, bar: number) {
    if (!this.stemNodes) return;
    const now = ctx.currentTime;
    const dest = this.stemNodes.music.gainNode;

    try {
      // 4-Bar Chord progressions (Fm9 -> Dbmaj7 -> Bbm9 -> C7alt)
      const chordRoots = [43.65, 34.65, 29.14, 32.7]; // Sub Bass F1, Db1, Bb0, C1
      const chordNotes = [
        [174.61, 207.65, 261.63, 311.13], // Fm9 (F3, Ab3, C4, Eb4)
        [138.59, 174.61, 207.65, 261.63], // Dbmaj7 (Db3, F3, Ab3, C4)
        [116.54, 138.59, 174.61, 207.65], // Bbm9 (Bb2, Db3, F3, Ab3)
        [130.81, 164.81, 196.00, 233.08], // C7alt (C3, E3, G3, Bb3)
      ];

      const bassFreq = chordRoots[bar % chordRoots.length];
      const notes = chordNotes[bar % chordNotes.length];

      // 1. Sub Bass
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, now);
      bassGain.gain.setValueAtTime(0.0001, now);
      bassGain.gain.linearRampToValueAtTime(0.35, now + 0.12);
      bassGain.gain.setValueAtTime(0.28, now + 1.6);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.3);

      bassOsc.connect(bassGain);
      bassGain.connect(dest);
      bassOsc.start(now);
      bassOsc.stop(now + 2.35);

      // 2. Pad Chord
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(900, now);
      padFilter.frequency.exponentialRampToValueAtTime(2200, now + 1.1);
      padFilter.frequency.exponentialRampToValueAtTime(800, now + 2.2);
      padFilter.Q.setValueAtTime(2.2, now);

      const padGain = ctx.createGain();
      padGain.gain.setValueAtTime(0.0001, now);
      padGain.gain.linearRampToValueAtTime(0.12, now + 0.35);
      padGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.35);

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq * (1 + (idx - 1.5) * 0.002), now);
        osc.connect(padFilter);
        osc.start(now);
        osc.stop(now + 2.38);
      });

      padFilter.connect(padGain);
      padGain.connect(dest);

      // 3. Arpeggiated chime notes (4 sixteenth-spaced hits)
      const arpOffsets = [0, 0.55, 1.15, 1.75];
      arpOffsets.forEach((offset, idx) => {
        const arpOsc = ctx.createOscillator();
        const arpGain = ctx.createGain();
        arpOsc.type = 'sine';
        const noteIdx = (idx * 2) % notes.length;
        arpOsc.frequency.setValueAtTime(notes[noteIdx] * 2, now + offset);

        arpGain.gain.setValueAtTime(0.0001, now + offset);
        arpGain.gain.linearRampToValueAtTime(0.08, now + offset + 0.02);
        arpGain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.45);

        arpOsc.connect(arpGain);
        arpGain.connect(dest);
        arpOsc.start(now + offset);
        arpOsc.stop(now + offset + 0.48);
      });
    } catch (e) {
      console.warn('Music synth error:', e);
    }
  }

  // --- Stem 3: Sound Effects (Impacts, Sweeps, Foley) ---
  private synthSfxBar(ctx: AudioContext, bar: number) {
    if (!this.stemNodes) return;
    const now = ctx.currentTime;
    const dest = this.stemNodes.sfx.gainNode;

    try {
      if (bar === 0) {
        // Deep cinematic sub-drop impact + reverse noise whoosh
        const dropOsc = ctx.createOscillator();
        const dropGain = ctx.createGain();
        dropOsc.type = 'sine';
        dropOsc.frequency.setValueAtTime(190, now);
        dropOsc.frequency.exponentialRampToValueAtTime(32, now + 1.1);
        dropGain.gain.setValueAtTime(0.0001, now);
        dropGain.gain.linearRampToValueAtTime(0.42, now + 0.04);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);

        dropOsc.connect(dropGain);
        dropGain.connect(dest);
        dropOsc.start(now);
        dropOsc.stop(now + 1.4);

        // Transient crack
        const snapOsc = ctx.createOscillator();
        const snapGain = ctx.createGain();
        snapOsc.type = 'triangle';
        snapOsc.frequency.setValueAtTime(850, now);
        snapOsc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
        snapGain.gain.setValueAtTime(0.2, now);
        snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
        snapOsc.connect(snapGain);
        snapGain.connect(dest);
        snapOsc.start(now);
        snapOsc.stop(now + 0.1);
      } else if (bar === 1) {
        // Mechanical servo clicks & acoustic glass transient
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(1400, now + 0.3);
        clickOsc.frequency.setValueAtTime(2800, now + 0.38);
        clickGain.gain.setValueAtTime(0.0001, now + 0.3);
        clickGain.gain.linearRampToValueAtTime(0.18, now + 0.32);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.44);

        clickOsc.connect(clickGain);
        clickGain.connect(dest);
        clickOsc.start(now + 0.3);
        clickOsc.stop(now + 0.48);

        // Metallic ring
        const ringOsc = ctx.createOscillator();
        const ringGain = ctx.createGain();
        ringOsc.type = 'sine';
        ringOsc.frequency.setValueAtTime(3135.96, now + 0.7); // G7
        ringGain.gain.setValueAtTime(0.0001, now + 0.7);
        ringGain.gain.linearRampToValueAtTime(0.14, now + 0.72);
        ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
        ringOsc.connect(ringGain);
        ringGain.connect(dest);
        ringOsc.start(now + 0.7);
        ringOsc.stop(now + 1.55);
      } else if (bar === 2) {
        // Plasma laser beam sweep & rising particle whoosh
        const laserOsc = ctx.createOscillator();
        const laserFilter = ctx.createBiquadFilter();
        const laserGain = ctx.createGain();

        laserOsc.type = 'sawtooth';
        laserOsc.frequency.setValueAtTime(1800, now + 0.2);
        laserOsc.frequency.exponentialRampToValueAtTime(180, now + 0.7);

        laserFilter.type = 'bandpass';
        laserFilter.frequency.setValueAtTime(2200, now + 0.2);
        laserFilter.frequency.exponentialRampToValueAtTime(450, now + 0.7);
        laserFilter.Q.setValueAtTime(5.5, now);

        laserGain.gain.setValueAtTime(0.0001, now + 0.2);
        laserGain.gain.linearRampToValueAtTime(0.24, now + 0.25);
        laserGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

        laserOsc.connect(laserFilter);
        laserFilter.connect(laserGain);
        laserGain.connect(dest);
        laserOsc.start(now + 0.2);
        laserOsc.stop(now + 0.9);
      } else {
        // Subterranean tectonic seismic rumble + stereo sweep
        const rumbleOsc = ctx.createOscillator();
        const rumbleGain = ctx.createGain();
        rumbleOsc.type = 'sawtooth';
        rumbleOsc.frequency.setValueAtTime(52, now);
        rumbleOsc.frequency.linearRampToValueAtTime(42, now + 1.5);

        const rFilter = ctx.createBiquadFilter();
        rFilter.type = 'lowpass';
        rFilter.frequency.setValueAtTime(140, now);
        rFilter.Q.setValueAtTime(4, now);

        rumbleGain.gain.setValueAtTime(0.0001, now);
        rumbleGain.gain.linearRampToValueAtTime(0.3, now + 0.4);
        rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);

        rumbleOsc.connect(rFilter);
        rFilter.connect(rumbleGain);
        rumbleGain.connect(dest);
        rumbleOsc.start(now);
        rumbleOsc.stop(now + 2.0);
      }
    } catch (e) {
      console.warn('SFX synth error:', e);
    }
  }
}

export interface TestToneStep {
  freqHz: number;
  label: string;
  band: string;
  durationMs: number;
}

export const TEST_TONE_SEQUENCE: TestToneStep[] = [
  { freqHz: 120, label: '120 Hz', band: 'Sub Bass', durationMs: 380 },
  { freqHz: 250, label: '250 Hz', band: 'Low Mid', durationMs: 380 },
  { freqHz: 440, label: '440 Hz', band: 'Reference A4', durationMs: 400 },
  { freqHz: 1000, label: '1 kHz', band: '0VU Calibrated', durationMs: 420 },
  { freqHz: 2500, label: '2.5 kHz', band: 'Upper Mid Presence', durationMs: 380 },
  { freqHz: 5000, label: '5 kHz', band: 'High Brilliance', durationMs: 380 },
];

export const audioService = new AudioEngine();
