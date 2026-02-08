window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.Dialogue = {
    CINEMATIC: [
        { text: '[ ALERT ]\n\nINCOMING THREAT DETECTED', duration: 1800 },
        { text: 'The bots are attacking\nour ATS!', duration: 2000 },
        { text: 'We need you to take the helm\nand protect it.', duration: 2200 },
        { text: 'Shoot the RED CVs\nCapture the GREEN ones', duration: 2200 }
    ],

    TUTORIAL: [
        { text: 'BRIEFING:', duration: 1000 },
        { text: 'Your mission: Catch the GREEN CVs,\nshoot the RED ones.', duration: 2500 },
        { text: 'Wait a minute...\nThe hiring manager has changed the brief!', duration: 2000 },
        { text: 'Throw all the CVs out\nand start again...', duration: 1500 },
        { text: 'Just kidding,\nthat\'s the tutorial over.', duration: 1500 },
        { text: 'Let\'s go find these CVs!', duration: 1000 }
    ],

    WAVES: [
        'Wave 1: The CVs are coming in!',
        'Wave 2: More applications incoming!',
        'Wave 3: The bad matches are fighting back!'
    ],

    ENEMIES: {
        ENTRANCE: 'The candidates we never got back to\nare after us!',
        DEFEATED: 'Pop their ships to send\nthem their feedback!'
    },

    BOSS: {
        ENTRANCE: 'I\'ve applied to 10,000 jobs today!\nCan you keep up?',
        PHASE2: 'I won\'t go down that easy!',
        DEFEATED: 'System... shutting... down...'
    },

    UNICORN: {
        CAUGHT: 'Purple Unicorn caught!\nDouble points awarded!'
    },

    GAME_OVER: {
        WIN: 'You defeated the AI!\nRecruiters: 1, Bots: 0',
        LOSE: 'The bots got the better of you...\nTime to upskill!'
    }
};
