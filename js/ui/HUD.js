window.CVInvaders = window.CVInvaders || {};

/**
 * HUD — Persistent overlay scene for score, combo, countdown, and mobile controls.
 *
 * Launched alongside GameScene/BossScene and rendered on top of gameplay.
 * On desktop it shows score, combo counter, and countdown timer.
 * On mobile it draws side-panel controls: left panel = shoot zone,
 * right panel = left/right arrow buttons.  The 800x600 gameplay area is
 * centred between the panels.
 *
 * Mobile input uses direct pointer polling (reading InputManager.pointers[]
 * every frame) rather than scene input events, because Phaser's event
 * propagation across parallel scenes prevents reliable two-finger input.
 *
 * A flip button lets the player swap shoot/arrows to the opposite sides.
 * During the flip animation, the shoot panel slides across the FRONT of
 * the game area (depth 250) while the arrows slide BEHIND (depth 198).
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

        // Combo counter — right-aligned under score
        this.comboText = this.add.text(sideW + CFG.WIDTH - 20, 36, '', {
            fontFamily: 'Roboto',
            fontSize: '14px',
            color: CFG.COLORS.COMBO,
            fontStyle: 'bold'
        }).setOrigin(1, 0).setDepth(100);

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
        }
    }

    // ===== MOBILE CONTROLS — SIDE PANELS =====
    createMobileControls() {
        var CFG = window.CVInvaders.Config;
        var sideW = CFG.SIDE_PANEL_WIDTH;
        var gameH = CFG.HEIGHT;
        var canvasW = CFG.CANVAS_WIDTH;

        // ===== FLIP STATE =====
        this._controlsFlipped = false;
        this._flipAnimating = false;

        // Check saved preference
        try {
            if (localStorage.getItem('cv_invaders_controls_flipped') === 'true') {
                this._controlsFlipped = true;
            }
        } catch (e) {}

        // ========== PANEL BACKGROUNDS (static — always behind everything) ==========
        this._leftPanelBg = this.add.graphics().setDepth(199);
        this._leftPanelBg.fillStyle(0x1a0a2e, 0.85);
        this._leftPanelBg.fillRect(0, 0, sideW, gameH);
        this._leftPanelBg.lineStyle(1, 0x9B59B6, 0.15);
        this._leftPanelBg.lineBetween(sideW, 0, sideW, gameH);

        var rightPanelX = sideW + CFG.WIDTH;
        var rightPanelW = canvasW - rightPanelX;
        this._rightPanelBg = this.add.graphics().setDepth(199);
        this._rightPanelBg.fillStyle(0x1a0a2e, 0.85);
        this._rightPanelBg.fillRect(rightPanelX, 0, rightPanelW, gameH);
        this._rightPanelBg.lineStyle(1, 0x9B59B6, 0.15);
        this._rightPanelBg.lineBetween(rightPanelX, 0, rightPanelX, gameH);

        // ========== STORE LAYOUT CONSTANTS ==========
        this._sideW = sideW;
        this._gameH = gameH;
        this._canvasW = canvasW;
        this._rightPanelX = rightPanelX;
        this._rightPanelW = rightPanelW;

        // ========== CREATE BUTTON GRAPHICS ==========
        this._shootBg = this.add.graphics().setDepth(200);
        this._leftBg = this.add.graphics().setDepth(200);
        this._rightBg = this.add.graphics().setDepth(200);

        // Crosshair graphics — drawn at origin, repositioned via setPosition
        this._crosshair = this.add.graphics().setDepth(201);
        this._drawCrosshair(this._crosshair);

        // "TAP TO FIRE" label
        this._fireLabel = this.add.text(0, 0, 'TAP TO\nFIRE', {
            fontFamily: 'Roboto',
            fontSize: '13px',
            color: 'rgba(155,89,182,0.6)',
            letterSpacing: 2,
            fontStyle: 'bold',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5).setDepth(201);

        // Arrow graphics — drawn at origin, repositioned via setPosition
        this._leftArrowGfx = this.add.graphics().setDepth(201);
        this._rightArrowGfx = this.add.graphics().setDepth(201);

        // ========== FLIP BUTTON ==========
        this._flipIcon = this.add.graphics().setDepth(202);
        this._flipLabel = this.add.text(0, 0, '⇄  flip controls', {
            fontFamily: 'Roboto',
            fontSize: '24px',
            color: 'rgba(255,255,255,0.5)',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(202);
        this._flipZone = this.add.zone(0, 0, 220, 50).setDepth(202).setInteractive();
        this._flipZone.on('pointerdown', () => {
            if (!this._flipAnimating) {
                this._doFlip();
            }
        });

        // ========== APPLY INITIAL LAYOUT ==========
        var layout = this._calculateLayout(this._controlsFlipped);
        this._applyLayout(layout);

        // ========== HITBOX ZONES ==========
        this._shootHeld = false;
        this._shootBoundary = layout.shootBoundary;
        this._splitX = layout.splitX;

        // Direction hold — bridges single-frame gaps during rapid left/right switching
        this._lastMoveDir = 0;
        this._moveDirHoldFrames = 0;

        // Track button draw state — only redraw on change (avoid expensive graphics.clear every frame)
        this._prevShootAlpha = 0.5;
        this._prevLeftAlpha = 0.5;
        this._prevRightAlpha = 0.5;
    }

    /**
     * Calculate all position-dependent values for a given flip state.
     * @param {boolean} flipped — true = arrows on left, shoot on right
     * @returns {Object} layout with rects, centres, boundaries
     */
    _calculateLayout(flipped) {
        var sideW = this._sideW;
        var gameH = this._gameH;
        var canvasW = this._canvasW;
        var rightPanelX = this._rightPanelX;
        var rightPanelW = this._rightPanelW;
        var CFG = window.CVInvaders.Config;

        var btnPad = 8;
        var btnGap = 8;
        var btnH = gameH - btnPad * 2;
        var btnR = 10;
        var btnY = gameH / 2;

        // Right panel midpoint (for splitting left/right arrows)
        var rpMidX = rightPanelX + rightPanelW / 2;

        // Shoot rect dimensions (single full-height button in one panel)
        var sBtnW = sideW - btnPad * 2;
        var sBtnH = gameH - btnPad * 2;

        // Arrow rect dimensions (two buttons split in one panel)
        var leftBtnX0_right = rightPanelX + btnPad; // left arrow x when in right panel
        var leftBtnW_right = (rpMidX - btnGap / 2) - leftBtnX0_right;
        var rightBtnX0_right = rpMidX + btnGap / 2;
        var rightBtnW_right = (canvasW - btnPad) - rightBtnX0_right;

        // Left panel midpoint (for splitting arrows when in left panel)
        var lpMidX = sideW / 2;
        var leftBtnX0_left = btnPad;
        var leftBtnW_left = (lpMidX - btnGap / 2) - leftBtnX0_left;
        var rightBtnX0_left = lpMidX + btnGap / 2;
        var rightBtnW_left = (sideW - btnPad) - rightBtnX0_left;

        // Flip button — always top-left of the gameplay area
        var flipBtn = { x: sideW + 90, y: 22 };

        if (!flipped) {
            // DEFAULT: shoot on left, arrows on right
            return {
                shootRect: { x: btnPad, y: btnPad, w: sBtnW, h: sBtnH, r: btnR },
                shootCenter: { x: sideW / 2, y: gameH / 2 - 30 },
                leftRect: { x: leftBtnX0_right, y: btnY - btnH / 2, w: leftBtnW_right, h: btnH, r: btnR },
                rightRect: { x: rightBtnX0_right, y: btnY - btnH / 2, w: rightBtnW_right, h: btnH, r: btnR },
                leftArrowCenter: { x: leftBtnX0_right + leftBtnW_right / 2, y: btnY },
                rightArrowCenter: { x: rightBtnX0_right + rightBtnW_right / 2, y: btnY },
                shootBoundary: sideW + CFG.WIDTH / 2,
                splitX: rpMidX,
                flipBtnCenter: flipBtn
            };
        } else {
            // FLIPPED: arrows on left, shoot on right
            return {
                shootRect: { x: rightPanelX + btnPad, y: btnPad, w: rightPanelW - btnPad * 2, h: sBtnH, r: btnR },
                shootCenter: { x: rightPanelX + rightPanelW / 2, y: gameH / 2 - 30 },
                leftRect: { x: leftBtnX0_left, y: btnY - btnH / 2, w: leftBtnW_left, h: btnH, r: btnR },
                rightRect: { x: rightBtnX0_left, y: btnY - btnH / 2, w: rightBtnW_left, h: btnH, r: btnR },
                leftArrowCenter: { x: leftBtnX0_left + leftBtnW_left / 2, y: btnY },
                rightArrowCenter: { x: rightBtnX0_left + rightBtnW_left / 2, y: btnY },
                shootBoundary: sideW + CFG.WIDTH / 2,
                splitX: lpMidX,
                flipBtnCenter: flipBtn
            };
        }
    }

    /**
     * Apply a layout object — positions all elements at exact values.
     * @param {Object} layout from _calculateLayout
     */
    _applyLayout(layout) {
        // Shoot button
        this._shootRect = layout.shootRect;
        this._drawBtnBg(this._shootBg, this._shootRect, 0.5);

        // Crosshair
        this._crosshair.setPosition(layout.shootCenter.x, layout.shootCenter.y);

        // Fire label
        this._fireLabel.setPosition(layout.shootCenter.x, layout.shootCenter.y + 50);

        // Arrow buttons
        this._leftRect = layout.leftRect;
        this._drawBtnBg(this._leftBg, this._leftRect, 0.5);
        this._rightRect = layout.rightRect;
        this._drawBtnBg(this._rightBg, this._rightRect, 0.5);

        // Arrow triangles
        this._redrawArrow(this._leftArrowGfx, layout.leftArrowCenter.x, layout.leftArrowCenter.y, -1);
        this._redrawArrow(this._rightArrowGfx, layout.rightArrowCenter.x, layout.rightArrowCenter.y, 1);

        // Flip button
        this._drawFlipIcon(this._flipIcon, layout.flipBtnCenter.x, layout.flipBtnCenter.y);
        this._flipLabel.setPosition(layout.flipBtnCenter.x, layout.flipBtnCenter.y);
        this._flipZone.setPosition(layout.flipBtnCenter.x, layout.flipBtnCenter.y);
    }

    /**
     * Draw crosshair at origin (0,0) — positioned via setPosition on the graphics object.
     */
    _drawCrosshair(gfx) {
        gfx.clear();
        gfx.lineStyle(2, 0x9B59B6, 0.5);
        gfx.strokeCircle(0, 0, 26);
        gfx.lineStyle(1.5, 0xFFFFFF, 0.4);
        gfx.strokeCircle(0, 0, 14);
        gfx.lineBetween(-30, 0, -8, 0);
        gfx.lineBetween(8, 0, 30, 0);
        gfx.lineBetween(0, -30, 0, -8);
        gfx.lineBetween(0, 8, 0, 30);
        gfx.fillStyle(0x00E5FF, 0.6);
        gfx.fillCircle(0, 0, 3);
    }

    /**
     * Draw an arrow triangle at a given position.
     * @param {Phaser.GameObjects.Graphics} gfx
     * @param {number} cx — centre x
     * @param {number} cy — centre y
     * @param {number} dir — -1 for left, 1 for right
     */
    _redrawArrow(gfx, cx, cy, dir) {
        gfx.clear();
        gfx.fillStyle(0xFFFFFF, 0.8);
        if (dir < 0) {
            gfx.fillTriangle(cx - 12, cy, cx + 8, cy - 14, cx + 8, cy + 14);
        } else {
            gfx.fillTriangle(cx + 12, cy, cx - 8, cy - 14, cx - 8, cy + 14);
        }
    }

    /**
     * Draw the flip-controls button background (no pill — text only).
     */
    _drawFlipIcon(gfx, cx, cy) {
        gfx.clear();
    }

    /**
     * Trigger the flip animation.
     */
    _doFlip() {
        this._flipAnimating = true;

        var fromLayout = this._calculateLayout(this._controlsFlipped);
        this._controlsFlipped = !this._controlsFlipped;
        var toLayout = this._calculateLayout(this._controlsFlipped);

        // Store from/to for lerp
        this._flipFrom = fromLayout;
        this._flipTo = toLayout;

        // Depth trick: shoot slides across FRONT, arrows slide BEHIND
        this._shootBg.setDepth(250);
        this._crosshair.setDepth(251);
        this._fireLabel.setDepth(251);
        this._leftArrowGfx.setDepth(198);
        this._rightArrowGfx.setDepth(198);
        this._leftBg.setDepth(197);
        this._rightBg.setDepth(197);

        // Tween a progress value from 0 to 1
        var self = this;
        this._flipProgress = { t: 0 };
        this.tweens.add({
            targets: this._flipProgress,
            t: 1,
            duration: 500,
            ease: 'Cubic.easeInOut',
            onUpdate: function () {
                self._updateFlipAnimation(self._flipProgress.t);
            },
            onComplete: function () {
                self._finalizeFlip();
            }
        });
    }

    /**
     * Lerp all elements between from and to layouts.
     */
    _updateFlipAnimation(t) {
        var from = this._flipFrom;
        var to = this._flipTo;

        // Lerp shoot rect
        var sRect = this._lerpRect(from.shootRect, to.shootRect, t);
        this._shootRect = sRect;
        this._drawBtnBg(this._shootBg, sRect, 0.5);

        // Lerp shoot centre (crosshair + label)
        var sCx = from.shootCenter.x + (to.shootCenter.x - from.shootCenter.x) * t;
        var sCy = from.shootCenter.y + (to.shootCenter.y - from.shootCenter.y) * t;
        this._crosshair.setPosition(sCx, sCy);
        this._fireLabel.setPosition(sCx, sCy + 50);

        // Lerp left arrow rect + position
        var lRect = this._lerpRect(from.leftRect, to.leftRect, t);
        this._leftRect = lRect;
        this._drawBtnBg(this._leftBg, lRect, 0.5);
        var lCx = from.leftArrowCenter.x + (to.leftArrowCenter.x - from.leftArrowCenter.x) * t;
        var lCy = from.leftArrowCenter.y + (to.leftArrowCenter.y - from.leftArrowCenter.y) * t;
        this._redrawArrow(this._leftArrowGfx, lCx, lCy, -1);

        // Lerp right arrow rect + position
        var rRect = this._lerpRect(from.rightRect, to.rightRect, t);
        this._rightRect = rRect;
        this._drawBtnBg(this._rightBg, rRect, 0.5);
        var rCx = from.rightArrowCenter.x + (to.rightArrowCenter.x - from.rightArrowCenter.x) * t;
        var rCy = from.rightArrowCenter.y + (to.rightArrowCenter.y - from.rightArrowCenter.y) * t;
        this._redrawArrow(this._rightArrowGfx, rCx, rCy, 1);

        // Lerp flip button position
        var fCx = from.flipBtnCenter.x + (to.flipBtnCenter.x - from.flipBtnCenter.x) * t;
        var fCy = from.flipBtnCenter.y + (to.flipBtnCenter.y - from.flipBtnCenter.y) * t;
        this._drawFlipIcon(this._flipIcon, fCx, fCy);
        this._flipLabel.setPosition(fCx, fCy);
        this._flipZone.setPosition(fCx, fCy);
    }

    /**
     * Linear-interpolate rect properties.
     */
    _lerpRect(from, to, t) {
        return {
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
            w: from.w + (to.w - from.w) * t,
            h: from.h + (to.h - from.h) * t,
            r: from.r + (to.r - from.r) * t
        };
    }

    /**
     * Snap to final positions, restore depths, update input boundaries.
     */
    _finalizeFlip() {
        var layout = this._calculateLayout(this._controlsFlipped);
        this._applyLayout(layout);

        // Update input boundaries
        this._shootBoundary = layout.shootBoundary;
        this._splitX = layout.splitX;

        // Restore normal depths
        this._shootBg.setDepth(200);
        this._crosshair.setDepth(201);
        this._fireLabel.setDepth(201);
        this._leftArrowGfx.setDepth(201);
        this._rightArrowGfx.setDepth(201);
        this._leftBg.setDepth(200);
        this._rightBg.setDepth(200);

        this._flipAnimating = false;

        // Persist preference
        try {
            localStorage.setItem('cv_invaders_controls_flipped', this._controlsFlipped ? 'true' : 'false');
        } catch (e) {}
    }

    // ===== UPDATE — poll pointers directly & relay to ship =====
    update(time, delta) {
        if (!this.isMobile) return;

        // During flip animation, skip input (buttons drawn by _updateFlipAnimation)
        if (this._flipAnimating) return;

        var gameScene = this.scene.get('GameScene');
        if (!gameScene || !gameScene.ship || !gameScene.ship.isAlive) return;

        var pointers = this.input.manager.pointers;
        var flipped = this._controlsFlipped;
        var splitX = this._splitX;
        var rpX = this._rightPanelX;
        var sw = this._sideW;
        var gameW = window.CVInvaders.Config.WIDTH;
        var bleed = Math.floor(gameW / 3);

        var shootHeld = false;
        var leftPressed = false;
        var rightPressed = false;
        var leftPtrX = 0;
        var rightPtrX = 0;

        // Check ALL pointer slots — Phaser can assign touches to any slot
        for (var i = 0; i < pointers.length; i++) {
            var ptr = pointers[i];
            if (!ptr || !ptr.isDown) continue;

            // Shoot zone: panel + 1/3 bleed into gameplay
            if (!flipped) {
                if (ptr.x < sw + bleed) { shootHeld = true; continue; }
            } else {
                if (ptr.x > rpX - bleed) { shootHeld = true; continue; }
            }

            // Arrow zone: panel + 1/3 bleed into gameplay (inner arrow)
            if (!flipped) {
                // Arrows on right — inner arrow bleeds left into gameplay
                if (ptr.x < rpX - bleed) continue; // dead zone — ignore
                if (ptr.x < rpX) {
                    leftPressed = true;
                    leftPtrX = ptr.x;
                    continue;
                }
            } else {
                // Arrows on left — inner arrow bleeds right into gameplay
                if (ptr.x > sw + bleed) continue; // dead zone — ignore
                if (ptr.x > sw) {
                    rightPressed = true;
                    rightPtrX = ptr.x;
                    continue;
                }
            }

            // Inside the arrow panel — determine left/right
            if (ptr.x < splitX) {
                leftPressed = true;
                leftPtrX = ptr.x;
            } else {
                rightPressed = true;
                rightPtrX = ptr.x;
            }
        }

        // Resolve direction — if both pressed, closest to gameplay area wins
        var moveDir = 0;
        if (leftPressed && rightPressed) {
            if (!flipped) {
                // Arrows on right: closer to left edge (rpX) wins
                moveDir = (leftPtrX < rightPtrX) ? -1 : 1;
            } else {
                // Arrows on left: closer to right edge (sw) wins
                moveDir = (leftPtrX > rightPtrX) ? -1 : 1;
            }
        } else if (leftPressed) {
            moveDir = -1;
        } else if (rightPressed) {
            moveDir = 1;
        }

        // Bridge gaps during rapid left/right switching:
        // hold the previous direction for up to 3 frames (~50ms) before stopping
        if (moveDir !== 0) {
            this._lastMoveDir = moveDir;
            this._moveDirHoldFrames = 0;
        } else if (this._lastMoveDir !== 0 && this._moveDirHoldFrames < 3) {
            moveDir = this._lastMoveDir;
            this._moveDirHoldFrames++;
        } else {
            this._lastMoveDir = 0;
        }

        this._shootHeld = shootHeld;

        // Visual feedback — only redraw buttons when state changes
        // (avoids 3x graphics.clear() per frame which causes mobile frame drops)
        var shootAlpha = shootHeld ? 0.8 : 0.5;
        var leftAlpha = moveDir === -1 ? 0.8 : 0.5;
        var rightAlpha = moveDir === 1 ? 0.8 : 0.5;

        if (shootAlpha !== this._prevShootAlpha) {
            this._drawBtnBg(this._shootBg, this._shootRect, shootAlpha);
            this._prevShootAlpha = shootAlpha;
        }
        if (leftAlpha !== this._prevLeftAlpha) {
            this._drawBtnBg(this._leftBg, this._leftRect, leftAlpha);
            this._prevLeftAlpha = leftAlpha;
        }
        if (rightAlpha !== this._prevRightAlpha) {
            this._drawBtnBg(this._rightBg, this._rightRect, rightAlpha);
            this._prevRightAlpha = rightAlpha;
        }

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
