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

        // Subtitle — "powered by" text + inline First logo
        const subtitleY = 50 + titleCV.height / 2 + 8;
        const subtitleX = titleCV.x + totalW;
        const poweredByText = this.add.text(subtitleX, subtitleY, 'powered by', {
            fontFamily: 'Roboto',
            fontSize: '11px',
            color: CFG.COLORS.TEXT_SECONDARY,
            fontStyle: 'normal'
        }).setOrigin(1, 0.5).setAlpha(0.4);
        // First logo inline, right after "powered by"
        this.add.image(subtitleX + 4, subtitleY, 'first-logo')
            .setOrigin(0, 0.5)
            .setScale(0.035)
            .setAlpha(0.5);

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
        this.formInput = this.add.dom(CFG.WIDTH / 2, 135).createFromHTML(formHTML);

        // Start button
        this.startBtn = this.add.text(CFG.WIDTH / 2, 205, '[ CLICK TO START MISSION ]', {
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
        const allScores = this.getLeaderboard();
        this.renderTables(CFG, allScores);

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

        // Stats table (glass pill)
        const statsHTML = '<div class="menu-tables">' +
            '<div class="glass-pill stats-pill">' +
            '<table class="stats-table">' +
            '<thead><tr>' +
            '<th class="stats-header" colspan="3">AGENCY vs INTERNAL</th>' +
            '</tr></thead>' +
            '<tbody>' +
            '<tr><td class="agency-val">' + fmt(agency.length) + '</td><td class="stat-label">Games</td><td class="internal-val">' + fmt(internal.length) + '</td></tr>' +
            '<tr><td class="agency-val">' + fmt(agencyTotal) + '</td><td class="stat-label">Total</td><td class="internal-val">' + fmt(internalTotal) + '</td></tr>' +
            '<tr><td class="agency-val">' + fmt(agencyAvg) + '</td><td class="stat-label">Avg</td><td class="internal-val">' + fmt(internalAvg) + '</td></tr>' +
            '</tbody></table></div>' +

            // Leaderboard table (glass pill)
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
            allScores.slice(0, 10).map((entry, i) => {
                const typeLabel = entry.type === 'agency' ? 'Agency' : entry.type === 'internal' ? 'Internal' : '';
                const typeClass = entry.type === 'agency' ? 'type-agency' : '';
                return '<tr>' +
                    '<td class="lb-cell lb-rank">' + (i + 1) + '.</td>' +
                    '<td class="lb-cell lb-name">' + entry.name + '</td>' +
                    '<td class="lb-cell lb-company">' + (entry.company || '') + '</td>' +
                    '<td class="lb-cell lb-type ' + typeClass + '">' + typeLabel + '</td>' +
                    '<td class="lb-cell lb-score">' + entry.score.toLocaleString() + '</td>' +
                    '</tr>';
            }).join('') +
            '</tbody></table></div></div>';

        this.add.dom(CFG.WIDTH / 2, 410).createFromHTML(statsHTML);
    }

    startGame() {
        const nameEl = this.formInput.getChildByID('playerName');
        const companyEl = this.formInput.getChildByID('companyName');
        const typeEl = this.formInput.getChildByID('recruiterType');

        const name = (nameEl ? nameEl.value.trim() : '') || 'Recruiter';
        const company = companyEl ? companyEl.value.trim() : '';
        const recruiterType = typeEl ? typeEl.value : '';

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

        this.cameras.main.fadeOut(500);
        this.time.delayedCall(500, () => {
            this.scene.start('TutorialScene');
        });
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
};
