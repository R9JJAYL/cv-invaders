window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.MenuScene = class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const CFG = window.CVInvaders.Config;

        // Background starfield
        for (let i = 0; i < 40; i++) {
            this.add.image(
                Phaser.Math.Between(0, CFG.WIDTH),
                Phaser.Math.Between(0, CFG.HEIGHT),
                'star'
            ).setAlpha(Phaser.Math.FloatBetween(0.2, 0.7));
        }

        // Title — CV in purple, INVADERS in white (retro arcade font)
        // Measure natural width first, then scale letter spacing to match leaderboard (600px)
        const targetWidth = 600;
        const titleStyle = {
            fontFamily: '"Press Start 2P"',
            fontSize: '38px',
            letterSpacing: 0
        };
        const titleCV = this.add.text(0, 0, 'CV', {
            ...titleStyle,
            color: CFG.COLORS.PURPLE_ACCENT_HEX
        });
        const titleInvaders = this.add.text(0, 0, 'INVADERS', {
            ...titleStyle,
            color: '#FFFFFF'
        });
        const gap = 16;
        const naturalW = titleCV.width + gap + titleInvaders.width;
        // Distribute extra space across all characters (2 + 8 = 10 chars)
        const extraPerChar = (targetWidth - naturalW) / 10;
        const spacing = Math.max(0, Math.round(extraPerChar));
        titleCV.setLetterSpacing(spacing);
        titleInvaders.setLetterSpacing(spacing);
        const totalW = titleCV.width + gap + titleInvaders.width;
        titleCV.setPosition(CFG.WIDTH / 2 - totalW / 2, 50 - titleCV.height / 2);
        titleInvaders.setPosition(titleCV.x + titleCV.width + gap, 50 - titleInvaders.height / 2);

        // Subtitle — "by" + First logo + tagline
        const subtitleY = 50 + titleCV.height / 2 + 8;
        const rightEdge = titleCV.x + totalW - 7;
        this.firstLogo = this.add.image(rightEdge, subtitleY, 'first-logo-small')
            .setOrigin(1, 0.5)
            .setScale(0.34)
            .setAlpha(0.5);
        this.poweredByText = this.add.text(this.firstLogo.x - this.firstLogo.displayWidth - 4, subtitleY, 'by', {
            fontFamily: 'Roboto',
            fontSize: '13px',
            color: CFG.COLORS.TEXT_SECONDARY,
            fontStyle: 'normal'
        }).setOrigin(1, 0.5).setAlpha(0.4);

        // Form inputs — name & company side by side, type below
        const formHTML = '<div class="menu-form">' +
            '<div class="form-row">' +
            '<input type="text" id="playerName" placeholder="Enter Name" maxlength="30" autocomplete="off" />' +
            '<input type="text" id="companyName" placeholder="Enter Company" maxlength="30" autocomplete="off" />' +
            '</div>' +
            '<select id="recruiterType" required>' +
            '<option value="" disabled selected>Select Team</option>' +
            '<option value="agency">Agency</option>' +
            '<option value="internal">Internal</option>' +
            '<option value="other">Other</option>' +
            '</select>' +
            '</div>';
        this.formInput = this.add.dom(CFG.WIDTH / 2, 145).createFromHTML(formHTML);

        // Start button
        this.startBtn = this.add.text(CFG.WIDTH / 2, 213, '[ CLICK TO START MISSION ]', {
            fontFamily: 'Courier New',
            fontSize: '22px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Pulse animation
        this.tweens.add({
            targets: this.startBtn,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.startBtn.on('pointerover', () => this.startBtn.setColor(CFG.COLORS.PURPLE_ACCENT_HEX));
        this.startBtn.on('pointerout', () => this.startBtn.setColor('#FFFFFF'));
        this.startBtn.on('pointerdown', () => this.startGame());

        // Aggregate stats + Leaderboard (HTML tables)
        // If we already have remote scores cached, render immediately;
        // otherwise show loading state and fetch from API
        if (window.CVInvaders._remoteScores && window.CVInvaders._remoteScores.length > 0) {
            this.renderTables(CFG, window.CVInvaders._remoteScores.slice());
        } else {
            this.renderLoadingState(CFG);
            this.fetchRemoteScores(CFG);
        }

        // Enter key to start
        this.input.keyboard.on('keydown-ENTER', () => this.startGame());

    }

    renderTables(CFG, allScores) {
        const agency = allScores.filter(e => e.type === 'agency');
        const internal = allScores.filter(e => e.type === 'internal');
        const agencyTotal = agency.reduce((s, e) => s + e.score, 0);
        const internalTotal = internal.reduce((s, e) => s + e.score, 0);
        const agencyAvg = agency.length > 0 ? Math.round(agencyTotal / agency.length) : 0;
        const internalAvg = internal.length > 0 ? Math.round(internalTotal / internal.length) : 0;
        const fmt = (n) => n.toLocaleString();

        // Determine crown winners for each stat
        const gamesWin = agency.length > internal.length ? 'agency' : internal.length > agency.length ? 'internal' : 'tie';
        const totalWin = agencyTotal > internalTotal ? 'agency' : internalTotal > agencyTotal ? 'internal' : 'tie';
        const avgWin = agencyAvg > internalAvg ? 'agency' : internalAvg > agencyAvg ? 'internal' : 'tie';
        const crown = '<span class="stat-crown">👑</span>';
        const noCrown = '<span class="stat-crown" style="visibility:hidden">👑</span>';

        // Combined stats + leaderboard (single glass pill)
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
                const typeLabel = entry.type === 'agency' ? 'Agency' : entry.type === 'internal' ? 'Internal' : entry.type ? 'Other' : '';
                const typeClass = entry.type === 'agency' ? 'type-agency' : '';
                const podiumRank = i === 0 ? ' lb-gold' : i === 1 ? ' lb-silver' : i === 2 ? ' lb-bronze' : '';
                const podiumRow = i < 3 ? ' lb-podium' : '';
                return '<tr class="' + podiumRow + '">' +
                    '<td class="lb-cell lb-rank' + podiumRank + '">' + (i + 1) + '.</td>' +
                    '<td class="lb-cell lb-name">' + entry.name + '</td>' +
                    '<td class="lb-cell lb-company">' + (entry.company || '') + '</td>' +
                    '<td class="lb-cell lb-type ' + typeClass + '">' + typeLabel + '</td>' +
                    '<td class="lb-cell lb-score">' + entry.score.toLocaleString() + '</td>' +
                    '</tr>';
            }).join('') +
            '</tbody></table></div></div>';

        this.leaderboardDom = this.add.dom(CFG.WIDTH / 2, 420).createFromHTML(statsHTML);
    }

    renderLoadingState(CFG) {
        var loadingHTML = '<div class="menu-tables">' +
            '<div class="glass-pill combined-pill">' +
            '<div class="lb-title">LEADERBOARD</div>' +
            '<div style="text-align:center;padding:30px 0;color:#AAAAAA;font-family:Courier New;font-size:14px;">Loading scores<span class="loading-spinner"></span></div>' +
            '</div></div>';
        this.leaderboardDom = this.add.dom(CFG.WIDTH / 2, 420).createFromHTML(loadingHTML);
    }

    fetchRemoteScores(CFG) {
        if (!CFG.LEADERBOARD_URL) {
            // No API configured — show empty leaderboard
            if (this.leaderboardDom) this.leaderboardDom.destroy();
            this.renderTables(CFG, []);
            return;
        }
        var self = this;
        var url = CFG.LEADERBOARD_URL + '?action=getScores&token=' + encodeURIComponent(CFG.LEADERBOARD_TOKEN);
        fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data && data.scores && data.scores.length > 0) {
                    window.CVInvaders._remoteScores = data.scores;
                }
                // Re-render with real data (or fake fallback if API returned empty)
                if (self.leaderboardDom) self.leaderboardDom.destroy();
                self.renderTables(CFG, self.getLeaderboard());
            })
            .catch(function(e) {
                console.warn('Leaderboard fetch failed:', e);
                // Fall back to fake data on error
                if (self.leaderboardDom) self.leaderboardDom.destroy();
                self.renderTables(CFG, self.getLeaderboard());
            });
    }

    startGame() {
        const nameEl = this.formInput.getChildByID('playerName');
        const companyEl = this.formInput.getChildByID('companyName');
        const typeEl = this.formInput.getChildByID('recruiterType');

        const name = nameEl ? nameEl.value.trim() : '';
        const company = companyEl ? companyEl.value.trim() : '';
        const recruiterType = typeEl ? typeEl.value : '';

        // Require all fields — pulsing red flash for 5 seconds on missing ones
        if (!name || !company || !recruiterType) {
            var missing = [];
            if (nameEl && !name) missing.push(nameEl);
            if (companyEl && !company) missing.push(companyEl);
            if (typeEl && !recruiterType) missing.push(typeEl);
            // Clear any previous flash
            if (this._flashInterval) clearInterval(this._flashInterval);
            if (this._flashTimeout) clearTimeout(this._flashTimeout);
            var on = true;
            var flash = function() {
                if (on) {
                    missing.forEach(function(el) {
                        el.style.setProperty('border-color', '#E74C3C', 'important');
                        el.style.setProperty('box-shadow', '0 0 10px rgba(231,76,60,0.6)', 'important');
                    });
                } else {
                    missing.forEach(function(el) {
                        el.style.removeProperty('border-color');
                        el.style.removeProperty('box-shadow');
                    });
                }
                on = !on;
            };
            flash();
            this._flashInterval = setInterval(flash, 400);
            // Stop after 5 seconds
            this._flashTimeout = setTimeout(function() {
                clearInterval(this._flashInterval);
                missing.forEach(function(el) {
                    el.style.removeProperty('border-color');
                    el.style.removeProperty('box-shadow');
                });
            }.bind(this), 5000);
            return;
        }

        this.registry.set('playerName', name);
        this.registry.set('companyName', company);
        this.registry.set('recruiterType', recruiterType);
        this.registry.set('score', 0);
        this.registry.set('health', window.CVInvaders.Config.PLAYER_HEALTH);
        this.registry.set('goodCVsCaught', 0);
        this.registry.set('badCVsShot', 0);
        this.registry.set('enemiesDefeated', 0);
        this.registry.set('maxCombo', 0);
        this.registry.set('bossTime', 0);
        this.registry.set('bossDefeated', false);

        // Briefly boost powered-by so it lingers as last visible element
        this.tweens.add({
            targets: this.poweredByText,
            alpha: 0.7,
            duration: 150
        });
        this.tweens.add({
            targets: this.firstLogo,
            alpha: 0.85,
            duration: 150
        });
        this.cameras.main.fadeOut(600);
        this.time.delayedCall(600, () => {
            this.scene.start('TutorialScene');
        });
    }

    getLeaderboard() {
        return (window.CVInvaders._remoteScores || []).slice();
    }
};
