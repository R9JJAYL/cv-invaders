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

    fire(x, y) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        this.setVelocityY(-window.CVInvaders.Config.BULLET_SPEED);
    }

    _onUpdate() {
        if (this.active && this.y < -20) {
            this.recycle();
        }
    }

    recycle() {
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        this.body.reset(0, 0);
    }
};
