window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.GameScene = class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        this.gameOver = false;
        this.tutorialPhase = true;
        this.tutorialComplete = false;
        this.firstUnicornShown = false;
        this.bossPhase = false;
        this.bossStartTime = 0;

        // Calculate total wave duration for the countdown
        const waves = window.CVInvaders.Config.WAVES;
        this.totalGameDuration = waves.reduce((sum, w) => sum + w.duration, 0);
    }

    create() {
        const CFG = window.CVInvaders.Config;

        // Ensure canvas has focus (away from DOM inputs)
        this.game.canvas.focus();

        // Sound engine (reuse shared instance to avoid AudioContext pile-up)
        if (!window.CVInvaders._sharedSoundEngine) {
            window.CVInvaders._sharedSoundEngine = new window.CVInvaders.SoundEngine();
            window.CVInvaders._sharedSoundEngine.init();
        }
        this.sound_engine = window.CVInvaders._sharedSoundEngine;

        // Mute key
        this.muteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
        this.muteKey.on('down', () => {
            const muted = this.sound_engine.toggleMute();
            const hud = this.scene.get('HUD');
            if (hud && hud.updateMuteText) hud.updateMuteText(muted);
        });

        // Transparent background — starfield runs in TutorialScene underneath
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
        this.cameras.main.transparent = true;

        // Player ship
        this.ship = new window.CVInvaders.PlayerShip(this, CFG.WIDTH / 2, CFG.HEIGHT - 50);

        // Bullet pool
        this.bullets = this.physics.add.group({
            classType: window.CVInvaders.Bullet,
            maxSize: CFG.POOLS.BULLETS,
            runChildUpdate: false
        });
        for (let i = 0; i < CFG.POOLS.BULLETS; i++) {
            const b = new window.CVInvaders.Bullet(this, 0, 0);
            this.bullets.add(b, true);
            b.setActive(false).setVisible(false);
            b.body.enable = false;
        }

        // CV pool
        this.cvs = this.physics.add.group({
            classType: window.CVInvaders.CV,
            maxSize: CFG.POOLS.CVS,
            runChildUpdate: false
        });
        for (let i = 0; i < CFG.POOLS.CVS; i++) {
            const cv = new window.CVInvaders.CV(this, 0, 0);
            this.cvs.add(cv, true);
            cv.setActive(false).setVisible(false);
            cv.body.enable = false;
        }

        // Enemy bullet pool (also used for boss bullets)
        this.enemyBullets = this.physics.add.group({
            classType: window.CVInvaders.EnemyBullet,
            maxSize: CFG.POOLS.ENEMY_BULLETS,
            runChildUpdate: false
        });
        for (let i = 0; i < CFG.POOLS.ENEMY_BULLETS; i++) {
            const eb = new window.CVInvaders.EnemyBullet(this, 0, 0);
            this.enemyBullets.add(eb, true);
            eb.setActive(false).setVisible(false);
            eb.body.enable = false;
        }

        // Enemies group (not pooled, created per wave)
        this.enemies = this.physics.add.group();

        // Boss group (boss must be in a group for overlap detection to work)
        this.bossGroup = this.physics.add.group();

        // Systems
        this.scoreManager = new window.CVInvaders.ScoreManager(this);
        this.waveManager = new window.CVInvaders.WaveManager(this);

        // Collisions
        this.setupCollisions();

        // Launch HUD
        this.scene.launch('HUD');

        // Announcement text
        this.announcementText = this.add.text(CFG.WIDTH / 2, CFG.HEIGHT / 2, '', {
            fontFamily: 'Courier New',
            fontSize: '24px',
            color: '#FFFFFF',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5).setDepth(50).setAlpha(0);

        // DEBUG: Press SPACE to skip to boss fight (REMOVE BEFORE RELEASE)
        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.bossPhase && !this.gameOver) {
                this.tutorialPhase = false;
                this.tutorialComplete = true;
                if (this.tutorialSpawnTimer) {
                    this.tutorialSpawnTimer.remove();
                    this.tutorialSpawnTimer = null;
                }
                // Cancel all pending delayed calls (tutorial timers, wave announcements)
                this.time.removeAllEvents();
                // Clear any active CVs and enemies
                this.cvs.getChildren().forEach(cv => { if (cv.active) cv.recycle(); });
                this.enemies.getChildren().forEach(e => { if (e.active) e.destroy(); });
                // Clear announcement
                this.announcementText.setAlpha(0);
                this.waveManager.active = false;
                // Go straight to boss (skip the 2.5s announcement delay)
                this.bossPhase = true;
                this.bossSpawnTimer = 0;
                this.bossTimeRemaining = window.CVInvaders.Config.BOSS_TIMER;
                this.spawnBoss();
            }
        });

        // Start background music
        this.sound_engine.startMusic();

        // Start with tutorial
        this.startTutorial();
    }

    // ===== TUTORIAL FLOW =====
    startTutorial() {
        const CFG = window.CVInvaders.Config;

        // Show movement hint — detect touch/mobile vs desktop
        const isMobile = !this.sys.game.device.os.desktop;
        const moveHint = isMobile
            ? 'Tap or drag to move the ship'
            : 'Use ← → arrow keys to move';
        this.showAnnouncement(moveHint, 3000);

        // Start spawning tutorial CVs right away
        this.time.delayedCall(600, () => {
            this.tutorialSpawnTimer = this.time.addEvent({
                delay: 1200,
                callback: () => this.spawnTutorialCV(),
                loop: true
            });
        });

        // After ~8 CVs have dropped, trigger the joke
        this.time.delayedCall(10400, () => {
            this.triggerTutorialJoke();
        });
    }

    spawnTutorialCV() {
        const cv = this.cvs.getFirstDead(false);
        if (!cv) return;

        const CFG = window.CVInvaders.Config;
        const x = Phaser.Math.Between(60, CFG.WIDTH - 60);
        const isGood = Math.random() < 0.4; // slightly more good CVs in tutorial

        cv.spawn(x, -30, isGood, 130, false);
    }

    triggerTutorialJoke() {
        // Stop spawning tutorial CVs
        if (this.tutorialSpawnTimer) {
            this.tutorialSpawnTimer.remove();
            this.tutorialSpawnTimer = null;
        }

        const CFG = window.CVInvaders.Config;
        const DLG = window.CVInvaders.Dialogue;

        // The hiring manager joke
        this.showAnnouncement('Wait... the hiring manager\nchanged the brief!', 2500);

        // Sweep all CVs off screen
        this.time.delayedCall(1500, () => {
            this.cvs.getChildren().forEach(cv => {
                if (cv.active) {
                    this.tweens.add({
                        targets: cv,
                        x: cv.x + Phaser.Math.Between(-200, 200),
                        y: -60,
                        angle: Phaser.Math.Between(-180, 180),
                        alpha: 0,
                        duration: 600,
                        ease: 'Power2',
                        onComplete: () => cv.recycle()
                    });
                }
            });
        });

        this.time.delayedCall(3000, () => {
            this.showAnnouncement('Time to reassess the CVs...', 1200);
        });

        // Reset score from tutorial practice and start Wave 1
        this.time.delayedCall(4500, () => {
            this.tutorialPhase = false;
            this.tutorialComplete = true;
            this.scoreManager.score = 0;
            this.scoreManager.combo = 0;
            this.scoreManager.maxCombo = 0;
            this.scoreManager.goodCVsCaught = 0;
            this.scoreManager.badCVsShot = 0;
            this.registry.set('score', 0);
            this.waveManager.startWave(0);
        });
    }

    // ===== COLLISIONS =====
    setupCollisions() {
        // Player bullets hit bad CVs
        this.physics.add.overlap(this.bullets, this.cvs, (bullet, cv) => {
            if (!cv.active || !bullet.active) return;
            if (cv.isGood && !cv.isDisguised) return; // bullets pass through good CVs

            bullet.recycle();
            const points = this.scoreManager.shootBadCV();
            this.sound_engine.hitBadCV();
            this.showFloatingScore(cv.x, cv.y, points);
            cv.recycle();
        }, null, this);

        // Good CVs caught by catch zone
        this.physics.add.overlap(this.ship.catchZone, this.cvs, (zone, cv) => {
            if (!cv.active) return;

            if (cv.isGood && !cv.isDisguised) {
                const points = this.scoreManager.catchGoodCV();
                this.sound_engine.catchGoodCV();
                this.showFloatingScore(cv.x, cv.y, points);
                cv.recycle();
            } else if (cv.isDisguised) {
                const points = this.scoreManager.caughtDisguisedCV();
                this.sound_engine.playerHit();
                this.showFloatingScore(cv.x, cv.y, points);
                this.ship.takeDamage();
                cv.recycle();
            }
        }, null, this);

        // Bad CVs hit ship body
        this.physics.add.overlap(this.ship, this.cvs, (ship, cv) => {
            if (!cv.active || !this.ship.isAlive || this.ship.invincible) return;
            if (cv.isGood && !cv.isDisguised) return; // good CVs don't damage ship

            const points = this.scoreManager.badCVHitsPlayer();
            this.sound_engine.playerHit();
            this.showFloatingScore(cv.x, cv.y, points);
            this.ship.takeDamage();
            cv.recycle();
        }, null, this);

        // Enemy/boss bullets hit player
        this.physics.add.overlap(this.ship, this.enemyBullets, (ship, bullet) => {
            if (!bullet.active || !this.ship.isAlive || this.ship.invincible) return;
            bullet.recycle();
            const points = this.scoreManager.badCVHitsPlayer();
            this.sound_engine.playerHit();
            this.showFloatingScore(this.ship.x, this.ship.y, points);
            this.ship.takeDamage();
        }, null, this);

        // Player bullets hit enemies
        this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
            if (!bullet.active || !enemy.isAlive) return;
            bullet.recycle();
            enemy.takeDamage();
        }, null, this);
    }

    // ===== UPDATE LOOP =====
    update(time, delta) {
        if (this.gameOver) return;

        // Auto-fire
        if (this.ship.fireBullet(time)) {
            const bullet = this.bullets.getFirstDead(false);
            if (bullet) {
                bullet.fire(this.ship.x, this.ship.y - 30);
                this.sound_engine.shoot();
            }
        }

        // Only run wave manager after tutorial is done (and not in boss phase)
        if (this.tutorialComplete && !this.bossPhase) {
            const result = this.waveManager.update(delta);
            if (result && result.waveComplete && result.allWavesDone) {
                this.startBossPhase();
            }
        }

        // Keep CVs falling during boss phase
        if (this.bossPhase && !this.gameOver) {
            this.bossSpawnTimer += delta;
            if (this.bossSpawnTimer >= 1400) {
                this.bossSpawnTimer = 0;
                const activeCVs = this.cvs.countActive(true);
                if (activeCVs < 6) {
                    this.spawnBossBackgroundCV();
                }
            }

            // Boss countdown timer
            this.bossTimeRemaining -= delta;
            if (this.bossTimeRemaining <= 0) {
                this.bossTimeRemaining = 0;
                this.onBossTimeUp();
            }
        }

        // Update HUD combo and countdown
        const hud = this.scene.get('HUD');
        if (hud && hud.updateCombo) {
            hud.updateCombo(this.scoreManager.combo);
        }
        if (hud && hud.updateCountdown) {
            if (this.bossPhase) {
                hud.updateCountdown(this.bossTimeRemaining, true);
            } else if (this.waveManager.active) {
                hud.updateCountdown(this.waveManager.getTotalRemainingMs(), false);
            }
            // Don't show timer during tutorial — it only starts when waves begin
        }
    }

    // ===== CV SPAWNING =====
    spawnCV(wave) {
        const cv = this.cvs.getFirstDead(false);
        if (!cv) return;

        const CFG = window.CVInvaders.Config;
        const x = Phaser.Math.Between(40, CFG.WIDTH - 40);
        const isGood = Math.random() < CFG.CV_GOOD_RATIO;

        cv.spawn(x, -30, isGood, wave.fallSpeed, false);
    }

    spawnUnicorn() {
        const CFG = window.CVInvaders.Config;
        const x = Phaser.Math.Between(100, CFG.WIDTH - 100);
        const unicorn = new window.CVInvaders.PurpleUnicorn(this, x, -30);

        if (!this.firstUnicornShown) {
            this.firstUnicornShown = true;
            this.showAnnouncement('Catch the Purple Unicorn\nfor DOUBLE POINTS!', 2000);
        }

        const onCatch = () => {
            const points = this.scoreManager.catchUnicorn();
            this.ship.activateUnicorn();
            this.sound_engine.unicornPickup();
            this.showFloatingScore(unicorn.x, unicorn.y, points);
            unicorn.destroy();
        };

        this.physics.add.overlap(this.ship.catchZone, unicorn, onCatch, null, this);
        this.physics.add.overlap(this.ship, unicorn, onCatch, null, this);
    }

    spawnEnemies(count) {
        const CFG = window.CVInvaders.Config;

        // Spawn enemies first
        for (let i = 0; i < count; i++) {
            const x = 100 + (i * (CFG.WIDTH - 200) / (count - 1));
            const y = 60 + (i % 2) * 30;
            const enemy = new window.CVInvaders.Enemy(this, x, y);
            this.enemies.add(enemy);
        }

        // Show text after enemies have appeared
        this.time.delayedCall(500, () => {
            this.showAnnouncement(window.CVInvaders.Dialogue.ENEMIES.ENTRANCE, 3000);
        });
        this.time.delayedCall(4500, () => {
            this.showAnnouncement(window.CVInvaders.Dialogue.ENEMIES.DEFEATED, 3000);
        });
    }

    enemyFire(x, y) {
        const bullet = this.enemyBullets.getFirstDead(false);
        if (bullet) {
            bullet.fire(x, y, 200);
            this.sound_engine.enemyShoot();
        }
    }

    // ===== BOSS PHASE =====
    startBossPhase() {
        this.bossPhase = true;
        this.bossSpawnTimer = 0;
        this.bossTimeRemaining = window.CVInvaders.Config.BOSS_TIMER;

        // Intensify music for boss fight
        this.sound_engine.setMusicTempo(1.6);

        // Don't clear existing CVs — smooth transition, they keep falling

        this.showAnnouncement('INCOMING: AI BOT 9000', 2000);

        this.time.delayedCall(2500, () => {
            this.spawnBoss();
        });
    }

    spawnBoss() {
        const CFG = window.CVInvaders.Config;

        this.boss = new window.CVInvaders.Boss(this, CFG.WIDTH / 2, -60);
        this.bossGroup.add(this.boss);
        this.boss.startEntry(80);

        this.sound_engine.bossEntrance();
        this.showAnnouncement(window.CVInvaders.Dialogue.BOSS.ENTRANCE, 2500);

        // Boss health bar in HUD
        const hud = this.scene.get('HUD');
        if (hud) {
            this.time.delayedCall(2000, () => {
                if (hud && hud.showBossHealth) hud.showBossHealth(true);
            });
        }

        // Player bullets hit boss (group-to-group overlap required for Arcade physics)
        this.physics.add.overlap(this.bullets, this.bossGroup, (bullet, boss) => {
            if (!bullet.active || !boss.active || !boss.isAlive || !boss.entryComplete) return;
            bullet.recycle();
            this.scoreManager.bossHit();
            this.sound_engine.bossHit();
            boss.takeDamage();
        }, null, this);

        this.bossStartTime = this.time.now;
    }

    spawnBossBackgroundCV() {
        const cv = this.cvs.getFirstDead(false);
        if (!cv) return;

        const CFG = window.CVInvaders.Config;
        const x = Phaser.Math.Between(40, CFG.WIDTH - 40);
        const isGood = Math.random() < CFG.CV_GOOD_RATIO;
        cv.spawn(x, -30, isGood, 170, false);
    }

    bossSpawnCV(x, y, isDisguised) {
        if (this.gameOver) return;
        const cv = this.cvs.getFirstDead(false);
        if (!cv) return;

        const spreadX = x + Phaser.Math.Between(-60, 60);
        cv.spawn(spreadX, y, isDisguised, 180 + Phaser.Math.Between(0, 80), isDisguised);
    }

    bossFire(x, y) {
        if (this.gameOver) return;
        const bullet = this.enemyBullets.getFirstDead(false);
        if (bullet) {
            bullet.fire(x, y, window.CVInvaders.Config.BOSS_BULLET_SPEED);
        }
    }

    showBossDialogue(text) {
        this.showAnnouncement(text, 2500);
    }

    updateBossHealthBar(health, maxHealth) {
        const hud = this.scene.get('HUD');
        if (hud && hud.updateBossHealth) {
            hud.updateBossHealth(health / maxHealth);
        }
    }

    onBossTimeUp() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.registry.set('bossDefeated', false);

        this.sound_engine.stopMusic();
        this.sound_engine.gameOver();

        // Stop boss
        if (this.boss && this.boss.isAlive) {
            this.boss.isAlive = false;
            this.boss.body.enable = false;
        }

        this.showAnnouncement('TIME\'S UP!', 2000);

        // Clean up
        this.cvs.getChildren().forEach(cv => { if (cv.active) cv.recycle(); });
        this.enemyBullets.getChildren().forEach(b => { if (b.active) b.recycle(); });

        this.time.delayedCall(2000, () => {
            this.ship.shutdown();
            this.scene.stop('HUD');
            this.scene.stop('TutorialScene');
            this.scene.start('GameOverScene');
        });
    }

    onBossDefeated() {
        this.gameOver = true;
        const bossTime = this.time.now - this.bossStartTime;
        this.registry.set('bossTime', bossTime);
        this.registry.set('bossDefeated', true);

        this.sound_engine.stopMusic();
        this.scoreManager.bossKill(bossTime);
        this.sound_engine.bossDefeated();

        // Clean up all active CVs and boss bullets
        this.cvs.getChildren().forEach(cv => { if (cv.active) cv.recycle(); });
        this.enemyBullets.getChildren().forEach(b => { if (b.active) b.recycle(); });

        // Camera flash
        this.cameras.main.flash(500, 255, 255, 255);

        this.showAnnouncement(window.CVInvaders.Dialogue.BOSS.DEFEATED, 2500);

        this.time.delayedCall(2500, () => {
            this.ship.shutdown();
            this.scene.stop('HUD');
            this.scene.stop('TutorialScene');
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
                this.scene.start('GameOverScene');
            });
        });
    }

    // ===== EVENTS =====
    onEnemyDefeated(x, y) {
        const points = this.scoreManager.enemyKill();
        this.sound_engine.enemyDestroyed();
        this.showFloatingScore(x, y, points);

        // Show ATS lock icon
        const lock = this.add.image(x, y, 'ats-lock').setDepth(15);
        const lockText = this.add.text(x, y + 15, 'ATS\'d', {
            fontFamily: 'Courier New',
            fontSize: '10px',
            color: '#888888'
        }).setOrigin(0.5).setDepth(15);

        this.tweens.add({
            targets: [lock, lockText],
            alpha: 0,
            y: y - 30,
            duration: 1500,
            onComplete: () => {
                lock.destroy();
                lockText.destroy();
            }
        });
    }

    onGoodCVMissed() {
        if (this.tutorialPhase) return; // no penalties during tutorial
        const points = this.scoreManager.missGoodCV();
        this.sound_engine.missGoodCV();
        const hud = this.scene.get('HUD');
        if (hud && hud.showFloatingScore) {
            hud.showFloatingScore(
                window.CVInvaders.Config.WIDTH / 2,
                window.CVInvaders.Config.HEIGHT - 20,
                points
            );
        }
    }

    onBadCVReachedBottom() {
        if (this.tutorialPhase) return; // no penalties during tutorial
        const points = this.scoreManager.badCVReachesBottom();
        const hud = this.scene.get('HUD');
        if (hud && hud.showFloatingScore) {
            hud.showFloatingScore(
                window.CVInvaders.Config.WIDTH / 2,
                window.CVInvaders.Config.HEIGHT - 20,
                points
            );
        }
    }

    showFloatingScore(x, y, points) {
        const hud = this.scene.get('HUD');
        if (hud && hud.showFloatingScore) {
            hud.showFloatingScore(x, y, points);
        }
    }

    showAnnouncement(text, duration) {
        this.announcementText.setText(text);
        this.tweens.add({
            targets: this.announcementText,
            alpha: 1,
            duration: 300,
            onComplete: () => {
                this.time.delayedCall(duration, () => {
                    this.tweens.add({
                        targets: this.announcementText,
                        alpha: 0,
                        duration: 300
                    });
                });
            }
        });
    }

    onPlayerDeath() {
        this.gameOver = true;
        this.sound_engine.stopMusic();
        this.sound_engine.gameOver();

        // Stop boss if active
        if (this.boss && this.boss.isAlive) {
            this.boss.isAlive = false;
            this.boss.body.enable = false;
        }

        // Clean up
        this.cvs.getChildren().forEach(cv => { if (cv.active) cv.recycle(); });
        this.enemyBullets.getChildren().forEach(b => { if (b.active) b.recycle(); });

        this.time.delayedCall(1000, () => {
            this.ship.shutdown();
            this.scene.stop('HUD');
            this.scene.stop('TutorialScene');
            this.scene.start('GameOverScene');
        });
    }

    shutdown() {
        if (this.tutorialSpawnTimer) {
            this.tutorialSpawnTimer.remove();
            this.tutorialSpawnTimer = null;
        }
    }

    stopStarfield() {
        this.scene.stop('TutorialScene');
    }
};
