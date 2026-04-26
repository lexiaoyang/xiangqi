import { DEFAULT_REMOTE_CONFIG } from "./config";
import { PLATFORM_STORAGE_KEYS, readAudioSettingsCache, writeAudioSettingsCache, writeCache } from "./storage";
import type { AnalyticsEvent, AudioConfig, AudioContextKey, AudioCueId, AudioSettings } from "./types";

export const defaultAudioSettings = (config: AudioConfig = DEFAULT_REMOTE_CONFIG.audio): AudioSettings => ({
  musicEnabled: true,
  sfxEnabled: true,
  muted: false,
  volume: config.defaultVolume,
  unlocked: false,
  updatedAt: new Date().toISOString()
});

export function loadAudioSettings(config: AudioConfig = DEFAULT_REMOTE_CONFIG.audio): AudioSettings {
  return readAudioSettingsCache() ?? defaultAudioSettings(config);
}

export function saveAudioSettings(settings: AudioSettings): AudioSettings {
  return writeAudioSettingsCache({ ...settings, updatedAt: new Date().toISOString() });
}

type AudioLikeContext = {
  createOscillator: () => OscillatorNode;
  createGain: () => GainNode;
  createBuffer: (numberOfChannels: number, length: number, sampleRate: number) => AudioBuffer;
  createBufferSource: () => AudioBufferSourceNode;
  destination: AudioDestinationNode;
  currentTime: number;
  sampleRate: number;
  resume?: () => Promise<void>;
  close?: () => Promise<void>;
};

type BgmPalette = {
  roots: number[];
  chords: number[][];
  bpm: number;
  lead: number[];
  energy: number;
  arrangement: "home-lobby" | "adventure-gameplay" | "support";
};

export const BGM_DURATION_SEC = 60;
export const HOME_LOOP_DURATION_SEC = 60;

const BGM_PALETTES: Record<AudioContextKey, BgmPalette> = {
  home: {
    roots: [130.81, 174.61, 196, 164.81],
    chords: [
      [261.63, 329.63, 392, 523.25],
      [349.23, 440, 523.25, 698.46],
      [392, 493.88, 587.33, 783.99],
      [329.63, 415.3, 493.88, 659.25]
    ],
    lead: [392, 440, 523.25, 587.33, 523.25, 440, 493.88, 392],
    bpm: 104,
    energy: 0.82,
    arrangement: "home-lobby"
  },
  lobby: {
    roots: [130.81, 174.61, 196, 164.81],
    chords: [
      [261.63, 329.63, 392, 523.25],
      [349.23, 440, 523.25, 698.46],
      [392, 493.88, 587.33, 783.99],
      [329.63, 415.3, 493.88, 659.25]
    ],
    lead: [392, 440, 523.25, 587.33, 523.25, 440, 493.88, 392],
    bpm: 104,
    energy: 0.82,
    arrangement: "home-lobby"
  },
  activity: {
    roots: [146.83, 196, 220, 174.61],
    chords: [
      [293.66, 369.99, 440, 587.33],
      [392, 493.88, 587.33, 783.99],
      [440, 554.37, 659.25, 880],
      [349.23, 440, 523.25, 698.46]
    ],
    lead: [440, 523.25, 587.33, 659.25, 587.33, 523.25, 659.25, 587.33],
    bpm: 120,
    energy: 0.98,
    arrangement: "support"
  },
  shop: {
    roots: [123.47, 164.81, 185, 146.83],
    chords: [
      [246.94, 311.13, 369.99, 493.88],
      [329.63, 415.3, 493.88, 659.25],
      [369.99, 466.16, 554.37, 739.99],
      [293.66, 369.99, 440, 587.33]
    ],
    lead: [369.99, 415.3, 493.88, 554.37, 493.88, 415.3, 466.16, 369.99],
    bpm: 112,
    energy: 0.82,
    arrangement: "support"
  },
  rewards: {
    roots: [146.83, 196, 220, 174.61],
    chords: [
      [293.66, 369.99, 440, 587.33],
      [392, 493.88, 587.33, 783.99],
      [440, 554.37, 659.25, 880],
      [349.23, 440, 523.25, 698.46]
    ],
    lead: [440, 523.25, 587.33, 739.99, 659.25, 587.33, 523.25, 587.33],
    bpm: 116,
    energy: 0.94,
    arrangement: "support"
  },
  gameplay: {
    roots: [98, 130.81, 146.83, 110],
    chords: [
      [196, 246.94, 293.66, 392],
      [261.63, 329.63, 392, 523.25],
      [293.66, 369.99, 440, 587.33],
      [220, 277.18, 329.63, 440]
    ],
    lead: [392, 493.88, 587.33, 659.25, 587.33, 493.88, 739.99, 659.25],
    bpm: 132,
    energy: 1.12,
    arrangement: "adventure-gameplay"
  }
};

