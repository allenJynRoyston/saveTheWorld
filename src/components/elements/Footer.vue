<template lang='pug'>
  div.footer
    .footer-text
      | Made with the awesome PhaserJS and ThreeJS &nbsp;&nbsp;
      a(href='mailto:allen.royston.uk@gmail.com') &nbsp;&nbsp; allen.royston.uk@gmail.com
</template>

<script>
  export default {
    name: 'page-footer'
  }
</script>

<style lang="sass" scoped>
  .footer
    width: 100%
    height: 90px
    background-color: black
    color: white
  .footer-text
    padding: 20px
</style>
