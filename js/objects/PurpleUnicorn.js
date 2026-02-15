window.CVInvaders = window.CVInvaders || {};

/**
 * PurpleUnicorn — Collectible power-up that falls during waves.
 *
 * When the player catches a unicorn their catch zone doubles in width
 * for a limited time (see PlayerShip.activateUnicorn). The unicorn
 * drifts downward at a fixed speed with a gentle scale-pulse so it
 * stands out from regular CVs. It self-destructs when it falls off
 * the bottom of the screen.
 *
 * Spawned by WaveManager at pre-configured times per wave.
 */
window.CVInvaders.PurpleUnicorn = class PurpleUnicorn extends Phaser.Physics.Arcade.Image {
    /**
     * @param {Phaser.Scene} scene - The scene this unicorn belongs to
     * @param {number} x - Spawn X position
     * @param {number} y - Spawn Y position
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'unicorn');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        var s = window.CVInvaders.Config.MOBILE_SCALE || 1;
        this.setScale(s);
        this.setDepth(9);
        this.body.setAllowGravity(false);

        // Gentle scale pulse to make the power-up visually distinct
        scene.tweens.add({
            targets: this,
            scaleX: 1.2 * s,
            scaleY: 1.2 * s,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.setVelocityY(120);

        // Arcade Image doesn't call preUpdate, so we hook into the scene update loop
        scene.events.on('update', this._onUpdate, this);
        scene.events.once('shutdown', () => {
            scene.events.off('update', this._onUpdate, this);
        });
    }

    /** Self-destruct when the unicorn drifts below the visible area. */
    _onUpdate() {
        if (this.y > window.CVInvaders.Config.HEIGHT + 30) {
            this.scene.events.off('update', this._onUpdate, this);
            this.destroy();
        }
    }
};
