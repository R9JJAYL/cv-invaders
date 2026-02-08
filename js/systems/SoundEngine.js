window.CVInvaders = window.CVInvaders || {};

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
        return this.muted;
    }

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
        this._play('square', 1200, 0.03, 0.08);
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
};
