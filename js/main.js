/**
 * main.js — Entry point: creates the Phaser game instance and handles
 * mobile viewport sizing via the visualViewport API.
 *
 * On mobile, the visualViewport API gives accurate dimensions that account
 * for Safari's dynamic address bar, avoiding the old scrollTo(0,1) hack.
 */
window.CVInvaders = window.CVInvaders || {};

// Global error handler — catches uncaught exceptions that would silently
// kill Phaser's requestAnimationFrame loop on mobile.  When an error is
// caught we force-restart the game loop so the game doesn't freeze.
window.addEventListener('error', function (e) {
    console.error('CV Invaders – uncaught error:', e.error || e.message);
    // Attempt to restart the game loop if it was killed
    try {
        if (window.CVInvaders.game && window.CVInvaders.game.loop && !window.CVInvaders.game.loop.running) {
            console.warn('Game loop stopped — restarting');
            window.CVInvaders.game.loop.wake();
        }
    } catch (ignore) {}
});

window.addEventListener('load', function () {
    const CFG = window.CVInvaders.Config;

    const isMobile = window.matchMedia('(pointer: coarse)').matches;

    // On mobile, widen the canvas to fill the screen by adding side control
    // panels that flank the 800×600 gameplay area.  CFG.WIDTH stays 800 so
    // all gameplay logic is unchanged; CANVAS_WIDTH is the full Phaser width.
    if (isMobile) {
        CFG.MOBILE_SCALE = 1;
        var sw = window.screen.width, sh = window.screen.height;
        var iw = window.innerWidth,   ih = window.innerHeight;
        var vw = window.visualViewport ? window.visualViewport.width  : iw;
        var vh = window.visualViewport ? window.visualViewport.height : ih;
        var landscapeW = Math.max(sw, sh, iw, ih, vw, vh);
        var landscapeH = Math.min(sw, sh, iw, ih, vw, vh);
        if (landscapeW > 0 && landscapeH > 0) {
            var deviceAspect = landscapeW / landscapeH;
            var idealW = Math.round(CFG.HEIGHT * deviceAspect);
            CFG.CANVAS_WIDTH = Math.max(800, Math.min(1400, idealW));
        }
        CFG.SIDE_PANEL_WIDTH = Math.floor((CFG.CANVAS_WIDTH - CFG.WIDTH) / 2);
    }

    const config = {
        type: Phaser.AUTO,
        width: CFG.CANVAS_WIDTH,
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

    function refreshScale() {
        if (window.CVInvaders.game && window.CVInvaders.game.scale) {
            window.CVInvaders.game.scale.refresh();
        }
    }

    if (isMobile) {
        // Block pinch-to-zoom and multi-touch zoom gestures on the whole page.
        // Safari ignores the viewport meta's user-scalable=no for multi-finger
        // gestures, so we need to cancel them at the JS level.
        document.addEventListener('touchmove', function (e) {
            if (e.touches.length > 1) { e.preventDefault(); }
        }, { passive: false });
        document.addEventListener('gesturestart', function (e) {
            e.preventDefault();
        }, { passive: false });
        document.addEventListener('gesturechange', function (e) {
            e.preventDefault();
        }, { passive: false });

        // Use visualViewport API for accurate sizing on mobile Safari.
        // This reflects the actual visible area, accounting for the
        // dynamic address bar, on-screen keyboard, and other browser chrome.
        if (window.visualViewport) {
            var resizeTimeout;
            var lastWidth = 0;
            var lastHeight = 0;

            var applyViewportSize = function () {
                var gameEl = document.getElementById('game');
                var vw = window.visualViewport.width;
                var vh = window.visualViewport.height;

                // Ignore keyboard-triggered resizes: if height shrinks by
                // more than 25% while width stays the same, the on-screen
                // keyboard has opened — keep the previous size so the game
                // doesn't collapse into a tiny square.
                if (lastHeight > 0 && lastWidth > 0) {
                    var heightRatio = vh / lastHeight;
                    var widthUnchanged = Math.abs(vw - lastWidth) < 5;
                    if (widthUnchanged && heightRatio < 0.75) {
                        // Keyboard opened — skip resize
                        return;
                    }
                }

                lastWidth = vw;
                lastHeight = vh;

                if (gameEl) {
                    gameEl.style.width = vw + 'px';
                    gameEl.style.height = vh + 'px';
                }
                refreshScale();
            };

            var onViewportResize = function () {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(applyViewportSize, 150);
            };

            window.visualViewport.addEventListener('resize', onViewportResize);
            window.visualViewport.addEventListener('scroll', onViewportResize);

            // Initial sizing after layout settles
            setTimeout(applyViewportSize, 100);
        } else {
            // Fallback for browsers without visualViewport
            window.addEventListener('resize', refreshScale);
        }

        // Orientation change needs aggressive re-measurement because the
        // viewport dimensions are unreliable for the first few hundred ms
        // after rotation.  We fire applyViewportSize at staggered intervals
        // and reset the lastWidth/lastHeight so the keyboard-detection
        // heuristic doesn't accidentally suppress the resize.
        window.addEventListener('orientationchange', function () {
            if (typeof applyViewportSize === 'function') {
                // Reset so the keyboard-guard doesn't suppress the new size
                lastWidth = 0;
                lastHeight = 0;
                // Staggered calls — the viewport settles at different speeds
                // across devices / browsers
                setTimeout(applyViewportSize, 100);
                setTimeout(applyViewportSize, 300);
                setTimeout(applyViewportSize, 600);
                setTimeout(applyViewportSize, 1000);
            } else {
                // Fallback — no visualViewport, just refresh Phaser scale
                setTimeout(refreshScale, 300);
            }
        });

        // Android Chrome: request fullscreen on first interaction
        // (silently fails on iOS Safari which doesn't support Fullscreen API on iPhone)
        document.addEventListener('touchstart', function requestFS() {
            var el = document.documentElement;
            if (el.requestFullscreen) {
                el.requestFullscreen().catch(function () {});
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            }
            document.removeEventListener('touchstart', requestFS);
        }, { once: true });
    } else {
        // Desktop: simple resize handler
        window.addEventListener('resize', refreshScale);
    }
});
