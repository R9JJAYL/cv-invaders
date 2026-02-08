window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.PurpleUnicorn = class PurpleUnicorn extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'unicorn');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(9);
        this.body.setAllowGravity(false);

        // Gentle pulse
        scene.tweens.add({
            targets: this,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.setVelocityY(120);

        // Manual update since Image doesn't auto-call preUpdate
        scene.events.on('update', this._onUpdate, this);
        scene.events.once('shutdown', () => {
            scene.events.off('update', this._onUpdate, this);
        });
    }

    _onUpdate() {
        if (this.y > window.CVInvaders.Config.HEIGHT + 30) {
            this.scene.events.off('update', this._onUpdate, this);
            this.destroy();
        }
    }
};
