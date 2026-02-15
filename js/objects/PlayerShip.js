/**
 * PlayerShip — Player-controlled ship with catch zone and dual-input support.
 *
 * On desktop: arrow keys to move, spacebar to shoot (one shot per press).
 * On mobile: HUD scene polls touch pointers and calls setMobileMovement()
 * and setMobileShootPressed() each frame.
 *
 * The catch zone is a narrow invisible rectangle above the ship that detects
 * overlap with good CVs and unicorns. Catching a unicorn doubles its width
 * temporarily.
 */
window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.PlayerShip = class PlayerShip extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'ship');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        var s = window.CVInvaders.Config.MOBILE_SCALE || 1;
        this.setScale(s);
        this.setCollideWorldBounds(true);
        this.setDepth(10);
        this.body.setSize(76, 34);
        this.body.setOffset(12, 8);

        this.speed = window.CVInvaders.Config.PLAYER_SPEED;
        this.fireRate = window.CVInvaders.Config.FIRE_RATE;
        this.lastFired = 0;
        this.isAlive = true;
        this.invincible = false;

        // Catch zone dimensions
        this.catchZoneWidth = window.CVInvaders.Config.CATCH_ZONE_WIDTH;
        this.unicornActive = false;

        // Create catch zone as separate physics object
        this.catchZone = scene.add.rectangle(x, y - 20, this.catchZoneWidth, 12, 0x00ff00, 0);
        scene.physics.add.existing(this.catchZone);
        this.catchZone.body.setAllowGravity(false);
        this.catchZone.setDepth(10);

        // Platform detection
        this.isMobile = !scene.sys.game.device.os.desktop;

        // Shoot state — set by keyboard (desktop) or HUD button (mobile)
        this.shootPressed = false;

        // Mobile movement — set by HUD joystick each frame
        this._mobileVelocityX = 0;

        // Desktop: keyboard input
        this.cursors = scene.input.keyboard.createCursorKeys();

        // Manual update since Image doesn't auto-call preUpdate
        scene.events.on('update', this._onUpdate, this);
        scene.events.once('shutdown', () => {
            scene.events.off('update', this._onUpdate, this);
        });
    }

    _onUpdate(time, delta) {
        if (!this.isAlive) return;

        if (this.isMobile) {
            // Mobile: velocity driven by arrow buttons in HUD (-1, 0, or 1)
            var mv = this._mobileVelocityX || 0;
            this.setVelocityX(mv * this.speed);
            // shootPressed is set externally by HUD shoot button
        } else {
            // Desktop: keyboard movement
            if (this.cursors.left.isDown) {
                this.setVelocityX(-this.speed);
            } else if (this.cursors.right.isDown) {
                this.setVelocityX(this.speed);
            } else {
                this.setVelocityX(0);
            }

            // Desktop shoot: spacebar — one shot per press
            // JustDown returns true only on the first frame the key goes down
            this.shootPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);
        }

        // Sync catch zone position
        this.catchZone.x = this.x;
        this.catchZone.y = this.y - 20;
        this.catchZone.body.reset(this.catchZone.x, this.catchZone.y);
    }

    // Called by HUD joystick each frame (mobile only)
    setMobileMovement(normalizedX) {
        this._mobileVelocityX = normalizedX;
    }

    // Called by HUD shoot button (mobile only)
    // Only fires on new tap (rising edge) — holding does not continuously fire.
    setMobileShootPressed(isPressed) {
        if (isPressed && !this._mobileShootWasDown) {
            this.shootPressed = true;     // rising edge — allow one shot
        }
        this._mobileShootWasDown = isPressed;
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
    }
};
