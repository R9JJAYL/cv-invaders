window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.GameOverScene = class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const CFG = window.CVInvaders.Config;
        const bossDefeated = this.registry.get('bossDefeated');
        const score = this.registry.get('score') || 0;
        const name = this.registry.get('playerName') || 'Recruiter';

        // Background
        for (let i = 0; i < 40; i++) {
            this.add.image(
                Phaser.Math.Between(0, CFG.WIDTH),
                Phaser.Math.Between(0, CFG.HEIGHT),
                'star'
            ).setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
        }

        // Title
        const titleText = bossDefeated ? 'MISSION COMPLETE!' : 'GAME OVER';
        const titleColor = bossDefeated ? '#00FF00' : '#FF4444';
        this.add.text(CFG.WIDTH / 2, 40, titleText, {
            fontFamily: 'Courier New',
            fontSize: '36px',
            color: titleColor,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Result message
        const msg = bossDefeated
            ? window.CVInvaders.Dialogue.GAME_OVER.WIN
            : window.CVInvaders.Dialogue.GAME_OVER.LOSE;
        this.add.text(CFG.WIDTH / 2, 80, msg, {
            fontFamily: 'Courier New',
            fontSize: '14px',
            color: CFG.COLORS.TEXT_SECONDARY,
            align: 'center'
        }).setOrigin(0.5);

        // Score with count-up
        this.scoreDisplay = this.add.text(CFG.WIDTH / 2, 130, '0', {
            fontFamily: 'Courier New',
            fontSize: '48px',
            color: CFG.COLORS.COMBO,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Count-up tween
        this.tweens.addCounter({
            from: 0,
            to: score,
            duration: 1500,
            ease: 'Power2',
            onUpdate: (tween) => {
                this.scoreDisplay.setText(Math.floor(tween.getValue()).toString());
            }
        });

        // Grade
        const grade = this.getGrade(score);
        this.time.delayedCall(1600, () => {
            this.add.text(CFG.WIDTH / 2, 175, grade.title, {
                fontFamily: 'Courier New',
                fontSize: '20px',
                color: CFG.COLORS.PURPLE_ACCENT_HEX,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.add.text(CFG.WIDTH / 2, 200, 'Grade: ' + grade.grade, {
                fontFamily: 'Courier New',
                fontSize: '16px',
                color: CFG.COLORS.TEXT_PRIMARY
            }).setOrigin(0.5);
        });

        // Stats
        const stats = [
            ['Good CVs Caught', this.registry.get('goodCVsCaught') || 0],
            ['Bad CVs Shot', this.registry.get('badCVsShot') || 0],
            ['Enemies Defeated', this.registry.get('enemiesDefeated') || 0],
            ['Max Combo', this.registry.get('maxCombo') || 0],
        ];

        if (bossDefeated) {
            const bossTime = this.registry.get('bossTime') || 0;
            stats.push(['Boss Time', (bossTime / 1000).toFixed(1) + 's']);
        }

        stats.forEach((stat, i) => {
            this.add.text(CFG.WIDTH / 2 - 120, 240 + i * 22, stat[0], {
                fontFamily: 'Courier New',
                fontSize: '13px',
                color: CFG.COLORS.TEXT_SECONDARY
            });
            this.add.text(CFG.WIDTH / 2 + 120, 240 + i * 22, String(stat[1]), {
                fontFamily: 'Courier New',
                fontSize: '13px',
                color: CFG.COLORS.TEXT_PRIMARY,
                fontStyle: 'bold'
            }).setOrigin(1, 0);
        });

        // Save score
        const company = this.registry.get('companyName') || '';
        const recruiterType = this.registry.get('recruiterType') || '';
        this.saveScore(name, score, grade.grade, company, recruiterType);

        // Leaderboard
        const leaderY = 370;
        this.add.text(CFG.WIDTH / 2, leaderY, 'LEADERBOARD', {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: CFG.COLORS.COMBO,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const leaderboard = this.getLeaderboard();
        leaderboard.slice(0, 8).forEach((entry, i) => {
            const isPlayer = entry.name === name && entry.score === score;
            const color = isPlayer ? CFG.COLORS.PURPLE_ACCENT_HEX : CFG.COLORS.TEXT_SECONDARY;
            const y = leaderY + 25 + i * 18;
            const typeTag = entry.type === 'agency' ? 'AG' : entry.type === 'internal' ? 'IN' : '';
            const detail = (entry.company || '') + (typeTag ? ' [' + typeTag + ']' : '');

            this.add.text(CFG.WIDTH / 2 - 200, y,
                (i + 1) + '. ' + entry.name, {
                fontFamily: 'Courier New',
                fontSize: '12px',
                color: color
            });
            this.add.text(CFG.WIDTH / 2 + 50, y, detail, {
                fontFamily: 'Courier New',
                fontSize: '10px',
                color: isPlayer ? CFG.COLORS.TEXT_PRIMARY : CFG.COLORS.TEXT_SECONDARY
            }).setOrigin(0.5, 0).setAlpha(0.7);
            this.add.text(CFG.WIDTH / 2 + 200, y,
                String(entry.score), {
                fontFamily: 'Courier New',
                fontSize: '12px',
                color: isPlayer ? '#FFFFFF' : CFG.COLORS.TEXT_PRIMARY,
                fontStyle: isPlayer ? 'bold' : 'normal'
            }).setOrigin(1, 0);
        });

        // Buttons
        const btnY = CFG.HEIGHT - 50;

        // Play Again
        const playBtn = this.add.text(CFG.WIDTH / 2 - 120, btnY, '[ PLAY AGAIN ]', {
            fontFamily: 'Courier New',
            fontSize: '18px',
            color: CFG.COLORS.PURPLE_ACCENT_HEX,
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        playBtn.on('pointerover', () => playBtn.setColor('#FFFFFF'));
        playBtn.on('pointerout', () => playBtn.setColor(CFG.COLORS.PURPLE_ACCENT_HEX));
        playBtn.on('pointerdown', () => {
            this.cameras.main.fadeOut(400);
            this.time.delayedCall(400, () => this.scene.start('MenuScene'));
        });

        // Share to LinkedIn
        const shareBtn = this.add.text(CFG.WIDTH / 2 + 120, btnY, '[ SHARE ]', {
            fontFamily: 'Courier New',
            fontSize: '18px',
            color: '#0A66C2',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        shareBtn.on('pointerover', () => shareBtn.setColor('#FFFFFF'));
        shareBtn.on('pointerout', () => shareBtn.setColor('#0A66C2'));
        shareBtn.on('pointerdown', () => {
            this.shareToLinkedIn(name, score, grade);
        });

        // Keyboard shortcut
        this.input.keyboard.on('keydown-ENTER', () => {
            this.cameras.main.fadeOut(400);
            this.time.delayedCall(400, () => this.scene.start('MenuScene'));
        });

        this.cameras.main.fadeIn(500);
    }

    getGrade(score) {
        const grades = window.CVInvaders.Config.GRADES;
        for (const g of grades) {
            if (score >= g.min) return g;
        }
        return grades[grades.length - 1];
    }

    saveScore(name, score, grade, company, type) {
        try {
            const key = 'cv_invaders_scores';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push({ name, score, grade, company, type, date: Date.now() });
            existing.sort((a, b) => b.score - a.score);
            localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
        } catch (e) {}
    }

    getLeaderboard() {
        let saved = [];
        try {
            saved = JSON.parse(localStorage.getItem('cv_invaders_scores') || '[]');
        } catch (e) {}

        const fake = window.CVInvaders.FakeLeaderboard || [];
        const all = [...saved, ...fake];
        all.sort((a, b) => b.score - a.score);
        return all;
    }

    shareToLinkedIn(name, score, grade) {
        const shareText = name + ' scored ' + score +
            ' points in CV Invaders and earned "' + grade.title +
            '"! Can you beat the AI?\n\n' +
            '#CVInvaders #Recruiting #TalentAcquisition';

        // Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                this.showCopiedMessage();
            });
        }

        // Open LinkedIn share (generic share URL)
        const url = encodeURIComponent(window.location.href);
        window.open(
            'https://www.linkedin.com/sharing/share-offsite/?url=' + url,
            '_blank'
        );
    }

    showCopiedMessage() {
        const msg = this.add.text(
            window.CVInvaders.Config.WIDTH / 2,
            window.CVInvaders.Config.HEIGHT - 80,
            'Score copied to clipboard!',
            {
                fontFamily: 'Courier New',
                fontSize: '12px',
                color: '#00FF00'
            }
        ).setOrigin(0.5);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            duration: 2000,
            delay: 1500,
            onComplete: () => msg.destroy()
        });
    }
};