export class AudioManager {
  private ctx: AudioLikeContext | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  private homeLoopSource: AudioBufferSourceNode | null = null;
  private homeLoopGain: GainNode | null = null;
  private bgmBufferCache = new Map<AudioContextKey, AudioBuffer>();
  private homeLoopBuffer: AudioBuffer | null = null;
  private currentContext: AudioContextKey | null = null;
  private settings: AudioSettings;

  constructor(
    private config: AudioConfig = DEFAULT_REMOTE_CONFIG.audio,
    settings: AudioSettings = loadAudioSettings(config)
  ) {
    this.settings = settings;
  }

  getSettings(): AudioSettings {
    return this.settings;
  }

  describeBgmForTest(context: AudioContextKey): {
    durationSec: number;
    homeLoopDurationSec: number;
    bpm: number;
    arrangement: BgmPalette["arrangement"];
    cached: boolean;
    loopSourceActive: boolean;
    homeLoopActive: boolean;
  } {
    return {
      durationSec: BGM_DURATION_SEC,
      homeLoopDurationSec: HOME_LOOP_DURATION_SEC,
      bpm: BGM_PALETTES[context].bpm,
      arrangement: BGM_PALETTES[context].arrangement,
      cached: this.bgmBufferCache.has(context),
      loopSourceActive: Boolean(this.bgmSource?.loop),
      homeLoopActive: Boolean(this.homeLoopSource?.loop)
    };
  }

  updateSettings(next: Partial<AudioSettings>): AudioSettings {
    this.settings = saveAudioSettings({ ...this.settings, ...next, updatedAt: new Date().toISOString() });
    if (this.settings.muted || !this.settings.musicEnabled) this.stopBgm();
    this.bgmGain?.gain.setTargetAtTime(this.bgmGainLevel(), this.ctx?.currentTime ?? 0, 0.18);
    this.homeLoopGain?.gain.setTargetAtTime(this.homeLoopGainLevel(), this.ctx?.currentTime ?? 0, 0.18);
    return this.settings;
  }

  async unlock(): Promise<boolean> {
    if (!this.config.enabled) return false;
    const ctx = this.getContext();
    if (!ctx) return false;
    try {
      await ctx.resume?.();
      this.updateSettings({ unlocked: true });
      this.trackAudio("audio_unlocked", { unlocked: true });
      return true;
    } catch {
      this.trackAudio("audio_autoplay_blocked", { unlocked: false });
      return false;
    }
  }

  async playBgm(context: AudioContextKey, options: { homeLayer?: boolean } = {}): Promise<void> {
    if (!this.canPlayMusic()) return;
    if (!this.settings.unlocked) await this.unlock();
    if (!this.settings.unlocked) return;
    if (this.currentContext === context && this.bgmSource) {
      this.syncHomeLoop(Boolean(options.homeLayer));
      return;
    }
    this.stopBgm();
    this.currentContext = context;
    this.startSyntheticBgm(context);
    this.syncHomeLoop(Boolean(options.homeLayer));
    this.trackAudio("audio_bgm_started", { context, trackId: this.config.bgm[context] });
  }

  stopBgm(): void {
    const now = this.ctx?.currentTime ?? 0;
    if (this.bgmGain) {
      this.bgmGain.gain.cancelScheduledValues(now);
      this.bgmGain.gain.setTargetAtTime(0.0001, now, 0.18);
    }
    try {
      this.bgmSource?.stop(now + 0.55);
    } catch {
      /* already stopped */
    }
    this.bgmSource = null;
    this.bgmGain = null;
    this.stopHomeLoop();
    this.currentContext = null;
  }

