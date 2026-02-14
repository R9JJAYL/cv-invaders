window.CVInvaders = window.CVInvaders || {};

/**
 * SoundEngine — Procedural audio via the Web Audio API (no sound files).
 *
 * Every sound effect is synthesised at runtime using oscillators (sine,
 * square, triangle, sawtooth) with frequency sweeps and volume envelopes.
 * Background music is a layered drone + pentatonic arpeggio that shifts
 * tempo to match gameplay intensity.
 */
window.CVInvaders.SoundEngine = class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            this.muted = true;
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        // Fade drone in/out with mute
        if (this._droneGain && this.ctx) {
            try {
                this._droneGain.gain.linearRampToValueAtTime(
                    this.muted ? 0 : 0.06,
                    this.ctx.currentTime + 0.3
                );
            } catch (e) {}
        }
        return this.muted;
    }

    /**
     * Play a single oscillator tone with an optional frequency sweep.
     * @param {string} type - Oscillator waveform ('sine', 'square', 'triangle', 'sawtooth').
     * @param {number} freq - Starting frequency in Hz.
     * @param {number} duration - Length of the tone in seconds.
     * @param {number} volume - Peak gain (0–1).
     * @param {number} [freqEnd] - If provided, frequency sweeps linearly to this value in Hz.
     */
    _play(type, freq, duration, volume, freqEnd) {
        if (this.muted || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            if (freqEnd !== undefined) {
                osc.frequency.linearRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
            }
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }

    shoot() {
        this._play('square', 1200, 0.03, 0.02);
    }

    hitBadCV() {
        this._play('square', 440, 0.05, 0.15, 220);
        this._play('sawtooth', 220, 0.08, 0.1);
    }

    catchGoodCV() {
        if (this.muted || !this.ctx) return;
        try {
            const notes = [523, 659, 784];
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.06);
                gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.06);
                gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + i * 0.06 + 0.08);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + i * 0.06);
                osc.stop(this.ctx.currentTime + i * 0.06 + 0.08);
            });
        } catch (e) {}
    }

    playerHit() {
        this._play('sawtooth', 110, 0.2, 0.2, 55);
    }

    missGoodCV() {
        this._play('triangle', 440, 0.3, 0.1, 110);
    }

    unicornPickup() {
        if (this.muted || !this.ctx) return;
        try {
            const notes = [600, 750, 900, 1050, 1200];
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);
                gain.gain.setValueAtTime(0.1, this.ctx.currentTime + i * 0.08);
                gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + i * 0.08 + 0.1);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + i * 0.08);
                osc.stop(this.ctx.currentTime + i * 0.08 + 0.1);
            });
        } catch (e) {}
    }

    enemyShoot() {
        this._play('square', 600, 0.05, 0.06, 300);
    }

    enemyDestroyed() {
        this._play('sawtooth', 200, 0.08, 0.15, 50);
        this._play('square', 150, 0.12, 0.1, 30);
    }

    bossEntrance() {
        this._play('sawtooth', 80, 1.0, 0.15);
    }

    bossHit() {
        this._play('square', 150, 0.1, 0.15, 80);
    }

    bossDefeated() {
        if (this.muted || !this.ctx) return;
        try {
            const notes = [262, 330, 392, 523];
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.2);
                gain.gain.setValueAtTime(0.15, this.ctx.currentTime + i * 0.2);
                gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + i * 0.2 + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + i * 0.2);
                osc.stop(this.ctx.currentTime + i * 0.2 + 0.25);
            });
        } catch (e) {}
    }

    gameOver() {
        if (this.muted || !this.ctx) return;
        try {
            const notes = [440, 392, 349, 330, 262];
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.15);
                gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.15);
                gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + i * 0.15 + 0.2);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + i * 0.15);
                osc.stop(this.ctx.currentTime + i * 0.15 + 0.2);
            });
        } catch (e) {}
    }

    comboSound(combo) {
        const freq = 400 + Math.min(combo, 30) * 20;
        this._play('sine', freq, 0.08, 0.08);
    }

    // ===== BACKGROUND MUSIC =====
    /** Start the background music layers (drone + arpeggio). */
    startMusic() {
        if (!this.ctx || this.musicPlaying) return;
        this.musicPlaying = true;
        this._arpStopped = false;
        this.musicTempo = 1.0; // 1.0 = normal, higher = faster

        // Ambient drone pad
        this._startDrone();
        // Melodic arpeggio loop
        this._startArpeggio();
    }

    stopMusic() {
        this.musicPlaying = false;
        this._arpStopped = true;
        if (this._droneGain) {
            try {
                this._droneGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
            } catch (e) {}
        }
        if (this._arpTimer) {
            clearTimeout(this._arpTimer);
            this._arpTimer = null;
        }
    }

    /** Adjust arpeggio tempo. 1.0 = normal, 1.3 = wave tension, 1.6 = boss fight. */
    setMusicTempo(tempo) {
        // tempo: 1.0 = normal, 1.3 = slightly faster, 1.6 = intense
        this.musicTempo = tempo;
    }

    /** Start two slightly detuned sine oscillators for a warm ambient pad. */
    _startDrone() {
        if (!this.ctx) return;
        try {
            // Low ambient drone — two detuned oscillators for warmth
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(55.3, this.ctx.currentTime); // slight detune

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, this.ctx.currentTime);

            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 2);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc1.start();
            osc2.start();

            this._droneOsc1 = osc1;
            this._droneOsc2 = osc2;
            this._droneGain = gain;
        } catch (e) {}
    }

    /** Schedule looping pentatonic note pattern. Uses E3 pentatonic scale for a spacey feel. */
    _startArpeggio() {
        if (!this.ctx || !this.musicPlaying || this._arpStopped) return;

        // Spacey pentatonic notes in different octaves
        const patterns = [
            [164.81, 196.00, 246.94, 329.63, 392.00], // E3 pentatonic
            [130.81, 164.81, 196.00, 261.63, 329.63], // C3 pentatonic
            [146.83, 174.61, 220.00, 293.66, 349.23], // D3 pentatonic
        ];
        if (this._arpPatternIdx === undefined) this._arpPatternIdx = 0;
        if (this._arpNoteIdx === undefined) this._arpNoteIdx = 0;

        const pattern = patterns[this._arpPatternIdx % patterns.length];
        const freq = pattern[this._arpNoteIdx % pattern.length];

        if (!this.muted) {
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, this.ctx.currentTime);
                filter.Q.setValueAtTime(2, this.ctx.currentTime);

                const noteDur = 0.6 / this.musicTempo;
                gain.gain.setValueAtTime(0, this.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.02);
                gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + noteDur);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime);
                osc.stop(this.ctx.currentTime + noteDur + 0.1);
            } catch (e) {}
        }

        this._arpNoteIdx++;
        if (this._arpNoteIdx >= pattern.length) {
            this._arpNoteIdx = 0;
            this._arpPatternIdx++;
        }

        // Schedule next note — interval decreases with tempo
        const baseInterval = 600; // ms
        const interval = baseInterval / this.musicTempo;
        this._arpTimer = setTimeout(() => this._startArpeggio(), interval);
    }
};
