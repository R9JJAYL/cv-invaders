window.CVInvaders = window.CVInvaders || {};

/**
 * CombatUtils — Shared combat helper functions used by both GameScene and BossScene.
 *
 * These are stateless utilities that accept a Phaser Scene as their first
 * argument, keeping the scene classes slim without introducing inheritance.
 */
window.CVInvaders.CombatUtils = {
    /**
     * Draw a brief CoD-style X hit-marker at the impact point.
     * Throttled to one per 80 ms to prevent graphics accumulation.
     *
     * @param {Phaser.Scene} scene - The active scene to draw in
     * @param {number} x - Hit X position
     * @param {number} y - Hit Y position
     * @param {boolean} [isBoss=false] - If true, draw a larger marker
     */
    spawnHitMarker(scene, x, y, isBoss) {
        // Throttle: max one hit marker every 80ms to prevent graphics accumulation
        var now = scene.time.now;
        if (scene._lastHitMarkerTime && now - scene._lastHitMarkerTime < 80) return;
        scene._lastHitMarkerTime = now;

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
            const g = scene.add.graphics().setDepth(100);
            g.lineStyle(thick, color, 1);
            g.beginPath();
            g.moveTo(x + o.x1, y + o.y1);
            g.lineTo(x + o.x2, y + o.y2);
            g.strokePath();
            lines.push(g);
        }

        // Flash and fade out
        scene.tweens.add({
            targets: lines,
            alpha: 0,
            duration: 150,
            delay: 50,
            onComplete: () => lines.forEach(l => l.destroy())
        });
    },

    /**
     * Update the boss health bar in the HUD overlay.
     *
     * @param {Phaser.Scene} scene - The active scene (GameScene or BossScene)
     * @param {number} health - Current boss HP
     * @param {number} maxHealth - Maximum boss HP
     */
    updateBossHealthBar(scene, health, maxHealth) {
        const hud = scene.scene.get('HUD');
        if (hud && hud.updateBossHealth) {
            hud.updateBossHealth(health / maxHealth);
        }
    }
};
