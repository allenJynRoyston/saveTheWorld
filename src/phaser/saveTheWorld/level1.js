var PhaserGameObject = (function () {
    function PhaserGameObject() {
        this.game = null;
        this.global = {
            pause: false
        };
    }
    PhaserGameObject.prototype.init = function (el, parent, options) {
        var game = new Phaser.Game(options.width, options.height, Phaser.WEBGL, el, { preload: preload, create: create, update: update });
        game.preserveDrawingBuffer = true;
        var phaserMaster = new PHASER_MASTER({ game: game, resolution: { width: options.width, height: options.height } }), phaserControls = new PHASER_CONTROLS(), phaserMouse = new PHASER_MOUSE({ showDebugger: false }), phaserSprites = new PHASER_SPRITE_MANAGER(), phaserBmd = new PHASER_BITMAPDATA_MANAGER(), phaserTexts = new PHASER_TEXT_MANAGER(), phaserButtons = new PHASER_BUTTON_MANAGER(), phaserGroup = new PHASER_GROUP_MANAGER(), phaserBitmapdata = new PHASER_BITMAPDATA_MANAGER(), weaponManager = new WEAPON_MANAGER(), enemyManager = new ENEMY_MANAGER({ showHitbox: true }), playerManager = new PLAYER_MANAGER(), utilityManager = new UTILITY_MANAGER();
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
            game.load.image('background', folder + "/images/starfield.png");
            game.load.atlas('atlas_main', folder + "/spritesheets/main/main.png", folder + "/spritesheets/main/main.json", Phaser.Loader.TEXTURE_atlas_main_JSON_HASH);
            game.load.atlas('atlas_weapons', folder + "/spritesheets/weapons/weaponsAtlas.png", folder + "/spritesheets/weapons/weaponsAtlas.json", Phaser.Loader.TEXTURE_atlas_main_JSON_HASH);
            game.load.atlas('atlas_large', folder + "/spritesheets/large/large.png", folder + "/spritesheets/large/large.json", Phaser.Loader.TEXTURE_atlas_main_JSON_HASH);
            game.load.atlas('atlas_enemies', folder + "/spritesheets/enemies/enemies.png", folder + "/spritesheets/enemies/enemies.json", Phaser.Loader.TEXTURE_atlas_main_JSON_HASH);
            game.load.atlas('atlas_ships', folder + "/spritesheets/ships/ships.png", folder + "/spritesheets/ships/ships.json", Phaser.Loader.TEXTURE_atlas_main_JSON_HASH);
            game.load.json('weaponData', folder + "/json/weaponData.json");
            game.load.bitmapFont('gem', folder + "/fonts/gem.png", folder + "/fonts/gem.xml");
            phaserMaster.changeState('PRELOAD');
            new PHASER_PRELOADER({ game: game, delayInSeconds: 0, done: function () { preloadComplete(); } });
        }
        function tweenTint(obj, startColor, endColor, time) {
            var game = phaserMaster.game();
            var colorBlend = { step: 0 };
            var colorTween = game.add.tween(colorBlend).to({ step: 100 }, time);
            colorTween.onUpdateCallback(function () {
                obj.tint = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend.step);
            });
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
            enemyManager.assign(game, phaserMaster, phaserSprites, phaserTexts, phaserGroup, weaponManager, 'atlas_enemies', 'atlas_weapons');
            playerManager.assign(game, phaserMaster, phaserSprites, phaserTexts, phaserGroup, phaserControls, weaponManager, 'atlas_ships', 'atlas_weapons');
            utilityManager.assign(game, phaserSprites, phaserBitmapdata, phaserGroup, 'atlas_main');
            phaserMaster.let('roundTime', 60);
            phaserMaster.let('clock', game.time.create(false));
            phaserMaster.let('elapsedTime', 0);
            phaserMaster.let('devMode', false);
            phaserMaster.let('starMomentum', { x: 0, y: 0 });
            phaserMaster.let('pauseStatus', false);
            phaserMaster.let('firepowerUp', 1);
            var weaponData = phaserMaster.let('weaponData', game.cache.getJSON('weaponData'));
            var pw = phaserMaster.let('primaryWeapon', weaponData.primaryWeapons[gameData.primaryWeapon]);
            var sw = phaserMaster.let('secondaryWeapon', weaponData.secondaryWeapons[gameData.secondaryWeapon]);
            var perk = phaserMaster.let('perk', weaponData.perks[gameData.perk]);
            game.onPause.add(function () {
                pauseGame();
            }, this);
            game.onResume.add(function () {
                unpauseGame();
            }, this);
            utilityManager.buildOverlayBackground('#ffffff', '#ffffff', 19, true);
            utilityManager.buildOverlayGrid(240, 132, 20, 'logo_small.png');
            var boundryObj = phaserBitmapdata.addGradient({ name: 'boundryObj', start: '#ffffff', end: '#ffffff', width: 5, height: 5, render: false });
            var leftBoundry = phaserSprites.add({ x: -9, y: -game.world.height / 2, name: "leftBoundry", group: 'boundries', width: 10, height: game.world.height * 2, reference: boundryObj.cacheBitmapData, alpha: 0 });
            var rightBoundry = phaserSprites.add({ x: game.world.width - 1, y: -game.world.height / 2, name: "rightBoundry", group: 'boundries', width: 10, height: game.world.height * 2, reference: boundryObj.cacheBitmapData, alpha: 0 });
            game.physics.enable([leftBoundry, rightBoundry], Phaser.Physics.ARCADE);
            leftBoundry.body.immovable = true;
            rightBoundry.body.immovable = true;
            var background = phaserSprites.addTilespriteFromAtlas({ name: 'background', group: 'spaceGroup', x: 0, y: 0, width: game.canvas.width, height: game.canvas.height, atlas: 'atlas_large', filename: 'spacebg.png' });
            background.count = 0;
            background.onUpdate = function () {
                this.count += 0.005;
                this.tilePosition.y -= Math.sin(this.count) * 0.2;
            };
            phaserGroup.add(0, background);
            var emitter = phaserMaster.let('emitter', game.add.emitter(game, 0, 0, 5000));
            emitter.makeParticles('atlas_main', 'particle.png');
            emitter.gravity = 0;
            phaserGroup.layer(1).add(emitter);
            var _loop_1 = function (i) {
                var star = phaserSprites.addFromAtlas({ x: game.rnd.integerInRange(0, game.world.width), y: game.rnd.integerInRange(0, game.world.height), name: "star_" + i, group: 'movingStarField', filename: "stars_layer_" + game.rnd.integerInRange(1, 3) + ".png", atlas: 'atlas_main', visible: true });
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
                phaserGroup.layer(4 - star.starType).add(star);
            };
            for (var i = 0; i < 25; i++) {
                _loop_1(i);
            }
            var nebula1 = phaserSprites.addTilespriteFromAtlas({ name: 'nebula1', group: 'spaceGroup', x: 0, y: 0, width: game.canvas.width, height: game.canvas.height, atlas: 'atlas_large', filename: 'Nebula1.png' });
            nebula1.count = 0;
            nebula1.onUpdate = function () {
                this.count += 0.005;
                this.tilePosition.x -= Math.sin(this.count) * 0.2;
            };
            var nebula2 = phaserSprites.addTilespriteFromAtlas({ name: 'nebula2', group: 'spaceGroup', x: 0, y: 0, width: game.canvas.width, height: game.canvas.height, atlas: 'atlas_large', filename: 'Nebula2.png' });
            nebula2.count = 0;
            nebula2.onUpdate = function () {
                this.count += 0.005;
                this.tilePosition.y += 0.2;
                this.tilePosition.x += 0.2;
            };
            var earth = phaserSprites.addFromAtlas({ x: this.game.world.centerX, y: this.game.canvas.height + 400, name: "earth", group: 'spaceGroup', filename: 'earth.png', atlas: 'atlas_main', visible: true });
            earth.scale.setTo(2, 2);
            earth.anchor.setTo(0.5, 0.5);
            earth.onUpdate = function () {
                earth.angle += 0.01;
            };
            earth.fadeOut = function () {
                this.game.add.tween(this).to({ y: this.y - 200 }, Phaser.Timer.SECOND * 1, Phaser.Easing.Circular.In, true, 0, 0, false).autoDestroy = true;
                this.game.add.tween(this.scale).to({ x: 2.5, y: 2.5 }, Phaser.Timer.SECOND * 1, Phaser.Easing.Circular.In, true, 0, 0, false).autoDestroy = true;
            };
            earth.selfDestruct = function () {
                var _this = this;
                tweenTint(this, this.tint, 1 * 0xff0000, Phaser.Timer.SECOND * 20);
                setTimeout(function () {
                    _this.tint = 1 * 0xff0000;
                }, Phaser.Timer.SECOND * 20 + 1);
                var endExplosion = setInterval(function () {
                    weaponManager.createExplosion(game.rnd.integerInRange(0, _this.game.canvas.width), game.rnd.integerInRange(_this.game.canvas.height - 200, _this.game.canvas.height), 0.25, 6);
                }, 100);
                phaserMaster.let('endExplosion', endExplosion);
            };
            phaserGroup.addMany(2, [earth]);
            phaserGroup.addMany(1, [nebula1, nebula2]);
            var timeContainer = phaserSprites.addFromAtlas({ name: "timerContainer", group: 'ui', filename: 'ui_container1.png', atlas: 'atlas_main', visible: false });
            phaserSprites.centerOnPoint('timerContainer', this.game.world.centerX, -200);
            timeContainer.reveal = function () {
                var _this = this;
                this.visible = true;
                this.game.add.tween(this).to({ y: 5 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false).
                    onComplete.add(function () {
                    var timeKeeper = phaserTexts.add({ y: 36, x: _this.game.world.centerX, name: 'timeKeeper', group: 'ui_text', font: 'gem', size: 42, default: "00", visible: false });
                    timeKeeper.anchor.setTo(0.5, 0.5);
                    timeKeeper.reveal = function () {
                        this.visible = true;
                        this.alpha = 0;
                        this.game.add.tween(this).to({ alpha: 1 }, Phaser.Timer.SECOND / 2, Phaser.Easing.Linear.In, true, 0, 0, false);
                        phaserGroup.add(15, this);
                    };
                    timeKeeper.onUpdate = function () {
                        var currentState = phaserMaster.getState().currentState;
                        var _a = phaserMaster.getOnly(['elapsedTime', 'clock', 'roundTime']), elapsedTime = _a.elapsedTime, clock = _a.clock, roundTime = _a.roundTime;
                        elapsedTime += (clock.elapsed * .001);
                        phaserMaster.forceLet('elapsedTime', elapsedTime);
                        var inSeconds = parseInt((roundTime - elapsedTime).toFixed(0));
                        if (inSeconds >= 0) {
                            this.setText("" + inSeconds);
                        }
                        else {
                            if (phaserSprites.getGroup('boss').length === 0 && currentState === 'READY') {
                                phaserSprites.get('timerContainer').hide();
                                this.hide();
                                setTimeout(function () {
                                    bossContainer.reveal();
                                }, 500);
                                createBoss({
                                    x: game.rnd.integerInRange(100, game.canvas.width - 100),
                                    y: game.rnd.integerInRange(-50, -100),
                                    ix: game.rnd.integerInRange(-100, 100),
                                    iy: 5,
                                    layer: 4
                                });
                            }
                        }
                    };
                    timeKeeper.hide = function () {
                        this.game.add.tween(this).to({ alpha: 0 }, Phaser.Timer.SECOND / 2, Phaser.Easing.Linear.Out, true, 0, 0, false);
                    };
                    timeKeeper.reveal();
                });
            };
            timeContainer.hide = function () {
                this.game.add.tween(this).to({ y: -200 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 500, 0, false);
                phaserTexts.get('timeKeeper').hide();
            };
            var scoreContainer = phaserSprites.addFromAtlas({ name: "scoreContainer", group: 'ui', filename: 'ui_roundContainer.png', atlas: 'atlas_main', visible: false });
            scoreContainer.anchor.setTo(0.5, 0.5);
            scoreContainer.reveal = function () {
                var _this = this;
                this.x = this.game.world.width - this.width / 2 - 10;
                this.y = -200;
                this.visible = true;
                this.game.add.tween(this).to({ y: 20 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false).
                    onComplete.add(function () {
                    scoreText.reveal(_this.x, _this.y);
                });
            };
            scoreContainer.hide = function () {
                this.game.add.tween(this).to({ y: -200 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 500, 0, false);
                phaserTexts.get('scoreText').hide();
            };
            var scoreText = phaserTexts.add({ name: 'scoreText', group: 'ui_text', font: 'gem', size: 14, default: "" + gameData.score, alpha: 0 });
            scoreText.anchor.setTo(0.5, 0.5);
            scoreText.onUpdate = function () { };
            scoreText.updateScore = function () {
                this.setText("" + phaserMaster.get('gameData').score);
            };
            scoreText.reveal = function (x, y) {
                this.x = scoreContainer.x;
                this.y = scoreContainer.y;
                this.game.add.tween(this).to({ alpha: 1 }, Phaser.Timer.SECOND / 2, Phaser.Easing.Linear.In, true, 0, 0, false);
            };
            scoreText.hide = function () {
                this.game.add.tween(this).to({ alpha: 0 }, Phaser.Timer.SECOND / 2, Phaser.Easing.Linear.In, true, 0, 0, false);
            };
            var statusContainer = phaserSprites.addFromAtlas({ name: "statusContainer", group: 'ui', filename: 'ui_statusContainer.png', atlas: 'atlas_main', visible: false });
            statusContainer.reveal = function () {
                this.x = -this.width;
                this.y = this.game.world.height - this.height - 10;
                this.visible = true;
                this.game.add.tween(this).to({ x: 10 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false).
                    onComplete.add(function () {
                    var healthBar = phaserSprites.addFromAtlas({ x: statusContainer.x + 7, y: statusContainer.y + 22, name: "healthBar", group: 'ui_overlay', filename: 'ui_shieldBar.png', atlas: 'atlas_main', visible: true });
                    var maskhealth = phaserMaster.let('healthBar', phaserSprites.addBasicMaskToSprite(healthBar));
                    maskhealth.y = healthBar.height;
                    updateShipHealthbar(gameData.player.health);
                    var specialBar = phaserSprites.addFromAtlas({ x: statusContainer.x + 30, y: statusContainer.y + 206, name: "specialBar", group: 'ui_overlay', filename: 'ui_specialBar.png', atlas: 'atlas_main', visible: true });
                    var maskspecial = phaserMaster.let('specialBar', phaserSprites.addBasicMaskToSprite(specialBar));
                    maskspecial.y = specialBar.height;
                    updateShipSpecial(100);
                    var specialWeapon = phaserSprites.addFromAtlas({ x: statusContainer.x + 36, y: statusContainer.y + 305, name: "specialWeapon", group: 'ui_overlay', filename: "" + sw.spriteIcon, atlas: 'atlas_weapons', visible: false });
                    specialWeapon.anchor.setTo(0.5, 0.5);
                    specialWeapon.onUpdate = function () {
                        this.angle += 2;
                    };
                    specialWeapon.reveal = function () {
                        this.visible = true;
                        specialWeapon.scale.setTo(2, 2);
                        this.game.add.tween(this.scale).to({ x: 1.5, y: 1.5 }, Phaser.Timer.SECOND, Phaser.Easing.Bounce.Out, true, 0, 0, false);
                    };
                    specialWeapon.hide = function () {
                        this.visible = false;
                    };
                    specialWeapon.reveal();
                    phaserGroup.addMany(14, [healthBar, specialBar, specialWeapon]);
                });
            };
            statusContainer.hide = function () {
                updateShipSpecial(0);
                updateShipHealthbar(0);
                phaserSprites.getGroup('ui_overlay').map(function (obj) {
                    obj.hide();
                });
                this.game.add.tween(this).to({ y: this.game.world.height + this.height }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 500, 0, false);
            };
            var earthContainer = phaserSprites.addFromAtlas({ name: "earthContainer", group: 'ui', filename: 'ui_shield.png', atlas: 'atlas_main', visible: false });
            earthContainer.reveal = function () {
                var _this = this;
                this.x = this.game.world.width + this.width;
                this.y = this.game.world.height - this.height - 10;
                this.visible = true;
                this.game.add.tween(this).to({ x: this.game.world.width - this.width - 10 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false).
                    onComplete.add(function () {
                    _this.defaultPosition.x = _this.x;
                    _this.defaultPosition.y = _this.y;
                    var earthBar = phaserSprites.addFromAtlas({ x: earthContainer.x + 5, y: earthContainer.y + 5, name: "earthBar", group: 'ui_overlay', filename: 'ui_healthBar.png', atlas: 'atlas_main', visible: true });
                    var maskhealth = phaserMaster.let('earthBar', phaserSprites.addBasicMaskToSprite(earthBar));
                    maskhealth.x = -earthBar.width;
                    var population = gameData.population;
                    var damageTaken = 100 - ((population.killed / population.total) * 100);
                    updateEarthbar(damageTaken);
                });
            };
            earthContainer.hide = function () {
                updateEarthbar(0);
                this.game.add.tween(this).to({ y: this.game.world.height + this.height }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 500, 0, false);
            };
            earthContainer.takeDamage = function () {
                var _this = this;
                this.game.add.tween(this).to({ x: this.defaultPosition.x - 5 }, 50, Phaser.Easing.Bounce.In, true, 0, 0, false).
                    onComplete.add(function () {
                    _this.game.add.tween(_this).to({ x: _this.defaultPosition.x + 3 }, 50, Phaser.Easing.Bounce.Out, true, 0, 0, false)
                        .onComplete.add(function () {
                        _this.game.add.tween(_this).to({ x: _this.defaultPosition.x }, 50, Phaser.Easing.Bounce.InOut, true, 0, 0, false);
                    });
                });
            };
            var bossContainer = phaserSprites.addFromAtlas({ name: "bossContainer", group: 'bosshealth', filename: 'ui_shield.png', atlas: 'atlas_main', visible: false });
            bossContainer.anchor.setTo(0.5, 0.5);
            bossContainer.reveal = function () {
                var _this = this;
                this.x = this.game.world.centerX;
                this.y = -this.height;
                this.visible = true;
                this.game.add.tween(this).to({ y: 20 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false).
                    onComplete.add(function () {
                    _this.defaultPosition.x = _this.x;
                    _this.defaultPosition.y = _this.y;
                    var bossBar = phaserSprites.addFromAtlas({ x: bossContainer.x - bossContainer.width / 2 + 5, y: bossContainer.y - bossContainer.height / 2 + 5, name: "bossBar", group: 'bosshealth', filename: 'ui_BossHealthBar.png', atlas: 'atlas_main', visible: true });
                    var maskhealth = phaserMaster.let('bossBar', phaserSprites.addBasicMaskToSprite(bossBar));
                    maskhealth.x = -bossBar.width;
                    updateBossBar(100);
                });
            };
            bossContainer.hide = function () {
                updateBossBar(0);
                this.game.add.tween(this).to({ y: -this.height }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 500, 0, false);
            };
            var portraitContainer = phaserSprites.addFromAtlas({ x: 10, name: "portraitContainer", group: 'ui', filename: 'ui_portraitContainer.png', atlas: 'atlas_main', visible: false });
            portraitContainer.reveal = function () {
                var _this = this;
                this.y = -this.height - 10;
                this.visible = true;
                this.game.add.tween(this).to({ y: 10 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 0, 0, false).
                    onComplete.add(function () {
                    var characterPortrait = phaserSprites.addFromAtlas({ x: _this.x + 2, y: _this.y + 2, name: "characterPortrait", group: 'ui_overlay', filename: 'ui_portrait_1.png', atlas: 'atlas_main', alpha: 0 });
                    characterPortrait.reveal = function () {
                        this.game.add.tween(this).to({ alpha: 1 }, Phaser.Timer.SECOND / 2, Phaser.Easing.Linear.In, true, 0, 0, false);
                    };
                    characterPortrait.hide = function () {
                        this.game.add.tween(this).to({ alpha: 0 }, Phaser.Timer.SECOND / 2, Phaser.Easing.Linear.In, true, 0, 0, false);
                    };
                    characterPortrait.reveal();
                    for (var i = 0; i < gameData.player.lives; i++) {
                        var lifeIcon = phaserSprites.addFromAtlas({ x: _this.x + 12 + (i * 20), y: _this.y + _this.height + 10, name: "lifeIcon_" + i, group: 'ui_overlay', filename: 'ship_icon.png', atlas: 'atlas_main', alpha: 0 });
                        lifeIcon.anchor.setTo(0.5, 0.5);
                        lifeIcon.reveal = function () {
                            this.game.add.tween(this).to({ alpha: 1 }, Phaser.Timer.SECOND / 2, Phaser.Easing.Linear.In, true, 0, 0, false);
                        };
                        lifeIcon.hide = function () {
                            this.game.add.tween(this).to({ alpha: 0 }, Phaser.Timer.SECOND / 2, Phaser.Easing.Linear.In, true, 0, 0, false);
                        };
                        lifeIcon.destroyIt = function () {
                            phaserSprites.destroy(this.name);
                        };
                        lifeIcon.reveal();
                    }
                    phaserGroup.addMany(12, [characterPortrait]);
                });
            };
            portraitContainer.hide = function () {
                this.game.add.tween(this).to({ y: -this.height }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 500, 0, false);
            };
            var menuButton1 = phaserSprites.addFromAtlas({ name: "menuButton1", group: 'ui_buttons', x: game.world.centerX, y: game.world.centerY + 125, atlas: 'atlas_main', filename: 'ui_button.png', visible: false });
            menuButton1.anchor.setTo(0.5, 0.5);
            menuButton1.reveal = function () {
                this.visible = true;
            };
            var menuButton1Text = phaserTexts.add({ name: 'menuButton1Text', group: 'ui', font: 'gem', x: menuButton1.x, y: menuButton1.y, size: 14, default: "" });
            menuButton1Text.anchor.setTo(0.5, 0.5);
            var menuButton2 = phaserSprites.addFromAtlas({ name: "menuButton2", group: 'ui_buttons', x: game.world.centerX, y: game.world.centerY + 175, atlas: 'atlas_main', filename: 'ui_button.png', visible: false });
            menuButton2.anchor.setTo(0.5, 0.5);
            menuButton2.reveal = function () {
                this.visible = true;
            };
            var menuButton2Text = phaserTexts.add({ name: 'menuButton2Text', group: 'ui', font: 'gem', x: menuButton2.x, y: menuButton2.y, size: 14, default: "" });
            menuButton2Text.anchor.setTo(0.5, 0.5);
            var menuButtonCursor = phaserSprites.addFromAtlas({ name: "menuButtonCursor", group: 'ui_buttons', x: game.world.centerX - 125, atlas: 'atlas_main', filename: 'ui_cursor.png', visible: false });
            menuButtonCursor.anchor.setTo(0.5, 0.5);
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
            phaserGroup.addMany(13, [timeContainer, statusContainer, scoreContainer, earthContainer, portraitContainer]);
            var overlaybmd = phaserBitmapdata.addGradient({ name: 'overlaybmd', start: '#2f2f2f', end: '#2f2f2f', width: 5, height: 5, render: false });
            var overlay = phaserSprites.add({ x: 0, y: 0, name: "overlay", width: game.canvas.width, height: game.canvas.height, reference: overlaybmd.cacheBitmapData, visible: true });
            overlay.fadeIn = function (duration, callback) {
                game.add.tween(this).to({ alpha: 1 }, duration, Phaser.Easing.Linear.In, true, 0, 0, false);
                setTimeout(function () {
                    callback();
                }, duration);
            };
            overlay.fadeOut = function (duration, callback) {
                game.add.tween(this).to({ alpha: 0 }, duration, Phaser.Easing.Linear.Out, true, 0, 0, false);
                setTimeout(function () {
                    callback();
                }, duration);
            };
            phaserGroup.addMany(10, [overlay]);
        }
        function preloadComplete() {
            var game = phaserMaster.game();
            var isDevMode = phaserMaster.get('devMode');
            var overlay = phaserSprites.getOnly(['overlay']).overlay;
            var _a = phaserMaster.getOnly(['clock', 'roundTime']), clock = _a.clock, roundTime = _a.roundTime;
            overlayControls('WIPEOUT', function () {
                utilityManager.overlayBGControls({ transition: 'FADEOUT', delay: 0, speed: 250 }, function () {
                    var player = createPlayer();
                    overlay.fadeOut(isDevMode ? 0 : Phaser.Timer.SECOND / 2, function () {
                        playSequence('SAVE THE WORLD', function () {
                            player.moveToStart();
                            game.time.events.add(isDevMode ? Phaser.Timer.SECOND * 0 : Phaser.Timer.SECOND * 1, function () {
                                playSequence(roundTime + " SECONDS GO", function () {
                                    game.time.events.add(isDevMode ? Phaser.Timer.SECOND * 0 : Phaser.Timer.SECOND / 2, function () {
                                        phaserSprites.getGroup('ui').map(function (sprite) {
                                            sprite.reveal();
                                            phaserMaster.changeState('READY');
                                        });
                                    }).autoDestroy = true;
                                    clock.start();
                                });
                            });
                        });
                    });
                });
            });
        }
        function overlayControls(transition, callback) {
            if (callback === void 0) { callback = function () { }; }
            utilityManager.overlayControls({ transition: transition, delay: 1000, speed: 250, tileDelay: 5 }, callback);
        }
        function updateShipHealthbar(remaining, immediate, duration) {
            if (immediate === void 0) { immediate = false; }
            if (duration === void 0) { duration = Phaser.Timer.SECOND / 3; }
            var game = phaserMaster.game();
            var bars = Math.ceil(30 * (remaining * .01));
            var _a = phaserMaster.getAll(), healthBar = _a.healthBar, healthBarTween = _a.healthBarTween;
            if (healthBarTween !== undefined) {
                healthBarTween.stop();
            }
            phaserMaster.forceLet('healthBarTween', game.add.tween(healthBar).to({ y: 231 - (7.7 * bars) }, immediate ? 1 : duration, Phaser.Easing.Linear.Out, true, 0, 0, false));
        }
        function updateShipSpecial(remaining, immediate, duration) {
            if (immediate === void 0) { immediate = false; }
            if (duration === void 0) { duration = Phaser.Timer.SECOND / 3; }
            var game = phaserMaster.game();
            var bars = Math.ceil(6 * (remaining * .01));
            var _a = phaserMaster.getAll(), specialBar = _a.specialBar, specialBarTween = _a.specialBarTween;
            if (specialBarTween !== undefined) {
                specialBarTween.stop();
            }
            phaserMaster.forceLet('specialBarTween', game.add.tween(specialBar).to({ y: 48 - (8 * bars) }, immediate ? 1 : duration, Phaser.Easing.Linear.Out, true, 0, 0, false));
        }
        function updateEarthbar(remaining, immediate, duration) {
            if (immediate === void 0) { immediate = false; }
            if (duration === void 0) { duration = Phaser.Timer.SECOND / 3; }
            var game = phaserMaster.game();
            var bars = (10 * (remaining * .01));
            var _a = phaserMaster.getAll(), earthBar = _a.earthBar, earthBarTween = _a.earthBarTween;
            if (earthBarTween !== undefined) {
                earthBarTween.stop();
            }
            phaserMaster.forceLet('earthBarTween', game.add.tween(earthBar).to({ x: -244 + (24.4 * bars) }, immediate ? 1 : duration, Phaser.Easing.Linear.Out, true, 0, 0, false));
        }
        function updateBossBar(remaining) {
            var game = phaserMaster.game();
            var bars = (10 * (remaining * .01));
            var bossBar = phaserMaster.getAll().bossBar;
            if (bossBar !== undefined) {
                game.add.tween(bossBar).to({ x: -244 + (24.4 * bars) }, 1, Phaser.Easing.Linear.Out, true, 0, 0, false);
            }
        }
        function earthTakeDamage(val) {
            var gameData = phaserMaster.getAll().gameData;
            var currentState = phaserMaster.getState().currentState;
            var earthContainer = phaserSprites.getAll().earthContainer;
            var population = gameData.population;
            population.killed += val;
            var damageTaken = 100 - ((population.killed / population.total) * 100);
            if (damageTaken <= 0 && currentState !== 'GAMEOVER') {
                gameOver();
            }
            else {
                earthContainer.takeDamage();
                updateEarthbar(damageTaken, true);
                saveData('population', { total: population.total, killed: population.killed });
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
                    setTimeout(function () {
                        phaserTexts.destroy(_this.name);
                    }, 350);
                };
                game.time.events.add((Phaser.Timer.SECOND / 2.5 * index) + 100, splashText.startSplash, splashText).autoDestroy = true;
            });
            game.time.events.add(Phaser.Timer.SECOND / 2.5 * wordlist.length, callback, this).autoDestroy = true;
        }
        function createPlayer() {
            var game = phaserMaster.game();
            var _a = phaserMaster.getOnly(['gameData', 'primaryWeapon', 'secondaryWeapon', 'perk']), gameData = _a.gameData, primaryWeapon = _a.primaryWeapon, secondaryWeapon = _a.secondaryWeapon, perk = _a.perk;
            var onUpdate = function (player) {
                var currentState = phaserMaster.getState().currentState;
                if (!player.isInvincible && (currentState !== 'ENDLEVEL')) {
                    var hasCollided_1 = false;
                    returnAllCollidables().map(function (target) {
                        if (target.game !== null) {
                            if (target.game.physics !== null) {
                                target.game.physics.arcade.overlap(player, target, function (player, target) {
                                    hasCollided_1 = true;
                                    target.parent.damageIt(50);
                                }, null, player);
                            }
                        }
                    });
                    if (hasCollided_1) {
                        player.isInvincible = true;
                        player.takeDamage(10);
                    }
                }
            };
            var updateHealth = function (health) {
                var gameData = phaserMaster.getOnly(['gameData']).gameData;
                updateShipHealthbar(health);
                saveData('player', { health: health, lives: gameData.player.lives });
            };
            var loseLife = function (player) {
                var gameData = phaserMaster.getOnly(['gameData']).gameData;
                gameData.player.lives--;
                phaserSprites.get("lifeIcon_" + gameData.player.lives).destroyIt();
                if (gameData.player.lives > 0) {
                    saveData('player', { health: 100, lives: gameData.player.lives });
                    phaserControls.clearAllControlIntervals();
                    phaserControls.disableAllInput();
                    player.isDestroyed();
                }
                else {
                    gameOver();
                }
            };
            var player = playerManager.createShip({ name: 'player', group: 'playership', layer: 8, shipId: gameData.pilot }, updateHealth, loseLife, onUpdate);
            player.attachPerk(perk.reference);
            player.attachWeapon(primaryWeapon.reference);
            player.attachSubweapon(secondaryWeapon.reference);
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
            };
            var onDamage = function () { };
            var onFail = function () { };
            var onUpdate = function () { };
            var enemy = enemyManager.createSmallEnemy1(options, onDamage, onDestroy, onFail, onUpdate);
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
            var onFail = function () { earthTakeDamage(2); };
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
            var onFail = function () { earthTakeDamage(1); };
            var onUpdate = function () { };
            var enemy = enemyManager.createDebris(options, onDamage, onDestroy, onFail, onUpdate);
        }
        function createBoss(options) {
            var game = phaserMaster.game();
            var bossContainer = phaserSprites.getOnly(['bossContainer']).bossContainer;
            var onDestroy = function (enemy) {
                bossContainer.hide();
                var gameData = phaserMaster.getOnly(['gameData']).gameData;
                gameData.score += 10000;
                saveData('score', gameData.score);
                var scoreText = phaserTexts.getOnly(['scoreText']).scoreText;
                scoreText.updateScore();
                endLevel();
            };
            var onDamage = function (boss) {
                var remainingHealth = Math.round(boss.health / boss.maxHealth * 100);
                updateBossBar(remainingHealth);
            };
            var onFail = function () {
                phaserMaster.changeState('ENDLEVEL');
                bossContainer.hide();
                earthTakeDamage(50);
                setTimeout(function () {
                    var currentState = phaserMaster.getState().currentState;
                    if (currentState !== 'GAMEOVER') {
                        endLevel();
                    }
                }, 1000);
            };
            var onUpdate = function () { };
            var enemy = enemyManager.createGiantAsteroid(options, onDamage, onDestroy, onFail, onUpdate);
        }
        function targetCheck(obj, wpnType) {
            if (wpnType === void 0) { wpnType = null; }
            returnAllCollidables().map(function (target) {
                if (target.game !== null) {
                    if (target.game.physics !== null) {
                        target.game.physics.arcade.overlap(obj, target, function (obj, target) {
                            obj.pierceStrength -= target.parent.pierceResistence;
                            target.parent.damageIt(obj.damageAmount, wpnType);
                            if (obj.pierceStrength <= 0) {
                                obj.destroyIt();
                            }
                        }, null, obj);
                    }
                }
            });
        }
        function fireBullet() {
            var game = phaserMaster.game();
            var player = phaserSprites.getOnly(['player']).player;
            var firepowerUp = phaserMaster.getOnly(['firepowerUp']).firepowerUp;
            var _a = { gap: 10, shots: 2 + (2 * firepowerUp) }, gap = _a.gap, shots = _a.shots;
            var centerShots = (gap * (shots - 1)) / 2;
            player.fireWeapon();
            var _loop_2 = function (i) {
                setTimeout(function () {
                    var onUpdate = function (obj) { targetCheck(obj, 'BULLET'); };
                    var onDestroy = function () { };
                    weaponManager.createBullet({ name: "bullet_" + game.rnd.integer(), group: 'ship_weapons', x: player.x + (i * gap) - centerShots, y: player.y, spread: 0, layer: player.onLayer + 1 }, onDestroy, onUpdate);
                }, 25);
            };
            for (var i = 0; i < shots; i++) {
                _loop_2(i);
            }
        }
        function fireLasers() {
            var game = phaserMaster.game();
            var player = phaserSprites.getOnly(['player']).player;
            var firepowerUp = phaserMaster.getOnly(['firepowerUp']).firepowerUp;
            var _a = { gap: 30, shots: 1 + (1 * firepowerUp) }, gap = _a.gap, shots = _a.shots;
            var centerShots = (gap * (shots - 1)) / 2;
            player.fireWeapon();
            for (var i = 0; i < shots; i++) {
                var onUpdate = function (obj) { targetCheck(obj, 'LASER'); };
                var onDestroy = function () { };
                weaponManager.createLaser({ name: "laser_" + game.rnd.integer(), group: 'ship_weapons', x: player.x + (i * gap) - centerShots, y: player.y - player.height / 2, spread: 0, layer: player.onLayer + 1 }, onDestroy, onUpdate);
            }
        }
        function fireMissles() {
            var game = phaserMaster.game();
            var player = phaserSprites.getOnly(['player']).player;
            var firepowerUp = phaserMaster.getOnly(['firepowerUp']).firepowerUp;
            var _a = { gap: 30, shots: 2 + (2 * firepowerUp) }, gap = _a.gap, shots = _a.shots;
            var centerShots = (gap * (shots - 1)) / 2;
            player.fireWeapon();
            for (var i = 0; i < shots; i++) {
                var onUpdate = function (obj) { targetCheck(obj, 'MISSLE'); };
                var onDestroy = function (obj) { impactExplosion(obj.x + obj.height, obj.y, 1, obj.damageAmount / 2); };
                weaponManager.createMissle({ name: "missle_" + game.rnd.integer(), group: 'ship_weapons', x: player.x + (i * gap) - centerShots, y: player.y - player.height / 2, spread: (i % 2 === 0 ? -0.50 : 0.50), layer: player.onLayer + 1 }, onDestroy, onUpdate);
            }
        }
        function createClusterbomb() {
            var game = phaserMaster.game();
            var player = phaserSprites.getOnly(['player']).player;
            var onUpdate = function (obj) { targetCheck(obj); };
            var onDestroy = function (obj) {
                for (var i = 0; i < obj.bomblets; i++) {
                    createBomblet({
                        x: obj.x,
                        y: obj.y,
                        ix: game.rnd.integerInRange(-400, 400),
                        iy: game.rnd.integerInRange(-400, 100),
                        damage: obj.damageAmount / 4,
                        group: 'ship_weapons',
                        layer: 2
                    });
                }
            };
            player.fireSubweapon();
            weaponManager.createClusterbomb({ name: "clusterbomb_" + game.rnd.integer(), group: 'ship_secondary_weapons', x: player.x, y: player.y, layer: player.onLayer + 1 }, onDestroy, onUpdate);
        }
        function createTriplebomb() {
            var game = phaserMaster.game();
            var player = phaserSprites.getOnly(['player']).player;
            var onUpdate = function (obj) { targetCheck(obj); };
            var onDestroy = function (obj) { };
            for (var i = 0; i < 3; i++) {
                setTimeout(function () {
                    player.fireSubweapon();
                    weaponManager.createTriplebomb({ name: "triplebomb_" + game.rnd.integer(), group: 'ship_secondary_weapons', x: player.x, y: player.y, layer: player.onLayer + 1 }, onDestroy, onUpdate);
                }, i * 300);
            }
        }
        function createTurret() {
            var game = phaserMaster.game();
            var player = phaserSprites.getOnly(['player']).player;
            var onInit = function (obj) {
                var _a = { gap: 10, shots: 3 }, gap = _a.gap, shots = _a.shots;
                var centerShots = (gap * (shots - 1)) / 2;
                obj.fireInterval = setInterval(function () {
                    for (var i = 0; i < shots; i++) {
                        var onUpdate_1 = function (obj) { targetCheck(obj); };
                        var onDestroy_1 = function () { };
                        weaponManager.createBullet({ name: "bullet_" + game.rnd.integer(), group: 'ship_secondary_weapons', x: obj.x + (i * gap) - centerShots, y: obj.y, spread: 0, layer: player.onLayer + 1 }, onDestroy_1, onUpdate_1);
                    }
                }, 200);
                obj.fireInterval;
            };
            var onUpdate = function (obj) {
                obj.x = player.x - obj.offset;
                obj.y = player.y;
            };
            var onDestroy = function (obj) { };
            player.fireSubweapon();
            weaponManager.createTurret({ name: "turret_" + game.rnd.integer(), group: 'ship_secondary_weapons', x: player.x, y: player.y, offset: 50, layer: player.onLayer + 2 }, onInit, onDestroy, onUpdate);
            weaponManager.createTurret({ name: "turret_" + game.rnd.integer(), group: 'ship_secondary_weapons', x: player.x, y: player.y, offset: -50, layer: player.onLayer + 2 }, onInit, onDestroy, onUpdate);
        }
        function createBomblet(options) {
            var onUpdate = function (obj) { targetCheck(obj); };
            var onDestroy = function (obj) { impactExplosion(obj.x, obj.y, 0.5, obj.damageAmount); };
            var bomblet = weaponManager.createBomblet(options, onDestroy, onUpdate);
        }
        function createExplosion(x, y, scale, layer) {
            weaponManager.createExplosion(x, y, scale, layer);
        }
        function impactExplosion(x, y, scale, damage) {
            var onUpdate = function (obj) { targetCheck(obj); };
            var onDestroy = function (obj) { };
            var impactExplosion = weaponManager.createImpactExplosion(x, y, scale, 6, damage, onDestroy, onUpdate);
        }
        function returnAllCollidables() {
            return phaserSprites.getGroup('enemy_hitboxes').slice();
        }
        function pauseGame() {
            phaserMaster.get('clock').stop();
            phaserMaster.forceLet('pauseStatus', true);
        }
        function unpauseGame() {
            phaserMaster.get('clock').start();
            phaserMaster.forceLet('pauseStatus', false);
        }
        function update() {
            var game = phaserMaster.game();
            var currentState = phaserMaster.getState().currentState;
            var _a = phaserMaster.getOnly(['starMomentum', 'primaryWeapon', 'secondaryWeapon', 'menuButtonSelection', 'elapsedTime']), starMomentum = _a.starMomentum, primaryWeapon = _a.primaryWeapon, secondaryWeapon = _a.secondaryWeapon, menuButtonSelection = _a.menuButtonSelection, elapsedTime = _a.elapsedTime;
            var _b = phaserSprites.getOnly(['specialWeapon', 'player']), specialWeapon = _b.specialWeapon, player = _b.player;
            var _c = phaserControls.getOnly(['DOWN', 'UP', 'LEFT', 'RIGHT', 'A', 'START']), DOWN = _c.DOWN, UP = _c.UP, LEFT = _c.LEFT, RIGHT = _c.RIGHT, A = _c.A, START = _c.START;
            if (elapsedTime !== undefined) {
                elapsedTime = parseInt(elapsedTime.toFixed(0));
            }
            phaserSprites.getManyGroups(['spaceGroup', 'movingStarField', 'ship_weapons', 'ship_secondary_weapons', 'impactExplosions', 'playership', 'enemy_bullets']).map(function (obj) {
                obj.onUpdate();
            });
            if (currentState === 'READY') {
                if (phaserSprites.getGroup('enemies').length < 1 && phaserSprites.getGroup('boss').length === 0) {
                    createSmallEnemy({
                        x: game.rnd.integerInRange(0 + 100, game.canvas.width - 100),
                        y: game.rnd.integerInRange(100, 400),
                        iy: game.rnd.integerInRange(0, 80),
                        layer: 3
                    });
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
                    switch (primaryWeapon.reference) {
                        case 'LASER':
                            fireLasers();
                            break;
                        case 'MISSLE':
                            fireMissles();
                            break;
                        case 'BULLET':
                            fireBullet();
                    }
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'B', delay: secondaryWeapon.cooldown })) {
                    if (specialWeapon !== undefined) {
                        updateShipSpecial(0, true);
                        game.time.events.add(50, function () {
                            updateShipSpecial(100, false, secondaryWeapon.cooldown - 50);
                        }).autoDestroy = true;
                    }
                    switch (secondaryWeapon.reference) {
                        case 'CLUSTERBOMB':
                            createClusterbomb();
                            break;
                        case 'TRIPLEBOMB':
                            createTriplebomb();
                            break;
                        case 'TURRET':
                            createTurret();
                            break;
                        case 'BLASTRADIUS':
                            break;
                    }
                }
            }
            if (currentState === 'VICTORYSTATE') {
                if (UP.active) {
                    phaserSprites.get('menuButtonCursor').updateLocation(1);
                }
                if (DOWN.active) {
                    phaserSprites.get('menuButtonCursor').updateLocation(2);
                }
                if (START.active) {
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
                if (UP.active) {
                    phaserSprites.get('menuButtonCursor').updateLocation(1);
                }
                if (DOWN.active) {
                    phaserSprites.get('menuButtonCursor').updateLocation(2);
                }
                if (START.active) {
                    clearInterval(phaserMaster.get('endExplosion'));
                    phaserMaster.changeState('LOCKED');
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
                player.onUpdate();
            }
        }
        function endLevel() {
            var game = phaserMaster.game();
            var gameData = phaserMaster.get('gameData');
            phaserMaster.changeState('ENDLEVEL');
            phaserTexts.getGroup('ui_text').map(function (text) {
                text.hide();
            });
            phaserSprites.getGroup('ui').map(function (obj) {
                obj.hide();
            });
            phaserSprites.getGroup('ship_secondary_weapons').map(function (obj) {
                obj.destroyIt();
            });
            phaserSprites.get('player').playEndSequence(function () {
                var level = gameData.level++;
                level++;
                saveData('level', level);
                for (var i = 0; i < 20; i++) {
                    setTimeout(function () {
                        createExplosion(game.rnd.integerInRange(0, game.world.width), game.rnd.integerInRange(0, game.world.height), game.rnd.integerInRange(1, 4), 6);
                    }, game.rnd.integerInRange(0, 50) * i);
                }
                setTimeout(function () {
                    phaserSprites.getGroup('enemies').map(function (enemy) {
                        setTimeout(function () {
                            enemy.destroyIt(false);
                        }, game.rnd.integerInRange(0, 500));
                    });
                    phaserSprites.getGroup('trashes').map(function (trash) {
                        setTimeout(function () {
                            trash.destroyIt(false);
                        }, game.rnd.integerInRange(0, 500));
                    });
                    phaserSprites.getGroup('movingStarField').map(function (star) {
                        star.fadeOut();
                    });
                    setTimeout(function () {
                        playSequence('NICE JOB HERO', function () {
                            phaserSprites.get('earth').fadeOut();
                            var blueBackground = phaserSprites.addTilespriteFromAtlas({ name: 'blue_bg', group: 'spaceGroup', x: 0, y: 0, width: game.canvas.width, height: game.canvas.height, atlas: 'atlas_large', filename: 'motionBlur.jpg', alpha: 0 });
                            blueBackground.count = 0;
                            blueBackground.scale.setTo(2, 2);
                            blueBackground.anchor.setTo(0.5, 0.5);
                            blueBackground.onUpdate = function () {
                                this.tilePosition.y -= 25;
                            };
                            phaserGroup.add(11, blueBackground);
                            game.add.tween(blueBackground).to({ alpha: 1 }, Phaser.Timer.SECOND, Phaser.Easing.Linear.In, true, 0, 0, false).
                                onComplete.add(function () {
                                var background = phaserSprites.addTilespriteFromAtlas({ name: 'victory_bg', group: 'spaceGroup', x: 0, y: 0, width: game.canvas.width, height: game.canvas.height, atlas: 'atlas_large', filename: 'victory_bg.png', alpha: 1 });
                                background.onUpdate = function () {
                                    this.tilePosition.x -= 3;
                                };
                                phaserGroup.add(10, background);
                                game.add.tween(blueBackground).to({ alpha: 0 }, Phaser.Timer.SECOND / 2, Phaser.Easing.Linear.In, true, 0, 0, false).
                                    onComplete.add(function () {
                                    victoryScreenSequence(function () {
                                    });
                                });
                            });
                        });
                    }, Phaser.Timer.SECOND * 1.5);
                }, Phaser.Timer.SECOND / 3);
            });
        }
        function victoryScreenSequence(callback) {
            var game = phaserMaster.game();
            var gameData = phaserMaster.get('gameData');
            var victoryScreenContainer = phaserSprites.addFromAtlas({ y: game.world.centerY - 100, name: "victoryScreenContainer", group: 'ui_clear', filename: 'ui_clear.png', atlas: 'atlas_main', visible: false });
            victoryScreenContainer.anchor.setTo(0.5, 0.5);
            victoryScreenContainer.reveal = function () {
                var _this = this;
                this.x = -this.width - 100;
                this.visible = true;
                this.game.add.tween(this).to({ x: this.game.world.centerX }, Phaser.Timer.SECOND * 1, Phaser.Easing.Bounce.Out, true, 0, 0, false).
                    onComplete.add(function () {
                    var scoreContainer = phaserSprites.addFromAtlas({ x: _this.game.world.centerX, y: _this.game.world.centerY, name: "scoreContainer2", group: 'ui', filename: 'ui_roundContainer.png', atlas: 'atlas_main', visible: true });
                    scoreContainer.anchor.setTo(0.5, 0.5);
                    var scoreText = phaserTexts.add({ name: 'scoreText2', group: 'ui_text', x: scoreContainer.x, y: scoreContainer.y, font: 'gem', size: 14, default: "" + gameData.score });
                    scoreText.anchor.setTo(0.5, 0.5);
                    scoreText.updateScore = function () {
                        this.setText("" + phaserMaster.get('gameData').score);
                    };
                    phaserGroup.addMany(12, [scoreContainer]);
                    phaserGroup.addMany(13, [scoreText]);
                    var population = phaserMaster.get('gameData').population;
                    var leftText = phaserTexts.add({ name: 'popLeft', group: 'ui', font: 'gem', x: _this.x, y: _this.y - 10, size: 24, default: "PEOPLE SAVED:", alpha: 0 });
                    leftText.anchor.setTo(0.5, 0.5);
                    leftText.scale.setTo(2, 2);
                    leftText.game.add.tween(leftText.scale).to({ x: 1, y: 1 }, 100, Phaser.Easing.Linear.Out, true, 0);
                    leftText.game.add.tween(leftText).to({ alpha: 1 }, 100, Phaser.Easing.Linear.Out, true, 0)
                        .onComplete.add(function () {
                        setTimeout(function () {
                            var population = phaserMaster.get('gameData').population;
                            var peopleCount = phaserTexts.add({ name: 'popCount', font: 'gem', x: _this.x, y: _this.y + 30, size: 45, default: "", alpha: 0 });
                            peopleCount.anchor.setTo(0.5, 0.5);
                            peopleCount.scale.setTo(1.5, 1.5);
                            peopleCount.setText("" + (population.total - population.killed) * 700000);
                            peopleCount.game.add.tween(peopleCount.scale).to({ x: 1, y: 1 }, 100, Phaser.Easing.Linear.Out, true, 0);
                            peopleCount.game.add.tween(peopleCount).to({ alpha: 1 }, 100, Phaser.Easing.Linear.Out, true, 0);
                            phaserGroup.addMany(13, [peopleCount]);
                            var totalCount = (population.total - population.killed) * 700000;
                            var countBy = 543211;
                            var medalsEarned = 0;
                            var totalSaved = 0;
                            var countInterval = setInterval(function () {
                                if (!phaserMaster.get('pauseStatus')) {
                                    if (countBy > totalCount) {
                                        countBy = Math.round(countBy / 2);
                                    }
                                    if (totalCount - countBy <= 0) {
                                        peopleCount.setText(0);
                                        clearInterval(countInterval);
                                        setTimeout(function () {
                                            leftText.setText('MEDALS EARNED');
                                            phaserTexts.destroy('popCount');
                                            var _loop_3 = function (i) {
                                                var medal = phaserSprites.addFromAtlas({ name: "medal_" + i, group: 'medals', x: victoryScreenContainer.x + (i * 20) - 80, y: victoryScreenContainer.y + 20, width: game.canvas.width, height: game.canvas.height, atlas: 'atlas_main', filename: 'medal_gold.png', alpha: 0 });
                                                medal.reveal = function () {
                                                    this.scale.setTo(2, 2);
                                                    this.game.add.tween(this.scale).to({ x: 1, y: 1 }, 100, Phaser.Easing.Linear.Out, true, 0);
                                                    this.game.add.tween(this).to({ alpha: 1 }, 100, Phaser.Easing.Linear.Out, true, 0);
                                                };
                                                phaserGroup.addMany(13, [medal]);
                                                setTimeout(function () {
                                                    medal.reveal();
                                                }, i * 50);
                                            };
                                            for (var i = 0; i < medalsEarned; i++) {
                                                _loop_3(i);
                                            }
                                            setTimeout(function () {
                                                var _a = phaserTexts.getOnly(['menuButton1Text', 'menuButton2Text']), menuButton1Text = _a.menuButton1Text, menuButton2Text = _a.menuButton2Text;
                                                phaserMaster.changeState('VICTORYSTATE');
                                                phaserSprites.getGroup('ui_buttons').map(function (obj) {
                                                    obj.reveal();
                                                });
                                                menuButton1Text.setText('CONTINUE');
                                                menuButton2Text.setText('SAVE AND QUIT');
                                            }, medalsEarned * 50 + 100);
                                        }, Phaser.Timer.SECOND);
                                    }
                                    else {
                                        totalSaved += countBy;
                                        if (totalSaved > 10000000) {
                                            saveData('score', Math.round(gameData.score + 2000));
                                            scoreText.updateScore();
                                            medalsEarned++;
                                            totalSaved = 0;
                                        }
                                        totalCount -= countBy;
                                        peopleCount.setText(totalCount);
                                    }
                                }
                            }, 1);
                        }, Phaser.Timer.SECOND / 2);
                    });
                });
            };
            victoryScreenContainer.hide = function () {
                this.game.add.tween(this).to({ y: -this.height }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 500, 0, false);
            };
            victoryScreenContainer.reveal();
            phaserGroup.addMany(13, [victoryScreenContainer]);
        }
        function gameOver() {
            phaserMaster.changeState('GAMEOVER');
            var player = phaserSprites.get('player');
            var earth = phaserSprites.get('earth');
            phaserTexts.getGroup('ui_text').map(function (text) {
                text.hide();
            });
            phaserSprites.getGroup('ui').map(function (obj) {
                obj.hide();
            });
            phaserSprites.getGroup('ship_secondary_weapons').map(function (obj) {
                obj.destroyIt();
            });
            player.selfDestruct();
            earth.selfDestruct();
            playSequence('DUDE IT WAS THE FIRST LEVEL JEEZE', function () {
                setTimeout(function () {
                    phaserMaster.changeState('GAMEOVERSTATE');
                    phaserSprites.getGroup('ui_buttons').map(function (obj) {
                        obj.reveal();
                    });
                    phaserTexts.get('menuButton1Text').setText('RETRY');
                    phaserTexts.get('menuButton2Text').setText('SAVE AND QUIT');
                }, 1500);
            });
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
                    setTimeout(function () {
                        callback();
                    }, 500);
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
        var _loop_4 = function (btn) {
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
            _loop_4(btn);
        }
        var _loop_5 = function (btn) {
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
            _loop_5(btn);
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
        var _loop_6 = function (key) {
            names.map(function (name) {
                if (key === name) {
                    _return[key] = { id: _this.buttonMapId[key.toUpperCase()], active: _this.IO.state[key.toUpperCase()]().val > 0 ? true : false, duration: _this.IO.state[key.toUpperCase()]().val, state: _this.IO.state[key.toUpperCase()]().state, type: _this.IO.state[key.toUpperCase()]().type, disabled: _this.disabledButtons[key.toUpperCase()] };
                }
            });
        };
        for (var _i = 0, _a = this.buttonArray; _i < _a.length; _i++) {
            var key = _a[_i];
            _loop_6(key);
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
        this._game = params.game;
        this.resolution = params.resolution;
        this.states = {
            BOOT: 'BOOT',
            PRELOAD: 'PRELOAD',
            READY: 'READY',
        };
        this.currentState = this.states[0];
        this.variables = {};
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
        var _loop_7 = function (i) {
            var _r = toArray.filter(function (obj) {
                return obj.key === names[i];
            });
            _r.map(function (obj) {
                _return[obj.key] = obj.data;
            });
        };
        for (var i = 0; i < names.length; i++) {
            _loop_7(i);
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
        var _loop_8 = function (key) {
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
            _loop_8(key);
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
            params.visible = params.visible !== undefined ? params.visible : true;
            params.alpha = params.alpha !== undefined ? params.alpha : 1;
            params.width = params.width !== undefined ? params.width : null;
            params.height = params.height !== undefined ? params.height : null;
            var newSprite = this.game.add.sprite(params.x, params.y, params.reference);
            newSprite.name = params.name;
            newSprite.group = params.group;
            newSprite.defaultPosition = { x: params.x, y: params.y };
            newSprite.visible = params.visible;
            newSprite.alpha = params.alpha;
            if (params.width !== null) {
                newSprite.width = params.width;
            }
            if (params.height !== null) {
                newSprite.height = params.height;
            }
            newSprite.setDefaultPositions = function (x, y) { this.defaultPosition.x = x, this.defaultPosition.y = y; };
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
            params.visible = params.visible !== undefined ? params.visible : true;
            params.alpha = params.alpha !== undefined ? params.alpha : 1;
            params.width = params.width !== undefined ? params.width : null;
            params.height = params.height !== undefined ? params.height : null;
            var newSprite = this.game.add.sprite(params.x, params.y, params.atlas, params.filename);
            newSprite.name = params.name;
            newSprite.group = params.group;
            newSprite.defaultPosition = { x: params.x, y: params.y };
            newSprite.visible = params.visible;
            newSprite.alpha = params.alpha;
            if (params.width !== null) {
                newSprite.width = params.width;
            }
            if (params.height !== null) {
                newSprite.height = params.height;
            }
            newSprite.setDefaultPositions = function (x, y) { this.defaultPosition.x = x, this.defaultPosition.y = y; };
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
            params.visible = params.visible !== undefined ? params.visible : true;
            params.alpha = params.alpha !== undefined ? params.alpha : 1;
            params.width = params.width !== undefined ? params.width : null;
            params.height = params.height !== undefined ? params.height : null;
            var newSprite = this.game.add.tileSprite(params.x, params.y, params.width, params.height, params.atlas, params.filename);
            newSprite.name = params.name;
            newSprite.group = params.group;
            newSprite.defaultPosition = { x: params.x, y: params.y };
            newSprite.visible = params.visible;
            newSprite.alpha = params.alpha;
            if (params.width !== null) {
                newSprite.width = params.width;
            }
            if (params.height !== null) {
                newSprite.height = params.height;
            }
            newSprite.setDefaultPositions = function (x, y) { this.defaultPosition.x = x, this.defaultPosition.y = y; };
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
            params.visible = params.visible !== undefined ? params.visible : true;
            params.alpha = params.alpha !== undefined ? params.alpha : 1;
            params.width = params.width !== undefined ? params.width : null;
            params.height = params.height !== undefined ? params.height : null;
            var newSprite = this.game.add.sprite(params.x, params.y);
            newSprite.name = params.name;
            newSprite.group = params.group;
            newSprite.defaultPosition = { x: params.x, y: params.y };
            newSprite.visible = params.visible;
            newSprite.alpha = params.alpha;
            if (params.width !== null) {
                newSprite.width = params.width;
            }
            if (params.height !== null) {
                newSprite.height = params.height;
            }
            newSprite.setDefaultPositions = function (x, y) { this.defaultPosition.x = x, this.defaultPosition.y = y; };
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
            return obj.group === name;
        });
    };
    PHASER_SPRITE_MANAGER.prototype.getManyGroups = function (names) {
        var _return = [];
        var _loop_9 = function (i) {
            var _r = this_4.sprites.array.filter(function (obj) {
                return obj.group === names[i];
            });
            _return = _return.concat(_r);
        };
        var this_4 = this;
        for (var i = 0; i < names.length; i++) {
            _loop_9(i);
        }
        return _return;
    };
    PHASER_SPRITE_MANAGER.prototype.getOnly = function (names) {
        var _return = {};
        var _loop_10 = function (i) {
            var _r = this_5.sprites.array.filter(function (obj) {
                return obj.group === names[i] || obj.name === names[i];
            });
            _r.map(function (obj) {
                _return[obj.name] = obj;
            });
        };
        var this_5 = this;
        for (var i = 0; i < names.length; i++) {
            _loop_10(i);
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
        var _loop_11 = function (i) {
            var _r = this_6.texts.array.filter(function (obj) {
                return obj.group === names[i];
            });
            _return = _return.concat(_r);
        };
        var this_6 = this;
        for (var i = 0; i < names.length; i++) {
            _loop_11(i);
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
        var _loop_12 = function (i) {
            var _r = this_7.texts.array.filter(function (obj) {
                return obj.group === names[i] || obj.name === names[i];
            });
            _r.map(function (obj) {
                _return[obj.name] = obj;
            });
        };
        var this_7 = this;
        for (var i = 0; i < names.length; i++) {
            _loop_12(i);
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
        this.phaserSprites.getManyGroups(['playership']).map(function (target) {
            target.game.physics.arcade.overlap(obj, target, function (obj, target) {
                target.takeDamage(damage);
                obj.destroyIt();
            }, null, obj);
        });
    };
    ENEMY_MANAGER.prototype.fireBullet = function (enemy, tracking) {
        var _this = this;
        if (tracking === void 0) { tracking = false; }
        var spriteAnimation = Phaser.Animation.generateFrameNames('e_bullet', 1, 1, '.png').slice();
        var onDestroy = function () { };
        var onUpdate = function (bullet) {
            _this.collisionCheck(bullet, 2);
        };
        var bullet = this.weaponManager.createBullet({ name: "enemy_bullet_" + this.game.rnd.integer(), group: 'enemy_bullets', x: enemy.x, y: enemy.y, spread: 0, layer: enemy.onLayer + 1 }, onDestroy, onUpdate);
        bullet.body.velocity.y = 300;
    };
    ENEMY_MANAGER.prototype.createSmallEnemy1 = function (options, onDamage, onDestroy, onFail, onUpdate) {
        var _this = this;
        if (onDamage === void 0) { onDamage = function () { }; }
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onFail === void 0) { onFail = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var enemy = phaserSprites.addFromAtlas({ x: options.x, name: "enemy_" + game.rnd.integer(), group: 'enemies', atlas: atlas, filename: "small_1.png", visible: true });
        enemy.anchor.setTo(0.5, 0.5);
        enemy.scale.setTo(1, 1);
        game.physics.enable(enemy, Phaser.Physics.ARCADE);
        enemy.atTarget = false;
        enemy.maxHealth = 100;
        enemy.health = enemy.maxHealth;
        enemy.pierceResistence = 1;
        enemy.fallThreshold = game.rnd.integerInRange(0, 75);
        enemy.cosWave = { data: game.math.sinCosGenerator(400, game.world.height * .80, 0, 1).cos, count: 0 };
        enemy.sinWave = { data: game.math.sinCosGenerator(400, 200, 1, 10).sin, count: 0 };
        enemy.fireDelay = 0;
        enemy.fireTimer = 500;
        enemy.inPlace = false;
        enemy.isDestroyed = false;
        enemy.onLayer = options.layer;
        phaserGroup.add(options.layer, enemy);
        console.log(enemy.sinWave);
        var hitboxes = ["small_1_hitbox_1.png"];
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
                enemy.explodeInterval = setInterval(function () {
                    _this.weaponManager.createExplosion(enemy.x + game.rnd.integerInRange(-enemy.width / 2, enemy.width / 2), enemy.y + game.rnd.integerInRange(-enemy.height / 2, enemy.height / 2), 1, enemy.onLayer + 1);
                }, 100);
                enemy.game.add.tween(enemy).to({ y: enemy.y - 15, alpha: 0.5 }, 750, Phaser.Easing.Linear.Out, true, 100, 0, false).
                    onComplete.add(function () {
                    clearInterval(enemy.explodeInterval);
                    onDestroy(enemy);
                    _this.weaponManager.createExplosion(enemy.x, enemy.y, 1, options.layer + 1);
                    phaserSprites.destroy(enemy.name);
                });
            }
        };
        enemy.onUpdate = function () {
            onUpdate(enemy);
            if (game.time.now > enemy.fireDelay && enemy.inPlace) {
                enemy.fireDelay = game.time.now + enemy.fireTimer;
                _this.fireBullet(enemy, true);
            }
            if (!enemy.isDestroyed) {
                enemy.y = -(enemy.cosWave.data[enemy.cosWave.count]) - enemy.height;
                enemy.x = enemy.sinWave.data[enemy.sinWave.count] + 100;
                enemy.cosWave.count++;
                enemy.sinWave.count++;
                if (enemy.cosWave.count >= enemy.cosWave.data.length) {
                    enemy.removeIt();
                }
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
    ENEMY_MANAGER.prototype.createBigEnemy1 = function (options, onDamage, onDestroy, onFail, onUpdate) {
        var _this = this;
        if (onDamage === void 0) { onDamage = function () { }; }
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onFail === void 0) { onFail = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var enemy = phaserSprites.addFromAtlas({ x: options.x, name: "enemy_" + game.rnd.integer(), group: 'enemies', atlas: atlas, filename: "big_1.png", visible: true });
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
        var hitboxes = ["big_1_hitbox_1.png", "big_1_hitbox_2.png"];
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
                enemy.explodeInterval = setInterval(function () {
                    _this.weaponManager.createExplosion(enemy.x + game.rnd.integerInRange(-enemy.width / 2, enemy.width / 2), enemy.y + game.rnd.integerInRange(-enemy.height / 2, enemy.height / 2), 1, enemy.onLayer + 1);
                }, 100);
                enemy.game.add.tween(enemy).to({ y: enemy.y - 15, alpha: 0.5 }, 750, Phaser.Easing.Linear.Out, true, 100, 0, false).
                    onComplete.add(function () {
                    clearInterval(enemy.explodeInterval);
                    onDestroy(enemy);
                    _this.weaponManager.createExplosion(enemy.x, enemy.y, 1, options.layer + 1);
                    phaserSprites.destroy(enemy.name);
                });
            }
        };
        enemy.onUpdate = function () {
            onUpdate(enemy);
            if (game.time.now > enemy.fireDelay && enemy.inPlace) {
                enemy.fireDelay = game.time.now + enemy.fireTimer;
                _this.fireBullet(enemy, true);
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
        var enemy = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: "enemy_" + game.rnd.integer(), group: 'enemies', atlas: atlas, filename: "asteroid_mid_layer_" + game.rnd.integerInRange(1, 3) + ".png", visible: true });
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
        var hitboxes = ["1_hitbox_1.png", "1_hitbox_2.png"];
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
            setTimeout(function () {
                _this.game.add.tween(enemy.scale).to({ x: 0, y: 0 }, Phaser.Timer.SECOND * 1, Phaser.Easing.Linear.In, true, game.rnd.integerInRange(0, 500)).
                    onComplete.add(function () {
                    onFail(enemy);
                    enemy.removeIt();
                    _this.weaponManager.createExplosion(enemy.x, enemy.y, 0.25, 6);
                }).autoDestroy = true;
            }, 300);
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
        var enemy = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: "enemy_" + game.rnd.integer(), group: 'enemies', atlas: atlas, filename: "asteroid_mid_layer_" + game.rnd.integerInRange(1, 3) + ".png", visible: true });
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
            setTimeout(function () {
                _this.game.add.tween(enemy.scale).to({ x: 0, y: 0 }, Phaser.Timer.SECOND * 1, Phaser.Easing.Linear.In, true, game.rnd.integerInRange(0, 500)).
                    onComplete.add(function () {
                    onFail(enemy);
                    enemy.removeIt();
                    _this.weaponManager.createExplosion(enemy.x, enemy.y, 0.25, 6);
                }).autoDestroy = true;
            }, 300);
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
        var enemy = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: "enemy_" + game.rnd.integer(), group: 'boss', atlas: atlas, filename: "asteroid_large_layer_" + game.rnd.integerInRange(1, 3) + ".png", visible: true });
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
                _this.weaponManager.createImpactExplosion(enemy.x, enemy.y, 2.5, options.layer + 1);
                phaserSprites.destroy(enemy.name);
            }, enemy).autoDestroy = true;
        };
        enemy.fallToPlanet = function () {
            enemy.tint = 1 * 0x000000;
            enemy.atTarget = true;
            enemy.body = null;
            enemy.game.add.tween(enemy).to({ y: enemy.y + 60 }, Phaser.Timer.SECOND * 2, Phaser.Easing.Linear.In, true, 0).autoDestroy = true;
            setTimeout(function () {
                _this.game.add.tween(enemy.scale).to({ x: 0, y: 0 }, Phaser.Timer.SECOND * 1, Phaser.Easing.Linear.In, true, game.rnd.integerInRange(0, 500)).
                    onComplete.add(function () {
                    onFail(enemy);
                    enemy.removeIt();
                    _this.weaponManager.createExplosion(enemy.x, enemy.y, 0.25, 6);
                }).autoDestroy = true;
            }, 300);
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
    PLAYER_MANAGER.prototype.createShip = function (params, updateHealth, loseLife, onUpdate) {
        var _this = this;
        if (updateHealth === void 0) { updateHealth = function () { }; }
        if (loseLife === void 0) { loseLife = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var shipId = params.shipId + 1;
        var shieldFrames = Phaser.Animation.generateFrameNames("ship_" + shipId + "_shield_", 1, 6, '.png').concat(Phaser.Animation.generateFrameNames("ship_" + shipId + "_shield_", 1, 6, '.png').reverse());
        var healFrames = Phaser.Animation.generateFrameNames("ship_" + shipId + "_heal_", 1, 6, '.png').concat(Phaser.Animation.generateFrameNames("ship_" + shipId + "_heal_", 1, 6, '.png').reverse());
        var player = this.phaserSprites.addFromAtlas({ name: params.name, group: params.group, atlas: this.atlas, filename: "ship_" + shipId + ".png", visible: false });
        player.anchor.setTo(0.5, 0.5);
        player.scale.setTo(1, 1);
        player.isInvincible = false;
        player.isDead = false;
        player.onLayer = params.layer;
        player.exhaustPoints = {
            center: 40,
            top: 25,
            bottom: 50
        };
        game.physics.enable(player, Phaser.Physics.ARCADE);
        this.phaserGroup.add(params.layer, player);
        this.createShipExhaust(player, params);
        player.onUpdate = function () {
            onUpdate(player);
            if (player.visible && !player.isDead) {
                player.createTrail();
            }
        };
        player.takeDamage = function (val) {
            var gameData = _this.phaserMaster.getOnly(['gameData']).gameData;
            var health = gameData.player.health - val;
            updateHealth(health);
            if (health > 0) {
                player.tint = 1 * 0xff0000;
                player.alpha = 0.75;
                player.game.add.tween(player).to({ tint: 1 * 0xffffff, alpha: 1 }, 100, Phaser.Easing.Linear.Out, true, 100, 0, false).
                    onComplete.add(function () {
                    setTimeout(function () {
                        player.isInvincible = false;
                    }, 500);
                });
            }
            else {
                loseLife(player);
            }
        };
        player.isDestroyed = function () {
            player.isDead = true;
            _this.weaponManager.createExplosion(player.x, player.y, 1, 6);
            game.add.tween(_this).to({ angle: game.rnd.integerInRange(-90, 90), alpha: 0 }, 1000, Phaser.Easing.Linear.In, true, 0).
                onComplete.add(function () {
                _this.weaponManager.createExplosion(player.x, player.y, 1, 6);
                player.visible = false;
                setTimeout(function () {
                    updateHealth(100);
                    player.moveToStart();
                }, 1000);
            });
        };
        player.createTrail = function () {
            var currentState = _this.phaserMaster.getState().currentState;
            var trailCount = _this.phaserSprites.getGroup(params.name + "_trails").length;
            if (trailCount < (currentState === 'ENDLEVEL') ? 20 : 10) {
                var trail_1 = _this.phaserSprites.addFromAtlas({ name: params.name + "_trail_" + game.rnd.integer(), group: params.name + "_trails", x: player.x, y: player.y, filename: 'ship_body.png', atlas: 'atlas_main', visible: true });
                trail_1.anchor.setTo(0.5, 0.5);
                trail_1.scale.setTo(player.scale.x - 0.2, player.scale.y - 0.2);
                trail_1.alpha = 0.4;
                trail_1.angle = player.angle;
                trail_1.tint = 1 * 0x0000ff;
                _this.phaserGroup.add(params.layer - 1, trail_1);
                trail_1.destroySelf = function () {
                    trail_1.game.add.tween(trail_1).to({ alpha: 0 }, (currentState === 'ENDLEVEL') ? 600 : 250, Phaser.Easing.Linear.In, true, 0).
                        onComplete.add(function () {
                        _this.phaserSprites.destroy(trail_1.name);
                    }, trail_1);
                };
                trail_1.destroySelf();
            }
        };
        player.selfDestruct = function () {
            player.isInvincible = true;
            _this.phaserSprites.get('exhaust').destroyIt();
            game.add.tween(player).to({ angle: 720 }, 3400, Phaser.Easing.Linear.In, true, 0).
                onComplete.add(function () {
                _this.phaserSprites.destroy(player.name);
                _this.weaponManager.createExplosion(player.x, player.y, 0.5, 6);
            }, _this);
        };
        player.moveToStart = function () {
            player.isDead = false;
            player.angle = 0;
            player.alpha = 1;
            player.visible = true;
            player.isInvincible = true;
            player.x = _this.game.world.centerX;
            player.y = _this.game.world.centerY + 550;
            game.add.tween(player).to({ y: game.world.centerY + 200 }, 1000, Phaser.Easing.Exponential.InOut, true, 0, 0, false).
                onComplete.add(function () {
                _this.phaserControls.enableAllInput();
                setTimeout(function () {
                    player.isInvincible = false;
                }, 1000);
            });
        };
        player.fireWeapon = function () {
            _this.phaserSprites.get(params.name + "_ship_weapon").fireWeapon();
        };
        player.fireSubweapon = function () {
            _this.phaserSprites.get(params.name + "_ship_subweapon").fireWeapon();
        };
        player.regenerateHealth = function (active) {
            if (active === void 0) { active = false; }
        };
        player.moveX = function (val) {
            player.x += val;
            player.checkLimits();
        };
        player.moveY = function (val) {
            player.y += val;
            player.checkLimits();
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
        player.attachPerk = function (type) {
            _this.attachPerk(player, params, type);
        };
        player.attachWeapon = function (weaponType) {
            _this.attachWeaponSprite(player, params, weaponType);
        };
        player.attachSubweapon = function (weaponType) {
            _this.attachSubWeaponSprite(player, params, weaponType);
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
                animationSprites = Phaser.Animation.generateFrameNames('firepower_', 1, 8, '.png').concat(Phaser.Animation.generateFrameNames('firepower_', 1, 8, '.png').reverse());
                framerate = 30;
                break;
            case 'ARMORPLATING':
                animationSprites = ['armor_plating.png'];
                framerate = 30;
                break;
            case 'REGEN':
                animationSprites = Phaser.Animation.generateFrameNames('shield_layer_', 1, 8, '.png').slice();
                framerate = 30;
                break;
        }
        if (this.phaserSprites.get(params.name + "_ship_perk") !== undefined) {
            this.phaserSprites.destroy(params.name + "_ship_perk");
        }
        var shipPerk;
        if (type === 'REGEN') {
            shipPerk = this.phaserSprites.addFromAtlas({ name: params.name + "_ship_perk", group: params.group, atlas: this.atlas, filename: animationSprites[0], alpha: 0.5 });
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
            setTimeout(function () {
                if (shipPerk !== undefined) {
                    shipPerk.tweenFadeOut();
                }
            }, 500);
            shipPerk.animations.add('animate', animationSprites, 1, true);
            shipPerk.animations.play('animate', framerate, true);
            player.addChild(shipPerk);
        }
        else {
            shipPerk = this.phaserSprites.addFromAtlas({ name: params.name + "_ship_perk", group: params.group, atlas: this.atlas, filename: animationSprites[0], visible: true });
            shipPerk.anchor.setTo(0.5, 0.5);
            shipPerk.animations.add('animate', animationSprites, 1, true);
            shipPerk.animations.play('animate', framerate, true);
            player.addChild(shipPerk);
        }
    };
    PLAYER_MANAGER.prototype.attachSubWeaponSprite = function (player, params, weaponType) {
        var animationSprites;
        var framerate;
        var onLayer;
        switch (weaponType) {
            case 'CLUSTERBOMB':
                animationSprites = Phaser.Animation.generateFrameNames('cannon_fire_', 1, 8, '.png').slice();
                framerate = 20;
                break;
            case 'TRIPLEBOMB':
                animationSprites = Phaser.Animation.generateFrameNames('cannon2_fire_', 1, 7, '.png').concat(['cannon2_fire_1.png']);
                framerate = 60;
                break;
            case 'TURRET':
                animationSprites = ['turret_base.png'];
                framerate = 30;
                break;
        }
        if (this.phaserSprites.get(params.name + "_ship_subweapon") !== undefined) {
            this.phaserSprites.destroy(params.name + "_ship_subweapon");
        }
        var shipSubweapon = this.phaserSprites.addFromAtlas({ name: params.name + "_ship_subweapon", group: params.group, atlas: this.weaponAtlas, filename: animationSprites[0], visible: true });
        shipSubweapon.anchor.setTo(0.5, 0.5);
        shipSubweapon.animations.add('fireWeapon', animationSprites, 1, true);
        shipSubweapon.fireWeapon = function () {
            shipSubweapon.animations.play('fireWeapon', framerate, false);
        };
        player.addChild(shipSubweapon);
    };
    PLAYER_MANAGER.prototype.attachWeaponSprite = function (player, params, weaponType) {
        var animationSprites;
        var framerate;
        switch (weaponType) {
            case 'BULLET':
                animationSprites = Phaser.Animation.generateFrameNames('bullet_fire_', 1, 4, '.png').slice();
                framerate = 60;
                break;
            case 'LASER':
                animationSprites = Phaser.Animation.generateFrameNames('laser_fire_', 1, 6, '.png').slice();
                framerate = 60;
                break;
            case 'MISSLE':
                animationSprites = Phaser.Animation.generateFrameNames('missle_fire_', 1, 6, '.png').slice();
                framerate = 30;
                break;
        }
        if (this.phaserSprites.get(params.name + "_ship_weapon") !== undefined) {
            this.phaserSprites.destroy(params.name + "_ship_weapon");
        }
        var shipWeapon = this.phaserSprites.addFromAtlas({ name: params.name + "_ship_weapon", group: params.group, atlas: this.weaponAtlas, filename: animationSprites[0], visible: true });
        shipWeapon.anchor.setTo(0.5, 0.5);
        shipWeapon.animations.add('fireWeapon', animationSprites, 1, true);
        shipWeapon.fireWeapon = function () {
            shipWeapon.animations.play('fireWeapon', framerate, false);
        };
        player.addChild(shipWeapon);
    };
    PLAYER_MANAGER.prototype.createShipExhaust = function (player, params) {
        var _this = this;
        var shipExhaust = this.phaserSprites.addFromAtlas({ name: params.name + "_exhaust", group: params.group, x: player.x, y: player.y + player.height / 2 + 10, atlas: this.atlas, filename: 'exhaust_red_1.png', visible: true });
        shipExhaust.animations.add('exhaust_animation', Phaser.Animation.generateFrameNames('exhaust_red_', 1, 8, '.png'), 1, true);
        shipExhaust.animations.play('exhaust_animation', 30, true);
        shipExhaust.anchor.setTo(0.5, 0.5);
        player.addChild(shipExhaust);
        shipExhaust.onUpdate = function () {
        };
        shipExhaust.updateCords = function (x, y) { };
        shipExhaust.destroyIt = function () {
            _this.phaserSprites.destroy(shipExhaust.name);
        };
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
            var _loop_13 = function (r) {
                var gridSquare = this_8.phaserSprites.addFromAtlas({ x: r * squareSizeH, y: c * squareSizeV, name: "grid" + count, group: 'um_grid__bg', width: squareSizeH, height: squareSizeV, atlas: this_8.atlas, filename: image, visible: true });
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
                this_8.phaserGroup.add(layer, gridSquare);
            };
            var this_8 = this;
            for (var r = 0; r < Math.ceil(game.world.width / squareSizeH) + 1; r++) {
                _loop_13(r);
            }
        }
    };
    UTILITY_MANAGER.prototype.overlayBGControls = function (options, callback) {
        var transition = options.transition, delay = options.delay, speed = options.speed;
        var um_overlay__bg = this.phaserSprites.getOnly(['um_overlay__bg']).um_overlay__bg;
        setTimeout(function () {
            switch (transition) {
                case 'FADEIN':
                    um_overlay__bg.fadeIn(speed, callback);
                    break;
                case 'FADEOUT':
                    um_overlay__bg.fadeOut(speed, callback);
                    break;
            }
        }, delay);
    };
    UTILITY_MANAGER.prototype.overlayControls = function (options, callback) {
        var transition = options.transition, delay = options.delay, speed = options.speed, tileDelay = options.tileDelay;
        var grid = this.phaserSprites.getGroup('um_grid__bg');
        var odd = [];
        var even = [];
        var rowDelay = (tileDelay * grid.length) * 0.75;
        var returnDelay = rowDelay + (tileDelay * grid.length);
        setTimeout(function () {
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
                        setTimeout(function () {
                            obj.scaleIn(speed);
                        }, tileDelay * index);
                    });
                    setTimeout(function () {
                        odd.slice(0).reverse().map(function (obj, index) {
                            setTimeout(function () {
                                obj.scaleIn(speed);
                            }, tileDelay * index);
                        });
                    }, rowDelay);
                    setTimeout(function () {
                        callback();
                    }, returnDelay);
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
                        setTimeout(function () {
                            obj.scaleOut(speed);
                        }, tileDelay * index);
                    });
                    setTimeout(function () {
                        odd.slice(0).reverse().map(function (obj, index) {
                            setTimeout(function () {
                                obj.scaleOut(speed);
                            }, tileDelay * index);
                        });
                    }, rowDelay);
                    setTimeout(function () {
                        callback();
                    }, returnDelay);
                    break;
                case 'FADEOUT':
                    grid.map(function (obj, index) {
                        setTimeout(function () {
                            obj.fadeOut(speed);
                        }, tileDelay * index);
                    });
                    setTimeout(function () {
                        callback();
                    }, grid.length * tileDelay + speed);
                    break;
                case 'FADEIN':
                    grid.map(function (obj, index) {
                        setTimeout(function () {
                            obj.fadeIn(speed);
                        }, tileDelay * index);
                    });
                    setTimeout(function () {
                        callback();
                    }, grid.length * tileDelay + speed);
                    break;
            }
        }, delay);
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
    WEAPON_MANAGER.prototype.createBullet = function (options, onDestroy, onUpdate) {
        var _this = this;
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var weaponData = phaserMaster.getAll().weaponData;
        var weapon = weaponData.primaryWeapons.BULLET;
        var ammo = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: options.name, group: options.group, atlas: atlas, filename: weapon.spriteAnimation[0] });
        if (weapon.spriteAnimation.length > 1) {
            ammo.animations.add('animate', weapon.spriteAnimation, 1, true);
            ammo.animations.play('animate', 30, true);
        }
        ammo.anchor.setTo(0.5, 0.5);
        game.physics.enable(ammo, Phaser.Physics.ARCADE);
        ammo.body.velocity.y = weapon.initialVelocity;
        ammo.pierceStrength = weapon.pierceStrength;
        ammo.damageAmount = weapon.damage;
        ammo.destroyIt = function () {
            _this.orangeImpact(ammo.x + _this.game.rnd.integerInRange(-5, 5), ammo.y + _this.game.rnd.integerInRange(-5, 15), 1, options.layer + 1);
            onDestroy(ammo);
            phaserSprites.destroy(ammo.name);
        };
        ammo.onUpdate = function () {
            if (this.y < -this.height || this.y > this.game.canvas.height) {
                this.destroyIt();
            }
            onUpdate(ammo);
        };
        if (options.layer !== undefined) {
            phaserGroup.add(options.layer, ammo);
        }
        return ammo;
    };
    WEAPON_MANAGER.prototype.createMissle = function (options, onDestroy, onUpdate) {
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var weaponData = phaserMaster.getAll().weaponData;
        var weapon = weaponData.primaryWeapons.MISSLE;
        var ammo = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: options.name, group: options.group, atlas: atlas, filename: weapon.spriteAnimation[0] });
        if (weapon.spriteAnimation.length > 1) {
            ammo.animations.add('animate', weapon.spriteAnimation, 1, true);
            ammo.animations.play('animate', 30, true);
        }
        ammo.anchor.setTo(0.5, 0.5);
        game.physics.enable(ammo, Phaser.Physics.ARCADE);
        ammo.body.velocity.y = weapon.initialVelocity;
        ammo.isActive = true;
        ammo.pierceStrength = weapon.pierceStrength;
        ammo.damageAmount = weapon.damage;
        ammo.accelerate = function () {
            if (ammo.body !== null) {
                ammo.body.velocity.y -= weapon.velocity;
                ammo.body.velocity.x += options.spread;
            }
        };
        ammo.removeIt = function () {
            ammo.isActive = false;
            phaserSprites.destroy(ammo.name);
        };
        ammo.destroyIt = function () {
            onDestroy(ammo);
            ammo.isActive = false;
            phaserSprites.destroy(ammo.name);
        };
        ammo.onUpdate = function () {
            ammo.accelerate();
            if (ammo.y < -ammo.height) {
                ammo.removeIt();
            }
            onUpdate(ammo);
        };
        if (options.layer !== undefined) {
            phaserGroup.add(options.layer, ammo);
        }
        return ammo;
    };
    WEAPON_MANAGER.prototype.createLaser = function (options, onDestroy, onUpdate) {
        var _this = this;
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var weaponData = phaserMaster.getAll().weaponData;
        var weapon = weaponData.primaryWeapons.LASER;
        var ammo = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: options.name, group: options.group, atlas: atlas, filename: weapon.spriteAnimation[0] });
        if (weapon.spriteAnimation.length > 1) {
            ammo.animations.add('animate', weapon.spriteAnimation, 1, true);
            ammo.animations.play('animate', 30, true);
        }
        ammo.anchor.setTo(0.5, 0.5);
        game.physics.enable(ammo, Phaser.Physics.ARCADE);
        ammo.body.velocity.y = weapon.initialVelocity;
        ammo.pierceStrength = weapon.pierceStrength;
        ammo.damageAmount = weapon.damage;
        ammo.accelerate = function () {
            if (ammo.body !== null) {
                ammo.body.velocity.y -= weapon.velocity;
                ammo.body.velocity.x += options.spread;
            }
        };
        ammo.destroyIt = function () {
            _this.electricDischarge(ammo.x + _this.game.rnd.integerInRange(-5, 5), ammo.y + _this.game.rnd.integerInRange(-5, 15), 1, options.layer + 1);
            onDestroy(ammo);
            phaserSprites.destroy(ammo.name);
        };
        ammo.onUpdate = function () {
            ammo.accelerate();
            if (ammo.y < -ammo.height) {
                ammo.destroyIt();
            }
            onUpdate(ammo);
        };
        if (options.layer !== undefined) {
            phaserGroup.add(options.layer, ammo);
        }
        return ammo;
    };
    WEAPON_MANAGER.prototype.createClusterbomb = function (options, onDestroy, onUpdate) {
        var _this = this;
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var weaponData = phaserMaster.getAll().weaponData;
        var weapon = weaponData.secondaryWeapons.CLUSTERBOMB;
        var ammo = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: options.name, group: options.group, atlas: atlas, filename: weapon.spriteAnimation[0] });
        if (weapon.spriteAnimation.length > 1) {
            ammo.animations.add('animate', weapon.spriteAnimation, 1, true);
            ammo.animations.play('animate', 30, true);
        }
        game.physics.enable(ammo, Phaser.Physics.ARCADE);
        ammo.anchor.setTo(0.5, 0.5);
        ammo.body.velocity.y = weapon.initialVelocity;
        ammo.angle = 90;
        ammo.hasDetonated = false;
        ammo.bomblets = weapon.bomblets;
        ammo.pierceStrength = weapon.pierceStrength;
        ammo.damageAmount = weapon.damage;
        setTimeout(function () {
            if (!ammo.hasDetonated) {
                ammo.hasDetonated = true;
                ammo.destroyIt();
            }
        }, 800);
        ammo.accelerate = function () {
            if (ammo.body !== null) {
                if (ammo.body.velocity.y > -400) {
                    ammo.body.velocity.y -= weapon.velocity;
                }
                ammo.body.velocity.x += options.spread;
            }
        };
        ammo.destroyIt = function () {
            onDestroy(ammo);
            _this.createExplosion(ammo.x, ammo.y, 1.25, options.layer);
            phaserSprites.destroy(ammo.name);
        };
        ammo.onUpdate = function () {
            onUpdate(ammo);
            ammo.angle += 5;
            ammo.accelerate();
            if (ammo.y < -ammo.height) {
                ammo.destroyIt();
            }
        };
        if (options.layer !== undefined) {
            phaserGroup.add(options.layer, ammo);
        }
        return ammo;
    };
    WEAPON_MANAGER.prototype.createTriplebomb = function (options, onDestroy, onUpdate) {
        var _this = this;
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var weaponData = phaserMaster.getAll().weaponData;
        var weapon = weaponData.secondaryWeapons.TRIPLEBOMB;
        var ammo = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: options.name, group: options.group, atlas: atlas, filename: weapon.spriteAnimation[0] });
        if (weapon.spriteAnimation.length > 1) {
            ammo.animations.add('animate', weapon.spriteAnimation, 1, true);
            ammo.animations.play('animate', 30, true);
        }
        game.physics.enable(ammo, Phaser.Physics.ARCADE);
        ammo.anchor.setTo(0.5, 0.5);
        ammo.body.velocity.y = weapon.initialVelocity;
        ammo.angle = 90;
        ammo.hasDetonated = false;
        ammo.damageAmount = weapon.damage;
        ammo.pierceStrength = weapon.pierceStrength;
        ammo.accelerate = function () {
            if (ammo.body !== null) {
                if (ammo.body.velocity.y > -500) {
                    ammo.body.velocity.y -= weapon.velocity;
                }
                ammo.body.velocity.x += options.spread;
            }
        };
        ammo.removeIt = function () {
            onDestroy(ammo);
            phaserSprites.destroy(ammo.name);
        };
        ammo.destroyIt = function () {
            onDestroy(ammo);
            _this.createExplosion(ammo.x, ammo.y, 1.25, options.layer);
            phaserSprites.destroy(ammo.name);
        };
        ammo.onUpdate = function () {
            onUpdate(ammo);
            ammo.angle += 15;
            ammo.accelerate();
            if (ammo.y < -ammo.height) {
                ammo.removeIt();
            }
        };
        if (options.layer !== undefined) {
            phaserGroup.add(options.layer, ammo);
        }
        return ammo;
    };
    WEAPON_MANAGER.prototype.createTurret = function (options, onInit, onDestroy, onUpdate) {
        var _this = this;
        if (onInit === void 0) { onInit = function () { }; }
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var weaponData = phaserMaster.getAll().weaponData;
        var weapon = weaponData.secondaryWeapons.TURRET;
        var turret = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: options.name, group: options.group, atlas: atlas, filename: weapon.spriteAnimation[0] });
        if (weapon.spriteAnimation.length > 1) {
            turret.animations.add('animate', weapon.spriteAnimation, 1, true);
            turret.animations.play('animate', 30, true);
        }
        turret.anchor.setTo(0.5, 0.5);
        game.physics.enable(turret, Phaser.Physics.ARCADE);
        phaserGroup.add(2, turret);
        turret.offset = options.offset;
        setTimeout(function () {
            if (turret !== undefined) {
                turret.destroyIt();
            }
        }, weapon.lifespan);
        onInit(turret);
        turret.destroyIt = function () {
            if (turret !== undefined) {
                onDestroy(turret);
                _this.createExplosion(turret.x, turret.y, 0.5, options.layer);
                clearInterval(turret.fireInterval);
                phaserSprites.destroy(turret.name);
            }
        };
        turret.onUpdate = function () {
            onUpdate(turret);
        };
        if (options.layer !== undefined) {
            phaserGroup.add(options.layer, turret);
        }
    };
    WEAPON_MANAGER.prototype.createBlastradius = function (options) {
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var weaponData = phaserMaster.getAll().weaponData;
        var weapon = weaponData.secondaryWeapons.BLASTRADIUS;
        var blast = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: options.name, group: options.group, atlas: atlas, filename: weapon.spriteAnimation[0] });
        blast.anchor.setTo(0.5, 0.5);
        blast.scale.setTo(1, 1);
        if (weapon.spriteAnimation.length > 1) {
            var anim = blast.animations.add('animate', weapon.spriteAnimation, 30, false);
            anim.onStart.add(function () {
            }, blast);
            anim.onComplete.add(function () {
                phaserSprites.destroy(blast.name);
            }, blast);
            anim.play('animate');
        }
        game.physics.enable(blast, Phaser.Physics.ARCADE);
        if (options.layer !== undefined) {
            phaserGroup.add(options.layer, blast);
        }
    };
    WEAPON_MANAGER.prototype.createBomblet = function (options, onDestroy, onUpdate) {
        var _this = this;
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var ammo = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: "bomblet_" + game.rnd.integer(), group: options.group, atlas: atlas, filename: 'clusterBomb.png' });
        ammo.anchor.setTo(0.5, 0.5);
        ammo.scale.setTo(0.5, 0.5);
        game.physics.enable(ammo, Phaser.Physics.ARCADE);
        ammo.body.velocity.y = options.iy;
        ammo.body.velocity.x = options.ix;
        ammo.detonate = game.time.now + game.rnd.integerInRange(1250, 1800);
        ammo.pierceStrength = 1;
        ammo.damageAmount = 100;
        ammo.destroyIt = function () {
            onDestroy(ammo);
            _this.createExplosion(ammo.x, ammo.y, 1, options.layer);
            phaserSprites.destroy(ammo.name);
        };
        ammo.onUpdate = function () {
            onUpdate(ammo);
            ammo.angle += 5;
            if (game.time.now > ammo.detonate) {
                ammo.destroyIt();
            }
        };
        if (options.layer !== undefined) {
            phaserGroup.add(options.layer, ammo, options.layer);
        }
        return ammo;
    };
    WEAPON_MANAGER.prototype.createExplosion = function (x, y, scale, layer, onDestroy, onUpdate) {
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var explosion = phaserSprites.addFromAtlas({ name: "explosion_" + game.rnd.integer(), group: 'explosions', x: x, y: y, atlas: atlas, filename: "explosion2_layer_1.png" });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        explosion.animations.add('explosion', Phaser.Animation.generateFrameNames('explosion2_layer_', 1, 12, '.png'), 1, true);
        explosion.animations.play('explosion', 30, true);
        game.time.events.add(Phaser.Timer.SECOND / 2, function () {
            phaserSprites.destroy(explosion.name);
        }).autoDestroy = true;
        explosion.onDestroy = function () {
        };
        explosion.onUpdate = function () {
            onUpdate(explosion);
        };
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        return explosion;
    };
    WEAPON_MANAGER.prototype.createImpactExplosion = function (x, y, scale, layer, damage, onDestroy, onUpdate) {
        if (onDestroy === void 0) { onDestroy = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var explosion = phaserSprites.addFromAtlas({ name: "impact_" + game.rnd.integer(), group: 'impactExplosions', x: x, y: y, atlas: atlas, filename: "explosions_Layer_1.png" });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        game.physics.enable(explosion, Phaser.Physics.ARCADE);
        explosion.animations.add('explosion', Phaser.Animation.generateFrameNames('explosions_Layer_', 1, 16, '.png'), 1, true);
        explosion.animations.play('explosion', 30, true);
        explosion.damageAmount = damage;
        game.time.events.add(Phaser.Timer.SECOND / 2, function () {
            phaserSprites.destroy(explosion.name);
        }).autoDestroy = true;
        explosion.onDestroy = function () {
        };
        explosion.onUpdate = function () {
            onUpdate(explosion);
        };
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        return explosion;
    };
    WEAPON_MANAGER.prototype.blueImpact = function (x, y, scale, layer) {
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var frames = Phaser.Animation.generateFrameNames('blue_explosion_small_layer_', 1, 7, '.png');
        var explosion = phaserSprites.addFromAtlas({ name: "impact_" + game.rnd.integer(), group: 'impactExplosions', x: x, y: y, atlas: atlas, filename: frames[0] });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        game.physics.enable(explosion, Phaser.Physics.ARCADE);
        var anim = explosion.animations.add('animate', frames, 60, false);
        anim.onStart.add(function () { }, explosion);
        anim.onComplete.add(function () {
            phaserSprites.destroy(explosion.name);
        }, explosion);
        anim.play('animate');
        explosion.onUpdate = function () {
            explosion.y--;
        };
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        return explosion;
    };
    WEAPON_MANAGER.prototype.orangeImpact = function (x, y, scale, layer) {
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var frames = Phaser.Animation.generateFrameNames('orange_ring_explosion_layer_', 1, 7, '.png');
        var explosion = phaserSprites.addFromAtlas({ name: "impact_" + game.rnd.integer(), group: 'impactExplosions', x: x, y: y, atlas: atlas, filename: frames[0] });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        game.physics.enable(explosion, Phaser.Physics.ARCADE);
        var anim = explosion.animations.add('animate', frames, 60, false);
        anim.onStart.add(function () { }, explosion);
        anim.onComplete.add(function () {
            phaserSprites.destroy(explosion.name);
        }, explosion);
        anim.play('animate');
        explosion.onUpdate = function () {
            explosion.y--;
        };
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        return explosion;
    };
    WEAPON_MANAGER.prototype.electricDischarge = function (x, y, scale, layer) {
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var frames = Phaser.Animation.generateFrameNames('disintegrate', 1, 10, '.png');
        var explosion = phaserSprites.addFromAtlas({ name: "impact_" + game.rnd.integer(), group: 'impactExplosions', x: x, y: y, atlas: atlas, filename: frames[0] });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        game.physics.enable(explosion, Phaser.Physics.ARCADE);
        var anim = explosion.animations.add('animate', frames, 60, false);
        anim.onStart.add(function () { }, explosion);
        anim.onComplete.add(function () {
            phaserSprites.destroy(explosion.name);
        }, explosion);
        anim.play('animate');
        explosion.onUpdate = function () {
            explosion.y--;
        };
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        return explosion;
    };
    return WEAPON_MANAGER;
}());
