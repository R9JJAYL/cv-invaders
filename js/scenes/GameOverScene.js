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
        this.cameras.main.setBackgroundColor(CFG.COLORS.BG_HEX);
        const adElements = [];
        const cx = CFG.WIDTH / 2;
        const cy = CFG.HEIGHT / 2;

        // Starfield
        for (let i = 0; i < 40; i++) {
            const star = this.add.image(
                Phaser.Math.Between(0, CFG.WIDTH),
                Phaser.Math.Between(0, CFG.HEIGHT),
                'star'
            ).setAlpha(Phaser.Math.FloatBetween(0.1, 0.5));
            adElements.push(star);
        }

        // Floating purple particles for atmosphere
        for (let i = 0; i < 8; i++) {
            const p = this.add.image(
                Phaser.Math.Between(50, CFG.WIDTH - 50),
                Phaser.Math.Between(50, CFG.HEIGHT - 50),
                'particle-purple'
            ).setAlpha(0).setScale(Phaser.Math.FloatBetween(0.5, 1.5));
            adElements.push(p);
            this.tweens.add({
                targets: p,
                alpha: { from: 0, to: 0.3 },
                y: p.y - 40,
                x: p.x + Phaser.Math.Between(-20, 20),
                scale: p.scale * 0.5,
                duration: 3000 + i * 400,
                delay: i * 300,
                ease: 'Sine.easeInOut'
            });
        }

        // Headline — the game tie-in
        const headline = this.add.text(cx, cy - 120, 'Drowning in CVs?', {
            fontFamily: 'Courier New',
            fontSize: '22px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);
        adElements.push(headline);

        // Tagline from First
        const tagline = this.add.text(cx, cy - 85, 'AI speed. First class candidate experience.', {
            fontFamily: 'Roboto',
            fontSize: '15px',
            color: CFG.COLORS.PURPLE_ACCENT_HEX,
            fontStyle: 'italic',
            align: 'center'
        }).setOrigin(0.5).setAlpha(0);
        adElements.push(tagline);

        // Stat pills — key product highlights
        const stats = [
            { val: '90%', label: 'less screening time' },
            { val: '3x', label: 'more roles handled' },
            { val: '4.6/5', label: 'candidate satisfaction' }
        ];
        const statTexts = [];
        stats.forEach((stat, i) => {
            const sx = cx - 160 + i * 160;
            const valText = this.add.text(sx, cy - 30, stat.val, {
                fontFamily: 'Courier New',
                fontSize: '26px',
                color: '#FFFFFF',
                fontStyle: 'bold'
            }).setOrigin(0.5).setAlpha(0);
            const labelText = this.add.text(sx, cy - 5, stat.label, {
                fontFamily: 'Roboto',
                fontSize: '11px',
                color: CFG.COLORS.TEXT_SECONDARY
            }).setOrigin(0.5).setAlpha(0);
            adElements.push(valText, labelText);
            statTexts.push(valText, labelText);
        });

        // Divider line
        const divider = this.add.rectangle(cx, cy + 25, 300, 1, 0x9B59B6, 0.3).setAlpha(0);
        adElements.push(divider);

        // Integrations label
        const intLabel = this.add.text(cx, cy + 50, 'Integrates with', {
            fontFamily: 'Roboto',
            fontSize: '11px',
            color: CFG.COLORS.TEXT_SECONDARY
        }).setOrigin(0.5).setAlpha(0);
        adElements.push(intLabel);

        // ATS integration names
        const atsNames = ['Ashby', 'Greenhouse', 'Workable', 'Pinpoint', 'Bullhorn'];
        const atsTexts = [];
        const atsSpacing = 90;
        const atsStartX = cx - ((atsNames.length - 1) * atsSpacing) / 2;
        atsNames.forEach((name, i) => {
            const t = this.add.text(atsStartX + i * atsSpacing, cy + 72, name, {
                fontFamily: 'Roboto',
                fontSize: '12px',
                color: '#FFFFFF',
                fontStyle: 'bold'
            }).setOrigin(0.5).setAlpha(0);
            adElements.push(t);
            atsTexts.push(t);
        });

        // "+ more" after the list
        const moreText = this.add.text(cx, cy + 94, '+ LinkedIn Recruiter, Indeed, CV Library & more', {
            fontFamily: 'Roboto',
            fontSize: '10px',
            color: CFG.COLORS.TEXT_SECONDARY,
            fontStyle: 'italic'
        }).setOrigin(0.5).setAlpha(0);
        adElements.push(moreText);

        // "Powered by" text
        const poweredBy = this.add.text(cx, cy + 135, 'Powered by', {
            fontFamily: 'Roboto',
            fontSize: '14px',
            color: CFG.COLORS.TEXT_SECONDARY
        }).setOrigin(0.5).setAlpha(0);
        adElements.push(poweredBy);

        // First logo with subtle glow pulse
        const firstLogo = this.add.image(cx, cy + 175, 'first-logo')
            .setOrigin(0.5)
            .setScale(0.06)
            .setAlpha(0);
        adElements.push(firstLogo);

        // CTA
        const cta = this.add.text(cx, cy + 225, 'Be first in the race for talent  →  first.cx', {
            fontFamily: 'Roboto',
            fontSize: '13px',
            color: CFG.COLORS.PURPLE_ACCENT_HEX,
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);
        adElements.push(cta);

        // === Animation sequence ===

        // 1. Headline drops in
        this.tweens.add({
            targets: headline,
            alpha: 1,
            y: cy - 110,
            duration: 500,
            delay: 200,
            ease: 'Back.easeOut'
        });

        // 2. Tagline fades in
        this.tweens.add({
            targets: tagline,
            alpha: 0.9,
            duration: 500,
            delay: 600
        });

        // 3. Stats count in one at a time
        statTexts.forEach((t, i) => {
            this.tweens.add({
                targets: t,
                alpha: i % 2 === 0 ? 1 : 0.6,
                y: t.y - 5,
                duration: 400,
                delay: 1000 + Math.floor(i / 2) * 300,
                ease: 'Power2'
            });
        });

        // 4. Divider slides in
        this.tweens.add({
            targets: divider,
            alpha: 1,
            scaleX: { from: 0, to: 1 },
            duration: 400,
            delay: 2000,
            ease: 'Power2'
        });

        // 5. Integrations label
        this.tweens.add({
            targets: intLabel,
            alpha: 0.5,
            duration: 400,
            delay: 2200
        });

        // 6. ATS names pop in one by one
        atsTexts.forEach((t, i) => {
            this.tweens.add({
                targets: t,
                alpha: 0.9,
                y: t.y - 3,
                duration: 300,
                delay: 2400 + i * 150,
                ease: 'Power2'
            });
        });

        // 7. "+ more" text
        this.tweens.add({
            targets: moreText,
            alpha: 0.4,
            duration: 400,
            delay: 3200
        });

        // 8. Powered by + Logo (last, slightly after everything else)
        this.tweens.add({
            targets: poweredBy,
            alpha: 0.6,
            duration: 500,
            delay: 3500
        });
        this.tweens.add({
            targets: firstLogo,
            alpha: 1,
            scale: { from: 0.04, to: 0.06 },
            duration: 600,
            delay: 3700,
            ease: 'Back.easeOut'
        });

        // Logo gentle glow pulse
        this.time.delayedCall(4300, () => {
            this.tweens.add({
                targets: firstLogo,
                alpha: { from: 1, to: 0.7 },
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 9. CTA
        this.tweens.add({
            targets: cta,
            alpha: 0.8,
            duration: 500,
            delay: 4100
        });

        // CTA subtle pulse
        this.time.delayedCall(4600, () => {
            this.tweens.add({
                targets: cta,
                alpha: { from: 0.8, to: 0.5 },
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // After 7 seconds, fade out and show results
        this.time.delayedCall(7000, () => {
            this.tweens.add({
                targets: adElements,
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    adElements.forEach(el => el.destroy());
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

        // Title + score on same row
        const titleText = bossDefeated ? 'MISSION COMPLETE!' : 'GAME OVER';
        const titleColor = bossDefeated ? '#00FF00' : '#FF4444';
        this.add.text(CFG.WIDTH / 2, 22, titleText, {
            fontFamily: 'Courier New',
            fontSize: '28px',
            color: titleColor,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Score with count-up
        const grade = this.getGrade(score);
        this.scoreDisplay = this.add.text(CFG.WIDTH / 2, 58, '0', {
            fontFamily: 'Courier New',
            fontSize: '36px',
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

        // Grade title
        this.time.delayedCall(1600, () => {
            this.add.text(CFG.WIDTH / 2, 88, grade.title, {
                fontFamily: 'Courier New',
                fontSize: '16px',
                color: CFG.COLORS.PURPLE_ACCENT_HEX,
                fontStyle: 'bold'
            }).setOrigin(0.5);
        });

        // Compact stats row — single line
        const goodCVs = this.registry.get('goodCVsCaught') || 0;
        const badCVs = this.registry.get('badCVsShot') || 0;
        const maxCombo = this.registry.get('maxCombo') || 0;
        this.add.text(CFG.WIDTH / 2, 110, 'Good: ' + goodCVs + '  |  Bad: ' + badCVs + '  |  Combo: ' + maxCombo, {
            fontFamily: 'Courier New',
            fontSize: '10px',
            color: CFG.COLORS.TEXT_SECONDARY
        }).setOrigin(0.5);

        // Save score
        const company = this.registry.get('companyName') || '';
        const recruiterType = this.registry.get('recruiterType') || '';
        this.saveScore(name, score, grade.grade, company, recruiterType);

        // Leaderboard — exact copy of MenuScene.renderTables
        const allScores = this.getLeaderboard();
        this.renderTables(CFG, allScores, name, score);

        // Buttons
        const btnY = CFG.HEIGHT - 25;

        // Play Again
        const playBtn = this.add.text(CFG.WIDTH / 2 - 120, btnY, '[ PLAY AGAIN ]', {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: CFG.COLORS.PURPLE_ACCENT_HEX,
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        playBtn.on('pointerover', () => playBtn.setColor('#FFFFFF'));
        playBtn.on('pointerout', () => playBtn.setColor(CFG.COLORS.PURPLE_ACCENT_HEX));
        playBtn.on('pointerdown', () => {
            this.cameras.main.fadeOut(400);
            this.time.delayedCall(400, () => {
                // Reset game state but keep player info
                this.registry.set('score', 0);
                this.registry.set('health', CFG.PLAYER_HEALTH);
                this.registry.set('goodCVsCaught', 0);
                this.registry.set('badCVsShot', 0);
                this.registry.set('enemiesDefeated', 0);
                this.registry.set('maxCombo', 0);
                this.registry.set('bossTime', 0);
                this.registry.set('bossDefeated', false);
                // Skip straight to countdown (no cinematic, no menu)
                this.registry.set('skipToCountdown', true);
                this.scene.start('TutorialScene');
            });
        });

        // Share to LinkedIn
        const shareBtn = this.add.text(CFG.WIDTH / 2 + 140, btnY, '[ SHARE ON LINKEDIN ]', {
            fontFamily: 'Courier New',
            fontSize: '16px',
            color: '#0A66C2',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        shareBtn.on('pointerover', () => shareBtn.setColor('#FFFFFF'));
        shareBtn.on('pointerout', () => shareBtn.setColor('#0A66C2'));
        shareBtn.on('pointerdown', () => {
            this.shareToLinkedIn(name, score, grade);
        });

        // Keyboard shortcut — same as Play Again
        this.input.keyboard.on('keydown-ENTER', () => {
            this.cameras.main.fadeOut(400);
            this.time.delayedCall(400, () => {
                this.registry.set('score', 0);
                this.registry.set('health', CFG.PLAYER_HEALTH);
                this.registry.set('goodCVsCaught', 0);
                this.registry.set('badCVsShot', 0);
                this.registry.set('enemiesDefeated', 0);
                this.registry.set('maxCombo', 0);
                this.registry.set('bossTime', 0);
                this.registry.set('bossDefeated', false);
                this.registry.set('skipToCountdown', true);
                this.scene.start('TutorialScene');
            });
        });

        this.cameras.main.fadeIn(400);
    }

    renderTables(CFG, allScores, playerName, playerScore) {
        const agency = allScores.filter(e => e.type === 'agency');
        const internal = allScores.filter(e => e.type === 'internal');
        const agencyTotal = agency.reduce((s, e) => s + e.score, 0);
        const internalTotal = internal.reduce((s, e) => s + e.score, 0);
        const agencyAvg = agency.length > 0 ? Math.round(agencyTotal / agency.length) : 0;
        const internalAvg = internal.length > 0 ? Math.round(internalTotal / internal.length) : 0;
        const fmt = (n) => n.toLocaleString();

        const gamesWin = agency.length > internal.length ? 'agency' : internal.length > agency.length ? 'internal' : 'tie';
        const totalWin = agencyTotal > internalTotal ? 'agency' : internalTotal > agencyTotal ? 'internal' : 'tie';
        const avgWin = agencyAvg > internalAvg ? 'agency' : internalAvg > agencyAvg ? 'internal' : 'tie';
        const crown = '<span class="stat-crown">👑</span>';

        const statsHTML = '<div class="menu-tables">' +
            '<div class="glass-pill combined-pill">' +
            '<div class="lb-title">LEADERBOARD</div>' +
            '<div class="stats-section">' +
            '<div class="stats-columns">' +
            '<div class="stats-team">' +
            '<div class="team-label agency-label">AGENCY</div>' +
            '<div class="stat-pills">' +
            '<div class="stat-pill agency-pill">' + (gamesWin === 'agency' ? crown : '') + '<div class="stat-val">' + fmt(agency.length) + '</div><div class="stat-name">Games</div></div>' +
            '<div class="stat-pill agency-pill">' + (totalWin === 'agency' ? crown : '') + '<div class="stat-val">' + fmt(agencyTotal) + '</div><div class="stat-name">Total</div></div>' +
            '<div class="stat-pill agency-pill">' + (avgWin === 'agency' ? crown : '') + '<div class="stat-val">' + fmt(agencyAvg) + '</div><div class="stat-name">Avg</div></div>' +
            '</div></div>' +
            '<div class="stats-vs">VS</div>' +
            '<div class="stats-team">' +
            '<div class="team-label internal-label">INTERNAL</div>' +
            '<div class="stat-pills">' +
            '<div class="stat-pill internal-pill">' + (gamesWin === 'internal' ? crown : '') + '<div class="stat-val">' + fmt(internal.length) + '</div><div class="stat-name">Games</div></div>' +
            '<div class="stat-pill internal-pill">' + (totalWin === 'internal' ? crown : '') + '<div class="stat-val">' + fmt(internalTotal) + '</div><div class="stat-name">Total</div></div>' +
            '<div class="stat-pill internal-pill">' + (avgWin === 'internal' ? crown : '') + '<div class="stat-val">' + fmt(internalAvg) + '</div><div class="stat-name">Avg</div></div>' +
            '</div></div>' +
            '</div></div>' +
            '<div class="lb-divider"></div>' +
            '<table class="leaderboard-table">' +
            '<thead>' +
            '<tr>' +
            '<th class="lb-head lb-rank">#</th>' +
            '<th class="lb-head lb-name">NAME</th>' +
            '<th class="lb-head lb-company">COMPANY</th>' +
            '<th class="lb-head lb-type">TEAM</th>' +
            '<th class="lb-head lb-score">SCORE</th>' +
            '</tr></thead><tbody>' +
            allScores.slice(0, 10).map((entry, i) => {
                const isPlayer = playerName && entry.name === playerName && entry.score === playerScore;
                const typeLabel = entry.type === 'agency' ? 'Agency' : entry.type === 'internal' ? 'Internal' : '';
                const typeClass = entry.type === 'agency' ? 'type-agency' : '';
                const podiumRank = i === 0 ? ' lb-gold' : i === 1 ? ' lb-silver' : i === 2 ? ' lb-bronze' : '';
                const podiumRow = i < 3 ? ' lb-podium' : '';
                const rowClass = (isPlayer ? 'lb-highlight' : '') + podiumRow;
                return '<tr class="' + rowClass + '">' +
                    '<td class="lb-cell lb-rank' + podiumRank + '">' + (i + 1) + '.</td>' +
                    '<td class="lb-cell lb-name">' + entry.name + '</td>' +
                    '<td class="lb-cell lb-company">' + (entry.company || '') + '</td>' +
                    '<td class="lb-cell lb-type ' + typeClass + '">' + typeLabel + '</td>' +
                    '<td class="lb-cell lb-score">' + entry.score.toLocaleString() + '</td>' +
                    '</tr>';
            }).join('') +
            '</tbody></table></div></div>';

        this.add.dom(CFG.WIDTH / 2, 345).createFromHTML(statsHTML);
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
            window.CVInvaders.Config.HEIGHT - 45,
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
