window.CVInvaders = window.CVInvaders || {};

/**
 * HUD — Persistent overlay scene for score, combo, countdown, and mobile controls.
 *
 * Launched alongside GameScene/BossScene and rendered on top of gameplay.
 * On desktop it shows score, combo counter, countdown timer, and mute hint.
 * On mobile it additionally draws touch controls: two rounded-square arrow
 * buttons on the right half of the screen, with the left half acting as a
 * shoot zone.
 *
 * Mobile input uses direct pointer polling (reading InputManager.pointers[]
 * every frame) rather than scene input events, because Phaser's event
 * propagation across parallel scenes prevents reliable two-finger input.
 */
window.CVInvaders.HUD = class HUD extends Phaser.Scene {
    constructor() {
        super({ key: 'HUD', active: false });
    }

    /** Set up all HUD text elements and, on mobile, the virtual touch controls. */
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

        // Clean up the global registry listener when this scene shuts down,
        // otherwise it accumulates on each Play Again restart
        this.events.once('shutdown', () => {
            this.registry.events.off('changedata-score');
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
        var barH = CFG.MOBILE_CONTROLS_HEIGHT;
        var barY = CFG.HEIGHT; // top of controls bar (below gameplay area)

        // ========== CONTROLS BAR BACKGROUND ==========
        var barBg = this.add.graphics().setDepth(199);
        barBg.fillStyle(0x1a0a2e, 0.85);
        barBg.fillRect(0, barY, CFG.WIDTH, barH);
        // Subtle divider line at top of bar
        barBg.lineStyle(1, 0x9B59B6, 0.15);
        barBg.lineBetween(0, barY, CFG.WIDTH, barY);

        // ========== VISUAL: ARROW BUTTONS (RIGHT SIDE, INSIDE BAR) ==========
        var arrowY = barY + barH / 2; // vertically centred in bar
        var arrowSize = 28;
        var arrowGap = 24;
        var rightCenter = CFG.WIDTH - 110;

        // Left arrow button (visual only — hitbox is full-height zone)
        var btnW = arrowSize * 4;
        var btnH = barH - 16; // slightly smaller than bar height
        var btnR = 10;
        var leftX = rightCenter - arrowSize - arrowGap / 2;
        this._leftBg = this.add.graphics().setDepth(200);
        this._leftRect = { x: leftX - btnW / 2, y: arrowY - btnH / 2, w: btnW, h: btnH, r: btnR };
        this._drawBtnBg(this._leftBg, this._leftRect, 0.5);
        var leftArrow = this.add.graphics().setDepth(201);
        leftArrow.fillStyle(0xFFFFFF, 0.8);
        leftArrow.fillTriangle(leftX - 12, arrowY, leftX + 8, arrowY - 12, leftX + 8, arrowY + 12);

        // Right arrow button (visual only — hitbox is full-height zone)
        var rightX = rightCenter + arrowSize + arrowGap / 2;
        this._rightBg = this.add.graphics().setDepth(200);
        this._rightRect = { x: rightX - btnW / 2, y: arrowY - btnH / 2, w: btnW, h: btnH, r: btnR };
        this._drawBtnBg(this._rightBg, this._rightRect, 0.5);
        var rightArrow = this.add.graphics().setDepth(201);
        rightArrow.fillStyle(0xFFFFFF, 0.8);
        rightArrow.fillTriangle(rightX + 12, arrowY, rightX - 8, arrowY - 12, rightX - 8, arrowY + 12);

        // ========== SHOOT LABEL (left side of bar) ==========
        this.add.text(CFG.WIDTH / 4, arrowY, 'TAP TO FIRE', {
            fontFamily: 'Roboto',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: 2
        }).setOrigin(0.5).setDepth(200);

        // ========== STATE ==========
        // Hitbox: full-height rectangular zones covering entire screen
        // Left zone: from 0 to _halfW (full height) — shoot
        // Middle zone: from _halfW to _splitX (full height) — move left
        // Right zone: from _splitX to screen edge (full height) — move right
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

        // Update arrow visual feedback (redraw graphics with highlight alpha)
        this._drawBtnBg(this._leftBg, this._leftRect, moveDir === -1 ? 0.8 : 0.5);
        this._drawBtnBg(this._rightBg, this._rightRect, moveDir === 1 ? 0.8 : 0.5);

        // Relay to ship — full speed in the pressed direction
        gameScene.ship.setMobileMovement(moveDir);
        gameScene.ship.setMobileShootPressed(this._shootHeld);
    }

    /**
     * Redraw a rounded-rect button background. Graphics objects must be
     * cleared and redrawn each frame (unlike Phaser GameObjects which
     * support setFillStyle).
     * @param {Phaser.GameObjects.Graphics} gfx - The graphics object to draw into
     * @param {Object} rect - { x, y, w, h, r } rectangle definition
     * @param {number} fillAlpha - Fill opacity (0–1), raised when pressed
     */
    _drawBtnBg(gfx, rect, fillAlpha) {
        gfx.clear();
        gfx.fillStyle(0x2d1450, fillAlpha);
        gfx.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, rect.r);
        gfx.lineStyle(1, 0x9B59B6, 0.35);
        gfx.strokeRoundedRect(rect.x, rect.y, rect.w, rect.h, rect.r);
    }

    // ===== PUBLIC METHODS (called by GameScene / BossScene) =====

    /** Update the combo display text with current multiplier. Animates on change. */
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

    /** Look up the display multiplier string (e.g. "2x") for the current combo count. */
    getMultiplierText(combo) {
        const thresholds = window.CVInvaders.Config.SCORE.COMBO_THRESHOLDS;
        for (const t of thresholds) {
            if (combo >= t.min) return t.multiplier + 'x';
        }
        return '1x';
    }

    /** Show a floating +/- score number that drifts up and fades out. */
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

    /** Update the countdown timer display. Colour shifts to yellow then red as time runs out. */
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

    /** Toggle the boss health bar (label + background + red fill bar). */
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

    /** Resize the red health bar to reflect the boss's remaining HP (0–1). */
    updateBossHealth(ratio) {
        if (this.bossHealthBar) {
            this.bossHealthBar.setSize(300 * ratio, 10);
        }
    }

};