  playSfx(cue: AudioCueId): void {
    if (!this.canPlaySfx()) return;
    const tones: Record<AudioCueId, Array<[number, number, number, OscillatorType]>> = {
      tap: [[660, 0.035, 0.1, "triangle"]],
      reward_claim: [
        [659.25, 0.08, 0.14, "sine"],
        [987.77, 0.14, 0.1, "sine"]
      ],
      purchase_success: [
        [523.25, 0.07, 0.13, "triangle"],
        [659.25, 0.1, 0.12, "triangle"],
        [1046.5, 0.18, 0.08, "sine"]
      ],
      ad_start: [[392, 0.08, 0.12, "triangle"]],
      ad_complete: [
        [587.33, 0.07, 0.12, "triangle"],
        [880, 0.12, 0.12, "sine"]
      ],
      popup_open: [
        [493.88, 0.08, 0.12, "triangle"],
        [739.99, 0.12, 0.08, "sine"]
      ],
      failure: [[164.81, 0.14, 0.14, "sawtooth"]]
    };
    tones[cue].forEach(([freq, duration, gain, wave], index) => {
      window.setTimeout(() => this.playTone(freq, duration, gain, wave), index * 42);
    });
    this.trackAudio("audio_sfx_played", { cue });
  }

  dispose(): void {
    this.stopBgm();
    this.ctx?.close?.();
    this.ctx = null;
  }

  private canPlayMusic(): boolean {
    return this.config.enabled && this.settings.musicEnabled && !this.settings.muted && this.settings.volume > 0;
  }

  private canPlaySfx(): boolean {
    return this.config.enabled && this.settings.sfxEnabled && !this.settings.muted && this.settings.volume > 0 && this.settings.unlocked;
  }

  private getContext(): AudioLikeContext | null {
    if (this.ctx) return this.ctx;
    const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtor) return null;
    this.ctx = new AudioCtor();
    return this.ctx;
  }

  private startSyntheticBgm(context: AudioContextKey): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = this.bgmBufferCache.get(context) ?? this.renderLongBgmBuffer(ctx, context);
    source.loop = true;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(this.bgmGainLevel(), now + 1.6);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
    this.bgmSource = source;
    this.bgmGain = gain;
  }

  private bgmGainLevel(): number {
    return 0.62 * this.settings.volume;
  }

  private homeLoopGainLevel(): number {
    return 0.22 * this.settings.volume;
  }

  private renderLongBgmBuffer(ctx: AudioLikeContext, context: AudioContextKey): AudioBuffer {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * BGM_DURATION_SEC), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    renderUpbeatBgmSamples(data, ctx.sampleRate, context);
    this.bgmBufferCache.set(context, buffer);
    return buffer;
  }

  private syncHomeLoop(enabled: boolean): void {
    if (!enabled || !this.canPlayMusic()) {
      this.stopHomeLoop();
      return;
    }
    if (this.homeLoopSource) return;
    this.startHomeLoop();
  }

  private startHomeLoop(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = this.homeLoopBuffer ?? this.renderHomeLoopBuffer(ctx);
    source.loop = true;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(this.homeLoopGainLevel(), now + 1.3);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
    this.homeLoopSource = source;
    this.homeLoopGain = gain;
  }

  private stopHomeLoop(): void {
    const now = this.ctx?.currentTime ?? 0;
    if (this.homeLoopGain) {
      this.homeLoopGain.gain.cancelScheduledValues(now);
      this.homeLoopGain.gain.setTargetAtTime(0.0001, now, 0.18);
    }
    try {
      this.homeLoopSource?.stop(now + 0.45);
    } catch {
      /* already stopped */
    }
    this.homeLoopSource = null;
    this.homeLoopGain = null;
  }

  private renderHomeLoopBuffer(ctx: AudioLikeContext): AudioBuffer {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * HOME_LOOP_DURATION_SEC), ctx.sampleRate);
    renderHomeLoopSamples(buffer.getChannelData(0), ctx.sampleRate);
    this.homeLoopBuffer = buffer;
    return buffer;
  }

  private playTone(freq: number, duration: number, gainValue: number, wave: OscillatorType = "sine"): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = wave;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue * this.settings.volume), now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      this.trackAudio("audio_playback_failed", { freq });
    }
  }

  private trackAudio(name: string, data: AnalyticsEvent["data"]): void {
    const queue = JSON.parse(localStorage.getItem(PLATFORM_STORAGE_KEYS.analyticsQueue) ?? "[]") as AnalyticsEvent[];
    writeCache(PLATFORM_STORAGE_KEYS.analyticsQueue, [...queue, { name, source: "audio", data, createdAt: new Date().toISOString() }]);
  }
}

