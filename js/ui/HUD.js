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

        // ========== VISUAL: ARROW BUTTONS (RIGHT SIDE) ==========
        var arrowY = CFG.HEIGHT - 90;
        var arrowSize = 50;
        var arrowGap = 30;
        var rightCenter = CFG.WIDTH - 90;

        // Left arrow button
        this.leftArrowBg = this.add.circle(rightCenter - arrowSize - arrowGap / 2, arrowY, arrowSize, 0x333333, 0.4)
            .setDepth(200).setStrokeStyle(3, 0xFFFFFF, 0.4);
        this.leftArrowLabel = this.add.text(rightCenter - arrowSize - arrowGap / 2, arrowY, '◀', {
            fontFamily: 'Courier New', fontSize: '28px', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(201);

        // Right arrow button
        this.rightArrowBg = this.add.circle(rightCenter + arrowSize + arrowGap / 2, arrowY, arrowSize, 0x333333, 0.4)
            .setDepth(200).setStrokeStyle(3, 0xFFFFFF, 0.4);
        this.rightArrowLabel = this.add.text(rightCenter + arrowSize + arrowGap / 2, arrowY, '▶', {
            fontFamily: 'Courier New', fontSize: '28px', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(201);

        // ========== STATE ==========
        this._shootHeld = false;
        this._leftArrowX = rightCenter - arrowSize - arrowGap / 2;
        this._rightArrowX = rightCenter + arrowSize + arrowGap / 2;
        this._arrowY = arrowY;
        this._arrowRadius = arrowSize;
        this._halfW = CFG.WIDTH / 2;
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

        // Helper: check if pointer is within an arrow button
        var self = this;
        function checkPointer(ptr) {
            if (!ptr || !ptr.isDown) return;

            // Left half = shoot
            if (ptr.x < self._halfW) {
                shootHeld = true;
                return;
            }

            // Right half = check arrow buttons
            var dxL = ptr.x - self._leftArrowX;
            var dyL = ptr.y - self._arrowY;
            if (dxL * dxL + dyL * dyL <= self._arrowRadius * self._arrowRadius) {
                moveDir = -1;
                return;
            }

            var dxR = ptr.x - self._rightArrowX;
            var dyR = ptr.y - self._arrowY;
            if (dxR * dxR + dyR * dyR <= self._arrowRadius * self._arrowRadius) {
                moveDir = 1;
                return;
            }
        }

        checkPointer(pointer1);
        checkPointer(pointer2);

        // Update shoot visual feedback
        if (shootHeld !== this._shootHeld) {
            this._shootHeld = shootHeld;
            this.shootButtonInner.setFillStyle(0x00E5FF, shootHeld ? 0.6 : 0.25);
        }

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
