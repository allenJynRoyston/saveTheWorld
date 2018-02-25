// require vue and vue modules
import Vue from 'vue'
import Router from 'vue-router'
import VueResource from 'vue-resource'

// pages
import Home from './components/Home.vue'
import Game from './components/Game.vue'
import Gamedev from './components/GameDev.vue'


// elements
Vue.component('gamedev-component', require('./components/elements/GameDevComponent.vue'))
Vue.component('site-navigation', require('./components/elements/Navigation.vue'))
Vue.component('site-overlay', require('./components/elements/Overlay.vue'))
Vue.component('site-header', require('./components/elements/Header.vue'))
Vue.component('site-footer', require('./components/elements/Footer.vue'))



Vue.use(Router)
Vue.use(VueResource);

// set routes
export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/phaser',
      name: 'Phaser',
      component: Game
    }
  ]
})
