var PhaserGameObject = (function () {
    function PhaserGameObject() {
        this.game = null;
        this.global = {
            pause: false
        };
    }
    PhaserGameObject.prototype.init = function (el, parent, options) {
        var phaserMaster = new PHASER_MASTER({ game: new Phaser.Game(options.width, options.height, Phaser.WEBGL, el, { preload: preload, create: create, update: update }), resolution: { width: options.width, height: options.height } }), phaserControls = new PHASER_CONTROLS(), phaserMouse = new PHASER_MOUSE({ showDebugger: false }), phaserSprites = new PHASER_SPRITE_MANAGER(), phaserBmd = new PHASER_BITMAPDATA_MANAGER(), phaserTexts = new PHASER_TEXT_MANAGER(), phaserButtons = new PHASER_BUTTON_MANAGER(), phaserGroup = new PHASER_GROUP_MANAGER(), phaserBitmapdata = new PHASER_BITMAPDATA_MANAGER();
        var store = options.store;
        phaserMaster.let('gameData', store.getters._gameData());
        function saveData(prop, value) {
            var gameData = phaserMaster.get('gameData');
            gameData[prop] = value;
            store.commit('setGamedata', gameData);
        }
        function preload() {
            var game = phaserMaster.game();
            game.load.enableParallel = true;
            game.stage.backgroundColor = '#10212c';
            var folder = 'src/phaser/saveTheWorld/resources';
            game.load.atlas('atlas', folder + "/spritesheets/heroSelect/textures.png", folder + "/spritesheets/heroSelect/textures.json", Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
            game.load.bitmapFont('gem', folder + "/fonts/gem.png", folder + "/fonts/gem.xml");
            game.load.json('weaponData', folder + "/json/weaponData.json");
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
            phaserGroup.assign(game, 15);
            phaserBitmapdata.assign(game);
            var currentSelection = phaserMaster.let('currentSelection', 0);
            var pilotSelection = phaserMaster.let('pilotSelection', 0);
            var loadoutSelection = phaserMaster.let('loadoutSelection', 0);
            var primaryWeaponSelection = phaserMaster.let('primaryWeaponSelection', 0);
            var subWeaponSelection = phaserMaster.let('subWeaponSelection', 0);
            var perkSelection = phaserMaster.let('perkSelection', 0);
            var weaponData = phaserMaster.let('weaponData', game.cache.getJSON('weaponData'));
            var profilePictures = [
                {
                    image: 'ui_mockphoto.png',
                    age: 36,
                    name: 'PILOT 1',
                    firerate: 'FAST',
                    subweaponRecharge: 'AVERAGE',
                    health: 'AVERAGE',
                    movement: 'AVERAGE',
                },
                {
                    image: 'ui_mockphoto.png',
                    age: 29,
                    name: 'PILOT 2',
                    description: 'LOREM IPSUM SOMETHING LOREM IPSUM SOMETHING LOREM IPSUM SOMETHING',
                    firerate: 'AVERAGE',
                    subweaponRecharge: 'FAST',
                    health: 'AVERAGE',
                    movement: 'AVERAGE',
                },
                {
                    image: 'ui_mockphoto.png',
                    age: 62,
                    name: 'PILOT 3',
                    description: 'LOREM IPSUM SOMETHING LOREM IPSUM SOMETHING LOREM IPSUM SOMETHING',
                    firerate: 'AVERAGE',
                    subweaponRecharge: 'FAST',
                    health: 'LOW',
                    movement: 'FAST',
                }
            ];
            var verticleFrame = phaserSprites.addFromAtlas({ x: 373, y: 0, height: game.world.height, name: "verticleFrame", group: 'ui_frame', filename: 'ui_frame_v.png', atlas: 'atlas' });
            var dividerFrame1 = phaserSprites.addFromAtlas({ x: 0, y: 315, width: verticleFrame.x, name: "dividerFrame1", group: 'ui_frame', filename: 'ui_frame_h.png', atlas: 'atlas' });
            var bmd = phaserBitmapdata.addGradient({ name: 'overlayFadeout', start: '#ffffff', end: '#ffffff', width: 1, height: 1, render: false });
            var container_1 = phaserSprites.add({ x: 0, y: 0, name: "container_1", width: 373, height: 315, reference: bmd.cacheBitmapData, visible: false });
            var container_2 = phaserSprites.add({ x: 0, y: 325, name: "container_2", width: 373, height: 315, reference: bmd.cacheBitmapData, visible: false });
            var container_3 = phaserSprites.add({ x: 375, y: 0, name: "container_3", width: 262, height: game.world.height, reference: bmd.cacheBitmapData, visible: false });
            var bg_clouds = phaserSprites.addTilespriteFromAtlas({ name: 'bg_clouds', group: 'ui_bg', x: container_1.x, y: container_1.y, width: container_1.width, height: container_1.height, atlas: 'atlas', filename: 'bg_clouds.png' });
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
                    this.tilePosition.y -= 1;
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
            phaserSprites.centerOnPoint('textbox1', container_2.width / 2 + textbox1.width / 2, container_2.y + 40);
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
            for (var i_1 = 0; i_1 < profilePictures.length; i_1++) {
                var profile = phaserSprites.addFromAtlas({ name: "profile" + i_1, group: 'ui_profiles', y: container_1.y + 110, atlas: 'atlas', filename: "" + profilePictures[i_1].image, alpha: 0 });
                profile.anchor.setTo(0.5, 0.5);
                var gap = profile.width / 2 * (profilePictures.length - 1);
                profile.x = (container_1.x + (i_1 * profile.width) + container_1.width / 2) - gap;
                profile.alpha = 1;
            }
            var profileSelector = phaserSprites.addFromAtlas({ name: "profileSelector", group: 'ui_profiles', atlas: 'atlas', filename: 'ui_pictureframe.png', alpha: 0 });
            profileSelector.anchor.setTo(0.5, 0.5);
            profileSelector.updateLocation = function (val) {
                phaserMaster.forceLet('pilotSelection', val);
                phaserSprites.getGroup('ui_profiles').forEach(function (obj) {
                    obj.alpha = 0.5;
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
            var i;
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
                i++;
            }
            i = 0;
            for (var _b = 0, _c = Object.keys(weaponData.secondaryWeapons); _b < _c.length; _b++) {
                var key = _c[_b];
                var boxPadding = 5;
                var item = weaponData.secondaryWeapons[key];
                var box = phaserSprites.addFromAtlas({ name: "box_sw_" + i, group: 'ui_loadout', y: container_2.y + 150, atlas: 'atlas', filename: "ui_box_unselected.png", alpha: 0 });
                box.anchor.setTo(0.5, 0.5);
                var gap = (box.width + boxPadding) / 2 * (returnSizeOfObject(weaponData.secondaryWeapons) - 1);
                box.x = (container_2.x + (i * box.width) + container_2.width / 2) - gap + (i * boxPadding);
                box.alpha = 1;
                i++;
            }
            i = 0;
            for (var _d = 0, _e = Object.keys(weaponData.perks); _d < _e.length; _d++) {
                var key = _e[_d];
                var boxPadding = 5;
                var item = weaponData.perks[key];
                var box = phaserSprites.addFromAtlas({ name: "box_sp_" + i, group: 'ui_loadout', y: container_2.y + 210, atlas: 'atlas', filename: "ui_box_unselected.png", alpha: 0 });
                box.anchor.setTo(0.5, 0.5);
                var gap = (box.width + boxPadding) / 2 * (returnSizeOfObject(weaponData.perks) - 1);
                box.x = (container_2.x + (i * box.width) + container_2.width / 2) - gap + (i * boxPadding);
                box.alpha = 1;
                i++;
            }
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
            var loadoutDescription = phaserSprites.addFromAtlas({ name: 'loadoutDescription', group: 'ui_textholders', atlas: 'atlas', filename: 'ui_descriptionbox_small.png', alpha: 1 });
            loadoutDescription.anchor.setTo(0.5, 0.5);
            phaserSprites.centerOnPoint('loadoutDescription', container_2.width / 2 + loadoutDescription.width / 2, container_2.y + 295);
            var loadoutDescriptionText = phaserTexts.add({ name: 'loadoutDescriptionText', group: 'ui_text', x: loadoutDescription.x, y: loadoutDescription.y, font: 'gem', size: 14, default: "" });
            loadoutDescriptionText.anchor.setTo(0.5, 0.5);
            loadoutDescriptionText.maxWidth = loadoutDescription.width - padding * 2;
            phaserGroup.addMany(1, [bg_clouds, bg_cityscape, bg_cityscape_1, bg_cityscape_2, bg_cityscape_3, bg_space]);
            phaserGroup.addMany(3, [verticleFrame, dividerFrame1]);
            phaserGroup.addMany(4, [textbox0, downarrow]);
        }
        function preloadComplete() {
            var game = phaserMaster.game();
            var pointer = phaserSprites.getAll('OBJECT').pointer;
            pointer.updateLocation(0);
            updateProfileSelection(0);
            phaserMaster.changeState('MAINMENU');
        }
        function updateProfileSelection(val) {
            var _a = phaserSprites.getAll('OBJECT'), profileSelector = _a.profileSelector, loadoutCatagorySelector = _a.loadoutCatagorySelector;
            var pilotDescriptionText = phaserTexts.getAll('OBJECT').pilotDescriptionText;
            profileSelector.updateLocation(val);
            pilotDescriptionText.updateThisText(val);
        }
        function updateLoadoutCatagory(val) {
            var loadoutSelection = phaserMaster.getAll().loadoutSelection;
            var _a = phaserSprites.getAll('OBJECT'), downarrow = _a.downarrow, loadoutCatagorySelector = _a.loadoutCatagorySelector;
            loadoutSelection += val;
            if (val > 0) {
                if (loadoutSelection > 2) {
                    loadoutSelection = 0;
                }
            }
            if (val < 0) {
                if (loadoutSelection < 0) {
                    loadoutSelection = 2;
                }
            }
            phaserMaster.forceLet('loadoutSelection', loadoutSelection);
            loadoutItemSelector(null);
            loadoutCatagorySelector.updateLocation(loadoutSelection);
        }
        function loadoutItemSelector(val) {
            var _a = phaserMaster.getAll(), weaponData = _a.weaponData, loadoutSelection = _a.loadoutSelection, primaryWeaponSelection = _a.primaryWeaponSelection, subWeaponSelection = _a.subWeaponSelection, perkSelection = _a.perkSelection;
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
                loadoutDescriptionText.setText("primaryWeaponSelection " + primaryWeaponSelection);
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
                loadoutDescriptionText.setText("subWeaponSelection " + subWeaponSelection);
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
                loadoutDescriptionText.setText("perkSelection " + perkSelection);
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
            var _a = phaserMaster.getAll(), currentSelection = _a.currentSelection, pilotSelection = _a.pilotSelection, loadoutSelection = _a.loadoutSelection;
            var _b = phaserSprites.getAll('OBJECT'), profileSelector = _b.profileSelector, loadoutCatagorySelector = _b.loadoutCatagorySelector, pointer = _b.pointer, downarrow = _b.downarrow;
            phaserSprites.getGroup('ui_bg').forEach(function (obj) {
                obj.onUpdate();
            });
            if (phaserControls.checkWithDelay({ isActive: true, key: 'BACK', delay: 250 })) {
                phaserMaster.forceLet('loadoutSelection', 0);
                downarrow.hide();
                pointer.show();
                loadoutCatagorySelector.hide();
                phaserMaster.changeState('MAINMENU');
            }
            if (phaserMaster.checkState('MAINMENU')) {
                if (phaserControls.checkWithDelay({ isActive: true, key: 'UP', delay: 250 })) {
                    if (currentSelection !== 2) {
                        pointer.updateLocation(0);
                    }
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'DOWN', delay: 250 })) {
                    if (currentSelection !== 2) {
                        pointer.updateLocation(1);
                    }
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'RIGHT', delay: 250 })) {
                    if (currentSelection === 0) {
                        pointer.updateLocation(2);
                    }
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'LEFT', delay: 250 })) {
                    if (currentSelection === 2) {
                        pointer.updateLocation(0);
                    }
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'A', delay: 250 })) {
                    var state = void 0;
                    if (currentSelection === 0) {
                        updateProfileSelection(pilotSelection);
                        downarrow.show();
                        pointer.hide();
                        state = 'PILOTSELECT';
                    }
                    if (currentSelection === 1) {
                        pointer.hide();
                        downarrow.show();
                        loadoutCatagorySelector.show();
                        loadoutCatagorySelector.updateLocation(loadoutSelection);
                        loadoutItemSelector(loadoutSelection);
                        state = 'LOADOUTSELECT';
                    }
                    if (currentSelection === 2) {
                        pointer.hide();
                        state = "STARTGAME";
                        phaserMaster.forceLet('currentSelection', null);
                        alert("start game");
                    }
                    phaserMaster.changeState(state);
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
                if (phaserControls.checkWithDelay({ isActive: true, key: 'DOWN', delay: 250 })) {
                    updateLoadoutCatagory(1);
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'UP', delay: 250 })) {
                    updateLoadoutCatagory(-1);
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'RIGHT', delay: 250 })) {
                    loadoutItemSelector(1);
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'LEFT', delay: 250 })) {
                    loadoutItemSelector(-1);
                }
                if (phaserControls.checkWithDelay({ isActive: true, key: 'A', delay: 250 })) {
                    phaserMaster.forceLet('loadoutSelection', 0);
                    pointer.show();
                    downarrow.hide();
                    loadoutCatagorySelector.hide();
                    phaserMaster.changeState('MAINMENU');
                }
            }
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
        var _loop_1 = function (btn) {
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
            _loop_1(btn);
        }
        var _loop_2 = function (btn) {
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
            _loop_2(btn);
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
        var _loop_3 = function (key) {
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
            _loop_3(key);
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
            newSprite.hide = function () { };
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
            newSprite.hide = function () { };
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
            newSprite.hide = function () { };
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
            newSprite.hide = function () { };
            this.sprites.array.push(newSprite);
            this.sprites.object[params.name] = newSprite;
            return newSprite;
        }
        else {
            console.log("Duplicate key name not allowed: " + params.name);
        }
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
    PHASER_SPRITE_MANAGER.prototype.getAll = function (type) {
        if (type === void 0) { type = 'BOTH'; }
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
    PHASER_TEXT_MANAGER.prototype.getAll = function (type) {
        if (type === void 0) { type = 'BOTH'; }
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
