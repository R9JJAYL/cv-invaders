window.CVInvaders = window.CVInvaders || {};

/**
 * LeaderboardRenderer — Shared leaderboard HTML generation.
 *
 * Builds the agency-vs-internal stats comparison and the top-10 table.
 * Used by both MenuScene (no player highlighting) and GameOverScene
 * (highlights the current player's row).
 */
window.CVInvaders.LeaderboardRenderer = {
    /**
     * Build the leaderboard DOM element containing team stats and score table.
     *
     * @param {Phaser.Scene} scene - The scene to create the DOM element in
     * @param {Object} CFG - Game config (CVInvaders.Config)
     * @param {Array} allScores - Array of score entries [{name, company, type, score}, ...]
     * @param {Object} [options] - Optional display settings
     * @param {string} [options.playerName] - Current player name to highlight (null = no highlight)
     * @param {number} [options.playerScore] - Current player score for matching highlight row
     * @param {number} [options.yPosition=420] - DOM element Y position in the scene
     * @param {boolean} [options.disablePointerEvents=false] - If true, set pointer-events:none
     * @returns {Phaser.GameObjects.DOMElement} The created DOM element (caller stores/destroys it)
     */
    renderTables(scene, CFG, allScores, options) {
        options = options || {};
        var playerName = options.playerName || null;
        var playerScore = options.playerScore != null ? options.playerScore : null;
        var yPosition = options.yPosition != null ? options.yPosition : 420;
        var disablePointerEvents = options.disablePointerEvents || false;

        var agency = allScores.filter(function(e) { return e.type === 'agency'; });
        var internal = allScores.filter(function(e) { return e.type === 'internal'; });
        var agencyTotal = agency.reduce(function(s, e) { return s + e.score; }, 0);
        var internalTotal = internal.reduce(function(s, e) { return s + e.score; }, 0);
        var agencyAvg = agency.length > 0 ? Math.round(agencyTotal / agency.length) : 0;
        var internalAvg = internal.length > 0 ? Math.round(internalTotal / internal.length) : 0;
        var fmt = function(n) { return n.toLocaleString(); };

        // Determine crown winners for each stat
        var gamesWin = agency.length > internal.length ? 'agency' : internal.length > agency.length ? 'internal' : 'tie';
        var totalWin = agencyTotal > internalTotal ? 'agency' : internalTotal > agencyTotal ? 'internal' : 'tie';
        var avgWin = agencyAvg > internalAvg ? 'agency' : internalAvg > agencyAvg ? 'internal' : 'tie';
        var crown = '<span class="stat-crown">\uD83D\uDC51</span>';
        var noCrown = '<span class="stat-crown" style="visibility:hidden">\uD83D\uDC51</span>';

        // Build pointer-events style for the wrapper div
        var wrapperStyle = disablePointerEvents ? ' style="pointer-events: none;"' : '';

        var statsHTML = '<div class="menu-tables"' + wrapperStyle + '>' +
            '<div class="glass-pill combined-pill">' +
            '<div class="lb-title">LEADERBOARD</div>' +
            '<div class="stats-section">' +
            '<div class="stats-columns">' +
            '<div class="stats-team">' +
            '<div class="team-label agency-label">AGENCY RECRUITERS</div>' +
            '<div class="stat-pills">' +
            '<div class="stat-pill agency-pill">' + (gamesWin === 'agency' ? crown : noCrown) + '<div class="stat-val">' + fmt(agency.length) + '</div><div class="stat-name">Games</div></div>' +
            '<div class="stat-pill agency-pill">' + (totalWin === 'agency' ? crown : noCrown) + '<div class="stat-val">' + fmt(agencyTotal) + '</div><div class="stat-name">Total</div></div>' +
            '<div class="stat-pill agency-pill">' + (avgWin === 'agency' ? crown : noCrown) + '<div class="stat-val">' + fmt(agencyAvg) + '</div><div class="stat-name">Average</div></div>' +
            '</div></div>' +
            '<div class="stats-vs">VS</div>' +
            '<div class="stats-team">' +
            '<div class="team-label internal-label">INTERNAL RECRUITERS</div>' +
            '<div class="stat-pills">' +
            '<div class="stat-pill internal-pill">' + (gamesWin === 'internal' ? crown : noCrown) + '<div class="stat-val">' + fmt(internal.length) + '</div><div class="stat-name">Games</div></div>' +
            '<div class="stat-pill internal-pill">' + (totalWin === 'internal' ? crown : noCrown) + '<div class="stat-val">' + fmt(internalTotal) + '</div><div class="stat-name">Total</div></div>' +
            '<div class="stat-pill internal-pill">' + (avgWin === 'internal' ? crown : noCrown) + '<div class="stat-val">' + fmt(internalAvg) + '</div><div class="stat-name">Average</div></div>' +
            '</div></div>' +
            '</div></div>' +
            '<div class="lb-divider"></div>' +
            '<table class="leaderboard-table">' +
            '<thead>' +
            '<tr>' +
            '<th class="lb-head lb-rank">#</th>' +
            '<th class="lb-head lb-name">PLAYER</th>' +
            '<th class="lb-head lb-company">COMPANY</th>' +
            '<th class="lb-head lb-type">TEAM</th>' +
            '<th class="lb-head lb-score">SCORE</th>' +
            '</tr></thead><tbody>' +
            allScores.slice(0, window.matchMedia('(pointer: coarse)').matches ? 5 : 8).map(function(entry, i) {
                var isPlayer = playerName && entry.name === playerName && entry.score === playerScore;
                var typeLabel = entry.type === 'agency' ? 'Agency' : entry.type === 'internal' ? 'Internal' : entry.type ? 'Other' : '';
                var typeClass = entry.type === 'agency' ? 'type-agency' : entry.type === 'internal' ? 'type-internal' : 'type-other';
                var podiumRank = i === 0 ? ' lb-gold' : i === 1 ? ' lb-silver' : i === 2 ? ' lb-bronze' : '';
                var podiumRow = i < 3 ? ' lb-podium' : '';
                var rowClass = (isPlayer ? 'lb-highlight' : '') + podiumRow;
                var displayName = isPlayer ? '\u25B8 ' + entry.name : entry.name;
                return '<tr class="' + rowClass + '">' +
                    '<td class="lb-cell lb-rank' + podiumRank + '">' + (i + 1) + '.</td>' +
                    '<td class="lb-cell lb-name">' + displayName + '</td>' +
                    '<td class="lb-cell lb-company">' + (entry.company || '') + '</td>' +
                    '<td class="lb-cell lb-type ' + typeClass + '">' + typeLabel + '</td>' +
                    '<td class="lb-cell lb-score">' + entry.score.toLocaleString() + '</td>' +
                    '</tr>';
            }).join('') +
            '</tbody></table></div></div>';

        var domElement = scene.add.dom(CFG.WIDTH / 2, yPosition).createFromHTML(statsHTML);

        // Disable pointer events on the DOM wrapper if requested (prevents blocking touch on mobile)
        if (disablePointerEvents) {
            if (domElement.node && domElement.node.style) {
                domElement.node.style.pointerEvents = 'none';
            }
            if (domElement.node && domElement.node.parentElement) {
                domElement.node.parentElement.style.pointerEvents = 'none';
            }
        }

        return domElement;
    }
};
