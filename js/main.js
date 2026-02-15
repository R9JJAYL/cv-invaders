/**
 * main.js — Entry point: creates the Phaser game instance and handles
 * mobile viewport sizing via the visualViewport API.
 *
 * On mobile, the visualViewport API gives accurate dimensions that account
 * for Safari's dynamic address bar, avoiding the old scrollTo(0,1) hack.
 */
window.CVInvaders = window.CVInvaders || {};

window.addEventListener('load', function () {
    const CFG = window.CVInvaders.Config;

    const isMobile = window.matchMedia('(pointer: coarse)').matches;

    // On mobile, widen game to match the screen's aspect ratio so there
    // are no black bars on the sides.  CFG.WIDTH is updated in-place so
    // every scene that reads it automatically uses the wider value.
    if (isMobile) {
        var screenW = window.screen.width;
        var screenH = window.screen.height;
        // Use the larger dimension as landscape width
        var landscapeW = Math.max(screenW, screenH);
        var landscapeH = Math.min(screenW, screenH);
        if (landscapeW > 0 && landscapeH > 0) {
            var deviceAspect = landscapeW / landscapeH;      // e.g. 1.78 for 16:9
            var totalH = CFG.HEIGHT + CFG.MOBILE_CONTROLS_HEIGHT + (CFG.MOBILE_SAFE_BOTTOM || 0);
            var idealW = Math.round(totalH * deviceAspect);  // width that fills screen
            // Clamp: never narrower than 800, never wider than 1400
            CFG.WIDTH = Math.max(800, Math.min(1400, idealW));
        }
    }

    // On mobile, add extra height for controls bar + safe bottom zone (avoids iOS Home Indicator)
    var gameHeight = isMobile ? CFG.HEIGHT + CFG.MOBILE_CONTROLS_HEIGHT + (CFG.MOBILE_SAFE_BOTTOM || 0) : CFG.HEIGHT;

    const config = {
        type: Phaser.AUTO,
        width: CFG.WIDTH,
        height: gameHeight,
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

        // Orientation change needs a delayed refresh for layout to finalise
        window.addEventListener('orientationchange', function () {
            setTimeout(refreshScale, 300);
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
