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
    // Uses scene-level pointer events (not interactive objects) so both
    // controls work simultaneously with multi-touch.
    createMobileControls() {
        var CFG = window.CVInvaders.Config;
        var halfW = CFG.WIDTH / 2;

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
        this._shootPointerId = -1;
        this._joystickActive = false;
        this._joystickPointerId = -1;
        this._joystickBaseX = joyX;
        this._joystickBaseY = joyY;
        this._joystickBaseRadius = baseRadius;
        this._joystickNormX = 0;
        this._halfW = halfW;

        // ========== SCENE-LEVEL TOUCH HANDLERS ==========
        // Left half = shoot, Right half = joystick. Tracked by pointer ID.
        this.input.on('pointerdown', (pointer) => {
            if (pointer.x < this._halfW) {
                // Left side — shoot
                this._shootHeld = true;
                this._shootPointerId = pointer.id;
                this.shootButtonInner.setFillStyle(0x00E5FF, 0.6);
            } else {
                // Right side — joystick
                this._joystickActive = true;
                this._joystickPointerId = pointer.id;
                this._updateJoystickThumb(pointer);
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this._joystickActive && pointer.id === this._joystickPointerId) {
                this._updateJoystickThumb(pointer);
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (pointer.id === this._shootPointerId) {
                this._shootHeld = false;
                this._shootPointerId = -1;
                this.shootButtonInner.setFillStyle(0x00E5FF, 0.25);
            }
            if (pointer.id === this._joystickPointerId) {
                this._joystickActive = false;
                this._joystickPointerId = -1;
                this._joystickNormX = 0;
                this.joystickThumb.setPosition(this._joystickBaseX, this._joystickBaseY);
            }
        });
    }

    _updateJoystickThumb(pointer) {
        var dx = pointer.x - this._joystickBaseX;
        var clampedDx = Phaser.Math.Clamp(dx, -this._joystickBaseRadius, this._joystickBaseRadius);

        this.joystickThumb.setPosition(
            this._joystickBaseX + clampedDx,
            this._joystickBaseY
        );

        this._joystickNormX = clampedDx / this._joystickBaseRadius;
    }

    // ===== UPDATE — relay mobile inputs to ship =====
    update(time, delta) {
        if (!this.isMobile) return;

        var gameScene = this.scene.get('GameScene');
        if (!gameScene || !gameScene.ship || !gameScene.ship.isAlive) return;

        // Push joystick input
        gameScene.ship.setMobileMovement(this._joystickNormX || 0);

        // Push shoot state
        gameScene.ship.setMobileShootPressed(this._shootHeld || false);
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
        if (this.isMobile) {
            this.input.off('pointermove');
            this.input.off('pointerup');
        }
    }
};
