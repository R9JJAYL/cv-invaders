window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.PlayerShip = class PlayerShip extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'ship');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setDepth(10);
        this.body.setSize(50, 30);
        this.body.setOffset(5, 6);

        this.speed = window.CVInvaders.Config.PLAYER_SPEED;
        this.fireRate = window.CVInvaders.Config.FIRE_RATE;
        this.lastFired = 0;
        this.isAlive = true;
        this.invincible = false;

        // Catch zone dimensions
        this.catchZoneWidth = window.CVInvaders.Config.CATCH_ZONE_WIDTH;
        this.unicornActive = false;

        // Create catch zone as separate physics object
        this.catchZone = scene.add.rectangle(x, y - 18, this.catchZoneWidth, 12, 0x00ff00, 0);
        scene.physics.add.existing(this.catchZone);
        this.catchZone.body.setAllowGravity(false);
        this.catchZone.setDepth(10);

        // Input
        this.cursors = scene.input.keyboard.createCursorKeys();

        // Touch input
        scene.input.on('pointermove', (pointer) => {
            if (pointer.isDown && this.isAlive) {
                this.targetX = Phaser.Math.Clamp(pointer.x, 30, window.CVInvaders.Config.WIDTH - 30);
            }
        });
        scene.input.on('pointerdown', (pointer) => {
            if (this.isAlive) {
                this.targetX = Phaser.Math.Clamp(pointer.x, 30, window.CVInvaders.Config.WIDTH - 30);
            }
        });
        this.targetX = null;

        // Manual update since Image doesn't auto-call preUpdate
        scene.events.on('update', this._onUpdate, this);
        scene.events.once('shutdown', () => {
            scene.events.off('update', this._onUpdate, this);
        });
    }

    _onUpdate(time, delta) {
        if (!this.isAlive) return;

        // Keyboard movement
        if (this.cursors.left.isDown) {
            this.setVelocityX(-this.speed);
            this.targetX = null;
        } else if (this.cursors.right.isDown) {
            this.setVelocityX(this.speed);
            this.targetX = null;
        } else if (this.targetX !== null) {
            // Touch/mouse follow
            const diff = this.targetX - this.x;
            if (Math.abs(diff) < 3) {
                this.setVelocityX(0);
                this.x = this.targetX;
                this.targetX = null;
            } else {
                this.setVelocityX(diff > 0 ? this.speed : -this.speed);
            }
        } else {
            this.setVelocityX(0);
        }

        // Sync catch zone position
        this.catchZone.x = this.x;
        this.catchZone.y = this.y - 18;
        this.catchZone.body.reset(this.catchZone.x, this.catchZone.y);
    }

    fireBullet(time) {
        if (!this.isAlive) return false;
        if (time < this.lastFired + this.fireRate) return false;
        this.lastFired = time;
        return true;
    }

    takeDamage() {
        if (this.invincible || !this.isAlive) return false;

        // Brief invincibility frames (visual feedback only, no death)
        this.invincible = true;
        this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.alpha = 1;
                this.invincible = false;
            }
        });

        // Screen shake
        this.scene.cameras.main.shake(150, 0.008);

        return false;
    }

    die() {
        this.isAlive = false;
        this.setVelocityX(0);

        // Death animation
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 500,
            onComplete: () => {
                this.scene.onPlayerDeath();
            }
        });
    }

    activateUnicorn() {
        this.unicornActive = true;
        this.catchZoneWidth = window.CVInvaders.Config.CATCH_ZONE_UNICORN;
        this.catchZone.setSize(this.catchZoneWidth, 12);
        this.catchZone.body.setSize(this.catchZoneWidth, 12);

        // Visual glow
        this.setTint(0xBB8FCE);

        if (this.unicornTimer) this.unicornTimer.remove();
        this.unicornTimer = this.scene.time.delayedCall(
            window.CVInvaders.Config.UNICORN_DURATION,
            () => this.deactivateUnicorn()
        );
    }

    deactivateUnicorn() {
        this.unicornActive = false;
        this.catchZoneWidth = window.CVInvaders.Config.CATCH_ZONE_WIDTH;
        this.catchZone.setSize(this.catchZoneWidth, 12);
        this.catchZone.body.setSize(this.catchZoneWidth, 12);
        this.clearTint();
    }

    shutdown() {
        if (this.unicornTimer) this.unicornTimer.remove();
        this.scene.events.off('update', this._onUpdate, this);
        this.scene.input.off('pointermove');
        this.scene.input.off('pointerdown');
    }
};
