window.CVInvaders = window.CVInvaders || {};

window.CVInvaders.BootScene = class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.load.image('first-logo', 'assets/first-logo-white.png');
        this.load.image('first-logo-small', 'assets/first-logo-small.png');
    }

    create() {
        const CFG = window.CVInvaders.Config;

        this.generateShipTexture(CFG);
        this.generateCVTextures(CFG);
        this.generateBulletTextures(CFG);
        this.generateEnemyTexture(CFG);
        this.generateBossTexture(CFG);
        this.generateUnicornTexture(CFG);
        this.generateParticleTextures();
        this.generateUITextures(CFG);
        this.generateATSTexture(CFG);

        this.registry.set('playerName', '');
        this.registry.set('score', 0);
        this.registry.set('health', CFG.PLAYER_HEALTH);
        this.registry.set('wave', 0);
        this.registry.set('bossDefeated', false);
        this.registry.set('goodCVsCaught', 0);
        this.registry.set('badCVsShot', 0);
        this.registry.set('enemiesDefeated', 0);
        this.registry.set('maxCombo', 0);
        this.registry.set('bossTime', 0);

        // Wait for Google Font to load before showing menu
        document.fonts.load('16px "Press Start 2P"').then(() => {
            this.scene.start('MenuScene');
        }).catch(() => {
            // Fallback — start anyway after timeout
            this.scene.start('MenuScene');
        });
        // Safety timeout in case fonts API hangs
        this.time.delayedCall(3000, () => {
            if (this.scene.isActive('BootScene')) {
                this.scene.start('MenuScene');
            }
        });
    }

    generateShipTexture(CFG) {
        const W = 100;
        const H = 46;
        const cx = W / 2; // 50
        const g = this.add.graphics();

        // === Retro stealth bomber (B-2 flying wing) ===

        // Engine glow (twin exhausts at rear centre)
        g.fillStyle(0x00E5FF, 0.5);
        g.fillRect(cx - 13, H - 4, 8, 3);
        g.fillRect(cx + 5, H - 4, 8, 3);

        // Main flying-wing body — wide flat chevron shape
        g.fillStyle(CFG.COLORS.PURPLE_LIGHT, 1);
        g.beginPath();
        g.moveTo(cx, 4);          // nose tip
        g.lineTo(2, H - 8);       // left wing tip
        g.lineTo(15, H - 4);      // left wing trailing edge
        g.lineTo(cx - 8, H - 10); // left inner notch
        g.lineTo(cx, H - 6);      // centre rear
        g.lineTo(cx + 8, H - 10); // right inner notch
        g.lineTo(W - 15, H - 4);  // right wing trailing edge
        g.lineTo(W - 2, H - 8);   // right wing tip
        g.closePath();
        g.fillPath();

        // Darker centre fuselage stripe
        g.fillStyle(CFG.COLORS.PURPLE_PRIMARY, 0.8);
        g.beginPath();
        g.moveTo(cx, 4);
        g.lineTo(cx - 15, H - 10);
        g.lineTo(cx - 8, H - 10);
        g.lineTo(cx, H - 6);
        g.lineTo(cx + 8, H - 10);
        g.lineTo(cx + 15, H - 10);
        g.closePath();
        g.fillPath();

        // Wing edge highlights
        g.lineStyle(1, CFG.COLORS.PURPLE_GLOW, 0.5);
        g.beginPath();
        g.moveTo(cx, 4);
        g.lineTo(2, H - 8);
        g.strokePath();
        g.beginPath();
        g.moveTo(cx, 4);
        g.lineTo(W - 2, H - 8);
        g.strokePath();

        // Cockpit window
        g.fillStyle(0x00E5FF, 0.4);
        g.fillEllipse(cx, 15, 7, 4);

        // Catch tray (sensor bar along leading edge)
        g.fillStyle(CFG.COLORS.PURPLE_GLOW, 0.6);
        g.beginPath();
        g.moveTo(cx - 3, 7);
        g.lineTo(10, H - 14);
        g.lineTo(12, H - 12);
        g.lineTo(cx - 1, 9);
        g.closePath();
        g.fillPath();
        g.beginPath();
        g.moveTo(cx + 3, 7);
        g.lineTo(W - 10, H - 14);
        g.lineTo(W - 12, H - 12);
        g.lineTo(cx + 1, 9);
        g.closePath();
        g.fillPath();

        g.generateTexture('ship-base', W, H);
        g.destroy();

        // Composite First logo onto the centre fuselage
        const baseTex = this.textures.get('ship-base');
        const baseImg = baseTex.getSourceImage();
        const logoImg = this.textures.get('first-logo').getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(baseImg, 0, 0);
        const logoW = 30;
        const logoH = logoW * (logoImg.height / logoImg.width);
        const logoY = 28;
        ctx.globalAlpha = 0.55;
        ctx.drawImage(logoImg, cx - logoW / 2, logoY - logoH / 2, logoW, logoH);
        ctx.globalAlpha = 1;
        this.textures.addCanvas('ship', canvas);
    }

    generateCVTextures(CFG) {
        // Good CV
        const good = this.add.graphics();
        good.fillStyle(CFG.COLORS.CV_GOOD, 1);
        good.fillRoundedRect(0, 0, 30, 40, 3);
        // Dog-ear fold
        good.fillStyle(0x2EBD5E, 1);
        good.beginPath();
        good.moveTo(22, 0);
        good.lineTo(30, 0);
        good.lineTo(30, 8);
        good.closePath();
        good.fillPath();
        // Text lines
        good.fillStyle(0x38A865, 0.6);
        good.fillRect(4, 12, 18, 2);
        good.fillRect(4, 18, 22, 2);
        good.fillRect(4, 24, 16, 2);
        good.fillRect(4, 30, 20, 2);
        good.generateTexture('cv-good', 30, 40);
        good.destroy();

        // Bad CV
        const bad = this.add.graphics();
        bad.fillStyle(CFG.COLORS.CV_BAD, 1);
        bad.fillRoundedRect(0, 0, 30, 40, 3);
        bad.fillStyle(0xE06B6B, 1);
        bad.beginPath();
        bad.moveTo(22, 0);
        bad.lineTo(30, 0);
        bad.lineTo(30, 8);
        bad.closePath();
        bad.fillPath();
        bad.fillStyle(0xCC5555, 0.6);
        bad.fillRect(4, 12, 18, 2);
        bad.fillRect(4, 18, 22, 2);
        bad.fillRect(4, 24, 16, 2);
        bad.fillRect(4, 30, 20, 2);
        bad.generateTexture('cv-bad', 30, 40);
        bad.destroy();
    }

    generateBulletTextures(CFG) {
        // Player bullet
        const b = this.add.graphics();
        b.fillStyle(CFG.COLORS.BULLET, 1);
        b.fillRect(0, 0, 4, 12);
        b.fillStyle(0xFFFFFF, 0.5);
        b.fillRect(1, 0, 2, 4);
        b.generateTexture('bullet', 4, 12);
        b.destroy();

        // Enemy bullet
        const eb = this.add.graphics();
        eb.fillStyle(0xFF4444, 1);
        eb.fillRect(0, 0, 4, 8);
        eb.generateTexture('enemy-bullet', 4, 8);
        eb.destroy();

        // Boss bullet
        const bb = this.add.graphics();
        bb.fillStyle(0xFF0000, 1);
        bb.fillRect(0, 0, 6, 10);
        bb.fillStyle(0xFF6666, 0.6);
        bb.fillRect(2, 0, 2, 4);
        bb.generateTexture('boss-bullet', 6, 10);
        bb.destroy();
    }

    generateEnemyTexture(CFG) {
        const g = this.add.graphics();

        // Engine glow (top, since ship points down)
        g.fillStyle(0xFF6644, 0.6);
        g.fillRect(15, 2, 10, 3);

        // Hull body
        g.fillStyle(CFG.COLORS.ENEMY, 1);
        g.fillRect(7, 6, 26, 14);

        // Nose cone pointing DOWN (inverted triangle)
        g.fillStyle(0xAA2222, 1);
        g.beginPath();
        g.moveTo(20, 36);
        g.lineTo(7, 20);
        g.lineTo(33, 20);
        g.closePath();
        g.fillPath();

        // Wings pointing down
        g.fillStyle(0xAA2222, 0.9);
        g.beginPath();
        g.moveTo(0, 8);
        g.lineTo(7, 20);
        g.lineTo(7, 6);
        g.closePath();
        g.fillPath();
        g.beginPath();
        g.moveTo(40, 8);
        g.lineTo(33, 20);
        g.lineTo(33, 6);
        g.closePath();
        g.fillPath();

        // Cockpit window
        g.fillStyle(0xFF4444, 0.5);
        g.fillCircle(20, 14, 4);

        g.generateTexture('enemy', 40, 38);
        g.destroy();
    }

    generateBossTexture(CFG) {
        const g = this.add.graphics();

        // Body
        g.fillStyle(0x4A4A5A, 1);
        g.fillRoundedRect(10, 15, 60, 40, 5);

        // Head
        g.fillStyle(CFG.COLORS.BOSS, 1);
        g.fillRoundedRect(15, 5, 50, 35, 8);

        // Antenna
        g.lineStyle(3, 0x888888, 1);
        g.beginPath();
        g.moveTo(40, 5);
        g.lineTo(40, 0);
        g.strokePath();
        g.fillStyle(0xFF0000, 1);
        g.fillCircle(40, 0, 3);

        // Eyes (red, menacing)
        g.fillStyle(0xFF0000, 1);
        g.fillCircle(30, 20, 5);
        g.fillCircle(50, 20, 5);
        // Pupils
        g.fillStyle(0x000000, 1);
        g.fillCircle(31, 20, 2);
        g.fillCircle(51, 20, 2);

        // Mouth (screen with text lines)
        g.fillStyle(0x2C3E50, 1);
        g.fillRect(25, 28, 30, 8);
        g.fillStyle(0x00FF00, 0.6);
        g.fillRect(27, 30, 10, 1);
        g.fillRect(27, 33, 14, 1);

        // Arms
        g.fillStyle(0x888888, 1);
        g.fillRect(5, 25, 8, 4);
        g.fillRect(67, 25, 8, 4);

        g.generateTexture('boss', 80, 55);
        g.destroy();
    }

    generateUnicornTexture(CFG) {
        const g = this.add.graphics();
        // Canvas: 40x44 — cute front-facing unicorn with glowing aura

        // Outer glow aura
        g.fillStyle(0xBB8FCE, 0.15);
        g.fillCircle(20, 24, 20);
        g.fillStyle(0xD4A8E8, 0.1);
        g.fillCircle(20, 24, 16);

        // Body (rounded, front-facing)
        g.fillStyle(0xC77DFF, 1);
        g.fillRoundedRect(10, 20, 20, 18, 6);

        // Head (large, friendly)
        g.fillStyle(0xD9A8F0, 1);
        g.fillCircle(20, 16, 10);

        // Ears
        g.fillStyle(0xD9A8F0, 1);
        g.beginPath();
        g.moveTo(12, 10);
        g.lineTo(10, 2);
        g.lineTo(16, 8);
        g.closePath();
        g.fillPath();
        g.beginPath();
        g.moveTo(28, 10);
        g.lineTo(30, 2);
        g.lineTo(24, 8);
        g.closePath();
        g.fillPath();

        // Inner ears
        g.fillStyle(0xE8C5F5, 0.6);
        g.beginPath();
        g.moveTo(13, 9);
        g.lineTo(11, 4);
        g.lineTo(15, 8);
        g.closePath();
        g.fillPath();
        g.beginPath();
        g.moveTo(27, 9);
        g.lineTo(29, 4);
        g.lineTo(25, 8);
        g.closePath();
        g.fillPath();

        // Horn (golden, centred)
        g.fillStyle(0xFFD700, 1);
        g.beginPath();
        g.moveTo(20, 0);
        g.lineTo(17, 8);
        g.lineTo(23, 8);
        g.closePath();
        g.fillPath();
        // Horn shine
        g.lineStyle(1, 0xFFF8DC, 0.7);
        g.beginPath();
        g.moveTo(19, 3);
        g.lineTo(20, 7);
        g.strokePath();

        // Eyes (big, cute)
        g.fillStyle(0xFFFFFF, 1);
        g.fillCircle(16, 15, 3);
        g.fillCircle(24, 15, 3);
        g.fillStyle(0x4B0082, 1);
        g.fillCircle(16, 15, 1.5);
        g.fillCircle(24, 15, 1.5);
        // Eye shine
        g.fillStyle(0xFFFFFF, 0.8);
        g.fillCircle(17, 14, 0.8);
        g.fillCircle(25, 14, 0.8);

        // Nose / mouth
        g.fillStyle(0xFFB6C1, 0.8);
        g.fillCircle(20, 20, 1.5);

        // Mane (rainbow wisps on sides)
        g.lineStyle(2, 0xFF69B4, 0.9);
        g.beginPath();
        g.moveTo(10, 12);
        g.lineTo(6, 18);
        g.strokePath();
        g.lineStyle(2, 0x9B59B6, 0.8);
        g.beginPath();
        g.moveTo(30, 12);
        g.lineTo(34, 18);
        g.strokePath();
        g.lineStyle(2, 0x00BFFF, 0.7);
        g.beginPath();
        g.moveTo(9, 14);
        g.lineTo(5, 22);
        g.strokePath();
        g.lineStyle(2, 0x00BFFF, 0.7);
        g.beginPath();
        g.moveTo(31, 14);
        g.lineTo(35, 22);
        g.strokePath();

        // Legs
        g.fillStyle(0xB266D9, 1);
        g.fillRoundedRect(12, 36, 4, 7, 2);
        g.fillRoundedRect(24, 36, 4, 7, 2);

        // Hooves (golden)
        g.fillStyle(0xFFD700, 0.8);
        g.fillRoundedRect(12, 40, 4, 3, 1);
        g.fillRoundedRect(24, 40, 4, 3, 1);

        // Star sparkles
        g.fillStyle(0xFFD700, 0.9);
        g.fillRect(3, 3, 1, 3);
        g.fillRect(2, 4, 3, 1);
        g.fillRect(36, 30, 1, 3);
        g.fillRect(35, 31, 3, 1);
        g.fillRect(6, 38, 1, 2);
        g.fillRect(5, 39, 3, 1);

        g.generateTexture('unicorn', 40, 44);
        g.destroy();
    }

    generateParticleTextures() {
        // White particle
        const p = this.add.graphics();
        p.fillStyle(0xFFFFFF, 1);
        p.fillCircle(4, 4, 4);
        p.generateTexture('particle', 8, 8);
        p.destroy();

        // Star for background
        const s = this.add.graphics();
        s.fillStyle(0xFFFFFF, 1);
        s.fillCircle(1, 1, 1);
        s.generateTexture('star', 2, 2);
        s.destroy();

        // Purple particle (for unicorn effects)
        const pp = this.add.graphics();
        pp.fillStyle(0x9B59B6, 1);
        pp.fillCircle(3, 3, 3);
        pp.generateTexture('particle-purple', 6, 6);
        pp.destroy();
    }

    generateUITextures(CFG) {
        // Heart for health display
        const h = this.add.graphics();
        h.fillStyle(0xE74C3C, 1);
        h.beginPath();
        h.moveTo(8, 3);
        h.arc(5, 3, 3, 0, Math.PI, true);
        h.arc(11, 3, 3, 0, Math.PI, true);
        h.lineTo(14, 3);
        h.lineTo(8, 13);
        h.lineTo(2, 3);
        h.closePath();
        h.fillPath();
        h.generateTexture('heart', 16, 14);
        h.destroy();

        // ATS lock icon
        const lock = this.add.graphics();
        lock.fillStyle(0x888888, 1);
        lock.fillRoundedRect(3, 8, 14, 12, 2);
        lock.lineStyle(2, 0x888888, 1);
        lock.strokeCircle(10, 6, 5);
        lock.fillStyle(0xFFD700, 1);
        lock.fillCircle(10, 14, 2);
        lock.generateTexture('ats-lock', 20, 20);
        lock.destroy();
    }

    generateATSTexture(CFG) {
        const g = this.add.graphics();

        // Main server rack body
        g.fillStyle(0x2C3E50, 1);
        g.fillRect(10, 10, 100, 60);

        // Frame border
        g.lineStyle(2, 0x4A6FA5, 0.8);
        g.strokeRect(10, 10, 100, 60);

        // Rack divider lines
        g.lineStyle(1, 0x4A6FA5, 0.5);
        for (let row = 0; row < 3; row++) {
            const ry = 28 + row * 15;
            g.beginPath();
            g.moveTo(15, ry);
            g.lineTo(105, ry);
            g.strokePath();
        }

        // LED status lights (green = healthy)
        for (let row = 0; row < 3; row++) {
            const ly = 19 + row * 15;
            g.fillStyle(0x00FF00, 0.8 - row * 0.2);
            g.fillCircle(22, ly, 2);
            g.fillCircle(30, ly, 2);
        }

        // Display panel with "ATS" text
        g.fillStyle(0x1a0a2e, 1);
        g.fillRect(42, 14, 60, 14);

        // Pixel-block "ATS" letters
        g.fillStyle(0x00E5FF, 0.9);
        // A
        g.fillRect(48, 17, 1, 8);
        g.fillRect(55, 17, 1, 8);
        g.fillRect(49, 17, 6, 1);
        g.fillRect(49, 21, 6, 1);
        // T
        g.fillRect(60, 17, 8, 1);
        g.fillRect(63, 17, 1, 8);
        // S
        g.fillRect(72, 17, 7, 1);
        g.fillRect(72, 17, 1, 4);
        g.fillRect(72, 21, 7, 1);
        g.fillRect(78, 21, 1, 4);
        g.fillRect(72, 25, 7, 1);

        // Data flow lines on rack rows
        g.fillStyle(0x00E5FF, 0.3);
        g.fillRect(38, 34, 55, 2);
        g.fillRect(38, 49, 45, 2);

        // Base stand
        g.fillStyle(0x4A6FA5, 0.6);
        g.fillRect(20, 70, 80, 5);

        g.generateTexture('ats-building', 120, 80);
        g.destroy();
    }
};
