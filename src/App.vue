<script>
import CircuitEditor from './components/CircuitEditor.vue';

export default {
  data() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  },
  methods: {
    updateDimensions() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.$refs.editor.setDimensions(this.width, this.height);
    }
  },
  mounted() {
    window.addEventListener("resize", this.updateDimensions);

    this.$nextTick(() => {
      window.addEventListener('mousewheel', this.$refs.editor.handleMouseWheel);
    })

    console.log("App Mounted");
  },
  components: {
    CircuitEditor
  }
}
</script>

<template>
  <CircuitEditor ref="editor" @mounted="this.updateDimensions"/>
</template>

<style scoped>

</style>
