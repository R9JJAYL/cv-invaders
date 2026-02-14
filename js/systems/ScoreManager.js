window.CVInvaders = window.CVInvaders || {};

/**
 * ScoreManager — Scoring, combo tracking, and grade calculation.
 *
 * Tracks all gameplay stats (CVs caught/shot/missed, enemies killed, combos)
 * and applies score multipliers based on combo thresholds. The combo resets
 * on any miss or bad-CV-hits-player event. Final grade is determined by
 * total score against the GRADES thresholds in Config.
 */
window.CVInvaders.ScoreManager = class ScoreManager {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.missCount = 0;          // Tracks misses — combo resets after 3
        this.goodCVsCaught = 0;
        this.goodCVsMissed = 0;
        this.badCVsShot = 0;
        this.badCVsMissed = 0;
        this.enemiesDefeated = 0;
    }

    /** Look up the score multiplier for the current combo count. */
    getMultiplier() {
        const thresholds = window.CVInvaders.Config.SCORE.COMBO_THRESHOLDS;
        for (const t of thresholds) {
            if (this.combo >= t.min) return t.multiplier;
        }
        return 1.0;
    }

    /** Add points (positive scores get the combo multiplier, negatives don't). */
    addScore(base) {
        const multiplier = base > 0 ? this.getMultiplier() : 1;
        const points = Math.round(base * multiplier);
        this.score += points;
        if (this.score < 0) this.score = 0;
        this.scene.registry.set('score', this.score);
        return points;
    }

    catchUnicorn() {
        this.incrementCombo();
        return this.addScore(window.CVInvaders.Config.SCORE.CATCH_GOOD * 2);
    }

    incrementCombo() {
        this.combo++;
        this.missCount = 0; // Good action resets miss counter
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
            this.scene.registry.set('maxCombo', this.maxCombo);
        }
    }

    trackMiss() {
        this.missCount++;
        if (this.missCount >= 3) {
            this.combo = 0;
            this.missCount = 0;
        }
    }

    resetCombo() {
        this.combo = 0;
        this.missCount = 0;
    }

    catchGoodCV() {
        this.incrementCombo();
        this.goodCVsCaught++;
        this.scene.registry.set('goodCVsCaught', this.goodCVsCaught);
        return this.addScore(window.CVInvaders.Config.SCORE.CATCH_GOOD);
    }

    shootBadCV() {
        this.incrementCombo();
        this.badCVsShot++;
        this.scene.registry.set('badCVsShot', this.badCVsShot);
        return this.addScore(window.CVInvaders.Config.SCORE.SHOOT_BAD);
    }

    missGoodCV() {
        this.goodCVsMissed++;
        this.scene.registry.set('goodCVsMissed', this.goodCVsMissed);
        this.trackMiss();
        return this.addScore(window.CVInvaders.Config.SCORE.MISS_GOOD);
    }

    badCVReachesBottom() {
        this.badCVsMissed++;
        this.scene.registry.set('badCVsMissed', this.badCVsMissed);
        this.trackMiss();
        return this.addScore(window.CVInvaders.Config.SCORE.BAD_REACHES_BOTTOM);
    }

    badCVHitsPlayer() {
        this.trackMiss();
        return this.addScore(window.CVInvaders.Config.SCORE.BAD_HITS_PLAYER);
    }

    enemyKill() {
        this.enemiesDefeated++;
        this.scene.registry.set('enemiesDefeated', this.enemiesDefeated);
        return this.addScore(window.CVInvaders.Config.SCORE.ENEMY_KILL);
    }

    bossHit() {
        return this.addScore(window.CVInvaders.Config.SCORE.BOSS_HIT);
    }

    /** Award boss kill bonus, scaled by how quickly the boss was defeated (instant = max, 30 s+ = min). */
    bossKill(bossTime) {
        // Scale boss bonus from 2500 (instant) to 1000 (30s+)
        // Linear interpolation based on boss fight duration
        const maxTime = window.CVInvaders.Config.BOSS_TIMER || 30000;
        const t = Math.min(bossTime / maxTime, 1); // 0 = instant, 1 = full timer
        const maxPts = window.CVInvaders.Config.SCORE.BOSS_KILL_MAX;
        const minPts = window.CVInvaders.Config.SCORE.BOSS_KILL_MIN;
        const points = Math.round(maxPts - ((maxPts - minPts) * t));
        this.score += points;
        this.scene.registry.set('score', this.score);
        return points;
    }

    getGrade() {
        const grades = window.CVInvaders.Config.GRADES;
        for (const g of grades) {
            if (this.score >= g.min) return g;
        }
        return grades[grades.length - 1];
    }
};
