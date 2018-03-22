var PhaserGameObject = (function () {
    function PhaserGameObject() {
        this.game = null;
        this.global = {
            pause: false
        };
    }
    PhaserGameObject.prototype.init = function (el, parent, options) {
        var phaserMaster = new PHASER_MASTER({ game: new Phaser.Game(options.width, options.height, Phaser.WEBGL, el, { preload: preload, create: create, update: update }), resolution: { width: options.width, height: options.height } }), phaserControls = new PHASER_CONTROLS(), phaserMouse = new PHASER_MOUSE({ showDebugger: false }), phaserSprites = new PHASER_SPRITE_MANAGER(), phaserBmd = new PHASER_BITMAPDATA_MANAGER(), phaserTexts = new PHASER_TEXT_MANAGER(), phaserButtons = new PHASER_BUTTON_MANAGER(), phaserGroup = new PHASER_GROUP_MANAGER(), phaserBitmapdata = new PHASER_BITMAPDATA_MANAGER(), weaponManager = new WEAPON_MANAGER();
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
            phaserMaster.let('roundTime', 30);
            phaserMaster.let('clock', game.time.create(false));
            phaserMaster.let('elapsedTime', 0);
            phaserMaster.let('devMode', false);
            phaserMaster.let('starMomentum', { x: 0, y: 0 });
            phaserMaster.let('pauseStatus', false);
            var weaponData = phaserMaster.let('weaponData', game.cache.getJSON('weaponData'));
            var pw = phaserMaster.let('primaryWeapon', weaponData.primaryWeapons[gameData.primaryWeapon]);
            var sw = phaserMaster.let('secondaryWeapon', weaponData.secondaryWeapons[gameData.secondaryWeapon]);
            game.onPause.add(function () {
                pauseGame();
            }, this);
            game.onResume.add(function () {
                unpauseGame();
            }, this);
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
                        var totalTime = phaserMaster.get('elapsedTime');
                        var elapsedTime = phaserMaster.get('elapsedTime');
                        elapsedTime += (phaserMaster.get('clock').elapsed * .001);
                        phaserMaster.forceLet('elapsedTime', elapsedTime);
                        var roundTime = phaserMaster.get('roundTime');
                        var inSeconds = parseInt((roundTime - elapsedTime).toFixed(0));
                        if (inSeconds >= 0) {
                            this.setText("" + inSeconds);
                        }
                        else {
                            endLevel();
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
                    var scoreText = phaserTexts.add({ name: 'scoreText', group: 'ui_text', x: _this.x, y: _this.y, font: 'gem', size: 14, default: "" + gameData.score, alpha: 0 });
                    scoreText.anchor.setTo(0.5, 0.5);
                    scoreText.onUpdate = function () { };
                    scoreText.updateScore = function () {
                        this.setText("" + phaserMaster.get('gameData').score);
                    };
                    scoreText.reveal = function () {
                        this.game.add.tween(this).to({ alpha: 1 }, Phaser.Timer.SECOND / 2, Phaser.Easing.Linear.In, true, 0, 0, false);
                    };
                    scoreText.hide = function () {
                        this.game.add.tween(this).to({ alpha: 0 }, Phaser.Timer.SECOND / 2, Phaser.Easing.Linear.In, true, 0, 0, false);
                    };
                    scoreText.reveal();
                });
            };
            scoreContainer.hide = function () {
                this.game.add.tween(this).to({ y: -200 }, Phaser.Timer.SECOND, Phaser.Easing.Back.InOut, true, 500, 0, false);
                phaserTexts.get('scoreText').hide();
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
            var menuButton1Text = phaserTexts.add({ name: 'menuButton1Text', font: 'gem', x: menuButton1.x, y: menuButton1.y, size: 14, default: "" });
            menuButton1Text.anchor.setTo(0.5, 0.5);
            var menuButton2 = phaserSprites.addFromAtlas({ name: "menuButton2", group: 'ui_buttons', x: game.world.centerX, y: game.world.centerY + 175, atlas: 'atlas_main', filename: 'ui_button.png', visible: false });
            menuButton2.anchor.setTo(0.5, 0.5);
            menuButton2.reveal = function () {
                this.visible = true;
            };
            var menuButton2Text = phaserTexts.add({ name: 'menuButton2Text', font: 'gem', x: menuButton2.x, y: menuButton2.y, size: 14, default: "" });
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
            var player = createPlayer();
            overlay.fadeOut(isDevMode ? 0 : Phaser.Timer.SECOND / 2, function () {
                playSequence('SAVE THE WORLD', function () {
                    player.moveToStart();
                    game.time.events.add(isDevMode ? Phaser.Timer.SECOND * 0 : Phaser.Timer.SECOND * 1, function () {
                        playSequence(roundTime + " SECONDS GO", function () {
                            game.time.events.add(isDevMode ? Phaser.Timer.SECOND * 0 : Phaser.Timer.SECOND / 2, function () {
                                phaserSprites.getGroup('ui').map(function (sprite) {
                                    sprite.reveal();
                                });
                            }).autoDestroy = true;
                            clock.start();
                            phaserMaster.changeState('READY');
                        });
                    });
                });
            });
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
        function createShipExhaust() {
            var shipExhaust = phaserSprites.addFromAtlas({ name: 'exhaust', group: 'playership', atlas: 'atlas_main', filename: 'exhaust_red_1.png', visible: false });
            shipExhaust.animations.add('exhaust_animation', Phaser.Animation.generateFrameNames('exhaust_red_', 1, 8, '.png'), 1, true);
            shipExhaust.animations.play('exhaust_animation', 30, true);
            phaserGroup.add(8, shipExhaust);
            shipExhaust.anchor.setTo(0.5, 0.5);
            shipExhaust.onUpdate = function () {
                var player = phaserSprites.get('player');
                var x = player.x, width = player.width, height = player.height, y = player.y, visible = player.visible, isDead = player.isDead;
                this.visible = !phaserMaster.checkState('ENDLEVEL') ? visible : false;
                this.x = x;
                this.y = y + 40;
                this.alpha = !phaserMaster.checkState('ENDLEVEL') && isDead ? 0 : 1;
                this.scale.setTo(1, 1);
            };
            shipExhaust.updateCords = function (x, y) {
                var starMomentum = phaserMaster.get('starMomentum');
                this.x = x;
                if (starMomentum.y == 0) {
                    this.y = y + 40;
                    this.scale.setTo(1, 1);
                }
                if (starMomentum.y > 0) {
                    this.y = y + 50;
                    this.scale.setTo(1, 1.5);
                }
                if (starMomentum.y < 0) {
                    this.y = y + 25;
                    this.scale.setTo(1, 0.25);
                }
            };
            shipExhaust.destroyIt = function () {
                phaserSprites.destroy('exhaust');
            };
        }
        function createPlayer() {
            var game = phaserMaster.game();
            var player = phaserSprites.addFromAtlas({ name: 'player', group: 'playership', atlas: 'atlas_main', filename: 'ship_body.png', visible: false });
            player.anchor.setTo(0.5, 0.5);
            player.scale.setTo(1, 1);
            player.isInvincible = false;
            player.isDead = false;
            game.physics.enable(player, Phaser.Physics.ARCADE);
            phaserGroup.add(8, player);
            createShipExhaust();
            player.onUpdate = function () {
                var _this = this;
                if (this.visible && !player.isDead) {
                    player.createTrail();
                }
                if (!player.isInvincible && !phaserMaster.checkState('ENDLEVEL')) {
                    var hasCollided_1 = false;
                    returnAllCollidables().map(function (target) {
                        target.game.physics.arcade.overlap(_this, target, function (player, target) {
                            hasCollided_1 = true;
                            target.damageIt(50);
                        }, null, _this);
                    });
                    if (hasCollided_1) {
                        this.isInvincible = true;
                        player.takeDamage(10);
                    }
                }
            };
            player.takeDamage = function (val) {
                var _this = this;
                var gameData = phaserMaster.get('gameData');
                var health = gameData.player.health - val;
                updateShipHealthbar(health);
                if (health > 0) {
                    saveData('player', { health: health, lives: gameData.player.lives });
                    this.tint = 1 * 0xff0000;
                    this.alpha = 0.75;
                    this.game.add.tween(this).to({ tint: 1 * 0xffffff, alpha: 1 }, 100, Phaser.Easing.Linear.Out, true, 100, 0, false).
                        onComplete.add(function () {
                        _this.isInvincible = false;
                    });
                }
                else {
                    gameData.player.lives--;
                    phaserSprites.get("lifeIcon_" + gameData.player.lives).destroyIt();
                    if (gameData.player.lives > 0) {
                        saveData('player', { health: 100, lives: gameData.player.lives });
                        phaserControls.clearAllControlIntervals();
                        phaserControls.disableAllInput();
                        this.isDestroyed();
                    }
                    else {
                        gameOver();
                    }
                }
            };
            player.isDestroyed = function () {
                var _this = this;
                player.isDead = true;
                weaponManager.createExplosion(this.x, this.y, 1, 6);
                game.add.tween(this).to({ angle: game.rnd.integerInRange(-90, 90), alpha: 0 }, 1000, Phaser.Easing.Linear.In, true, 0).
                    onComplete.add(function () {
                    weaponManager.createExplosion(_this.x, _this.y, 1, 6);
                    _this.visible = false;
                    setTimeout(function () {
                        updateShipHealthbar(100);
                        player.moveToStart();
                    }, 1000);
                });
            };
            player.createTrail = function () {
                var trailCount = phaserSprites.getGroup('trails').length;
                if (trailCount < phaserMaster.checkState('ENDLEVEL') ? 20 : 10) {
                    var trail = phaserSprites.addFromAtlas({ name: "trail_" + game.rnd.integer(), group: 'trails', x: this.x, y: this.y, filename: 'ship_body.png', atlas: 'atlas_main', visible: true });
                    trail.anchor.setTo(0.5, 0.5);
                    trail.scale.setTo(this.scale.x - 0.2, this.scale.y - 0.2);
                    trail.alpha = 0.4;
                    trail.angle = this.angle;
                    trail.tint = 1 * 0x0000ff;
                    phaserGroup.add(7, trail);
                    trail.destroySelf = function () {
                        var _this = this;
                        this.game.add.tween(this).to({ alpha: 0 }, phaserMaster.checkState('ENDLEVEL') ? 600 : 250, Phaser.Easing.Linear.In, true, 0).
                            onComplete.add(function () {
                            phaserSprites.destroy(_this.name);
                        }, this);
                    };
                    trail.destroySelf();
                }
            };
            player.selfDestruct = function () {
                var _this = this;
                this.isInvincible = true;
                phaserSprites.get('exhaust').destroyIt();
                game.add.tween(this.scale).to({ x: 0.25, y: 0.25 }, 3400, Phaser.Easing.Linear.In, true, 0).
                    game.add.tween(this).to({ angle: 720 }, 3400, Phaser.Easing.Linear.In, true, 0).
                    onComplete.add(function () {
                    phaserSprites.destroy(_this.name);
                    weaponManager.createExplosion(_this.x, _this.y, 0.5, 6);
                }, this);
            };
            player.moveToStart = function () {
                var _this = this;
                player.isDead = false;
                this.angle = 0;
                this.alpha = 1;
                this.visible = true;
                this.isInvincible = true;
                this.x = this.game.world.centerX;
                this.y = this.game.world.centerY + 550;
                game.add.tween(this).to({ y: game.world.centerY + 200 }, 1000, Phaser.Easing.Exponential.InOut, true, 0, 0, false).
                    onComplete.add(function () {
                    phaserControls.enableAllInput();
                    setTimeout(function () {
                        _this.isInvincible = false;
                    }, 1000);
                });
            };
            player.moveX = function (val) {
                this.x += val;
                phaserSprites.get('exhaust').updateCords(this.x, this.y);
                this.checkLimits();
            };
            player.moveY = function (val) {
                this.y += val;
                phaserSprites.get('exhaust').updateCords(this.x, this.y);
                this.checkLimits();
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
                var _this = this;
                this.isInvincible = true;
                this.game.add.tween(this.scale).to({ x: 2, y: 2 }, 750, Phaser.Easing.Exponential.InOut, true, 0, 0, false);
                this.game.add.tween(this).to({ x: this.game.world.centerX, y: this.game.world.centerY + 50 }, 750, Phaser.Easing.Exponential.InOut, true, 0, 0, false).
                    onComplete.add(function () {
                    _this.game.add.tween(_this).to({ y: _this.game.world.height + 200 }, 750, Phaser.Easing.Exponential.InOut, true, 100, 0, false).
                        onComplete.add(function () {
                        _this.game.add.tween(_this).to({ y: -200 }, 1000, Phaser.Easing.Exponential.InOut, true, 0, 0, false).
                            onComplete.add(function () {
                            callback();
                        }, _this);
                    }, _this);
                }, this);
            };
            return player;
        }
        function createAlien(options) {
            var game = phaserMaster.game();
            var alien = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: "alien_" + game.rnd.integer(), group: 'aliens', atlas: 'atlas_main', filename: "asteroid_mid_layer_" + game.rnd.integerInRange(1, 3) + ".png", visible: true });
            alien.anchor.setTo(0.5, 0.5);
            alien.scale.setTo(1.5, 1.5);
            game.physics.enable(alien, Phaser.Physics.ARCADE);
            alien.body.velocity.y = options.iy;
            alien.body.velocity.x = options.ix;
            alien.angleMomentum = game.rnd.integerInRange(-5, 5);
            alien.body.bounce.setTo(1, 1);
            alien.atTarget = false;
            alien.maxHealth = 150;
            alien.health = alien.maxHealth;
            alien.fallThreshold = game.rnd.integerInRange(0, 75);
            phaserGroup.add(3, alien);
            alien.damageIt = function (val) {
                if (!this.atTarget) {
                    this.health -= val;
                    this.tint = 1 * 0xff0000;
                    this.game.add.tween(this).to({ tint: 1 * 0xffffff }, 100, Phaser.Easing.Linear.Out, true, 0, 0, false);
                    if (this.health <= 0) {
                        this.destroyIt();
                    }
                }
            };
            alien.removeIt = function () {
                phaserSprites.destroy(this.name);
            };
            alien.destroyIt = function (spawnMore) {
                var _this = this;
                if (spawnMore === void 0) { spawnMore = true; }
                var score = phaserMaster.get('gameData').score;
                score += 100;
                saveData('score', score);
                var scoreText = phaserTexts.get('scoreText');
                scoreText.updateScore();
                var tween = {
                    angle: game.rnd.integerInRange(-720, 720),
                    x: this.x - game.rnd.integerInRange(-25, 25),
                    y: this.y - game.rnd.integerInRange(5, 25),
                    alpha: .5
                };
                this.game.add.tween(this).to(tween, game.rnd.integerInRange(150, 500), Phaser.Easing.Linear.Out, true, 0, 0, false);
                this.body = null;
                game.time.events.add(Phaser.Timer.SECOND / 2, function () {
                    weaponManager.createExplosion(_this.x, _this.y, 1, 6);
                    if (spawnMore) {
                        for (var i = 0; i < 5; i++) {
                            createTrash({
                                x: _this.x,
                                y: _this.y,
                                ix: game.rnd.integerInRange(-100, 100),
                                iy: -game.rnd.integerInRange(-20, 20)
                            });
                        }
                    }
                    phaserSprites.destroy(_this.name);
                }, this).autoDestroy = true;
            };
            alien.fallToPlanet = function () {
                var _this = this;
                this.tint = 1 * 0x000000;
                this.atTarget = true;
                this.body = null;
                this.game.add.tween(this).to({ y: this.y + 60 }, Phaser.Timer.SECOND * 2, Phaser.Easing.Linear.In, true, 0).autoDestroy = true;
                setTimeout(function () {
                    _this.game.add.tween(_this.scale).to({ x: 0, y: 0 }, Phaser.Timer.SECOND * 1, Phaser.Easing.Linear.In, true, game.rnd.integerInRange(0, 500)).
                        onComplete.add(function () {
                        _this.removeIt();
                        earthTakeDamage(2);
                        weaponManager.createExplosion(_this.x, _this.y, 0.25, 6);
                    }).autoDestroy = true;
                }, 300);
            };
            alien.checkLocation = function () {
                this.angle += alien.angleMomentum;
                if (this.angleMomentum > 0) {
                    this.angleMomentum -= 0.002;
                }
                if (this.angleMomentum < 0) {
                    this.angleMomentum += 0.002;
                }
                if (this.y > this.height) {
                    if (this.body !== null) {
                        this.body.collideWorldBounds = true;
                    }
                }
                if (this.y > this.game.canvas.height - (75 + this.fallThreshold)) {
                    if (this.body !== null && !this.atTarget) {
                        this.body.collideWorldBounds = false;
                        this.fallToPlanet();
                    }
                }
            };
            alien.onUpdate = function () {
                game.physics.arcade.collide([phaserSprites.get('leftBoundry'), phaserSprites.get('rightBoundry')], this);
                this.rotate += 2;
                if (!alien.atTarget) {
                    if (this.body !== null) {
                        if (this.body.velocity.y + 2 < 100) {
                            this.body.velocity.y += 2;
                        }
                        if (this.body.velocity.x > 0) {
                            this.body.velocity.x -= 0.2;
                        }
                        if (this.body.velocity.x < 0) {
                            this.body.velocity.x += 0.2;
                        }
                    }
                    this.checkLocation();
                }
            };
        }
        function createBoss(options) {
            var game = phaserMaster.game();
            var obj = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: "boss_" + game.rnd.integer(), group: 'boss', atlas: 'atlas_main', filename: "asteroid_large_layer_" + game.rnd.integerInRange(1, 3) + ".png", visible: true });
            obj.anchor.setTo(0.5, 0.5);
            game.physics.enable(obj, Phaser.Physics.ARCADE);
            obj.body.velocity.y = options.iy;
            obj.body.velocity.x = options.ix;
            obj.angleMomentum = game.rnd.integerInRange(-5, 5);
            obj.body.bounce.setTo(1, 1);
            obj.atTarget = false;
            obj.maxHealth = 40000;
            obj.health = obj.maxHealth;
            obj.fallThreshold = game.rnd.integerInRange(0, 75);
            phaserGroup.add(3, obj);
            obj.damageIt = function (val) {
                if (!this.atTarget) {
                    this.health -= val;
                    this.tint = 1 * 0xff0000;
                    this.game.add.tween(this).to({ tint: 1 * 0xffffff }, 100, Phaser.Easing.Linear.Out, true, 0, 0, false);
                    if (this.health <= 0) {
                        this.destroyIt();
                    }
                }
            };
            obj.removeIt = function () {
                phaserSprites.destroy(this.name);
            };
            obj.destroyIt = function (spawnMore) {
                var _this = this;
                if (spawnMore === void 0) { spawnMore = true; }
                var score = phaserMaster.get('gameData').score;
                score += 1000;
                saveData('score', score);
                var scoreText = phaserTexts.get('scoreText');
                scoreText.updateScore();
                var tween = {
                    angle: 720,
                    x: this.x - game.rnd.integerInRange(-10, 10),
                    y: this.y - game.rnd.integerInRange(10, 10),
                    alpha: .15
                };
                this.game.add.tween(this).to(tween, Phaser.Timer.SECOND * 2, Phaser.Easing.Linear.Out, true, 0, 0, false);
                this.game.add.tween(this.scale).to({ x: 0.5, y: 0.5 }, Phaser.Timer.SECOND * 2, Phaser.Easing.Linear.Out, true, 0, 0, false);
                this.body = null;
                game.time.events.add(Phaser.Timer.SECOND * 2, function () {
                    var _a = _this, x = _a.x, y = _a.y;
                    impactExplosion(x, y, 2, 100);
                    phaserSprites.destroy(_this.name);
                }, this).autoDestroy = true;
            };
            obj.fallToPlanet = function () {
                var _this = this;
                this.tint = 1 * 0x000000;
                this.atTarget = true;
                this.body = null;
                this.game.add.tween(this).to({ y: this.y + 60, angle: 720 }, Phaser.Timer.SECOND * 3, Phaser.Easing.Linear.In, true, 0).autoDestroy = true;
                setTimeout(function () {
                    _this.game.add.tween(_this.scale).to({ x: 0, y: 0 }, Phaser.Timer.SECOND * 3, Phaser.Easing.Linear.In, true, game.rnd.integerInRange(0, 500)).
                        onComplete.add(function () {
                        _this.removeIt();
                        earthTakeDamage(10);
                        weaponManager.createExplosion(_this.x, _this.y, .85, 6);
                    }).autoDestroy = true;
                }, 300);
            };
            obj.checkLocation = function () {
                this.angle += obj.angleMomentum;
                if (this.angleMomentum > 0) {
                    this.angleMomentum -= 0.002;
                }
                if (this.angleMomentum < 0) {
                    this.angleMomentum += 0.002;
                }
                if (this.y > this.height) {
                    if (this.body !== null) {
                        this.body.collideWorldBounds = true;
                    }
                }
                if (this.y > this.game.canvas.height - (75 + this.fallThreshold)) {
                    if (this.body !== null && !this.atTarget) {
                        this.body.collideWorldBounds = false;
                        this.fallToPlanet();
                    }
                }
            };
            obj.onUpdate = function () {
                game.physics.arcade.collide([phaserSprites.get('leftBoundry'), phaserSprites.get('rightBoundry')], this);
                this.rotate += 2;
                if (!this.atTarget) {
                    if (this.body !== null) {
                        if (this.body.velocity.y + 1 < 25) {
                            this.body.velocity.y += 1;
                        }
                        if (this.body.velocity.x > 0) {
                            this.body.velocity.x -= 0.2;
                        }
                        if (this.body.velocity.x < 0) {
                            this.body.velocity.x += 0.2;
                        }
                    }
                    this.checkLocation();
                }
            };
        }
        function createTrash(options) {
            var game = phaserMaster.game();
            var trash = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: "trash_" + game.rnd.integer(), group: 'trashes', atlas: 'atlas_main', filename: "asteroid_small_layer_" + game.rnd.integerInRange(1, 3) + ".png", visible: true });
            trash.anchor.setTo(0.5, 0.5);
            trash.scale.setTo(1, 1);
            game.physics.enable(trash, Phaser.Physics.ARCADE);
            trash.body.velocity.y = options.iy;
            trash.body.velocity.x = options.ix;
            trash.angleMomentum = game.rnd.integerInRange(-5, 5);
            trash.body.bounce.setTo(1, 1);
            trash.atTarget = false;
            trash.maxHealth = 50;
            trash.health = trash.maxHealth;
            trash.fallThrehold = game.rnd.integerInRange(0, 75);
            phaserGroup.add(3, trash);
            trash.damageIt = function (val) {
                this.health -= val;
                this.tint = 1 * 0xff0000;
                this.game.add.tween(this).to({ tint: 1 * 0xffffff }, 100, Phaser.Easing.Linear.Out, true, 0, 0, false);
                if (this.health <= 0) {
                    this.destroyIt();
                }
                else {
                }
            };
            trash.removeIt = function () {
                phaserSprites.destroy(this.name);
            };
            trash.fallToPlanet = function () {
                var _this = this;
                this.tint = 1 * 0x000000;
                this.atTarget = true;
                this.body = null;
                this.game.add.tween(this).to({ y: this.y + 60 }, Phaser.Timer.SECOND * 2, Phaser.Easing.Linear.In, true, 0).autoDestroy = true;
                setTimeout(function () {
                    _this.game.add.tween(_this.scale).to({ x: 0, y: 0 }, Phaser.Timer.SECOND * 1, Phaser.Easing.Linear.In, true, game.rnd.integerInRange(0, 500)).
                        onComplete.add(function () {
                        _this.removeIt();
                        earthTakeDamage(1);
                        weaponManager.createExplosion(_this.x, _this.y, 0.25, 6);
                    }).autoDestroy = true;
                }, 300);
            };
            trash.destroyIt = function () {
                var _this = this;
                var score = phaserMaster.get('gameData').score;
                score += 25;
                saveData('score', score);
                var scoreText = phaserTexts.get('scoreText');
                scoreText.updateScore();
                var tween = {
                    angle: game.rnd.integerInRange(-720, 720),
                    x: this.x - game.rnd.integerInRange(-25, 25),
                    y: this.y - game.rnd.integerInRange(5, 25),
                    alpha: .5
                };
                this.game.add.tween(this).to(tween, game.rnd.integerInRange(50, 200), Phaser.Easing.Linear.Out, true, 0, 0, false);
                this.body = null;
                game.time.events.add(Phaser.Timer.SECOND / 3, function () {
                    weaponManager.createExplosion(_this.x, _this.y, 0.5, 6);
                    phaserSprites.destroy(_this.name);
                }, this).autoDestroy = true;
            };
            trash.checkLocation = function () {
                this.angle += trash.angleMomentum;
                if (this.angleMomentum > 0) {
                    this.angleMomentum -= 0.002;
                }
                if (this.angleMomentum < 0) {
                    this.angleMomentum += 0.002;
                }
                if (this.y > this.height) {
                    if (this.body !== null) {
                        this.body.collideWorldBounds = true;
                    }
                }
                if (this.y > this.game.canvas.height - (50 + this.fallThrehold)) {
                    if (this.body !== null && !this.atTarget) {
                        this.body.collideWorldBounds = false;
                        this.fallToPlanet();
                    }
                }
                if (this.y > this.game.canvas.height + this.height) {
                    this.removeIt();
                }
            };
            trash.onUpdate = function () {
                game.physics.arcade.collide([phaserSprites.get('leftBoundry'), phaserSprites.get('rightBoundry')], this);
                this.rotate += 4;
                if (this.body !== null) {
                    if (this.body.velocity.y + 1 < 50) {
                        this.body.velocity.y += 1;
                    }
                    if (this.body.velocity.x > 0) {
                        this.body.velocity.x -= 0.2;
                    }
                    if (this.body.velocity.x < 0) {
                        this.body.velocity.x += 0.2;
                    }
                }
                this.checkLocation();
            };
        }
        function fireBullet() {
            var game = phaserMaster.game();
            var player = phaserSprites.getOnly(['player']).player;
            var weaponData = phaserMaster.getOnly(['weaponData']).weaponData;
            var weapon = weaponData.primaryWeapons.BULLET;
            var gap = 10;
            var shots = 3;
            var _loop_2 = function (i) {
                setTimeout(function () {
                    var bullet = weaponManager.createBullet({ name: "bullet_" + game.rnd.integer(), group: 'ship_weapons', x: player.x - (gap * shots / 2) + (i * gap), offset: 0, y: player.y, spread: 0, layer: 3 });
                    bullet.onUpdate = function () {
                        var _this = this;
                        this.accelerate();
                        if (this.y < 0) {
                            this.destroyIt();
                        }
                        returnAllCollidables().map(function (target) {
                            target.game.physics.arcade.overlap(_this, target, function (bullet, target) {
                                if (!weapon.pierce) {
                                    bullet.destroyIt();
                                }
                                target.damageIt(weapon.damage);
                            }, null, _this);
                        });
                    };
                }, 25);
            };
            for (var i = 0; i < shots; i++) {
                _loop_2(i);
            }
        }
        function fireLasers() {
            var game = phaserMaster.game();
            var player = phaserSprites.getOnly(['player']).player;
            var weaponData = phaserMaster.getOnly(['weaponData']).weaponData;
            var weapon = weaponData.primaryWeapons.BULLET;
            var gap = 50;
            var shots = 3;
            for (var i = 0; i < shots; i++) {
                var bullet = weaponManager.createLaser({ name: "laser_" + game.rnd.integer(), group: 'ship_weapons', x: player.x - gap + (i * gap), offset: 0, y: player.y - player.height / 2, spread: 0, layer: 2 });
                bullet.onUpdate = function () {
                    var _this = this;
                    this.accelerate();
                    if (this.y < 0) {
                        this.destroyIt();
                    }
                    returnAllCollidables().map(function (target) {
                        target.game.physics.arcade.overlap(_this, target, function (bullet, target) {
                            if (!weapon.pierce) {
                                bullet.destroyIt();
                            }
                            target.damageIt(weapon.damage);
                        }, null, _this);
                    });
                };
            }
        }
        function fireMissles() {
            var game = phaserMaster.game();
            var player = phaserSprites.getOnly(['player']).player;
            var weaponData = phaserMaster.getOnly(['weaponData']).weaponData;
            var weapon = weaponData.primaryWeapons.MISSLE;
            var gap = 50;
            var shots = 1;
            var _loop_3 = function (i) {
                var missle = weaponManager.createMissle({ name: "missle_" + game.rnd.integer(), group: 'ship_weapons', x: player.x - gap / 2 + (i * gap), offset: 0, y: player.y - player.height / 2, spread: (i % 2 ? 0.25 : -0.25), layer: 2 });
                missle.onUpdate = function () {
                    var _this = this;
                    if (missle.isActive) {
                        this.accelerate();
                        if (this.y < 0) {
                            this.destroyIt();
                        }
                        returnAllCollidables().map(function (target) {
                            target.game.physics.arcade.overlap(_this, target, function (bullet, target) {
                                if (!weapon.pierce) {
                                    bullet.destroyIt();
                                }
                                target.damageIt(weapon.damage);
                            }, null, _this);
                        });
                    }
                };
            };
            for (var i = 0; i < shots * 2; i++) {
                _loop_3(i);
            }
        }
        function createClusterbomb(options) {
            var game = phaserMaster.game();
            var player = phaserSprites.getOnly(['player']).player;
            var weaponData = phaserMaster.getOnly(['weaponData']).weaponData;
            var weapon = weaponData.secondaryWeapons.CLUSTERBOMB;
            var bomb = weaponManager.createClusterbomb({ name: "clusterbomb_" + game.rnd.integer(), group: 'ship_weapons', x: player.x, y: player.y, layer: 2 });
            bomb.destroyIt = function () {
                weaponManager.createExplosion(this.x, this.y, 1.25, 6);
                phaserSprites.destroy(this.name);
                for (var i = 0; i < weapon.bomblets; i++) {
                    createBomblet({
                        x: this.x,
                        y: this.y,
                        ix: game.rnd.integerInRange(-400, 400),
                        iy: game.rnd.integerInRange(-400, 100),
                        damage: options.damage / 4,
                        group: 'ship_weapons',
                        layer: 2
                    });
                }
            };
            bomb.onUpdate = function () {
                var _this = this;
                this.angle += 5;
                returnAllCollidables().map(function (target) {
                    target.game.physics.arcade.overlap(_this, target, function (bomb, target) {
                        if (!bomb.hasDetonated) {
                            bomb.hasDetonated = true;
                            bomb.destroyIt();
                        }
                        target.damageIt(options.damage);
                    }, null, _this);
                });
            };
        }
        function createTriplebomb(options) {
            var game = phaserMaster.game();
            var bomb = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: "secondary_" + game.rnd.integer(), group: 'secondaryWpnSprite', atlas: 'atlas_main', filename: 'clusterBomb.png' });
            bomb.anchor.setTo(0.5, 0.5);
            game.physics.enable(bomb, Phaser.Physics.ARCADE);
            bomb.body.velocity.y = options.initialVelocity;
            phaserGroup.add(2, bomb);
            bomb.accelerate = function () {
                this.body.velocity.y -= (options.velocity * options.delay);
            };
            bomb.destroyIt = function () {
                impactExplosion(this.x, this.y, 2.5, options.damage);
                phaserSprites.destroy(this.name);
            };
            bomb.onUpdate = function () {
                var _this = this;
                this.accelerate();
                returnAllCollidables().map(function (target) {
                    target.game.physics.arcade.overlap(_this, target, function (bomb, target) {
                        bomb.destroyIt();
                        target.damageIt(options.damage);
                    }, null, _this);
                });
            };
        }
        function createTurret(options) {
            var game = phaserMaster.game();
            var turret = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: "secondary_" + game.rnd.integer(), group: 'secondaryWpnSprite', atlas: 'atlas_main', filename: 'clusterBomb.png' });
            game.physics.enable(turret, Phaser.Physics.ARCADE);
            phaserGroup.add(2, turret);
            setTimeout(function () {
                turret.destroyIt();
            }, options.lifespan);
            turret.fireInterval = setInterval(function () {
                var x = turret.x, y = turret.y, width = turret.width;
            }, 200);
            turret.fireInterval;
            turret.destroyIt = function () {
                impactExplosion(this.x, this.y, 2.5, options.damage);
                clearInterval(this.fireInterval);
                phaserSprites.destroy(this.name);
            };
            turret.onUpdate = function () {
                var _this = this;
                returnAllCollidables().map(function (target) {
                    target.game.physics.arcade.overlap(_this, target, function (turret, target) {
                        turret.destroyIt();
                        target.damageIt(options.damage);
                    }, null, _this);
                });
            };
        }
        function createMine(options) {
            var game = phaserMaster.game();
            var mine = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: "secondary_" + game.rnd.integer(), group: 'secondaryWpnSprite', atlas: 'atlas_main', filename: 'clusterBomb.png' });
            mine.anchor.setTo(0.5, 0.5);
            mine.scale.setTo(1.5, 1.5);
            game.physics.enable(mine, Phaser.Physics.ARCADE);
            phaserGroup.add(2, mine);
            if (phaserSprites.getGroup('secondaryWpnSprite').length > options.limit) {
                phaserSprites.getGroup('secondaryWpnSprite')[0].destroyIt();
            }
            mine.destroyIt = function () {
                var _a = this, x = _a.x, y = _a.y;
                impactExplosion(x, y, 3, options.damage);
                setTimeout(function () {
                    impactExplosion(x, y, 2, options.damage);
                }, 500);
                clearInterval(this.fireInterval);
                phaserSprites.destroy(this.name);
            };
            mine.onUpdate = function () {
                var _this = this;
                this.angle += 5;
                returnAllCollidables().map(function (target) {
                    target.game.physics.arcade.overlap(_this, target, function (mine, target) {
                        mine.destroyIt();
                        target.damageIt(options.damage);
                    }, null, _this);
                });
            };
        }
        function createBomblet(options) {
            var game = phaserMaster.game();
            var bomblet = weaponManager.createBomblet(options);
            bomblet.destroyIt = function () {
                impactExplosion(this.x, this.y, 0.5, options.damage);
                phaserSprites.destroy(this.name);
            };
            bomblet.onUpdate = function () {
                var _this = this;
                this.angle += 10;
                if (this.game.time.now > bomblet.detonate) {
                    this.destroyIt();
                }
                returnAllCollidables().map(function (target) {
                    target.game.physics.arcade.overlap(_this, target, function (bomblet, target) {
                        bomblet.destroyIt();
                        target.damageIt(options.damage);
                    }, null, _this);
                });
            };
        }
        function impactExplosion(x, y, scale, damage) {
            var game = phaserMaster.game();
            var impactExplosion = weaponManager.createImpactExplosion(x, y, scale, 6);
            impactExplosion.onUpdate = function () {
                var _this = this;
                returnAllCollidables().map(function (target) {
                    target.game.physics.arcade.overlap(_this, target, function (impactExplosion, target) {
                        target.damageIt(damage);
                    }, null, _this);
                });
            };
        }
        function returnAllCollidables() {
            return phaserSprites.getGroup('aliens').concat(phaserSprites.getGroup('trashes'), phaserSprites.getGroup('boss'));
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
            phaserSprites.getManyGroups(['spaceGroup', 'movingStarField', 'ship_weapons', 'secondaryWpnSprite', 'impactExplosions', 'playership']).map(function (obj) {
                obj.onUpdate();
            });
            if (currentState === 'READY') {
                if (elapsedTime < 15 && phaserSprites.getGroup('aliens').length < 5) {
                    createAlien({
                        x: game.rnd.integerInRange(0, game.canvas.width),
                        y: game.rnd.integerInRange(-50, -300),
                        ix: game.rnd.integerInRange(-100, 100),
                        iy: game.rnd.integerInRange(0, 80)
                    });
                }
                if (elapsedTime === 15 && phaserSprites.getGroup('boss').length === 0) {
                    createBoss({
                        x: game.rnd.integerInRange(100, game.canvas.width - 100),
                        y: game.rnd.integerInRange(-50, -100),
                        ix: game.rnd.integerInRange(-100, 100),
                        iy: 5
                    });
                }
                phaserSprites.getManyGroups(['ui_overlay', 'aliens', 'boss', 'trashes']).map(function (obj) {
                    if (obj !== undefined) {
                        obj.onUpdate();
                    }
                });
                phaserTexts.getManyGroups(['ui', 'timeKeeper']).map(function (obj) {
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
                        case 'LASER':
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
                    if (secondaryWeapon.reference === 'CLUSTERBOMB') {
                        var x = player.x, y = player.y;
                        createClusterbomb({ x: x, y: y, velocity: secondaryWeapon.velocity, damage: secondaryWeapon.damage, bomblets: secondaryWeapon.bomblets });
                    }
                    if (secondaryWeapon.reference === 'TRIPLEBOMB') {
                        var x = player.x, y = player.y;
                        createTriplebomb({ x: x, y: y, initialVelocity: secondaryWeapon.initialVelocity, velocity: secondaryWeapon.velocity, damage: secondaryWeapon.damage, delay: 1 });
                        createTriplebomb({ x: x, y: y, initialVelocity: secondaryWeapon.initialVelocity, velocity: secondaryWeapon.velocity, damage: secondaryWeapon.damage, delay: 2 });
                        createTriplebomb({ x: x, y: y, initialVelocity: secondaryWeapon.initialVelocity, velocity: secondaryWeapon.velocity, damage: secondaryWeapon.damage, delay: 3 });
                    }
                    if (secondaryWeapon.reference === 'TURRET') {
                        var x = player.x, y = player.y;
                        createTurret({ x: x, y: y, damage: secondaryWeapon.damage, lifespan: secondaryWeapon.lifespan });
                    }
                    if (secondaryWeapon.reference === 'MINES') {
                        var x = player.x, y = player.y;
                        createMine({ x: x, y: y, damage: secondaryWeapon.damage, limit: secondaryWeapon.limit });
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
                    if (menuButtonSelection === 1) {
                        updateStore();
                        nextLevel();
                    }
                    if (menuButtonSelection === 2) {
                        updateStore();
                        saveAndQuit();
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
                    if (menuButtonSelection === 1) {
                        retryLevel();
                    }
                    if (menuButtonSelection === 2) {
                        resetGame();
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
            phaserSprites.getGroup('secondaryWpnSprite').map(function (obj) {
                obj.destroyIt();
            });
            phaserSprites.get('player').playEndSequence(function () {
                var level = gameData.level++;
                level++;
                saveData('level', level);
                for (var i = 0; i < 20; i++) {
                    setTimeout(function () {
                        weaponManager.createExplosion(game.rnd.integerInRange(0, game.world.width), game.rnd.integerInRange(0, game.world.height), game.rnd.integerInRange(1, 4), 6);
                    }, game.rnd.integerInRange(0, 50) * i);
                }
                setTimeout(function () {
                    phaserSprites.getGroup('aliens').map(function (alien) {
                        setTimeout(function () {
                            alien.destroyIt(false);
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
                    var leftText = phaserTexts.add({ name: 'popLeft', font: 'gem', x: _this.x, y: _this.y - 10, size: 24, default: "PEOPLE SAVED:", alpha: 0 });
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
                                            var _loop_4 = function (i) {
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
                                                _loop_4(i);
                                            }
                                            setTimeout(function () {
                                                phaserMaster.changeState('VICTORYSTATE');
                                                phaserSprites.getGroup('ui_buttons').map(function (obj) {
                                                    obj.reveal();
                                                });
                                                phaserTexts.get('menuButton1Text').setText('CONTINUE');
                                                phaserTexts.get('menuButton2Text').setText('SAVE AND QUIT');
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
            phaserSprites.getGroup('secondaryWpnSprite').map(function (obj) {
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
            var game = phaserMaster.game();
            var overlaybmd = phaserBitmapdata.addGradient({ name: 'overlayFadeout', start: '#ffffff', end: '#ffffff', width: 5, height: 5, render: false });
            var overlay = phaserSprites.add({ x: 0, y: 0, name: "overlayFinal", width: game.world.width, height: game.world.height, reference: overlaybmd.cacheBitmapData, alpha: 0 });
            phaserGroup.add(20, overlay);
            game.add.tween(overlay).to({ alpha: 1 }, Phaser.Timer.SECOND, Phaser.Easing.Linear.In, true, 0, 0, false).
                onComplete.add(function () {
                setTimeout(function () {
                    callback();
                }, 500);
            });
        }
        function nextLevel() {
            updateStore();
            parent.loadNextLevel();
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
        var _loop_10 = function (i) {
            var _r = this_4.sprites.array.filter(function (obj) {
                return obj.group === names[i];
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
    WEAPON_MANAGER.prototype.createBullet = function (options) {
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var weaponData = phaserMaster.getAll().weaponData;
        var weapon = weaponData.primaryWeapons.BULLET;
        var ammo = phaserSprites.addFromAtlas({ y: options.y, name: options.name, group: options.group, atlas: atlas, filename: weapon.spriteAnimation[0] });
        if (weapon.spriteAnimation.length > 1) {
            ammo.animations.add('animate', weapon.spriteAnimation, 1, true);
            ammo.animations.play('animate', 30, true);
        }
        ammo.anchor.setTo(0.5, 0.5);
        ammo.x = options.x + options.offset;
        game.physics.enable(ammo, Phaser.Physics.ARCADE);
        ammo.body.velocity.y = weapon.initialVelocity;
        ammo.accelerate = function () {
            ammo.body.velocity.y -= weapon.velocity;
            ammo.body.velocity.x += options.spread;
        };
        ammo.destroyIt = function () {
            phaserSprites.destroy(ammo.name);
        };
        ammo.onUpdate = function () {
            this.accelerate();
            if (this.y < -this.height) {
                this.destroyIt();
            }
        };
        if (options.layer !== undefined) {
            phaserGroup.add(options.layer, ammo);
        }
        return ammo;
    };
    WEAPON_MANAGER.prototype.createMissle = function (options) {
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var weaponData = phaserMaster.getAll().weaponData;
        var weapon = weaponData.primaryWeapons.MISSLE;
        var ammo = phaserSprites.addFromAtlas({ y: options.y, name: options.name, group: options.group, atlas: atlas, filename: weapon.spriteAnimation[0] });
        if (weapon.spriteAnimation.length > 1) {
            ammo.animations.add('animate', weapon.spriteAnimation, 1, true);
            ammo.animations.play('animate', 30, true);
        }
        ammo.anchor.setTo(0.5, 0.5);
        ammo.angle = -90;
        ammo.x = options.x + options.offset;
        game.physics.enable(ammo, Phaser.Physics.ARCADE);
        ammo.body.velocity.y = weapon.initialVelocity;
        ammo.isActive = true;
        ammo.accelerate = function () {
            ammo.body.velocity.y -= weapon.velocity;
            ammo.body.velocity.x += options.spread;
        };
        ammo.destroyIt = function () {
            ammo.isActive = false;
            phaserSprites.destroy(ammo.name);
        };
        ammo.onUpdate = function () {
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
    WEAPON_MANAGER.prototype.createLaser = function (options) {
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var weaponData = phaserMaster.getAll().weaponData;
        var weapon = weaponData.primaryWeapons.LASER;
        var ammo = phaserSprites.addFromAtlas({ y: options.y, name: options.name, group: options.group, atlas: atlas, filename: weapon.spriteAnimation[0] });
        if (weapon.spriteAnimation.length > 1) {
            ammo.animations.add('animate', weapon.spriteAnimation, 1, true);
            ammo.animations.play('animate', 30, true);
        }
        ammo.anchor.setTo(0.5, 0.5);
        ammo.x = options.x + options.offset;
        game.physics.enable(ammo, Phaser.Physics.ARCADE);
        ammo.body.velocity.y = weapon.initialVelocity;
        ammo.accelerate = function () {
            ammo.body.velocity.y -= weapon.velocity;
            ammo.body.velocity.x += options.spread;
        };
        ammo.destroyIt = function () {
            phaserSprites.destroy(ammo.name);
        };
        ammo.onUpdate = function () {
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
    WEAPON_MANAGER.prototype.createClusterbomb = function (options) {
        var _this = this;
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
        setTimeout(function () {
            if (!ammo.hasDetonated) {
                ammo.hasDetonated = true;
                ammo.destroyIt();
            }
        }, 800);
        ammo.accelerate = function () {
            if (ammo.body.velocity.y > -400) {
                ammo.body.velocity.y -= weapon.velocity;
            }
            ammo.body.velocity.x += options.spread;
        };
        ammo.destroyIt = function () {
            _this.createExplosion(ammo.x, ammo.y, 1.25, options.layer);
            for (var i = 0; i < weapon.bomblets; i++) {
                _this.createBomblet({
                    x: ammo.x,
                    y: ammo.y,
                    ix: game.rnd.integerInRange(-400, 400),
                    iy: game.rnd.integerInRange(-400, 100),
                    group: options.group,
                    layer: options.layer
                });
            }
            phaserSprites.destroy(ammo.name);
        };
        ammo.onUpdate = function () {
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
    WEAPON_MANAGER.prototype.createTriplebomb = function (options) {
        var _this = this;
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
        ammo.accelerate = function () {
            if (ammo.body.velocity.y > -500) {
                ammo.body.velocity.y -= weapon.velocity;
            }
            ammo.body.velocity.x += options.spread;
        };
        ammo.destroyIt = function () {
            _this.createExplosion(ammo.x, ammo.y, 1.25, options.layer);
            phaserSprites.destroy(ammo.name);
        };
        ammo.onUpdate = function () {
            ammo.angle += 15;
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
    WEAPON_MANAGER.prototype.createTurret = function (options) {
        var _this = this;
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var weaponData = phaserMaster.getAll().weaponData;
        var weapon = weaponData.secondaryWeapons.TURRET;
        var turret = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: options.name, group: options.group, atlas: atlas, filename: weapon.spriteAnimation[0] });
        turret.anchor.setTo(0.5, 0.5);
        game.physics.enable(turret, Phaser.Physics.ARCADE);
        phaserGroup.add(2, turret);
        setTimeout(function () {
            turret.destroyIt();
        }, weapon.lifespan);
        turret.fireInterval = setInterval(function () {
            var x = turret.x, y = turret.y, width = turret.width;
            _this.createBullet({ name: "B" + game.rnd.integer(), group: 'ship_wpn_preview', x: x, offset: 0, y: y, spread: 0, layer: options.layer });
            _this.createBullet({ name: "B" + game.rnd.integer(), group: 'ship_wpn_preview', x: x + width / 2, offset: 0, y: y, spread: 0, layer: options.layer });
            _this.createBullet({ name: "B" + game.rnd.integer(), group: 'ship_wpn_preview', x: x - width / 2, offset: 0, y: y, spread: 0, layer: options.layer });
        }, 200);
        turret.fireInterval;
        turret.destroyIt = function () {
            _this.createExplosion(turret.x, turret.y, 0.5, options.layer);
            clearInterval(turret.fireInterval);
            phaserSprites.destroy(turret.name);
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
    WEAPON_MANAGER.prototype.createBomblet = function (options) {
        var _this = this;
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var ammo = phaserSprites.addFromAtlas({ x: options.x, y: options.y, name: "bomblet_" + game.rnd.integer(), group: options.group, atlas: atlas, filename: 'clusterBomb.png' });
        ammo.anchor.setTo(0.5, 0.5);
        ammo.scale.setTo(0.5, 0.5);
        game.physics.enable(ammo, Phaser.Physics.ARCADE);
        ammo.body.velocity.y = options.iy;
        ammo.body.velocity.x = options.ix;
        ammo.fuse = game.time.now;
        ammo.detonate = game.time.now + game.rnd.integerInRange(1250, 1800);
        ammo.destroyIt = function () {
            _this.createExplosion(ammo.x, ammo.y, 1, options.layer);
            phaserSprites.destroy(ammo.name);
        };
        ammo.onUpdate = function () {
            ammo.angle += 5;
            if (ammo.game.time.now > ammo.detonate) {
                ammo.destroyIt();
            }
        };
        if (options.layer !== undefined) {
            phaserGroup.add(options.layer, ammo, options.layer);
        }
        return ammo;
    };
    WEAPON_MANAGER.prototype.createExplosion = function (x, y, scale, layer) {
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var explosion = phaserSprites.addFromAtlas({ name: "explosion_" + game.rnd.integer(), group: 'explosions', x: x, y: y, atlas: atlas, filename: "explosions_Layer_1.png" });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        explosion.animations.add('explosion', Phaser.Animation.generateFrameNames('explosions_Layer_', 1, 16, '.png'), 1, true);
        explosion.animations.play('explosion', 30, true);
        game.time.events.add(Phaser.Timer.SECOND / 2, function () {
            phaserSprites.destroy(explosion.name);
        }).autoDestroy = true;
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        return explosion;
    };
    WEAPON_MANAGER.prototype.createImpactExplosion = function (x, y, scale, layer) {
        var game = this.game;
        var _a = this, phaserMaster = _a.phaserMaster, phaserSprites = _a.phaserSprites, phaserGroup = _a.phaserGroup, atlas = _a.atlas;
        var explosion = phaserSprites.addFromAtlas({ name: "impact_" + game.rnd.integer(), group: 'impactExplosions', x: x, y: y, atlas: atlas, filename: "explosions_Layer_1.png" });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        game.physics.enable(explosion, Phaser.Physics.ARCADE);
        explosion.animations.add('explosion', Phaser.Animation.generateFrameNames('explosions_Layer_', 1, 16, '.png'), 1, true);
        explosion.animations.play('explosion', 30, true);
        game.time.events.add(Phaser.Timer.SECOND / 2, function () {
            phaserSprites.destroy(explosion.name);
        }).autoDestroy = true;
        if (layer !== undefined) {
            phaserGroup.add(layer, explosion);
        }
        return explosion;
    };
    return WEAPON_MANAGER;
}());
