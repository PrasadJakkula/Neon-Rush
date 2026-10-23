/**
 * Synthesizer & Procedural Synthwave Music Engine for Neon Rush
 * Uses Web Audio API for zero-latency, reliable procedural sound effects and dynamic synthwave soundtrack.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private isMusicPlaying: boolean = false;
  private musicVolume: number = 0.6;
  private sfxVolume: number = 0.7;
  private isMuted: boolean = false;

  // Music sequencer state
  private musicTimerId: number | null = null;
  private currentStep: number = 0;
  private bpm: number = 124;
  private nextNoteTime: number = 0;

  // Chord progression (Am, F, C, G)
  private chordIndex: number = 0;
  private chords = [
    { root: 220, bassNotes: [110, 110, 110, 164.81], leadNotes: [440, 523.25, 659.25, 523.25] }, // A minor
    { root: 174.61, bassNotes: [87.31, 87.31, 130.81, 174.61], leadNotes: [349.23, 440, 523.25, 440] }, // F major
    { root: 261.63, bassNotes: [130.81, 130.81, 196.0, 261.63], leadNotes: [523.25, 659.25, 783.99, 659.25] }, // C major
    { root: 196.0, bassNotes: [98.0, 98.0, 146.83, 196.0], leadNotes: [392.0, 493.88, 587.33, 493.88] }, // G major
  ];

  constructor() {
    // Load persisted audio preferences
    try {
      const savedMusic = localStorage.getItem('neon_music_vol');
      const savedSfx = localStorage.getItem('neon_sfx_vol');
      const savedMute = localStorage.getItem('neon_muted');
      if (savedMusic !== null) this.musicVolume = parseFloat(savedMusic);
      if (savedSfx !== null) this.sfxVolume = parseFloat(savedSfx);
      if (savedMute !== null) this.isMuted = savedMute === 'true';
    } catch {
      // localStorage may fail in some sandboxes
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Sound Effects ---

  public playJump() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(740, t + 0.14);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playDoubleJump() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(520, t);
    osc1.frequency.exponentialRampToValueAtTime(1150, t + 0.18);

    osc2.frequency.setValueAtTime(780, t);
    osc2.frequency.exponentialRampToValueAtTime(1400, t + 0.18);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.2);
    osc2.stop(t + 0.2);
  }

  public playSlide() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Filtered noise for slide friction
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(350, t + 0.18);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + 0.18);
  }

  public playCoin(comboCount: number = 0) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pitch increases with combo chain
    const baseFreq = 880;
    const pitchOffset = Math.min(comboCount * 40, 480);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq + pitchOffset, t);
    osc.frequency.setValueAtTime(1320 + pitchOffset, t + 0.04);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playGem() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const frequencies = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7 arpeggio

    frequencies.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + idx * 0.035;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.12);
    });
  }

  public playPowerup() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73];

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.05;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.2);
    });
  }

  public playShieldBreak() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playHit() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Punchy explosion / crash
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.25);
  }

  public playGameOver() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [440, 415.3, 392, 349.23, 329.63, 220];

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.25);
    });
  }

  public playUiClick() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(1100, t + 0.05);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // --- Synthwave Procedural BGM Engine ---

  public startMusic() {
    this.initContext();
    if (this.isMusicPlaying || !this.ctx) return;
    this.isMusicPlaying = true;
    this.currentStep = 0;
    this.chordIndex = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    this.scheduleMusicStep();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimerId !== null) {
      window.clearTimeout(this.musicTimerId);
      this.musicTimerId = null;
    }
  }

  public setGameSpeedMultiplier(speedMultiplier: number) {
    // Dynamically adjust BPM slightly with game speed (124 bpm base, up to 142 bpm)
    this.bpm = Math.min(124 + (speedMultiplier - 1) * 15, 144);
  }

  private scheduleMusicStep() {
    if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;

    const stepDuration = 60 / this.bpm / 4; // 16th note step
    const lookaheadTime = 0.1;

    while (this.nextNoteTime < this.ctx.currentTime + lookaheadTime) {
      this.playSequencerStep(this.nextNoteTime, this.currentStep);
      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 16;
      if (this.currentStep === 0) {
        this.chordIndex = (this.chordIndex + 1) % this.chords.length;
      }
    }

    this.musicTimerId = window.setTimeout(() => {
      this.scheduleMusicStep();
    }, 25);
  }

  private playSequencerStep(time: number, step: number) {
    if (!this.ctx || !this.musicGain || this.isMuted || this.musicVolume <= 0) return;

    const chord = this.chords[this.chordIndex];

    // 1. Synth Kick Drum (Beats 0, 4, 8, 12 - Four on the floor)
    if (step % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();

      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, time);
      kickOsc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

      kickGain.gain.setValueAtTime(0.5, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      kickOsc.connect(kickGain);
      kickGain.connect(this.musicGain);

      kickOsc.start(time);
      kickOsc.stop(time + 0.14);
    }

    // 2. Synth Snare / Clap (Beats 4 and 12)
    if (step === 4 || step === 12) {
      const snareBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
      const output = snareBuffer.getChannelData(0);
      for (let i = 0; i < output.length; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.035));
      }
      const snareNoise = this.ctx.createBufferSource();
      snareNoise.buffer = snareBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, time);

      const snareGain = this.ctx.createGain();
      snareGain.gain.setValueAtTime(0.3, time);
      snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      snareNoise.connect(filter);
      filter.connect(snareGain);
      snareGain.connect(this.musicGain);

      snareNoise.start(time);
      snareNoise.stop(time + 0.15);
    }

    // 3. Hi-Hat (Every odd 16th note & 8th notes)
    if (step % 2 === 1 || step % 4 === 2) {
      const hatBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.04, this.ctx.sampleRate);
      const hatOutput = hatBuffer.getChannelData(0);
      for (let i = 0; i < hatOutput.length; i++) {
        hatOutput[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.008));
      }
      const hatNoise = this.ctx.createBufferSource();
      hatNoise.buffer = hatBuffer;

      const hatFilter = this.ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(6500, time);

      const hatGain = this.ctx.createGain();
      hatGain.gain.setValueAtTime(step % 4 === 2 ? 0.18 : 0.09, time);
      hatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      hatNoise.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(this.musicGain);

      hatNoise.start(time);
      hatNoise.stop(time + 0.04);
    }

    // 4. Synthwave Driving 16th Bassline
    const bassNote = chord.bassNotes[step % 4];
    const bassOsc = this.ctx.createOscillator();
    const bassFilter = this.ctx.createBiquadFilter();
    const bassGain = this.ctx.createGain();

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(bassNote, time);

    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(600, time);
    bassFilter.frequency.exponentialRampToValueAtTime(220, time + 0.09);
    bassFilter.Q.value = 4.0;

    bassGain.gain.setValueAtTime(0.28, time);
    bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(this.musicGain);

    bassOsc.start(time);
    bassOsc.stop(time + 0.1);

    // 5. Melodic Synth Lead Arpeggio (on selected rhythmic pulses)
    if (step % 2 === 0) {
      const noteIdx = (step / 2) % chord.leadNotes.length;
      const leadFreq = chord.leadNotes[noteIdx];

      const leadOsc = this.ctx.createOscillator();
      const leadFilter = this.ctx.createBiquadFilter();
      const leadGain = this.ctx.createGain();

      leadOsc.type = 'triangle';
      leadOsc.frequency.setValueAtTime(leadFreq, time);

      leadFilter.type = 'lowpass';
      leadFilter.frequency.setValueAtTime(1800, time);

      leadGain.gain.setValueAtTime(0.18, time);
      leadGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      leadOsc.connect(leadFilter);
      leadFilter.connect(leadGain);
      leadGain.connect(this.musicGain);

      leadOsc.start(time);
      leadOsc.stop(time + 0.18);
    }
  }

  // --- Volume & Settings Controls ---

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('neon_music_vol', this.musicVolume.toString());
    } catch {}
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('neon_sfx_vol', this.sfxVolume.toString());
    } catch {}
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.initContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    }
    try {
      localStorage.setItem('neon_muted', this.isMuted.toString());
    } catch {}
    return this.isMuted;
  }

  public getSettings() {
    return {
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      isMuted: this.isMuted,
      isMusicPlaying: this.isMusicPlaying
    };
  }
}

export const sound = new AudioEngine();
