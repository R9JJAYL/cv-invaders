window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.Config = {
    WIDTH: 800,
    HEIGHT: 600,

    // Player
    PLAYER_SPEED: 300,
    PLAYER_HEALTH: 5,
    FIRE_RATE: 250,
    BULLET_SPEED: 400,
    CATCH_ZONE_WIDTH: 60,
    CATCH_ZONE_UNICORN: 120,
    UNICORN_DURATION: 8000,

    // CVs
    CV_GOOD_RATIO: 0.3,

    // Waves
    WAVES: [
        {
            duration: 25000,
            spawnRate: 1400,
            fallSpeed: 160,
            maxOnScreen: 5,
            hasEnemies: false,
            hasUnicorn: false,
            unicornSpawnTimes: [],
            dialogue: 'Wave 1: The CVs are coming in!'
        },
        {
            duration: 30000,
            spawnRate: 1100,
            fallSpeed: 190,
            maxOnScreen: 7,
            hasEnemies: false,
            hasUnicorn: true,
            unicornSpawnTimes: [10000],
            dialogue: 'Wave 2: More applications incoming!'
        },
        {
            duration: 35000,
            spawnRate: 900,
            fallSpeed: 210,
            maxOnScreen: 8,
            hasEnemies: true,
            enemyCount: 4,
            enemyFireRate: 2000,
            hasUnicorn: true,
            unicornSpawnTimes: [12000, 25000],
            dialogue: 'Wave 3: The bad matches are fighting back!'
        }
    ],

    // Boss
    BOSS_HEALTH: 25,
    BOSS_TIMER: 30000,
    BOSS_PHASE2_THRESHOLD: 0.5,
    BOSS_SPAM_RATE: 1200,
    BOSS_BULLET_SPEED: 200,
    BOSS_DISGUISE_CHANCE: 0.4,

    // Enemies
    ENEMY_HEALTH: 3,
    ENEMY_SPEED: 100,
    ENEMY_FIRE_RATE: 2000,

    // Scoring
    SCORE: {
        CATCH_GOOD: 150,
        SHOOT_BAD: 150,
        MISS_GOOD: -75,
        BAD_REACHES_BOTTOM: -50,
        BAD_HITS_PLAYER: -100,
        ENEMY_KILL: 200,
        BOSS_HIT: 50,
        BOSS_KILL_BASE: 1000,
        CAUGHT_DISGUISED: -150,
        COMBO_THRESHOLDS: [
            { min: 30, multiplier: 4.0 },
            { min: 15, multiplier: 2.5 },
            { min: 8, multiplier: 2.0 },
            { min: 4, multiplier: 1.5 },
            { min: 0, multiplier: 1.0 }
        ]
    },

    // Grades
    GRADES: [
        { min: 20000, grade: 'S', title: 'Chief Talent Officer' },
        { min: 15000, grade: 'A', title: 'Head of Recruitment' },
        { min: 10000, grade: 'B', title: 'Senior Recruiter' },
        { min: 6000, grade: 'C', title: 'Recruiter' },
        { min: 3000, grade: 'D', title: 'Junior Recruiter' },
        { min: 0, grade: 'F', title: 'The AI Replaced You' }
    ],

    // Colors
    COLORS: {
        BG: 0x1a0a2e,
        BG_HEX: '#1a0a2e',
        PURPLE_PRIMARY: 0x6B3FA0,
        PURPLE_PRIMARY_HEX: '#6B3FA0',
        PURPLE_LIGHT: 0x8E44AD,
        PURPLE_ACCENT: 0x9B59B6,
        PURPLE_ACCENT_HEX: '#9B59B6',
        PURPLE_GLOW: 0xBB8FCE,
        CV_GOOD: 0x4ADE80,
        CV_GOOD_HEX: '#4ADE80',
        CV_BAD: 0xFF8A80,
        CV_BAD_HEX: '#FF8A80',
        BULLET: 0x00E5FF,
        ENEMY: 0xCC3333,
        ENEMY_HEX: '#CC3333',
        BOSS: 0x95A5A6,
        UNICORN: 0x9B59B6,
        TEXT_PRIMARY: '#FFFFFF',
        TEXT_SECONDARY: '#AAAAAA',
        HEALTH: '#E74C3C',
        COMBO: '#FFD700'
    },

    // Pool sizes
    POOLS: {
        BULLETS: 30,
        CVS: 15,
        ENEMY_BULLETS: 20
    }
};
