window.CVInvaders = window.CVInvaders || {};

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
        this.direction = 1;
        this.isAlive = true;

        // Manual update since Image doesn't auto-call preUpdate
        scene.events.on('update', this._onUpdate, this);
        scene.events.once('shutdown', () => {
            scene.events.off('update', this._onUpdate, this);
        });
    }

    _onUpdate(time, delta) {
        if (!this.isAlive || !this.active) return;

        // Horizontal movement with bounce
        this.x += this.speed * this.direction * (delta / 1000);
        if (this.x > window.CVInvaders.Config.WIDTH - 30) {
            this.direction = -1;
        } else if (this.x < 30) {
            this.direction = 1;
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
