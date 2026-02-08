window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.ScoreManager = class ScoreManager {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.goodCVsCaught = 0;
        this.badCVsShot = 0;
        this.enemiesDefeated = 0;
    }

    getMultiplier() {
        const thresholds = window.CVInvaders.Config.SCORE.COMBO_THRESHOLDS;
        for (const t of thresholds) {
            if (this.combo >= t.min) return t.multiplier;
        }
        return 1.0;
    }

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
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
            this.scene.registry.set('maxCombo', this.maxCombo);
        }
    }

    resetCombo() {
        this.combo = 0;
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
        this.resetCombo();
        return this.addScore(window.CVInvaders.Config.SCORE.MISS_GOOD);
    }

    badCVReachesBottom() {
        this.resetCombo();
        return this.addScore(window.CVInvaders.Config.SCORE.BAD_REACHES_BOTTOM);
    }

    badCVHitsPlayer() {
        this.resetCombo();
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

    caughtDisguisedCV() {
        this.resetCombo();
        return this.addScore(window.CVInvaders.Config.SCORE.CAUGHT_DISGUISED);
    }

    getGrade() {
        const grades = window.CVInvaders.Config.GRADES;
        for (const g of grades) {
            if (this.score >= g.min) return g;
        }
        return grades[grades.length - 1];
    }
};
