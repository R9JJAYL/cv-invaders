window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.GameOverScene = class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const CFG = window.CVInvaders.Config;

        // Show the First ad interstitial first, then the results
        this.showFirstAd(CFG, () => {
            this.showResults(CFG);
        });
    }

    showFirstAd(CFG, onComplete) {
        // Dark background
        this.cameras.main.setBackgroundColor(CFG.COLORS.BG_HEX);

        // Starfield
        for (let i = 0; i < 30; i++) {
            this.add.image(
                Phaser.Math.Between(0, CFG.WIDTH),
                Phaser.Math.Between(0, CFG.HEIGHT),
                'star'
            ).setAlpha(Phaser.Math.FloatBetween(0.1, 0.4));
        }

        // "Powered by" small text
        const poweredBy = this.add.text(CFG.WIDTH / 2, CFG.HEIGHT / 2 - 60, 'Powered by', {
            fontFamily: 'Roboto',
            fontSize: '16px',
            color: CFG.COLORS.TEXT_SECONDARY,
            fontStyle: 'normal'
        }).setOrigin(0.5).setAlpha(0);

        // "First" logo text
        const firstLogo = this.add.text(CFG.WIDTH / 2, CFG.HEIGHT / 2 - 20, 'First', {
            fontFamily: 'Roboto',
            fontSize: '52px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        // Tagline
        const tagline = this.add.text(CFG.WIDTH / 2, CFG.HEIGHT / 2 + 30, 'The best tool on the market for\nmanaging applicant volume.', {
            fontFamily: 'Roboto',
            fontSize: '14px',
            color: CFG.COLORS.PURPLE_ACCENT_HEX,
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5).setAlpha(0);

        // CTA
        const cta = this.add.text(CFG.WIDTH / 2, CFG.HEIGHT / 2 + 80, 'tryfirst.co.uk', {
            fontFamily: 'Roboto',
            fontSize: '13px',
            color: CFG.COLORS.TEXT_SECONDARY,
            fontStyle: 'normal'
        }).setOrigin(0.5).setAlpha(0);

        // Fade in sequence
        this.tweens.add({
            targets: poweredBy,
            alpha: 0.6,
            duration: 600,
            delay: 200
        });
        this.tweens.add({
            targets: firstLogo,
            alpha: 1,
            duration: 600,
            delay: 500
        });
        this.tweens.add({
            targets: tagline,
            alpha: 0.8,
            duration: 600,
            delay: 900
        });
        this.tweens.add({
            targets: cta,
            alpha: 0.5,
            duration: 600,
            delay: 1200
        });

        // After 5 seconds, fade out and show results
        this.time.delayedCall(5000, () => {
            this.tweens.add({
                targets: [poweredBy, firstLogo, tagline, cta],
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    poweredBy.destroy();
                    firstLogo.destroy();
                    tagline.destroy();
                    cta.destroy();
                    onComplete();
                }
            });
        });
    }

    showResults(CFG) {
        const bossDefeated = this.registry.get('bossDefeated');
        const score = this.registry.get('score') || 0;
        const name = this.registry.get('playerName') || 'Recruiter';

        // Background stars (fresh set)
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
        this.scoreDisplay = this.add.text(CFG.WIDTH / 2, 125, '0', {
            fontFamily: 'Courier New',
            fontSize: '48px',
            color: CFG.COLORS.COMBO,
            fontStyle: 'bold'
        }).setOrigin(0.5);

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
            this.add.text(CFG.WIDTH / 2, 165, grade.title, {
                fontFamily: 'Courier New',
                fontSize: '20px',
                color: CFG.COLORS.PURPLE_ACCENT_HEX,
                fontStyle: 'bold'
            }).setOrigin(0.5);
        });

        // Stats row (compact)
        const statsY = 195;
        const stats = [
            ['Good CVs', this.registry.get('goodCVsCaught') || 0],
            ['Bad CVs Shot', this.registry.get('badCVsShot') || 0],
            ['Max Combo', this.registry.get('maxCombo') || 0],
        ];
        stats.forEach((stat, i) => {
            this.add.text(CFG.WIDTH / 2 - 100, statsY + i * 18, stat[0], {
                fontFamily: 'Courier New',
                fontSize: '11px',
                color: CFG.COLORS.TEXT_SECONDARY
            });
            this.add.text(CFG.WIDTH / 2 + 100, statsY + i * 18, String(stat[1]), {
                fontFamily: 'Courier New',
                fontSize: '11px',
                color: CFG.COLORS.TEXT_PRIMARY,
                fontStyle: 'bold'
            }).setOrigin(1, 0);
        });

        // Save score
        const company = this.registry.get('companyName') || '';
        const recruiterType = this.registry.get('recruiterType') || '';
        this.saveScore(name, score, grade.grade, company, recruiterType);

        // Leaderboard — HTML table matching MenuScene glass pill design
        const leaderboard = this.getLeaderboard();
        const leaderY = 270;

        const leaderHTML = '<div class="menu-tables">' +
            '<div class="glass-pill lb-pill">' +
            '<table class="leaderboard-table">' +
            '<thead><tr><th colspan="5" class="lb-title">TOP 10 SCORES</th></tr>' +
            '<tr>' +
            '<th class="lb-head lb-rank">#</th>' +
            '<th class="lb-head lb-name">NAME</th>' +
            '<th class="lb-head lb-company">COMPANY</th>' +
            '<th class="lb-head lb-type">TYPE</th>' +
            '<th class="lb-head lb-score">SCORE</th>' +
            '</tr></thead><tbody>' +
            leaderboard.slice(0, 10).map((entry, i) => {
                const isPlayer = entry.name === name && entry.score === score;
                const typeLabel = entry.type === 'agency' ? 'Agency' : entry.type === 'internal' ? 'Internal' : '';
                const typeClass = entry.type === 'agency' ? 'type-agency' : '';
                const rowClass = isPlayer ? 'lb-highlight' : '';
                return '<tr class="' + rowClass + '">' +
                    '<td class="lb-cell lb-rank">' + (i + 1) + '.</td>' +
                    '<td class="lb-cell lb-name">' + entry.name + '</td>' +
                    '<td class="lb-cell lb-company">' + (entry.company || '') + '</td>' +
                    '<td class="lb-cell lb-type ' + typeClass + '">' + typeLabel + '</td>' +
                    '<td class="lb-cell lb-score">' + entry.score.toLocaleString() + '</td>' +
                    '</tr>';
            }).join('') +
            '</tbody></table></div></div>';

        this.add.dom(CFG.WIDTH / 2, leaderY + 110).createFromHTML(leaderHTML);

        // Buttons
        const btnY = CFG.HEIGHT - 40;

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

        this.cameras.main.fadeIn(400);
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

        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                this.showCopiedMessage();
            });
        }

        const url = encodeURIComponent(window.location.href);
        window.open(
            'https://www.linkedin.com/sharing/share-offsite/?url=' + url,
            '_blank'
        );
    }

    showCopiedMessage() {
        const msg = this.add.text(
            window.CVInvaders.Config.WIDTH / 2,
            window.CVInvaders.Config.HEIGHT - 70,
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
