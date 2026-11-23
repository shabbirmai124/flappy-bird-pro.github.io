import { storage } from './storage.js';

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.musicTimer = null;
    this.musicBeat = 0;
    this.isPlayingMusic = false;
  }

  init() {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      } catch (err) {
        console.warn('Web Audio API not supported', err);
      }
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playTone(startFreq, endFreq, duration, type = 'square', volume = 0.1) {
    if (!storage.data.soundEnabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    if (endFreq !== startFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.008, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playJump() {
    const jitter = 0.94 + Math.random() * 0.12;
    this.playTone(195 * jitter, 560 * jitter, 0.11, 'triangle', 0.14);
  }

  playScore() {
    if (!storage.data.soundEnabled) return;
    this.resume();
    if (!this.ctx) return;

    const note = (freq, startTime, dur) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.075, startTime);
      gain.gain.exponentialRampToValueAtTime(0.008, startTime + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + dur);
    };

    const now = this.ctx.currentTime;
    const jitter = 0.97 + Math.random() * 0.06;
    note(523.25 * jitter, now, 0.08);
    note(659.25 * jitter, now + 0.08, 0.15);
  }

  playHit() {
    if (!storage.data.soundEnabled) return;
    this.resume();
    if (!this.ctx) return;

    const length = Math.floor(this.ctx.sampleRate * 0.16);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(860, now);
    filter.frequency.exponentialRampToValueAtTime(75, now + 0.16);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.008, now + 0.16);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start(now);
    source.stop(now + 0.16);
  }

  playDie() {
    this.playTone(300, 60, 0.42, 'sawtooth', 0.12);
  }

  playClick() {
    this.playTone(440, 440, 0.045, 'sine', 0.07);
  }

  startMusic() {
    if (this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.musicBeat = 0;

    const tick = () => {
      if (!this.isPlayingMusic) return;
      if (!storage.data.musicEnabled) {
        this.musicTimer = setTimeout(tick, 460);
        return;
      }

      this.resume();
      if (this.ctx) {
        const now = this.ctx.currentTime;
        const bassLine = [110, 110, 130, 110, 87.3, 87.3, 110, 87.3, 130.8, 130.8, 164.8, 130.8, 98, 98, 116.5, 98];
        const freq = bassLine[this.musicBeat % bassLine.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.38);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.38);

        if (this.musicBeat % 4 === 2 || this.musicBeat % 8 === 7) {
          const lead = [440, 523.25, 392, 440];
          const lFreq = lead[Math.floor(this.musicBeat / 4) % lead.length];
          const lOsc = this.ctx.createOscillator();
          const lGain = this.ctx.createGain();
          lOsc.type = 'sine';
          lOsc.frequency.setValueAtTime(lFreq, now);
          lGain.gain.setValueAtTime(0.02, now);
          lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          lOsc.connect(lGain);
          lGain.connect(this.ctx.destination);
          lOsc.start(now);
          lOsc.stop(now + 0.22);
        }
      }

      this.musicBeat += 1;
      this.musicTimer = setTimeout(tick, 460);
    };

    tick();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  toggleMusic(enabled) {
    if (enabled) this.startMusic();
    else this.stopMusic();
  }
}

export const audio = new AudioEngine();
