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
        var phaserMaster = new PHASER_MASTER({ game: game, resolution: { width: options.width, height: options.height } }), phaserControls = new PHASER_CONTROLS(), phaserMouse = new PHASER_MOUSE({ showDebugger: false }), phaserSprites = new PHASER_SPRITE_MANAGER(), phaserBmd = new PHASER_BITMAPDATA_MANAGER(), phaserTexts = new PHASER_TEXT_MANAGER(), phaserButtons = new PHASER_BUTTON_MANAGER(), phaserGroup = new PHASER_GROUP_MANAGER(), phaserBitmapdata = new PHASER_BITMAPDATA_MANAGER(), playerManager = new PLAYER_MANAGER(), weaponManager = new WEAPON_MANAGER(), utilityManager = new UTILITY_MANAGER();
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
            game.load.atlas('atlas', folder + "/spritesheets/heroSelect/heroSelectAtlas.png", folder + "/spritesheets/heroSelect/heroSelectAtlas.json", Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
            game.load.atlas('atlas_main', folder + "/spritesheets/main/main.png", folder + "/spritesheets/main/main.json", Phaser.Loader.TEXTURE_atlas_main_JSON_HASH);
            game.load.atlas('atlas_weapons', folder + "/spritesheets/weapons/weaponsAtlas.png", folder + "/spritesheets/weapons/weaponsAtlas.json", Phaser.Loader.TEXTURE_atlas_main_JSON_HASH);
            game.load.bitmapFont('gem', folder + "/fonts/gem.png", folder + "/fonts/gem.xml");
            game.load.json('weaponData', folder + "/json/weaponData.json");
            game.load.json('pilotData', folder + "/json/pilotData.json");
            phaserMaster.changeState('PRELOAD');
            new PHASER_PRELOADER({ game: game, delayInSeconds: 0, done: function () { preloadComplete(); } });
        }
        function create() {
            var game = phaserMaster.game();
            phaserControls.assign(game);
            phaserMouse.assign(game);
            phaserSprites.assign(game);
            phaserBmd.assign(game);
            phaserTexts.assign(game);
            phaserButtons.assign(game);
            phaserGroup.assign(game, 20);
            phaserBitmapdata.assign(game);
            weaponManager.assign(game, phaserMaster, phaserSprites, phaserGroup, 'atlas_weapons');
            playerManager.assign(game, phaserMaster, phaserSprites, phaserTexts, phaserGroup, phaserControls, weaponManager, 'atlas_main');
            utilityManager.assign(game, phaserSprites, phaserBitmapdata, phaserGroup, 'atlas_main');
            var currentSelection = phaserMaster.let('currentSelection', 0);
            var pilotSelection = phaserMaster.let('pilotSelection', 0);
            var loadoutSelection = phaserMaster.let('loadoutSelection', 0);
            var primaryWeaponSelection = phaserMaster.let('primaryWeaponSelection', 0);
            var subWeaponSelection = phaserMaster.let('subWeaponSelection', 0);
            var perkSelection = phaserMaster.let('perkSelection', 0);
            var weaponData = phaserMaster.let('weaponData', game.cache.getJSON('weaponData'));
            var pilotData = phaserMaster.let('pilotData', game.cache.getJSON('pilotData'));
            var screenSplitX = this.game.world.width - 240;
            var screenSplitY = this.game.world.height / 2;
            var verticleFrame = phaserSprites.addFromAtlas({ x: screenSplitX, y: 0, height: game.world.height, name: "verticleFrame", group: 'ui_frame', filename: 'ui_frame_v.png', atlas: 'atlas' });
            var dividerFrame1 = phaserSprites.addFromAtlas({ x: 0, y: screenSplitY, width: verticleFrame.x, name: "dividerFrame1", group: 'ui_frame', filename: 'ui_frame_h.png', atlas: 'atlas' });
            var bmd = phaserBitmapdata.addGradient({ name: 'overlayFadeout', start: '#ffffff', end: '#ffffff', width: 1, height: 1, render: false });
            var container_1 = phaserSprites.add({ x: 0, y: 0, name: "container_1", width: screenSplitX, height: screenSplitY, reference: bmd.cacheBitmapData, visible: false });
            var container_2 = phaserSprites.add({ x: 0, y: 325, name: "container_2", width: screenSplitX, height: screenSplitY, reference: bmd.cacheBitmapData, visible: false });
            var container_3 = phaserSprites.add({ x: screenSplitX, y: 0, name: "container_3", width: game.world.width - screenSplitX, height: game.world.height, reference: bmd.cacheBitmapData, visible: false });
            var mask1 = phaserSprites.addBasicMaskToSprite(container_1);
            utilityManager.buildOverlayBackground('#ffffff', '#ffffff', 19, true);
            utilityManager.buildOverlayGrid(80, 20, 'landmine.png');
            var bg_clouds = phaserSprites.addTilespriteFromAtlas({ name: 'bg_clouds', group: 'ui_bg', x: container_1.x, y: container_1.y, width: container_1.width, height: container_1.height, atlas: 'atlas', filename: 'bg_clouds.png' });
            bg_clouds.mask = mask1;
            bg_clouds.onUpdate = function () {
                if (phaserMaster.get('currentSelection') === 0) {
                    this.tilePosition.x -= 3;
                }
            };
            var bg_cityscape = phaserSprites.addTilespriteFromAtlas({ name: 'bg_cityscape', group: 'ui_bg', x: container_2.x, y: container_2.y, width: container_2.width, height: container_2.height, atlas: 'atlas', filename: 'bg_cityscape.png' });
            bg_cityscape.onUpdate = function () {
                if (phaserMaster.get('currentSelection') === 1) {
                    this.tilePosition.x -= 0.25;
                }
            };
            var bg_cityscape_1 = phaserSprites.addTilespriteFromAtlas({ name: 'bg_cityscape_1', group: 'ui_bg', x: container_2.x, y: container_2.y + 50, width: container_2.width, height: container_2.height, atlas: 'atlas', filename: 'bg_cityscape_1.png' });
            bg_cityscape_1.onUpdate = function () {
                if (phaserMaster.get('currentSelection') === 1) {
                    this.tilePosition.x -= 0.5;
                }
            };
            var bg_cityscape_2 = phaserSprites.addTilespriteFromAtlas({ name: 'bg_cityscape_2', group: 'ui_bg', x: container_2.x, y: container_2.y + 115, width: container_2.width, height: container_2.height, atlas: 'atlas', filename: 'bg_cityscape_2.png' });
            bg_cityscape_2.onUpdate = function () {
                if (phaserMaster.get('currentSelection') === 1) {
                    this.tilePosition.x -= 1;
                }
            };
            var bg_cityscape_3 = phaserSprites.addTilespriteFromAtlas({ name: 'bg_cityscape_3', group: 'ui_bg', x: container_2.x, y: container_2.y + 200, width: container_2.width, height: container_2.height, atlas: 'atlas', filename: 'bg_cityscape_3.png' });
            bg_cityscape_3.onUpdate = function () {
                if (phaserMaster.get('currentSelection') === 1) {
                    this.tilePosition.x -= 2;
                }
            };
            var bg_space = phaserSprites.addTilespriteFromAtlas({ name: 'bg_space', group: 'ui_bg', x: container_3.x, y: container_3.y, width: container_3.width, height: container_3.height, atlas: 'atlas', filename: 'bg_space.png' });
            bg_space.onUpdate = function () {
                if (phaserMaster.get('currentSelection') === 2) {
                    this.tilePosition.y += 2;
                }
                else {
                    this.tilePosition.y += 0.1;
                }
            };
            var pointer = phaserSprites.addFromAtlas({ name: 'pointer', group: 'ui', atlas: 'atlas', filename: 'ui_pointer.png' });
            pointer.anchor.setTo(0.5, 0.5);
            pointer.hide = function () {
                this.visible = false;
            };
            pointer.show = function () {
                this.visible = true;
            };
            pointer.updateLocation = function (val) {
                phaserMaster.forceLet('currentSelection', val);
                var _a = phaserSprites.get("textbox" + val), x = _a.x, y = _a.y;
                this.x = x - 90;
                this.y = y;
            };
            var downarrow = phaserSprites.addFromAtlas({ name: 'downarrow', group: 'ui', atlas: 'atlas', filename: 'ui_downarrow.png', visible: false });
            downarrow.anchor.setTo(0.5, 0.5);
            downarrow.hide = function () {
                this.visible = false;
            };
            downarrow.show = function () {
                this.visible = true;
            };
            downarrow.updateLocation = function (x, y) {
                this.x = x;
                this.y = y;
            };
            var textbox0 = phaserSprites.addFromAtlas({ name: 'textbox0', group: 'ui_textholders', atlas: 'atlas', filename: 'ui_textbox.png', alpha: 1 });
            textbox0.anchor.setTo(0.5, 0.5);
            phaserSprites.centerOnPoint('textbox0', container_1.width / 2 + textbox0.width / 2, container_1.y + 40);
            var text0 = phaserTexts.add({ name: 'text0', group: 'ui_text', x: textbox0.x, y: textbox0.y, font: 'gem', size: 12, default: "SELECT PILOT" });
            text0.anchor.setTo(0.5, 0.5);
            var textbox1 = phaserSprites.addFromAtlas({ name: 'textbox1', group: 'ui_textholders', atlas: 'atlas', filename: 'ui_textbox.png', alpha: 1 });
            textbox1.anchor.setTo(0.5, 0.5);
            phaserSprites.centerOnPoint('textbox1', container_2.width / 2 + textbox1.width / 2, container_2.y + 50);
            var text1 = phaserTexts.add({ name: 'text1', group: 'ui_text', x: textbox1.x, y: textbox1.y, font: 'gem', size: 12, default: "LOADOUT" });
            text1.anchor.setTo(0.5, 0.5);
            var textbox2 = phaserSprites.addFromAtlas({ name: 'textbox2', group: 'ui_textholders', atlas: 'atlas', filename: 'ui_textbox.png', alpha: 1 });
            textbox2.anchor.setTo(0.5, 0.5);
            phaserSprites.centerOnPoint('textbox2', container_3.x + container_3.width / 2 + textbox2.width / 2, container_3.y + 40);
            var text2 = phaserTexts.add({ name: 'text2', group: 'ui_text', x: textbox2.x, y: textbox2.y, font: 'gem', size: 12, default: "START" });
            text2.anchor.setTo(0.5, 0.5);
            var pilotDescriptionBox = phaserSprites.addFromAtlas({ name: 'pilotDescriptionBox', group: 'ui_textholders', atlas: 'atlas', filename: 'ui_descriptionbox.png', alpha: 1 });
            pilotDescriptionBox.anchor.setTo(0.5, 0.5);
            phaserSprites.centerOnPoint('pilotDescriptionBox', container_1.width / 2 + pilotDescriptionBox.width / 2, container_1.y + 295);
            var padding = 20;
            var pilotDescriptionText = phaserTexts.add({ name: 'pilotDescriptionText', group: 'ui_text', x: pilotDescriptionBox.x - pilotDescriptionBox.width / 2 + padding, y: pilotDescriptionBox.y - pilotDescriptionBox.height / 2, font: 'gem', size: 14, default: "" });
            pilotDescriptionText.maxWidth = pilotDescriptionBox.width - padding * 2;
            pilotDescriptionText.updateThisText = function (val) {
                this.setText("\nNAME:               " + profilePictures[val].name + "\n\nFIRING RATE:        " + profilePictures[val].firerate + "\nSUBWEAPON RECHARGE: " + profilePictures[val].subweaponRecharge + "\nHEALTH:             " + profilePictures[val].health + "\nMOVEMENT:           " + profilePictures[val].movement + "\n              ");
            };
            phaserGroup.addMany(17, [textbox0, textbox1, textbox2, pilotDescriptionBox]);
            phaserGroup.addMany(18, [text0, text1, text2, pilotDescriptionText]);
            var profilePictures = pilotData.pilots;
            for (var i_1 = 0; i_1 < profilePictures.length; i_1++) {
                var profile = phaserSprites.addFromAtlas({ name: "profile" + i_1, group: 'ui_profiles', y: container_1.y + 110, atlas: 'atlas', filename: "" + profilePictures[i_1].image, alpha: 0 });
                profile.anchor.setTo(0.5, 0.5);
                var gap = profile.width / 2 * (profilePictures.length - 1);
                profile.x = (container_1.x + (i_1 * profile.width) + container_1.width / 2) - gap;
                profile.alpha = 1;
                phaserGroup.add(18, profile);
            }
            var profileSelector = phaserSprites.addFromAtlas({ name: "profileSelector", group: 'ui_profiles', atlas: 'atlas', filename: 'ui_pictureframe.png', alpha: 0 });
            profileSelector.anchor.setTo(0.5, 0.5);
            profileSelector.updateLocation = function (val) {
                phaserMaster.forceLet('pilotSelection', val);
                phaserSprites.getGroup('ui_profiles').map(function (obj) {
                    obj.alpha = 0.85;
                });
                var profile = phaserSprites.get("profile" + val);
                profile.alpha = 1;
                var x = profile.x, y = profile.y;
                this.x = x;
                this.y = y;
                downarrow.updateLocation(x, y - profile.height / 2 - 8);
            };
            profileSelector.inc = function () {
                pilotSelection += 1;
                if (pilotSelection > profilePictures.length - 1) {
                    pilotSelection = 0;
                }
                updateProfileSelection(pilotSelection);
            };
            profileSelector.dec = function () {
                pilotSelection -= 1;
                if (pilotSelection < 0) {
                    pilotSelection = profilePictures.length - 1;
                }
                updateProfileSelection(pilotSelection);
            };
            phaserGroup.add(18, profileSelector);
            var i;
            var primaryWeaponList = [];
            var secondaryWeaponList = [];
            var perkList = [];
            i = 0;
            for (var _i = 0, _a = Object.keys(weaponData.primaryWeapons); _i < _a.length; _i++) {
                var key = _a[_i];
                var boxPadding = 5;
                var item = weaponData.primaryWeapons[key];
                var box = phaserSprites.addFromAtlas({ name: "box_pw_" + i, group: 'ui_loadout', y: container_2.y + 90, atlas: 'atlas', filename: "ui_box_unselected.png", alpha: 0 });
                box.anchor.setTo(0.5, 0.5);
                var gap = (box.width + boxPadding) / 2 * (returnSizeOfObject(weaponData.primaryWeapons) - 1);
                box.x = (container_2.x + (i * box.width) + container_2.width / 2) - gap + (i * boxPadding);
                box.alpha = 1;
                var sbox = phaserSprites.addFromAtlas({ name: "sbox_pw_" + i, group: 'ui_box_selected', y: container_2.y + 90, atlas: 'atlas', filename: "ui_box_selected.png", alpha: 0 });
                sbox.anchor.setTo(0.5, 0.5);
                sbox.x = (container_2.x + (i * sbox.width) + container_2.width / 2) - gap + (i * boxPadding);
                sbox.alpha = 0;
                var icon = phaserSprites.addFromAtlas({ name: "icon_pw_" + i, group: 'ui_loadout', y: container_2.y + 90, atlas: 'atlas_weapons', filename: "" + item.spriteIcon, alpha: 1 });
                icon.anchor.setTo(0.5, 0.5);
                icon.x = (container_2.x + (i * sbox.width) + container_2.width / 2) - gap + (i * boxPadding);
                primaryWeaponList.push(item);
                i++;
                phaserGroup.addMany(18, [box, sbox]);
                phaserGroup.add(18, icon);
            }
            i = 0;
            for (var _b = 0, _c = Object.keys(weaponData.secondaryWeapons); _b < _c.length; _b++) {
                var key = _c[_b];
                var boxPadding = 5;
                var item = weaponData.secondaryWeapons[key];
                var box = phaserSprites.addFromAtlas({ name: "box_sw_" + i, group: 'ui_loadout', y: container_2.y + 140, atlas: 'atlas', filename: "ui_box_unselected.png", alpha: 0 });
                box.anchor.setTo(0.5, 0.5);
                var gap = (box.width + boxPadding) / 2 * (returnSizeOfObject(weaponData.secondaryWeapons) - 1);
                box.x = (container_2.x + (i * box.width) + container_2.width / 2) - gap + (i * boxPadding);
                box.alpha = 1;
                var sbox = phaserSprites.addFromAtlas({ name: "sbox_sw_" + i, group: 'ui_box_selected', y: container_2.y + 140, atlas: 'atlas', filename: "ui_box_selected.png", alpha: 0 });
                sbox.anchor.setTo(0.5, 0.5);
                sbox.x = (container_2.x + (i * sbox.width) + container_2.width / 2) - gap + (i * boxPadding);
                sbox.alpha = 0;
                var icon = phaserSprites.addFromAtlas({ name: "icon_sw_" + i, group: 'ui_loadout', y: container_2.y + 140, atlas: 'atlas_weapons', filename: "" + item.spriteIcon, alpha: 1 });
                icon.anchor.setTo(0.5, 0.5);
                icon.x = (container_2.x + (i * sbox.width) + container_2.width / 2) - gap + (i * boxPadding);
                secondaryWeaponList.push(item);
                i++;
                phaserGroup.addMany(18, [box, sbox]);
                phaserGroup.add(18, icon);
            }
            i = 0;
            for (var _d = 0, _e = Object.keys(weaponData.perks); _d < _e.length; _d++) {
                var key = _e[_d];
                var boxPadding = 5;
                var item = weaponData.perks[key];
                var box = phaserSprites.addFromAtlas({ name: "box_sp_" + i, group: 'ui_loadout', y: container_2.y + 190, atlas: 'atlas', filename: "ui_box_unselected.png", alpha: 0 });
                box.anchor.setTo(0.5, 0.5);
                var gap = (box.width + boxPadding) / 2 * (returnSizeOfObject(weaponData.perks) - 1);
                box.x = (container_2.x + (i * box.width) + container_2.width / 2) - gap + (i * boxPadding);
                box.alpha = 1;
                var sbox = phaserSprites.addFromAtlas({ name: "sbox_sp_" + i, group: 'ui_box_selected', y: container_2.y + 190, atlas: 'atlas', filename: "ui_box_selected.png", alpha: 0 });
                sbox.anchor.setTo(0.5, 0.5);
                sbox.x = (container_2.x + (i * sbox.width) + container_2.width / 2) - gap + (i * boxPadding);
                sbox.alpha = 0;
                var icon = phaserSprites.addFromAtlas({ name: "icon_sp_" + i, group: 'ui_loadout', y: container_2.y + 190, atlas: 'atlas_weapons', filename: "" + item.spriteIcon, alpha: 1 });
                icon.anchor.setTo(0.5, 0.5);
                icon.x = (container_2.x + (i * sbox.width) + container_2.width / 2) - gap + (i * boxPadding);
                perkList.push(item);
                i++;
                phaserGroup.addMany(17, [box, sbox]);
                phaserGroup.add(18, icon);
            }
            phaserMaster.let('primaryWeaponList', primaryWeaponList);
            phaserMaster.let('secondaryWeaponList', secondaryWeaponList);
            phaserMaster.let('perkList', perkList);
            var loadoutCatagorySelector = phaserSprites.addFromAtlas({ name: "loadoutCatagorySelector", group: 'ui_loadout', atlas: 'atlas', filename: 'ui_pointer.png', visible: false, alpha: 0 });
            loadoutCatagorySelector.anchor.setTo(0.5, 0.5);
            loadoutCatagorySelector.show = function () {
                this.visible = true;
            };
            loadoutCatagorySelector.hide = function () {
                this.visible = false;
            };
            loadoutCatagorySelector.updateLocation = function (val) {
                var _a = phaserMaster.getAll(), primaryWeaponSelection = _a.primaryWeaponSelection, subWeaponSelection = _a.subWeaponSelection, perkSelection = _a.perkSelection;
                var box;
                if (val === 0) {
                    box = phaserSprites.get("box_pw_" + primaryWeaponSelection);
                    var x_1 = box.x, y_1 = box.y;
                    downarrow.updateLocation(x_1, y_1 - 30);
                }
                if (val === 1) {
                    box = phaserSprites.get("box_sw_" + subWeaponSelection);
                    var x_2 = box.x, y_2 = box.y;
                    downarrow.updateLocation(x_2, y_2 - 30);
                }
                if (val === 2) {
                    box = phaserSprites.get("box_sp_" + perkSelection);
                    var x_3 = box.x, y_3 = box.y;
                    downarrow.updateLocation(x_3, y_3 - 30);
                }
                var x = box.x, y = box.y;
                this.x = 40;
                this.y = y;
                this.visible;
            };
            var loadoutDescription = phaserSprites.addFromAtlas({ name: 'loadoutDescription', group: 'ui_textholders', atlas: 'atlas', filename: 'ui_descriptionbox_small.png', visible: false });
            loadoutDescription.anchor.setTo(0.5, 0.5);
            phaserSprites.centerOnPoint('loadoutDescription', container_2.width / 2 + loadoutDescription.width / 2, container_2.y + 310);
            var loadoutDescriptionText = phaserTexts.add({ name: 'loadoutDescriptionText', group: 'ui_text', x: loadoutDescription.x, y: loadoutDescription.y, font: 'gem', size: 14, default: "" });
            loadoutDescriptionText.anchor.setTo(0.5, 0.5);
            loadoutDescriptionText.maxWidth = loadoutDescription.width - padding * 2;
            phaserGroup.add(17, loadoutDescription);
            phaserGroup.add(18, loadoutDescriptionText);
            phaserGroup.addMany(1, [bg_space]);
            phaserGroup.addMany(6, [bg_clouds, bg_cityscape, bg_cityscape_1, bg_cityscape_2, bg_cityscape_3]);
            phaserGroup.addMany(10, [verticleFrame, dividerFrame1]);
            phaserGroup.addMany(15, [pointer, downarrow]);
        }
        function preloadComplete() {
            var game = phaserMaster.game();
            var pointer = phaserSprites.getAll('OBJECT').pointer;
            var currentSelection = phaserMaster.getAll().currentSelection;
            pointer.updateLocation(currentSelection);
            updateWeaponSelected();
            updateProfileSelection(0);
            overlayControls('WIPEOUT', function () {
                utilityManager.overlayBGControls({ transition: 'FADEOUT', delay: 0, speed: 250 }, function () {
                    phaserMaster.changeState('MAINMENU');
                });
            });
        }
        function overlayControls(transition, callback) {
            if (callback === void 0) { callback = function () { }; }
            utilityManager.overlayControls({ transition: transition, delay: 500, speed: 500, tileDelay: 15 }, callback);
        }
        function fireBullet() {
            var game = phaserMaster.game();
            var ship = phaserSprites.getOnly(['ship']).ship;
            var _a = { gap: 10, shots: 2 }, gap = _a.gap, shots = _a.shots;
            var centerShots = (gap * (shots - 1)) / 2;
            var _loop_1 = function (i) {
                setTimeout(function () {
                    weaponManager.createBullet({ name: "bullet_" + game.rnd.integer(), group: 'ship_wpn_preview', x: ship.x + (i * gap) - centerShots, y: ship.y, spread: 0, layer: 3 });
                }, 25);
            };
            for (var i = 0; i < shots; i++) {
                _loop_1(i);
            }
        }
        function fireLasers() {
            var game = phaserMaster.game();
            var ship = phaserSprites.getOnly(['ship']).ship;
            var _a = { gap: 30, shots: 1 }, gap = _a.gap, shots = _a.shots;
            var centerShots = (gap * (shots - 1)) / 2;
            for (var i = 0; i < shots; i++) {
                weaponManager.createLaser({ name: "laser_" + game.rnd.integer(), group: 'ship_wpn_preview', x: ship.x + (i * gap) - centerShots, y: ship.y - ship.height / 2, spread: 0, layer: 2 });
            }
        }
        function fireMissles() {
            var game = phaserMaster.game();
            var ship = phaserSprites.getOnly(['ship']).ship;
            var _a = { gap: 30, shots: 2 }, gap = _a.gap, shots = _a.shots;
            var centerShots = (gap * (shots - 1)) / 2;
            for (var i = 0; i < shots; i++) {
                weaponManager.createMissle({ name: "missle_" + game.rnd.integer(), group: 'ship_wpn_preview', x: ship.x + (i * gap) - centerShots, y: ship.y - ship.height / 2, spread: (i % 2 === 0 ? -0.50 : 0.50), layer: 2 });
            }
        }
        function createClusterbomb() {
            var game = phaserMaster.game();
            var ship = phaserSprites.getOnly(['ship']).ship;
            var onDestroy = function (obj) {
                for (var i = 0; i < obj.bomblets; i++) {
                    createBomblet({
                        x: obj.x,
                        y: obj.y,
                        ix: game.rnd.integerInRange(-400, 400),
                        iy: game.rnd.integerInRange(-400, 100),
                        damage: obj.damageAmount / 4,
                        group: 'ship_wpn_preview',
                        layer: 2
                    });
                }
            };
            weaponManager.createClusterbomb({ name: "clusterbomb_" + game.rnd.integer(), group: 'ship_wpn_preview', x: ship.x, y: ship.y, layer: 2 }, onDestroy);
        }
        function createBomblet(options) {
            var onDestroy = function (obj) { createExplosion(obj.x, obj.y, 0.5, options.layer + 1); };
            var bomblet = weaponManager.createBomblet(options, onDestroy);
        }
        function createExplosion(x, y, scale, layer) {
            weaponManager.createExplosion(x, y, scale, layer);
        }
        function createTriplebomb() {
            var game = phaserMaster.game();
            var ship = phaserSprites.getOnly(['ship']).ship;
            for (var i = 0; i < 3; i++) {
                setTimeout(function () {
                    weaponManager.createTriplebomb({ name: "triplebomb_" + game.rnd.integer(), group: 'ship_wpn_preview', x: ship.x, y: ship.y, layer: 2 });
                }, i * 300);
            }
        }
        function createTurret() {
            var game = phaserMaster.game();
            var ship = phaserSprites.getOnly(['ship']).ship;
            var onInit = function (obj) {
                var _a = { gap: 10, shots: 3 }, gap = _a.gap, shots = _a.shots;
                var centerShots = (gap * (shots - 1)) / 2;
                obj.fireInterval = setInterval(function () {
                    for (var i = 0; i < shots; i++) {
                        weaponManager.createBullet({ name: "bullet_" + game.rnd.integer(), group: 'ship_wpn_preview', x: obj.x + (i * gap) - centerShots, y: obj.y, spread: 0, layer: 2 });
                    }
                }, 200);
                obj.fireInterval;
            };
            var onUpdate = function (obj) {
                obj.x = ship.x - obj.offset;
                obj.y = ship.y;
            };
            var onDestroy = function (obj) { };
            weaponManager.createTurret({ name: "turret_" + game.rnd.integer(), group: 'ship_wpn_preview', x: ship.x, y: ship.y, offset: 50, layer: 3 }, onInit, onDestroy, onUpdate);
            weaponManager.createTurret({ name: "turret_" + game.rnd.integer(), group: 'ship_wpn_preview', x: ship.x, y: ship.y, offset: -50, layer: 3 }, onInit, onDestroy, onUpdate);
        }
        function playLoadoutPreview(type) {
            var game = phaserMaster.game();
            var _a = phaserMaster.getAll(), primaryWeaponList = _a.primaryWeaponList, primaryWeaponSelection = _a.primaryWeaponSelection, loadoutSelection = _a.loadoutSelection, secondaryWeaponList = _a.secondaryWeaponList, subWeaponSelection = _a.subWeaponSelection, perkSelection = _a.perkSelection;
            var ship = phaserSprites.getAll('OBJECT').ship;
            if (type === 'PRIMARY') {
                switch (primaryWeaponList[primaryWeaponSelection].reference) {
                    case 'BULLET':
                        fireBullet();
                        break;
                    case 'LASER':
                        fireLasers();
                        break;
                    case 'MISSLE':
                        fireMissles();
                        break;
                }
            }
            if (type === 'SECONDARY') {
                switch (secondaryWeaponList[subWeaponSelection].reference) {
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
        function updateWeaponSelected() {
            var _a = phaserMaster.getAll(), primaryWeaponSelection = _a.primaryWeaponSelection, subWeaponSelection = _a.subWeaponSelection, perkSelection = _a.perkSelection;
            phaserSprites.getGroup('ui_box_selected').map(function (obj) {
                obj.alpha = 0;
            });
            phaserSprites.get("sbox_pw_" + primaryWeaponSelection).alpha = 1;
            phaserSprites.get("sbox_sw_" + subWeaponSelection).alpha = 1;
            phaserSprites.get("sbox_sp_" + perkSelection).alpha = 1;
        }
        function updateProfileSelection(val) {
            var _a = phaserSprites.getOnly(['profileSelector', 'loadoutCatagorySelector', 'container_3']), profileSelector = _a.profileSelector, loadoutCatagorySelector = _a.loadoutCatagorySelector, container_3 = _a.container_3;
            var pilotDescriptionText = phaserTexts.getOnly(['pilotDescriptionText']).pilotDescriptionText;
            if (phaserSprites.get('ship') !== undefined) {
                playerManager.destroyShip('ship');
            }
            var ship;
            switch (val) {
                case 0:
                    ship = playerManager.createShip1({ name: 'ship', group: 'playership', layer: 5 });
                    break;
                case 1:
                    ship = playerManager.createShip1({ name: 'ship', group: 'playership', layer: 5 });
                    break;
                case 2:
                    ship = playerManager.createShip1({ name: 'ship', group: 'playership', layer: 5 });
                    break;
            }
            ship.visible = true;
            phaserSprites.centerOnPoint('ship', container_3.x + container_3.width / 2 + ship.width / 2, container_3.height - 100);
            profileSelector.updateLocation(val);
            pilotDescriptionText.updateThisText(val);
        }
        function updateLoadoutCatagory(val) {
            var loadoutSelection = phaserMaster.getAll().loadoutSelection;
            var _a = phaserSprites.getAll('OBJECT'), downarrow = _a.downarrow, loadoutCatagorySelector = _a.loadoutCatagorySelector;
            loadoutSelection += val;
            if (val > 0) {
                if (loadoutSelection > 2) {
                    loadoutSelection = 2;
                }
            }
            if (val < 0) {
                if (loadoutSelection < 0) {
                    loadoutSelection = 0;
                }
            }
            phaserMaster.forceLet('loadoutSelection', loadoutSelection);
            loadoutItemSelector(null);
            loadoutCatagorySelector.updateLocation(loadoutSelection);
        }
        function loadoutItemSelector(val) {
            var _a = phaserMaster.getAll(), weaponData = _a.weaponData, loadoutSelection = _a.loadoutSelection, primaryWeaponSelection = _a.primaryWeaponSelection, subWeaponSelection = _a.subWeaponSelection, perkSelection = _a.perkSelection, primaryWeaponList = _a.primaryWeaponList, secondaryWeaponList = _a.secondaryWeaponList, perkList = _a.perkList;
            var _b = phaserSprites.getAll('OBJECT'), downarrow = _b.downarrow, loadoutCatagorySelector = _b.loadoutCatagorySelector;
            var loadoutDescriptionText = phaserTexts.getAll('OBJECT').loadoutDescriptionText;
            if (loadoutSelection === 0) {
                primaryWeaponSelection += val;
                if (val > 0) {
                    if (primaryWeaponSelection >= returnSizeOfObject(weaponData.primaryWeapons)) {
                        primaryWeaponSelection = 0;
                    }
                    phaserMaster.forceLet('primaryWeaponSelection', primaryWeaponSelection);
                }
                if (val < 0) {
                    if (primaryWeaponSelection < 0) {
                        primaryWeaponSelection = returnSizeOfObject(weaponData.primaryWeapons) - 1;
                    }
                    phaserMaster.forceLet('primaryWeaponSelection', primaryWeaponSelection);
                }
                loadoutDescriptionText.setText(primaryWeaponList[primaryWeaponSelection].name + ": " + primaryWeaponList[primaryWeaponSelection].description);
            }
            if (loadoutSelection === 1) {
                subWeaponSelection += val;
                if (val > 0) {
                    if (subWeaponSelection >= returnSizeOfObject(weaponData.secondaryWeapons)) {
                        subWeaponSelection = 0;
                    }
                    phaserMaster.forceLet('subWeaponSelection', subWeaponSelection);
                }
                if (val < 0) {
                    if (subWeaponSelection < 0) {
                        subWeaponSelection = returnSizeOfObject(weaponData.secondaryWeapons) - 1;
                    }
                    phaserMaster.forceLet('subWeaponSelection', subWeaponSelection);
                }
                loadoutDescriptionText.setText(secondaryWeaponList[subWeaponSelection].name + ": " + secondaryWeaponList[subWeaponSelection].description);
            }
            if (loadoutSelection === 2) {
                perkSelection += val;
                if (val > 0) {
                    if (perkSelection >= returnSizeOfObject(weaponData.perks)) {
                        perkSelection = 0;
                    }
                    phaserMaster.forceLet('perkSelection', perkSelection);
                }
                if (val < 0) {
                    if (perkSelection < 0) {
                        perkSelection = returnSizeOfObject(weaponData.perks) - 1;
                    }
                    phaserMaster.forceLet('perkSelection', perkSelection);
                }
                loadoutDescriptionText.setText(perkList[perkSelection].name + ": " + perkList[perkSelection].description);
            }
            var box;
            if (loadoutSelection === 0) {
                box = phaserSprites.get("box_pw_" + primaryWeaponSelection);
                var x = box.x, y = box.y;
                downarrow.updateLocation(x, y - 30);
            }
            if (loadoutSelection === 1) {
                box = phaserSprites.get("box_sw_" + subWeaponSelection);
                var x = box.x, y = box.y;
                downarrow.updateLocation(x, y - 30);
            }
            if (loadoutSelection === 2) {
                box = phaserSprites.get("box_sp_" + perkSelection);
                var x = box.x, y = box.y;
                downarrow.updateLocation(x, y - 30);
            }
            updateWeaponSelected();
            loadoutCatagorySelector.updateLocation(loadoutSelection);
        }
        function returnSizeOfObject(obj) {
            var size = 0;
            for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
                var key = _a[_i];
                size++;
            }
            return size;
        }
        function update() {
            var game = phaserMaster.game();
            var _a = phaserMaster.getAll(), currentSelection = _a.currentSelection, pilotSelection = _a.pilotSelection, loadoutSelection = _a.loadoutSelection, primaryWeaponList = _a.primaryWeaponList, primaryWeaponSelection = _a.primaryWeaponSelection, secondaryWeaponList = _a.secondaryWeaponList, subWeaponSelection = _a.subWeaponSelection;
            var _b = phaserSprites.getAll(), profileSelector = _b.profileSelector, loadoutCatagorySelector = _b.loadoutCatagorySelector, pointer = _b.pointer, downarrow = _b.downarrow, loadoutDescription = _b.loadoutDescription;
            var loadoutDescriptionText = phaserTexts.getAll('OBJECT').loadoutDescriptionText;
            phaserSprites.getManyGroups(['ui_bg', 'playership', 'ship_wpn_preview']).map(function (obj) {
                obj.onUpdate();
            });
            if (phaserControls.checkWithDelay({ isActive: true, key: 'BACK', delay: 250 })) {
                if (currentSelection === 2) {
                    pointer.updateLocation(0);
                }
            }
            if (phaserControls.checkWithDelay({ isActive: true, key: 'START', delay: 250 })) {
                if (currentSelection !== 2) {
                    phaserMaster.forceLet('loadoutSelection', 0);
                    pointer.show();
                    downarrow.hide();
                    loadoutDescription.hide();
                    loadoutDescriptionText.hide();
                    loadoutCatagorySelector.hide();
                    phaserMaster.changeState('MAINMENU');
                    pointer.updateLocation(2);
                }
                if (currentSelection === 2) {
                    pointer.hide();
                    phaserMaster.forceLet('currentSelection', null);
                    utilityManager.overlayBGControls({ transition: 'FADEIN', delay: 0, speed: 250 }, function () {
                        overlayControls('WIPEIN', function () {
                            startGame();
                        });
                    });
                }
            }
            if (phaserMaster.checkState('MAINMENU')) {
                if (phaserControls.checkWithDelay({ isActive: true, key: 'UP', delay: 250 })) {
                    if (currentSelection !== 2) {
                        pointer.updateLocation(0);
                    }
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'DOWN', delay: 250 })) {
                    if (currentSelection === 1) {
                        pointer.hide();
                        downarrow.show();
                        loadoutDescription.show();
                        loadoutDescriptionText.show();
                        loadoutCatagorySelector.show();
                        loadoutCatagorySelector.updateLocation(loadoutSelection);
                        loadoutItemSelector(loadoutSelection);
                        phaserMaster.changeState('LOADOUTSELECT');
                    }
                    if (currentSelection !== 2) {
                        pointer.updateLocation(1);
                    }
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'RIGHT', delay: 250 })) {
                    if (currentSelection === 0) {
                        profileSelector.inc();
                    }
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'LEFT', delay: 250 })) {
                    if (currentSelection === 0) {
                        profileSelector.dec();
                    }
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'A', delay: 250 })) {
                    if (currentSelection === 2) {
                        pointer.hide();
                        phaserMaster.forceLet('currentSelection', null);
                        overlayControls('FADEIN');
                    }
                }
            }
            if (phaserMaster.checkState('PILOTSELECT')) {
                if (phaserControls.checkWithDelay({ isActive: true, key: 'LEFT', delay: 250 })) {
                    profileSelector.dec();
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'RIGHT', delay: 250 })) {
                    profileSelector.inc();
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'A', delay: 250 })) {
                    downarrow.hide();
                    pointer.show();
                    phaserMaster.changeState('MAINMENU');
                }
            }
            if (phaserMaster.checkState('LOADOUTSELECT')) {
                if (phaserControls.checkWithDelay({ isActive: true, key: 'A', delay: primaryWeaponList[primaryWeaponSelection].cooldown })) {
                    playLoadoutPreview('PRIMARY');
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'B', delay: secondaryWeaponList[subWeaponSelection].cooldown })) {
                    playLoadoutPreview('SECONDARY');
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'DOWN', delay: 250 })) {
                    updateLoadoutCatagory(1);
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'UP', delay: 250 })) {
                    if (loadoutSelection === 0) {
                        phaserMaster.forceLet('loadoutSelection', 0);
                        pointer.show();
                        downarrow.hide();
                        loadoutDescription.hide();
                        loadoutDescriptionText.hide();
                        loadoutCatagorySelector.hide();
                        phaserMaster.changeState('MAINMENU');
                    }
                    else {
                        updateLoadoutCatagory(-1);
                    }
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'RIGHT', delay: 250 })) {
                    loadoutItemSelector(1);
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'LEFT', delay: 250 })) {
                    loadoutItemSelector(-1);
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'BACK', delay: 250 })) {
                    phaserMaster.forceLet('loadoutSelection', 0);
                    pointer.show();
                    downarrow.hide();
                    loadoutDescription.hide();
                    loadoutDescriptionText.hide();
                    loadoutCatagorySelector.hide();
                    phaserMaster.changeState('MAINMENU');
                }
            }
        }
        function startGame() {
            var game = phaserMaster.game();
            var _a = phaserMaster.getAll(), primaryWeaponList = _a.primaryWeaponList, primaryWeaponSelection = _a.primaryWeaponSelection, loadoutSelection = _a.loadoutSelection, secondaryWeaponList = _a.secondaryWeaponList, subWeaponSelection = _a.subWeaponSelection, perkList = _a.perkList, perkSelection = _a.perkSelection, pilotSelection = _a.pilotSelection;
            saveData('pilot', pilotSelection);
            saveData('primaryWeapon', primaryWeaponList[primaryWeaponSelection].reference);
            saveData('secondaryWeapon', secondaryWeaponList[subWeaponSelection].reference);
            saveData('perk', perkList[perkSelection].reference);
            updateStore();
            parent.startGame();
        }
        function end() {
            parent.test();
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
        var _loop_2 = function (btn) {
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
            _loop_2(btn);
        }
        var _loop_3 = function (btn) {
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
            _loop_3(btn);
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
        var _loop_4 = function (key) {
            names.map(function (name) {
                if (key === name) {
                    _return[key] = { id: _this.buttonMapId[key.toUpperCase()], active: _this.IO.state[key.toUpperCase()]().val > 0 ? true : false, duration: _this.IO.state[key.toUpperCase()]().val, state: _this.IO.state[key.toUpperCase()]().state, type: _this.IO.state[key.toUpperCase()]().type, disabled: _this.disabledButtons[key.toUpperCase()] };
                }
            });
        };
        for (var _i = 0, _a = this.buttonArray; _i < _a.length; _i++) {
            var key = _a[_i];
            _loop_4(key);
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
        var _loop_5 = function (i) {
            var _r = toArray.filter(function (obj) {
                return obj.key === names[i];
            });
            _r.map(function (obj) {
                _return[obj.key] = obj.data;
            });
        };
        for (var i = 0; i < names.length; i++) {
            _loop_5(i);
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
        var _loop_6 = function (key) {
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
            _loop_6(key);
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
        var _loop_7 = function (i) {
            var _r = this_4.sprites.array.filter(function (obj) {
                return obj.group === names[i];
            });
            _return = _return.concat(_r);
        };
        var this_4 = this;
        for (var i = 0; i < names.length; i++) {
            _loop_7(i);
        }
        return _return;
    };
    PHASER_SPRITE_MANAGER.prototype.getOnly = function (names) {
        var _return = {};
        var _loop_8 = function (i) {
            var _r = this_5.sprites.array.filter(function (obj) {
                return obj.group === names[i] || obj.name === names[i];
            });
            _r.map(function (obj) {
                _return[obj.name] = obj;
            });
        };
        var this_5 = this;
        for (var i = 0; i < names.length; i++) {
            _loop_8(i);
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
        var _loop_9 = function (i) {
            var _r = this_6.texts.array.filter(function (obj) {
                return obj.group === names[i];
            });
            _return = _return.concat(_r);
        };
        var this_6 = this;
        for (var i = 0; i < names.length; i++) {
            _loop_9(i);
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
        var _loop_10 = function (i) {
            var _r = this_7.texts.array.filter(function (obj) {
                return obj.group === names[i] || obj.name === names[i];
            });
            _r.map(function (obj) {
                _return[obj.name] = obj;
            });
        };
        var this_7 = this;
        for (var i = 0; i < names.length; i++) {
            _loop_10(i);
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
    function ENEMY_MANAGER() {
    }
    ENEMY_MANAGER.prototype.assign = function (game, phaserMaster, phaserSprites, phaserTexts, phaserGroup, weaponManager, atlas) {
        this.game = game;
        this.phaserSprites = phaserSprites;
        this.phaserMaster = phaserMaster;
        this.phaserTexts = phaserTexts;
        this.phaserGroup = phaserGroup;
        this.weaponManager = weaponManager;
        this.atlas = atlas;
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
        enemy.destroyIt = function (spawnMore) {
            if (spawnMore === void 0) { spawnMore = true; }
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
        enemy.damageIt = function (val) {
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
    PLAYER_MANAGER.prototype.assign = function (game, phaserMaster, phaserSprites, phaserTexts, phaserGroup, phaserControls, weaponManager, atlas) {
        this.game = game;
        this.phaserSprites = phaserSprites;
        this.phaserMaster = phaserMaster;
        this.phaserTexts = phaserTexts;
        this.phaserGroup = phaserGroup;
        this.phaserControls = phaserControls;
        this.weaponManager = weaponManager;
        this.atlas = atlas;
    };
    PLAYER_MANAGER.prototype.createShip1 = function (params, updateHealth, loseLife, onUpdate) {
        var _this = this;
        if (updateHealth === void 0) { updateHealth = function () { }; }
        if (loseLife === void 0) { loseLife = function () { }; }
        if (onUpdate === void 0) { onUpdate = function () { }; }
        var game = this.game;
        var player = this.phaserSprites.addFromAtlas({ name: params.name, group: params.group, atlas: this.atlas, filename: 'ship_body.png', visible: false });
        player.anchor.setTo(0.5, 0.5);
        player.scale.setTo(1, 1);
        player.isInvincible = false;
        player.isDead = false;
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
        player.syncExhaust = function () {
            var player = _this.phaserSprites.get(params.name);
            var exhaust = _this.phaserSprites.get(params.name + "_exhaust");
            if (exhaust !== undefined && player !== undefined) {
                exhaust.updateCords(player.x, player.y);
            }
        };
        player.moveX = function (val) {
            player.x += val;
            player.syncExhaust();
            player.checkLimits();
        };
        player.moveY = function (val) {
            player.y += val;
            player.syncExhaust();
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
        return player;
    };
    PLAYER_MANAGER.prototype.createShipExhaust = function (player, params) {
        var _this = this;
        var shipExhaust = this.phaserSprites.addFromAtlas({ name: params.name + "_exhaust", group: params.group, atlas: this.atlas, filename: 'exhaust_red_1.png', visible: false });
        shipExhaust.animations.add('exhaust_animation', Phaser.Animation.generateFrameNames('exhaust_red_', 1, 8, '.png'), 1, true);
        shipExhaust.animations.play('exhaust_animation', 30, true);
        this.phaserGroup.add(params.layer, shipExhaust);
        shipExhaust.anchor.setTo(0.5, 0.5);
        shipExhaust.onUpdate = function () {
            var currentState = _this.phaserMaster.getState().currentState;
            var x = player.x, width = player.width, height = player.height, y = player.y, visible = player.visible, isDead = player.isDead;
            shipExhaust.visible = (currentState !== 'ENDLEVEL') ? player.visible : false;
            shipExhaust.x = x;
            shipExhaust.y = y + player.exhaustPoints.center;
            shipExhaust.alpha = (currentState === 'ENDLEVEL') && player.isDead ? 0 : 1;
            shipExhaust.scale.setTo(1, 1);
        };
        shipExhaust.updateCords = function (x, y) {
            var starMomentum = _this.phaserMaster.getOnly(['starMomentum']).starMomentum;
            shipExhaust.x = x;
            if (starMomentum.y == 0) {
                shipExhaust.y = y + player.exhaustPoints.center;
                shipExhaust.scale.setTo(1, 1);
            }
            if (starMomentum.y > 0) {
                shipExhaust.y = y + player.exhaustPoints.bottom;
                shipExhaust.scale.setTo(1, 1.5);
            }
            if (starMomentum.y < 0) {
                shipExhaust.y = y + player.exhaustPoints.top;
                shipExhaust.scale.setTo(1, 0.25);
            }
        };
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
    UTILITY_MANAGER.prototype.buildOverlayGrid = function (squareSize, layer, image) {
        if (squareSize === void 0) { squareSize = 80; }
        var game = this.game;
        var count = 0;
        for (var c = 0; c < Math.ceil(game.world.height / squareSize) + 1; c++) {
            var _loop_11 = function (r) {
                var gridSquare = this_8.phaserSprites.addFromAtlas({ x: c * squareSize, y: r * squareSize, name: "grid" + count, group: 'um_grid__bg', width: squareSize, height: squareSize, atlas: this_8.atlas, filename: image, visible: true });
                gridSquare.anchor.setTo(0.5, 0.5);
                gridSquare.x = gridSquare.x += gridSquare.width / 2 - gridSquare.width / 2;
                gridSquare.y = gridSquare.y += gridSquare.height / 2 - gridSquare.height / 2;
                gridSquare.fadeOut = function (speed) {
                    gridSquare.scale.setTo(1, 1);
                    game.add.tween(gridSquare).to({ height: 0 }, speed, Phaser.Easing.Linear.Out, true, 0, 0, false);
                };
                gridSquare.scaleOut = function (speed) {
                    gridSquare.scale.setTo(1, 1);
                    game.add.tween(gridSquare.scale).to({ x: 0, y: 0 }, speed, Phaser.Easing.Linear.Out, true, 0, 0, false);
                };
                gridSquare.fadeIn = function (speed) {
                    gridSquare.height = squareSize;
                    gridSquare.width = squareSize;
                    game.add.tween(gridSquare).to({ height: squareSize }, speed, Phaser.Easing.Linear.In, true, 0, 0, false);
                };
                gridSquare.scaleIn = function (speed) {
                    gridSquare.height = squareSize;
                    gridSquare.width = squareSize;
                    game.add.tween(gridSquare.scale).to({ x: 1, y: 1 }, speed, Phaser.Easing.Linear.In, true, 0, 0, false);
                };
                count++;
                this_8.phaserGroup.add(20, gridSquare);
            };
            var this_8 = this;
            for (var r = 0; r < Math.ceil(game.world.width / squareSize + 1); r++) {
                _loop_11(r);
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
        ammo.accelerate = function () {
            if (ammo.body !== null) {
                ammo.body.velocity.y -= weapon.velocity;
                ammo.body.velocity.x += options.spread;
            }
        };
        ammo.destroyIt = function () {
            onDestroy(ammo);
            phaserSprites.destroy(ammo.name);
        };
        ammo.onUpdate = function () {
            this.accelerate();
            if (this.y < -this.height) {
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
        ammo.angle = -90;
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
        turret.anchor.setTo(0.5, 0.5);
        game.physics.enable(turret, Phaser.Physics.ARCADE);
        phaserGroup.add(2, turret);
        turret.offset = options.offset;
        setTimeout(function () {
            turret.destroyIt();
        }, weapon.lifespan);
        onInit(turret);
        turret.destroyIt = function () {
            onDestroy(turret);
            _this.createExplosion(turret.x, turret.y, 0.5, options.layer);
            clearInterval(turret.fireInterval);
            phaserSprites.destroy(turret.name);
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
        var explosion = phaserSprites.addFromAtlas({ name: "explosion_" + game.rnd.integer(), group: 'explosions', x: x, y: y, atlas: atlas, filename: "explosions_Layer_1.png" });
        explosion.scale.setTo(scale, scale);
        explosion.anchor.setTo(0.5, 0.5);
        explosion.animations.add('explosion', Phaser.Animation.generateFrameNames('explosions_Layer_', 1, 16, '.png'), 1, true);
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
    return WEAPON_MANAGER;
}());
