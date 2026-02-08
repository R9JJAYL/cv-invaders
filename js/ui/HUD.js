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

        // No wave listener needed - countdown is updated directly
    }

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
            const mins = Math.floor(secs / 60);
            const s = secs % 60;
            const timeStr = mins > 0 ? mins + ':' + String(s).padStart(2, '0') : String(s) + 's';
            this.countdownText.setText('TIME REMAINING: ' + timeStr);

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

            this.bossHealthBg = this.add.rectangle(
                window.CVInvaders.Config.WIDTH / 2, 62,
                300, 10, 0x333333
            ).setDepth(100);

            this.bossHealthBar = this.add.rectangle(
                window.CVInvaders.Config.WIDTH / 2, 62,
                300, 10, 0xFF0000
            ).setDepth(100);
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
