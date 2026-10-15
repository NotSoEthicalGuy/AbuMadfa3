/**
 * Abu Madfa3 - Survivor.io Replica
 * Procedural Web Audio API Sound & Music Synthesizer
 * 100% Zero-dependency, offline sound engine
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.gemStreak = 0;
    this.lastGemTime = 0;
    this.musicInterval = null;
    this.isPlayingMusic = false;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.isPlayingMusic && !this.isMuted) {
      this.startMusic();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx ? this.ctx.currentTime : 0);
    }
    return this.isMuted;
  }

  // Helper: White Noise Buffer
  getNoiseBuffer() {
    if (this._noiseBuffer) return this._noiseBuffer;
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this._noiseBuffer = buffer;
    return buffer;
  }

  // SFX: Rocket Launch Swoosh
  playRocketLaunch() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Tonal whoosh
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.18);

    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);

    // Noise breath
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.2);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 0.22);
  }

  // SFX: Punchy Heavy Explosion
  playExplosion(isNuke = false) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = isNuke ? 1.6 : 0.65;

    // Sub-bass thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isNuke ? 110 : 85, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + duration * 0.7);

    oscGain.gain.setValueAtTime(isNuke ? 0.9 : 0.75, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration);

    // Distorted noise rumble
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isNuke ? 1200 : 700, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + duration);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isNuke ? 0.8 : 0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + duration);
  }

  // SFX: Mucus Launcher Squish-Pop Firing Sound
  playMucusShoot() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Squishy bubbly pitch bend
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);

    oscGain.gain.setValueAtTime(0.45, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);

    // Wet liquid squelch
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.14);
    filter.Q.setValueAtTime(4.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 0.15);
  }

  // SFX: Wet Mucus Splat & Stick Sound
  playMucusSplat() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Wet squelch burst
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.28);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 0.3);

    // Heavy squishy thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.2);

    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // SFX: Gem Pickup Chime with Musical Progression
  playGemPickup() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    if (now - this.lastGemTime < 0.7) {
      this.gemStreak = (this.gemStreak + 1) % 8;
    } else {
      this.gemStreak = 0;
    }
    this.lastGemTime = now;

    // Pentatonic scale frequencies
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
    const freq = pentatonic[this.gemStreak];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.08);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // SFX: Level-Up Celebratory Arpeggio Fanfare
  playLevelUp() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major triumphant chord
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.5);
    });
  }

  // SFX: Player Hurt Impact
  playPlayerHit() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // SFX: Lightning Strike Crackle
  playLightning() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // SFX: Spinning Blade Slice
  playBladeHit() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // SFX: Boss Warning Siren
  playBossWarning() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.35);
    osc.frequency.linearRampToValueAtTime(220, now + 0.7);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.75);
  }

  // SFX: Treasure Chest Opening
  playChestFanfare() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [392, 523.25, 659.25, 783.99, 1046.50]; // G - C - E - G - C
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.65);
    });
  }

  // Background Synth Beat (Dynamic, energetic survivor pulse)
  startMusic() {
    if (!this.ctx) return;
    this.stopMusic();
    this.isPlayingMusic = true;
    this.isReggae = false;

    let step = 0;
    const bassline = [65.41, 65.41, 77.78, 65.41, 87.31, 77.78, 98.00, 77.78]; // C2-Eb2-F2-G2
    const stepDuration = 0.17; // ~176 BPM tempo

    const playBeatStep = () => {
      if (!this.isPlayingMusic || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Bass note
      const bassFreq = bassline[step % bassline.length];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + stepDuration * 0.8);

      bassGain.gain.setValueAtTime(0.35, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.85);

      bassOsc.connect(filter);
      filter.connect(bassGain);
      bassGain.connect(this.musicGain);
      bassOsc.start(now);
      bassOsc.stop(now + stepDuration * 0.9);

      // Hi-hat noise on off-beats
      if (step % 2 === 1) {
        const hat = this.ctx.createBufferSource();
        hat.buffer = this.getNoiseBuffer();
        const hatFilter = this.ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7000, now);

        const hatGain = this.ctx.createGain();
        hatGain.gain.setValueAtTime(0.12, now);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        hat.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.musicGain);
        hat.start(now);
        hat.stop(now + 0.06);
      }

      step++;
    };

    this.musicInterval = setInterval(playBeatStep, stepDuration * 1000);
  }

  // Bob Marley Roots Reggae Dub Groove (Mharreb Query Weed Mode)
  startReggaeMusic() {
    this.stopMusic();
    if (!this.ctx) return;
    this.isPlayingMusic = true;
    this.isReggae = true;

    let beat = 0;
    // Classic Bob Marley / Roots Reggae progression in A Major (A - D - A - E)
    const chords = [
      { root: 110, triad: [220, 277.18, 329.63] },    // A chord (A3, C#4, E4)
      { root: 110, triad: [220, 277.18, 329.63] },    // A chord
      { root: 146.83, triad: [293.66, 369.99, 440] }, // D chord (D4, F#4, A4)
      { root: 164.81, triad: [329.63, 415.30, 493.88] }, // E chord (E4, G#4, B4)
    ];

    const stepDuration = 0.19; // ~78 BPM relaxed Roots Reggae tempo

    const playReggaeStep = () => {
      if (!this.isPlayingMusic || !this.ctx) return;
      const now = this.ctx.currentTime;
      const measure = Math.floor(beat / 8) % chords.length;
      const stepInMeasure = beat % 8;
      const currentChord = chords[measure];

      // 1. Offbeat Reggae Organ/Guitar Skank Chops on steps 1, 3, 5, 7
      if (stepInMeasure % 2 === 1) {
        currentChord.triad.forEach(freq => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(now);
          osc.stop(now + 0.09);
        });

        // Crisp offbeat noise tap
        const hat = this.ctx.createBufferSource();
        hat.buffer = this.getNoiseBuffer();
        const hFilter = this.ctx.createBiquadFilter();
        hFilter.type = 'bandpass';
        hFilter.frequency.setValueAtTime(4200, now);
        const hGain = this.ctx.createGain();
        hGain.gain.setValueAtTime(0.1, now);
        hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        hat.connect(hFilter);
        hFilter.connect(hGain);
        hGain.connect(this.musicGain);
        hat.start(now);
        hat.stop(now + 0.05);
      }

      // 2. The Signature Bob Marley "One Drop" Kick & Rim-Shot on Beat 3 (step 4)
      if (stepInMeasure === 4) {
        // Deep round dub kick
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(80, now);
        kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.16);
        kickGain.gain.setValueAtTime(0.55, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.2);

        // Rim click
        const snare = this.ctx.createBufferSource();
        snare.buffer = this.getNoiseBuffer();
        const sFilter = this.ctx.createBiquadFilter();
        sFilter.type = 'highpass';
        sFilter.frequency.setValueAtTime(2000, now);
        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(0.25, now);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        snare.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(this.musicGain);
        snare.start(now);
        snare.stop(now + 0.09);
      }

      // 3. Melodic Warm Walking Dub Bassline
      if (stepInMeasure === 0 || stepInMeasure === 3 || stepInMeasure === 6) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        const noteFreq = stepInMeasure === 6 ? currentChord.root * 1.5 : (stepInMeasure === 3 ? currentChord.root * 1.25 : currentChord.root);
        bassOsc.frequency.setValueAtTime(noteFreq, now);

        bassGain.gain.setValueAtTime(0.45, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.4);

        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);
        bassOsc.start(now);
        bassOsc.stop(now + stepDuration * 1.5);
      }

      beat++;
    };

    this.musicInterval = setInterval(playReggaeStep, stepDuration * 1000);
  }

  stopMusic() {
    this.isPlayingMusic = false;
    this.isReggae = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

// Global Sound Engine Singleton
window.audioEngine = new SoundEngine();
