import Vue from 'vue'
import Vuex from 'vuex'
import weapons from './../phaser/saveTheWorld/resources/json/weaponData.json'

Vue.use(Vuex)

/*  LOAD LOCAL STORAGE AND CHECK IT AGAINST CHECKSUM */
const primaryWeapon = weapons.primaryWeapons;
const secondaryWeapon = weapons.secondaryWeapons;
let localData;

function getChecksumValue(val){
  let checksum = 0;
  for (let i = 0; i < val.length; i++) {
    checksum += val.charCodeAt(i);
  }
  return checksum;
}

function checkChecksum(_localchecksum){
  let _checksum = getChecksumValue(JSON.stringify(localData))
  return _checksum === _localchecksum
}

function createNewLocalData(){
  let localData = {
    gameData: {
      score: 0,
      level: 1,
      pilot: 0,
      primaryWeapon: 'BULLET',
      secondaryWeapon: 'CLUSTERBOMB',
      perk: 'FIREPOWER',
      population: {
        total: 100,
        killed: 0
      },
      player:{
        health: 100,
        lives: 3,
        powerup: 1,
        special: 3
      },
      snapshot: null
    }
  };
  localStorage.setItem('checksum', getChecksumValue(JSON.stringify(localData)) )
  localStorage.setItem('localData', JSON.stringify(localData));
  return localData;
}

try{
  localData = JSON.parse(localStorage.getItem('localData'));
  let _localchecksum = parseInt(localStorage.getItem('checksum'));
  if(localData === null || !checkChecksum(_localchecksum)){
    localData = createNewLocalData();
  }
}
catch(err){
  localData = createNewLocalData();
}

function saveToLocal(gameData){
  localData.gameData = gameData;
  localStorage.setItem('checksum', getChecksumValue(JSON.stringify(localData)) )
  localStorage.setItem('localData', JSON.stringify(localData));
}

/* STORE DATA */
export default new Vuex.Store({
  state: {
    appReady: false,
    isActive: false,
    progressBar: 0,
    headerIsOpen: true,
    gameData: localData.gameData
  },
  getters: {
    _appReady: state => () => state.appReady,
    _isActive: state => () => state.isActive,
    _progressBar: state => () => state.progressBar,
    _headerIsOpen: state => () => state.headerIsOpen,
    _gameData: state => () => state.gameData
  },
  mutations: {
    setAppState(state, value){
      state.appReady = value
    },
    overlay_on(state) {
      state.isActive = true;
    },
    overlay_off(state) {
      state.isActive = false;
    },
    setProgressBar(state, value){
      state.progressBar = value;
    },
    setHeader (state, value) {
      state.headerIsOpen = value
    },
    setGamedata (state, value) {
      state.gameData = value
      saveToLocal(state.gameData)
    }
  }
})
