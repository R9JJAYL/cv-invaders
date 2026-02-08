window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.Boss = class Boss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'boss');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(9);
        this.setScale(1.5);
        this.body.setSize(60, 45);
        this.body.setAllowGravity(false);

        const CFG = window.CVInvaders.Config;
        this.maxHealth = CFG.BOSS_HEALTH;
        this.health = this.maxHealth;
        this.phase = 1;
        this.isAlive = true;
        this.spamTimer = 0;
        this.bulletTimer = 0;
        this.moveTimer = 0;
        this.moveTargetX = x;
        this.entryComplete = false;

        // Figure-8 movement params for phase 2
        this.fig8Time = 0;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (!this.isAlive || !this.entryComplete) return;

        const CFG = window.CVInvaders.Config;

        // Check phase transition
        if (this.phase === 1 && this.health <= this.maxHealth * CFG.BOSS_PHASE2_THRESHOLD) {
            this.enterPhase2();
        }

        if (this.phase === 1) {
            this.updatePhase1(time, delta, CFG);
        } else {
            this.updatePhase2(time, delta, CFG);
        }
    }

    updatePhase1(time, delta, CFG) {
        // Slow horizontal drift
        this.moveTimer += delta;
        if (this.moveTimer > 3000) {
            this.moveTimer = 0;
            this.moveTargetX = Phaser.Math.Between(100, CFG.WIDTH - 100);
        }
        const diff = this.moveTargetX - this.x;
        if (Math.abs(diff) > 2) {
            this.x += Math.sign(diff) * 80 * (delta / 1000);
        }

        // Spam CVs
        this.spamTimer += delta;
        if (this.spamTimer >= CFG.BOSS_SPAM_RATE) {
            this.spamTimer = 0;
            this.scene.bossSpawnCV(this.x, this.y + 30, false);
        }
    }

    updatePhase2(time, delta, CFG) {
        // Figure-8 movement
        this.fig8Time += delta * 0.001;
        this.x = CFG.WIDTH / 2 + Math.sin(this.fig8Time * 1.5) * 200;
        this.y = 80 + Math.sin(this.fig8Time * 3) * 30;

        // Spam disguised CVs
        this.spamTimer += delta;
        if (this.spamTimer >= CFG.BOSS_SPAM_RATE * 1.5) {
            this.spamTimer = 0;
            const isDisguised = Math.random() < CFG.BOSS_DISGUISE_CHANCE;
            this.scene.bossSpawnCV(this.x, this.y + 30, isDisguised);
        }

        // Direct bullet fire
        this.bulletTimer += delta;
        if (this.bulletTimer >= 1500) {
            this.bulletTimer = 0;
            this.scene.bossFire(this.x, this.y + 40);
        }
    }

    enterPhase2() {
        this.phase = 2;
        this.spamTimer = 0;
        this.bulletTimer = 0;

        // Flash effect
        this.scene.cameras.main.flash(200, 120, 0, 0);

        // Show phase 2 dialogue
        this.scene.showBossDialogue(window.CVInvaders.Dialogue.BOSS.PHASE2);

        // Visual change - tint red
        this.setTint(0xFF4444);
    }

    takeDamage() {
        if (!this.isAlive) return false;

        this.health--;

        // Flash white — reuse single tween instead of creating new ones
        if (!this._flashTween || !this._flashTween.isPlaying()) {
            this._flashTween = this.scene.tweens.add({
                targets: this,
                alpha: 0.5,
                duration: 50,
                yoyo: true
            });
        }

        this.scene.updateBossHealthBar(this.health, this.maxHealth);

        if (this.health <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    die() {
        this.isAlive = false;
        this.body.enable = false;

        // Kill all existing tweens on boss to prevent pile-up
        this.scene.tweens.killTweensOf(this);

        this.scene.onBossDefeated();

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: 3,
            scaleY: 3,
            angle: 720,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                this.setActive(false).setVisible(false);
            }
        });
    }

    startEntry(targetY) {
        this.y = -60;
        this.scene.tweens.add({
            targets: this,
            y: targetY,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                this.entryComplete = true;
            }
        });
    }
};
