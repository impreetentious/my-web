// C11 — the descent, scored procedurally. Zero assets: every voice is an
// oscillator or filtered noise built at enable-time. MUTE IS THE DEFAULT —
// the graph doesn't even exist until the visitor opts in (which also
// satisfies autoplay policy: the toggle click is the user gesture).
//
// Voices, mixed by world position (same gates the shader lives by):
//   hum    — two detuned sines beating at 54 Hz: thin cosmic room tone
//   warm   — a low triangle that rises through the golden hour
//   wind   — filtered noise; scroll velocity leans into it, and its filter
//            drops underwater so speed reads as pressure, not air
//   sub    — 36 Hz pressure in the abyss
//   sonar  — sparse pings with a feedback echo, deep only
//   plunge — one-shot pitch-drop thump on the crossing
//   tick   — tiny decode blip when a dossier opens
//
// Everything rides one master gain at a deliberately quiet ceiling. If it
// isn't clearly excellent in the owner's ears, ship silent (brief C11).

import { useSiteStore } from '@/store/useSiteStore';
import { journey, PLUNGE_EVENT } from '@/lib/journey';
import { smoothstep, abyssGate } from '@/lib/descent';

const MASTER_ON = 0.16;
const UPDATE_MS = 130;

class DescentAudio {
  private ctx: AudioContext;
  private master: GainNode;
  private humGain: GainNode;
  private warmGain: GainNode;
  private windGain: GainNode;
  private windFilter: BiquadFilterNode;
  private subGain: GainNode;
  private sonarBus: GainNode;
  private interval: ReturnType<typeof setInterval> | null = null;
  private sonarTimeout: ReturnType<typeof setTimeout> | null = null;
  private unsubs: Array<() => void> = [];
  private lastPanelId: string | null = null;
  private level = 0; // smoothed intensity for the HUD gauge

  constructor() {
    const ctx = new AudioContext();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // hum — detuned pair through a dark lowpass
    const humFilter = ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.value = 240;
    this.humGain = ctx.createGain();
    this.humGain.gain.value = 0;
    humFilter.connect(this.humGain).connect(this.master);
    for (const f of [54, 57.3]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      osc.connect(g).connect(humFilter);
      osc.start();
    }

    // warm — golden-hour triangle with a slow breath
    const warmOsc = ctx.createOscillator();
    warmOsc.type = 'triangle';
    warmOsc.frequency.value = 108;
    const warmFilter = ctx.createBiquadFilter();
    warmFilter.type = 'lowpass';
    warmFilter.frequency.value = 420;
    this.warmGain = ctx.createGain();
    this.warmGain.gain.value = 0;
    const breath = ctx.createOscillator();
    breath.frequency.value = 0.09;
    const breathDepth = ctx.createGain();
    breathDepth.gain.value = 0.25;
    breath.connect(breathDepth).connect(this.warmGain.gain);
    warmOsc.connect(warmFilter).connect(this.warmGain).connect(this.master);
    warmOsc.start();
    breath.start();

    // wind — looped noise through a movable bandpass
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer();
    noise.loop = true;
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 480;
    this.windFilter.Q.value = 0.8;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    noise.connect(this.windFilter).connect(this.windGain).connect(this.master);
    noise.start();

    // sub — abyssal pressure
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = 36;
    this.subGain = ctx.createGain();
    this.subGain.gain.value = 0;
    subOsc.connect(this.subGain).connect(this.master);
    subOsc.start();

    // sonar bus with its echo
    this.sonarBus = ctx.createGain();
    this.sonarBus.gain.value = 1;
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.34;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.32;
    this.sonarBus.connect(this.master);
    this.sonarBus.connect(delay);
    delay.connect(feedback).connect(delay);
    delay.connect(this.master);

    // world wiring
    const onPlunge = () => this.plunge();
    window.addEventListener(PLUNGE_EVENT, onPlunge);
    this.unsubs.push(() => window.removeEventListener(PLUNGE_EVENT, onPlunge));

    this.unsubs.push(
      useSiteStore.subscribe(
        (s) => s.activePanelId,
        (id) => {
          if (id && id !== this.lastPanelId) this.tick();
          this.lastPanelId = id;
        }
      )
    );

    const onVisibility = () => {
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    };
    document.addEventListener('visibilitychange', onVisibility);
    this.unsubs.push(() => document.removeEventListener('visibilitychange', onVisibility));
  }

