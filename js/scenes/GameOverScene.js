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
        const headline = this.add.text(cx, cy - 200, 'Drowning in CVs?', {
            fontFamily: 'Courier New',
            fontSize: '22px',
            color: '#FFFFFF',
            fontStyle: 'bold',
            resolution: 2
        }).setOrigin(0.5).setAlpha(0);
        adElements.push(headline);

        // Tagline from First
        const tagline = this.add.text(cx, cy - 155, "That's why teams use First.", {
            fontFamily: 'Roboto',
            fontSize: '15px',
            color: CFG.COLORS.PURPLE_ACCENT_HEX,
            align: 'center',
            resolution: 2
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
            const valText = this.add.text(sx, cy - 90, stat.val, {
                fontFamily: 'Courier New',
                fontSize: '26px',
                color: '#FFFFFF',
                fontStyle: 'bold',
                resolution: 2
            }).setOrigin(0.5).setAlpha(0);
            const labelText = this.add.text(sx, cy - 65, stat.label, {
                fontFamily: 'Roboto',
                fontSize: '11px',
                color: CFG.COLORS.TEXT_SECONDARY,
                resolution: 2
            }).setOrigin(0.5).setAlpha(0);
            adElements.push(valText, labelText);
            statTexts.push(valText, labelText);
        });

        // Divider line
        const divider = this.add.rectangle(cx, cy - 25, 300, 1, 0x9B59B6, 0.3).setAlpha(0);
        adElements.push(divider);

        // Integrations label
        const intLabel = this.add.text(cx, cy + 5, 'Plugs into', {
            fontFamily: 'Roboto',
            fontSize: '11px',
            color: CFG.COLORS.TEXT_SECONDARY,
            resolution: 2
        }).setOrigin(0.5).setAlpha(0);
        adElements.push(intLabel);

        // Integration name pills — glass style with subtle shadow
        const intNames = [
            ['Greenhouse', 'Ashby', 'Workable', 'Pinpoint', 'Bullhorn'],
            ['LinkedIn', 'Indeed', 'CV-Library', 'Teamtailor', 'Broadbean']
        ];
        const intPillH = 24;
        const intPillPad = 12;
        const intGap = 6;
        const intPillR = intPillH / 2; // fully rounded ends
        const intPills = [];
        const intGfx = this.add.graphics();
        adElements.push(intGfx);

        intNames.forEach((row, ri) => {
            const rowY = cy + 32 + ri * 36;
            // Measure pill widths using a temp text to get width
            const tempTexts = row.map(name => {
                const t = this.add.text(0, -100, name, {
                    fontFamily: 'Roboto', fontSize: '11px', fontStyle: 'bold'
                });
                const w = t.width;
                t.destroy();
                return w;
            });
            const pillWidths = tempTexts.map(w => w + intPillPad * 2);
            const totalW = pillWidths.reduce((s, w) => s + w, 0) + (row.length - 1) * intGap;
            let px = cx - totalW / 2;

            row.forEach((name, i) => {
                const pw = pillWidths[i];
                // Shadow
                intGfx.fillStyle(0x000000, 0.15);
                intGfx.fillRoundedRect(px + 1, rowY - intPillH / 2 + 1, pw, intPillH, intPillR);
                // Glass pill
                intGfx.fillStyle(0xFFFFFF, 0.06);
                intGfx.lineStyle(1, 0xFFFFFF, 0.12);
                intGfx.fillRoundedRect(px, rowY - intPillH / 2, pw, intPillH, intPillR);
                intGfx.strokeRoundedRect(px, rowY - intPillH / 2, pw, intPillH, intPillR);

                const label = this.add.text(px + pw / 2, rowY, name, {
                    fontFamily: 'Roboto',
                    fontSize: '11px',
                    color: '#FFFFFF',
                    fontStyle: 'bold',
                    resolution: 2
                }).setOrigin(0.5).setAlpha(0);
                adElements.push(label);
                intPills.push(label);

                px += pw + intGap;
            });
        });

        intGfx.setAlpha(0);

        // "+ more" pill
        const moreLabel = '& more';
        const moreTmp = this.add.text(0, -100, moreLabel, {
            fontFamily: 'Roboto', fontSize: '10px', fontStyle: 'italic'
        });
        const morePW = moreTmp.width + intPillPad * 2;
        moreTmp.destroy();
        const moreY = cy + 32 + intNames.length * 36; // same row spacing as above
        const morePillH = intPillH;
        const morePillR = morePillH / 2;
        // Shadow
        intGfx.fillStyle(0x000000, 0.1);
        intGfx.fillRoundedRect(cx - morePW / 2 + 1, moreY - morePillH / 2 + 1, morePW, morePillH, morePillR);
        // Glass pill
        intGfx.fillStyle(0xFFFFFF, 0.04);
        intGfx.lineStyle(1, 0xFFFFFF, 0.08);
        intGfx.fillRoundedRect(cx - morePW / 2, moreY - morePillH / 2, morePW, morePillH, morePillR);
        intGfx.strokeRoundedRect(cx - morePW / 2, moreY - morePillH / 2, morePW, morePillH, morePillR);
        const moreText = this.add.text(cx, moreY, moreLabel, {
            fontFamily: 'Roboto',
            fontSize: '10px',
            color: CFG.COLORS.TEXT_SECONDARY,
            fontStyle: 'italic',
            resolution: 2
        }).setOrigin(0.5).setAlpha(0);
        adElements.push(moreText);
        intPills.push(moreText);

        // First logo
        const firstLogo = this.add.image(cx, cy + 170, 'first-logo')
            .setOrigin(0.5)
            .setScale(0.03)
            .setAlpha(0);
        adElements.push(firstLogo);

        // CTA
        const cta = this.add.text(cx, cy + 215, 'Where AI speed meets candidate experience.', {
            fontFamily: 'Roboto',
            fontSize: '16px',
            fontStyle: 'italic',
            color: CFG.COLORS.PURPLE_ACCENT_HEX,
            resolution: 2
        }).setOrigin(0.5).setAlpha(0);
        adElements.push(cta);

        // === Animation sequence ===

        // 1. Headline drops in
        this.tweens.add({
            targets: headline,
            alpha: 1,
            y: cy - 190,
            duration: 500,
            delay: 200,
            ease: 'Back.easeOut'
        });

        // 2. Tagline fades in (after a beat)
        this.tweens.add({
            targets: tagline,
            alpha: 0.9,
            duration: 500,
            delay: 1400
        });

        // 3. Stats count in one at a time
        statTexts.forEach((t, i) => {
            this.tweens.add({
                targets: t,
                alpha: i % 2 === 0 ? 1 : 0.6,
                y: t.y - 5,
                duration: 400,
                delay: 3200 + Math.floor(i / 2) * 500,
                ease: 'Power2'
            });
        });

        // 4. Divider slides in
        this.tweens.add({
            targets: divider,
            alpha: 1,
            scaleX: { from: 0, to: 1 },
            duration: 400,
            delay: 4800,
            ease: 'Power2'
        });

        // 5. Integrations label
        this.tweens.add({
            targets: intLabel,
            alpha: 0.5,
            duration: 400,
            delay: 5100
        });

        // 6. Integration pills fade in
        this.tweens.add({
            targets: intGfx,
            alpha: 1,
            duration: 400,
            delay: 5300,
            ease: 'Power2'
        });
        intPills.forEach((t, i) => {
            this.tweens.add({
                targets: t,
                alpha: 0.85,
                duration: 300,
                delay: 5400 + i * 120,
                ease: 'Power2'
            });
        });

        // 7. First logo
        this.tweens.add({
            targets: firstLogo,
            alpha: 0.5,
            scale: { from: 0.02, to: 0.03 },
            duration: 600,
            delay: 7000,
            ease: 'Back.easeOut'
        });

        // Logo gentle glow pulse
        this.time.delayedCall(7600, () => {
            this.tweens.add({
                targets: firstLogo,
                alpha: { from: 0.5, to: 0.3 },
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // 8. CTA
        this.tweens.add({
            targets: cta,
            alpha: 0.8,
            duration: 500,
            delay: 7500
        });

        // CTA subtle pulse
        this.time.delayedCall(8000, () => {
            this.tweens.add({
                targets: cta,
                alpha: { from: 0.8, to: 0.5 },
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // After 10 seconds, fade out and show results
        this.time.delayedCall(10000, () => {
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

        // Stats pills — green CV and red CV
        const goodHit = this.registry.get('goodCVsCaught') || 0;
        const goodMissed = this.registry.get('goodCVsMissed') || 0;
        const badHit = this.registry.get('badCVsShot') || 0;
        const badMissed = this.registry.get('badCVsMissed') || 0;
        const statsY = 115;
        const pillW = 170;
        const pillH = 32;
        const pillGap = 12;
        const pillLeft = CFG.WIDTH / 2 - pillW - pillGap / 2;
        const pillRight = CFG.WIDTH / 2 + pillGap / 2;

        // Draw pill backgrounds
        const pillGfx = this.add.graphics();
        // Green pill
        pillGfx.fillStyle(0x4ADE80, 0.1);
        pillGfx.lineStyle(1, 0x4ADE80, 0.3);
        pillGfx.fillRoundedRect(pillLeft, statsY - pillH / 2, pillW, pillH, 8);
        pillGfx.strokeRoundedRect(pillLeft, statsY - pillH / 2, pillW, pillH, 8);
        // Red pill
        pillGfx.fillStyle(0xFF8A80, 0.1);
        pillGfx.lineStyle(1, 0xFF8A80, 0.3);
        pillGfx.fillRoundedRect(pillRight, statsY - pillH / 2, pillW, pillH, 8);
        pillGfx.strokeRoundedRect(pillRight, statsY - pillH / 2, pillW, pillH, 8);

        // Green pill content: icon + caught/missed
        this.add.image(pillLeft + 18, statsY, 'cv-good').setScale(0.7);
        this.add.text(pillLeft + 36, statsY - 6, 'Caught: ' + goodHit, {
            fontFamily: 'Roboto', fontSize: '10px', color: CFG.COLORS.CV_GOOD_HEX, fontWeight: '700'
        }).setOrigin(0, 0.5);
        this.add.text(pillLeft + 36, statsY + 6, 'Missed: ' + goodMissed, {
            fontFamily: 'Roboto', fontSize: '10px', color: CFG.COLORS.TEXT_SECONDARY
        }).setOrigin(0, 0.5);

        // Red pill content: icon + hit/missed
        this.add.image(pillRight + 18, statsY, 'cv-bad').setScale(0.7);
        this.add.text(pillRight + 36, statsY - 6, 'Hit: ' + badHit, {
            fontFamily: 'Roboto', fontSize: '10px', color: CFG.COLORS.CV_BAD_HEX, fontWeight: '700'
        }).setOrigin(0, 0.5);
        this.add.text(pillRight + 36, statsY + 6, 'Missed: ' + badMissed, {
            fontFamily: 'Roboto', fontSize: '10px', color: CFG.COLORS.TEXT_SECONDARY
        }).setOrigin(0, 0.5);

        // Save score
        const company = this.registry.get('companyName') || '';
        const recruiterType = this.registry.get('recruiterType') || '';
        this.saveScore(name, score, grade.grade, company, recruiterType);

        // Leaderboard — exact copy of MenuScene.renderTables
        const allScores = this.getLeaderboard();
        this.renderTables(CFG, allScores, name, score);

        // Buttons
        const btnY = 546;

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
                this.registry.set('goodCVsMissed', 0);
                this.registry.set('badCVsShot', 0);
                this.registry.set('badCVsMissed', 0);
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
                this.registry.set('goodCVsMissed', 0);
                this.registry.set('badCVsShot', 0);
                this.registry.set('badCVsMissed', 0);
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
        const noCrown = '<span class="stat-crown" style="visibility:hidden">👑</span>';

        const statsHTML = '<div class="menu-tables">' +
            '<div class="glass-pill combined-pill">' +
            '<div class="lb-title">LEADERBOARD</div>' +
            '<div class="stats-section">' +
            '<div class="stats-columns">' +
            '<div class="stats-team">' +
            '<div class="team-label agency-label">AGENCY</div>' +
            '<div class="stat-pills">' +
            '<div class="stat-pill agency-pill">' + (gamesWin === 'agency' ? crown : noCrown) + '<div class="stat-val">' + fmt(agency.length) + '</div><div class="stat-name">Games</div></div>' +
            '<div class="stat-pill agency-pill">' + (totalWin === 'agency' ? crown : noCrown) + '<div class="stat-val">' + fmt(agencyTotal) + '</div><div class="stat-name">Total</div></div>' +
            '<div class="stat-pill agency-pill">' + (avgWin === 'agency' ? crown : noCrown) + '<div class="stat-val">' + fmt(agencyAvg) + '</div><div class="stat-name">Avg</div></div>' +
            '</div></div>' +
            '<div class="stats-vs">VS</div>' +
            '<div class="stats-team">' +
            '<div class="team-label internal-label">INTERNAL</div>' +
            '<div class="stat-pills">' +
            '<div class="stat-pill internal-pill">' + (gamesWin === 'internal' ? crown : noCrown) + '<div class="stat-val">' + fmt(internal.length) + '</div><div class="stat-name">Games</div></div>' +
            '<div class="stat-pill internal-pill">' + (totalWin === 'internal' ? crown : noCrown) + '<div class="stat-val">' + fmt(internalTotal) + '</div><div class="stat-name">Total</div></div>' +
            '<div class="stat-pill internal-pill">' + (avgWin === 'internal' ? crown : noCrown) + '<div class="stat-val">' + fmt(internalAvg) + '</div><div class="stat-name">Avg</div></div>' +
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
