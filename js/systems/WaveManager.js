window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.WaveManager = class WaveManager {
    constructor(scene) {
        this.scene = scene;
        this.currentWave = 0;
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.active = false;
        this.unicornsSpawned = 0;
        this.enemiesSpawned = false;
    }

    startWave(index) {
        this.currentWave = index;
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.active = true;
        this.unicornsSpawned = 0;
        this.enemiesSpawned = false;

        this.scene.registry.set('wave', index + 1);

        // Increase music tempo with each wave
        const tempos = [1.0, 1.15, 1.35];
        const sound = window.CVInvaders._sharedSoundEngine;
        if (sound) sound.setMusicTempo(tempos[index] || 1.35);
    }

    getWaveConfig() {
        return window.CVInvaders.Config.WAVES[this.currentWave];
    }

    getTotalRemainingMs() {
        const waves = window.CVInvaders.Config.WAVES;
        if (!this.active) return 0;

        // Remaining time in current wave
        const currentWave = waves[this.currentWave];
        let remaining = Math.max(0, currentWave.duration - this.waveTimer);

        // Add full duration of all subsequent waves
        for (let i = this.currentWave + 1; i < waves.length; i++) {
            remaining += waves[i].duration;
        }

        return remaining;
    }

    advanceWave() {
        const nextWave = this.currentWave + 1;
        const CFG = window.CVInvaders.Config;

        if (nextWave >= CFG.WAVES.length) {
            this.active = false;
            return true; // all waves done
        }

        // Seamlessly advance - just update params
        this.currentWave = nextWave;
        this.waveTimer = 0;
        this.unicornsSpawned = 0;
        this.enemiesSpawned = false;

        this.scene.registry.set('wave', nextWave + 1);

        return false;
    }

    update(delta) {
        if (!this.active) return null;

        this.waveTimer += delta;
        this.spawnTimer += delta;

        const wave = this.getWaveConfig();

        // CV frenzy in the last 7 seconds of the final wave — 2x faster spawn rate
        const timeRemaining = wave.duration - this.waveTimer;
        const isLastWave = this.currentWave === window.CVInvaders.Config.WAVES.length - 1;
        const isFrenzy = isLastWave && timeRemaining <= 7000 && timeRemaining > 0;
        const effectiveSpawnRate = isFrenzy ? Math.round(wave.spawnRate / 2) : wave.spawnRate;

        // Spawn CVs at rate
        if (this.spawnTimer >= effectiveSpawnRate) {
            this.spawnTimer = 0;

            const activeCVs = this.scene.cvs ? this.scene.cvs.countActive(true) : 0;
            const maxOnScreen = isFrenzy ? wave.maxOnScreen + 3 : wave.maxOnScreen;
            if (activeCVs < maxOnScreen) {
                this.scene.spawnCV(wave);
            }
        }

        // Unicorn spawns
        if (wave.hasUnicorn && wave.unicornSpawnTimes && this.unicornsSpawned < wave.unicornSpawnTimes.length) {
            if (this.waveTimer >= wave.unicornSpawnTimes[this.unicornsSpawned]) {
                this.unicornsSpawned++;
                this.scene.spawnUnicorn();
            }
        }

        // Enemy spawn (Wave 3)
        if (wave.hasEnemies && !this.enemiesSpawned) {
            this.enemiesSpawned = true;
            this.scene.spawnEnemies(wave.enemyCount);
        }

        // Check wave complete - seamlessly advance
        if (this.waveTimer >= wave.duration) {
            const allDone = this.advanceWave();
            if (allDone) {
                return { waveComplete: true, allWavesDone: true };
            }
        }

        return { waveComplete: false };
    }
};