const TAU = Math.PI * 2;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function renderUpbeatBgmSamples(data: Float32Array, sampleRate: number, context: AudioContextKey): Float32Array {
  const palette = BGM_PALETTES[context];
  const beatSec = 60 / palette.bpm;
  const barSec = beatSec * 4;
  const loopBars = Math.round(BGM_DURATION_SEC / barSec);
  const actualDuration = data.length / sampleRate;

  for (let i = 0; i < data.length; i += 1) {
    const t = i / sampleRate;
    const bar = Math.floor(t / barSec);
    const chordIndex = bar % palette.chords.length;
    const section = sectionEnergy(t, actualDuration) * palette.energy;
    const root = palette.roots[chordIndex]!;
    const chord = palette.chords[chordIndex]!;
    const loopFade = smoothstep(0, 0.12, t) * (1 - smoothstep(actualDuration - 0.16, actualDuration, t));

    let sample = 0;
    if (palette.arrangement === "home-lobby") {
      sample += softKick(t, beatSec) * 0.1;
      sample += shaker(t, beatSec, i) * 0.028 * section;
      sample += bassPulse(root, t, beatSec * 1.35) * 0.13 * section;
      sample += chordSwell(chord, t, beatSec, bar) * 0.28 * section;
      sample += lobbyBellHook(palette.lead, t, beatSec, bar) * 0.085 * section;
      sample += airPad(chord, t) * 0.24;
    } else if (palette.arrangement === "adventure-gameplay") {
      sample += kick(t, beatSec) * 0.34;
      sample += snare(t, beatSec) * 0.13 * section;
      sample += hat(t, beatSec, i) * 0.062 * section;
      sample += bassPulse(root, t, beatSec) * 0.34 * section;
      sample += gameplayDrive(root, t, beatSec) * 0.16 * section;
      sample += chordStab(chord, t, beatSec, bar) * 0.16 * section;
      sample += leadHook(palette.lead, t, beatSec, bar, loopBars) * 0.12 * section;
      sample += riser(t, actualDuration, i) * 0.05;
      sample += airPad(chord, t) * 0.075;
    } else {
      sample += kick(t, beatSec) * 0.22;
      sample += snare(t, beatSec) * 0.07 * section;
      sample += hat(t, beatSec, i) * 0.03 * section;
      sample += bassPulse(root, t, beatSec) * 0.2 * section;
      sample += chordStab(chord, t, beatSec, bar) * 0.16 * section;
      sample += leadHook(palette.lead, t, beatSec, bar, loopBars) * 0.09 * section;
      sample += riser(t, actualDuration, i) * 0.045;
      sample += airPad(chord, t) * 0.13;
    }

    data[i] = clampSample(Math.tanh(sample * 1.35) * loopFade);
  }

  softenEdges(data, sampleRate);
  return data;
}

function sectionEnergy(t: number, duration: number): number {
  if (t < 4) return lerp(0.45, 0.85, smoothstep(0, 4, t));
  if (t < 12) return lerp(0.85, 1.08, smoothstep(4, 12, t));
  if (t < 24) return 1.16;
  return lerp(1.16, 0.72, smoothstep(24, duration, t));
}

