/**
 * Sound effects synthesized with WebAudio, so the game ships no audio files yet. Each effect
 * is a short envelope of oscillators/noise tuned to a pentatonic-ish Persian flavour.
 * Browsers only allow audio after a user gesture; unlock() is called on the first tap.
 */
type Fx = 'gateGood' | 'gateBad' | 'hit' | 'win' | 'lose' | 'coin' | 'tap' | 'bump' | 'roar';

class AudioService {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private lastHit = 0;

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? 0.5 : 0;
  }

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? 0.5 : 0;
    this.master.connect(this.ctx.destination);
  }

  play(fx: Fx): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.enabled) return;
    const t = ctx.currentTime;
    switch (fx) {
      case 'gateGood':
        [523, 659, 784].forEach((f, i) => this.tone(f, t + i * 0.06, 0.14, 'triangle', 0.35));
        break;
      case 'gateBad':
        [392, 311].forEach((f, i) => this.tone(f, t + i * 0.08, 0.18, 'sawtooth', 0.18));
        break;
      case 'hit':
        if (t - this.lastHit < 0.07) return;
        this.lastHit = t;
        this.noise(t, 0.05, 1800, 0.25);
        break;
      case 'bump':
        this.tone(110, t, 0.2, 'square', 0.3);
        this.noise(t, 0.12, 600, 0.3);
        break;
      case 'roar':
        this.tone(82, t, 0.6, 'sawtooth', 0.25);
        this.noise(t, 0.5, 400, 0.2);
        break;
      case 'win':
        [523, 659, 784, 1046].forEach((f, i) => this.tone(f, t + i * 0.11, 0.3, 'triangle', 0.35));
        break;
      case 'lose':
        [392, 349, 311, 262].forEach((f, i) => this.tone(f, t + i * 0.14, 0.3, 'sine', 0.3));
        break;
      case 'coin':
        this.tone(1318, t, 0.08, 'square', 0.15);
        this.tone(1760, t + 0.07, 0.15, 'square', 0.15);
        break;
      case 'tap':
        this.tone(880, t, 0.05, 'triangle', 0.2);
        break;
    }
  }

  private tone(freq: number, at: number, dur: number, type: OscillatorType, vol: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(vol, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(gain).connect(this.master!);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private noise(at: number, dur: number, cutoff: number, vol: number): void {
    const ctx = this.ctx!;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(this.master!);
    src.start(at);
  }
}

export const audio = new AudioService();
