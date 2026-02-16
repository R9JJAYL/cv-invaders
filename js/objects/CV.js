/**
 * CV — Falling job application (CV / résumé), object-pooled.
 *
 * Can be good (green, should be caught) or bad (red, should be shot).
 * Falls at a configurable speed with slight random drift and rotation.
 */
window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.CV = class CV extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'cv-good');
        this.isGood = true;
        this.setActive(false);
        this.setVisible(false);

        // Manual update since Image doesn't auto-call preUpdate
        scene.events.on('update', this._onUpdate, this);
        scene.events.once('shutdown', () => {
            scene.events.off('update', this._onUpdate, this);
        });
    }

    /**
     * Activate a CV from the pool and send it falling.
     * @param {number} x - Horizontal spawn position.
     * @param {number} y - Vertical spawn position (usually just above the screen).
     * @param {boolean} isGood - True for a good CV (should be caught).
     * @param {number} fallSpeed - Downward velocity in px/s.
     */
    spawn(x, y, isGood, fallSpeed) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
        this.alpha = 1;

        var s = window.CVInvaders.Config.MOBILE_SCALE || 1;
        this.setScale(s);

        this.isGood = isGood;
        this.setTexture(isGood ? 'cv-good' : 'cv-bad');

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

    /** Handle a CV that fell off the bottom without being caught or shot. */
    handleMiss() {
        if (!this.active || !this.scene) return;

        try {
            if (this.isGood) {
                this.scene.onGoodCVMissed(this.x);
            } else {
                this.scene.onBadCVReachedBottom(this.x);
            }
        } catch (e) {
            console.warn('CV handleMiss error:', e);
        }
        this.recycle();
    }

    recycle() {
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        this.body.reset(0, 0);
        this.setAngle(0);
        this.setScale(window.CVInvaders.Config.MOBILE_SCALE || 1);
        this.alpha = 1;
    }
};
