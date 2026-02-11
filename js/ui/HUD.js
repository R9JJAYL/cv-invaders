window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.HUD = class HUD extends Phaser.Scene {
    constructor() {
        super({ key: 'HUD', active: false });
    }

    create() {
        const CFG = window.CVInvaders.Config;

        // Score
        this.scoreText = this.add.text(CFG.WIDTH - 20, 15, 'SCORE: 0', {
            fontFamily: 'Roboto',
            fontSize: '18px',
            color: CFG.COLORS.TEXT_PRIMARY,
            fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(100);

        // Boss countdown timer
        this.countdownText = this.add.text(CFG.WIDTH / 2, 15, '', {
            fontFamily: 'Roboto',
            fontSize: '16px',
            color: CFG.COLORS.PURPLE_ACCENT_HEX,
            fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(100);

        // Combo counter
        this.comboText = this.add.text(20, 20, '', {
            fontFamily: 'Roboto',
            fontSize: '14px',
            color: CFG.COLORS.COMBO,
            fontStyle: 'bold'
        }).setDepth(100);

        // Mute indicator
        this.muteText = this.add.text(CFG.WIDTH - 20, CFG.HEIGHT - 20, '[M] Sound: ON', {
            fontFamily: 'Roboto',
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

        // ========== VISUAL: ARROW BUTTONS (RIGHT SIDE, MID-SCREEN) ==========
        var arrowY = CFG.HEIGHT / 2;
        var arrowSize = 40;
        var arrowGap = 20;
        var rightCenter = CFG.WIDTH - 110;

        // Left arrow button (visual only — hitbox is full-height zone)
        var leftX = rightCenter - arrowSize - arrowGap / 2;
        this.leftArrowBg = this.add.circle(leftX, arrowY, arrowSize, 0x111111, 0.5)
            .setDepth(200).setStrokeStyle(2, 0x00E5FF, 0.5);
        var leftArrow = this.add.graphics().setDepth(201);
        leftArrow.fillStyle(0xFFFFFF, 0.8);
        leftArrow.fillTriangle(leftX - 14, arrowY, leftX + 10, arrowY - 14, leftX + 10, arrowY + 14);

        // Right arrow button (visual only — hitbox is full-height zone)
        var rightX = rightCenter + arrowSize + arrowGap / 2;
        this.rightArrowBg = this.add.circle(rightX, arrowY, arrowSize, 0x111111, 0.5)
            .setDepth(200).setStrokeStyle(2, 0x00E5FF, 0.5);
        var rightArrow = this.add.graphics().setDepth(201);
        rightArrow.fillStyle(0xFFFFFF, 0.8);
        rightArrow.fillTriangle(rightX + 14, arrowY, rightX - 10, arrowY - 14, rightX - 10, arrowY + 14);

        // ========== STATE ==========
        // Hitbox: full-height rectangular zones on right half of screen
        // Left zone: from _halfW to _splitX (full height)
        // Right zone: from _splitX to screen edge (full height)
        this._shootHeld = false;
        this._halfW = CFG.WIDTH / 2;
        this._splitX = (leftX + rightX) / 2;
    }

    // ===== UPDATE — poll pointers directly & relay to ship =====
    update(time, delta) {
        if (!this.isMobile) return;

        var gameScene = this.scene.get('GameScene');
        if (!gameScene || !gameScene.ship || !gameScene.ship.isAlive) return;

        // Poll touch pointer objects directly from the global InputManager.
        var pointer1 = this.input.manager.pointers[1];
        var pointer2 = this.input.manager.pointers[2];
        var shootHeld = false;
        var moveDir = 0; // -1 left, 0 none, 1 right

        // Helper: check pointer zone — full-height hitboxes
        var self = this;
        function checkPointer(ptr) {
            if (!ptr || !ptr.isDown) return;

            // Left half of screen = shoot
            if (ptr.x < self._halfW) {
                shootHeld = true;
                return;
            }

            // Right half — split into left-arrow zone and right-arrow zone
            if (ptr.x < self._splitX) {
                moveDir = -1;
            } else {
                moveDir = 1;
            }
        }

        checkPointer(pointer1);
        checkPointer(pointer2);

        // Update shoot state
        this._shootHeld = shootHeld;

        // Update arrow visual feedback
        this.leftArrowBg.setFillStyle(0x333333, moveDir === -1 ? 0.7 : 0.4);
        this.rightArrowBg.setFillStyle(0x333333, moveDir === 1 ? 0.7 : 0.4);

        // Relay to ship — full speed in the pressed direction
        gameScene.ship.setMobileMovement(moveDir);
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
            fontFamily: 'Roboto',
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

    updateCountdown(remainingMs) {
        if (remainingMs <= 0) {
            this.countdownText.setText('TIME REMAINING: 0s');
            this.countdownText.setColor('#FF4444');
        } else {
            const secs = Math.ceil(remainingMs / 1000);
            this.countdownText.setText('TIME REMAINING: ' + secs + 's');

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

    hideCountdown() {
        this.countdownText.setText('');
    }

    updateMuteText(muted) {
        this.muteText.setText('[M] Sound: ' + (muted ? 'OFF' : 'ON'));
    }

    showBossHealth(visible) {
        if (visible && !this.bossHealthBar) {
            this.bossLabel = this.add.text(window.CVInvaders.Config.WIDTH / 2, 45, 'AI BOT 9000', {
                fontFamily: 'Roboto',
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
