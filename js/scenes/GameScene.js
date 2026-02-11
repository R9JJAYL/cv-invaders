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
        this.bossSpawned = false;
        this.bossStartTime = 0;
        this.bossTimeRemaining = 0;

        // Countdown covers all gameplay before boss (tutorial + waves)
        const CFG = window.CVInvaders.Config;
        const waveDuration = CFG.WAVES.reduce((sum, w) => sum + w.duration, 0);
        this.gameTimeRemaining = waveDuration + 7000; // waves + 7s tutorial practice
        this.gameCountdownActive = false;
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

        // Allow camera to pan upward for boss reveal
        this.cameras.main.setBounds(0, -300, CFG.WIDTH, CFG.HEIGHT + 300);

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

        // Announcement text — fixed to screen (scroll-independent)
        this.announcementBg = this.add.graphics().setDepth(49).setAlpha(0).setScrollFactor(0);
        this.announcementText = this.add.text(CFG.WIDTH / 2, CFG.HEIGHT * 0.75, '', {
            fontFamily: 'Roboto',
            fontSize: '24px',
            color: '#FFFFFF',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5).setDepth(50).setAlpha(0).setScrollFactor(0);

        // Press S to skip tutorial intro and jump to Wave 1
        this.input.keyboard.on('keydown-S', () => {
            if (this.tutorialPhase && !this.gameOver) {
                this.skipTutorial();
            }
        });

        // Press B to skip straight to boss fight (debug)
        this.input.keyboard.on('keydown-B', () => {
            if (!this.bossPhase && !this.gameOver) {
                // If still in tutorial, clean that up first
                if (this.tutorialPhase) {
                    if (this.tutorialSpawnTimer) {
                        this.tutorialSpawnTimer.remove();
                        this.tutorialSpawnTimer = null;
                    }
                    if (this.skipHint) { this.skipHint.destroy(); this.skipHint = null; }
                    this.tutorialPhase = false;
                    this.tutorialComplete = true;
                }
                // Cancel all pending timers (tutorial, wave announcements, etc.)
                this.time.removeAllEvents();
                // Clear any active CVs and enemies
                this.cvs.getChildren().forEach(cv => { if (cv.active) cv.recycle(); });
                this.enemies.getChildren().forEach(e => { if (e.active) e.destroy(); });
                // Clear announcement
                this.announcementText.setAlpha(0);
                this.waveManager.active = false;
                // Reset score and go straight to boss
                this.scoreManager.score = 0;
                this.scoreManager.combo = 0;
                this.scoreManager.maxCombo = 0;
                this.scoreManager.goodCVsCaught = 0;
                this.scoreManager.goodCVsMissed = 0;
                this.scoreManager.badCVsShot = 0;
                this.scoreManager.badCVsMissed = 0;
                this.registry.set('score', 0);
                this.bossPhase = true;
                this.bossSpawned = true;
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
            ? 'Press < > to move\nTap left side to shoot'
            : 'Use ← → to move, SPACE to shoot';
        this.showAnnouncement(moveHint, 3000);


        // Start countdown immediately
        this.gameCountdownActive = true;

        // Start spawning tutorial CVs right away
        this.time.delayedCall(600, () => {
            this.tutorialSpawnTimer = this.time.addEvent({
                delay: 1200,
                callback: () => this.spawnTutorialCV(),
                loop: true
            });
        });

        // After brief practice, transition to Wave 1
        this.time.delayedCall(7000, () => {
            this.endTutorial();
        });
    }

    skipTutorial() {
        // Stop tutorial spawning
        if (this.tutorialSpawnTimer) {
            this.tutorialSpawnTimer.remove();
            this.tutorialSpawnTimer = null;
        }
        // Cancel all pending tutorial timers
        this.time.removeAllEvents();
        // Clear any active CVs
        this.cvs.getChildren().forEach(cv => { if (cv.active) cv.recycle(); });
        // Clear announcement
        this.announcementText.setAlpha(0);
        // Remove skip hint
        if (this.skipHint) { this.skipHint.destroy(); this.skipHint = null; }
        // Reset score and start Wave 1
        this.tutorialPhase = false;
        this.tutorialComplete = true;
        this.scoreManager.score = 0;
        this.scoreManager.combo = 0;
        this.scoreManager.maxCombo = 0;
        this.scoreManager.goodCVsCaught = 0;
        this.scoreManager.goodCVsMissed = 0;
        this.scoreManager.badCVsShot = 0;
        this.scoreManager.badCVsMissed = 0;
        this.registry.set('score', 0);
        this.waveManager.startWave(0);
        this.gameCountdownActive = true;
    }

    spawnTutorialCV() {
        const cv = this.cvs.getFirstDead(false);
        if (!cv) return;

        const CFG = window.CVInvaders.Config;
        const x = Phaser.Math.Between(60, CFG.WIDTH - 60);
        const isGood = Math.random() < 0.4; // slightly more good CVs in tutorial

        cv.spawn(x, -30, isGood, 130, false);
    }

    endTutorial() {
        // Stop spawning tutorial CVs
        if (this.tutorialSpawnTimer) {
            this.tutorialSpawnTimer.remove();
            this.tutorialSpawnTimer = null;
        }

        if (this.skipHint) { this.skipHint.destroy(); this.skipHint = null; }
        this.tutorialPhase = false;
        this.tutorialComplete = true;
        this.scoreManager.score = 0;
        this.scoreManager.combo = 0;
        this.scoreManager.maxCombo = 0;
        this.scoreManager.goodCVsCaught = 0;
        this.scoreManager.goodCVsMissed = 0;
        this.scoreManager.badCVsShot = 0;
        this.scoreManager.badCVsMissed = 0;
        this.registry.set('score', 0);
        this.waveManager.startWave(0);
        this.gameCountdownActive = true;
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
            this.spawnHitMarker(bullet.x, bullet.y);
            bullet.recycle();
            enemy.takeDamage();
        }, null, this);
    }

    // ===== UPDATE LOOP =====
    update(time, delta) {
        if (this.gameOver) return;

        // Fire when shoot is pressed — blocked during boss entry/grace period
        const canShoot = !(this.bossPhase && !this.bossSpawned);
        if (canShoot && this.ship.shootPressed && this.ship.fireBullet(time)) {
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

        // Keep CVs falling during boss phase — only after boss has spawned
        if (this.bossPhase && this.bossSpawned && !this.gameOver) {
            this.bossSpawnTimer += delta;
            if (this.bossSpawnTimer >= 1400) {
                this.bossSpawnTimer = 0;
                const activeCVs = this.cvs.countActive(true);
                if (activeCVs < 6) {
                    this.spawnBossBackgroundCV();
                }
            }
        }

        // Wave countdown — only ticks during wave gameplay, stops at boss phase
        if (this.gameCountdownActive && !this.bossPhase && !this.gameOver) {
            this.gameTimeRemaining -= delta;
            if (this.gameTimeRemaining < 0) this.gameTimeRemaining = 0;
        }

        // Boss timer — separate, ticks only after boss has spawned
        if (this.bossPhase && this.bossSpawned && !this.gameOver) {
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
            if (this.bossPhase && this.bossSpawned && !this.gameOver) {
                hud.updateCountdown(this.bossTimeRemaining);
            } else if (this.gameCountdownActive && !this.bossPhase) {
                hud.updateCountdown(this.gameTimeRemaining);
            }
        }
    }

    // ===== CV SPAWNING =====
    spawnCV(wave, overrideFallSpeed) {
        const cv = this.cvs.getFirstDead(false);
        if (!cv) return;

        const CFG = window.CVInvaders.Config;
        const x = Phaser.Math.Between(40, CFG.WIDTH - 40);
        const isGood = Math.random() < CFG.CV_GOOD_RATIO;

        cv.spawn(x, -30, isGood, overrideFallSpeed || wave.fallSpeed, false);
    }

    spawnUnicorn() {
        const CFG = window.CVInvaders.Config;
        const x = Phaser.Math.Between(100, CFG.WIDTH - 100);
        const unicorn = new window.CVInvaders.PurpleUnicorn(this, x, -30);

        if (!this.firstUnicornShown) {
            this.firstUnicornShown = true;
            this.showAnnouncement(window.CVInvaders.Dialogue.UNICORN.CAUGHT, 2000);
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

        // Spawn enemies in a row
        for (let i = 0; i < count; i++) {
            const x = 100 + (i * (CFG.WIDTH - 200) / (count - 1));
            const y = 60 + (i % 2) * 30;
            const enemy = new window.CVInvaders.Enemy(this, x, y);
            this.enemies.add(enemy);
        }

        // Show text after enemies have appeared
        this.time.delayedCall(500, () => {
            this.showAnnouncement(window.CVInvaders.Dialogue.ENEMIES.ENTRANCE, 3500);
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
        this.bossSpawned = false;
        this.bossSpawnTimer = 0;
        this.bossTimeRemaining = window.CVInvaders.Config.BOSS_TIMER;

        // Hide the wave countdown
        const hud = this.scene.get('HUD');
        if (hud) hud.hideCountdown();

        const DLG = window.CVInvaders.Dialogue;

        // --- Timeline ---
        // 0.5s: CV burst animation (clear screen)
        // 2.0s: "Uh oh... hiring manager threw out all the CVs!" (2.5s)
        // 5.0s: Boss entry starts (flies down over 2s, 1s grace = vulnerable at 8s)
        //        "We readvertised the job but we're being attacked by bots. Stop them!"
        // 7.0s: Health bar appears
        // 8.0s: Boss vulnerable, timer + background CVs start

        // 0.5s — CV burst animation (clear screen of enemies/CVs)
        this.time.delayedCall(500, () => {
            // Sweep any surviving enemies
            this.enemies.getChildren().forEach(enemy => {
                if (enemy.active && enemy.isAlive) {
                    enemy.isAlive = false;
                    enemy.body.enable = false;
                    this.tweens.add({
                        targets: enemy,
                        x: enemy.x + Phaser.Math.Between(-350, 350),
                        y: -80 + Phaser.Math.Between(-60, 0),
                        angle: Phaser.Math.Between(-540, 540),
                        alpha: 0,
                        scaleX: 0.3,
                        scaleY: 0.3,
                        duration: 900,
                        ease: 'Power2',
                        onComplete: () => enemy.destroy()
                    });
                }
            });

            // Sweep any CVs still on screen
            this.cvs.getChildren().forEach(cv => {
                if (cv.active) {
                    this.tweens.add({
                        targets: cv,
                        x: cv.x + Phaser.Math.Between(-350, 350),
                        y: -80 + Phaser.Math.Between(-40, 0),
                        angle: Phaser.Math.Between(-360, 360),
                        alpha: 0,
                        scaleX: 0.3,
                        scaleY: 0.3,
                        duration: 900,
                        ease: 'Power2',
                        onComplete: () => cv.recycle()
                    });
                }
            });

            // Fake CV burst explosion from ship
            var shipX = this.ship.x;
            var shipY = this.ship.y;
            var burstCount = 20;
            for (var i = 0; i < burstCount; i++) {
                var tex = Math.random() < 0.5 ? 'cv-good' : 'cv-bad';
                var fakeCv = this.add.image(shipX, shipY, tex).setDepth(15);
                var angle = (i / burstCount) * Math.PI * 2;
                var dist = Phaser.Math.Between(150, 400);
                var targetX = shipX + Math.cos(angle) * dist;
                var targetY = shipY + Math.sin(angle) * dist * 0.7 - 80;
                var delay = Phaser.Math.Between(0, 200);
                fakeCv.setScale(Phaser.Math.FloatBetween(0.8, 1.3));
                this.tweens.add({
                    targets: fakeCv,
                    x: targetX,
                    y: targetY,
                    angle: Phaser.Math.Between(-540, 540),
                    alpha: 0,
                    scaleX: 0.2,
                    scaleY: 0.2,
                    duration: 1200,
                    delay: delay,
                    ease: 'Power2',
                    onComplete: () => fakeCv.destroy()
                });
            }

            // Clear enemy bullets
            this.enemyBullets.getChildren().forEach(b => { if (b.active) b.recycle(); });

            // Camera shake
            this.cameras.main.shake(400, 0.012);
        });

        // 2s — hiring manager threw out all the CVs
        this.time.delayedCall(2000, () => {
            this.sound_engine.setMusicTempo(1.6);
            this.showAnnouncement(DLG.HIRING_MANAGER.THREW_OUT, 2500);
        });

        // 5s — boss starts flying in
        this.time.delayedCall(5000, () => {
            this.spawnBoss();
        });
    }

    spawnBoss() {
        const CFG = window.CVInvaders.Config;
        const DLG = window.CVInvaders.Dialogue;

        // Place boss above screen in the camera's extended bounds
        this.boss = new window.CVInvaders.Boss(this, CFG.WIDTH / 2, -180);
        this.bossGroup.add(this.boss);
        this.boss.setAlpha(1);

        this.sound_engine.bossEntrance();

        // --- Camera pan reveal (similar to tutorial ATS reveal) ---

        // 1. Pan camera UP to reveal the boss
        this.cameras.main.pan(
            CFG.WIDTH / 2,
            -150,
            1200,
            'Power2'
        );

        // 2. Show boss entrance text while camera is up
        this.time.delayedCall(1200, () => {
            this.showAnnouncement(DLG.BOSS.ENTRANCE, 2500);
        });

        // 3. After showing text, pan camera back down WITH the boss
        this.time.delayedCall(4000, () => {
            const panDuration = 2000;

            // Pan camera back to normal
            this.cameras.main.pan(
                CFG.WIDTH / 2,
                CFG.HEIGHT / 2,
                panDuration,
                'Power2'
            );

            // Boss moves down in sync with camera — from its current position
            // to gameplay y, matching the pan duration so they travel together
            this.boss.startEntry(80, panDuration);

            // Slide ship to center so it looks clean when camera returns
            this.ship.setVelocityX(0);
            this.tweens.add({
                targets: this.ship,
                x: CFG.WIDTH / 2,
                duration: panDuration,
                ease: 'Power2'
            });

            // Show health bar after boss has landed + grace period
            const hud = this.scene.get('HUD');
            if (hud) {
                this.time.delayedCall(panDuration + 1500, () => {
                    if (hud && hud.showBossHealth) hud.showBossHealth(true);
                });
            }
        });

        // Wait for boss entry to complete before enabling combat
        this.bossStartTime = this.time.now;

        const waitForEntry = this.time.addEvent({
            delay: 100,
            loop: true,
            callback: () => {
                if (this.boss && this.boss.entryComplete) {
                    waitForEntry.remove();

                    // NOW the fight begins — start timer and background CVs
                    this.bossSpawned = true;
                    this.bossTimeRemaining = CFG.BOSS_TIMER;

                    // Enable bullet-boss collision
                    this.physics.add.overlap(this.bullets, this.bossGroup, (bullet, boss) => {
                        if (!bullet.active || !boss.active || !boss.isAlive) return;
                        this.spawnHitMarker(bullet.x, bullet.y, true);
                        bullet.recycle();
                        this.scoreManager.bossHit();
                        this.sound_engine.bossHit();
                        boss.takeDamage();
                    }, (bullet, boss) => {
                        return bullet.active && boss.active && boss.isAlive && boss.entryComplete;
                    }, this);
                }
            }
        });
    }

    spawnBossBackgroundCV() {
        const cv = this.cvs.getFirstDead(false);
        if (!cv) return;

        const CFG = window.CVInvaders.Config;
        const x = Phaser.Math.Between(40, CFG.WIDTH - 40);
        // Boss phase only drops red (bad) CVs — the good ones were thrown out
        cv.spawn(x, -30, false, 170, false);
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

        this.showAnnouncement('Time\'s up!\nThe bot lives to see another day', 2000);

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
            fontFamily: 'Roboto',
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

    spawnHitMarker(x, y, isBoss) {
        const len = isBoss ? 14 : 10;
        const gap = isBoss ? 5 : 4;
        const thick = 2;
        const color = 0xFFFFFF;
        const lines = [];

        // 4 lines forming an X centred on the hit target (CoD style)
        const offsets = [
            { x1: -gap, y1: -gap, x2: -gap - len, y2: -gap - len },
            { x1: gap, y1: -gap, x2: gap + len, y2: -gap - len },
            { x1: -gap, y1: gap, x2: -gap - len, y2: gap + len },
            { x1: gap, y1: gap, x2: gap + len, y2: gap + len }
        ];

        for (const o of offsets) {
            const g = this.add.graphics().setDepth(100);
            g.lineStyle(thick, color, 1);
            g.beginPath();
            g.moveTo(x + o.x1, y + o.y1);
            g.lineTo(x + o.x2, y + o.y2);
            g.strokePath();
            lines.push(g);
        }

        // Flash and fade out
        this.tweens.add({
            targets: lines,
            alpha: 0,
            duration: 150,
            delay: 50,
            onComplete: () => lines.forEach(l => l.destroy())
        });
    }

    showFloatingScore(x, y, points) {
        const hud = this.scene.get('HUD');
        if (hud && hud.showFloatingScore) {
            hud.showFloatingScore(x, y, points);
        }
    }

    showAnnouncement(text, duration) {
        const CFG = window.CVInvaders.Config;
        this.announcementText.setText(text);

        // Measure text and draw background pill (use text dimensions directly
        // since both text and bg have scrollFactor=0, i.e. screen-fixed)
        const padX = 24;
        const padY = 14;
        const bgW = this.announcementText.width + padX * 2;
        const bgH = this.announcementText.height + padY * 2;
        const bgX = CFG.WIDTH / 2 - bgW / 2;
        const bgY = this.announcementText.y - this.announcementText.height * 0.5 - padY;

        this.announcementBg.clear();
        this.announcementBg.fillStyle(0x000000, 0.65);
        this.announcementBg.fillRoundedRect(bgX, bgY, bgW, bgH, 12);
        this.announcementBg.lineStyle(1, 0x6B3FA0, 0.5);
        this.announcementBg.strokeRoundedRect(bgX, bgY, bgW, bgH, 12);

        this.tweens.add({
            targets: [this.announcementText, this.announcementBg],
            alpha: 1,
            duration: 300,
            onComplete: () => {
                this.time.delayedCall(duration, () => {
                    this.tweens.add({
                        targets: [this.announcementText, this.announcementBg],
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
