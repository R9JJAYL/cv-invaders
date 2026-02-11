window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.Dialogue = {
    CINEMATIC: [
        { text: '[ ALERT ]\n\nINCOMING THREAT DETECTED', duration: 1800 },
        { text: 'The bots are attacking\nour ATS!', duration: 2000 },
        { text: 'Take control of the ship\nand protect it!', duration: 2000 },
        { text: 'Shoot the RED CVs\nCapture the GREEN ones', duration: 2200 }
    ],

    WAVES: [
        'Wave 1: The CVs are coming in!',
        'Wave 2: More applications incoming!',
        'Wave 3: The bad matches are fighting back!'
    ],

    ENEMIES: {
        ENTRANCE: 'The candidates you ghosted are back!\nDestroy them to close the feedback loop!'
    },

    HIRING_MANAGER: {
        THREW_OUT: 'The hiring manager\nthrew out all the CVs!'
    },

    BOSS: {
        ENTRANCE: 'The bots are attacking\nour job ad, stop them!',
        PHASE2: 'ERROR 404: You haven\'t seen\nmy cover letters yet!',
        DEFEATED: 'System... shutting... down...'
    },

    UNICORN: {
        CAUGHT: 'Catch the unicorns,\nthey\'re worth 2x!'
    },

    GAME_OVER: {
        WIN: 'You defeated the bots!\nRecruiters: 1, Bots: 0',
        LOSE: 'The bots got the better of you...\nTime to upskill!'
    }
};
