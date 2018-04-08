var PhaserGameObject = (function () {
    function PhaserGameObject() {
        this.game = null;
        this.global = {
            pause: false
        };
        this.devMode = {
            skip: {
                intro: true
            }
        };
    }
    PhaserGameObject.prototype.init = function (el, parent, options) {
        var game = new Phaser.Game(options.width, options.height, Phaser.WEBGL, el, { preload: preload, create: create, update: update });
        game.preserveDrawingBuffer = true;
        var phaserMaster = new PHASER_MASTER({ game: game, resolution: { width: options.width, height: options.height } }), phaserControls = new PHASER_CONTROLS(), phaserMouse = new PHASER_MOUSE({ showDebugger: false }), phaserSprites = new PHASER_SPRITE_MANAGER(), phaserBmd = new PHASER_BITMAPDATA_MANAGER(), phaserTexts = new PHASER_TEXT_MANAGER(), phaserButtons = new PHASER_BUTTON_MANAGER(), phaserGroup = new PHASER_GROUP_MANAGER(), phaserBitmapdata = new PHASER_BITMAPDATA_MANAGER(), weaponManager = new WEAPON_MANAGER(), enemyManager = new ENEMY_MANAGER({ showHitbox: false }), playerManager = new PLAYER_MANAGER(), itemManager = new ITEMSPAWN_MANAGER(), utilityManager = new UTILITY_MANAGER();
        var store = options.store;
        var gameDataCopy = JSON.stringify(store.getters._gameData());
        phaserMaster.let('gameData', JSON.parse(gameDataCopy));
        function saveData(prop, value) {
            var gameData = phaserMaster.get('gameData');
            gameData[prop] = value;
        }
        function updateStore() {
            var gameData = phaserMaster.get('gameData');
            store.commit('setGamedata', gameData);
        }
        function preload() {
            var game = phaserMaster.game();
            game.load.enableParallel = true;
            game.stage.backgroundColor = '#2f2f2f';
            var folder = 'src/phaser/saveTheWorld/resources';
            game.load.image('example', folder + "/images/earth.png");
            game.load.atlas('atlas_main', folder + "/textureAtlas/main/main.png", folder + "/textureAtlas/main/main.json", Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
            game.load.atlas('atlas_weapons', folder + "/textureAtlas/weapons/weaponsAtlas.png", folder + "/textureAtlas/weapons/weaponsAtlas.json", Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
            game.load.atlas('atlas_large', folder + "/textureAtlas/large/large.png", folder + "/textureAtlas/large/large.json", Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
            game.load.atlas('atlas_enemies', folder + "/textureAtlas/enemies/enemies.png", folder + "/textureAtlas/enemies/enemies.json", Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
            game.load.atlas('atlas_ships', folder + "/textureAtlas/ships/ships.png", folder + "/textureAtlas/ships/ships.json", Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
            game.load.json('weaponData', folder + "/json/weaponData.json");
            game.load.bitmapFont('gem', folder + "/fonts/gem.png", folder + "/fonts/gem.xml");
            phaserMaster.changeState('PRELOAD');
            new PHASER_PRELOADER({ game: game, delayInSeconds: 0, done: function () { preloadComplete(); } });
        }
        function tweenTint(obj, startColor, endColor, time, callback) {
            var game = phaserMaster.game();
            var colorBlend = { step: 0 };
            var colorTween = game.add.tween(colorBlend).to({ step: 100 }, time);
            colorTween.onUpdateCallback(function () {
                obj.tint = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend.step);
            });
            if (callback) {
                colorTween.onComplete.add(callback, game);
            }
            obj.tint = startColor;
            colorTween.start();
        }
        function create() {
            var game = phaserMaster.game();
            var gameData = phaserMaster.get('gameData');
            game.physics.startSystem(Phaser.Physics.ARCADE);
            phaserControls.assign(game);
            phaserMouse.assign(game);
            phaserSprites.assign(game);
            phaserBmd.assign(game);
            phaserTexts.assign(game);
            phaserButtons.assign(game);
            phaserGroup.assign(game, 20);
            phaserBitmapdata.assign(game);
            weaponManager.assign(game, phaserMaster, phaserSprites, phaserGroup, 'atlas_weapons');
            itemManager.assign(game, phaserMaster, phaserSprites, phaserGroup, 'atlas_main');
            enemyManager.assign(game, phaserMaster, phaserSprites, phaserTexts, phaserGroup, weaponManager, 'atlas_enemies', 'atlas_weapons');
            playerManager.assign(game, phaserMaster, phaserSprites, phaserTexts, phaserGroup, phaserControls, weaponManager, 'atlas_ships', 'atlas_weapons');
            utilityManager.assign(game, phaserSprites, phaserBitmapdata, phaserGroup, 'atlas_main');
            phaserMaster.let('roundTime', 60);
            phaserMaster.let('clock', game.time.create(false));
            phaserMaster.let('elapsedTime', 0);
            phaserMaster.let('inGameSeconds', 0);
            phaserMaster.let('devMode', false);
            phaserMaster.let('starMomentum', { x: 0, y: 0 });
            phaserMaster.let('pauseStatus', false);
            phaserMaster.let('bossHealth', null);
            phaserMaster.let('powerupTimer', 0);
            phaserMaster.let('bossMode', false);
            phaserMaster.let('showWarningBand', false);
            var weaponData = phaserMaster.let('weaponData', game.cache.getJSON('weaponData'));
            var pw = phaserMaster.let('primaryWeapon', weaponData.primaryWeapons[gameData.primaryWeapon]);
            var sw = phaserMaster.let('secondaryWeapon', weaponData.secondaryWeapons[gameData.secondaryWeapon]);
            var perk = phaserMaster.let('perk', weaponData.perks[gameData.perk]);
            game.onPause.add(function () {
                pauseGame();
            }, this);
            game.onResume.add(function () {
                game.time.addToPausedTime(game.time.pauseDuration);
                unpauseGame();
            }, this);
            buildTransitionScreen();
            buildBackground();
            buildScore();
            buildMenuAndButtons();
            buildBossWarning();
            buildHealthbar_player();
            buildPow_player();
            buildPortrait_player();
            buildHealthbar_boss();
        }
        function buildTransitionScreen() {
            var game = phaserMaster.game();
            game.physics.startSystem(Phaser.Physics.ARCADE);
            utilityManager.buildOverlayBackground('#ffffff', '#ffffff', 19, true);
            utilityManager.buildOverlayGrid(240, 132, 20, 'logo_small');
            var boundryObj = phaserBitmapdata.addGradient({ name: 'boundryObj', start: '#ffffff', end: '#ffffff', width: 5, height: 5, render: false });
            var leftBoundry = phaserSprites.add({ x: -9, y: -game.world.height / 2, name: "leftBoundry", group: 'boundries', width: 10, height: game.world.height * 2, reference: boundryObj.cacheBitmapData, alpha: 0 });
            var rightBoundry = phaserSprites.add({ x: game.world.width - 1, y: -game.world.height / 2, name: "rightBoundry", group: 'boundries', width: 10, height: game.world.height * 2, reference: boundryObj.cacheBitmapData, alpha: 0 });
            game.physics.enable([leftBoundry, rightBoundry], Phaser.Physics.ARCADE);
            leftBoundry.body.immovable = true;
            rightBoundry.body.immovable = true;
        }
        function buildBackground() {
            var starMomentum = phaserMaster.get('starMomentum');
            var background1 = phaserSprites.addTilespriteFromAtlas({ name: 'bg1', group: 'backgrounds', x: 0, y: 0, width: game.canvas.width, height: game.canvas.height, atlas: 'atlas_large', filename: 'Nebula3' });
            background1.onUpdate = function () {
                background1.tilePosition.y += 1;
                background1.tilePosition.x += starMomentum.x / 4;
            };
            var background2 = phaserSprites.addTilespriteFromAtlas({ name: 'bg2', group: 'backgrounds', x: 0, y: 0, width: game.canvas.width, height: game.canvas.height, atlas: 'atlas_large', filename: 'Nebula1' });
            background2.tilePosition.x = 500;
            background2.onUpdate = function () {
                background2.tilePosition.y += 5;
                background2.tilePosition.x += starMomentum.x / 2;
            };
            phaserGroup.addMany(1, [background1, background2]);
            var foreground1 = phaserSprites.addTilespriteFromAtlas({ name: 'fg1', group: 'backgrounds', x: 0, y: 0, width: game.canvas.width, height: game.canvas.height, atlas: 'atlas_large', filename: 'Nebula2', alpha: 0.25 });
            foreground1.tilePosition.x = 300;
            foreground1.onUpdate = function () {
                foreground1.tilePosition.y += 10;
                foreground1.tilePosition.x += starMomentum.x;
            };
            phaserGroup.addMany(10, [foreground1]);
            var _loop_1 = function (i) {
                var star = phaserSprites.addFromAtlas({ x: game.rnd.integerInRange(0, game.world.width), y: game.rnd.integerInRange(0, game.world.height), name: "star_" + i, group: 'starfield', filename: "stars_layer_" + game.rnd.integerInRange(1, 3), atlas: 'atlas_main', visible: true });
                star.starType = game.rnd.integerInRange(1, 3);
                star.scale.setTo(star.starType / 2, star.starType / 2);
                star.onUpdate = function () {
                    var baseMomentum = 0.25 + (3 - star.starType) * 5;
                    var starMomentum = phaserMaster.get('starMomentum');
                    if (this.y > this.game.world.height) {
                        this.y = 10;
                        this.x = game.rnd.integerInRange(-100, game.world.width);
                    }
                    if (this.x > this.game.world.width) {
                        this.x = 0;
                    }
                    if (this.x < 0) {
                        this.x = this.game.world.width;
                    }
                    if (starMomentum.x > 0) {
                        starMomentum.x -= 0.05;
                    }
                    if (starMomentum.x < 0) {
                        starMomentum.x += 0.05;
                    }
                    if (starMomentum.y > 0) {
                        starMomentum.y -= 0.05;
                    }
                    if (starMomentum.y < 0) {
                        starMomentum.y += 0.05;
                    }
                    this.x += (3 - star.starType) * starMomentum.x;
                    this.y += (baseMomentum + ((3 - star.starType) * starMomentum.y));
                };
                star.fadeOut = function () {
                    this.game.add.tween(this).to({ alpha: 0 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).autoDestroy = true;
                };
                phaserGroup.layer(0).add(star);
            };
            for (var i = 0; i < 10; i++) {
                _loop_1(i);
            }
        }
        function buildMenuAndButtons() {
            var menuButton1 = phaserSprites.addFromAtlas({ name: "menuButton1", group: 'menuButtons', x: game.world.centerX, y: game.world.centerY + 125, atlas: 'atlas_main', filename: 'ui_button', visible: true });
            menuButton1.anchor.setTo(0.5, 0.5);
            menuButton1.init = function () {
                menuButton1.visible = false;
            };
            menuButton1.reveal = function () {
                this.visible = true;
            };
            var menuButton1Text = phaserTexts.add({ name: 'menuButton1Text', group: 'ui', font: 'gem', x: menuButton1.x, y: menuButton1.y, size: 14, default: "" });
            menuButton1Text.anchor.setTo(0.5, 0.5);
            var menuButton2 = phaserSprites.addFromAtlas({ name: "menuButton2", group: 'menuButtons', x: game.world.centerX, y: game.world.centerY + 175, atlas: 'atlas_main', filename: 'ui_button', visible: true });
            menuButton2.anchor.setTo(0.5, 0.5);
            menuButton2.init = function () {
                menuButton2.visible = false;
            };
            menuButton2.reveal = function () {
                this.visible = true;
            };
            var menuButton2Text = phaserTexts.add({ name: 'menuButton2Text', group: 'ui', font: 'gem', x: menuButton2.x, y: menuButton2.y, size: 14, default: "" });
            menuButton2Text.anchor.setTo(0.5, 0.5);
            var menuButtonCursor = phaserSprites.addFromAtlas({ name: "menuButtonCursor", group: 'menuButtons', x: game.world.centerX - 125, atlas: 'atlas_main', filename: 'ui_cursor', visible: true });
            menuButtonCursor.anchor.setTo(0.5, 0.5);
            menuButtonCursor.init = function () {
                menuButtonCursor.visible = false;
            };
            menuButtonCursor.reveal = function () {
                this.visible = true;
            };
            menuButtonCursor.updateLocation = function (val) {
                phaserMaster.forceLet('menuButtonSelection', val);
                var button = phaserSprites.get("menuButton" + val);
                this.y = button.y;
            };
            menuButtonCursor.updateLocation(1);
            phaserGroup.addMany(12, [menuButton1, menuButton2, menuButtonCursor]);
        }
        function buildBossWarning() {
            var warningBand = phaserSprites.addTilespriteFromAtlas({ name: 'showWarningBand', group: 'boss_ui', x: 0, y: game.world.centerY - 100, width: game.canvas.width, height: 100, atlas: 'atlas_main', filename: 'warning_band', alpha: 0 });
            warningBand.cosWave = { data: game.math.sinCosGenerator(150, 100, 0, 1).cos, count: 0 };
            warningBand.onUpdate = function () {
                var showWarningBand = phaserMaster.getOnly(['showWarningBand']).showWarningBand;
                if (showWarningBand) {
                    warningBand.cosWave.count++;
                    if (warningBand.cosWave.count > warningBand.cosWave.data.length - 1) {
                        warningBand.cosWave.count = 0;
                    }
                    warningBand.alpha = Math.round(warningBand.cosWave.data[warningBand.cosWave.count]);
                    warningBand.tilePosition.x += 10;
                }
                else {
                    if (warningBand.cosWave.count !== 0) {
                        warningBand.cosWave.count++;
                        if (warningBand.cosWave.count > warningBand.cosWave.data.length - 1) {
                            warningBand.cosWave.count = 0;
                        }
                        warningBand.alpha = Math.round(warningBand.cosWave.data[warningBand.cosWave.count]);
                        warningBand.tilePosition.x += 10;
                    }
                }
            };
        }
        function buildScore() {
            var game = phaserMaster.game();
            var scoreContainer = phaserSprites.addFromAtlas({ name: "scoreContainer", group: 'uiScore', org: 'ui', filename: 'ui_roundContainer', atlas: 'atlas_main', visible: true });
            scoreContainer.anchor.setTo(0.5, 0.5);
            phaserSprites.centerOnPoint('scoreContainer', game.world.width / 2 + scoreContainer.width / 2, scoreContainer.height / 2 + scoreContainer.height / 2 + 20);
            phaserGroup.addMany(10, [scoreContainer]);
            scoreContainer.setDefaultPositions();
            scoreContainer.init = function () {
                scoreContainer.y = -100;
            };
            scoreContainer.reveal = function () {
                var y = scoreContainer.getDefaultPositions().y;
                scoreContainer.setDefaultPositions();
                game.add.tween(scoreContainer).to({ y: y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
                    onComplete.add(function () { });
            };
            scoreContainer.hide = function () {
                game.add.tween(scoreContainer).to({ y: scoreContainer.getDefaultPositions().y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
                    onComplete.add(function () { });
            };
            var scoreText = phaserTexts.add({ name: "scoreText", group: 'uiScore', font: 'gem', size: 18, default: '1100', visible: true });
            scoreText.anchor.setTo(0.5, 0.5);
            scoreContainer.addChild(scoreText);
            scoreText.init = function () {
                scoreText.updateScore();
            };
            scoreText.updateScore = function () {
                scoreText.setText("" + phaserMaster.get('gameData').score);
            };
        }
        function buildPortrait_player() {
            var game = phaserMaster.game();
            var container = phaserSprites.addEmptySprite({ name: "portraitContainer", group: 'player_portrait', org: 'ui' });
            phaserSprites.centerOnPoint('portraitContainer', container.width / 2 + 20, game.world.height - container.height / 2 - 75);
            phaserGroup.addMany(10, [container]);
            container.setDefaultPositions();
            var mockPortrait = phaserSprites.addFromAtlas({ x: 3, y: 3, name: "mockPortrait", filename: 'ui_portrait_1', atlas: 'atlas_main', visible: true });
            container.addChild(mockPortrait);
            var staticContainer = phaserSprites.addFromAtlas({ name: "staticContainer", filename: 'portrait_static_1', atlas: 'atlas_main', visible: true, alpha: 0.4 });
            var staticAnimation = Phaser.Animation.generateFrameNames('portrait_static_', 1, 4).concat(Phaser.Animation.generateFrameNames('portrait_static_', 3, 1));
            staticContainer.animations.add('static', staticAnimation, 1, true);
            staticContainer.setStaticLevel = function (type) {
                staticContainer.animations.stop('static');
                var _a = { framerate: 12, alpha: 0.5 }, framerate = _a.framerate, alpha = _a.alpha;
                switch (type) {
                    case 'HEAVY':
                        framerate = 18;
                        alpha = 0.3;
                        break;
                    case 'MED':
                        framerate = 12;
                        alpha = 0.2;
                        break;
                    case 'LIGHT':
                        framerate = 6;
                        alpha = 0.1;
                        break;
                }
                staticContainer.alpha = alpha;
                staticContainer.animations.play('static', framerate, true);
            };
            container.addChild(staticContainer);
            var portraitFrame = phaserSprites.addFromAtlas({ name: "portraitFrame", filename: 'ui_portraitContainer', atlas: 'atlas_main', visible: true });
            container.addChild(portraitFrame);
            container.init = function () {
                container.y = container.y + 200;
            };
            container.reveal = function () {
                var y = container.getDefaultPositions().y;
                container.setDefaultPositions();
                game.add.tween(container).to({ y: y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
                    onComplete.add(function () { });
            };
            container.hide = function () {
                game.add.tween(container).to({ y: container.getDefaultPositions().y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
                    onComplete.add(function () { });
            };
        }
        function buildHealthbar_player() {
            var game = phaserMaster.game();
            var healthbar_player = phaserSprites.addFromAtlas({ y: 100, name: "healthbar_player", group: 'player_healthbar', org: 'ui', filename: 'healthbar_player', atlas: 'atlas_main', visible: true });
            phaserSprites.centerOnPoint('healthbar_player', 300, game.world.height - healthbar_player.height / 2 - 10);
            phaserGroup.addMany(10, [healthbar_player]);
            healthbar_player.setDefaultPositions();
            var unit_damage_player = phaserSprites.addFromAtlas({ x: 5, y: 3, width: healthbar_player.width - 10, name: "unit_damage_player", filename: 'unit_damage', atlas: 'atlas_main', visible: true });
            unit_damage_player.maxHealth = unit_damage_player.width - 10;
            healthbar_player.addChild(unit_damage_player);
            unit_damage_player.init = function () { };
            unit_damage_player.updateHealth = function (remaining) {
                var healthRemaining = remaining / 100;
                var damageBar = phaserMaster.getAll().damageBar;
                if (damageBar !== undefined) {
                    damageBar.stop();
                }
                phaserMaster.forceLet('damageBar', game.add.tween(unit_damage_player).to({ width: unit_damage_player.maxHealth * healthRemaining }, 500, Phaser.Easing.Linear.In, true, 500, 0, false));
            };
            var unit_health_player = phaserSprites.addFromAtlas({ x: 5, y: 3, width: healthbar_player.width - 10, name: "unit_health_player", filename: 'unit_health', atlas: 'atlas_main', visible: true });
            healthbar_player.maxHealth = healthbar_player.width - 10;
            healthbar_player.addChild(unit_health_player);
            unit_health_player.init = function () {
                var gameData = phaserMaster.getOnly(['gameData']).gameData;
                var health = gameData.player.health;
                updateShipHealthbar(health);
            };
            unit_health_player.updateHealth = function (remaining) {
                var healthRemaining = remaining / 100;
                unit_health_player.width = healthbar_player.maxHealth * healthRemaining;
            };
            healthbar_player.init = function () {
                healthbar_player.y = healthbar_player.y + 200;
            };
            healthbar_player.reveal = function () {
                var y = healthbar_player.getDefaultPositions().y;
                healthbar_player.setDefaultPositions();
                game.add.tween(healthbar_player).to({ y: y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
                    onComplete.add(function () {
                    healthbar_player.buildLives();
                });
            };
            healthbar_player.hide = function () {
                game.add.tween(healthbar_player).to({ y: healthbar_player.getDefaultPositions().y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
                    onComplete.add(function () { });
            };
            healthbar_player.buildLives = function () {
                var gameData = phaserMaster.getOnly(['gameData']).gameData;
                var _loop_2 = function (i) {
                    var lifeIcon = phaserSprites.addFromAtlas({ x: 0 + (25 * i), y: -20, name: "life_icon_" + game.rnd.integer(), group: 'playerLives', filename: 'ship_icon', atlas: 'atlas_main', alpha: 0 });
                    healthbar_player.addChild(lifeIcon);
                    game.add.tween(lifeIcon).to({ alpha: 1 }, 250, Phaser.Easing.Linear.In, true, (i * 250), 0, false);
                    lifeIcon.destroyIt = function () {
                        game.add.tween(lifeIcon).to({ y: lifeIcon.y - 10, alpha: 0 }, 250, Phaser.Easing.Linear.In, true, 1, 0, false).
                            onComplete.add(function () {
                            phaserSprites.destroy(lifeIcon.name);
                        });
                    };
                };
                for (var i = 0; i < gameData.player.lives; i++) {
                    _loop_2(i);
                }
            };
            healthbar_player.loseLife = function () {
                var lives = phaserSprites.getGroup('playerLives');
                var life = lives[lives.length - 1];
                life.destroyIt();
            };
        }
        function buildPow_player() {
            var game = phaserMaster.game();
            var powerbar = phaserSprites.addFromAtlas({ name: "powerbar", group: 'player_pow', org: 'ui', filename: 'powerbar', atlas: 'atlas_main', visible: true });
            phaserSprites.centerOnPoint('powerbar', game.world.width - 140, game.world.height - powerbar.height / 2 - 10);
            phaserGroup.addMany(10, [powerbar]);
            powerbar.setDefaultPositions();
            powerbar.setup = function () {
                var useBar = 1;
                var _loop_3 = function (i) {
                    var bar = phaserSprites.addFromAtlas({ x: i * 8 + 5, y: 9, name: "powerbar_pow_" + i, filename: "powerbar_level_" + (Math.floor(i / 5) + 1), group: 'powerbar_bars', atlas: 'atlas_main', visible: true });
                    bar.anchor.setTo(0.5, 0.5);
                    bar.popOut = function (delay) {
                        game.time.events.add(delay, function () {
                            bar.scale.setTo(1.5, 1.5);
                            game.add.tween(bar.scale).to({ x: 1, y: 1 }, 350, Phaser.Easing.Back.InOut, true, 1, 0, false);
                        }).autoDestroy = true;
                    };
                    bar.popLost = function () {
                        game.add.tween(bar).to({ y: bar.y - 5, alpha: 0.5 }, 350, Phaser.Easing.Linear.In, true, 1, 0, false).
                            onComplete.add(function () {
                            bar.y = bar.getDefaultPositions().y;
                            bar.alpha = 1;
                            bar.visible = false;
                        });
                    };
                    powerbar.addChild(bar);
                };
                for (var i = 0; i < 30; i++) {
                    _loop_3(i);
                }
                var powerbar_pow = phaserSprites.addFromAtlas({ x: -20, y: 0, name: "powerbar_pow", filename: 'powerbar_pow', atlas: 'atlas_main', visible: true });
                powerbar.addChild(powerbar_pow);
            };
            powerbar.updatePowerbar = function () {
                var gameData = phaserMaster.getOnly(['gameData']).gameData;
                var val = gameData.player.powerup;
                var bars = phaserSprites.getGroup('powerbar_bars');
                for (var i = 0; i < bars.length; i++) {
                    bars[i].visible = true;
                    bars[i].popOut(i * 35);
                }
                for (var i = val; i < bars.length; i++) {
                    bars[i].visible = false;
                    bars[i].popLost(i * 35);
                }
            };
            powerbar.animateFull = function () {
                var bars = phaserSprites.getGroup('powerbar_bars');
                for (var i = 0; i < 30; i++) {
                    bars[i].visible = true;
                    bars[i].popOut(i * 25);
                }
            };
            powerbar.init = function () {
                powerbar.y = powerbar.y + 200;
                powerbar.setup();
                powerbar.updatePowerbar();
            };
            powerbar.reveal = function () {
                var y = powerbar.getDefaultPositions().y;
                powerbar.setDefaultPositions();
                game.add.tween(powerbar).to({ y: y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
                    onComplete.add(function () { });
            };
            powerbar.hide = function () {
                game.add.tween(powerbar).to({ y: powerbar.getDefaultPositions().y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
                    onComplete.add(function () { });
            };
            var staticAnimation = Phaser.Animation.generateFrameNames('special_', 1, 5).concat(['special_1']);
            var _loop_4 = function (i) {
                var icon = phaserSprites.addFromAtlas({ x: powerbar.width - 15 - (i * 30), y: -20, name: "special_icon_" + i, group: 'special_icons', filename: "" + staticAnimation[0], atlas: 'atlas_main', visible: true });
                icon.anchor.setTo(0.5, 0.5);
                icon.animateInterval = game.time.returnTrueTime();
                icon.index = i;
                icon.animations.add('animate', staticAnimation, 1, true);
                icon.onUpdate = function () {
                    if (game.time.returnTrueTime() > icon.animateInterval) {
                        icon.animateInterval = game.time.returnTrueTime() + 5000;
                        game.time.events.add(icon.index * 500, function () {
                            icon.animations.play('animate', 10, false);
                        }).autoDestroy = true;
                    }
                };
                powerbar.addChild(icon);
            };
            for (var i = 0; i < 8; i++) {
                _loop_4(i);
            }
        }
        function buildHealthbar_boss() {
            var game = phaserMaster.game();
            var healthbar_boss = phaserSprites.addFromAtlas({ name: "healthbar_boss", group: 'boss_healthbar', filename: 'healthbar_boss', atlas: 'atlas_main', visible: true });
            phaserSprites.centerOnPoint('healthbar_boss', game.world.width / 2, 25);
            phaserGroup.addMany(10, [healthbar_boss]);
            healthbar_boss.setDefaultPositions();
            var unit_damage_boss = phaserSprites.addFromAtlas({ x: 5, y: 3, width: healthbar_boss.width - 10, name: "unit_damage_boss", filename: 'unit_damage', atlas: 'atlas_main', visible: true });
            unit_damage_boss.maxHealth = unit_damage_boss.width;
            unit_damage_boss.fillComplete = false;
            healthbar_boss.addChild(unit_damage_boss);
            unit_damage_boss.init = function () { unit_damage_boss.width = 0; };
            unit_damage_boss.updateHealth = function (remaining) {
                var healthRemaining = remaining / 100;
                var enemyDamageBar = phaserMaster.getAll().enemyDamageBar;
                if (enemyDamageBar !== undefined) {
                    enemyDamageBar.stop();
                }
                phaserMaster.forceLet('enemyDamageBar', game.add.tween(unit_damage_boss).to({ width: unit_damage_boss.maxHealth * healthRemaining }, 500, Phaser.Easing.Linear.In, true, 500, 0, false));
            };
            unit_damage_boss.fill = function (remaining) {
                var healthRemaining = remaining / 100;
                game.add.tween(unit_damage_boss).to({ width: unit_damage_boss.maxHealth * healthRemaining }, Phaser.Timer.SECOND, Phaser.Easing.Exponential.Out, true, game.rnd.integerInRange(0, 500), 0, false).
                    onComplete.add(function () {
                    unit_damage_boss.fillComplete = true;
                });
            };
            var unit_health_boss = phaserSprites.addFromAtlas({ x: 5, y: 3, width: healthbar_boss.width - 10, name: "unit_health_boss", filename: 'unit_health', atlas: 'atlas_main', visible: true });
            unit_health_boss.maxHealth = unit_health_boss.width;
            unit_health_boss.fillComplete = false;
            healthbar_boss.addChild(unit_health_boss);
            unit_health_boss.init = function () { unit_health_boss.width = 0; };
            unit_health_boss.updateHealth = function (remaining) {
                if (unit_health_boss.fillComplete) {
                    var healthRemaining = remaining / 100;
                    unit_health_boss.width = unit_health_boss.maxHealth * healthRemaining;
                }
            };
            unit_health_boss.fill = function (remaining, callback) {
                if (callback === void 0) { callback = function () { }; }
                var healthRemaining = remaining / 100;
                game.add.tween(unit_health_boss).to({ width: unit_health_boss.maxHealth * healthRemaining }, Phaser.Timer.SECOND, Phaser.Easing.Exponential.Out, true, game.rnd.integerInRange(0, 500), 0, false).
                    onComplete.add(function () {
                    unit_health_boss.fillComplete = true;
                    callback();
                });
            };
            var bossbar_portrait = phaserSprites.addFromAtlas({ x: 0, y: -2, name: "bossbar_portrait", filename: 'bossbar_picture', atlas: 'atlas_main', visible: true });
            healthbar_boss.addChild(bossbar_portrait);
            healthbar_boss.init = function () {
                healthbar_boss.y = -200;
            };
            healthbar_boss.reveal = function () {
                var y = healthbar_boss.getDefaultPositions().y;
                healthbar_boss.setDefaultPositions();
                game.add.tween(healthbar_boss).to({ y: y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
                    onComplete.add(function () {
                    fillEnemyhealth(phaserMaster.get('bossHealth'));
                });
            };
            healthbar_boss.hide = function () {
                game.add.tween(healthbar_boss).to({ y: healthbar_boss.getDefaultPositions().y }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, game.rnd.integerInRange(0, 500), 0, false).
                    onComplete.add(function () { });
            };
        }
        function preloadComplete() {
            var game = phaserMaster.game();
            var isDevMode = phaserMaster.get('devMode');
            var overlay = phaserSprites.getOnly(['overlay']).overlay;
            var _a = phaserMaster.getOnly(['clock', 'roundTime']), clock = _a.clock, roundTime = _a.roundTime;
            var skipAnimation = false;
            phaserSprites.getAll('ARRAY').map(function (obj) {
                obj.init();
            });
            phaserTexts.getAll('ARRAY').map(function (obj) {
                obj.init();
            });
            updateSpecials();
            overlayControls('WIPEOUT', function () {
                utilityManager.overlayBGControls({ transition: 'FADEOUT', delay: 0, speed: skipAnimation ? 1 : 250 }, function () {
                    phaserSprites.getGroup('ui').map(function (obj) {
                        obj.reveal();
                    });
                    var player = createPlayer();
                    player.moveToStart();
                    game.time.events.add(Phaser.Timer.SECOND * 1 * 5, function () {
                        addSpecial();
                    }).autoDestroy = true;
                    clock.start();
                    phaserMaster.changeState('READY');
                });
            });
        }
        function overlayControls(transition, callback) {
            if (callback === void 0) { callback = function () { }; }
            var skipAnimation = false;
            utilityManager.overlayControls({ transition: transition,
                delay: skipAnimation ? 0 : 1000,
                speed: skipAnimation ? 0 : 250,
                tileDelay: skipAnimation ? 0 : 5 }, callback);
        }
        function updateShipHealthbar(remaining) {
            var _a = phaserSprites.getOnly(['unit_damage_player', 'unit_health_player']), unit_damage_player = _a.unit_damage_player, unit_health_player = _a.unit_health_player;
            checkStaticLevels(remaining);
            unit_damage_player.updateHealth(remaining);
            unit_health_player.updateHealth(remaining);
        }
        function addHealth(amount) {
            var gameData = phaserMaster.getOnly(['gameData']).gameData;
            var health = gameData.player.health + amount;
            if (health > 100) {
                health = 100;
            }
            saveData('player', { health: health, lives: gameData.player.lives, powerup: gameData.player.powerup, special: gameData.player.special });
            fillShipHealthbar(health);
        }
        function fillShipHealthbar(remaining) {
            var _a = phaserSprites.getOnly(['unit_damage_player', 'unit_health_player']), unit_damage_player = _a.unit_damage_player, unit_health_player = _a.unit_health_player;
            checkStaticLevels(remaining);
            unit_damage_player.updateHealth(remaining);
            unit_health_player.updateHealth(remaining);
        }
        function checkStaticLevels(health) {
            var staticContainer = phaserSprites.getOnly(['staticContainer']).staticContainer;
            if (health > 0 && health < 15) {
                staticContainer.setStaticLevel('HEAVY');
            }
            if (health > 15 && health < 35) {
                staticContainer.setStaticLevel('MED');
            }
            if (health > 35) {
                staticContainer.setStaticLevel('LIGHT');
            }
        }
        function updateEnemyHealth(remaining) {
            var _a = phaserSprites.getOnly(['unit_damage_boss', 'unit_health_boss']), unit_damage_boss = _a.unit_damage_boss, unit_health_boss = _a.unit_health_boss;
            unit_damage_boss.updateHealth(remaining);
            unit_health_boss.updateHealth(remaining);
        }
        function fillEnemyhealth(remaining) {
            var _a = phaserSprites.getOnly(['unit_damage_boss', 'unit_health_boss']), unit_damage_boss = _a.unit_damage_boss, unit_health_boss = _a.unit_health_boss;
            unit_health_boss.fill(remaining, function () {
                unit_damage_boss.updateHealth(remaining);
            });
        }
        function updateBossBar(remaining) {
            var game = phaserMaster.game();
            var bars = (10 * (remaining * .01));
            var bossBar = phaserMaster.getAll().bossBar;
            if (bossBar !== undefined) {
                game.add.tween(bossBar).to({ x: -244 + (24.4 * bars) }, 1, Phaser.Easing.Linear.Out, true, 0, 0, false);
            }
        }
        function playSequence(wordString, callback) {
            var game = phaserMaster.game();
            var wordlist = wordString.split(" ");
            wordlist.map(function (word, index) {
                var splashText = phaserTexts.add({ name: "splashText_" + game.rnd.integer(), group: 'splash', font: 'gem', size: 18, default: word, visible: false });
                splashText.startSplash = function () {
                    var _this = this;
                    this.visible = true;
                    this.scale.setTo(10, 10);
                    phaserTexts.alignToCenter(this.name);
                    game.add.tween(this.scale).to({ x: 0.5, y: 0.5 }, 350, Phaser.Easing.Linear.In, true, 0);
                    game.add.tween(this).to({ x: this.game.world.centerX, y: this.game.world.centerY, alpha: 0.75 }, 350, Phaser.Easing.Linear.In, true, 0);
                    game.time.events.add(350, function () {
                        phaserTexts.destroy(_this.name);
                    }).autoDestroy = true;
                };
                game.time.events.add((Phaser.Timer.SECOND / 2.5 * index) + 100, splashText.startSplash, splashText).autoDestroy = true;
            });
            game.time.events.add(Phaser.Timer.SECOND / 2.5 * wordlist.length, callback, this).autoDestroy = true;
        }
        function addPowerup() {
            var gameData = phaserMaster.getOnly(['gameData']).gameData;
            var powerbar = phaserSprites.getOnly(['powerbar']).powerbar;
            var val = gameData.player.powerup + 1;
            if (val > 30) {
                val = 30;
                powerbar.animateFull();
            }
            else {
                saveData('player', { health: gameData.player.health, lives: gameData.player.lives, powerup: val, special: gameData.player.special });
                powerbar.updatePowerbar();
            }
        }
        function losePowerup() {
            var gameData = phaserMaster.getOnly(['gameData']).gameData;
            var powerbar = phaserSprites.getOnly(['powerbar']).powerbar;
            var val = gameData.player.powerup - 1;
            if (val < 0) {
                val = 0;
            }
            saveData('player', { health: gameData.player.health, lives: gameData.player.lives, powerup: val, special: gameData.player.special });
            phaserSprites.get("powerbar_pow_" + val).popLost();
        }
        function addSpecial() {
            var gameData = phaserMaster.getOnly(['gameData']).gameData;
            var val = gameData.player.special + 1;
            if (val > 9) {
                val = 9;
            }
            saveData('player', { health: gameData.player.health, lives: gameData.player.lives, powerup: gameData.player.powerup, special: val });
            updateSpecials();
        }
        function loseSpecial() {
            var gameData = phaserMaster.getOnly(['gameData']).gameData;
            var val = gameData.player.special - 1;
            if (val < 0) {
                val = 0;
            }
            saveData('player', { health: gameData.player.health, lives: gameData.player.lives, powerup: gameData.player.powerup, special: val });
            updateSpecials();
        }
        function updateSpecials() {
            var gameData = phaserMaster.getOnly(['gameData']).gameData;
            var val = gameData.player.special;
            var icons = phaserSprites.getGroup('special_icons');
            for (var i = 0; i < icons.length; i++) {
                icons[i].visible = true;
            }
            for (var i = val; i < icons.length; i++) {
                icons[i].visible = false;
            }
        }
        function createPlayer() {
            var game = phaserMaster.game();
            var _a = phaserMaster.getOnly(['gameData', 'primaryWeapon', 'secondaryWeapon', 'perk']), gameData = _a.gameData, primaryWeapon = _a.primaryWeapon, secondaryWeapon = _a.secondaryWeapon, perk = _a.perk;
            var onUpdate = function (player) {
            };
            var onDamage = function (player) {
                shakeHealth();
                losePowerup();
            };
            var updateHealth = function (health) {
                var gameData = phaserMaster.getOnly(['gameData']).gameData;
                updateShipHealthbar(health);
                saveData('player', { health: health, lives: gameData.player.lives, powerup: gameData.player.powerup, special: gameData.player.special });
            };
            var loseLife = function (player) {
                var gameData = phaserMaster.getOnly(['gameData']).gameData;
                gameData.player.lives--;
                var healthbar_player = phaserSprites.getOnly(['healthbar_player']).healthbar_player;
                healthbar_player.loseLife();
                if (gameData.player.lives > 0) {
                    saveData('player', { health: 100, lives: gameData.player.lives, powerup: 0, special: gameData.player.special });
                    phaserControls.clearAllControlIntervals();
                    phaserControls.disableAllInput();
                    game.time.events.add(Phaser.Timer.SECOND, function () {
                        updateHealth(100);
                        player.moveToStart();
                    }).autoDestroy = true;
                }
                else {
                    gameOver();
                }
            };
            var player = playerManager.createShip({ name: 'player', group: 'playership', org: 'gameobjects', layer: 6, shipId: gameData.pilot, primaryWeapon: primaryWeapon.reference, secondaryWeapon: secondaryWeapon.reference, perk: perk.reference }, updateHealth, onDamage, loseLife, onUpdate);
            return player;
        }
        function createBigEnemy(options) {
            var game = phaserMaster.game();
            var onDestroy = function (enemy) {
                var gameData = phaserMaster.getOnly(['gameData']).gameData;
                gameData.score += 200;
                saveData('score', gameData.score);
                var scoreText = phaserTexts.getOnly(['scoreText']).scoreText;
                scoreText.updateScore();
            };
            var onDamage = function () { };
            var onFail = function () { };
            var onUpdate = function () { };
            var enemy = enemyManager.createBigEnemy1(options, onDamage, onDestroy, onFail, onUpdate);
        }
        function createSmallEnemy(options) {
            var game = phaserMaster.game();
            var onDestroy = function (enemy) {
                var gameData = phaserMaster.getOnly(['gameData']).gameData;
                gameData.score += 200;
                saveData('score', gameData.score);
                var scoreText = phaserTexts.getOnly(['scoreText']).scoreText;
                scoreText.updateScore();
                if (game.rnd.integerInRange(0, 10) < 2) {
                    spawnPowerup(enemy.x, enemy.y);
                }
            };
            var onDamage = function () { };
            var onUpdate = function () { };
            var enemy = enemyManager.createSmallEnemy1(options, onDamage, onDestroy, onUpdate);
        }
        function createAsteroid(options) {
            var game = phaserMaster.game();
            var onDestroy = function (enemy) {
                var gameData = phaserMaster.getOnly(['gameData']).gameData;
                gameData.score += 100;
                saveData('score', gameData.score);
                var scoreText = phaserTexts.getOnly(['scoreText']).scoreText;
                scoreText.updateScore();
                for (var i = 0; i < 5; i++) {
                    createDebris({
                        x: enemy.x,
                        y: enemy.y,
                        ix: game.rnd.integerInRange(-100, 100),
                        iy: -game.rnd.integerInRange(-20, 20),
                        layer: 3
                    });
                }
            };
            var onDamage = function () { };
            var onFail = function () { };
            var onUpdate = function () { };
            var enemy = enemyManager.createAsteroid(options, onDamage, onDestroy, onFail, onUpdate);
        }
        function createDebris(options) {
            var onDestroy = function () {
                var gameData = phaserMaster.getOnly(['gameData']).gameData;
                gameData.score += 25;
                saveData('score', gameData.score);
                var scoreText = phaserTexts.getOnly(['scoreText']).scoreText;
                scoreText.updateScore();
            };
            var onDamage = function () { };
            var onFail = function () { };
            var onUpdate = function () { };
            var enemy = enemyManager.createDebris(options, onDamage, onDestroy, onFail, onUpdate);
        }
        function createBoss(options) {
        }
        function shakeWorld() {
            game.camera.shake(0.005, 5000);
        }
        function shakeHealth() {
            var healthbar = phaserSprites.get('healthbar_player');
            var properties = {
                x: healthbar.x + game.rnd.integerInRange(-2, 2),
                y: healthbar.y + game.rnd.integerInRange(-2, 2)
            };
            var duration = 45;
            var repeat = 1;
            var ease = Phaser.Easing.Bounce.InOut;
            var autoStart = false;
            var delay = 1;
            var yoyo = true;
            var quake = game.add.tween(healthbar).to(properties, duration, ease, autoStart, delay, 4, yoyo);
            quake.start();
        }
        function shakeUI() {
            var layer = phaserGroup.layer(10);
            var properties = {
                x: layer.x + game.rnd.integerInRange(-5, 5),
                y: layer.y + game.rnd.integerInRange(-5, 5)
            };
            var duration = 50;
            var repeat = 2;
            var ease = Phaser.Easing.Bounce.InOut;
            var autoStart = false;
            var delay = 1;
            var yoyo = true;
            var quake = game.add.tween(layer).to(properties, duration, ease, autoStart, delay, 4, yoyo);
            quake.start();
        }
        function pauseGame() {
            phaserMaster.get('clock').stop();
            phaserMaster.forceLet('pauseStatus', true);
        }
        function unpauseGame() {
            phaserMaster.get('clock').start();
            phaserMaster.forceLet('pauseStatus', false);
        }
        function spawnHealthpack(x, y) {
            var onPickup = function () {
                addHealth(25);
            };
            itemManager.spawnHealthpack(x, y, 6, onPickup);
        }
        function spawnPowerup(x, y) {
            var onPickup = function () {
                addPowerup();
            };
            itemManager.spawnPowerup(x, y, 6, onPickup);
        }
        function spawnSpecial(x, y) {
            var onPickup = function () {
                addSpecial();
            };
            itemManager.spawnSpecial(x, y, 6, onPickup);
        }
        function incrementTime(duration) {
            var inGameSeconds = phaserMaster.getOnly(['inGameSeconds']).inGameSeconds;
            inGameSeconds += duration;
            phaserMaster.forceLet('inGameSeconds', inGameSeconds);
            return inGameSeconds;
        }
        function director() {
            var bossMode = phaserMaster.getOnly(['bossMode']).bossMode;
            var inGameSeconds = incrementTime(0.5);
            if (inGameSeconds === 30) {
                startBossBattle();
            }
            if (!bossMode) {
                if (inGameSeconds % 5 === 0) {
                    spawnSpecial(game.rnd.integerInRange(0 + 100, game.canvas.width - 100), 0);
                }
                if (inGameSeconds % 1 === 0) {
                    createSmallEnemy({
                        x: game.rnd.integerInRange(0 + 100, game.canvas.width - 100),
                        y: game.rnd.integerInRange(100, 400),
                        iy: game.rnd.integerInRange(0, 80),
                        layer: 3
                    });
                }
            }
        }
        function startBossBattle() {
            var _this = this;
            var game = phaserMaster.game();
            var _a = phaserSprites.getOnly(['scoreContainer', 'player', 'healthbar_boss']), scoreContainer = _a.scoreContainer, player = _a.player, healthbar_boss = _a.healthbar_boss;
            phaserMaster.forceLet('bossMode', true);
            phaserMaster.forceLet('showWarningBand', true);
            shakeWorld();
            var boss = {
                name: 'BOSS',
                health: 100
            };
            phaserMaster.forceLet('bossHealth', boss.health);
            player.moveTo(game.world.centerX, game.world.centerY + game.world.centerY / 2, 4000, function () {
                game.time.events.add(Phaser.Timer.SECOND * 2, function () {
                    scoreContainer.hide();
                    healthbar_boss.reveal();
                    phaserMaster.forceLet('showWarningBand', false);
                }, _this).autoDestroy = true;
            });
        }
        function update() {
            var game = phaserMaster.game();
            var currentState = phaserMaster.getState().currentState;
            var _a = phaserMaster.getOnly(['starMomentum', 'primaryWeapon', 'secondaryWeapon', 'menuButtonSelection', 'elapsedTime', 'powerupTimer', 'gameData']), starMomentum = _a.starMomentum, primaryWeapon = _a.primaryWeapon, secondaryWeapon = _a.secondaryWeapon, menuButtonSelection = _a.menuButtonSelection, elapsedTime = _a.elapsedTime, powerupTimer = _a.powerupTimer, gameData = _a.gameData;
            var _b = phaserSprites.getOnly(['player', 'menuButtonCursor']), player = _b.player, menuButtonCursor = _b.menuButtonCursor;
            var _c = phaserControls.getOnly(['DOWN', 'UP', 'LEFT', 'RIGHT', 'A', 'START']), DOWN = _c.DOWN, UP = _c.UP, LEFT = _c.LEFT, RIGHT = _c.RIGHT, A = _c.A, START = _c.START;
            if (currentState !== 'VICTORYSTATE' && currentState !== 'GAMEOVERSTATE' && currentState !== 'ENDLEVEL') {
                phaserSprites.getManyGroups(['backgrounds', 'starfield', 'playership', 'special_icons', 'itemspawns', 'boss_ui']).map(function (obj) {
                    obj.onUpdate();
                });
            }
            if (currentState === 'READY') {
                if (game.time.returnTrueTime() > powerupTimer) {
                    phaserMaster.forceLet('powerupTimer', gameData.player.powerup < 30 ? game.time.returnTrueTime() + (Phaser.Timer.SECOND * 0.5) : game.time.returnTrueTime() + (Phaser.Timer.SECOND / 2));
                    addPowerup();
                }
                if (game.time.returnTrueTime() > elapsedTime) {
                    phaserMaster.forceLet('elapsedTime', game.time.returnTrueTime() + (Phaser.Timer.SECOND / 2));
                    director();
                }
                phaserSprites.getManyGroups(['ui_overlay', 'enemies', 'boss', 'trashes']).map(function (obj) {
                    if (obj !== undefined) {
                        obj.onUpdate();
                    }
                });
                phaserTexts.getManyGroups(['ui_text', 'timeKeeper']).map(function (obj) {
                    if (obj !== undefined) {
                        obj.onUpdate();
                    }
                });
                if (RIGHT.active) {
                    starMomentum.x = -2;
                    player.moveX(5);
                }
                if (LEFT.active) {
                    starMomentum.x = 2;
                    player.moveX(-5);
                }
                if (UP.active) {
                    starMomentum.y = 5;
                    player.moveY(-5);
                }
                if (DOWN.active) {
                    starMomentum.y = -2;
                    player.moveY(5);
                }
                if (!UP.active && !DOWN.active) {
                    starMomentum.y = 0;
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'A', delay: primaryWeapon.cooldown - (A.state * primaryWeapon.rapidFireSpd) })) {
                    player.fireWeapon();
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'B', delay: 500 }) && gameData.player.special > 0) {
                    loseSpecial();
                    player.fireSubweapon();
                }
            }
            if (currentState === 'VICTORYSTATE') {
                if (phaserControls.checkWithDelay({ isActive: true, key: 'UP', delay: 100 })) {
                    menuButtonCursor.updateLocation(1);
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'DOWN', delay: 100 })) {
                    menuButtonCursor.updateLocation(2);
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'START', delay: 250 })) {
                    phaserMaster.changeState('LOCKED');
                    phaserControls.disableAllInput();
                    switch (menuButtonSelection) {
                        case 1:
                            updateStore();
                            nextLevel();
                            break;
                        case 2:
                            updateStore();
                            saveAndQuit();
                            break;
                    }
                }
            }
            if (currentState === 'GAMEOVERSTATE') {
                if (phaserControls.checkWithDelay({ isActive: true, key: 'UP', delay: 100 })) {
                    menuButtonCursor.updateLocation(1);
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'DOWN', delay: 100 })) {
                    menuButtonCursor.updateLocation(2);
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'START', delay: 100 })) {
                    phaserControls.disableAllInput();
                    switch (menuButtonSelection) {
                        case 1:
                            retryLevel();
                            break;
                        case 2:
                            resetGame();
                            break;
                    }
                }
            }
            if (currentState === 'ENDLEVEL') {
            }
        }
        function endLevel() {
            var game = phaserMaster.game();
            var gameData = phaserMaster.get('gameData');
            phaserControls.disableAllInput();
            phaserSprites.getGroup('ui').map(function (obj) {
                obj.hide();
            });
            phaserSprites.getGroup('ship_secondary_weapons').map(function (obj) {
                obj.destroyIt();
            });
            phaserSprites.get('player').playEndSequence(function () {
                phaserMaster.changeState('ENDLEVEL');
                game.time.events.add(150, function () {
                    var bmd = game.add.bitmapData(game.width, game.height);
                    bmd.drawFull(game.world);
                    var bmdImage = bmd.addToWorld(game.world.centerX + 100, game.world.centerY + 100, 0.5, 0.5, 2, 2);
                    phaserGroup.add(5, bmdImage);
                    phaserSprites.getManyGroups(['backgrounds', 'starfield', 'gameobjects']).map(function (obj) {
                        obj.destroy();
                    });
                    utilityManager.overlayBGControls({ transition: 'FLASHWHITE', delay: 0, speed: 600 }, function () {
                        bmdImage.scale.setTo(0.5, 0.5);
                        bmdImage.x = 0;
                        bmdImage.y = 0;
                        var newsPaper = phaserSprites.addFromAtlas({ x: game.world.centerX, y: game.world.centerY, width: game.world.width, height: game.world.height, name: "newspaper", group: 'gameobjects', filename: 'newspaper', atlas: 'atlas_main', visible: true });
                        newsPaper.anchor.setTo(0.5, 0.5);
                        newsPaper.scale.setTo(3, 3);
                        newsPaper.addChild(bmdImage);
                        phaserGroup.add(6, newsPaper);
                        tweenTint(bmdImage, 0x000000, 0xffffff, 3000, function () {
                            phaserControls.enableAllInput();
                            var _a = phaserTexts.getOnly(['menuButton1Text', 'menuButton2Text']), menuButton1Text = _a.menuButton1Text, menuButton2Text = _a.menuButton2Text;
                            phaserMaster.changeState('VICTORYSTATE');
                            phaserSprites.getGroup('menuButtons').map(function (obj) {
                                obj.reveal();
                            });
                            menuButton1Text.setText('NEXT STAGE');
                            menuButton2Text.setText('SAVE AND QUIT');
                        });
                        game.add.tween(newsPaper.scale).to({ x: 1, y: 1 }, Phaser.Timer.SECOND * 1.5, Phaser.Easing.Bounce.Out, true, 0, 0, false);
                        game.add.tween(newsPaper).to({ angle: 35, y: newsPaper.y - 50 }, Phaser.Timer.SECOND * 1.5, Phaser.Easing.Linear.InOut, true, 0, 0, false);
                    });
                }).autoDestroy = true;
            });
        }
        function victoryScreenSequence(callback) {
        }
        function gameOver() {
            phaserMaster.changeState('GAMEOVER');
            var player = phaserSprites.get('player');
            var earth = phaserSprites.get('earth');
            phaserControls.disableAllInput();
            phaserMaster.changeState('GAMEOVERSTATE');
            phaserSprites.getGroup('ui').map(function (obj) {
                obj.hide();
            });
            game.time.events.add(Phaser.Timer.SECOND * 3, function () {
                var bmd = game.add.bitmapData(game.width, game.height);
                bmd.drawFull(game.world);
                var bmdImage = bmd.addToWorld(game.world.centerX + 100, game.world.centerY + 100, 0.5, 0.5, 2, 2);
                phaserGroup.add(5, bmdImage);
                phaserSprites.getManyGroups(['backgrounds', 'starfield', 'gameobjects']).map(function (obj) {
                    obj.destroy();
                });
                utilityManager.overlayBGControls({ transition: 'FLASHWHITE', delay: 0, speed: 600 }, function () {
                    bmdImage.scale.setTo(0.5, 0.5);
                    bmdImage.x = 0;
                    bmdImage.y = 0;
                    var newsPaper = phaserSprites.addFromAtlas({ x: game.world.centerX, y: game.world.centerY, width: game.world.width, height: game.world.height, name: "newspaper", group: 'gameobjects', filename: 'newspaper', atlas: 'atlas_main', visible: true });
                    newsPaper.anchor.setTo(0.5, 0.5);
                    newsPaper.scale.setTo(3, 3);
                    newsPaper.addChild(bmdImage);
                    phaserGroup.add(6, newsPaper);
                    tweenTint(bmdImage, 0x000000, 0xffffff, 3000, function () {
                        phaserControls.enableAllInput();
                        var _a = phaserTexts.getOnly(['menuButton1Text', 'menuButton2Text']), menuButton1Text = _a.menuButton1Text, menuButton2Text = _a.menuButton2Text;
                        phaserSprites.getGroup('menuButtons').map(function (obj) {
                            obj.reveal();
                        });
                        phaserTexts.get('menuButton1Text').setText('RETRY');
                        phaserTexts.get('menuButton2Text').setText('SAVE AND QUIT');
                    });
                    game.add.tween(newsPaper.scale).to({ x: 1, y: 1 }, Phaser.Timer.SECOND * 1.5, Phaser.Easing.Bounce.Out, true, 0, 0, false);
                    game.add.tween(newsPaper).to({ angle: 35, y: newsPaper.y - 50 }, Phaser.Timer.SECOND * 1.5, Phaser.Easing.Linear.InOut, true, 0, 0, false);
                });
            }).autoDestroy = true;
        }
        function finalFadeOut(callback) {
            utilityManager.overlayBGControls({ transition: 'FADEIN', delay: 0, speed: 250 }, function () {
                phaserTexts.getManyGroups(['ui', 'ui_text', 'ui_buttons']).map(function (text) {
                    phaserTexts.destroy(text.name);
                });
                phaserSprites.getManyGroups(['ui', 'ui_buttons']).map(function (obj) {
                    phaserSprites.destroy(obj.name);
                });
                overlayControls('WIPEIN', function () {
                    game.time.events.add(300, function () {
                        callback();
                    }).autoDestroy = true;
                });
            });
        }
        function nextLevel() {
            finalFadeOut(function () {
                updateStore();
                parent.loadNextLevel();
            });
        }
        function retryLevel() {
            finalFadeOut(function () {
                parent.retry();
            });
        }
        function resetGame() {
            finalFadeOut(function () {
                parent.returnToTitle();
            });
        }
        function saveAndQuit() {
            finalFadeOut(function () {
                updateStore();
                parent.returnToTitle();
            });
        }
        parent.game = this;
        this.game = phaserMaster.game();
    };
    PhaserGameObject.prototype.destroy = function () {
        this.game.destroy();
    };
    return PhaserGameObject;
}());
var __phaser = new PhaserGameObject();
var PHASER_AUDIO = (function () {
    function PHASER_AUDIO() {
    }
    return PHASER_AUDIO;
}());
var PHASER_BITMAPDATA_MANAGER = (function () {
    function PHASER_BITMAPDATA_MANAGER() {
        this.game = null;
        this.bmd = {
            array: [],
            object: {}
        };
    }
    PHASER_BITMAPDATA_MANAGER.prototype.assign = function (game) {
        this.game = game;
    };
    PHASER_BITMAPDATA_MANAGER.prototype.addGradient = function (params) {
        var duplicateCheck = this.bmd.array.filter(function (obj) {
            return obj.name === params.name;
        });
        if (duplicateCheck.length === 0) {
            var tempBmd = this.game.make.bitmapData(params.width, params.height);
            var grd = tempBmd.context.createLinearGradient(0, 0, 0, params.height);
            grd.addColorStop(0, params.start);
            grd.addColorStop(1, params.end);
            tempBmd.context.fillStyle = grd;
            tempBmd.context.fillRect(0, 0, params.width, params.height);
            var cacheRef = this.game.cache.addBitmapData(params.name, tempBmd);
            var newBmd = this.game.make.bitmapData();
            newBmd.load(this.game.cache.getBitmapData(params.name));
            if (params.render) {
                newBmd.addToWorld(params.x, params.y);
            }
            newBmd.name = params.name;
            newBmd.group = params.group;
            newBmd.cacheBitmapData = cacheRef;
            this.bmd.array.push(newBmd);
            this.bmd.object[params.name] = newBmd;
            return newBmd;
        }
        else {
            console.log("Duplicate key name not allowed: " + params.name);
        }
    };
    PHASER_BITMAPDATA_MANAGER.prototype.addImage = function (params) {
        var duplicateCheck = this.bmd.array.filter(function (obj) {
            return obj.name === params.name;
        });
        if (duplicateCheck.length === 0) {
            var newBmd = this.game.make.bitmapData();
            newBmd.load(params.reference);
            newBmd.addToWorld(params.x, params.y);
            if (!params.render) {
                newBmd.cls();
            }
            newBmd.name = params.name;
            newBmd.group = params.group;
            newBmd.cacheBitmapData = params.reference;
            this.bmd.array.push(newBmd);
            this.bmd.object[params.name] = newBmd;
            return newBmd;
        }
        else {
            console.log("Duplicate key name not allowed: " + params.name);
        }
    };
    PHASER_BITMAPDATA_MANAGER.prototype.addEmpty = function (params) {
        var duplicateCheck = this.bmd.array.filter(function (obj) {
            return obj.name === params.name;
        });
        if (duplicateCheck.length === 0) {
            var newBmd = this.game.make.bitmapData(params.width, params.height);
            newBmd.addToWorld(params.x, params.y);
            if (!params.render) {
                newBmd.cls();
            }
            newBmd.name = params.name;
            newBmd.group = params.group;
            this.bmd.array.push(newBmd);
            this.bmd.object[params.name] = newBmd;
            return newBmd;
        }
        else {
            console.log("Duplicate key name not allowed: " + params.name);
        }
    };
    PHASER_BITMAPDATA_MANAGER.prototype.destroy = function (name) {
        var deleted = [];
        var destroyArray = this.bmd.array.filter(function (item) {
            return item.name === name;
        });
        for (var _i = 0, destroyArray_1 = destroyArray; _i < destroyArray_1.length; _i++) {
            var obj = destroyArray_1[_i];
            deleted.push(obj.name);
            obj.destroy();
        }
        delete this.bmd.object[name];
        this.bmd.array = this.bmd.array.filter(function (item) {
            return item.name !== name;
        });
        return deleted;
    };
    PHASER_BITMAPDATA_MANAGER.prototype.destroyGroup = function (key) {
        var deleted = [];
        var destroyArray = this.bmd.array.filter(function (item) {
            return item.group === name;
        });
        for (var _i = 0, destroyArray_2 = destroyArray; _i < destroyArray_2.length; _i++) {
            var obj = destroyArray_2[_i];
            deleted.push(obj.name);
            obj.destroy();
        }
        delete this.bmd.object[name];
        this.bmd.array = this.bmd.array.filter(function (item) {
            return item.group !== name;
        });
        return deleted;
    };
    PHASER_BITMAPDATA_MANAGER.prototype.get = function (name) {
        return this.bmd.object[name];
    };
    PHASER_BITMAPDATA_MANAGER.prototype.getGroup = function (name) {
        return this.bmd.array.filter(function (item) {
            return item.group === name;
        });
    };
    PHASER_BITMAPDATA_MANAGER.prototype.getAll = function (type) {
        if (type === void 0) { type = 'BOTH'; }
        if (type === 'ARRAY') {
            return this.bmd.array;
        }
        if (type == 'OBJECT') {
            return this.bmd.object;
        }
        return { object: this.bmd.object, array: this.bmd.array };
    };
    PHASER_BITMAPDATA_MANAGER.prototype.takeSnapshot = function () {
        return this.game.canvas.toDataURL();
    };
    return PHASER_BITMAPDATA_MANAGER;
}());
var PHASER_BUTTON_MANAGER = (function () {
    function PHASER_BUTTON_MANAGER() {
        this.game = null;
        this.resources = {
            array: [],
            object: {}
        };
    }
    PHASER_BUTTON_MANAGER.prototype.assign = function (game) {
        this.game = game.game;
    };
    PHASER_BUTTON_MANAGER.prototype.add = function (params) {
        var duplicateCheck = this.resources.array.filter(function (sprite) {
            return sprite.name === params.name;
        });
        if (duplicateCheck.length === 0) {
            var newSprite = this.game.add.button(params.x, params.y, params.reference, params.onclick);
            newSprite.name = params.name;
            newSprite.group = params.group || null;
            this.resources.array.push(newSprite);
            this.resources.object[params.name] = newSprite;
            return newSprite;
        }
        else {
            console.log("Duplicate key name not allowed: " + params.name);
        }
    };
    PHASER_BUTTON_MANAGER.prototype.destroy = function (key) {
        var keys = [];
        var deleteSpriteArray = this.resources.array.filter(function (sprite) {
            return sprite.key === key;
        });
        for (var _i = 0, deleteSpriteArray_1 = deleteSpriteArray; _i < deleteSpriteArray_1.length; _i++) {
            var sprite = deleteSpriteArray_1[_i];
            keys.push(sprite.key);
            sprite.destroy();
        }
        delete this.resources.object[key];
        this.resources.array = this.resources.array.filter(function (sprite) {
            return sprite.key !== key;
        });
        return keys;
    };
    PHASER_BUTTON_MANAGER.prototype.destroyGroup = function (group) {
        var keys = [];
        var deleteSpriteArray = this.resources.array.filter(function (sprite) {
            return sprite.group === group;
        });
        for (var _i = 0, deleteSpriteArray_2 = deleteSpriteArray; _i < deleteSpriteArray_2.length; _i++) {
            var sprite = deleteSpriteArray_2[_i];
            keys.push(sprite.key);
            sprite.destroy();
        }
        delete this.resources.object[group];
        this.resources.array = this.resources.array.filter(function (sprite) {
            return sprite.group !== group;
        });
        return keys;
    };
    PHASER_BUTTON_MANAGER.prototype.get = function (key) {
        return this.resources.object[key];
    };
    PHASER_BUTTON_MANAGER.prototype.getGroup = function (key) {
        return this.resources.array.filter(function (sprite) {
            return sprite.group === key;
        });
    };
    PHASER_BUTTON_MANAGER.prototype.getAll = function (type) {
        if (type === void 0) { type = 'BOTH'; }
        if (type === 'ARRAY') {
            return this.resources.array;
        }
        if (type == 'OBJECT') {
            return this.resources.object;
        }
        return { object: this.resources.object, array: this.resources.array };
    };
    return PHASER_BUTTON_MANAGER;
}());
var PHASER_CONTROLS = (function () {
    function PHASER_CONTROLS() {
        this.IO = null;
        this.game = null;
        this.buttonSensitivity = { QUICK: 1, SHORT: 50, LONG: 150, SUPERLONG: 300 };
        this.releasedKeys = [];
        this.properties = {
            isReady: false,
            allowDebugger: true,
            buttonDelay: 50,
            timingRefreshRate: 1
        };
        this.directionalButtons = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        this.actionButtons = ['A', 'B', 'X', 'Y'];
        this.triggerButtons = ['L1', 'L2', 'R1', 'R2', 'L3', 'R3'];
        this.systemButtons = ['START', 'BACK'];
        this.buttonArray = this.directionalButtons.concat(this.actionButtons, this.triggerButtons, this.systemButtons);
        this.buttonMap = {
            UP: { name: 'UP', code: 'ArrowUp' },
            DOWN: { name: 'DOWN', code: 'ArrowDown' },
            LEFT: { name: 'LEFT', code: 'ArrowLeft' },
            RIGHT: { name: 'RIGHT', code: 'ArrowRight' },
            A: { name: 'A', code: 'KeyA' },
            B: { name: 'S', code: 'KeyS' },
            X: { name: 'D', code: 'KeyD' },
            Y: { name: 'F', code: 'KeyF' },
            L1: { name: 'Q', code: 'KeyQ' },
            L2: { name: 'W', code: 'KeyW' },
            R1: { name: 'E', code: 'KeyE' },
            R2: { name: 'R', code: 'KeyR' },
            L3: { name: 'O', code: 'KeyO' },
            R3: { name: 'P', code: 'KeyP' },
            START: { name: 'ENTER', code: 'Enter' },
            BACK: { name: 'BACKSPACE', code: 'Backspace' },
        };
        this.buttonMapId = {
            UP: 1,
            DOWN: 2,
            LEFT: 3,
            RIGHT: 4,
            A: 5,
            B: 6,
            X: 7,
            Y: 8,
            L1: 9,
            L2: 10,
            R1: 11,
            R2: 12,
            L3: 13,
            R3: 14,
            START: 15,
            BACK: 16,
        };
        this.disabledButtons = {
            ALL: false,
            DIRECTIONAL: false,
            TRIGGER: false,
            ACTION: false,
            SYSTEM: false
        };
        this.debugger = {
            enabled: false,
            text: {}
        };
        this.inputDelay = {
            delay: Array.apply(null, Array(20)).map(function () { return 0; })
        };
    }
    PHASER_CONTROLS.prototype.assign = function (game) {
        var _this = this;
        this.game = game;
        var style = { font: "12px Courier New", fill: "#fff", align: "left" };
        this.buttonArray.forEach(function (btn, index) {
            _this.debugger.text[btn] = null;
            _this.debugger.text[btn] = game.add.text(10, 10 + (index * 15), "", style);
            _this.disabledButtons[btn] = false;
        });
        var IO = {
            buttons: {},
            sensitivityPress: {},
            sensitivityBuffer: {},
            state: {}
        };
        var _loop_5 = function (btn) {
            IO.buttons[btn] = game.input.keyboard.addKey(Phaser.Keyboard[this_1.buttonMap[btn].name]);
            IO.sensitivityPress[btn] = null;
            IO.sensitivityBuffer[btn] = 0;
            IO.state[btn] = function () {
                return _this.getBtnPressType(_this.IO.sensitivityBuffer[btn]);
            };
        };
        var this_1 = this;
        for (var _i = 0, _a = this.buttonArray; _i < _a.length; _i++) {
            var btn = _a[_i];
            _loop_5(btn);
        }
        var _loop_6 = function (btn) {
            IO.buttons[btn].onDown.add(function (e) {
                clearInterval(IO.sensitivityPress[btn]);
                var btnType, btnName;
                var buttonTypes = ['DIRECTIONAL', 'ACTION', 'TRIGGER', 'SYSTEM'];
                Object.keys(_this.buttonMap).forEach(function (key, value) {
                    if (_this.buttonMap[key].code === e.event.code) {
                        for (var _i = 0, buttonTypes_1 = buttonTypes; _i < buttonTypes_1.length; _i++) {
                            var _type = buttonTypes_1[_i];
                            if (_this[_type.toLowerCase() + "Buttons"].indexOf(key) + 1) {
                                btnType = _type;
                                btnName = key;
                            }
                        }
                    }
                });
                var isDisabled = false;
                if (_this.disabledButtons.ALL) {
                    isDisabled = true;
                }
                for (var _i = 0, buttonTypes_2 = buttonTypes; _i < buttonTypes_2.length; _i++) {
                    var name_1 = buttonTypes_2[_i];
                    if (_this.disabledButtons[name_1] && btnType === name_1) {
                        isDisabled = true;
                    }
                }
                Object.keys(_this.buttonMap).forEach(function (key, value) {
                    if (_this.disabledButtons[key] && btnName === key) {
                        isDisabled = true;
                    }
                });
                if (!isDisabled) {
                    IO.sensitivityPress[btn] = setInterval(function () {
                        IO.sensitivityBuffer[btn] += 1;
                    }, _this.properties.timingRefreshRate);
                }
            }, this_2);
        };
        var this_2 = this;
        for (var _b = 0, _c = this.buttonArray; _b < _c.length; _b++) {
            var btn = _c[_b];
            _loop_6(btn);
        }
        game.input.keyboard.onUpCallback = function (e) {
            for (var _i = 0, _a = _this.buttonArray; _i < _a.length; _i++) {
                var btn = _a[_i];
                if (e.code === _this.buttonMap[btn].code) {
                    _this.releasedKeys.push(_this.buttonMap[btn].code);
                    setTimeout(function () {
                        _this.releasedKeys.shift();
                    }, 1500);
                    clearInterval(IO.sensitivityPress[btn]);
                    IO.sensitivityBuffer[btn] = 0;
                }
            }
            if (e.code === 'Backquote' && _this.properties.allowDebugger) {
                _this.setDebugger(!_this.debugger.enabled);
                _this.updateDebugger();
            }
        };
        this.properties.isReady = true;
        this.IO = IO;
        return IO;
    };
    PHASER_CONTROLS.prototype.mapKeys = function (map) {
        var _this = this;
        this.properties.isReady = false;
        this.destroyAll();
        setTimeout(function () {
            _this.buttonMap = map;
            _this.properties.isReady = true;
            _this.assign(_this.game);
        }, 1);
    };
    PHASER_CONTROLS.prototype.isReady = function () {
        return this.properties.isReady;
    };
    PHASER_CONTROLS.prototype.checkWithDelay = function (params) {
        if (this.read(params.key).active === params.isActive) {
            if (this.game.time.now > this.inputDelay.delay[this.getKeyId(params.key)]) {
                this.inputDelay.delay[this.getKeyId(params.key)] = params.delay + this.game.time.now;
                return true;
            }
            else {
                return false;
            }
        }
        return false;
    };
    PHASER_CONTROLS.prototype.isDebuggerEnabled = function () {
        return this.debugger.enabled;
    };
    PHASER_CONTROLS.prototype.setDebugger = function (state) {
        if (state === void 0) { state = true; }
        this.debugger.enabled = state;
    };
    PHASER_CONTROLS.prototype.updateDebugger = function () {
        if (this.properties.isReady) {
            for (var _i = 0, _a = this.buttonArray; _i < _a.length; _i++) {
                var btn = _a[_i];
                this.debugger.text[btn].setText(this.debugger.enabled ? this.debuggerString(btn) : '').bringToTop();
            }
        }
    };
    PHASER_CONTROLS.prototype.disableAllInput = function () {
        this.disabledButtons.ALL = true;
    };
    PHASER_CONTROLS.prototype.enableAllInput = function () {
        this.disabledButtons.ALL = false;
    };
    PHASER_CONTROLS.prototype.disableAllDirectionalButtons = function () {
        this.disabledButtons.DIRECTIONAL = true;
    };
    PHASER_CONTROLS.prototype.enableAllDirectionalButtons = function () {
        this.disabledButtons.DIRECTIONAL = false;
    };
    PHASER_CONTROLS.prototype.disableAllTriggerButtons = function () {
        this.disabledButtons.TRIGGER = true;
    };
    PHASER_CONTROLS.prototype.enableAllTriggerButtons = function () {
        this.disabledButtons.TRIGGER = false;
    };
    PHASER_CONTROLS.prototype.disableAllActionButtons = function () {
        this.disabledButtons.ACTION = true;
    };
    PHASER_CONTROLS.prototype.enableAllActionButtons = function () {
        this.disabledButtons.ACTION = false;
    };
    PHASER_CONTROLS.prototype.disableAllSystemButtons = function () {
        this.disabledButtons.SYSTEM = true;
    };
    PHASER_CONTROLS.prototype.enableAllSystemButtons = function () {
        this.disabledButtons.SYSTEM = false;
    };
    PHASER_CONTROLS.prototype.setDisableKeyProperty = function (name, value) {
        if (value === void 0) { value = true; }
        if (this.properties.isReady) {
            this.disabledButtons[name.toUpperCase()] = value;
        }
    };
    PHASER_CONTROLS.prototype.getKeyDisabledValue = function (name) {
        if (this.properties.isReady) {
            return this.disabledButtons[name.toUpperCase()];
        }
        else {
            return null;
        }
    };
    PHASER_CONTROLS.prototype.clearAllControlIntervals = function () {
        if (this.properties.isReady) {
            for (var _i = 0, _a = this.buttonArray; _i < _a.length; _i++) {
                var btn = _a[_i];
                clearInterval(this.IO.sensitivityPress[btn]);
            }
        }
    };
    PHASER_CONTROLS.prototype.getKeyId = function (key) {
        return this.buttonMapId[key.toUpperCase()];
    };
    PHASER_CONTROLS.prototype.read = function (key) {
        if (this.properties.isReady) {
            var _return = {};
            return _return[key] = { id: this.buttonMapId[key.toUpperCase()], active: this.IO.state[key.toUpperCase()]().val > 0 ? true : false, duration: this.IO.state[key.toUpperCase()]().val, state: this.IO.state[key.toUpperCase()]().state, type: this.IO.state[key.toUpperCase()]().type, disabled: this.disabledButtons[key.toUpperCase()] };
        }
        return {};
    };
    PHASER_CONTROLS.prototype.readMulti = function (keys, returnAs) {
        if (returnAs === void 0) { returnAs = 'OBJECT'; }
        if (this.properties.isReady) {
            if (returnAs === 'OBJECT') {
                var _return = {};
                for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                    var key = keys_1[_i];
                    _return[key] = { id: this.buttonMapId[key.toUpperCase()], active: this.IO.state[key.toUpperCase()]().val > 0 ? true : false, duration: this.IO.state[key.toUpperCase()]().val, state: this.IO.state[key.toUpperCase()]().state, type: this.IO.state[key.toUpperCase()]().type, disabled: this.disabledButtons[key.toUpperCase()] };
                }
                return _return;
            }
            if (returnAs === 'ARRAY') {
                var _return = [];
                for (var _a = 0, keys_2 = keys; _a < keys_2.length; _a++) {
                    var key = keys_2[_a];
                    _return.push({ id: this.buttonMapId[key.toUpperCase()], key: key, active: this.IO.state[key.toUpperCase()]().val > 0 ? true : false, duration: this.IO.state[key.toUpperCase()]().val, state: this.IO.state[key.toUpperCase()]().state, type: this.IO.state[key.toUpperCase()]().type, disabled: this.disabledButtons[key.toUpperCase()] });
                }
                return _return;
            }
        }
    };
    PHASER_CONTROLS.prototype.getReleasedKeys = function () {
        return this.releasedKeys;
    };
    PHASER_CONTROLS.prototype.getOnly = function (names) {
        var _this = this;
        var _return = {};
        var _loop_7 = function (key) {
            names.map(function (name) {
                if (key === name) {
                    _return[key] = { id: _this.buttonMapId[key.toUpperCase()], active: _this.IO.state[key.toUpperCase()]().val > 0 ? true : false, duration: _this.IO.state[key.toUpperCase()]().val, state: _this.IO.state[key.toUpperCase()]().state, type: _this.IO.state[key.toUpperCase()]().type, disabled: _this.disabledButtons[key.toUpperCase()] };
                }
            });
        };
        for (var _i = 0, _a = this.buttonArray; _i < _a.length; _i++) {
            var key = _a[_i];
            _loop_7(key);
        }
        return _return;
    };
    PHASER_CONTROLS.prototype.getAll = function () {
        var _return = {};
        for (var _i = 0, _a = this.buttonArray; _i < _a.length; _i++) {
            var key = _a[_i];
            _return[key] = { id: this.buttonMapId[key.toUpperCase()], active: this.IO.state[key.toUpperCase()]().val > 0 ? true : false, duration: this.IO.state[key.toUpperCase()]().val, state: this.IO.state[key.toUpperCase()]().state, type: this.IO.state[key.toUpperCase()]().type, disabled: this.disabledButtons[key.toUpperCase()] };
        }
        return _return;
    };
    PHASER_CONTROLS.prototype.debuggerString = function (key) {
        return key.toUpperCase() + " (" + this.buttonMap[key.toUpperCase()].name + "/" + this.buttonMap[key.toUpperCase()].code + ") | id: " + this.buttonMapId[key.toUpperCase()] + " duration: " + this.IO.state[key.toUpperCase()]().val + " | state: " + this.IO.state[key.toUpperCase()]().state + " | type: " + this.IO.state[key.toUpperCase()]().type + " | disabled: " + this.disabledButtons[key.toUpperCase()];
    };
    PHASER_CONTROLS.prototype.getBtnPressType = function (val) {
        var _this = this;
        var _type = 'NONE', _state = 0, state = 0;
        Object.keys(this.buttonSensitivity).forEach(function (key) {
            state++;
            if (val > _this.buttonSensitivity[key]) {
                _type = key;
                _state = state;
            }
        });
        return { val: val, type: _type, state: _state };
    };
    PHASER_CONTROLS.prototype.destroyAll = function () {
        var _this = this;
        this.clearAllControlIntervals();
        Object.keys(this.debugger.text).forEach(function (key) {
            _this.debugger.text[key].destroy();
        });
    };
    return PHASER_CONTROLS;
}());
var PHASER_GROUP_MANAGER = (function () {
    function PHASER_GROUP_MANAGER() {
        this.game = null;
        this.group = {
            array: [],
            object: {}
        };
    }
    PHASER_GROUP_MANAGER.prototype.assign = function (game, layers) {
        if (layers === void 0) { layers = 10; }
        this.game = game;
        for (var i = 0; i <= layers; i++) {
            var layer = game.add.group();
            this.group.object["" + i] = layer;
            this.group.array.push(layer);
        }
    };
    PHASER_GROUP_MANAGER.prototype.layer = function (key) {
        return this.group.object[key];
    };
    PHASER_GROUP_MANAGER.prototype.add = function (key, item) {
        this.group.object[key].add(item);
    };
    PHASER_GROUP_MANAGER.prototype.addMany = function (key, list) {
        var _this = this;
        list.forEach(function (item) {
            _this.group.object[key].add(item);
        });
    };
    return PHASER_GROUP_MANAGER;
}());
var PHASER_MASTER = (function () {
    function PHASER_MASTER(params) {
        var _this = this;
        this._game = params.game;
        this.resolution = params.resolution;
        this.states = {
            BOOT: 'BOOT',
            PRELOAD: 'PRELOAD',
            READY: 'READY',
        };
        this.currentState = this.states[0];
        this.variables = {};
        setTimeout(function () {
            _this._game.time.pausedTimeTotal = 0;
            _this._game.time.addToPausedTime = function (duration) {
                _this._game.time.pausedTimeTotal += duration;
            };
            _this._game.time.returnTrueTime = function () {
                return (_this._game.time.now - _this._game.time.pausedTimeTotal);
            };
        }, 1);
    }
    PHASER_MASTER.prototype.let = function (key, value) {
        if (value === void 0) { value = null; }
        if ((this.variables[key] === undefined)) {
            return this.variables[key] = value;
        }
        else {
            console.log("Cannot LET duplicate key in PHASER_MASTER: " + key);
        }
    };
    PHASER_MASTER.prototype.forceLet = function (key, value) {
        if (value === void 0) { value = null; }
        return this.variables[key] = value;
    };
    PHASER_MASTER.prototype.delete = function (key) {
        delete this.variables[key];
    };
    PHASER_MASTER.prototype.get = function (key) {
        if (this.variables[key] !== undefined) {
            return this.variables[key];
        }
        else {
            console.log("Cannot GET a variable that does not exist in PHASER_MASTER.");
            return null;
        }
    };
    PHASER_MASTER.prototype.getAll = function () {
        return this.variables;
    };
    PHASER_MASTER.prototype.getOnly = function (names) {
        var _return = {};
        var toArray = [];
        for (var key in this.variables) {
            toArray.push({ key: key, data: this.variables[key] });
        }
        var _loop_8 = function (i) {
            var _r = toArray.filter(function (obj) {
                return obj.key === names[i];
            });
            _r.map(function (obj) {
                _return[obj.key] = obj.data;
            });
        };
        for (var i = 0; i < names.length; i++) {
            _loop_8(i);
        }
        return _return;
    };
    PHASER_MASTER.prototype.changeState = function (state) {
        if (state === void 0) { state = null; }
        var _state = state.toUpperCase();
        var create = false;
        if (this.states[_state] === undefined) {
            this.states[_state] = _state;
            create = true;
        }
        this.currentState = _state;
        return { created: create, state: this.currentState };
    };
    PHASER_MASTER.prototype.getCurrentState = function () {
        return this.currentState;
    };
    PHASER_MASTER.prototype.getStates = function () {
        return this.states;
    };
    PHASER_MASTER.prototype.getResolution = function () {
        return this.resolution;
    };
    PHASER_MASTER.prototype.checkState = function (state) {
        return this.currentState === state.toUpperCase() ? true : false;
    };
    PHASER_MASTER.prototype.getState = function () {
        var _return = { currentState: this.currentState };
        return _return;
    };
    PHASER_MASTER.prototype.game = function () {
        return this._game;
    };
    return PHASER_MASTER;
}());
var PHASER_MOUSE = (function () {
    function PHASER_MOUSE(params) {
        this.game = null;
        this.clickSensitvity = { QUICK: 1, SHORT: 50, LONG: 150, SUPERLONG: 300 };
        this.mouseMapping = [0, 1, 2];
        this.mouseMap = {
            LEFT: 0,
            MIDDLE: 1,
            RIGHT: 2
        };
        this.metrics = {
            sensitivityPress: {},
            sensitivityBuffer: {},
            location: {},
            state: {}
        };
        this.properties = {
            allowDebugger: true,
            timingRefreshRate: 1
        };
        this.inputDelay = {
            delay: Array.apply(null, Array(2)).map(function () { return 0; })
        };
        this.debugger = {
            enabled: params.showDebugger === undefined ? false : params.showDebugger,
            text: {},
            pointer: null
        };
    }
    PHASER_MOUSE.prototype.assign = function (game) {
        var _this = this;
        this.game = game;
        var _loop_9 = function (key) {
            this_3.metrics.sensitivityPress[key] = null;
            this_3.metrics.sensitivityBuffer[key] = 0;
            this_3.metrics.location[key] = { x: null, y: null };
            this_3.metrics.state[key] = function () {
                return _this.getBtnPressType(_this.metrics.sensitivityBuffer[key]);
            };
        };
        var this_3 = this;
        for (var _i = 0, _a = this.mouseMapping; _i < _a.length; _i++) {
            var key = _a[_i];
            _loop_9(key);
        }
        this.game.input.onDown.add(function (e) {
            var mouseKey = _this.checkMouseClick();
            clearInterval(_this.metrics.sensitivityPress[mouseKey]);
            _this.metrics.sensitivityPress[mouseKey] = setInterval(function () {
                _this.metrics.sensitivityBuffer[mouseKey] += 1;
                _this.metrics.location[mouseKey] = { x: e.x, y: e.y };
            }, _this.properties.timingRefreshRate);
        });
        this.game.input.onUp.add(function (e) {
            var mouseKey = _this.checkMouseClick();
            _this.clearAllControlIntervals();
            _this.metrics.sensitivityBuffer[mouseKey] = 0;
        });
        var style = { font: "12px Courier New", fill: "#fff", align: "left" };
        this.mouseMapping.forEach(function (btn, index) {
            _this.debugger.text[btn] = null;
            _this.debugger.text[btn] = _this.game.add.text(5, _this.game.height - 35 - (index * 15), "", style);
        });
        this.debugger.pointer = this.game.add.text(5, this.game.height - 20, "", style);
        game.canvas.oncontextmenu = function (e) { e.preventDefault(); };
    };
    PHASER_MOUSE.prototype.checkMouseClick = function () {
        var mouseKey = 0;
        if (this.game.input.activePointer.leftButton.isDown) {
            mouseKey = 0;
        }
        if (this.game.input.activePointer.middleButton.isDown) {
            mouseKey = 1;
        }
        if (this.game.input.activePointer.rightButton.isDown) {
            mouseKey = 2;
        }
        return mouseKey;
    };
    PHASER_MOUSE.prototype.debuggerString = function (mouseKey) {
        return "Button_" + mouseKey + " | {x: " + this.metrics.location[mouseKey].x + ", y: " + this.metrics.location[mouseKey].y + "} | active: " + (this.metrics.sensitivityBuffer[mouseKey] > 0 ? true : false) + " | state: " + this.metrics.state[mouseKey]().state + " | duration: " + this.metrics.state[mouseKey]().val + " | type: " + this.metrics.state[mouseKey]().type;
    };
    PHASER_MOUSE.prototype.setDebugger = function (state) {
        if (state === void 0) { state = true; }
        this.debugger.enabled = state;
    };
    PHASER_MOUSE.prototype.updateDebugger = function () {
        for (var _i = 0, _a = this.mouseMapping; _i < _a.length; _i++) {
            var btn = _a[_i];
            this.debugger.text[btn].setText(this.debugger.enabled ? this.debuggerString(btn) : '').bringToTop();
        }
        this.debugger.pointer.setText(this.debugger.enabled ? "Pointer: {x: " + this.game.input.mousePointer.x + ", y: " + this.game.input.mousePointer.y + "}" : '').bringToTop();
    };
    PHASER_MOUSE.prototype.clearAllControlIntervals = function () {
        for (var _i = 0, _a = this.mouseMapping; _i < _a.length; _i++) {
            var key = _a[_i];
            this.metrics.sensitivityBuffer[key] = 0;
            clearInterval(this.metrics.sensitivityPress[key]);
        }
    };
    PHASER_MOUSE.prototype.checkWithDelay = function (params) {
        if (this.read(params.key).active === params.isActive) {
            var mouseKey = this.mouseMap[params.key.toUpperCase()];
            if (this.game.time.now > this.inputDelay.delay[mouseKey]) {
                this.inputDelay.delay[mouseKey] = params.delay + this.game.time.now;
                return true;
            }
            else {
                return false;
            }
        }
        return false;
    };
    PHASER_MOUSE.prototype.read = function (key) {
        if (key === void 0) { key = 'LEFT'; }
        var mouseKey = this.mouseMap[key.toUpperCase()];
        return {
            id: mouseKey,
            x: this.metrics.location[mouseKey].x,
            y: this.metrics.location[mouseKey].y,
            active: this.metrics.sensitivityBuffer[mouseKey] > 0 ? true : false,
            duration: this.metrics.sensitivityBuffer[mouseKey],
            state: this.metrics.state[mouseKey]().state,
            type: this.metrics.state[mouseKey]().type
        };
    };
    PHASER_MOUSE.prototype.getBtnPressType = function (val) {
        var _this = this;
        var _type = 'NONE', _state = 0, state = 0;
        Object.keys(this.clickSensitvity).forEach(function (key) {
            state++;
            if (val > _this.clickSensitvity[key]) {
                _type = key;
                _state = state;
            }
        });
        return { val: val, type: _type, state: _state };
    };
    return PHASER_MOUSE;
}());
var PHASER_PRELOADER = (function () {
    function PHASER_PRELOADER(params) {
        this.game = params.game;
        this.init(params.delayInSeconds, params.done);
    }
    PHASER_PRELOADER.prototype.init = function (delay, done) {
        var _this = this;
        var loadingtext, loadingPercentage;
        this.game.load.onLoadStart.add(function () {
            loadingtext = _this.game.add.text(_this.game.world.centerX, _this.game.world.centerY / 2, "", { font: "18px Impact", fill: "#fff", align: "center" });
            loadingtext.anchor.set(0.5);
            loadingPercentage = _this.game.add.text(_this.game.world.centerX, _this.game.world.centerY, "", { font: "32px Impact", fill: "#fff", align: "center" });
            loadingPercentage.anchor.set(0.5);
        }, this);
        this.game.load.onFileComplete.add(function (progress, cacheKey, success, totalLoaded, totalFiles) {
            loadingtext.setText("Please wait...");
            loadingPercentage.setText(progress + "%");
        }, this);
        this.game.load.onLoadComplete.add(function () {
            loadingtext.setText("File loaded!");
            loadingPercentage.setText("");
            _this.game.time.events.add(Phaser.Timer.SECOND * delay, function () {
                loadingtext.destroy();
                loadingPercentage.destroy();
                done();
            }, _this).autoDestroy = true;
        }, this);
    };
    return PHASER_PRELOADER;
}());
var PHASER_SPRITE_MANAGER = (function () {
    function PHASER_SPRITE_MANAGER() {
        this.game = null;
        this.sprites = {
            array: [],
            object: {}
        };
        this.spriteCount = 0;
    }
    PHASER_SPRITE_MANAGER.prototype.assign = function (game) {
        this.game = game;
    };
    PHASER_SPRITE_MANAGER.prototype.add = function (params) {
        var duplicateCheck = this.sprites.array.filter(function (obj) {
            return obj.name === params.name;
        });
        if (duplicateCheck.length === 0) {
            params.x = params.x !== undefined ? params.x : 0;
            params.y = params.y !== undefined ? params.y : 0;
            params.group = params.group !== undefined ? params.group : null;
            params.org = params.org !== undefined ? params.org : null;
            params.visible = params.visible !== undefined ? params.visible : true;
            params.alpha = params.alpha !== undefined ? params.alpha : 1;
            params.width = params.width !== undefined ? params.width : null;
            params.height = params.height !== undefined ? params.height : null;
            var newSprite = this.game.add.sprite(params.x, params.y, params.reference);
            newSprite.name = params.name;
            newSprite.group = params.group;
            newSprite.org = params.org;
            newSprite.defaultPosition = { x: params.x, y: params.y };
            newSprite.visible = params.visible;
            newSprite.alpha = params.alpha;
            if (params.width !== null) {
                newSprite.width = params.width;
            }
            if (params.height !== null) {
                newSprite.height = params.height;
            }
            newSprite.setDefaultPositions = function (x, y) { this.defaultPosition.x = x ? x : this.x, this.defaultPosition.y = y ? y : this.y; };
            newSprite.getDefaultPositions = function () { return this.defaultPosition; };
            newSprite.init = function () { };
            newSprite.onUpdate = function () { };
            newSprite.reveal = function () { };
            newSprite.show = function () {
                this.visible = true;
            };
            newSprite.hide = function () {
                this.visible = false;
            };
            this.sprites.array.push(newSprite);
            this.sprites.object[params.name] = newSprite;
            return newSprite;
        }
        else {
            console.log("Duplicate key name not allowed: " + params.name);
        }
    };
    PHASER_SPRITE_MANAGER.prototype.addFromAtlas = function (params) {
        var duplicateCheck = this.sprites.array.filter(function (obj) {
            return obj.name === params.name;
        });
        if (duplicateCheck.length === 0) {
            params.x = params.x !== undefined ? params.x : 0;
            params.y = params.y !== undefined ? params.y : 0;
            params.group = params.group !== undefined ? params.group : null;
            params.org = params.org !== undefined ? params.org : null;
            params.visible = params.visible !== undefined ? params.visible : true;
            params.alpha = params.alpha !== undefined ? params.alpha : 1;
            params.width = params.width !== undefined ? params.width : null;
            params.height = params.height !== undefined ? params.height : null;
            var newSprite = this.game.add.sprite(params.x, params.y, params.atlas, params.filename);
            newSprite.name = params.name;
            newSprite.group = params.group;
            newSprite.org = params.org;
            newSprite.defaultPosition = { x: params.x, y: params.y };
            newSprite.visible = params.visible;
            newSprite.alpha = params.alpha;
            if (params.width !== null) {
                newSprite.width = params.width;
            }
            if (params.height !== null) {
                newSprite.height = params.height;
            }
            newSprite.setDefaultPositions = function (x, y) { this.defaultPosition.x = x ? x : this.x, this.defaultPosition.y = y ? y : this.y; };
            newSprite.getDefaultPositions = function () { return this.defaultPosition; };
            newSprite.init = function () { };
            newSprite.onUpdate = function () { };
            newSprite.reveal = function () { };
            newSprite.show = function () {
                this.visible = true;
            };
            newSprite.hide = function () {
                this.visible = false;
            };
            this.sprites.array.push(newSprite);
            this.sprites.object[params.name] = newSprite;
            return newSprite;
        }
        else {
            console.log("Duplicate key name not allowed: " + params.name);
        }
    };
    PHASER_SPRITE_MANAGER.prototype.addTilespriteFromAtlas = function (params) {
        var duplicateCheck = this.sprites.array.filter(function (obj) {
            return obj.name === params.name;
        });
        if (duplicateCheck.length === 0) {
            params.x = params.x !== undefined ? params.x : 0;
            params.y = params.y !== undefined ? params.y : 0;
            params.group = params.group !== undefined ? params.group : null;
            params.org = params.org !== undefined ? params.org : null;
            params.visible = params.visible !== undefined ? params.visible : true;
            params.alpha = params.alpha !== undefined ? params.alpha : 1;
            params.width = params.width !== undefined ? params.width : null;
            params.height = params.height !== undefined ? params.height : null;
            var newSprite = this.game.add.tileSprite(params.x, params.y, params.width, params.height, params.atlas, params.filename);
            newSprite.name = params.name;
            newSprite.group = params.group;
            newSprite.org = params.org;
            newSprite.defaultPosition = { x: params.x, y: params.y };
            newSprite.visible = params.visible;
            newSprite.alpha = params.alpha;
            if (params.width !== null) {
                newSprite.width = params.width;
            }
            if (params.height !== null) {
                newSprite.height = params.height;
            }
            newSprite.setDefaultPositions = function (x, y) { this.defaultPosition.x = x ? x : this.x, this.defaultPosition.y = y ? y : this.y; };
            newSprite.getDefaultPositions = function () { return this.defaultPosition; };
            newSprite.init = function () { };
            newSprite.onUpdate = function () { };
            newSprite.reveal = function () { };
            newSprite.show = function () {
                this.visible = true;
            };
            newSprite.hide = function () {
                this.visible = false;
            };
            this.sprites.array.push(newSprite);
            this.sprites.object[params.name] = newSprite;
            return newSprite;
        }
        else {
            console.log("Duplicate key name not allowed: " + params.name);
        }
    };
    PHASER_SPRITE_MANAGER.prototype.addEmptySprite = function (params) {
        var duplicateCheck = this.sprites.array.filter(function (obj) {
            return obj.name === params.name;
        });
        if (duplicateCheck.length === 0) {
            params.x = params.x !== undefined ? params.x : 0;
            params.y = params.y !== undefined ? params.y : 0;
            params.group = params.group !== undefined ? params.group : null;
            params.org = params.org !== undefined ? params.org : null;
            params.visible = params.visible !== undefined ? params.visible : true;
            params.alpha = params.alpha !== undefined ? params.alpha : 1;
            params.width = params.width !== undefined ? params.width : null;
            params.height = params.height !== undefined ? params.height : null;
            var newSprite = this.game.add.sprite(params.x, params.y);
            newSprite.name = params.name;
            newSprite.group = params.group;
            newSprite.org = params.org;
            newSprite.defaultPosition = { x: params.x, y: params.y };
            newSprite.visible = params.visible;
            newSprite.alpha = params.alpha;
            if (params.width !== null) {
                newSprite.width = params.width;
            }
            if (params.height !== null) {
                newSprite.height = params.height;
            }
            newSprite.setDefaultPositions = function (x, y) { this.defaultPosition.x = x ? x : this.x, this.defaultPosition.y = y ? y : this.y; };
            newSprite.getDefaultPositions = function () { return this.defaultPosition; };
            newSprite.init = function () { };
            newSprite.onUpdate = function () { };
            newSprite.reveal = function () { };
            newSprite.show = function () {
                this.visible = true;
            };
            newSprite.hide = function () {
                this.visible = false;
            };
            this.sprites.array.push(newSprite);
            this.sprites.object[params.name] = newSprite;
            return newSprite;
        }
        else {
            console.log("Duplicate key name not allowed: " + params.name);
        }
    };
    PHASER_SPRITE_MANAGER.prototype.createBasicMask = function (x, y, width, height) {
        var mask = this.game.add.graphics(0, 0);
        mask.beginFill(0xffffff);
        mask.drawRect(x, y, width, height);
        return mask;
    };
    PHASER_SPRITE_MANAGER.prototype.addBasicMaskToSprite = function (sprite) {
        var mask = this.game.add.graphics(0, 0);
        mask.beginFill(0xffffff);
        mask.drawRect(sprite.x, sprite.y, sprite.width, sprite.height);
        sprite.mask = mask;
        return mask;
    };
    PHASER_SPRITE_MANAGER.prototype.destroy = function (name) {
        if (this.sprites.object[name] !== undefined) {
            var destroyed = [];
            var deleteArray = this.sprites.array.filter(function (obj) {
                return obj.name === name;
            });
            for (var _i = 0, deleteArray_1 = deleteArray; _i < deleteArray_1.length; _i++) {
                var obj = deleteArray_1[_i];
                destroyed.push(obj.name);
                obj.destroy();
            }
            delete this.sprites.object[name];
            this.sprites.array = this.sprites.array.filter(function (obj) {
                return obj.name !== name;
            });
            return destroyed;
        }
        else {
            console.log("Cannot delete " + name + " because it does not exist.");
            return null;
        }
    };
    PHASER_SPRITE_MANAGER.prototype.destroyGroup = function (name) {
        var destroyed = [];
        var deleteArray = this.sprites.array.filter(function (obj) {
            return obj.group === name;
        });
        for (var _i = 0, deleteArray_2 = deleteArray; _i < deleteArray_2.length; _i++) {
            var sprite = deleteArray_2[_i];
            destroyed.push(sprite.name);
            sprite.destroy();
        }
        delete this.sprites.object[name];
        this.sprites.array = this.sprites.array.filter(function (obj) {
            return obj.group !== name;
        });
        return destroyed;
    };
    PHASER_SPRITE_MANAGER.prototype.get = function (name) {
        return this.sprites.object[name];
    };
    PHASER_SPRITE_MANAGER.prototype.getGroup = function (name) {
        return this.sprites.array.filter(function (obj) {
            return obj.group === name || obj.org === name;
        });
    };
    PHASER_SPRITE_MANAGER.prototype.getManyGroups = function (names) {
        var _return = [];
        var _loop_10 = function (i) {
            var _r = this_4.sprites.array.filter(function (obj) {
                return obj.group === names[i] || obj.org === names[i];
            });
            _return = _return.concat(_r);
        };
        var this_4 = this;
        for (var i = 0; i < names.length; i++) {
            _loop_10(i);
        }
        return _return;
    };
    PHASER_SPRITE_MANAGER.prototype.getOnly = function (names) {
        var _return = {};
        var _loop_11 = function (i) {
            var _r = this_5.sprites.array.filter(function (obj) {
                return obj.group === names[i] || obj.name === names[i];
            });
            _r.map(function (obj) {
                _return[obj.name] = obj;
            });
        };
        var this_5 = this;
        for (var i = 0; i < names.length; i++) {
            _loop_11(i);
        }
        return _return;
    };
    PHASER_SPRITE_MANAGER.prototype.getAll = function (type) {
        if (type === void 0) { type = 'OBJECT'; }
        if (type === 'ARRAY') {
            return this.sprites.array;
        }
        if (type == 'OBJECT') {
            return this.sprites.object;
        }
        return { object: this.sprites.object, array: this.sprites.array };
    };
    PHASER_SPRITE_MANAGER.prototype.count = function () {
        this.spriteCount++;
        return { total: this.sprites.array.length, unique: this.spriteCount };
    };
    PHASER_SPRITE_MANAGER.prototype.centerWorld = function (name) {
        if (this.sprites.object[name] === undefined) {
            console.log('Error centering sprite:  key does not exists.');
            return null;
        }
        var obj = this.sprites.object[name];
        obj.alignIn(this.game.world.bounds, Phaser.CENTER);
        return obj;
    };
    PHASER_SPRITE_MANAGER.prototype.centerOnPoint = function (name, x, y) {
        if (this.sprites.object[name] === undefined) {
            console.log('Error centering sprite:  key does not exists.');
            return null;
        }
        var obj = this.sprites.object[name];
        obj.x = x - (obj.width / 2);
        obj.y = y - (obj.height / 2);
        return obj;
    };
    return PHASER_SPRITE_MANAGER;
}());
var PHASER_TEXT_MANAGER = (function () {
    function PHASER_TEXT_MANAGER() {
        this.game = null;
        this.texts = {
            array: [],
            object: {}
        };
    }
    PHASER_TEXT_MANAGER.prototype.assign = function (game) {
        this.game = game;
    };
    PHASER_TEXT_MANAGER.prototype.add = function (params) {
        var duplicateCheck = this.texts.array.filter(function (obj) {
            return obj.name === params.name;
        });
        params.x = params.x !== undefined ? params.x : 0;
        params.y = params.y !== undefined ? params.y : 0;
        params.group = params.group !== undefined ? params.group : null;
        params.size = params.size !== undefined ? params.size : 12;
        params.default = params.default !== undefined ? params.default : '';
        params.visible = params.visible !== undefined ? params.visible : true;
        params.alpha = params.alpha !== undefined ? params.alpha : 1;
        if (duplicateCheck.length === 0) {
            var newText = this.game.add.bitmapText(params.x, params.y, params.font, params.default, params.size);
            newText.name = params.name;
            newText.group = params.group;
            newText.visible = params.visible;
            newText.alpha = params.alpha;
            newText.init = function () { };
            newText.show = function () {
                this.visible = true;
            };
            newText.hide = function () {
                this.visible = false;
            };
            this.texts.array.push(newText);
            this.texts.object[params.name] = newText;
            return newText;
        }
        else {
            console.log("Duplicate key name not allowed: " + params.name);
        }
    };
    PHASER_TEXT_MANAGER.prototype.destroy = function (name) {
        var destroyArray = [];
        var deleteArray = this.texts.array.filter(function (obj) {
            return obj.name === name;
        });
        for (var _i = 0, deleteArray_3 = deleteArray; _i < deleteArray_3.length; _i++) {
            var text = deleteArray_3[_i];
            destroyArray.push(text.name);
            text.destroy();
        }
        delete this.texts.object[name];
        this.texts.array = this.texts.array.filter(function (obj) {
            return obj.name !== name;
        });
        return destroyArray;
    };
    PHASER_TEXT_MANAGER.prototype.destroyGroup = function (name) {
        var destroyArray = [];
        var deletearray = this.texts.array.filter(function (obj) {
            return obj.group === name;
        });
        for (var _i = 0, deletearray_1 = deletearray; _i < deletearray_1.length; _i++) {
            var text = deletearray_1[_i];
            destroyArray.push(text.key);
            text.destroy();
        }
        delete this.texts.object[name];
        this.texts.array = this.texts.array.filter(function (obj) {
            return obj.group !== name;
        });
        return destroyArray;
    };
    PHASER_TEXT_MANAGER.prototype.get = function (key) {
        return this.texts.object[key];
    };
    PHASER_TEXT_MANAGER.prototype.getGroup = function (key) {
        return this.texts.array.filter(function (obj) {
            return obj.group === key;
        });
    };
    PHASER_TEXT_MANAGER.prototype.getManyGroups = function (names) {
        var _return = [];
        var _loop_12 = function (i) {
            var _r = this_6.texts.array.filter(function (obj) {
                return obj.group === names[i];
            });
            _return = _return.concat(_r);
        };
        var this_6 = this;
        for (var i = 0; i < names.length; i++) {
            _loop_12(i);
        }
        return _return;
    };
    PHASER_TEXT_MANAGER.prototype.getAll = function (type) {
        if (type === void 0) { type = 'OBJECT'; }
        if (type === 'ARRAY') {
            return this.texts.array;
        }
        if (type == 'OBJECT') {
            return this.texts.object;
        }
        return { object: this.texts.object, array: this.texts.array };
    };
    PHASER_TEXT_MANAGER.prototype.getOnly = function (names) {
        var _return = {};
        var _loop_13 = function (i) {
            var _r = this_7.texts.array.filter(function (obj) {
                return obj.group === names[i] || obj.name === names[i];
            });
            _r.map(function (obj) {
                _return[obj.name] = obj;
            });
        };
        var this_7 = this;
        for (var i = 0; i < names.length; i++) {
            _loop_13(i);
        }
        return _return;
    };
    PHASER_TEXT_MANAGER.prototype.alignToBottomLeftCorner = function (name, padding) {
        if (padding === void 0) { padding = 0; }
        if (this.texts.object[name] === undefined) {
            console.log('Error centering sprite:  key does not exists.');
            return null;
        }
        var text = this.texts.object[name], game = this.game;
        text.x = padding;
        text.y = game.canvas.height - text.height - padding;
        return text;
    };
    PHASER_TEXT_MANAGER.prototype.alignToBottomCenter = function (name, padding) {
        if (padding === void 0) { padding = 0; }
        if (this.texts.object[name] === undefined) {
            console.log('Error centering sprite:  key does not exists.');
            return null;
        }
        var text = this.texts.object[name], game = this.game;
        text.x = (game.canvas.width / 2) - (text.width / 2);
        text.y = game.canvas.height - text.height - padding;
        return text;
    };
    PHASER_TEXT_MANAGER.prototype.alignToBottomRightCorner = function (name, padding) {
        if (padding === void 0) { padding = 0; }
        if (this.texts.object[name] === undefined) {
            console.log('Error centering sprite:  key does not exists.');
            return null;
        }
        var text = this.texts.object[name], game = this.game;
        text.x = game.canvas.width - text.width - padding;
        text.y = game.canvas.height - text.height - padding;
        return text;
    };
    PHASER_TEXT_MANAGER.prototype.alignToCenterRight = function (name, padding) {
        if (padding === void 0) { padding = 0; }
        if (this.texts.object[name] === undefined) {
            console.log('Error centering sprite:  key does not exists.');
            return null;
        }
        var text = this.texts.object[name], game = this.game;
        text.x = game.canvas.width - text.width - padding;
        text.y = (game.canvas.height / 2) - (text.height / 2);
        return text;
    };
    PHASER_TEXT_MANAGER.prototype.alignToTopRightCorner = function (name, padding) {
        if (padding === void 0) { padding = 0; }
        if (this.texts.object[name] === undefined) {
            console.log('Error centering sprite:  key does not exists.');
            return null;
        }
        var text = this.texts.object[name], game = this.game;
        text.x = game.canvas.width - text.width - padding;
        text.y = padding;
        return text;
    };
    PHASER_TEXT_MANAGER.prototype.alignToTopCenter = function (name, padding) {
        if (padding === void 0) { padding = 0; }
        if (this.texts.object[name] === undefined) {
            console.log('Error centering sprite:  key does not exists.');
            return null;
        }
        var text = this.texts.object[name], game = this.game;
        text.x = (game.canvas.width / 2) - (text.width / 2) - padding;
        text.y = padding;
        return text;
    };
    PHASER_TEXT_MANAGER.prototype.alignToTopLeftCorner = function (name, padding) {
        if (padding === void 0) { padding = 0; }
        if (this.texts.object[name] === undefined) {
            console.log('Error centering sprite:  key does not exists.');
            return null;
        }
        var text = this.texts.object[name], game = this.game;
        text.x = padding;
        text.y = padding;
        return text;
    };
    PHASER_TEXT_MANAGER.prototype.alignToCenterLeft = function (name, padding) {
        if (padding === void 0) { padding = 0; }
        if (this.texts.object[name] === undefined) {
            console.log('Error centering sprite:  key does not exists.');
            return null;
        }
        var text = this.texts.object[name], game = this.game;
        text.x = padding;
        text.y = (game.canvas.height / 2) - (text.height / 2);
        return text;
    };
    PHASER_TEXT_MANAGER.prototype.alignToCenter = function (name, padding) {
        if (padding === void 0) { padding = 0; }
        if (this.texts.object[name] === undefined) {
            console.log('Error centering sprite:  key does not exists.');
            return null;
        }
        var text = this.texts.object[name], game = this.game;
        text.x = (game.canvas.width / 2) - (text.width / 2);
        text.y = (game.canvas.height / 2) - (text.height / 2);
        return text;
    };
    PHASER_TEXT_MANAGER.prototype.center = function (name, offsetx, offsety) {
        if (offsetx === void 0) { offsetx = 0; }
        if (offsety === void 0) { offsety = 0; }
        if (this.texts.object[name] === undefined) {
            console.log('Error centering sprite:  key does not exists.');
            return null;
        }
        var text = this.texts.object[name], game = this.game;
        text.x = (game.canvas.width / 2) - (text.width / 2) + offsetx;
        text.y = (game.canvas.height / 2) - (text.height / 2) + offsety;
        return text;
    };
    return PHASER_TEXT_MANAGER;
}());
var ENEMY_MANAGER = (function () {
    function ENEMY_MANAGER(params) {
        this.showHitbox = params.showHitbox;
    }
    ENEMY_MANAGER.prototype.assign = function (game, phaserMaster, phaserSprites, phaserTexts, phaserGroup, weaponManager, atlas, atlas_weapons) {
        this.game = game;
        this.phaserSprites = phaserSprites;
        this.phaserMaster = phaserMaster;
        this.phaserTexts = phaserTexts;
        this.phaserGroup = phaserGroup;
        this.weaponManager = weaponManager;
        this.atlas = atlas;
        this.atlas_weapons = atlas_weapons;
    };
    ENEMY_MANAGER.prototype.collisionCheck = function (obj, damage) {
        this.phaserSprites.getManyGroups(['player_hitboxes']).map(function (target) {
            target.game.physics.arcade.overlap(obj, target, function (obj, target) {
                target.parent.takeDamage(damage);
                obj.destroyIt();
            }, null, obj);
        });
    };
    ENEMY_MANAGER.prototype.facePlayer = function (obj) {
        var game = this.game;
        var player = this.phaserSprites.getOnly(['player']).player;
        return Math.ceil((360 / (2 * Math.PI)) * game.math.angleBetween(obj.x, obj.y, player.x, player.y) - 90);
    };
    ENEMY_MANAGER.prototype.bulletCollisionWithPlayer = function (enemy) {
        var targets = this.phaserSprites.getGroup('player_hitboxes').slice();
        var collidables = enemy.collidables.primaryWeapon.slice();
        this.game.physics.arcade.overlap(targets, collidables, function (target, collidable) {
            if (!target.isInvincible && !target.isDead && !target.isDamaged) {
                target.parent.takeDamage(collidable.damgeOnImpact);
                collidable.destroyIt();
            }
        });
    };
    ENEMY_MANAGER.prototype.createSmallEnemy1 = function (options, onDamage, onDestroy, onUpdate) {
        var _this = this;
        if (onDamage === void 0) { onDamage = function () { }; }
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var enemy = phaserSprites.addFromAtlas({ name: "enemy_" + game.rnd.integer(), group: 'enemies', org: 'gameobjects', atlas: atlas, filename: "small_1", visible: true });
        enemy.anchor.setTo(0.5, 0.5);
        enemy.scale.setTo(1, 1);
        enemy.maxHealth = 100;
        enemy.health = enemy.maxHealth;
        enemy.pierceResistence = 1;
        enemy.fallThreshold = game.rnd.integerInRange(0, 75);
        enemy.cosWave = { data: game.math.sinCosGenerator(200, game.world.height * .50, 0, 1).cos, count: 0 };
        enemy.sinWave = { data: game.math.sinCosGenerator(game.rnd.integerInRange(200, 300), game.rnd.integerInRange(0, 1) === 1 ? -50 : 50, 1, 3).sin, count: 0 };
        enemy.fireDelay = 0;
        enemy.fireTimer = 1000;
        enemy.isInvincible = false;
        enemy.isDamaged = false;
        enemy.isDestroyed = false;
        enemy.onLayer = options.layer;
        enemy.weaponSystems = [];
        enemy.collidables = {
            primaryWeapon: [],
            secondaryWeapon: []
        };
        phaserGroup.add(options.layer, enemy);
        var hitboxes = ["small_1_hitbox_1"];
        hitboxes.map(function (obj) {
            var e_hitbox = phaserSprites.addFromAtlas({ name: "enemy_hitbox_" + game.rnd.integer(), group: 'enemy_hitboxes', atlas: atlas, filename: obj, alpha: _this.showHitbox ? 0.75 : 0 });
            e_hitbox.anchor.setTo(0.5, 0.5);
            game.physics.enable(e_hitbox, Phaser.Physics.ARCADE);
            enemy.addChild(e_hitbox);
        });
        var ammo = this.weaponManager.enemyBullet(3);
        ammo.bulletSpeedVariance = 100;
        ammo.bulletAngleVariance = 20;
        ammo.bullets.children.map(function (bullet) {
            bullet.damgeOnImpact = 10;
        });
        var animationSprites = Phaser.Animation.generateFrameNames('bullet_fire_', 1, 4).slice();
        var weaponSystem = this.phaserSprites.addFromAtlas({ name: "enemy_weapons_" + this.game.rnd.integer(), group: 'enemy_weapons', atlas: this.atlas_weapons, filename: animationSprites[0], visible: true });
        weaponSystem.anchor.setTo(0.5, 0.5);
        weaponSystem.angle = 180;
        weaponSystem.animations.add('fireWeapon', animationSprites, 1, true);
        weaponSystem.sync = function (enemy) {
            var x = enemy.x, y = enemy.y;
            weaponSystem.x = x;
            weaponSystem.y = y;
        };
        weaponSystem.destroyIt = function () {
            var x = weaponSystem.x, y = weaponSystem.y;
            _this.weaponManager.blueImpact(x, y, 1, enemy.onLayer);
            _this.phaserSprites.destroy(weaponSystem.name);
            game.time.events.add(Phaser.Timer.SECOND * 4, function () {
                weaponSystem.ammo.destroy();
            }, _this).autoDestroy = true;
        };
        weaponSystem.onUpdate = function () {
            ammo.onUpdate();
        };
        weaponSystem.fire = function () {
            var player = phaserSprites.get('player');
            if (!player.isInvincible && !player.isDead) {
                ammo.fire(weaponSystem, player.x, player.y);
            }
            else {
                ammo.checkOrientation(weaponSystem);
                ammo.fire(weaponSystem);
            }
            weaponSystem.animations.play('fireWeapon', 24, false);
        };
        phaserGroup.add(options.layer + 1, weaponSystem);
        weaponSystem.ammo = ammo;
        enemy.weaponSystems.push(weaponSystem);
        enemy.collidables.primaryWeapon = [];
        enemy.collidables.primaryWeapon.push(ammo.bullets);
        enemy.onUpdate = function () {
            var player = phaserSprites.get('player');
            onUpdate(enemy);
            enemy.angle = _this.facePlayer(enemy);
            enemy.weaponSystems.map(function (weaponsSystem) {
                weaponsSystem.angle = _this.facePlayer(enemy) - 180;
            });
            if (game.time.returnTrueTime() > enemy.fireDelay && !enemy.isDestroyed && (enemy.y > enemy.game.canvas.height * .3)) {
                enemy.fireDelay = game.time.returnTrueTime() + enemy.fireTimer;
                enemy.weaponSystems.map(function (weaponsSystem) {
                    weaponSystem.fire();
                });
            }
            if (!enemy.isDestroyed) {
                enemy.y = -(enemy.cosWave.data[enemy.cosWave.count]) - enemy.height;
                enemy.x = enemy.sinWave.data[enemy.sinWave.count] + options.x;
                enemy.cosWave.count++;
                enemy.sinWave.count++;
                if (enemy.cosWave.count >= enemy.cosWave.data.length) {
                    enemy.removeIt();
                }
                enemy.weaponSystems.map(function (obj) {
                    obj.sync(enemy);
                });
            }
            else {
                enemy.inPlace = true;
            }
            _this.bulletCollisionWithPlayer(enemy);
        };
        enemy.damageIt = function (val) {
            onDamage(enemy);
            enemy.isDamaged = true;
            game.time.events.add(150, function () {
                enemy.isDamaged = false;
            }, _this).autoDestroy = true;
            enemy.health -= val;
            enemy.tint = 1 * 0xff0000;
            enemy.game.add.tween(enemy).to({ tint: 1 * 0xffffff }, 100, Phaser.Easing.Linear.Out, true, 0, 0, false);
            if (enemy.health <= 0) {
                enemy.destroyIt();
            }
        };
        enemy.removeIt = function () {
            enemy.weaponSystems.map(function (weaponSystem) {
                weaponSystem.destroyIt();
            });
            enemy.children.map(function (obj) {
                _this.phaserSprites.destroy(obj.name);
            });
            phaserSprites.destroy(enemy.name);
        };
        enemy.destroyIt = function () {
            enemy.isDestroyed = true;
            enemy.tint = 1 * 0xff0000;
            enemy.weaponSystems.map(function (weaponSystem) {
                weaponSystem.destroyIt();
            });
            enemy.explodeInterval = game.time.events.loop(250, function () {
                _this.weaponManager.createExplosion(enemy.x + game.rnd.integerInRange(-enemy.width / 2, enemy.width / 2), enemy.y + game.rnd.integerInRange(-enemy.height / 2, enemy.height / 2), 1, enemy.onLayer + 1);
            });
            enemy.game.add.tween(enemy).to({ y: enemy.y + 100, alpha: 0.5 }, 750, Phaser.Easing.Linear.Out, true, 100, 0, false).
                onComplete.add(function () {
                onDestroy(enemy);
                game.time.events.remove(enemy.explodeInterval);
                enemy.children.map(function (obj) {
                    _this.phaserSprites.destroy(obj.name);
                });
                phaserSprites.destroy(enemy.name);
            });
        };
        return enemy;
    };
    ENEMY_MANAGER.prototype.createBigEnemy1 = function (options, onDamage, onDestroy, onFail, onUpdate) {
        var _this = this;
        if (onDamage === void 0) { onDamage = function () { }; }
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onFail === void 0) { onFail = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var enemy = phaserSprites.addFromAtlas({ x: options.x, name: "enemy_" + game.rnd.integer(), group: 'enemies', org: 'gameobjects', atlas: atlas, filename: "big_1", visible: true });
        enemy.anchor.setTo(0.5, 0.5);
        enemy.scale.setTo(1, 1);
        game.physics.enable(enemy, Phaser.Physics.ARCADE);
        enemy.atTarget = false;
        enemy.maxHealth = 1500;
        enemy.health = enemy.maxHealth;
        enemy.pierceResistence = 4;
        enemy.fallThreshold = game.rnd.integerInRange(0, 75);
        enemy.sinWave = game.math.sinCosGenerator(400 + options.y, game.world.height / 2, 1, 1);
        enemy.count = 0;
        enemy.fireDelay = 0;
        enemy.fireTimer = 500;
        enemy.inPlace = false;
        enemy.isDestroyed = false;
        enemy.onLayer = options.layer;
        phaserGroup.add(options.layer, enemy);
        var hitboxes = ["big_1_hitbox_1", "big_1_hitbox_2"];
        hitboxes.map(function (obj) {
            var e_hitbox = phaserSprites.addFromAtlas({ name: "enemy_hitbox_" + game.rnd.integer(), group: 'enemy_hitboxes', atlas: atlas, filename: obj, alpha: _this.showHitbox ? 0.75 : 0 });
            e_hitbox.anchor.setTo(0.5, 0.5);
            game.physics.enable(e_hitbox, Phaser.Physics.ARCADE);
            enemy.addChild(e_hitbox);
        });
        enemy.damageIt = function (val) {
            onDamage(enemy);
            if (!enemy.atTarget) {
                enemy.health -= val;
                enemy.tint = 1 * 0xff0000;
                enemy.game.add.tween(enemy).to({ tint: 1 * 0xffffff }, 100, Phaser.Easing.Linear.Out, true, 0, 0, false);
                if (enemy.health <= 0) {
                    enemy.destroyIt();
                }
            }
        };
        enemy.removeIt = function () {
            phaserSprites.destroy(enemy.name);
        };
        enemy.destroyIt = function () {
            enemy.children.map(function (obj) {
                _this.phaserSprites.destroy(obj.name);
            });
            if (!enemy.isDestroyed) {
                enemy.isDestroyed = true;
                enemy.tint = 1 * 0xff0000;
                enemy.explodeInterval = game.time.events.loop(100, function () {
                    _this.weaponManager.createExplosion(enemy.x + game.rnd.integerInRange(-enemy.width / 2, enemy.width / 2), enemy.y + game.rnd.integerInRange(-enemy.height / 2, enemy.height / 2), 1, enemy.onLayer + 1);
                });
                enemy.game.add.tween(enemy).to({ y: enemy.y - 15, alpha: 0.5 }, 750, Phaser.Easing.Linear.Out, true, 100, 0, false).
                    onComplete.add(function () {
                    game.time.events.remove(enemy.explodeInterval);
                    onDestroy(enemy);
                    _this.weaponManager.createExplosion(enemy.x, enemy.y, 1, options.layer + 1);
                    phaserSprites.destroy(enemy.name);
                });
            }
        };
        enemy.onUpdate = function () {
            onUpdate(enemy);
            if (game.time.returnTrueTime() > enemy.fireDelay && enemy.inPlace) {
                enemy.fireDelay = game.time.returnTrueTime() + enemy.fireTimer;
            }
            if (!enemy.isDestroyed && enemy.count < enemy.sinWave.cos.length / 2) {
                enemy.y = -(enemy.sinWave.cos[enemy.count]) - enemy.height;
                enemy.count++;
            }
            else {
                enemy.inPlace = true;
            }
        };
        enemy.removeIt = function () {
            phaserSprites.destroy(enemy.name);
        };
        return enemy;
    };
    ENEMY_MANAGER.prototype.createAsteroid = function (options, onDamage, onDestroy, onFail, onUpdate) {
        var _this = this;
        if (onDamage === void 0) { onDamage = function () { }; }
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onFail === void 0) { onFail = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var enemy = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: "enemy_" + game.rnd.integer(), group: 'enemies', org: 'gameobjects', atlas: atlas, filename: "asteroid_mid_layer_" + game.rnd.integerInRange(1, 3), visible: true });
        enemy.anchor.setTo(0.5, 0.5);
        enemy.scale.setTo(1.5, 1.5);
        game.physics.enable(enemy, Phaser.Physics.ARCADE);
        enemy.body.velocity.y = options.iy;
        enemy.body.velocity.x = options.ix;
        enemy.angleMomentum = game.rnd.integerInRange(-5, 5);
        enemy.body.bounce.setTo(1, 1);
        enemy.atTarget = false;
        enemy.maxHealth = 150;
        enemy.health = enemy.maxHealth;
        enemy.pierceResistence = 4;
        enemy.fallThreshold = game.rnd.integerInRange(0, 75);
        phaserGroup.add(options.layer, enemy);
        var hitboxes = ["1_hitbox_1", "1_hitbox_2"];
        hitboxes.map(function (obj) {
            var e_hitbox = phaserSprites.addFromAtlas({ name: "enemy_hitbox_" + game.rnd.integer(), group: 'enemy_hitboxes', atlas: atlas, filename: obj, alpha: _this.showHitbox ? 0.75 : 0 });
            e_hitbox.anchor.setTo(0.5, 0.5);
            e_hitbox.destroyIt = function (self) {
                self.body = null;
                _this.phaserSprites.destroy(self.name);
            };
            game.physics.enable(e_hitbox, Phaser.Physics.ARCADE);
            enemy.addChild(e_hitbox);
        });
        enemy.damageIt = function (val, wpnType) {
            if (wpnType === void 0) { wpnType = null; }
            onDamage(enemy);
            if (!enemy.atTarget) {
                enemy.health -= val;
                enemy.tint = 1 * 0xff0000;
                enemy.game.add.tween(enemy).to({ tint: 1 * 0xffffff }, 100, Phaser.Easing.Linear.Out, true, 0, 0, false);
                if (enemy.health <= 0) {
                    enemy.destroyIt();
                }
            }
        };
        enemy.destroyIt = function () {
            var tween = {
                angle: game.rnd.integerInRange(-720, 720),
                x: enemy.x - game.rnd.integerInRange(-25, 25),
                y: enemy.y - game.rnd.integerInRange(5, 25),
                alpha: .5
            };
            enemy.game.add.tween(enemy).to(tween, game.rnd.integerInRange(150, 500), Phaser.Easing.Linear.Out, true, 0, 0, false);
            enemy.body = null;
            game.time.events.add(Phaser.Timer.SECOND / 2, function () {
                onDestroy(enemy);
                _this.weaponManager.createExplosion(enemy.x, enemy.y, 1, options.layer + 1);
                phaserSprites.destroy(enemy.name);
            }, enemy).autoDestroy = true;
        };
        enemy.fallToPlanet = function () {
            enemy.tint = 1 * 0x000000;
            enemy.atTarget = true;
            enemy.body = null;
            enemy.game.add.tween(enemy).to({ y: enemy.y + 60 }, Phaser.Timer.SECOND * 2, Phaser.Easing.Linear.In, true, 0).autoDestroy = true;
            game.time.events.add(350, function () {
                _this.game.add.tween(enemy.scale).to({ x: 0, y: 0 }, Phaser.Timer.SECOND * 1, Phaser.Easing.Linear.In, true, game.rnd.integerInRange(0, 500)).
                    onComplete.add(function () {
                    onFail(enemy);
                    enemy.removeIt();
                    _this.weaponManager.createExplosion(enemy.x, enemy.y, 0.25, 6);
                }).autoDestroy = true;
            }).autoDestroy = true;
        };
        enemy.checkLocation = function () {
            enemy.angle += enemy.angleMomentum;
            if (enemy.angleMomentum > 0) {
                enemy.angleMomentum -= 0.002;
            }
            if (enemy.angleMomentum < 0) {
                enemy.angleMomentum += 0.002;
            }
            if (enemy.y > enemy.height) {
                if (enemy.body !== null) {
                    enemy.body.collideWorldBounds = true;
                }
            }
            if (enemy.y > _this.game.canvas.height - (75 + enemy.fallThreshold)) {
                if (enemy.body !== null && !enemy.atTarget) {
                    enemy.body.collideWorldBounds = false;
                    enemy.fallToPlanet();
                }
            }
        };
        enemy.onUpdate = function () {
            onUpdate(enemy);
            game.physics.arcade.collide([phaserSprites.get('leftBoundry'), phaserSprites.get('rightBoundry')], enemy);
            enemy.rotate += 2;
            if (!enemy.atTarget) {
                if (enemy.body !== null) {
                    if (enemy.body.velocity.y + 2 < 100) {
                        enemy.body.velocity.y += 2;
                    }
                    if (enemy.body.velocity.x > 0) {
                        enemy.body.velocity.x -= 0.2;
                    }
                    if (enemy.body.velocity.x < 0) {
                        enemy.body.velocity.x += 0.2;
                    }
                }
                enemy.checkLocation();
            }
        };
        enemy.removeIt = function () {
            phaserSprites.destroy(enemy.name);
        };
        return enemy;
    };
    ENEMY_MANAGER.prototype.createDebris = function (options, onDamage, onDestroy, onFail, onUpdate) {
        var _this = this;
        if (onDamage === void 0) { onDamage = function (enemy) { }; }
        if (onDestroy === void 0) { onDestroy = function (enemy) { }; }
        if (onFail === void 0) { onFail = function (enemy) { }; }
        if (onUpdate === void 0) { onUpdate = function (enemy) { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var enemy = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: "enemy_" + game.rnd.integer(), group: 'enemies', org: 'gameobjects', atlas: atlas, filename: "asteroid_mid_layer_" + game.rnd.integerInRange(1, 3), visible: true });
        enemy.anchor.setTo(0.5, 0.5);
        enemy.scale.setTo(1, 1);
        game.physics.enable(enemy, Phaser.Physics.ARCADE);
        enemy.body.velocity.y = options.iy;
        enemy.body.velocity.x = options.ix;
        enemy.angleMomentum = game.rnd.integerInRange(-5, 5);
        enemy.body.bounce.setTo(1, 1);
        enemy.atTarget = false;
        enemy.maxHealth = 50;
        enemy.health = enemy.maxHealth;
        enemy.pierceResistence = 1;
        enemy.fallThrehold = game.rnd.integerInRange(0, 75);
        phaserGroup.add(options.layer, enemy);
        enemy.damageIt = function (val, wpnType) {
            if (wpnType === void 0) { wpnType = null; }
            enemy.health -= val;
            enemy.tint = 1 * 0xff0000;
            enemy.game.add.tween(enemy).to({ tint: 1 * 0xffffff }, 100, Phaser.Easing.Linear.Out, true, 0, 0, false);
            if (enemy.health <= 0) {
                enemy.destroyIt(enemy);
            }
        };
        enemy.removeIt = function () {
            phaserSprites.destroy(enemy.name);
        };
        enemy.fallToPlanet = function () {
            enemy.tint = 1 * 0x000000;
            enemy.atTarget = true;
            enemy.body = null;
            enemy.game.add.tween(enemy).to({ y: enemy.y + 60 }, Phaser.Timer.SECOND * 2, Phaser.Easing.Linear.In, true, 0).autoDestroy = true;
            game.time.events.add(350, function () {
                _this.game.add.tween(enemy.scale).to({ x: 0, y: 0 }, Phaser.Timer.SECOND * 1, Phaser.Easing.Linear.In, true, game.rnd.integerInRange(0, 500)).
                    onComplete.add(function () {
                    onFail(enemy);
                    enemy.removeIt();
                    _this.weaponManager.createExplosion(enemy.x, enemy.y, 0.25, 6);
                }).autoDestroy = true;
            }).autoDestroy = true;
        };
        enemy.destroyIt = function () {
            var tween = {
                angle: game.rnd.integerInRange(-720, 720),
                x: enemy.x - game.rnd.integerInRange(-25, 25),
                y: enemy.y - game.rnd.integerInRange(5, 25),
                alpha: .5
            };
            enemy.game.add.tween(enemy).to(tween, game.rnd.integerInRange(50, 200), Phaser.Easing.Linear.Out, true, 0, 0, false);
            enemy.body = null;
            game.time.events.add(Phaser.Timer.SECOND / 3, function () {
                onDestroy(enemy);
                _this.weaponManager.createExplosion(enemy.x, enemy.y, 0.5, 6);
                phaserSprites.destroy(enemy.name);
            }, enemy).autoDestroy = true;
        };
        enemy.checkLocation = function () {
            enemy.angle += enemy.angleMomentum;
            if (enemy.angleMomentum > 0) {
                enemy.angleMomentum -= 0.002;
            }
            if (enemy.angleMomentum < 0) {
                enemy.angleMomentum += 0.002;
            }
            if (enemy.y > enemy.height) {
                if (enemy.body !== null) {
                    enemy.body.collideWorldBounds = true;
                }
            }
            if (enemy.y > _this.game.canvas.height - (50 + enemy.fallThrehold)) {
                if (enemy.body !== null && !enemy.atTarget) {
                    enemy.body.collideWorldBounds = false;
                    enemy.fallToPlanet();
                }
            }
            if (enemy.y > _this.game.canvas.height + enemy.height) {
                enemy.removeIt();
            }
        };
        enemy.onUpdate = function () {
            game.physics.arcade.collide([phaserSprites.get('leftBoundry'), phaserSprites.get('rightBoundry')], enemy);
            enemy.rotate += 4;
            if (enemy.body !== null) {
                if (enemy.body.velocity.y + 1 < 50) {
                    enemy.body.velocity.y += 1;
                }
                if (enemy.body.velocity.x > 0) {
                    enemy.body.velocity.x -= 0.2;
                }
                if (enemy.body.velocity.x < 0) {
                    enemy.body.velocity.x += 0.2;
                }
            }
            enemy.checkLocation();
        };
    };
    ENEMY_MANAGER.prototype.createGiantAsteroid = function (options, onDamage, onDestroy, onFail, onUpdate) {
        var _this = this;
        if (onDamage === void 0) { onDamage = function () { }; }
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onFail === void 0) { onFail = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var enemy = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: "enemy_" + game.rnd.integer(), group: 'boss', atlas: atlas, filename: "asteroid_large_layer_" + game.rnd.integerInRange(1, 3), visible: true });
        enemy.anchor.setTo(0.5, 0.5);
        game.physics.enable(enemy, Phaser.Physics.ARCADE);
        enemy.body.velocity.y = options.iy;
        enemy.body.velocity.x = options.ix;
        enemy.angleMomentum = game.rnd.integerInRange(-5, 5);
        enemy.body.bounce.setTo(1, 1);
        enemy.atTarget = false;
        enemy.maxHealth = 5000;
        enemy.health = enemy.maxHealth;
        enemy.pierceResistence = 50;
        phaserGroup.add(options.layer, enemy);
        enemy.damageIt = function (val, wpnType) {
            if (wpnType === void 0) { wpnType = null; }
            onDamage(enemy);
            if (!enemy.atTarget) {
                enemy.health -= val;
                enemy.tint = 1 * 0xff0000;
                enemy.game.add.tween(enemy).to({ tint: 1 * 0xffffff }, 100, Phaser.Easing.Linear.Out, true, 0, 0, false);
                if (enemy.health <= 0) {
                    enemy.destroyIt();
                }
            }
        };
        enemy.destroyIt = function (spawnMore) {
            if (spawnMore === void 0) { spawnMore = true; }
            var tween = {
                angle: 720,
                x: enemy.x - game.rnd.integerInRange(-10, 10),
                y: enemy.y - game.rnd.integerInRange(10, 10),
                alpha: .15
            };
            enemy.game.add.tween(enemy).to(tween, Phaser.Timer.SECOND * 2, Phaser.Easing.Linear.Out, true, 0, 0, false);
            enemy.game.add.tween(enemy.scale).to({ x: 0.5, y: 0.5 }, Phaser.Timer.SECOND * 2, Phaser.Easing.Linear.Out, true, 0, 0, false);
            enemy.body = null;
            game.time.events.add(Phaser.Timer.SECOND / 2, function () {
                onDestroy(enemy);
                phaserSprites.destroy(enemy.name);
            }, enemy).autoDestroy = true;
        };
        enemy.fallToPlanet = function () {
            enemy.tint = 1 * 0x000000;
            enemy.atTarget = true;
            enemy.body = null;
            enemy.game.add.tween(enemy).to({ y: enemy.y + 60 }, Phaser.Timer.SECOND * 2, Phaser.Easing.Linear.In, true, 0).autoDestroy = true;
            game.time.events.add(350, function () {
                _this.game.add.tween(enemy.scale).to({ x: 0, y: 0 }, Phaser.Timer.SECOND * 1, Phaser.Easing.Linear.In, true, game.rnd.integerInRange(0, 500)).
                    onComplete.add(function () {
                    onFail(enemy);
                    enemy.removeIt();
                    _this.weaponManager.createExplosion(enemy.x, enemy.y, 0.25, 6);
                }).autoDestroy = true;
            }).autoDestroy = true;
        };
        enemy.checkLocation = function () {
            enemy.angle += enemy.angleMomentum;
            if (enemy.angleMomentum > 0) {
                enemy.angleMomentum -= 0.002;
            }
            if (enemy.angleMomentum < 0) {
                enemy.angleMomentum += 0.002;
            }
            if (enemy.y > enemy.height) {
                if (enemy.body !== null) {
                    enemy.body.collideWorldBounds = true;
                }
            }
            if (enemy.y > enemy.game.canvas.height - enemy.height) {
                if (enemy.body !== null && !enemy.atTarget) {
                    enemy.body.collideWorldBounds = false;
                    enemy.fallToPlanet();
                }
            }
        };
        enemy.onUpdate = function () {
            onUpdate(enemy);
            game.physics.arcade.collide([phaserSprites.get('leftBoundry'), phaserSprites.get('rightBoundry')], enemy);
            enemy.rotate += 2;
            if (!enemy.atTarget) {
                if (enemy.body !== null) {
                    if (enemy.body.velocity.y + 1 < 25) {
                        enemy.body.velocity.y += 1;
                    }
                    if (enemy.body.velocity.x > 0) {
                        enemy.body.velocity.x -= 0.2;
                    }
                    if (enemy.body.velocity.x < 0) {
                        enemy.body.velocity.x += 0.2;
                    }
                }
                enemy.checkLocation();
            }
        };
        enemy.removeIt = function () {
            phaserSprites.destroy(enemy.name);
        };
        return enemy;
    };
    return ENEMY_MANAGER;
}());
var ITEMSPAWN_MANAGER = (function () {
    function ITEMSPAWN_MANAGER() {
    }
    ITEMSPAWN_MANAGER.prototype.assign = function (game, phaserMaster, phaserSprites, phaserGroup, atlas) {
        this.game = game;
        this.phaserSprites = phaserSprites;
        this.phaserMaster = phaserMaster;
        this.phaserGroup = phaserGroup;
        this.atlas = atlas;
    };
    ITEMSPAWN_MANAGER.prototype.spawnHealthpack = function (x, y, layer, onPickup) {
        var _this = this;
        if (onPickup === void 0) { onPickup = function () { }; }
        var animation = Phaser.Animation.generateFrameNames('healthpack_', 1, 4).slice();
        var item = this.phaserSprites.addFromAtlas({ name: "healthpack_" + this.game.rnd.integer(), group: 'itemspawns', x: x, y: y, atlas: this.atlas, filename: animation[0] });
        item.animations.add('animate', animation, 8, true);
        item.animations.play('animate');
        item.anchor.setTo(0.5, 0.5);
        item.blinkLifespan = this.game.time.returnTrueTime() + (Phaser.Timer.SECOND * 10);
        item.blinkLifespanInterval = this.game.time.returnTrueTime();
        item.blinkLifespanCount = 0;
        this.game.physics.enable(item, Phaser.Physics.ARCADE);
        item.body.collideWorldBounds = true;
        item.body.bounce.setTo(1, 1);
        item.body.velocity.y = this.game.rnd.integerInRange(50, 50);
        item.body.velocity.x = this.game.rnd.integerInRange(-200, 200);
        item.destroyIt = function () {
            _this.phaserSprites.destroy(item.name);
        };
        item.pickedUp = function () {
            _this.phaserSprites.destroy(item.name);
        };
        item.onUpdate = function () {
            if (_this.game.time.returnTrueTime() > item.blinkLifespan) {
                item.destroyIt();
            }
            if (_this.game.time.returnTrueTime() > (item.blinkLifespan - Phaser.Timer.SECOND * 3)) {
                if (_this.game.time.returnTrueTime() > item.blinkLifespanInterval) {
                    item.blinkLifespanInterval = _this.game.time.returnTrueTime() + 200 - (item.blinkLifespanCount * 5);
                    item.alpha = item.blinkLifespanCount % 2 === 0 ? 0.25 : 1;
                    item.blinkLifespanCount++;
                }
            }
            _this.phaserSprites.getManyGroups(['playership']).map(function (target) {
                target.game.physics.arcade.overlap(item, target, function (obj, target) {
                    onPickup();
                    item.pickedUp();
                }, null, item);
            });
        };
        this.phaserGroup.add(layer, item);
    };
    ITEMSPAWN_MANAGER.prototype.spawnPowerup = function (x, y, layer, onPickup) {
        var _this = this;
        if (onPickup === void 0) { onPickup = function () { }; }
        var animation = Phaser.Animation.generateFrameNames('powerup_', 1, 4).slice();
        var item = this.phaserSprites.addFromAtlas({ name: "healthpack_" + this.game.rnd.integer(), group: 'itemspawns', x: x, y: y, atlas: this.atlas, filename: animation[0] });
        item.animations.add('animate', animation, 8, true);
        item.animations.play('animate');
        item.anchor.setTo(0.5, 0.5);
        item.blinkLifespan = this.game.time.returnTrueTime() + (Phaser.Timer.SECOND * 10);
        item.blinkLifespanInterval = this.game.time.returnTrueTime();
        item.blinkLifespanCount = 0;
        this.game.physics.enable(item, Phaser.Physics.ARCADE);
        item.body.collideWorldBounds = true;
        item.body.bounce.setTo(1, 1);
        item.body.velocity.y = this.game.rnd.integerInRange(50, 50);
        item.body.velocity.x = this.game.rnd.integerInRange(-200, 200);
        item.destroyIt = function () {
            _this.phaserSprites.destroy(item.name);
        };
        item.pickedUp = function () {
            _this.phaserSprites.destroy(item.name);
        };
        item.onUpdate = function () {
            if (_this.game.time.returnTrueTime() > item.blinkLifespan) {
                item.destroyIt();
            }
            if (_this.game.time.returnTrueTime() > (item.blinkLifespan - Phaser.Timer.SECOND * 3)) {
                if (_this.game.time.returnTrueTime() > item.blinkLifespanInterval) {
                    item.blinkLifespanInterval = _this.game.time.returnTrueTime() + 200 - (item.blinkLifespanCount * 5);
                    item.alpha = item.blinkLifespanCount % 2 === 0 ? 0.25 : 1;
                    item.blinkLifespanCount++;
                }
            }
            _this.phaserSprites.getManyGroups(['playership']).map(function (target) {
                target.game.physics.arcade.overlap(item, target, function (obj, target) {
                    onPickup();
                    item.pickedUp();
                }, null, item);
            });
        };
        this.phaserGroup.add(layer, item);
    };
    ITEMSPAWN_MANAGER.prototype.spawnSpecial = function (x, y, layer, onPickup) {
        var _this = this;
        if (onPickup === void 0) { onPickup = function () { }; }
        var animation = Phaser.Animation.generateFrameNames('special_', 1, 5).slice();
        var item = this.phaserSprites.addFromAtlas({ name: "healthpack_" + this.game.rnd.integer(), group: 'itemspawns', x: x, y: y, atlas: this.atlas, filename: animation[0] });
        item.animations.add('animate', animation, 8, true);
        item.animations.play('animate');
        item.anchor.setTo(0.5, 0.5);
        item.blinkLifespan = this.game.time.returnTrueTime() + (Phaser.Timer.SECOND * 10);
        item.blinkLifespanInterval = this.game.time.returnTrueTime();
        item.blinkLifespanCount = 0;
        this.game.physics.enable(item, Phaser.Physics.ARCADE);
        item.body.collideWorldBounds = true;
        item.body.bounce.setTo(1, 1);
        item.body.velocity.y = this.game.rnd.integerInRange(50, 50);
        item.body.velocity.x = this.game.rnd.integerInRange(-200, 200);
        item.destroyIt = function () {
            _this.phaserSprites.destroy(item.name);
        };
        item.pickedUp = function () {
            _this.phaserSprites.destroy(item.name);
        };
        item.onUpdate = function () {
            if (_this.game.time.returnTrueTime() > item.blinkLifespan) {
                item.destroyIt();
            }
            if (_this.game.time.returnTrueTime() > (item.blinkLifespan - Phaser.Timer.SECOND * 3)) {
                if (_this.game.time.returnTrueTime() > item.blinkLifespanInterval) {
                    item.blinkLifespanInterval = _this.game.time.returnTrueTime() + 200 - (item.blinkLifespanCount * 5);
                    item.alpha = item.blinkLifespanCount % 2 === 0 ? 0.25 : 1;
                    item.blinkLifespanCount++;
                }
            }
            _this.phaserSprites.getManyGroups(['playership']).map(function (target) {
                target.game.physics.arcade.overlap(item, target, function (obj, target) {
                    onPickup();
                    item.pickedUp();
                }, null, item);
            });
        };
        this.phaserGroup.add(layer, item);
    };
    return ITEMSPAWN_MANAGER;
}());
var PLAYER_MANAGER = (function () {
    function PLAYER_MANAGER() {
    }
    PLAYER_MANAGER.prototype.assign = function (game, phaserMaster, phaserSprites, phaserTexts, phaserGroup, phaserControls, weaponManager, atlas, weaponAtlas) {
        this.game = game;
        this.phaserSprites = phaserSprites;
        this.phaserMaster = phaserMaster;
        this.phaserTexts = phaserTexts;
        this.phaserGroup = phaserGroup;
        this.phaserControls = phaserControls;
        this.weaponManager = weaponManager;
        this.atlas = atlas;
        this.weaponAtlas = weaponAtlas;
        this.player = null;
    };
    PLAYER_MANAGER.prototype.createShip = function (params, updateHealth, onDamage, loseLife, onUpdate) {
        var _this = this;
        if (updateHealth === void 0) { updateHealth = function () { }; }
        if (onDamage === void 0) { onDamage = function () { }; }
        if (loseLife === void 0) { loseLife = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var shipId = params.shipId + 1;
        var gameData = this.phaserMaster.getOnly(['gameData']).gameData;
        var starMomentum = this.phaserMaster.getOnly(['starMomentum']).starMomentum;
        var player = this.phaserSprites.addFromAtlas({ name: params.name, group: params.group, org: params.org, atlas: this.atlas, filename: "ship_base_form", visible: false });
        player.anchor.setTo(0.5, 0.5);
        player.scale.setTo(1, 1);
        player.isInvincible = false;
        player.isDead = true;
        player.isDamaged = false;
        player.isForceMoved = false;
        player.ignoreBoundaries = null;
        player.onLayer = params.layer;
        player.primaryWeapon = params.primaryWeapon;
        player.secondaryWeapon = params.secondaryWeapon;
        player.perk = params.perk;
        player.weaponSystems = [];
        player.subweaponSystems = [];
        player.attachments = [];
        player.collidables = {
            primaryWeapon: [],
            secondaryWeapon: []
        };
        player.xCapture = [];
        player.yCapture = [];
        player.clearEnemyBulletsInterval;
        var shipStart = Phaser.Animation.generateFrameNames("ship_start_", 1, 7).slice();
        var shipDamage = ['ship_damage', 'ship_damage', 'ship_damage', 'ship_damage', 'ship_start_7'];
        var preExplode = Phaser.Animation.generateFrameNames("ship_explode_", 1, 5).slice();
        var preExplodeLoop = Phaser.Animation.generateFrameNames("ship_explode_", 6, 7).slice();
        player.animations.add('shipDamage', shipDamage, 1, true);
        player.animations.add('shipStart', shipStart, 1, true);
        player.animations.add('preExplode', preExplode, 1, true);
        player.animations.add('preExplodeLoop', preExplodeLoop, 1, true);
        game.physics.enable(player, Phaser.Physics.ARCADE);
        this.phaserGroup.add(params.layer, player);
        var hitboxes = ["ship_hitbox_1", "ship_hitbox_2"];
        hitboxes.map(function (obj, index) {
            var p_hitbox = _this.phaserSprites.addFromAtlas({ y: 10, name: "player_hitbox_" + index, group: 'player_hitboxes', atlas: _this.atlas, filename: obj, alpha: 0 });
            p_hitbox.anchor.setTo(0.5, 0.5);
            game.physics.enable(p_hitbox, Phaser.Physics.ARCADE);
            player.addChild(p_hitbox);
        });
        var fullPowerAnimation = Phaser.Animation.generateFrameNames("ship_fullpower_", 1, 7).concat(Phaser.Animation.generateFrameNames("ship_fullpower__", 1, 7).reverse());
        var fullpower = this.phaserSprites.addFromAtlas({ name: 'ship_fullpower_addon', atlas: this.atlas, filename: fullPowerAnimation[0], visible: false });
        fullpower.anchor.setTo(0.5, 0.5);
        fullpower.animations.add('fullpower', fullPowerAnimation, 1, true);
        fullpower.animations.play('fullpower', 45, true);
        player.addChild(fullpower);
        var exhaustAnimation = Phaser.Animation.generateFrameNames('exhaust_', 1, 3);
        var bottomExhaust = this.phaserSprites.addFromAtlas({ y: 45, name: "bottom_exhaust", atlas: this.atlas, filename: exhaustAnimation[0], alpha: 1 });
        bottomExhaust.anchor.setTo(0.5, 0.5);
        bottomExhaust.animations.add('animate', exhaustAnimation, 1, true);
        bottomExhaust.animations.play('animate', 12, true);
        bottomExhaust.sync = function (player) {
            var x = player.x, y = player.y, alpha = player.alpha, isDead = player.isDead;
            bottomExhaust.x = x;
            bottomExhaust.y = y + 40;
            bottomExhaust.alpha = !isDead ? alpha : 0;
            bottomExhaust.visible = starMomentum.y >= 0 ? true : false;
        };
        player.attachments.push(bottomExhaust);
        this.phaserGroup.add(params.layer - 1, bottomExhaust);
        var topExhaust = this.phaserSprites.addFromAtlas({ y: 0, name: "top_exhaust", atlas: this.atlas, filename: exhaustAnimation[0], alpha: 1 });
        topExhaust.anchor.setTo(0.5, 0.5);
        topExhaust.angle = 180;
        topExhaust.animations.add('animate', exhaustAnimation, 1, true);
        topExhaust.animations.play('animate', 12, true);
        topExhaust.sync = function (player) {
            var x = player.x, y = player.y, alpha = player.alpha;
            topExhaust.x = x;
            topExhaust.y = y;
            topExhaust.alpha = !player.isDead ? alpha : 0;
            topExhaust.visible = starMomentum.y < 0 ? true : false;
        };
        player.attachments.push(topExhaust);
        this.phaserGroup.add(params.layer - 1, topExhaust);
        player.clearAllEnemyBullets = function (duration) {
            player.clearEnemyBulletsInterval = game.time.returnTrueTime() + duration;
        };
        player.onUpdate = function () {
            fullpower.visible = gameData.player.powerup >= 30 ? true : false;
            if (player.xCapture.length > 0) {
                player.x += player.xCapture[0];
                player.xCapture.shift();
            }
            if (player.yCapture.length > 0) {
                player.y += player.yCapture[0];
                player.yCapture.shift();
            }
            if (!player.ignoreBoundaries) {
                player.checkLimits();
            }
            if (!player.isForceMoved) {
            }
            var collidables = [];
            var weaponSystems = player.weaponSystems.concat(player.subweaponSystems);
            weaponSystems.map(function (weaponSystem) {
                weaponSystem.angle = player.angle;
                weaponSystem.onUpdate();
                weaponSystem.sync(player);
                collidables.push(weaponSystem.ammo.bullets);
            });
            _this.bulletCollisionDetection();
            player.attachments.map(function (attachments) {
                attachments.sync(player);
            });
            onUpdate(player);
        };
        player.restoreHealth = function (val) {
            var gameData = _this.phaserMaster.getOnly(['gameData']).gameData;
            var health = gameData.player.health + val;
            if (health > 100) {
                health = 100;
            }
            updateHealth(health);
        };
        player.takeDamage = function (val) {
            onDamage(player);
            var gameData = _this.phaserMaster.getOnly(['gameData']).gameData;
            var health = gameData.player.health - val;
            updateHealth(health);
            if (health > 0) {
                player.animations.play('shipDamage', 45, false);
                player.isDamaged = true;
                game.time.events.add(250, function () {
                    player.isDamaged = false;
                }, _this).autoDestroy = true;
                player.tint = 1 * 0xff0000;
                player.alpha = 0.75;
                player.game.add.tween(player).to({ tint: 1 * 0xffffff, alpha: 1 }, 10, Phaser.Easing.Linear.Out, true, 100, 0, false).
                    onComplete.add(function () {
                    game.time.events.add(500, function () {
                        player.isInvincible = false;
                    }, _this).autoDestroy = true;
                });
            }
            else {
                player.isDestroyed();
                loseLife(player);
            }
        };
        player.isDestroyed = function (respawn) {
            if (respawn === void 0) { respawn = true; }
            player.isDead = true;
            player.isInvincible = true;
            player.destroyWeaponSystems();
            player.onUpdate();
            _this.weaponManager.createExplosion(player.x, player.y, 1, 6);
            game.add.tween(_this).to({ angle: game.rnd.integerInRange(-90, 90), alpha: 0 }, 1000, Phaser.Easing.Linear.In, true, 0).
                onComplete.add(function () {
                _this.weaponManager.createExplosion(player.x, player.y, 1, 6);
                player.visible = false;
            });
        };
        player.destroyWeaponSystems = function () {
            player.weaponSystems.map(function (weaponSystem) {
                weaponSystem.destroyIt();
                weaponSystem.ammo.destroy();
            });
            player.weaponSystems = [];
        };
        player.attachPerk = function (type) {
            _this.attachPerk(player, params, type);
        };
        player.attachWeapon = function (weaponType) {
            var weaponSystems;
            switch (weaponType) {
                case 'BULLET':
                    weaponSystems = _this.attachBullet(player, params, weaponType);
                    break;
                case 'SPREAD':
                    weaponSystems = _this.attachSpread(player, params, weaponType);
                    break;
                case 'LASER':
                    weaponSystems = _this.attachLaser(player, params, weaponType);
                    break;
                case 'MISSLE':
                    weaponSystems = _this.attachMissle(player, params, weaponType);
                    break;
                case 'SHOTGUN':
                    weaponSystems = _this.attachShotgun(player, params, weaponType);
                    break;
                case 'GATLING':
                    weaponSystems = _this.attachGatling(player, params, weaponType);
                    break;
            }
            player.collidables.primaryWeapon = [];
            weaponSystems.map(function (weaponSystem) {
                player.collidables.primaryWeapon.push(weaponSystem.ammo.bullets);
            });
        };
        player.attachSubweapon = function (weaponType) {
            var weaponSystems;
            switch (weaponType) {
                case 'CLUSTERBOMB':
                    weaponSystems = _this.attachClusterbomb(player, params, weaponType);
                    break;
            }
            player.collidables.secondaryWeapon = [];
            weaponSystems.map(function (weaponSystem) {
                player.collidables.secondaryWeapon.push(weaponSystem.ammo.bullets);
                if (!!weaponSystem.ammo.bomblets) {
                    weaponSystem.ammo.bomblets.map(function (bomblet) {
                        player.collidables.secondaryWeapon.push(bomblet.bullets);
                    });
                }
            });
        };
        player.fireWeapon = function () {
            player.weaponSystems.map(function (obj) {
                obj.fire();
            });
        };
        player.fireSubweapon = function () {
            player.subweaponSystems.map(function (obj) {
                obj.fire();
            });
        };
        player.regenerateHealth = function (active) {
            if (active === void 0) { active = false; }
        };
        player.moveX = function (val) {
            player.xCapture[0] = val;
        };
        player.moveY = function (val) {
            player.yCapture[0] = val;
        };
        player.checkLimits = function () {
            if (this.y - this.height < 0) {
                this.y = this.height;
            }
            if (this.y + this.height > this.game.canvas.height) {
                this.y = this.game.canvas.height - this.height;
            }
            if (this.x < 0) {
                this.x = this.game.canvas.width + this.width;
            }
            if (this.x > (this.game.canvas.width + this.width)) {
                this.x = 0;
            }
        };
        player.moveTo = function (x, y, duration, callback) {
            if (callback === void 0) { callback = function () { }; }
            player.isInvincible = true;
            player.isForceMoved = true;
            _this.phaserControls.disableAllInput();
            game.add.tween(player).to({ x: x, y: y }, duration, Phaser.Easing.Exponential.InOut, true, 0, 0, false).
                onComplete.add(function () {
                player.isInvincible = false;
                player.isForceMoved = false;
                _this.phaserControls.enableAllInput();
                callback();
            });
        };
        player.moveToStart = function (callback) {
            if (callback === void 0) { callback = function () { }; }
            player.isDead = false;
            player.isInvincible = true;
            player.ignoreBoundaries = true;
            player.x = _this.game.world.centerX;
            player.y = _this.game.world.height * 2;
            game.time.events.add(150, function () {
                player.alpha = 1;
                player.visible = true;
                game.add.tween(player).to({ y: game.world.centerY + 100 }, 1000, Phaser.Easing.Exponential.InOut, true, 0, 0, false).
                    onComplete.add(function () {
                    player.ignoreBoundaries = false;
                    _this.phaserControls.enableAllInput();
                    player.attachWeapon(player.primaryWeapon);
                    player.attachSubweapon(player.secondaryWeapon);
                    player.animations.play('shipStart', 12, false);
                    game.time.events.add(1000, function () {
                        player.isInvincible = false;
                        callback();
                    }).autoDestroy = true;
                });
            }).autoDestroy = true;
        };
        player.playEndSequence = function (callback) {
            player.isInvincible = true;
            player.game.add.tween(player.scale).to({ x: 2, y: 2 }, 750, Phaser.Easing.Exponential.InOut, true, 0, 0, false);
            player.game.add.tween(player).to({ x: game.world.centerX, y: game.world.centerY + 50 }, 750, Phaser.Easing.Exponential.InOut, true, 0, 0, false).
                onComplete.add(function () {
                player.game.add.tween(player).to({ y: game.world.height + 200 }, 750, Phaser.Easing.Exponential.InOut, true, 100, 0, false).
                    onComplete.add(function () {
                    player.game.add.tween(player).to({ y: -200 }, 1000, Phaser.Easing.Exponential.InOut, true, 0, 0, false).
                        onComplete.add(function () {
                        callback();
                    }, player);
                }, player);
            }, player);
        };
        this.player = player;
        return player;
    };
    PLAYER_MANAGER.prototype.attachPerk = function (player, params, type) {
        var _this = this;
        var animationSprites;
        var framerate;
        var onLayer;
        switch (type) {
            case 'FIREPOWER':
                animationSprites = Phaser.Animation.generateFrameNames('firepower_', 1, 8).concat(Phaser.Animation.generateFrameNames('firepower_', 1, 8).reverse());
                framerate = 30;
                break;
            case 'ARMORPLATING':
                animationSprites = ['armor_plating'];
                framerate = 30;
                break;
            case 'REGEN':
                animationSprites = Phaser.Animation.generateFrameNames('shield_layer_', 1, 8).slice();
                framerate = 30;
                break;
        }
        if (this.phaserSprites.get(params.name + "_ship_perk") !== undefined) {
            this.phaserSprites.destroy(params.name + "_ship_perk");
        }
        var shipPerk;
        if (type === 'REGEN') {
            shipPerk = this.phaserSprites.addFromAtlas({ name: params.name + "_ship_perk", atlas: this.atlas, filename: animationSprites[0], alpha: 0.5 });
            shipPerk.anchor.setTo(0.5, 0.5);
            shipPerk.scale.set(1.25, 1.25);
            shipPerk.tweenFadeIn = function () {
                _this.game.add.tween(shipPerk).to({ alpha: 0.8 }, 1000, Phaser.Easing.Linear.In, true, 8000).onComplete.add(function () {
                    player.regenerateHealth(true);
                    shipPerk.tweenFadeOut();
                });
            };
            shipPerk.tweenFadeOut = function () {
                _this.game.add.tween(shipPerk).to({ alpha: 0.0 }, 1000, Phaser.Easing.Linear.In, true, 1000).onComplete.add(function () {
                    player.regenerateHealth(false);
                    shipPerk.tweenFadeIn();
                });
            };
            this.game.time.events.add(1000, function () {
                if (shipPerk !== undefined) {
                    shipPerk.tweenFadeOut();
                }
            }).autoDestroy = true;
            shipPerk.animations.add('animate', animationSprites, 1, true);
            shipPerk.animations.play('animate', framerate, true);
            player.addChild(shipPerk);
        }
        else {
            shipPerk = this.phaserSprites.addFromAtlas({ name: params.name + "_ship_perk", atlas: this.atlas, filename: animationSprites[0], visible: true });
            shipPerk.anchor.setTo(0.5, 0.5);
            shipPerk.animations.add('animate', animationSprites, 1, true);
            shipPerk.animations.play('animate', framerate, true);
            player.addChild(shipPerk);
        }
    };
    PLAYER_MANAGER.prototype.attachLaser = function (player, params, weaponType) {
        var _this = this;
        var animationSprites = Phaser.Animation.generateFrameNames('laser_fire_', 1, 6).slice();
        var gap = 35;
        var turrets = 5;
        var _loop_14 = function (i) {
            var weaponSystem = this_8.phaserSprites.addFromAtlas({ name: "ship_weapon_" + this_8.game.rnd.integer(), atlas: this_8.weaponAtlas, filename: animationSprites[0], alpha: 0 });
            weaponSystem.anchor.setTo(0.5, 0.5);
            if (animationSprites.length > 0) {
                weaponSystem.animations.add('fireWeapon', animationSprites, 1, true);
            }
            weaponSystem.offset = (gap * i) - ((gap / 2) * (turrets - 1));
            weaponSystem.index = i;
            weaponSystem.onUpdate = function () {
                ammo.onUpdate();
            };
            weaponSystem.sync = function (player) {
                var x = player.x, y = player.y;
                weaponSystem.x = x + weaponSystem.offset;
                weaponSystem.y = y;
            };
            weaponSystem.destroyIt = function () {
                var x = weaponSystem.x, y = weaponSystem.y;
                _this.weaponManager.blueImpact(x, y, 1, player.onLayer);
                _this.phaserSprites.destroy(weaponSystem.name);
            };
            weaponSystem.fire = function () {
                var gameData = _this.phaserMaster.getOnly(['gameData']).gameData;
                var powerupLvl = Math.floor((gameData.player.powerup - 1) / 5);
                ammo.fireAngle = 270 + weaponSystem.angle;
                if (powerupLvl == 0 && (weaponSystem.index === 2)) {
                    ammo.fireOffset(0, -32);
                    if (animationSprites.length > 0) {
                        weaponSystem.animations.play('fireWeapon', 60, false);
                    }
                }
                if (powerupLvl == 1 && (weaponSystem.index === 1 || weaponSystem.index === 3)) {
                    ammo.fireOffset(0, -32);
                    if (animationSprites.length > 0) {
                        weaponSystem.animations.play('fireWeapon', 60, false);
                    }
                }
                if (powerupLvl == 2 && (weaponSystem.index === 1 || weaponSystem.index === 2 || weaponSystem.index === 3)) {
                    ammo.fireOffset(0, -32);
                    if (animationSprites.length > 0) {
                        weaponSystem.animations.play('fireWeapon', 60, false);
                    }
                }
                if (powerupLvl == 3 && (weaponSystem.index === 0 || weaponSystem.index === 1 || weaponSystem.index === 3 || weaponSystem.index === 4)) {
                    ammo.fireOffset(0, -32);
                    if (animationSprites.length > 0) {
                        weaponSystem.animations.play('fireWeapon', 60, false);
                    }
                }
                if (powerupLvl >= 4) {
                    ammo.fireOffset(0, -32);
                    if (animationSprites.length > 0) {
                        weaponSystem.animations.play('fireWeapon', 60, false);
                    }
                }
            };
            this_8.phaserGroup.add(params.layer + 1, weaponSystem);
            var maxBulletsOnscreen = 4;
            var ammo = this_8.weaponManager.playerBullets(maxBulletsOnscreen, weaponType);
            ammo.checkOrientation(weaponSystem.angle);
            ammo.onUpdate = function () {
            };
            var stagger = void 0;
            switch (i) {
                case 0:
                    stagger = 0;
                    break;
                case 1:
                    stagger = -20;
                    break;
                case 2:
                    stagger = -40;
                    break;
                case 3:
                    stagger = -20;
                    break;
                case 4:
                    stagger = 0;
                    break;
            }
            ammo.trackSprite(weaponSystem, 0, stagger);
            weaponSystem.ammo = ammo;
            player.weaponSystems.push(weaponSystem);
        };
        var this_8 = this;
        for (var i = 0; i < turrets; i++) {
            _loop_14(i);
        }
        return player.weaponSystems;
    };
    PLAYER_MANAGER.prototype.attachShotgun = function (player, params, weaponType) {
        var _this = this;
        var animationSprites = Phaser.Animation.generateFrameNames('bullet_fire_', 1, 4).slice();
        var gap = 20;
        var turrets = 1;
        var _loop_15 = function (i) {
            var weaponSystem = this_9.phaserSprites.addFromAtlas({ name: "ship_weapon_" + this_9.game.rnd.integer(), atlas: this_9.weaponAtlas, filename: animationSprites[0] });
            weaponSystem.anchor.setTo(0.5, 0.5);
            if (animationSprites.length > 0) {
                weaponSystem.animations.add('fireWeapon', animationSprites, 1, true);
            }
            weaponSystem.offset = (gap * i) - ((gap / 2) * (turrets - 1));
            weaponSystem.index = i;
            weaponSystem.onUpdate = function () {
                ammo.onUpdate();
            };
            weaponSystem.sync = function (player) {
                var x = player.x, y = player.y;
                weaponSystem.x = x + weaponSystem.offset;
                weaponSystem.y = y;
            };
            weaponSystem.destroyIt = function () {
                var x = weaponSystem.x, y = weaponSystem.y;
                _this.weaponManager.blueImpact(x, y, 1, player.onLayer);
                _this.phaserSprites.destroy(weaponSystem.name);
            };
            weaponSystem.fire = function () {
                var gameData = _this.phaserMaster.getOnly(['gameData']).gameData;
                var powerupLvl = Math.floor((gameData.player.powerup - 1) / 5);
                for (var n = 0; n < 5 * (powerupLvl + 1); n++) {
                    ammo.fireAngle = 270 + weaponSystem.angle;
                    ammo.fire(weaponSystem, null, weaponSystem + 1);
                }
                if (animationSprites.length > 0) {
                    weaponSystem.animations.play('fireWeapon', 60, false);
                }
            };
            this_9.phaserGroup.add(params.layer + 1, weaponSystem);
            var maxBulletsOnscreen = 60;
            var ammo = this_9.weaponManager.playerBullets(maxBulletsOnscreen, weaponType);
            ammo.checkOrientation(weaponSystem.angle);
            ammo.onUpdate = function () {
            };
            ammo.trackSprite(weaponSystem, 0, -20);
            weaponSystem.ammo = ammo;
            player.weaponSystems.push(weaponSystem);
        };
        var this_9 = this;
        for (var i = 0; i < turrets; i++) {
            _loop_15(i);
        }
        return player.weaponSystems;
    };
    PLAYER_MANAGER.prototype.attachBullet = function (player, params, weaponType) {
        var _this = this;
        var animationSprites = Phaser.Animation.generateFrameNames('bullet_fire_', 1, 4).slice();
        var gap = 25;
        var turrets = 15;
        var _loop_16 = function (i) {
            var weaponSystem = this_10.phaserSprites.addFromAtlas({ name: "ship_weapon_" + this_10.game.rnd.integer(), atlas: this_10.weaponAtlas, filename: animationSprites[0], alpha: 0 });
            weaponSystem.anchor.setTo(0.5, 0.5);
            if (animationSprites.length > 0) {
                weaponSystem.animations.add('fireWeapon', animationSprites, 1, true);
            }
            weaponSystem.offset = (gap * i) - ((gap / 2) * (turrets - 1));
            weaponSystem.index = i;
            weaponSystem.onUpdate = function () {
                ammo.onUpdate();
            };
            weaponSystem.sync = function (player) {
                var x = player.x, y = player.y;
                weaponSystem.x = x + weaponSystem.offset;
                weaponSystem.y = y;
            };
            weaponSystem.destroyIt = function () {
                var x = weaponSystem.x, y = weaponSystem.y;
                _this.weaponManager.blueImpact(x, y, 1, player.onLayer);
                _this.phaserSprites.destroy(weaponSystem.name);
            };
            weaponSystem.fire = function () {
                var gameData = _this.phaserMaster.getOnly(['gameData']).gameData;
                var powerupLvl = Math.floor((gameData.player.powerup - 1) / 5);
                ammo.fireAngle = 270 + weaponSystem.angle;
                if (powerupLvl >= 0 && (weaponSystem.index === 6 || weaponSystem.index === 8)) {
                    ammo.fireOffset(0, -35);
                    if (animationSprites.length > 0) {
                        weaponSystem.animations.play('fireWeapon', 60, false);
                    }
                }
                if (powerupLvl >= 1 && (weaponSystem.index === 7)) {
                    ammo.fireOffset(0, -25);
                    if (animationSprites.length > 0) {
                        weaponSystem.animations.play('fireWeapon', 60, false);
                    }
                }
                if (powerupLvl >= 2 && (weaponSystem.index === 5 || weaponSystem.index === 9)) {
                    ammo.fireOffset(0, -15);
                    if (animationSprites.length > 0) {
                        weaponSystem.animations.play('fireWeapon', 60, false);
                    }
                }
                if (powerupLvl >= 3 && (weaponSystem.index === 4 || weaponSystem.index === 10)) {
                    ammo.fireOffset(0, -5);
                    if (animationSprites.length > 0) {
                        weaponSystem.animations.play('fireWeapon', 60, false);
                    }
                }
                if (powerupLvl >= 4 && (weaponSystem.index === 3 || weaponSystem.index === 11)) {
                    ammo.fireOffset(0, 5);
                    if (animationSprites.length > 0) {
                        weaponSystem.animations.play('fireWeapon', 60, false);
                    }
                }
                if (powerupLvl >= 5 && (weaponSystem.index === 2 || weaponSystem.index === 12)) {
                    ammo.fireOffset(0, 15);
                    if (animationSprites.length > 0) {
                        weaponSystem.animations.play('fireWeapon', 60, false);
                    }
                }
            };
            this_10.phaserGroup.add(params.layer + 1, weaponSystem);
            var maxBulletsOnscreen = 4;
            var ammo = this_10.weaponManager.playerBullets(maxBulletsOnscreen, weaponType);
            ammo.checkOrientation(weaponSystem.angle);
            ammo.onUpdate = function () {
            };
            ammo.trackSprite(weaponSystem, 0, -20);
            weaponSystem.ammo = ammo;
            player.weaponSystems.push(weaponSystem);
        };
        var this_10 = this;
        for (var i = 0; i < turrets; i++) {
            _loop_16(i);
        }
        return player.weaponSystems;
    };
    PLAYER_MANAGER.prototype.attachSpread = function (player, params, weaponType) {
        var _this = this;
        var animationSprites = Phaser.Animation.generateFrameNames('bullet_fire_', 1, 4).slice();
        var gameData = this.phaserMaster.getOnly(['gameData']).gameData;
        var powerupLvl = Math.floor((gameData.player.powerup - 1) / 5);
        var turrets = powerupLvl === 5 ? 2 : 1;
        var gap = 20;
        var _loop_17 = function (i) {
            var weaponSystem = this_11.phaserSprites.addFromAtlas({ name: "ship_weapon_" + this_11.game.rnd.integer(), atlas: this_11.weaponAtlas, filename: animationSprites[0] });
            weaponSystem.anchor.setTo(0.5, 0.5);
            if (animationSprites.length > 0) {
                weaponSystem.animations.add('fireWeapon', animationSprites, 1, true);
            }
            weaponSystem.offset = (gap * i) - ((gap / 2) * (turrets - 1));
            weaponSystem.onUpdate = function () {
                ammo.onUpdate();
            };
            weaponSystem.sync = function (player) {
                var x = player.x, y = player.y;
                weaponSystem.x = x + weaponSystem.offset;
                weaponSystem.y = y;
            };
            weaponSystem.destroyIt = function () {
                var x = weaponSystem.x, y = weaponSystem.y;
                _this.weaponManager.blueImpact(x, y, 1, player.onLayer);
                _this.phaserSprites.destroy(weaponSystem.name);
            };
            weaponSystem.fire = function () {
                var gameData = _this.phaserMaster.getOnly(['gameData']).gameData;
                var powerupLvl = Math.floor((gameData.player.powerup - 1) / 5);
                ammo.fire(weaponSystem, null, weaponSystem + 1);
                if (powerupLvl >= 0) {
                    ammo.fire(weaponSystem, weaponSystem.x + (1 * 30), weaponSystem.y - (200));
                    ammo.fire(weaponSystem, weaponSystem.x - (1 * 30), weaponSystem.y - (200));
                }
                if (powerupLvl >= 1) {
                    ammo.fire(weaponSystem, weaponSystem.x + (2 * 30), weaponSystem.y - (200));
                    ammo.fire(weaponSystem, weaponSystem.x - (2 * 30), weaponSystem.y - (200));
                }
                if (powerupLvl >= 2) {
                    ammo.fire(weaponSystem, weaponSystem.x + (3 * 30), weaponSystem.y - (200));
                    ammo.fire(weaponSystem, weaponSystem.x - (3 * 30), weaponSystem.y - (200));
                }
                if (powerupLvl >= 3) {
                    ammo.fire(weaponSystem, weaponSystem.x + (4 * 30), weaponSystem.y - (200));
                    ammo.fire(weaponSystem, weaponSystem.x - (4 * 30), weaponSystem.y - (200));
                }
                if (powerupLvl >= 4) {
                    ammo.fire(weaponSystem, weaponSystem.x + (5 * 30), weaponSystem.y - (200));
                    ammo.fire(weaponSystem, weaponSystem.x - (5 * 30), weaponSystem.y - (200));
                }
                if (powerupLvl >= 5) {
                    ammo.fire(weaponSystem, weaponSystem.x + (6 * 30), weaponSystem.y - (200));
                    ammo.fire(weaponSystem, weaponSystem.x - (6 * 30), weaponSystem.y - (200));
                }
                if (animationSprites.length > 0) {
                    weaponSystem.animations.play('fireWeapon', 60, false);
                }
            };
            this_11.phaserGroup.add(params.layer + 1, weaponSystem);
            var maxBulletsOnscreen = ((powerupLvl + 2) * 12);
            var ammo = this_11.weaponManager.playerBullets(maxBulletsOnscreen, weaponType);
            ammo.checkOrientation(weaponSystem.angle);
            ammo.onUpdate = function () {
            };
            weaponSystem.ammo = ammo;
            player.weaponSystems.push(weaponSystem);
        };
        var this_11 = this;
        for (var i = 0; i < turrets; i++) {
            _loop_17(i);
        }
        return player.weaponSystems;
    };
    PLAYER_MANAGER.prototype.attachMissle = function (player, params, weaponType) {
        var _this = this;
        var animationSprites = Phaser.Animation.generateFrameNames('missle_fire_', 1, 4).slice();
        var gameData = this.phaserMaster.getOnly(['gameData']).gameData;
        var powerupLvl = Math.floor((gameData.player.powerup - 1) / 5);
        var turrets = powerupLvl === 5 ? 2 : 1;
        var gap = 20;
        var _loop_18 = function (i) {
            var weaponSystem = this_12.phaserSprites.addFromAtlas({ name: "ship_weapon_" + this_12.game.rnd.integer(), atlas: this_12.weaponAtlas, filename: animationSprites[0], visible: true });
            weaponSystem.anchor.setTo(0.5, 0.5);
            if (animationSprites.length > 0) {
                weaponSystem.animations.add('fireWeapon', animationSprites, 1, true);
            }
            weaponSystem.offset = (gap * i) - ((gap / 2) * (turrets - 1));
            weaponSystem.onUpdate = function () {
                ammo.onUpdate();
            };
            weaponSystem.sync = function (player) {
                var x = player.x, y = player.y;
                weaponSystem.x = x + weaponSystem.offset;
                weaponSystem.y = y;
            };
            weaponSystem.destroyIt = function () {
                var x = weaponSystem.x, y = weaponSystem.y;
                _this.weaponManager.blueImpact(x, y, 1, player.onLayer);
                _this.phaserSprites.destroy(weaponSystem.name);
            };
            weaponSystem.fire = function () {
                var gameData = _this.phaserMaster.getOnly(['gameData']).gameData;
                var powerupLvl = Math.floor((gameData.player.powerup - 1) / 5);
                ammo.fireAngle = 270 + weaponSystem.angle;
                ammo.fire(weaponSystem);
                if (powerupLvl >= 0) {
                    ammo.fire(weaponSystem);
                    ammo.fire(weaponSystem);
                }
                if (powerupLvl >= 1) {
                    ammo.fire(weaponSystem);
                    ammo.fire(weaponSystem);
                }
                if (powerupLvl >= 3) {
                    ammo.fire(weaponSystem);
                    ammo.fire(weaponSystem);
                }
                if (powerupLvl >= 4) {
                    ammo.fire(weaponSystem);
                    ammo.fire(weaponSystem);
                }
                if (powerupLvl >= 5) {
                    ammo.fire(weaponSystem);
                    ammo.fire(weaponSystem);
                }
                if (animationSprites.length > 0) {
                    weaponSystem.animations.play('fireWeapon', 60, false);
                }
            };
            this_12.phaserGroup.add(params.layer + 1, weaponSystem);
            var maxBulletsOnscreen = ((powerupLvl + 2) * 8);
            var ammo = this_12.weaponManager.playerBullets(maxBulletsOnscreen, weaponType);
            ammo.checkOrientation(weaponSystem.angle);
            ammo.onUpdate = function () {
            };
            weaponSystem.ammo = ammo;
            player.weaponSystems.push(weaponSystem);
        };
        var this_12 = this;
        for (var i = 0; i < turrets; i++) {
            _loop_18(i);
        }
        return player.weaponSystems;
    };
    PLAYER_MANAGER.prototype.attachGatling = function (player, params, weaponType) {
        var _this = this;
        var animationSprites = Phaser.Animation.generateFrameNames('missle_fire_', 1, 4).slice();
        var gameData = this.phaserMaster.getOnly(['gameData']).gameData;
        var powerupLvl = Math.floor((gameData.player.powerup - 1) / 5);
        var turrets = 1;
        var gap = 20;
        var _loop_19 = function (i) {
            var weaponSystem = this_13.phaserSprites.addFromAtlas({ name: "ship_weapon_" + this_13.game.rnd.integer(), atlas: this_13.weaponAtlas, filename: animationSprites[0], visible: true });
            weaponSystem.anchor.setTo(0.5, 0.5);
            if (animationSprites.length > 0) {
                weaponSystem.animations.add('fireWeapon', animationSprites, 1, true);
            }
            weaponSystem.offset = (gap * i) - ((gap / 2) * (turrets - 1));
            weaponSystem.onUpdate = function () {
                ammo.onUpdate();
            };
            weaponSystem.sync = function (player) {
                var x = player.x, y = player.y;
                weaponSystem.x = x + weaponSystem.offset;
                weaponSystem.y = y;
            };
            weaponSystem.destroyIt = function () {
                var x = weaponSystem.x, y = weaponSystem.y;
                _this.weaponManager.blueImpact(x, y, 1, player.onLayer);
                _this.phaserSprites.destroy(weaponSystem.name);
            };
            weaponSystem.fire = function () {
                var gameData = _this.phaserMaster.getOnly(['gameData']).gameData;
                var powerupLvl = Math.floor((gameData.player.powerup - 1) / 5);
                ammo.fireAngle = 270 + weaponSystem.angle;
                ammo.fire(weaponSystem, null, weaponSystem + 1);
                if (powerupLvl >= 1) {
                    _this.game.time.events.add(50, function () {
                        ammo.fire(weaponSystem, null, weaponSystem + 20);
                    }).autoDestroy = true;
                }
                if (powerupLvl >= 2) {
                    _this.game.time.events.add(100, function () {
                        ammo.fire(weaponSystem, null, weaponSystem - 20);
                    }).autoDestroy = true;
                }
                if (powerupLvl >= 3) {
                    _this.game.time.events.add(150, function () {
                        ammo.fire(weaponSystem, null, weaponSystem + 20);
                    }).autoDestroy = true;
                }
                if (powerupLvl >= 4) {
                    _this.game.time.events.add(200, function () {
                        ammo.fire(weaponSystem, null, weaponSystem - 20);
                    }).autoDestroy = true;
                }
                if (powerupLvl >= 5) {
                    _this.game.time.events.add(50, function () {
                        ammo.fire(weaponSystem, null, weaponSystem - 20);
                    }).autoDestroy = true;
                }
                if (animationSprites.length > 0) {
                    weaponSystem.animations.play('fireWeapon', 60, false);
                }
            };
            this_13.phaserGroup.add(params.layer + 1, weaponSystem);
            var maxBulletsOnscreen = 45;
            var ammo = this_13.weaponManager.playerBullets(maxBulletsOnscreen, weaponType);
            ammo.checkOrientation(weaponSystem.angle);
            ammo.onUpdate = function () {
            };
            weaponSystem.ammo = ammo;
            player.weaponSystems.push(weaponSystem);
        };
        var this_13 = this;
        for (var i = 0; i < turrets; i++) {
            _loop_19(i);
        }
        return player.weaponSystems;
    };
    PLAYER_MANAGER.prototype.attachClusterbomb = function (player, params, weaponType) {
        var _this = this;
        var animationSprites = Phaser.Animation.generateFrameNames('laser_fire_', 1, 6).slice();
        var gap = 35;
        var turrets = 5;
        var weaponSystem = this.phaserSprites.addFromAtlas({ name: "ship_weapon_" + this.game.rnd.integer(), atlas: this.weaponAtlas, filename: animationSprites[0] });
        weaponSystem.anchor.setTo(0.5, 0.5);
        if (animationSprites.length > 0) {
            weaponSystem.animations.add('fireWeapon', animationSprites, 1, true);
        }
        weaponSystem.onUpdate = function () {
            ammo.onUpdate();
        };
        weaponSystem.sync = function (player) {
            var x = player.x, y = player.y;
            weaponSystem.x = x;
            weaponSystem.y = y;
        };
        weaponSystem.destroyIt = function () {
            var x = weaponSystem.x, y = weaponSystem.y;
            _this.weaponManager.blueImpact(x, y, 1, player.onLayer);
            _this.phaserSprites.destroy(weaponSystem.name);
        };
        weaponSystem.fire = function () {
            ammo.fireOffset(0, -32);
        };
        this.phaserGroup.add(params.layer + 1, weaponSystem);
        var maxBulletsOnscreen = 4;
        var onKill = function () {
            player.clearAllEnemyBullets(Phaser.Timer.SECOND * 2);
        };
        var ammo = this.weaponManager.createClusterbomb(maxBulletsOnscreen, onKill);
        ammo.onUpdate = function () {
        };
        ammo.trackSprite(weaponSystem, 0, 0);
        weaponSystem.ammo = ammo;
        player.subweaponSystems.push(weaponSystem);
        return player.subweaponSystems;
    };
    PLAYER_MANAGER.prototype.bulletCollisionDetection = function () {
        var _this = this;
        var enemies = this.phaserSprites.getGroup('enemy_hitboxes').slice();
        var collidables = this.player.collidables.primaryWeapon.concat(this.player.collidables.secondaryWeapon);
        this.phaserSprites.getManyGroups(['impactExplosions']).map(function (obj) {
            collidables.push(obj);
        });
        this.game.physics.arcade.overlap(enemies, collidables, function (enemy, collidable) {
            var e = enemy.parent;
            if (!e.isDestroyed) {
                var weaponData = collidable.weaponData;
                if ((!e.isDamaged && !e.isDestroyed) || (weaponData.ignoreDamageState && !e.isDestroyed)) {
                    if (weaponData.reference === 'LASER') {
                        _this.weaponManager.electricDischarge(collidable.x, collidable.y - collidable.height, 1, e.onLayer + 1);
                    }
                    if (weaponData.reference === 'SPREAD') {
                        _this.weaponManager.blueImpact(collidable.x, collidable.y - collidable.height, 1, e.onLayer + 1);
                    }
                    if (weaponData.reference === 'SHOTGUN') {
                        _this.weaponManager.pelletImpact(collidable.x, collidable.y - collidable.height, 1, e.onLayer + 1);
                    }
                    if (weaponData.reference === 'GATLING') {
                        _this.weaponManager.pelletImpact(collidable.x, collidable.y - collidable.height, 1, e.onLayer + 1);
                    }
                    if (weaponData.reference === 'BULLET') {
                        _this.weaponManager.orangeImpact(collidable.x, collidable.y - collidable.height, 1, e.onLayer + 1);
                    }
                    if (weaponData.reference === 'MISSLE') {
                        _this.weaponManager.createExplosionBasic(collidable.x, collidable.y - collidable.height, 1, e.onLayer + 1, Math.round(weaponData.damage / 2));
                    }
                    e.damageIt(weaponData.damage);
                }
                if (!weaponData.pierce && !weaponData.completeAnimation) {
                    collidable.destroyIt(e.onLayer - 1);
                }
            }
        });
    };
    PLAYER_MANAGER.prototype.destroyShip = function (name) {
        this.phaserSprites.destroy(name);
        this.phaserSprites.destroy(name + "_exhaust");
        this.phaserSprites.getGroup(name + "_trails").map(function (obj) {
            obj.destroySelf();
        });
    };
    return PLAYER_MANAGER;
}());
var UTILITY_MANAGER = (function () {
    function UTILITY_MANAGER() {
    }
    UTILITY_MANAGER.prototype.assign = function (game, phaserSprites, phaserBitmapdata, phaserGroup, atlas) {
        this.game = game;
        this.phaserSprites = phaserSprites;
        this.phaserBitmapdata = phaserBitmapdata;
        this.phaserGroup = phaserGroup;
        this.atlas = atlas;
    };
    UTILITY_MANAGER.prototype.buildOverlayBackground = function (start, end, layer, visibleOnStart) {
        if (visibleOnStart === void 0) { visibleOnStart = false; }
        var game = this.game;
        var overlaybmd = this.phaserBitmapdata.addGradient({ name: 'um_overlay__bmd', start: start, end: end, width: 5, height: 5, render: false });
        var overlay = this.phaserSprites.add({ x: 0, y: 0, name: "um_overlay__bg", width: game.world.width, height: game.world.height, reference: overlaybmd.cacheBitmapData, visible: visibleOnStart });
        overlay.flash = function (speed, callback) {
            if (speed === void 0) { speed = 500; }
            if (callback === void 0) { callback = function () { }; }
            overlay.visible = true;
            overlay.alpha = 1;
            game.time.events.add(250, function () {
                game.add.tween(overlay).to({ alpha: 0 }, speed, Phaser.Easing.Linear.In, true, 0, 0, false).
                    onComplete.add(function () { });
                callback();
            }).autoDestroy = true;
        };
        overlay.fadeIn = function (speed, callback) {
            if (speed === void 0) { speed = 500; }
            if (callback === void 0) { callback = function () { }; }
            overlay.visible = true;
            overlay.alpha = 0;
            game.add.tween(overlay).to({ alpha: 1 }, speed, Phaser.Easing.Linear.In, true, 0, 0, false).
                onComplete.add(function () {
                callback();
            });
        };
        overlay.fadeOut = function (speed, callback) {
            if (speed === void 0) { speed = 500; }
            if (callback === void 0) { callback = function () { }; }
            overlay.visible = true;
            overlay.alpha = 1;
            game.add.tween(overlay).to({ alpha: 0 }, speed, Phaser.Easing.Linear.In, true, 0, 0, false).
                onComplete.add(function () {
                callback();
            });
        };
        this.phaserGroup.add(layer, overlay);
    };
    UTILITY_MANAGER.prototype.buildOverlayGrid = function (squareSizeH, squareSizeV, layer, image) {
        if (squareSizeH === void 0) { squareSizeH = 80; }
        if (squareSizeV === void 0) { squareSizeV = 80; }
        var game = this.game;
        var count = 0;
        for (var c = 0; c < Math.ceil(game.world.height / squareSizeV) + 1; c++) {
            var _loop_20 = function (r) {
                var gridSquare = this_14.phaserSprites.addFromAtlas({ x: r * squareSizeH, y: c * squareSizeV, name: "grid" + count, group: 'um_grid__bg', width: squareSizeH, height: squareSizeV, atlas: this_14.atlas, filename: image, visible: true });
                gridSquare.anchor.setTo(0.5, 0.5);
                gridSquare.scale.setTo(1, 1);
                gridSquare.fadeOut = function (speed) {
                    gridSquare.scale.setTo(1, 1);
                    game.add.tween(gridSquare).to({ height: 0 }, speed, Phaser.Easing.Linear.Out, true, 0, 0, false);
                };
                gridSquare.fadeIn = function (speed) {
                    game.add.tween(gridSquare).to({ height: squareSizeV }, speed, Phaser.Easing.Linear.In, true, 0, 0, false);
                };
                gridSquare.scaleOut = function (speed) {
                    game.add.tween(gridSquare.scale).to({ x: 0, y: 0 }, speed, Phaser.Easing.Linear.In, true, 0, 0, false);
                };
                gridSquare.scaleIn = function (speed) {
                    game.add.tween(gridSquare.scale).to({ x: 1, y: 1 }, speed, Phaser.Easing.Linear.Out, true, 0, 0, false);
                };
                count++;
                this_14.phaserGroup.add(layer, gridSquare);
            };
            var this_14 = this;
            for (var r = 0; r < Math.ceil(game.world.width / squareSizeH) + 1; r++) {
                _loop_20(r);
            }
        }
    };
    UTILITY_MANAGER.prototype.overlayBGControls = function (options, callback) {
        var transition = options.transition, delay = options.delay, speed = options.speed;
        var um_overlay__bg = this.phaserSprites.getOnly(['um_overlay__bg']).um_overlay__bg;
        this.game.time.events.add(delay, function () {
            switch (transition) {
                case 'FLASHWHITE':
                    um_overlay__bg.flash(speed, callback);
                    break;
                case 'FADEIN':
                    um_overlay__bg.fadeIn(speed, callback);
                    break;
                case 'FADEOUT':
                    um_overlay__bg.fadeOut(speed, callback);
                    break;
            }
        }).autoDestroy = true;
    };
    UTILITY_MANAGER.prototype.overlayControls = function (options, callback) {
        var game = this.game;
        var transition = options.transition, delay = options.delay, speed = options.speed, tileDelay = options.tileDelay;
        var grid = this.phaserSprites.getGroup('um_grid__bg');
        var odd = [];
        var even = [];
        var rowDelay = (tileDelay * grid.length) * 0.75;
        var returnDelay = rowDelay + (tileDelay * grid.length);
        game.time.events.add(delay, function () {
            switch (transition) {
                case 'WIPEIN':
                    grid.map(function (obj, index) {
                        if (index % 2 === 0) {
                            even.push(obj);
                        }
                        else {
                            odd.push(obj);
                        }
                    });
                    even.map(function (obj, index) {
                        game.time.events.add(tileDelay * index, function () {
                            obj.scaleIn(speed);
                        }).autoDestroy = true;
                    });
                    game.time.events.add(returnDelay, function () {
                        odd.slice(0).reverse().map(function (obj, index) {
                            game.time.events.add(tileDelay * index, function () {
                                obj.scaleIn(speed);
                            }).autoDestroy = true;
                        });
                    }, rowDelay);
                    game.time.events.add(returnDelay, function () {
                        callback();
                    }).autoDestroy = true;
                    break;
                case 'WIPEOUT':
                    grid.map(function (obj, index) {
                        if (index % 2 === 0) {
                            even.push(obj);
                        }
                        else {
                            odd.push(obj);
                        }
                    });
                    even.map(function (obj, index) {
                        game.time.events.add(tileDelay * index, function () {
                            obj.scaleOut(speed);
                        }).autoDestroy = true;
                    });
                    game.time.events.add(returnDelay, function () {
                        odd.slice(0).reverse().map(function (obj, index) {
                            game.time.events.add(tileDelay * index, function () {
                                obj.scaleOut(speed);
                            }).autoDestroy = true;
                        });
                    }, rowDelay);
                    game.time.events.add(returnDelay, function () {
                        callback();
                    }).autoDestroy = true;
                    break;
                case 'FADEOUT':
                    grid.map(function (obj, index) {
                        game.time.events.add(tileDelay * index, function () {
                            obj.fadeOut(speed);
                        }).autoDestroy = true;
                    });
                    game.time.events.add(grid.length * tileDelay + speed, function () {
                        callback();
                    }).autoDestroy = true;
                    break;
                case 'FADEIN':
                    grid.map(function (obj, index) {
                        game.time.events.add(returnDelay, function () {
                            obj.fadeIn(speed);
                        }, tileDelay * index);
                    });
                    game.time.events.add(returnDelay, function () {
                        callback();
                    }, grid.length * tileDelay + speed);
                    break;
            }
        }).autoDestroy = true;
    };
    return UTILITY_MANAGER;
}());
var WEAPON_MANAGER = (function () {
    function WEAPON_MANAGER() {
    }
    WEAPON_MANAGER.prototype.assign = function (game, phaserMaster, phaserSprites, phaserGroup, atlas) {
        this.game = game;
        this.phaserSprites = phaserSprites;
        this.phaserMaster = phaserMaster;
        this.phaserGroup = phaserGroup;
        this.atlas = atlas;
    };
    WEAPON_MANAGER.prototype.enemyBullet = function (bulletPoolTotal) {
        var _this = this;
        if (bulletPoolTotal === void 0) { bulletPoolTotal = 2; }
        var game = this.game;
        var phaserMaster = this.phaserMaster;
        var weapon = game.add.weapon(bulletPoolTotal, this.atlas, 'enemy_bullet');
        weapon.bulletKillType = Phaser.Weapon.KILL_CAMERA_BOUNDS;
        weapon.bulletSpeed = 400;
        weapon.bulletAngleOffset = 90;
        weapon.multiFire = true;
        weapon.checkOrientation = function (angle) {
            weapon.bulletSpeed = -Math.abs(weapon.bulletSpeed);
            weapon.bulletAngleOffset = -Math.abs(weapon.bulletAngleOffset);
        };
        this.phaserGroup.add(7, weapon.bullets);
        weapon.bullets.children.map(function (bullet) {
            bullet.destroyIt = function (layer) {
                bullet.kill();
                _this.orangeImpact(bullet.x + _this.game.rnd.integerInRange(-5, 5), bullet.y + _this.game.rnd.integerInRange(-5, 15), 1, layer);
            };
        });
        return weapon;
    };
    WEAPON_MANAGER.prototype.playerBullets = function (bulletPoolTotal, type) {
        var game = this.game;
        var phaserMaster = this.phaserMaster;
        var weaponData = phaserMaster.getAll(['weaponData']).weaponData;
        var data = weaponData.primaryWeapons[type];
        var weapon = game.add.weapon(bulletPoolTotal, this.atlas, data.spriteAnimation[0]);
        weapon.bulletKillType = Phaser.Weapon.KILL_CAMERA_BOUNDS;
        weapon.bulletSpeed = data.bulletSpeed;
        weapon.bulletAngleOffset = 90;
        weapon.multiFire = true;
        if (data.spriteAnimation.length > 0) {
            weapon.bullets.callAll('animations.add', 'animations', 'fire', data.spriteAnimation, 20, true);
            weapon.bullets.callAll('play', null, 'fire');
        }
        switch (type) {
            case 'MISSLE':
                weapon.bulletSpeedVariance = 300;
                weapon.bulletAngleVariance = 15;
                break;
            case 'SHOTGUN':
                weapon.bulletSpeedVariance = 1000;
                weapon.bulletAngleOffset = -10;
                weapon.bulletAngleVariance = 20;
                break;
            case 'GATLING':
                weapon.bulletSpeedVariance = 300;
                weapon.bulletAngleVariance = 3;
                break;
        }
        weapon.onKill.add(function (bullet) {
        });
        weapon.checkOrientation = function (angle) {
            if (angle < 180) {
                weapon.bulletSpeed = Math.abs(weapon.bulletSpeed);
                weapon.bulletAngleOffset = Math.abs(weapon.bulletAngleOffset);
            }
            else {
                weapon.bulletSpeed = -Math.abs(weapon.bulletSpeed);
                weapon.bulletAngleOffset = -Math.abs(weapon.bulletAngleOffset);
            }
        };
        this.phaserGroup.add(8, weapon.bullets);
        weapon.bullets.children.map(function (bullet) {
            bullet.weaponData = data;
            bullet.pierce = data.pierce;
            bullet.destroyIt = function (layer) {
                bullet.kill();
            };
        });
        return weapon;
    };
    WEAPON_MANAGER.prototype.createClusterbomb = function (bulletPoolTotal, onKill) {
        var _this = this;
        if (onKill === void 0) { onKill = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var weaponData = phaserMaster.getAll().weaponData;
        var data = weaponData.secondaryWeapons.CLUSTERBOMB;
        var bombletAmount = 25;
        var bomblets = this.createBomblet(bombletAmount);
        var weapon = game.add.weapon(1, this.atlas, data.spriteAnimation[0]);
        weapon.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
        weapon.bulletSpeed = data.bulletSpeed;
        weapon.multiFire = true;
        weapon.bulletLifespan = 750;
        weapon.bomblets = bomblets;
        if (data.spriteAnimation.length > 0) {
            weapon.bullets.callAll('animations.add', 'animations', 'fire', data.spriteAnimation, 20, true);
            weapon.bullets.callAll('play', null, 'fire');
        }
        weapon.onKill.add(function (bullet) {
            onKill();
            bomblets.map(function (bomblet) {
                bomblet.fire(bullet);
            });
            _this.createExplosionVacuum(bullet.x, bullet.y, 1.25, 8, data.damage);
        });
        weapon.bullets.children.map(function (bullet) {
            bullet.weaponData = data;
            bullet.pierce = data.pierce;
            bullet.destroyIt = function (layer) {
                bullet.kill();
            };
        });
        this.phaserGroup.add(7, weapon.bullets);
        return weapon;
    };
    WEAPON_MANAGER.prototype.createBomblet = function (amount) {
        var _this = this;
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var weaponData = phaserMaster.getAll().weaponData;
        var data = {
            reference: 'BOMBLET',
            spriteAnimation: ["icon_sw_1"],
            damage: 25,
            pierce: false,
            ignoreDamageState: false,
            completeAnimation: false
        };
        var bomblets = [];
        for (var i = 0; i < amount; i++) {
            var bomblet = game.add.weapon(1, this.atlas, data.spriteAnimation[0]);
            bomblet.bulletKillType = Phaser.Weapon.KILL_LIFESPAN;
            bomblet.bulletSpeed = 500 + game.rnd.integerInRange(50, 150);
            bomblet.bulletAngleVariance = 140;
            bomblet.bulletLifespan = game.rnd.integerInRange(50, 500);
            if (data.spriteAnimation.length > 0) {
                bomblet.bullets.callAll('animations.add', 'animations', 'fire', data.spriteAnimation, 20, true);
                bomblet.bullets.callAll('play', null, 'fire');
            }
            bomblet.onKill.add(function (bullet) {
                _this.createExplosionBasic(bullet.x, bullet.y, 1.25, 8, data.damage);
            });
            bomblet.bullets.children.map(function (bullet) {
                bullet.weaponData = data;
                bullet.pierce = data.pierce;
                bullet.destroyIt = function (layer) {
                    bullet.kill();
                };
            });
            this.phaserGroup.add(7, bomblet.bullets);
            bomblets.push(bomblet);
        }
        return bomblets;
    };
    WEAPON_MANAGER.prototype.createExplosionVacuum = function (x, y, scale, layer, damage, onDestroy, onUpdate) {
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var data = {
            reference: 'EXPLOSION_VACUUM',
            spriteAnimation: Phaser.Animation.generateFrameNames('explosion_vacuum_', 1, 9).slice(),
            damage: 25,
            pierce: false,
            ignoreDamageState: false,
            completeAnimation: true
        };
        var explosion = phaserSprites.addFromAtlas({ name: "impact_A", group: 'impactExplosions', x: x, y: y, atlas: atlas, filename: data.spriteAnimation[0] });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        explosion.weaponData = data;
        explosion.animations.add('explosion', data.spriteAnimation, 1, true);
        explosion.animations.play('explosion', 30, false).onComplete.add(function () {
            explosion.destroyIt();
        }, explosion);
        explosion.destroyIt = function () {
            phaserSprites.destroy(explosion.name);
        };
        game.camera.shake(0.004, 500);
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        game.physics.enable(explosion, Phaser.Physics.ARCADE);
        return explosion;
    };
    WEAPON_MANAGER.prototype.createExplosionVacuumFire = function (x, y, scale, layer, damage, onDestroy, onUpdate) {
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var data = {
            reference: 'VACUUMEXPLOSION',
            spriteAnimation: Phaser.Animation.generateFrameNames('explosion_vacuum_inner_', 1, 13).slice(),
            damage: 25,
            pierce: false,
            ignoreDamageState: false,
            completeAnimation: true
        };
        var explosion = phaserSprites.addFromAtlas({ name: "impact_" + game.rnd.integer(), group: 'impactExplosions', x: x, y: y, atlas: atlas, filename: data.spriteAnimation[0] });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        explosion.weaponData = data;
        explosion.animations.add('explosion', data.spriteAnimation, 1, true);
        explosion.animations.play('explosion', 30, false).onComplete.add(function () {
            explosion.destroyIt();
        }, explosion);
        explosion.destroyIt = function () {
            phaserSprites.destroy(explosion.name);
        };
        game.camera.shake(0.004, 500);
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        game.physics.enable(explosion, Phaser.Physics.ARCADE);
        return explosion;
    };
    WEAPON_MANAGER.prototype.createExplosionBasic = function (x, y, scale, layer, damage, onDestroy, onUpdate) {
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var data = {
            reference: 'EXPLOSION_BASIC',
            spriteAnimation: Phaser.Animation.generateFrameNames('explosions_Layer_', 1, 16),
            damage: 25,
            pierce: false,
            ignoreDamageState: false,
            completeAnimation: true
        };
        var explosion = phaserSprites.addFromAtlas({ name: "impact_" + game.rnd.integer(), group: 'impactExplosions', x: x, y: y, atlas: atlas, filename: data.spriteAnimation[0] });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        explosion.weaponData = data;
        explosion.animations.add('explosion', data.spriteAnimation, 1, true);
        explosion.animations.play('explosion', 30, false).onComplete.add(function () {
            explosion.destroyIt();
        }, explosion);
        explosion.destroyIt = function () {
            phaserSprites.destroy(explosion.name);
        };
        game.camera.shake(0.002, 500);
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        game.physics.enable(explosion, Phaser.Physics.ARCADE);
        return explosion;
    };
    WEAPON_MANAGER.prototype.createExplosion = function (x, y, scale, layer, onDestroy, onUpdate) {
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var data = {
            spriteAnimation: Phaser.Animation.generateFrameNames('explosion2_layer_', 1, 12)
        };
        var explosion = phaserSprites.addFromAtlas({ name: "explosion_" + game.rnd.integer(), group: 'noimpactExplosions', x: x, y: y, atlas: atlas, filename: data.spriteAnimation[0] });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        explosion.animations.add('explosion', data.spriteAnimation, 1, true);
        explosion.animations.play('explosion', 30, false).onComplete.add(function () {
            explosion.destroyIt();
        }, explosion);
        explosion.destroyIt = function () {
            phaserSprites.destroy(explosion.name);
        };
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        return explosion;
    };
    WEAPON_MANAGER.prototype.pelletImpact = function (x, y, scale, layer) {
        var game = this.game;
        var _a = this, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var data = {
            spriteAnimation: Phaser.Animation.generateFrameNames('sparks_', 1, 3)
        };
        var explosion = phaserSprites.addFromAtlas({ name: "impact_" + game.rnd.integer(), group: 'noimpactExplosions', x: x, y: y, atlas: atlas, filename: data.spriteAnimation[0] });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        explosion.animations.add('explosion', data.spriteAnimation, 1, true);
        explosion.animations.play('explosion', 30, false).onComplete.add(function () {
            explosion.destroyIt();
        }, explosion);
        explosion.destroyIt = function () {
            phaserSprites.destroy(explosion.name);
        };
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        game.physics.enable(explosion, Phaser.Physics.ARCADE);
        return explosion;
    };
    WEAPON_MANAGER.prototype.blueImpact = function (x, y, scale, layer) {
        var game = this.game;
        var _a = this, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var data = {
            spriteAnimation: Phaser.Animation.generateFrameNames('blue_explosion_small_layer_', 1, 7)
        };
        var frames = Phaser.Animation.generateFrameNames('blue_explosion_small_layer_', 1, 7);
        var explosion = phaserSprites.addFromAtlas({ name: "impact_" + game.rnd.integer(), group: 'noimpactExplosions', x: x, y: y, atlas: atlas, filename: data.spriteAnimation[0] });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        game.physics.enable(explosion, Phaser.Physics.ARCADE);
        explosion.animations.add('explosion', data.spriteAnimation, 1, true);
        explosion.animations.play('explosion', 30, false).onComplete.add(function () {
            explosion.destroyIt();
        }, explosion);
        explosion.destroyIt = function () {
            phaserSprites.destroy(explosion.name);
        };
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        return explosion;
    };
    WEAPON_MANAGER.prototype.orangeImpact = function (x, y, scale, layer) {
        var game = this.game;
        var _a = this, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var data = {
            spriteAnimation: Phaser.Animation.generateFrameNames('orange_ring_explosion_layer_', 1, 7)
        };
        var frames = Phaser.Animation.generateFrameNames('orange_ring_explosion_layer_', 1, 7);
        var explosion = phaserSprites.addFromAtlas({ name: "impact_" + game.rnd.integer(), group: 'noimpactExplosions', x: x, y: y, atlas: atlas, filename: data.spriteAnimation[0] });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        game.physics.enable(explosion, Phaser.Physics.ARCADE);
        explosion.animations.add('explosion', data.spriteAnimation, 1, true);
        explosion.animations.play('explosion', 30, false).onComplete.add(function () {
            explosion.destroyIt();
        }, explosion);
        explosion.destroyIt = function () {
            phaserSprites.destroy(explosion.name);
        };
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        return explosion;
    };
    WEAPON_MANAGER.prototype.electricDischarge = function (x, y, scale, layer) {
        var game = this.game;
        var _a = this, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var data = {
            spriteAnimation: Phaser.Animation.generateFrameNames('disintegrate', 1, 10)
        };
        var explosion = phaserSprites.addFromAtlas({ name: "impact_" + game.rnd.integer(), group: 'noimpactExplosions', x: x, y: y, atlas: atlas, filename: data.spriteAnimation[0] });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        game.physics.enable(explosion, Phaser.Physics.ARCADE);
        explosion.animations.add('explosion', data.spriteAnimation, 1, true);
        explosion.animations.play('explosion', 30, false).onComplete.add(function () {
            explosion.destroyIt();
        }, explosion);
        explosion.destroyIt = function () {
            phaserSprites.destroy(explosion.name);
        };
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        return explosion;
    };
    return WEAPON_MANAGER;
}());
