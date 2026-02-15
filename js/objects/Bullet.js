/**
 * Bullet — Player projectile, object-pooled.
 *
 * Bullets are pre-created in a Phaser physics group and recycled via
 * fire() / recycle() to avoid runtime allocation. They travel upward
 * at BULLET_SPEED and auto-recycle when they leave the top of the screen.
 */
window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.Bullet = class Bullet extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
        this.setActive(false);
        this.setVisible(false);

        // Manual update since Image doesn't auto-call preUpdate
        scene.events.on('update', this._onUpdate, this);
        scene.events.once('shutdown', () => {
            scene.events.off('update', this._onUpdate, this);
        });
    }

    /** Activate and launch upward from (x, y). */
    fire(x, y) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        this.setScale(window.CVInvaders.Config.MOBILE_SCALE || 1);
        this.setVelocityY(-window.CVInvaders.Config.BULLET_SPEED);
    }

    _onUpdate() {
        if (this.active && this.y < -20) {
            this.recycle();
        }
    }

    /** Deactivate and return to the pool. */
    recycle() {
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        this.body.reset(0, 0);
    }
};