function kick(t: number, beatSec: number): number {
  const local = t % beatSec;
  if (local > 0.22) return 0;
  const freq = 58 + 92 * Math.exp(-local * 38);
  return Math.sin(TAU * freq * local) * Math.exp(-local * 18);
}

function softKick(t: number, beatSec: number): number {
  const local = t % (beatSec * 2);
  if (local > 0.2) return 0;
  const freq = 54 + 46 * Math.exp(-local * 24);
  return Math.sin(TAU * freq * local) * Math.exp(-local * 16);
}

function snare(t: number, beatSec: number): number {
  const beat = Math.floor(t / beatSec);
  if (beat % 4 !== 2) return 0;
  const local = t - beat * beatSec;
  if (local > 0.18) return 0;
  return (softNoise(Math.floor(t * 44_100)) * 0.42 + Math.sin(TAU * 220 * local) * 0.55) * Math.exp(-local * 18);
}

function shaker(t: number, beatSec: number, index: number): number {
  const stepSec = beatSec / 2;
  const local = (t + beatSec / 8) % stepSec;
  if (local > 0.045) return 0;
  return softNoise(index * 11) * Math.exp(-local * 42) * 0.72;
}

function hat(t: number, beatSec: number, index: number): number {
  const stepSec = beatSec / 2;
  const local = t % stepSec;
  if (local > 0.055) return 0;
  const accent = Math.floor(t / stepSec) % 2 === 0 ? 1 : 0.65;
  return softNoise(index * 7) * Math.exp(-local * 48) * accent;
}

function bassPulse(root: number, t: number, beatSec: number): number {
  const stepSec = beatSec / 2;
  const local = t % stepSec;
  const env = smoothstep(0, 0.018, local) * (1 - smoothstep(stepSec * 0.55, stepSec, local));
  const freq = root * (Math.floor(t / stepSec) % 4 === 3 ? 1.5 : 1);
  return (Math.sin(TAU * freq * 0.5 * t) + 0.18 * Math.sin(TAU * freq * t)) * env;
}

function chordStab(chord: number[], t: number, beatSec: number, bar: number): number {
  const beatInBar = (t / beatSec) % 4;
  const active = beatInBar < 0.9 || (beatInBar > 2 && beatInBar < 2.55);
  if (!active) return 0;
  const hitStart = beatInBar < 1 ? Math.floor(t / (beatSec * 4)) * beatSec * 4 : Math.floor(t / (beatSec * 4)) * beatSec * 4 + beatSec * 2;
  const local = Math.max(0, t - hitStart);
  const env = smoothstep(0, 0.035, local) * (1 - smoothstep(0.22, 0.85, local));
  return chord.reduce((sum, freq, index) => {
    const detune = 1 + (index - 1.5) * 0.0015 + Math.sin((bar + index) * 1.7) * 0.0008;
    return sum + softPluckWave(freq * detune, t) * (0.58 / (index + 1));
  }, 0) * env;
}

function chordSwell(chord: number[], t: number, beatSec: number, bar: number): number {
  const barSec = beatSec * 4;
  const local = t % barSec;
  const env = smoothstep(0, 0.28, local) * (1 - smoothstep(barSec * 0.76, barSec, local));
  return chord.reduce((sum, freq, index) => {
    const detune = 1 + Math.sin((bar + index) * 1.3) * 0.0012;
    return sum + Math.sin(TAU * freq * 0.5 * detune * t + index * 0.42) * (0.42 / (index + 1));
  }, 0) * env;
}

function leadHook(notes: number[], t: number, beatSec: number, bar: number, loopBars: number): number {
  const introBars = 2;
  if (bar < introBars || bar >= loopBars - 1) return 0;
  const stepSec = beatSec / 2;
  const step = Math.floor((t - introBars * beatSec * 4) / stepSec);
  const local = t % stepSec;
  const note = notes[step % notes.length]!;
  const octaveLift = bar % 4 === 3 ? 2 : 1;
  const env = smoothstep(0, 0.025, local) * (1 - smoothstep(stepSec * 0.55, stepSec, local));
  return (softPluckWave(note * octaveLift, t) * 0.82 + Math.sin(TAU * note * octaveLift * 2 * t) * 0.08) * env;
}

