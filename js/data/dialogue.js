window.CVInvaders = window.CVInvaders || {};

/**
 * Dialogue — All in-game text strings, organised by when they appear.
 *
 * CINEMATIC  — Shown sequentially during the opening tutorial cinematic
 *              (duration = display time in ms before auto-advancing).
 * WAVES      — Banner text shown at the start of each wave (index matches wave number).
 * ENEMIES    — Displayed when ghost-candidate enemies first appear (Wave 3).
 * HIRING_MANAGER — Shown when the hiring manager event clears all CVs.
 * BOSS       — Entrance, phase-2, and defeated lines for the AI Bot 9000.
 * UNICORN    — Shown when the player first catches a purple unicorn power-up.
 * GAME_OVER  — Win/lose messages displayed on the results screen.
 */
window.CVInvaders.Dialogue = {
    CINEMATIC: [
        { text: '[ ALERT ]\n\nINCOMING THREAT DETECTED', duration: 1800 },
        { text: 'The bot\'s are attacking\nour ATS!', duration: 2000 },
        { text: 'Take control of the ship\nand protect it!', duration: 2000 },
        { text: 'Shoot the RED CVs\nCapture the GREEN ones', duration: 2200 }
    ],

    WAVES: [
        'Wave 1: The CVs are coming in!',
        'Wave 2: More applications incoming!',
        'Wave 3: The bad matches are fighting back!'
    ],

    ENEMIES: {
        ENTRANCE: 'The candidates you ghosted are back...\nHit them with their feedback!'
    },

    HIRING_MANAGER: {
        THREW_OUT: 'The damn hiring manager\nthrew out all the CVs!'
    },

    BOSS: {
        ENTRANCE: 'Uh oh...a bot\'s attacking\nour job ad, stop it!',
        PHASE2: 'ERROR 404: You haven\'t seen\nmy cover letters yet!',
        DEFEATED: 'System... shutting... down...'
    },

    UNICORN: {
        CAUGHT: 'Collect purple unicorns,\nthey\'re worth 2x!'
    },

    GAME_OVER: {
        WIN: 'You defeated the bot\'s!\nRecruiters: 1, Bot\'s: 0',
        LOSE: 'The bot\'s got the better of you...\nTime to upskill!'
    }
};
