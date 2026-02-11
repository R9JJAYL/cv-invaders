window.CVInvaders = window.CVInvaders || {};

// Shared formation state — all enemies move as one unit
window.CVInvaders._enemyFormation = {
    direction: 1,
    stepDown: 30,       // pixels to drop on each wall hit
    edgePadding: 30,    // wall margin
    maxY: 400           // stop descending past this y
};

window.CVInvaders.Enemy = class Enemy extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(8);
        this.body.setSize(26, 28);
        this.body.setOffset(7, 4);
        this.health = window.CVInvaders.Config.ENEMY_HEALTH;
        this.speed = window.CVInvaders.Config.ENEMY_SPEED;
        this.fireRate = window.CVInvaders.Config.ENEMY_FIRE_RATE;
        this.lastFired = 0;
        this.isAlive = true;

        // Manual update since Image doesn't auto-call preUpdate
        scene.events.on('update', this._onUpdate, this);
        scene.events.once('shutdown', () => {
            scene.events.off('update', this._onUpdate, this);
        });
    }

    _onUpdate(time, delta) {
        if (!this.isAlive || !this.active) return;

        const CFG = window.CVInvaders.Config;
        const form = window.CVInvaders._enemyFormation;

        // Move horizontally with formation direction
        this.x += this.speed * form.direction * (delta / 1000);

        // Check if ANY enemy hit the wall — if so, all step down and reverse
        if (this.x > CFG.WIDTH - form.edgePadding || this.x < form.edgePadding) {
            // Clamp this enemy to the edge
            this.x = Phaser.Math.Clamp(this.x, form.edgePadding, CFG.WIDTH - form.edgePadding);

            // Reverse direction for all enemies
            form.direction *= -1;

            // Step ALL living enemies down
            const enemies = this.scene.enemies;
            if (enemies) {
                enemies.getChildren().forEach(e => {
                    if (e.isAlive && e.active && e.y < form.maxY) {
                        e.y += form.stepDown;
                    }
                });
            }
        }

        // Firing
        if (time > this.lastFired + this.fireRate) {
            this.lastFired = time;
            this.scene.enemyFire(this.x, this.y + 20);
        }
    }

    takeDamage() {
        if (!this.isAlive) return false;

        this.health--;
        if (!this._flashTween || !this._flashTween.isPlaying()) {
            this._flashTween = this.scene.tweens.add({
                targets: this,
                alpha: 0.5,
                duration: 50,
                yoyo: true
            });
        }

        if (this.health <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    die() {
        this.isAlive = false;
        this.body.enable = false;
        this.scene.events.off('update', this._onUpdate, this);
        this.scene.tweens.killTweensOf(this);
        this.scene.onEnemyDefeated(this.x, this.y);

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 300,
            onComplete: () => {
                this.destroy();
            }
        });
    }

    reset(x, y) {
        this.setPosition(x, y);
        this.health = window.CVInvaders.Config.ENEMY_HEALTH;
        this.isAlive = true;
        this.alpha = 1;
        this.setScale(1);
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.lastFired = 0;
    }
};
