window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.TutorialScene = class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' });
    }

    create() {
        const CFG = window.CVInvaders.Config;
        const DLG = window.CVInvaders.Dialogue.CINEMATIC;

        // Expand the world bounds so we can place the ATS below the viewport
        // Normal viewport: 0 to CFG.HEIGHT (600)
        // ATS zone: CFG.HEIGHT to CFG.HEIGHT + 200
        const worldH = CFG.HEIGHT + 250;

        // Scrolling starfield — fill both normal + extended area
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            const star = this.add.image(
                Phaser.Math.Between(0, CFG.WIDTH),
                Phaser.Math.Between(0, worldH),
                'star'
            ).setAlpha(Phaser.Math.FloatBetween(0.2, 0.8)).setDepth(0);
            this.stars.push({ sprite: star, speed: Phaser.Math.Between(20, 60) });
        }

        // ATS Building — placed BELOW the normal viewport
        this.ats = this.add.image(CFG.WIDTH / 2, CFG.HEIGHT + 130, 'ats-building')
            .setDepth(5)
            .setAlpha(0)
            .setScale(2);

        // Player ship — starts off-screen below (in the ATS zone)
        this.shipSprite = this.add.image(CFG.WIDTH / 2, CFG.HEIGHT + 250, 'ship')
            .setDepth(10)
            .setAlpha(0);

        // Main narrative text — uses setScrollFactor(0) so it stays fixed on screen
        this.narrativeText = this.add.text(CFG.WIDTH / 2, CFG.HEIGHT / 2 - 40, '', {
            fontFamily: 'Courier New',
            fontSize: '24px',
            color: '#FFFFFF',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5).setDepth(50).setAlpha(0).setScrollFactor(0);

        // Set camera bounds to allow panning down
        this.cameras.main.setBounds(0, 0, CFG.WIDTH, worldH);

        // Fade in and run the cinematic
        this.cameras.main.fadeIn(500);
        this.runCinematic(DLG, CFG);
    }

    runCinematic(DLG, CFG) {
        // Beat 1 (0.5s): [ ALERT ] in red, then INCOMING THREAT DETECTED in gold below
        this.time.delayedCall(500, () => {
            // Show [ ALERT ] in red with flash
            this.narrativeText.setColor('#FF4444');
            this.narrativeText.setText('[ ALERT ]');
            this.tweens.killTweensOf(this.narrativeText);
            this.narrativeText.setAlpha(0);
            this.tweens.add({
                targets: this.narrativeText,
                alpha: 1,
                duration: 250
            });
            this.cameras.main.flash(150, 120, 20, 20);

            // After a beat, add the gold subtitle as a separate text below
            this.time.delayedCall(700, () => {
                this.threatText = this.add.text(CFG.WIDTH / 2, CFG.HEIGHT / 2 + 20, 'INCOMING THREAT DETECTED', {
                    fontFamily: 'Courier New',
                    fontSize: '24px',
                    color: '#FFD700',
                    fontStyle: 'bold',
                    align: 'center'
                }).setOrigin(0.5).setDepth(50).setAlpha(0).setScrollFactor(0);

                this.tweens.add({
                    targets: this.threatText,
                    alpha: 1,
                    duration: 250
                });

                // Fade out both after remaining duration
                this.time.delayedCall(1200, () => {
                    this.tweens.add({
                        targets: [this.narrativeText, this.threatText],
                        alpha: 0,
                        duration: 250,
                        onComplete: () => {
                            if (this.threatText) {
                                this.threatText.destroy();
                                this.threatText = null;
                            }
                        }
                    });
                });
            });
        });

        // Beat 2 (3.0s): Camera pans DOWN to reveal ATS, red CVs rain down
        this.time.delayedCall(3000, () => {
            // ATS fades in
            this.tweens.add({
                targets: this.ats,
                alpha: 1,
                duration: 600,
                ease: 'Power2'
            });
            // Pan camera down to show the ATS
            this.cameras.main.pan(
                CFG.WIDTH / 2,
                CFG.HEIGHT + 130,
                1200,
                'Power2'
            );

            // ATS flashes red (under attack)
            this.time.delayedCall(800, () => {
                this.flashATS();
            });

            // Red CVs falling toward the ATS
            this.spawnCinematicCVs(CFG);

            this.narrativeText.setColor('#FFFFFF');
            this.showNarrative(DLG[1].text, DLG[1].duration);
        });

        // Beat 3 (5.4s): Ship launches up, camera follows, show helm text + CV examples
        this.time.delayedCall(5400, () => {
            this.shipSprite.setAlpha(1);

            // Ship flies up from below ATS to gameplay position (bottom of screen)
            this.tweens.add({
                targets: this.shipSprite,
                y: CFG.HEIGHT - 50,
                duration: 2000,
                ease: 'Power2'
            });

            // Camera follows the ship up at the same time
            this.cameras.main.pan(
                CFG.WIDTH / 2,
                CFG.HEIGHT / 2,
                2000,
                'Power2'
            );

            this.narrativeText.setColor('#FFFFFF');
            this.showNarrative(DLG[2].text, DLG[2].duration);

            // Show CV examples after the camera has panned up
            this.time.delayedCall(1500, () => {
                this.showCVExamples(CFG);
            });
        });

        // Beat 4 (8.5s): Dramatic countdown 3... 2... 1... GO!
        this.time.delayedCall(8500, () => {
            this.runCountdown(CFG);
        });
    }

    showNarrative(text, duration) {
        this.tweens.killTweensOf(this.narrativeText);
        this.narrativeText.setAlpha(0);
        this.narrativeText.setText(text);
        this.tweens.add({
            targets: this.narrativeText,
            alpha: 1,
            duration: 250,
            onComplete: () => {
                this.time.delayedCall(duration, () => {
                    this.tweens.add({
                        targets: this.narrativeText,
                        alpha: 0,
                        duration: 250
                    });
                });
            }
        });
    }

    runCountdown(CFG) {
        // Hide the narrative text so it doesn't overlap
        this.narrativeText.setAlpha(0);

        // Fade out SHOOT/CATCH examples when "1" appears
        if (this.cvExamples) {
            this.time.delayedCall(1800, () => {
                this.tweens.add({
                    targets: this.cvExamples,
                    alpha: 0,
                    duration: 500,
                    ease: 'Power2'
                });
            });
        }

        const beats = [
            { text: '3', color: '#FFFFFF', size: '96px', shake: 3 },
            { text: '2', color: '#FFD700', size: '110px', shake: 5 },
            { text: '1', color: '#FF4444', size: '128px', shake: 8 },
            { text: 'GO!', color: '#00FF00', size: '96px', shake: 12 }
        ];

        beats.forEach((beat, i) => {
            this.time.delayedCall(i * 900, () => {
                const countText = this.add.text(CFG.WIDTH / 2, CFG.HEIGHT / 2 - 30, beat.text, {
                    fontFamily: 'Courier New',
                    fontSize: beat.size,
                    color: beat.color,
                    fontStyle: 'bold'
                }).setOrigin(0.5).setDepth(60).setAlpha(0).setScale(0.2).setScrollFactor(0);

                // Slam in from small to big
                this.tweens.add({
                    targets: countText,
                    alpha: 1,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 120,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        // Screen shake on impact
                        this.cameras.main.shake(100, beat.shake / 1000);

                        // Hold briefly then expand and fade
                        this.time.delayedCall(250, () => {
                            this.tweens.add({
                                targets: countText,
                                alpha: 0,
                                scaleX: 2.5,
                                scaleY: 2.5,
                                duration: 450,
                                ease: 'Power2',
                                onComplete: () => countText.destroy()
                            });
                        });
                    }
                });
            });
        });

        // Transition after countdown finishes
        this.time.delayedCall(beats.length * 900 + 500, () => {
            this.transitionToGame();
        });
    }

    flashATS() {
        this.ats.setTint(0xFF4444);
        this.time.delayedCall(300, () => {
            this.ats.clearTint();
            this.time.delayedCall(200, () => {
                this.ats.setTint(0xFF4444);
                this.time.delayedCall(300, () => {
                    this.ats.clearTint();
                });
            });
        });
    }

    spawnCinematicCVs(CFG) {
        // CVs fall from top of screen toward the ATS below
        for (let i = 0; i < 5; i++) {
            const cv = this.add.image(
                Phaser.Math.Between(80, CFG.WIDTH - 80),
                CFG.HEIGHT - 30 - (i * 50),
                'cv-bad'
            ).setDepth(3).setAlpha(0.8).setAngle(Phaser.Math.Between(-15, 15));

            this.tweens.add({
                targets: cv,
                y: CFG.HEIGHT + 110,
                duration: 1400 + (i * 250),
                delay: i * 180,
                ease: 'Power1',
                onComplete: () => {
                    this.tweens.add({
                        targets: cv,
                        alpha: 0,
                        scaleX: 1.5,
                        scaleY: 1.5,
                        duration: 200,
                        onComplete: () => cv.destroy()
                    });
                }
            });
        }
    }

    showCVExamples(CFG) {
        // Position below the narrative text so they don't overlap
        const centerY = CFG.HEIGHT / 2 + 40;

        const badCV = this.add.image(CFG.WIDTH / 2 - 120, centerY, 'cv-bad')
            .setDepth(50).setAlpha(0).setScale(1.5).setScrollFactor(0);
        const goodCV = this.add.image(CFG.WIDTH / 2 + 120, centerY, 'cv-good')
            .setDepth(50).setAlpha(0).setScale(1.5).setScrollFactor(0);

        const shootLabel = this.add.text(CFG.WIDTH / 2 - 120, centerY + 40, 'SHOOT', {
            fontFamily: 'Courier New',
            fontSize: '14px',
            color: CFG.COLORS.CV_BAD_HEX,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(50).setAlpha(0).setScrollFactor(0);

        const catchLabel = this.add.text(CFG.WIDTH / 2 + 120, centerY + 40, 'CATCH', {
            fontFamily: 'Courier New',
            fontSize: '14px',
            color: CFG.COLORS.CV_GOOD_HEX,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(50).setAlpha(0).setScrollFactor(0);

        this.cvExamples = [badCV, goodCV, shootLabel, catchLabel];
        this.tweens.add({
            targets: this.cvExamples,
            alpha: 1,
            duration: 400
        });
    }

    transitionToGame() {
        if (this.threatText) {
            this.threatText.destroy();
            this.threatText = null;
        }

        // Clean up cinematic objects but keep the starfield running
        if (this.ats) { this.ats.destroy(); this.ats = null; }
        if (this.shipSprite) { this.shipSprite.destroy(); this.shipSprite = null; }
        if (this.narrativeText) { this.narrativeText.destroy(); this.narrativeText = null; }
        if (this.cvExamples) {
            this.cvExamples.forEach(i => i.destroy());
            this.cvExamples = null;
        }

        // Reset camera to normal viewport but keep scene alive for starfield
        const CFG = window.CVInvaders.Config;
        this.cameras.main.setBounds(0, 0, CFG.WIDTH, CFG.HEIGHT);
        this.cameras.main.setScroll(0, 0);
        this.cameras.main.resetFX();

        // Launch GameScene on top — TutorialScene stays running underneath as starfield
        this.scene.launch('GameScene');
    }

    update(time, delta) {
        if (this.stars) {
            const wrapY = this.cameras.main.scrollY + 620;
            this.stars.forEach(s => {
                s.sprite.y += s.speed * delta / 1000;
                if (s.sprite.y > wrapY) s.sprite.y = this.cameras.main.scrollY - 10;
            });
        }
    }
};