function lobbyBellHook(notes: number[], t: number, beatSec: number, bar: number): number {
  if (bar < 2) return 0;
  const stepSec = beatSec;
  const step = Math.floor((t - beatSec * 8) / stepSec);
  if (step % 4 === 3) return 0;
  const local = t % stepSec;
  const note = notes[step % notes.length]!;
  const env = smoothstep(0, 0.035, local) * (1 - smoothstep(stepSec * 0.36, stepSec * 0.92, local));
  return (Math.sin(TAU * note * t) + Math.sin(TAU * note * 2 * t) * 0.11) * env;
}

function gameplayDrive(root: number, t: number, beatSec: number): number {
  const stepSec = beatSec / 4;
  const local = t % stepSec;
  const env = smoothstep(0, 0.01, local) * (1 - smoothstep(stepSec * 0.45, stepSec, local));
  const freq = root * (Math.floor(t / stepSec) % 8 >= 6 ? 1.5 : 1);
  return softPluckWave(freq, t) * env;
}

function riser(t: number, duration: number, index: number): number {
  const build = smoothstep(7, 12, t) * (1 - smoothstep(12, 13.2, t));
  const tail = smoothstep(duration - 6, duration - 1.3, t) * (1 - smoothstep(duration - 1.2, duration, t));
  const amount = Math.max(build, tail);
  if (amount <= 0) return 0;
  const sweep = lerp(420, 1500, smoothstep(0, duration, t));
  return (Math.sin(TAU * sweep * t) * 0.16 + softNoise(index) * 0.16) * amount;
}

function airPad(chord: number[], t: number): number {
  return chord.reduce((sum, freq, index) => {
    const drift = 1 + 0.002 * Math.sin(TAU * (0.03 + index * 0.006) * t);
    return sum + Math.sin(TAU * freq * 0.5 * drift * t + index) * (0.35 / (index + 1));
  }, 0);
}

function softPluckWave(freq: number, t: number): number {
  const sine = Math.sin(TAU * freq * t);
  const second = Math.sin(TAU * freq * 2 * t) * 0.16;
  const third = Math.sin(TAU * freq * 3 * t) * 0.045;
  return sine + second + third;
}

export function renderHomeLoopSamples(data: Float32Array, sampleRate: number): Float32Array {
  const duration = data.length / sampleRate;
  for (let i = 0; i < data.length; i += 1) {
    const t = i / sampleRate;
    const loopFade = smoothstep(0, 0.2, t) * (1 - smoothstep(duration - 0.24, duration, t));
    let sample = 0;
    sample += Math.sin(TAU * 176 * t + Math.sin(TAU * 0.035 * t) * 1.4) * 0.035;
    sample += Math.sin(TAU * 220 * t + Math.sin(TAU * 0.027 * t) * 1.1) * 0.024;
    sample += homeSparkle(t, i, 7.5, 659.25) * 0.18;
    sample += homeSparkle(t, i, 11.25, 880) * 0.13;
    sample += homeSparkle(t, i, 18.75, 1046.5) * 0.1;
    sample += softNoise(i * 3) * 0.003;
    data[i] = clampSample(sample * loopFade);
  }
  softenEdges(data, sampleRate);
  return data;
}

function homeSparkle(t: number, index: number, period: number, freq: number): number {
  const local = t % period;
  if (local > 1.1) return 0;
  const env = smoothstep(0, 0.18, local) * (1 - smoothstep(0.32, 1.1, local));
  const drift = 1 + softNoise(index) * 0.004;
  return (Math.sin(TAU * freq * drift * t) + Math.sin(TAU * freq * 1.5 * drift * t) * 0.18) * env;
}

function softNoise(index: number): number {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 0.45;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clampSample(sample: number): number {
  return Math.max(-0.92, Math.min(0.92, sample));
}

function softenEdges(data: Float32Array, sampleRate: number): void {
  const fade = Math.min(data.length / 2, Math.floor(sampleRate * 2.5));
  for (let i = 0; i < fade; i += 1) {
    const weight = smoothstep(0, fade, i);
    data[i] *= weight;
    data[data.length - 1 - i] *= weight;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
