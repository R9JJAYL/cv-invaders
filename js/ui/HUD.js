window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.HUD = class HUD extends Phaser.Scene {
    constructor() {
        super({ key: 'HUD', active: false });
    }

    create() {
        const CFG = window.CVInvaders.Config;

        // Score
        this.scoreText = this.add.text(CFG.WIDTH - 20, 15, 'SCORE: 0', {
            fontFamily: 'Courier New',
            fontSize: '18px',
            color: CFG.COLORS.TEXT_PRIMARY,
            fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(100);

        // Boss countdown timer
        this.countdownText = this.add.text(CFG.WIDTH / 2, 15, '', {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: CFG.COLORS.PURPLE_ACCENT_HEX,
            fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(100);

        // Combo counter
        this.comboText = this.add.text(20, 20, '', {
            fontFamily: 'Courier New',
            fontSize: '14px',
            color: CFG.COLORS.COMBO,
            fontStyle: 'bold'
        }).setDepth(100);

        // Mute indicator
        this.muteText = this.add.text(CFG.WIDTH - 20, CFG.HEIGHT - 20, '[M] Sound: ON', {
            fontFamily: 'Courier New',
            fontSize: '12px',
            color: CFG.COLORS.TEXT_SECONDARY
        }).setOrigin(1, 1).setDepth(100);

        // Listen for registry changes
        this.registry.events.on('changedata-score', (parent, value) => {
            this.scoreText.setText('SCORE: ' + value);
            if (!this._scoreTween || !this._scoreTween.isPlaying()) {
                this._scoreTween = this.tweens.add({
                    targets: this.scoreText,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 80,
                    yoyo: true
                });
            }
        });

        // Mobile virtual controls
        this.isMobile = !this.sys.game.device.os.desktop;
        if (this.isMobile) {
            this.createMobileControls();
            // Hide mute text on mobile (no M key)
            this.muteText.setVisible(false);
        }
    }

    // ===== MOBILE CONTROLS =====
    // Polls raw pointer objects every frame instead of relying on scene
    // input events, which avoids multi-scene event propagation issues
    // that prevent simultaneous two-finger input.
    createMobileControls() {
        var CFG = window.CVInvaders.Config;

        // ========== VISUAL: SHOOT BUTTON (LEFT SIDE) ==========
        var shootX = 90;
        var shootY = CFG.HEIGHT - 90;
        var shootRadius = 50;

        this.shootButtonBg = this.add.circle(shootX, shootY, shootRadius, 0x333333, 0.4)
            .setDepth(200).setStrokeStyle(3, 0x00E5FF, 0.6);
        this.shootButtonInner = this.add.circle(shootX, shootY, shootRadius - 10, 0x00E5FF, 0.25)
            .setDepth(200);
        this.shootButtonLabel = this.add.text(shootX, shootY, 'FIRE', {
            fontFamily: 'Courier New', fontSize: '14px', color: '#00E5FF', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(201);

        // ========== VISUAL: JOYSTICK (RIGHT SIDE) ==========
        var joyX = CFG.WIDTH - 90;
        var joyY = CFG.HEIGHT - 90;
        var baseRadius = 60;
        var thumbRadius = 26;

        this.joystickBase = this.add.circle(joyX, joyY, baseRadius, 0x333333, 0.3)
            .setDepth(200).setStrokeStyle(3, 0xFFFFFF, 0.3);
        this.joystickThumb = this.add.circle(joyX, joyY, thumbRadius, 0xFFFFFF, 0.4)
            .setDepth(201);

        // ========== STATE ==========
        this._shootHeld = false;
        this._joystickNormX = 0;
        this._joystickBaseX = joyX;
        this._joystickBaseY = joyY;
        this._joystickBaseRadius = baseRadius;
        this._halfW = CFG.WIDTH / 2;
    }

    // ===== UPDATE — poll pointers directly & relay to ship =====
    update(time, delta) {
        if (!this.isMobile) return;

        var gameScene = this.scene.get('GameScene');
        if (!gameScene || !gameScene.ship || !gameScene.ship.isAlive) return;

        // Poll touch pointer objects directly from the global InputManager.
        // pointers[0] = mouse (skip), pointers[1] = first touch, pointers[2] = second touch.
        // This bypasses scene-level event dispatch entirely, which avoids
        // multi-scene input propagation issues that block simultaneous touches.
        var pointer1 = this.input.manager.pointers[1];  // First finger
        var pointer2 = this.input.manager.pointers[2];  // Second finger
        var shootHeld = false;
        var joystickX = 0;
        var joystickActive = false;

        // Check first finger
        if (pointer1 && pointer1.isDown) {
            if (pointer1.x < this._halfW) {
                shootHeld = true;
            } else {
                joystickActive = true;
                var dx1 = pointer1.x - this._joystickBaseX;
                var cd1 = Phaser.Math.Clamp(dx1, -this._joystickBaseRadius, this._joystickBaseRadius);
                joystickX = cd1 / this._joystickBaseRadius;
            }
        }

        // Check second finger
        if (pointer2 && pointer2.isDown) {
            if (pointer2.x < this._halfW) {
                shootHeld = true;
            } else {
                joystickActive = true;
                var dx2 = pointer2.x - this._joystickBaseX;
                var cd2 = Phaser.Math.Clamp(dx2, -this._joystickBaseRadius, this._joystickBaseRadius);
                joystickX = cd2 / this._joystickBaseRadius;
            }
        }

        // Update shoot visual feedback
        if (shootHeld !== this._shootHeld) {
            this._shootHeld = shootHeld;
            this.shootButtonInner.setFillStyle(0x00E5FF, shootHeld ? 0.6 : 0.25);
        }

        // Update joystick thumb visual
        if (joystickActive) {
            this._joystickNormX = joystickX;
            this.joystickThumb.setPosition(
                this._joystickBaseX + joystickX * this._joystickBaseRadius,
                this._joystickBaseY
            );
        } else {
            this._joystickNormX = 0;
            this.joystickThumb.setPosition(this._joystickBaseX, this._joystickBaseY);
        }

        // Relay to ship
        gameScene.ship.setMobileMovement(this._joystickNormX);
        gameScene.ship.setMobileShootPressed(this._shootHeld);
    }

    // ===== EXISTING HUD METHODS =====
    updateCombo(combo) {
        if (combo > 1) {
            const multiplier = this.getMultiplierText(combo);
            const newText = 'COMBO x' + combo + ' (' + multiplier + ')';
            // Only animate when combo value actually changes
            if (this.comboText.text !== newText) {
                this.comboText.setText(newText);
                if (!this._comboTween || !this._comboTween.isPlaying()) {
                    this._comboTween = this.tweens.add({
                        targets: this.comboText,
                        scaleX: 1.15,
                        scaleY: 1.15,
                        duration: 60,
                        yoyo: true
                    });
                }
            }
        } else {
            this.comboText.setText('');
        }
    }

    getMultiplierText(combo) {
        const thresholds = window.CVInvaders.Config.SCORE.COMBO_THRESHOLDS;
        for (const t of thresholds) {
            if (combo >= t.min) return t.multiplier + 'x';
        }
        return '1x';
    }

    showFloatingScore(x, y, points) {
        const color = points > 0 ? '#00FF00' : '#FF4444';
        const text = (points > 0 ? '+' : '') + points;
        const floater = this.add.text(x, y, text, {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: color,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: floater,
            y: y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => floater.destroy()
        });
    }

    updateCountdown(remainingMs, isBossPhase) {
        const label = isBossPhase ? 'FINAL BOSS ROUND' : 'TIME REMAINING';
        if (remainingMs <= 0) {
            this.countdownText.setText(label + ': 0s');
            this.countdownText.setColor('#FF4444');
        } else {
            const secs = Math.ceil(remainingMs / 1000);
            this.countdownText.setText(label + ': ' + secs + 's');

            // Urgency color shift in last 10 seconds
            if (secs <= 10) {
                this.countdownText.setColor('#FF4444');
            } else if (secs <= 20) {
                this.countdownText.setColor('#FFD700');
            } else {
                const CFG = window.CVInvaders.Config;
                this.countdownText.setColor(CFG.COLORS.PURPLE_ACCENT_HEX);
            }
        }
    }

    updateMuteText(muted) {
        this.muteText.setText('[M] Sound: ' + (muted ? 'OFF' : 'ON'));
    }

    showBossHealth(visible) {
        if (visible && !this.bossHealthBar) {
            this.bossLabel = this.add.text(window.CVInvaders.Config.WIDTH / 2, 45, 'AI BOT 9000', {
                fontFamily: 'Courier New',
                fontSize: '12px',
                color: '#FF4444',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0).setDepth(100);

            const barX = window.CVInvaders.Config.WIDTH / 2 - 150;
            this.bossHealthBg = this.add.rectangle(
                barX, 62,
                300, 10, 0x333333
            ).setOrigin(0, 0.5).setDepth(100);

            this.bossHealthBar = this.add.rectangle(
                barX, 62,
                300, 10, 0xFF0000
            ).setOrigin(0, 0.5).setDepth(100);
        }
        if (!visible && this.bossHealthBar) {
            this.bossLabel.destroy();
            this.bossHealthBg.destroy();
            this.bossHealthBar.destroy();
            this.bossHealthBar = null;
        }
    }

    updateBossHealth(ratio) {
        if (this.bossHealthBar) {
            this.bossHealthBar.setSize(300 * ratio, 10);
        }
    }

    shutdown() {
        this.registry.events.off('changedata-score');
    }
};