  private noiseBuffer(): AudioBuffer {
    const len = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  /** Per-tick mix: world position + scroll velocity → layer targets. */
  private update() {
    const t = useSiteStore.getState().scrollT;
    const now = this.ctx.currentTime;
    const vel = Math.min(1, Math.abs(journey.velocity) * 0.02);

    const space = 1 - smoothstep(0.5, 0.75, t);
    const golden = smoothstep(0.45, 0.62, t) * (1 - smoothstep(0.72, 0.8, t));
    const under = smoothstep(0.74, 0.82, t);
    const abyss = abyssGate(t);

    this.humGain.gain.setTargetAtTime(0.5 * space, now, 0.4);
    this.warmGain.gain.setTargetAtTime(0.3 * golden, now, 0.4);
    this.windGain.gain.setTargetAtTime(0.05 + 0.2 * vel + 0.06 * under, now, 0.25);
    this.windFilter.frequency.setTargetAtTime(480 - 300 * under, now, 0.5);
    this.subGain.gain.setTargetAtTime(0.45 * abyss, now, 0.6);

    this.level += (Math.min(1, 0.35 + vel * 0.9) - this.level) * 0.3;

    // sparse sonar in the dark
    if (abyss > 0.4 && this.sonarTimeout === null) {
      this.sonarTimeout = setTimeout(() => {
        this.sonarTimeout = null;
        if (abyssGate(useSiteStore.getState().scrollT) > 0.4) this.sonarPing();
      }, 8000 + Math.random() * 7000);
    }
  }

  private sonarPing() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(628, now + 0.9);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    osc.connect(g).connect(this.sonarBus);
    osc.start(now);
    osc.stop(now + 1.2);
  }

  /** The crossing: a low-passed pitch-drop thump + a breath of spray. */
  private plunge() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.42);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.55, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc.connect(g).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.65);

    const spray = this.ctx.createBufferSource();
    spray.buffer = this.noiseBuffer();
    const sprayFilter = this.ctx.createBiquadFilter();
    sprayFilter.type = 'lowpass';
    sprayFilter.frequency.value = 620;
    const sprayGain = this.ctx.createGain();
    sprayGain.gain.setValueAtTime(0.3, now);
    sprayGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    spray.connect(sprayFilter).connect(sprayGain).connect(this.master);
    spray.start(now);
    spray.stop(now + 0.35);
  }

  /** Decode blip on dossier open. */
  private tick() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 1180;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1180;
    filter.Q.value = 6;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.07, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(filter).connect(g).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  start() {
    void this.ctx.resume();
    this.master.gain.setTargetAtTime(MASTER_ON, this.ctx.currentTime, 0.6);
    if (this.interval === null) {
      this.interval = setInterval(() => this.update(), UPDATE_MS);
    }
  }

  stop() {
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.sonarTimeout !== null) {
      clearTimeout(this.sonarTimeout);
      this.sonarTimeout = null;
    }
    // let the fade finish before parking the context
    setTimeout(() => {
      if (!enabled) void this.ctx.suspend();
    }, 1200);
  }

  intensity(): number {
    return this.level;
  }
}

let engine: DescentAudio | null = null;
let enabled = false;

export function audioEnabled(): boolean {
  return enabled;
}

/** Toggle the score. Building the graph lazily on first enable makes the
 *  toggle click itself the autoplay-policy gesture — which is also why the
 *  preference is never persisted: an auto-restore on load would create the
 *  context without a gesture and start suspended. Mute is the default,
 *  every visit. */
export function setAudioEnabled(on: boolean): void {
  enabled = on;
  if (on) {
    if (!engine) engine = new DescentAudio();
    engine.start();
  } else {
    engine?.stop();
  }
}

/** 0..1 for the HUD gauge blocks. */
export function getAudioIntensity(): number {
  return enabled && engine ? engine.intensity() : 0;
}
