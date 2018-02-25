import Vue from 'vue'
import Vuex from 'vuex'
import weapons from './../phaser/saveTheWorld/resources/json/weaponData.json'

Vue.use(Vuex)

const primaryWeapon = weapons.primaryWeapons;
const secondaryWeapon = weapons.secondaryWeapons;


export default new Vuex.Store({
  state: {
    appReady: false,
    isActive: false,
    progressBar: 0,
    headerIsOpen: true,
    gameData: {
      score: 0,
      level: 1,
      primaryWeapon: primaryWeapon.LASER_1,
      secondaryWeapon: secondaryWeapon.CLUSTER_1,
      population: {
        total: 100,
        killed: 0
      }
    }
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
    }
  }
})
