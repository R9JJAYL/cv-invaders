window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.BossScene = class BossScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BossScene' });
    }

    init() {
        this.gameOver = false;
        this.bossStartTime = 0;
    }

    create() {
        const CFG = window.CVInvaders.Config;

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

        // Starfield
        this.stars = [];
        for (let i = 0; i < 60; i++) {
            const star = this.add.image(
                Phaser.Math.Between(0, CFG.WIDTH),
                Phaser.Math.Between(0, CFG.HEIGHT),
                'star'
            ).setAlpha(Phaser.Math.FloatBetween(0.2, 0.8)).setDepth(0);
            this.stars.push({ sprite: star, speed: Phaser.Math.Between(20, 60) });
        }

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

        // Boss CV pool (for spam attack)
        this.cvs = this.physics.add.group({
            classType: window.CVInvaders.CV,
            maxSize: 20,
            runChildUpdate: false
        });
        for (let i = 0; i < 20; i++) {
            const cv = new window.CVInvaders.CV(this, 0, 0);
            this.cvs.add(cv, true);
            cv.setActive(false).setVisible(false);
            cv.body.enable = false;
        }

        // Boss bullet pool
        this.bossBullets = this.physics.add.group({
            classType: window.CVInvaders.EnemyBullet,
            maxSize: 15,
            runChildUpdate: false
        });
        for (let i = 0; i < 15; i++) {
            const eb = new window.CVInvaders.EnemyBullet(this, 0, 0);
            this.bossBullets.add(eb, true);
            eb.setActive(false).setVisible(false);
            eb.body.enable = false;
        }

        // Score manager (continues from game scene)
        this.scoreManager = new window.CVInvaders.ScoreManager(this);
        this.scoreManager.score = this.registry.get('score') || 0;
        this.scoreManager.goodCVsCaught = this.registry.get('goodCVsCaught') || 0;
        this.scoreManager.badCVsShot = this.registry.get('badCVsShot') || 0;
        this.scoreManager.enemiesDefeated = this.registry.get('enemiesDefeated') || 0;
        this.scoreManager.maxCombo = this.registry.get('maxCombo') || 0;

        // Launch HUD
        this.scene.launch('HUD');

        // Setup collisions
        this.setupCollisions();

        // Announcement text
        this.announcementText = this.add.text(CFG.WIDTH / 2, CFG.HEIGHT * 0.75, '', {
            fontFamily: 'Courier New',
            fontSize: '22px',
            color: CFG.COLORS.PURPLE_ACCENT_HEX,
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 600 }
        }).setOrigin(0.5).setDepth(50).setAlpha(0);

        // Start music at boss tempo
        this.sound_engine.startMusic();
        this.sound_engine.setMusicTempo(1.6);

        // Fade in and spawn boss
        this.cameras.main.fadeIn(500);
        this.time.delayedCall(1000, () => this.spawnBoss());
    }

    setupCollisions() {
        // Player bullets hit boss
        // (setup after boss spawns)

        // Player bullets hit boss CVs
        this.physics.add.overlap(this.bullets, this.cvs, (bullet, cv) => {
            if (!cv.active || !bullet.active) return;
            if (cv.isGood && !cv.isDisguised) return;

            bullet.recycle();
            this.scoreManager.shootBadCV();
            this.sound_engine.hitBadCV();
            cv.recycle();
        }, null, this);

        // Good/disguised CVs hit catch zone
        this.physics.add.overlap(this.ship.catchZone, this.cvs, (zone, cv) => {
            if (!cv.active) return;

            if (cv.isGood && !cv.isDisguised) {
                this.scoreManager.catchGoodCV();
                this.sound_engine.catchGoodCV();
                cv.recycle();
            } else if (cv.isDisguised) {
                this.scoreManager.caughtDisguisedCV();
                this.sound_engine.playerHit();
                this.ship.takeDamage();
                cv.recycle();
            }
        }, null, this);

        // Bad CVs hit ship
        this.physics.add.overlap(this.ship, this.cvs, (ship, cv) => {
            if (!cv.active || !this.ship.isAlive || this.ship.invincible) return;
            if (cv.isGood && !cv.isDisguised) return;

            this.scoreManager.badCVHitsPlayer();
            this.sound_engine.playerHit();
            this.ship.takeDamage();
            cv.recycle();
        }, null, this);

        // Boss bullets hit player
        this.physics.add.overlap(this.ship, this.bossBullets, (ship, bullet) => {
            if (!bullet.active || !this.ship.isAlive || this.ship.invincible) return;
            bullet.recycle();
            const points = this.scoreManager.badCVHitsPlayer();
            this.sound_engine.playerHit();
            const hud = this.scene.get('HUD');
            if (hud && hud.showFloatingScore) hud.showFloatingScore(this.ship.x, this.ship.y, points);
            this.ship.takeDamage();
        }, null, this);
    }

    spawnBoss() {
        const CFG = window.CVInvaders.Config;

        this.boss = new window.CVInvaders.Boss(this, CFG.WIDTH / 2, -60);
        this.boss.startEntry(80);

        this.sound_engine.bossEntrance();
        this.showBossDialogue(window.CVInvaders.Dialogue.BOSS.ENTRANCE);

        // Boss health bar in HUD
        const hud = this.scene.get('HUD');
        if (hud) {
            if (hud.countdownText) hud.countdownText.setText('BOSS FIGHT');
            this.time.delayedCall(2000, () => {
                if (hud && hud.showBossHealth) hud.showBossHealth(true);
            });
        }

        // Player bullets hit boss — delay collider until entry animation finishes
        this.bossStartTime = this.time.now;

        const waitForEntry = this.time.addEvent({
            delay: 100,
            loop: true,
            callback: () => {
                if (this.boss && this.boss.entryComplete) {
                    waitForEntry.remove();
                    this.physics.add.overlap(this.bullets, this.boss, (bullet, boss) => {
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

    bossSpawnCV(x, y, isDisguised) {
        if (this.gameOver) return;
        const cv = this.cvs.getFirstDead(false);
        if (!cv) return;

        const spreadX = x + Phaser.Math.Between(-60, 60);
        cv.spawn(spreadX, y, isDisguised, 160 + Phaser.Math.Between(0, 30), isDisguised);
    }

    bossFire(x, y) {
        if (this.gameOver) return;
        const bullet = this.bossBullets.getFirstDead(false);
        if (bullet) {
            bullet.fire(x, y, window.CVInvaders.Config.BOSS_BULLET_SPEED);
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

    showBossDialogue(text) {
        this.announcementText.setText(text);
        this.tweens.add({
            targets: this.announcementText,
            alpha: 1,
            duration: 300,
            onComplete: () => {
                this.time.delayedCall(2500, () => {
                    this.tweens.add({
                        targets: this.announcementText,
                        alpha: 0,
                        duration: 300
                    });
                });
            }
        });
    }

    updateBossHealthBar(health, maxHealth) {
        const hud = this.scene.get('HUD');
        if (hud && hud.updateBossHealth) {
            hud.updateBossHealth(health / maxHealth);
        }
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
        this.bossBullets.getChildren().forEach(b => { if (b.active) b.recycle(); });

        // Camera flash
        this.cameras.main.flash(500, 255, 255, 255);

        this.showBossDialogue(window.CVInvaders.Dialogue.BOSS.DEFEATED);

        this.time.delayedCall(2500, () => {
            this.ship.shutdown();
            this.scene.stop('HUD');
            this.cameras.main.fadeOut(500);
            this.time.delayedCall(500, () => {
                this.scene.start('GameOverScene');
            });
        });
    }

    onGoodCVMissed() {
        // No penalty during boss fight — CVs are boss spam
    }

    onBadCVReachedBottom() {
        // No penalty during boss fight — CVs are boss spam
    }

    onPlayerDeath() {
        this.gameOver = true;
        this.sound_engine.stopMusic();
        this.sound_engine.gameOver();

        // Stop boss from continuing to act
        if (this.boss && this.boss.isAlive) {
            this.boss.isAlive = false;
            this.boss.body.enable = false;
        }

        // Clean up all active CVs and boss bullets
        this.cvs.getChildren().forEach(cv => { if (cv.active) cv.recycle(); });
        this.bossBullets.getChildren().forEach(b => { if (b.active) b.recycle(); });

        this.time.delayedCall(1000, () => {
            this.ship.shutdown();
            this.scene.stop('HUD');
            this.scene.start('GameOverScene');
        });
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Starfield
        this.stars.forEach(s => {
            s.sprite.y += s.speed * delta / 1000;
            if (s.sprite.y > 620) s.sprite.y = -10;
        });

        // Auto-fire
        if (this.ship.fireBullet(time)) {
            const bullet = this.bullets.getFirstDead(false);
            if (bullet) {
                bullet.fire(this.ship.x, this.ship.y - 30);
                this.sound_engine.shoot();
            }
        }

        // Update HUD combo
        const hud = this.scene.get('HUD');
        if (hud && hud.updateCombo) {
            hud.updateCombo(this.scoreManager.combo);
        }
    }

    shutdown() {
        this.stars = [];
    }
};
