<script>
import CircuitEditor from './components/CircuitEditor.vue';

export default {
  data() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,

      libraries: [],
    };
  },
  methods: {
    updateDimensions() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.$refs.editor.setDimensions(this.width, this.height);
    },
    loadLibrary(filename) {
      return fetch("/data/" + filename)
        .then(response => response.json())
        .then(data => {
          return data;
        })
        .catch(error => {
          console.error("Error loading " + filename + ": ", error);
          throw error;
        });
    },
    loadLibraries() {
      fetch("/data/libraries.json")
        .then(response => response.json())
        .then(data => {
          this.libraries = data;

          const libraryPromises = this.libraries.map(library =>
            this.loadLibrary(library.file).then(content => {
              library.content = content;
            })
          );

          Promise.all(libraryPromises).then(() => {
            this.librariesLoaded();
            this.$refs.editor.onLibrariesLoaded();
          });
        })
        .catch(error => {
          console.error('Error loading libraries.json: ', error);
        });
    },
    librariesLoaded() {
      console.log("Loaded Libraries :");
      this.libraries.forEach(lib => {
        console.log(" - " + lib.name);
        lib.content.forEach(comp => {
          console.log("    - " + comp.name);
        });
      });
    },
    getLibraryComponent(libraryId, componentName) {
      return this.libraries.filter(lib => {
        return lib.id == libraryId;
      })[0].content.filter(comp => {
        return comp.name === componentName;
      })[0];
    },
  },
  mounted() {
    window.addEventListener("resize", this.updateDimensions);

    this.$nextTick(() => {
      window.addEventListener('mousewheel', this.$refs.editor.handleMouseWheel);
    })

    this.loadLibraries();

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
