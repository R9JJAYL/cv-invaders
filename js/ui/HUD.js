window.CVInvaders = window.CVInvaders || {};

/**
 * HUD — Persistent overlay scene for score, combo, countdown, and mobile controls.
 *
 * Launched alongside GameScene/BossScene and rendered on top of gameplay.
 * On desktop it shows score, combo counter, countdown timer, and mute hint.
 * On mobile it draws side-panel controls: left panel = shoot zone,
 * right panel = left/right arrow buttons.  The 800×600 gameplay area is
 * centred between the panels.
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
        var sideW = CFG.SIDE_PANEL_WIDTH || 0;

        // Score — positioned within the gameplay area (offset by side panel)
        this.scoreText = this.add.text(sideW + CFG.WIDTH - 20, 15, 'SCORE: 0', {
            fontFamily: 'Roboto',
            fontSize: '18px',
            color: CFG.COLORS.TEXT_PRIMARY,
            fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(100);

        // Boss countdown timer
        this.countdownText = this.add.text(sideW + CFG.WIDTH / 2, 15, '', {
            fontFamily: 'Roboto',
            fontSize: '16px',
            color: CFG.COLORS.PURPLE_ACCENT_HEX,
            fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(100);

        // Combo counter
        this.comboText = this.add.text(sideW + 20, 20, '', {
            fontFamily: 'Roboto',
            fontSize: '14px',
            color: CFG.COLORS.COMBO,
            fontStyle: 'bold'
        }).setDepth(100);

        // Mute indicator
        this.muteText = this.add.text(sideW + CFG.WIDTH - 20, CFG.HEIGHT - 20, '[M] Sound: ON', {
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

        // Clean up the global registry listener when this scene shuts down
        this.events.once('shutdown', () => {
            this.registry.events.off('changedata-score');
        });

        // Mobile virtual controls — side panels
        this.isMobile = !this.sys.game.device.os.desktop;
        if (this.isMobile) {
            this.createMobileControls();
            this.muteText.setVisible(false);
        }
    }

    // ===== MOBILE CONTROLS — SIDE PANELS =====
    createMobileControls() {
        var CFG = window.CVInvaders.Config;
        var sideW = CFG.SIDE_PANEL_WIDTH;
        var gameH = CFG.HEIGHT;
        var canvasW = CFG.CANVAS_WIDTH;

        // ========== LEFT PANEL — SHOOT ZONE ==========
        var leftPanel = this.add.graphics().setDepth(199);
        leftPanel.fillStyle(0x1a0a2e, 0.85);
        leftPanel.fillRect(0, 0, sideW, gameH);
        // Subtle divider line on right edge of left panel
        leftPanel.lineStyle(1, 0x9B59B6, 0.15);
        leftPanel.lineBetween(sideW, 0, sideW, gameH);

        // Shoot button — same style as arrow buttons (rounded rect, full height)
        var sBtnPad = 8;
        var sBtnW = sideW - sBtnPad * 2;
        var sBtnH = gameH - sBtnPad * 2;
        var sBtnR = 10;
        this._shootBg = this.add.graphics().setDepth(200);
        this._shootRect = { x: sBtnPad, y: sBtnPad, w: sBtnW, h: sBtnH, r: sBtnR };
        this._drawBtnBg(this._shootBg, this._shootRect, 0.5);

        var cx = sideW / 2;
        var cy = gameH / 2 - 30;

        // Crosshair — larger, with outer ring and inner dot
        var crosshair = this.add.graphics().setDepth(201);
        crosshair.lineStyle(2, 0x9B59B6, 0.5);
        crosshair.strokeCircle(cx, cy, 26);
        crosshair.lineStyle(1.5, 0xFFFFFF, 0.4);
        crosshair.strokeCircle(cx, cy, 14);
        crosshair.lineBetween(cx - 30, cy, cx - 8, cy);
        crosshair.lineBetween(cx + 8, cy, cx + 30, cy);
        crosshair.lineBetween(cx, cy - 30, cx, cy - 8);
        crosshair.lineBetween(cx, cy + 8, cx, cy + 30);
        crosshair.fillStyle(0x00E5FF, 0.6);
        crosshair.fillCircle(cx, cy, 3);

        // "TAP TO FIRE" label below crosshair — single line
        this.add.text(cx, cy + 50, 'TAP TO\nFIRE', {
            fontFamily: 'Roboto',
            fontSize: '13px',
            color: 'rgba(155,89,182,0.6)',
            letterSpacing: 2,
            fontStyle: 'bold',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5).setDepth(201);

        // ========== RIGHT PANEL — background fills from game edge to canvas edge ==========
        var rightPanelX = sideW + CFG.WIDTH; // start of right panel
        var rightPanelW = canvasW - rightPanelX; // use actual remaining width (not sideW) to avoid rounding gaps
        var rightPanel = this.add.graphics().setDepth(199);
        rightPanel.fillStyle(0x1a0a2e, 0.85);
        rightPanel.fillRect(rightPanelX, 0, rightPanelW, gameH);
        // Subtle divider line on left edge of right panel
        rightPanel.lineStyle(1, 0x9B59B6, 0.15);
        rightPanel.lineBetween(rightPanelX, 0, rightPanelX, gameH);

        // ========== ARROW BUTTONS — fill from game edge to screen edge ==========
        var btnPad = 8;
        var btnGap = 8;
        var btnH = gameH - btnPad * 2;
        var btnR = 10;
        var btnY = gameH / 2;

        // Buttons span from rightPanelX+pad to canvasW-pad (full remaining width)
        var rpMidX = rightPanelX + rightPanelW / 2;

        // Left arrow button — from game edge to midpoint
        var leftBtnX0 = rightPanelX + btnPad;
        var leftBtnW = (rpMidX - btnGap / 2) - leftBtnX0;
        var leftBtnCX = leftBtnX0 + leftBtnW / 2;
        this._leftBg = this.add.graphics().setDepth(200);
        this._leftRect = { x: leftBtnX0, y: btnY - btnH / 2, w: leftBtnW, h: btnH, r: btnR };
        this._drawBtnBg(this._leftBg, this._leftRect, 0.5);
        var leftArrow = this.add.graphics().setDepth(201);
        leftArrow.fillStyle(0xFFFFFF, 0.8);
        leftArrow.fillTriangle(leftBtnCX - 12, btnY, leftBtnCX + 8, btnY - 14, leftBtnCX + 8, btnY + 14);

        // Right arrow button — from midpoint to screen edge
        var rightBtnX0 = rpMidX + btnGap / 2;
        var rightBtnW = (canvasW - btnPad) - rightBtnX0;
        var rightBtnCX = rightBtnX0 + rightBtnW / 2;
        this._rightBg = this.add.graphics().setDepth(200);
        this._rightRect = { x: rightBtnX0, y: btnY - btnH / 2, w: rightBtnW, h: btnH, r: btnR };
        this._drawBtnBg(this._rightBg, this._rightRect, 0.5);
        var rightArrow = this.add.graphics().setDepth(201);
        rightArrow.fillStyle(0xFFFFFF, 0.8);
        rightArrow.fillTriangle(rightBtnCX + 12, btnY, rightBtnCX - 8, btnY - 14, rightBtnCX - 8, btnY + 14);

        // ========== HITBOX ZONES ==========
        // Shoot: left panel only (0 to sideW)
        // Move left: gameplay area + left half of right panel (sideW to rpMidX)
        // Move right: right half of right panel (rpMidX to canvasW)
        // This aligns the hitbox split with the visual button split so
        // tapping the left arrow triggers left movement, not right.
        this._shootHeld = false;
        this._shootBoundary = sideW;                             // shoot zone = left panel only
        this._splitX = rpMidX;                                   // left/right split at right panel midpoint
    }

    // ===== UPDATE — poll pointers directly & relay to ship =====
    update(time, delta) {
        if (!this.isMobile) return;

        var gameScene = this.scene.get('GameScene');
        if (!gameScene || !gameScene.ship || !gameScene.ship.isAlive) return;

        var pointer1 = this.input.manager.pointers[1];
        var pointer2 = this.input.manager.pointers[2];
        var shootHeld = false;
        var moveDir = 0;

        var self = this;
        function checkPointer(ptr) {
            if (!ptr || !ptr.isDown) return;

            if (ptr.x < self._shootBoundary) {
                shootHeld = true;
                return;
            }

            if (ptr.x < self._splitX) {
                moveDir = -1;
            } else {
                moveDir = 1;
            }
        }

        checkPointer(pointer1);
        checkPointer(pointer2);

        this._shootHeld = shootHeld;

        // Visual feedback on all buttons
        this._drawBtnBg(this._shootBg, this._shootRect, shootHeld ? 0.8 : 0.5);
        this._drawBtnBg(this._leftBg, this._leftRect, moveDir === -1 ? 0.8 : 0.5);
        this._drawBtnBg(this._rightBg, this._rightRect, moveDir === 1 ? 0.8 : 0.5);

        gameScene.ship.setMobileMovement(moveDir);
        gameScene.ship.setMobileShootPressed(this._shootHeld);
    }

    /**
     * Redraw a rounded-rect button background.
     * @param {Phaser.GameObjects.Graphics} gfx
     * @param {Object} rect - { x, y, w, h, r }
     * @param {number} fillAlpha
     */
    _drawBtnBg(gfx, rect, fillAlpha) {
        gfx.clear();
        gfx.fillStyle(0x2d1450, fillAlpha);
        gfx.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, rect.r);
        gfx.lineStyle(1, 0x9B59B6, 0.35);
        gfx.strokeRoundedRect(rect.x, rect.y, rect.w, rect.h, rect.r);
    }

    // ===== PUBLIC METHODS (called by GameScene / BossScene) =====

    updateCombo(combo) {
        if (combo > 1) {
            const multiplier = this.getMultiplierText(combo);
            const newText = 'COMBO x' + combo + ' (' + multiplier + ')';
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
        var sideW = window.CVInvaders.Config.SIDE_PANEL_WIDTH || 0;
        const color = points > 0 ? '#00FF00' : '#FF4444';
        const text = (points > 0 ? '+' : '') + points;
        const floater = this.add.text(sideW + x, y, text, {
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
        var sideW = window.CVInvaders.Config.SIDE_PANEL_WIDTH || 0;
        if (visible && !this.bossHealthBar) {
            this.bossLabel = this.add.text(sideW + window.CVInvaders.Config.WIDTH / 2, 45, 'AI BOT 9000', {
                fontFamily: 'Roboto',
                fontSize: '12px',
                color: '#FF4444',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0).setDepth(100);

            const barX = sideW + window.CVInvaders.Config.WIDTH / 2 - 150;
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

};
