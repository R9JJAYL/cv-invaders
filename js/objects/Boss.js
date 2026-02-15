/**
 * Boss (AI Bot 9000) — Final encounter with two combat phases.
 *
 * Phase 1: Tracks the player horizontally with random offsets, spamming
 *          CVs downward at BOSS_SPAM_RATE.
 * Phase 2: Figure-8 movement pattern, fires direct bullets, and spawns
 *          CVs. Lerps into the figure-8 to avoid a jarring snap.
 *
 * Entry animation: flies down from off-screen over `entryDuration` ms,
 * then waits 1.5 s (grace period) before becoming damageable.
 */
window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.Boss = class Boss extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'boss');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(9);
        var s = window.CVInvaders.Config.MOBILE_SCALE || 1;
        this.setScale(1.5 * s);
        this.body.setSize(60, 45);
        this.body.setOffset(10, 5);
        this.body.setAllowGravity(false);
        this.body.enable = false; // disabled until entry completes

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

        // Manual update since Image doesn't auto-call preUpdate
        scene.events.on('update', this._onUpdate, this);
        scene.events.once('shutdown', () => {
            scene.events.off('update', this._onUpdate, this);
        });
    }

    _onUpdate(time, delta) {
        if (!this.isAlive || !this.entryComplete || this.scene.gameOver) return;

        const CFG = window.CVInvaders.Config;

        // Check phase transition (guard prevents re-entry)
        if (this.phase === 1 && !this._enteringPhase2 && this.health <= this.maxHealth * CFG.BOSS_PHASE2_THRESHOLD) {
            this._enteringPhase2 = true;
            this.enterPhase2();
        }

        if (this.phase === 1) {
            this.updatePhase1(time, delta, CFG);
        } else {
            this.updatePhase2(time, delta, CFG);
        }

        // Sync physics body to display position
        if (this.body && this.body.enable) {
            this.body.reset(this.x, this.y);
        }
    }

    updatePhase1(time, delta, CFG) {
        // Randomised left-right movement — picks random target positions
        // so the player can't predict when it will change direction
        if (!this._p1TargetX) {
            this._p1TargetX = Phaser.Math.Between(100, CFG.WIDTH - 100);
            this._p1Speed = Phaser.Math.Between(130, 220);
        }

        var dx = this._p1TargetX - this.x;
        var dist = Math.abs(dx);
        if (dist < 8) {
            // Reached target — pick a new random one
            this._p1TargetX = Phaser.Math.Between(80, CFG.WIDTH - 80);
            this._p1Speed = Phaser.Math.Between(130, 220);
        } else {
            var step = this._p1Speed * delta / 1000;
            this.x += (dx > 0 ? 1 : -1) * Math.min(step, dist);
        }

        // Gentle vertical bob
        this.moveTimer += delta * 0.001;
        this.y = 80 + Math.sin(this.moveTimer * 0.9) * 10;

        // Spam CVs
        this.spamTimer += delta;
        if (this.spamTimer >= CFG.BOSS_SPAM_RATE) {
            this.spamTimer = 0;
            this.scene.bossSpawnCV(this.x, this.y + 30);
        }
    }

    updatePhase2(time, delta, CFG) {
        // Figure-8 movement — lerp into it to avoid snap
        this.fig8Time += delta * 0.001;
        const targetX = CFG.WIDTH / 2 + Math.sin(this.fig8Time * 1.0) * (CFG.WIDTH * 0.25);
        const targetY = 80 + Math.sin(this.fig8Time * 2.0) * 30;
        // Blend factor ramps from 0→1 over ~1 second
        this._phase2Blend = Math.min(1, (this._phase2Blend || 0) + delta * 0.002);
        this.x += (targetX - this.x) * this._phase2Blend;
        this.y += (targetY - this.y) * this._phase2Blend;

        // Spam CVs
        this.spamTimer += delta;
        if (this.spamTimer >= CFG.BOSS_SPAM_RATE * 1.5) {
            this.spamTimer = 0;
            this.scene.bossSpawnCV(this.x, this.y + 30);
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
        this._phase2Blend = 0; // smooth blend into figure-8 movement

        // Flash effect
        this.scene.cameras.main.flash(200, 120, 0, 0);

        // Show phase 2 dialogue
        this.scene.showBossDialogue(window.CVInvaders.Dialogue.BOSS.PHASE2);

        // Visual change - tint red
        this.setTint(0xFF4444);
    }

    takeDamage() {
        if (!this.isAlive || !this.entryComplete || this.scene.gameOver) return false;

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
        if (!this.isAlive) return; // prevent double-death from multiple bullets in same frame
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

    startEntry(targetY, duration) {
        var entryDuration = duration || 2000;

        // Pulsing alpha during entry to show invulnerability
        this._entryPulse = this.scene.tweens.add({
            targets: this,
            alpha: { from: 1, to: 0.4 },
            duration: 300,
            yoyo: true,
            repeat: -1
        });

        // Tween from current position (wherever boss was placed) down to gameplay y
        // When called with a camera pan, this keeps boss and camera in sync
        this.scene.tweens.add({
            targets: this,
            y: targetY,
            duration: entryDuration,
            ease: 'Power2',
            onComplete: () => {
                // Grace period after landing before taking damage
                this.scene.time.delayedCall(1500, () => {
                    // Stop pulsing, go solid
                    if (this._entryPulse) {
                        this._entryPulse.remove();
                        this._entryPulse = null;
                    }
                    this.setAlpha(1);
                    this.entryComplete = true;
                    this.body.enable = true;
                    this.body.reset(this.x, this.y);
                });
            }
        });
    }
};
