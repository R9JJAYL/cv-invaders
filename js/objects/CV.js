window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.CV = class CV extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'cv-good');
        this.isGood = true;
        this.isDisguised = false;
        this.setActive(false);
        this.setVisible(false);

        // Manual update since Image doesn't auto-call preUpdate
        scene.events.on('update', this._onUpdate, this);
        scene.events.once('shutdown', () => {
            scene.events.off('update', this._onUpdate, this);
        });
    }

    spawn(x, y, isGood, fallSpeed, isDisguised) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        this.alpha = 1;

        this.isGood = isGood;
        this.isDisguised = isDisguised || false;

        if (this.isDisguised) {
            this.setTexture('cv-good');
            // Shimmer effect as visual tell
            if (this.shimmerTween) this.shimmerTween.remove();
            this.shimmerTween = this.scene.tweens.add({
                targets: this,
                alpha: { from: 1, to: 0.6 },
                duration: 300,
                yoyo: true,
                repeat: -1
            });
        } else {
            this.setTexture(isGood ? 'cv-good' : 'cv-bad');
            if (this.shimmerTween) {
                this.shimmerTween.remove();
                this.shimmerTween = null;
            }
        }

        this.setVelocityY(fallSpeed);
        this.setVelocityX(Phaser.Math.Between(-15, 15));

        // Slight rotation for natural feel
        this.setAngle(Phaser.Math.Between(-10, 10));
    }

    _onUpdate() {
        if (this.active && this.y > window.CVInvaders.Config.HEIGHT + 30) {
            this.handleMiss();
        }
    }

    handleMiss() {
        if (!this.active) return;

        if (this.isGood && !this.isDisguised) {
            this.scene.onGoodCVMissed();
        } else if (!this.isGood && !this.isDisguised) {
            this.scene.onBadCVReachedBottom();
        }
        this.recycle();
    }

    recycle() {
        if (this.shimmerTween) {
            this.shimmerTween.remove();
            this.shimmerTween = null;
        }
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        this.body.reset(0, 0);
        this.setAngle(0);
        this.setScale(1);
        this.alpha = 1;
    }
};
