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
    createMobileControls() {
        var CFG = window.CVInvaders.Config;

        // ========== SHOOT BUTTON (LEFT SIDE) ==========
        var shootX = 75;
        var shootY = CFG.HEIGHT - 75;
        var shootRadius = 40;

        // Outer ring
        this.shootButtonBg = this.add.circle(shootX, shootY, shootRadius, 0x333333, 0.4)
            .setDepth(200)
            .setStrokeStyle(2, 0x00E5FF, 0.6);

        // Inner filled circle
        this.shootButtonInner = this.add.circle(shootX, shootY, shootRadius - 8, 0x00E5FF, 0.25)
            .setDepth(200);

        // "FIRE" label
        this.shootButtonLabel = this.add.text(shootX, shootY, 'FIRE', {
            fontFamily: 'Courier New',
            fontSize: '12px',
            color: '#00E5FF',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(201);

        // Make interactive with larger hit area
        this.shootButtonBg.setInteractive(
            new Phaser.Geom.Circle(0, 0, shootRadius + 10),
            Phaser.Geom.Circle.Contains
        );
        this._shootHeld = false;

        this.shootButtonBg.on('pointerdown', () => {
            this._shootHeld = true;
            this.shootButtonInner.setFillStyle(0x00E5FF, 0.6);
        });
        this.shootButtonBg.on('pointerup', () => {
            this._shootHeld = false;
            this.shootButtonInner.setFillStyle(0x00E5FF, 0.25);
        });
        this.shootButtonBg.on('pointerout', () => {
            this._shootHeld = false;
            this.shootButtonInner.setFillStyle(0x00E5FF, 0.25);
        });

        // ========== JOYSTICK (RIGHT SIDE) ==========
        var joyX = CFG.WIDTH - 75;
        var joyY = CFG.HEIGHT - 75;
        var baseRadius = 50;
        var thumbRadius = 22;

        // Base circle
        this.joystickBase = this.add.circle(joyX, joyY, baseRadius, 0x333333, 0.3)
            .setDepth(200)
            .setStrokeStyle(2, 0xFFFFFF, 0.3);

        // Thumb circle
        this.joystickThumb = this.add.circle(joyX, joyY, thumbRadius, 0xFFFFFF, 0.4)
            .setDepth(201);

        // Joystick state
        this._joystickActive = false;
        this._joystickBaseX = joyX;
        this._joystickBaseY = joyY;
        this._joystickBaseRadius = baseRadius;
        this._joystickNormX = 0;
        this._joystickPointerId = -1;

        // Make base interactive
        this.joystickBase.setInteractive(
            new Phaser.Geom.Circle(0, 0, baseRadius + 15),
            Phaser.Geom.Circle.Contains
        );

        this.joystickBase.on('pointerdown', (pointer) => {
            this._joystickActive = true;
            this._joystickPointerId = pointer.id;
            this._updateJoystickThumb(pointer);
        });

        // Scene-level listeners for drag beyond base
        this.input.on('pointermove', (pointer) => {
            if (this._joystickActive && pointer.id === this._joystickPointerId) {
                this._updateJoystickThumb(pointer);
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (this._joystickActive && pointer.id === this._joystickPointerId) {
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

        // Move thumb horizontally only (vertical stays at base center)
        this.joystickThumb.setPosition(
            this._joystickBaseX + clampedDx,
            this._joystickBaseY
        );

        // Normalize to -1..1
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
