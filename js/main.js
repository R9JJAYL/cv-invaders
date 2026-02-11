window.CVInvaders = window.CVInvaders || {};

window.addEventListener('load', function () {
    const CFG = window.CVInvaders.Config;

    const config = {
        type: Phaser.AUTO,
        width: CFG.WIDTH,
        height: CFG.HEIGHT,
        parent: 'game',
        backgroundColor: CFG.COLORS.BG,
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            expandParent: true
        },
        input: {
            activePointers: 3
        },
        dom: {
            createContainer: true
        },
        scene: [
            window.CVInvaders.BootScene,
            window.CVInvaders.MenuScene,
            window.CVInvaders.TutorialScene,
            window.CVInvaders.GameScene,
            window.CVInvaders.BossScene,
            window.CVInvaders.GameOverScene,
            window.CVInvaders.HUD
        ]
    };

    window.CVInvaders.game = new Phaser.Game(config);

    // Force Phaser to recalculate scale on orientation change
    // Multiple refreshes with delays to handle mobile address bar retracting
    function refreshScale() {
        if (window.CVInvaders.game && window.CVInvaders.game.scale) {
            window.CVInvaders.game.scale.refresh();
        }
    }

    window.addEventListener('resize', function () {
        refreshScale();
        setTimeout(refreshScale, 100);
        setTimeout(refreshScale, 300);
        setTimeout(refreshScale, 500);
    });

    // orientationchange fires on actual device rotation
    window.addEventListener('orientationchange', function () {
        // Scroll to top to hide mobile address bar
        setTimeout(function () { window.scrollTo(0, 1); }, 50);
        setTimeout(refreshScale, 100);
        setTimeout(refreshScale, 300);
        setTimeout(refreshScale, 500);
    });
});
