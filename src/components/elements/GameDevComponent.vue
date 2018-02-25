<template lang="pug">
  .game-container
    #phaser-example
    p {{gameData.level}}
</template>

<script>


export default {
  name: 'gameComponent',
  props: [],
  data () {
    return {
      game: null,
      store: this.$store,
      gameData: this.$store.getters._gameData()
    }
  },
  mounted(){
    this.store.watch(this.store.getters._gameData, val => {

    })
    this.init()
  },
  methods: {
    init(){
      //this.loadGame('level1.js')
      this.loadGame('powerUpMenu.js')
    },
    loadGame(fileName){
      // remove old game first
      if(this.game !== null){
        this.game.destroy()
      }
      // load new one
      let js = document.createElement("script");
          js.type = "text/javascript";
          js.src = `src/phaser/saveTheWorld/${fileName}`;
          document.body.appendChild(js);
          js.onload = (() => {
            __phaser.init(this.$el, this, {width: 640, height: 640, store: this.$store});
          })
    },
    nextLevel(){
      this.gameData.level = (this.gameData.level+1);
      this.store.commit('setGamedata', this.gameData)
      this.loadGame(`level${this.gameData.level}.js`)
    },
    gameOver(){
      alert("GAME OVER")
    },
    loadFile(file, index){
      this.active = index;
      this.loadGame(file)
    }
  },
  destroyed() {
    this.game.destroy();
  }
}
</script>


<style lang="sass" scoped>
  .game-container
    padding: 20px
    background-color: #2f2f2f
  .small
    font-size: 12px
  .button
    margin-right: 5px
</style>
