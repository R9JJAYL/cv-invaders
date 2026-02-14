window.CVInvaders = window.CVInvaders || {};

/**
 * WaveManager — Controls wave progression, CV spawn timing, and frenzy mode.
 *
 * Each wave has a duration, spawn rate, fall speed, and optional enemy/unicorn
 * spawns. During the final seconds of a wave a "frenzy" kicks in with doubled
 * spawn rate and faster fall speed. When all waves complete, signals GameScene
 * to start the boss phase.
 */
window.CVInvaders.WaveManager = class WaveManager {
    constructor(scene) {
        this.scene = scene;
        this.currentWave = 0;
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.active = false;
        this.unicornsSpawned = 0;
        this.enemiesSpawned = false;
        this.enemiesSpawnedAt = 0;
    }

    /** Begin the specified wave, spawning enemies and scheduling unicorns if configured. */
    startWave(index) {
        this.currentWave = index;
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.active = true;
        this.unicornsSpawned = 0;
        this.enemiesSpawned = false;
        this.enemiesSpawnedAt = 0;

        this.scene.registry.set('wave', index + 1);

        // Increase music tempo with each wave
        const tempos = [1.0, 1.15, 1.35];
        const sound = window.CVInvaders._sharedSoundEngine;
        if (sound) sound.setMusicTempo(tempos[index] || 1.35);
    }

    getWaveConfig() {
        return window.CVInvaders.Config.WAVES[this.currentWave];
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
        this.enemiesSpawnedAt = 0;

        this.scene.registry.set('wave', nextWave + 1);

        return false;
    }

    /** Tick the wave timer, spawn CVs at the configured rate, and detect wave/frenzy transitions. */
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

        // Slow CVs for 8s after ghosts spawn (4s at 165, 4s at 180), speed up for frenzy
        const enemiesAlive = this.scene.enemies ? this.scene.enemies.getChildren().filter(e => e.active && e.isAlive).length : 0;
        const timeSinceEnemies = this.enemiesSpawnedAt > 0 ? this.waveTimer - this.enemiesSpawnedAt : -1;
        let effectiveFallSpeed = wave.fallSpeed;
        if (isFrenzy) {
            effectiveFallSpeed = 270; // faster during frenzy
        } else if (enemiesAlive > 0 && timeSinceEnemies >= 0 && timeSinceEnemies < 4000) {
            effectiveFallSpeed = 165; // slowest phase (first 4s)
        } else if (enemiesAlive > 0 && timeSinceEnemies >= 4000 && timeSinceEnemies < 8000) {
            effectiveFallSpeed = 180; // ramp up (next 4s)
        }

        // Spawn CVs at rate
        if (this.spawnTimer >= effectiveSpawnRate) {
            this.spawnTimer = 0;

            const activeCVs = this.scene.cvs ? this.scene.cvs.countActive(true) : 0;
            const maxOnScreen = isFrenzy ? wave.maxOnScreen + 3 : wave.maxOnScreen;
            if (activeCVs < maxOnScreen) {
                this.scene.spawnCV(wave, effectiveFallSpeed);
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
            this.enemiesSpawnedAt = this.waveTimer;
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
