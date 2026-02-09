window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.GameOverScene = class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const CFG = window.CVInvaders.Config;

        // Build both screens: ad at top, results below
        // Then scroll down to reveal results like a page scroll
        this.showFirstAd(CFG);
        this.showResults(CFG, CFG.HEIGHT); // offset results one screen below
    }

    showFirstAd(CFG) {
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
        const headline = this.add.text(cx, cy - 200, 'Drowning in CVs...?', {
            fontFamily: 'Courier New',
            fontSize: '22px',
            color: '#FFFFFF',
            fontStyle: 'bold',
            resolution: 2
        }).setOrigin(0.5).setAlpha(0);
        adElements.push(headline);

        // Tagline from First
        const tagline = this.add.text(cx, cy - 155, 'Maybe it\'s time to swap CV sifting for candidate calls.', {
            fontFamily: 'Roboto',
            fontSize: '15px',
            color: CFG.COLORS.PURPLE_ACCENT_HEX,
            align: 'center',
            resolution: 2
        }).setOrigin(0.5).setAlpha(0);
        adElements.push(tagline);

        // Stat pills — key product highlights
        const stats = [
            { val: '90%', label: 'less CV sift' },
            { val: '3x', label: 'more roles handled' },
            { val: '4.6/5', label: 'candidate rating' }
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
        const intLabel = this.add.text(cx, cy + 5, 'Plug into', {
            fontFamily: 'Roboto',
            fontSize: '11px',
            color: CFG.COLORS.TEXT_SECONDARY,
            resolution: 2
        }).setOrigin(0.5).setAlpha(0);
        adElements.push(intLabel);

        // Integration name pills — glass style with subtle shadow
        const intNames = [
            ['Greenhouse', 'Ashby', 'Workable'],
            ['LinkedIn', 'Pinpoint', 'Bullhorn', 'Indeed'],
            ['CV-Library', 'Teamtailor', 'Broadbean']
        ];
        const intPillH = 24;
        const intPillPad = 12;
        const intGap = 6;
        const intPillR = intPillH / 2; // fully rounded ends
        const intPills = [];
        const intGfx = this.add.graphics();
        adElements.push(intGfx);

        intNames.forEach((row, ri) => {
            const rowY = cy + 32 + ri * 30;
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
        const moreY = cy + 32 + intNames.length * 30; // same row spacing as above
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
        const firstLogo = this.add.image(cx, cy + 180, 'first-logo')
            .setOrigin(0.5)
            .setScale(0.03)
            .setAlpha(0);
        adElements.push(firstLogo);

        // CTA
        const cta = this.add.text(cx, cy + 225, 'Where AI speed meets candidate experience.', {
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

        // After 10 seconds, scroll down to results like someone is scrolling
        this.time.delayedCall(10000, () => {
            this.tweens.add({
                targets: this.cameras.main,
                scrollY: CFG.HEIGHT,
                duration: 800,
                ease: 'Power2.easeInOut'
            });
        });
    }

    showResults(CFG, yOff) {
        yOff = yOff || 0;
        const bossDefeated = this.registry.get('bossDefeated');
        const score = this.registry.get('score') || 0;
        const name = this.registry.get('playerName') || 'Recruiter';

        // Background stars (in the results area)
        for (let i = 0; i < 40; i++) {
            this.add.image(
                Phaser.Math.Between(0, CFG.WIDTH),
                yOff + Phaser.Math.Between(0, CFG.HEIGHT),
                'star'
            ).setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
        }

        // Score with count-up — delay until page scrolls into view
        const grade = this.getGrade(score);
        this.scoreDisplay = this.add.text(CFG.WIDTH / 2, yOff + 22, 'SCORE: 0', {
            fontFamily: 'Courier New',
            fontSize: '28px',
            color: CFG.COLORS.COMBO,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Start score count-up after scroll completes (10s ad + 0.8s scroll)
        const scoreDelay = yOff > 0 ? 10800 : 0;
        this.time.delayedCall(scoreDelay, () => {
            this.tweens.addCounter({
                from: 0,
                to: score,
                duration: 1500,
                ease: 'Power2',
                onUpdate: (tween) => {
                    this.scoreDisplay.setText('SCORE: ' + Math.floor(tween.getValue()).toString());
                }
            });
        });

        // Grade + title — delayed after score count-up
        this.time.delayedCall(scoreDelay + 1600, () => {
            this.add.text(CFG.WIDTH / 2, yOff + 55, 'GRADE ' + grade.grade + ': ' + grade.title, {
                fontFamily: 'Courier New',
                fontSize: '14px',
                color: CFG.COLORS.PURPLE_ACCENT_HEX,
                fontStyle: 'bold'
            }).setOrigin(0.5);
        });

        // Stats — nested pill layout: outer container per CV type, inner capsules stacked
        const goodHit = this.registry.get('goodCVsCaught') || 0;
        const goodMissed = this.registry.get('goodCVsMissed') || 0;
        const badHit = this.registry.get('badCVsShot') || 0;
        const badMissed = this.registry.get('badCVsMissed') || 0;
        const statsY = yOff + 100;
        const cx = CFG.WIDTH / 2;

        const innerH = 18;
        const innerR = innerH / 2;
        const innerGap = 4;
        const innerPad = 10;
        const iconSpace = 28;
        const outerPad = 6;
        const outerH = innerH * 2 + innerGap + outerPad * 2;
        const outerR = 12;
        const outerGap = 12;

        const pillGfx = this.add.graphics();

        const cvGroups = [
            {
                icon: 'cv-good', color: 0x4ADE80, hex: CFG.COLORS.CV_GOOD_HEX,
                stats: [
                    { label: 'Caught: ' + goodHit, color: 0x4ADE80, hex: CFG.COLORS.CV_GOOD_HEX },
                    { label: 'Missed: ' + goodMissed, color: 0xFF8A80, hex: '#FF8A80' }
                ]
            },
            {
                icon: 'cv-bad', color: 0xFF8A80, hex: '#FF8A80',
                stats: [
                    { label: 'Hit: ' + badHit, color: 0x4ADE80, hex: CFG.COLORS.CV_GOOD_HEX },
                    { label: 'Missed: ' + badMissed, color: 0xFF8A80, hex: '#FF8A80' }
                ]
            }
        ];

        // Measure max inner pill width per group
        const groupWidths = cvGroups.map(group => {
            const innerWidths = group.stats.map(s => {
                const tmp = this.add.text(0, -100, s.label, {
                    fontFamily: 'Roboto', fontSize: '10px', fontStyle: 'bold'
                });
                const w = tmp.width + innerPad * 2;
                tmp.destroy();
                return w;
            });
            const maxInnerW = Math.max(...innerWidths);
            const outerW = iconSpace + maxInnerW + outerPad * 2;
            return { outerW, innerWidths, maxInnerW };
        });

        const totalOuterW = groupWidths.reduce((s, g) => s + g.outerW, 0) + outerGap;
        let ox = cx - totalOuterW / 2;

        cvGroups.forEach((group, gi) => {
            const gw = groupWidths[gi];
            const outerTop = statsY - outerH / 2;

            // Outer container pill — glass-pill style matching leaderboard
            // Glow shadow layer
            pillGfx.fillStyle(0x6B3FA0, 0.15);
            pillGfx.fillRoundedRect(ox - 1, outerTop - 1, gw.outerW + 2, outerH + 2, outerR + 1);
            // Main fill — dark purple translucent
            pillGfx.fillStyle(0x1A0A2E, 0.45);
            pillGfx.lineStyle(1, 0x9B59B6, 0.25);
            pillGfx.fillRoundedRect(ox, outerTop, gw.outerW, outerH, outerR);
            pillGfx.strokeRoundedRect(ox, outerTop, gw.outerW, outerH, outerR);
            // Inset highlight — top edge
            pillGfx.lineStyle(1, 0xFFFFFF, 0.05);
            pillGfx.strokeRoundedRect(ox + 1, outerTop + 1, gw.outerW - 2, outerH - 2, outerR - 1);

            // CV icon inside outer pill, vertically centred
            this.add.image(ox + iconSpace / 2 + 2, statsY, group.icon).setScale(0.6).setAlpha(0.8);

            // Inner capsules — stacked vertically
            const innerX = ox + iconSpace + outerPad;
            group.stats.forEach((stat, si) => {
                const iw = gw.maxInnerW;
                const iy = outerTop + outerPad + si * (innerH + innerGap) + innerH / 2;

                // Inner capsule — purple-tinted glass to match
                pillGfx.fillStyle(0x9B59B6, 0.06);
                pillGfx.lineStyle(1, 0x9B59B6, 0.12);
                pillGfx.fillRoundedRect(innerX, iy - innerH / 2, iw, innerH, innerR);
                pillGfx.strokeRoundedRect(innerX, iy - innerH / 2, iw, innerH, innerR);

                this.add.text(innerX + iw / 2, iy, stat.label, {
                    fontFamily: 'Roboto',
                    fontSize: '10px',
                    fontStyle: 'bold',
                    color: stat.hex,
                    resolution: 2
                }).setOrigin(0.5);
            });

            ox += gw.outerW + outerGap;
        });

        // Save score
        const company = this.registry.get('companyName') || '';
        const recruiterType = this.registry.get('recruiterType') || '';
        this.saveScore(name, score, grade.grade, company, recruiterType);

        // Leaderboard — show local+fake data immediately, then update with remote
        const allScores = this.getLeaderboard();
        this.renderTables(CFG, allScores, name, score, yOff);

        // Fetch remote scores and re-render when available
        if (CFG.LEADERBOARD_URL) {
            const self = this;
            const url = CFG.LEADERBOARD_URL + '?action=getScores&token=' + encodeURIComponent(CFG.LEADERBOARD_TOKEN);
            fetch(url)
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (data && data.scores) {
                        window.CVInvaders._remoteScores = data.scores;
                        // Remove old DOM leaderboard and re-render
                        const oldDom = self.children.list.filter(function(c) { return c.type === 'DOMElement'; });
                        if (oldDom.length > 0) {
                            oldDom[oldDom.length - 1].destroy();
                        }
                        const updated = self.getLeaderboard();
                        self.renderTables(CFG, updated, name, score, yOff);
                    }
                })
                .catch(function() {});
        }

        // Buttons — all on one line
        const btnY = yOff + 546;

        // Play Again
        const playBtn = this.add.text(CFG.WIDTH / 2 - 210, btnY, '[ PLAY AGAIN ]', {
            fontFamily: 'Courier New',
            fontSize: '13px',
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

        // Watch Demo
        const demoBtn = this.add.text(CFG.WIDTH / 2, btnY, '[ 6 MIN DEMO OF FIRST ]', {
            fontFamily: 'Courier New',
            fontSize: '13px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        demoBtn.on('pointerover', () => demoBtn.setColor(CFG.COLORS.PURPLE_ACCENT_HEX));
        demoBtn.on('pointerout', () => demoBtn.setColor('#FFFFFF'));
        demoBtn.on('pointerdown', () => {
            window.open('https://www.first.cx/demo', '_blank');
        });

        // Share to LinkedIn
        const shareBtn = this.add.text(CFG.WIDTH / 2 + 210, btnY, '[ SHARE ON LINKEDIN ]', {
            fontFamily: 'Courier New',
            fontSize: '13px',
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

    }

    renderTables(CFG, allScores, playerName, playerScore, yOff) {
        yOff = yOff || 0;
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

        this.add.dom(CFG.WIDTH / 2, yOff + 320).createFromHTML(statsHTML);
    }

    getGrade(score) {
        const grades = window.CVInvaders.Config.GRADES;
        for (const g of grades) {
            if (score >= g.min) return g;
        }
        return grades[grades.length - 1];
    }

    saveScore(name, score, grade, company, type) {
        // Save to localStorage as fallback
        try {
            const key = 'cv_invaders_scores';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push({ name, score, grade, company, type, date: Date.now() });
            existing.sort((a, b) => b.score - a.score);
            localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
        } catch (e) {}

        // POST to Google Sheets API
        const CFG = window.CVInvaders.Config;
        if (CFG.LEADERBOARD_URL) {
            fetch(CFG.LEADERBOARD_URL, {
                method: 'POST',
                body: JSON.stringify({
                    token: CFG.LEADERBOARD_TOKEN,
                    action: 'addScore',
                    name: name,
                    company: company,
                    type: type,
                    score: score,
                    grade: grade
                })
            }).catch(function() {});
        }
    }

    getLeaderboard() {
        const fake = window.CVInvaders.FakeLeaderboard || [];
        const remote = window.CVInvaders._remoteScores || [];
        let saved = [];
        try {
            saved = JSON.parse(localStorage.getItem('cv_invaders_scores') || '[]');
        } catch (e) {}

        const all = [...remote, ...saved, ...fake];
        // Deduplicate by name+score combo
        const seen = new Set();
        const unique = all.filter(e => {
            const key = e.name + '|' + e.score;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        unique.sort((a, b) => b.score - a.score);
        return unique;
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
