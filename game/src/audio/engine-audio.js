// Web Audio: saw+square engine through a lowpass tied to throttle, band-passed noise wind tied to speed, chime on red warnings.
export class EngineAudio {
  constructor() {
    this.ctx = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;
      this.filter = ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 300;
      this.gain = ctx.createGain();
      this.gain.gain.value = 0.05;
      this.filter.connect(this.gain);
      this.gain.connect(ctx.destination);
      this.saw = ctx.createOscillator();
      this.saw.type = 'sawtooth';
      this.saw.frequency.value = 60;
      this.saw.connect(this.filter);
      this.saw.start();
      this.sq = ctx.createOscillator();
      this.sq.type = 'square';
      this.sq.frequency.value = 30;
      const sqGain = ctx.createGain();
      sqGain.gain.value = 0.4;
      this.sq.connect(sqGain);
      sqGain.connect(this.filter);
      this.sq.start();
      const len = ctx.sampleRate;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noise = ctx.createBufferSource();
      this.noise.buffer = buf;
      this.noise.loop = true;
      this.band = ctx.createBiquadFilter();
      this.band.type = 'bandpass';
      this.band.frequency.value = 600;
      this.noiseGain = ctx.createGain();
      this.noiseGain.gain.value = 0;
      this.noise.connect(this.band);
      this.band.connect(this.noiseGain);
      this.noiseGain.connect(ctx.destination);
      this.noise.start();
    } catch (e) {
      this.ctx = null;
    }
  }

  setState(o) {
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      this.saw.frequency.setTargetAtTime(42 + o.throttle * 95, t, 0.1);
      this.sq.frequency.setTargetAtTime(21 + o.throttle * 48, t, 0.1);
      this.filter.frequency.setTargetAtTime(220 + o.throttle * 950, t, 0.1);
      this.gain.gain.setTargetAtTime(0.02 + o.throttle * 0.05, t, 0.1);
      this.band.frequency.setTargetAtTime(400 + o.speed * 9, t, 0.1);
      this.noiseGain.gain.setTargetAtTime(Math.min(0.12, (o.speed / 80) * 0.12), t, 0.2);
    } catch (e) {}
  }

  chime() {
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      for (const [dt, freq] of [[0, 880], [0.14, 1174]]) {
        const o = this.ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = freq;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.12, t + dt);
        g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.3);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(t + dt);
        o.stop(t + dt + 0.32);
      }
    } catch (e) {}
  }
}
