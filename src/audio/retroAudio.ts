/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private crowdNode: AudioNode | null = null;
  private crowdGain: GainNode | null = null;

  // Chiptune loop state
  private chiptuneTimer: number | null = null;
  private isChiptunePlaying: boolean = false;
  private chiptuneStep: number = 0;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.crowdGain) {
      this.crowdGain.gain.value = this.isMuted ? 0 : 0.05;
    }
    if (this.isMuted && this.isChiptunePlaying) {
      this.stopChiptune();
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.crowdGain) {
      this.crowdGain.gain.value = this.isMuted ? 0 : 0.05;
    }
    if (this.isMuted && this.isChiptunePlaying) {
      this.stopChiptune();
    }
  }

  public setMusicMuted(muted: boolean): void {
    this.isMusicMuted = muted;
    if (this.isMusicMuted) {
      this.stopChiptune();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Tactile button press / retro click
   */
  public playButtonPress() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(310, now + 0.04);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Classic referee whistle: two slightly detuned square waves with rapid vibrato (trill)
   */
  public playWhistle(short: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const duration = short ? 0.35 : 0.7;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(2450, now);
    osc2.frequency.setValueAtTime(2580, now);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(short ? 22 : 18, now);
    lfoGain.gain.setValueAtTime(140, now);
    lfo.connect(osc1.frequency);
    lfo.connect(osc2.frequency);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
    gain.gain.setValueAtTime(0.18, now + duration - 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);

    lfo.stop(now + duration);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  /**
   * Crunching tackle impact
   */
  public playTackle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.16);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);

    this.playNoise(0.12, 400, 0.2);
  }

  /**
   * Whiff / Juke sound: when a defender misses a tackle and slides on turf
   */
  public playWhiff() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.14);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);

    this.playNoise(0.14, 550, 0.15);
  }

  /**
   * Palomita dive try whoosh
   */
  public playDive() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);

    this.playNoise(0.18, 300, 0.25);
  }

  /**
   * Passing whoosh / pop
   */
  public playPass() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Catching the ball
   */
  public playCatch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Kicking the ball (solid boot thud)
   */
  public playKick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Glorious 8-bit fanfare for a Try
   */
  public playTryFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.1;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (idx === notes.length - 1 ? 0.45 : 0.18));

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + (idx === notes.length - 1 ? 0.45 : 0.18));
    });
  }

  public playScrumClash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.playNoise(0.2, 280, 0.25);
  }

  public playBlip() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Procedural 8-bit Chiptune Music Loop (Retro Bowl style)
   */
  public startChiptune() {
    if (this.isMusicMuted || this.isMuted || this.isChiptunePlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.isChiptunePlaying = true;
    this.chiptuneStep = 0;

    // Upbeat 8-bar loop in C major / A minor
    const bassline = [
      130.81, 130.81, 164.81, 196.00, // C3, C3, E3, G3
      110.00, 110.00, 130.81, 164.81, // A2, A2, C3, E3
      87.31,  87.31,  110.00, 130.81, // F2, F2, A2, C3
      98.00,  98.00,  123.47, 146.83, // G2, G2, B2, D3
    ];

    const leadMelody = [
      523.25, 0, 587.33, 659.25, 523.25, 0, 392.00, 0,
      440.00, 0, 523.25, 440.00, 392.00, 0, 329.63, 0,
      349.23, 0, 440.00, 523.25, 659.25, 0, 587.33, 0,
      493.88, 0, 587.33, 659.25, 783.99, 0, 523.25, 0,
    ];

    const stepInterval = 140; // ~107 BPM 16th notes

    this.chiptuneTimer = window.setInterval(() => {
      if (!this.isChiptunePlaying || this.isMuted || this.isMusicMuted || !this.ctx) return;

      const now = this.ctx.currentTime;
      const bassIndex = Math.floor(this.chiptuneStep / 2) % bassline.length;
      const bassFreq = bassline[bassIndex];
      const leadFreq = leadMelody[this.chiptuneStep % leadMelody.length];

      // Play bass pulse
      if (this.chiptuneStep % 2 === 0 && bassFreq) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bassFreq, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      }

      // Play lead chip
      if (leadFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(leadFreq, now);
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
      }

      // Periodic snare/hi-hat chip
      if (this.chiptuneStep % 4 === 2) {
        this.playNoise(0.04, 1200, 0.02);
      }

      this.chiptuneStep = (this.chiptuneStep + 1) % 32;
    }, stepInterval);
  }

  public stopChiptune() {
    this.isChiptunePlaying = false;
    if (this.chiptuneTimer !== null) {
      clearInterval(this.chiptuneTimer);
      this.chiptuneTimer = null;
    }
  }

  private playNoise(duration: number, lowpassFreq: number, volume: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(lowpassFreq, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }
}

export const retroAudio = new RetroAudioEngine();
