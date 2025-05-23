<script>
import CircuitEditor from './components/CircuitEditor.vue';
import LibraryWindow from './components/LibraryWindow.vue';
import Popup from './components/Popup.vue';

let CURRENT_POPUP_ID = 0;

export default {
  data() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,

      libraries: [],

      popups: [],
    };
  },
  methods: {
    updateDimensions() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.$refs.editor.setDimensions(this.width, this.height);
      this.$refs.library.setDimensions(Math.min(this.width * 0.25, 250), this.height);
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

          this.libraries.forEach(lib => {
            lib.hide = true;
          });

          this.libraries.forEach(library => {library.content = []});
          this.libraries[0].hide = false; // Project library tab defaults to open

          const libraryPromises = this.libraries.filter(library => {return library.type === "native"}).map(library =>
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
    selectLibraryComponent(libraryId, componentName) {
      this.$refs.editor.setTemporaryComponent(libraryId, componentName);
    },
    addProjectComponent(component) {
      this.libraries[0].content.push(component);
    },
    addPopup(popupData) {
      popupData.id = CURRENT_POPUP_ID;
      CURRENT_POPUP_ID += 1;
      this.popups.push(popupData);
    },
    closePopup(popupId) {
      this.popups = this.popups.filter(popup => {return popup.id != popupId});
    },
    closePopupsByTitle(title) {
      this.popups = this.popups.filter(popup => {return popup.title !== title});
    }
  },
  mounted() {
    window.addEventListener("resize", this.updateDimensions);

    this.$nextTick(() => {
      window.addEventListener('mousewheel', this.$refs.editor.handleMouseWheel);
    })

    this.loadLibraries();

    // this.addPopup({
    //   title: "Test Popup",
    //   position: {x: 200, y: 200},
    //   data: {
    //     name: ""
    //   },
    //   contents: [
    //     {
    //       type: "TEXT",
    //       text: "This is a test popup !"
    //     },
    //     {
    //       type: "INPUT",
    //       key: "name",
    //       placeholder: "Enter your name"
    //     }
    //   ],
    //   options: [
    //     {
    //       color: "#6688FA",
    //       name: "Say Hello",
    //       onClick: (popup, app) => {console.log(`Hello ${popup.data.name} !`);}
    //     },
    //     {
    //       color: "#FA5544",
    //       name: "Cancel",
    //       onClick: (popup, app) => {console.log("Action cancelled !");}
    //     }
    //   ]
    // });

    console.log("App Mounted");
  },
  components: {
    CircuitEditor,
    LibraryWindow,
    Popup
  }
}
</script>

<template>
  <CircuitEditor ref="editor" @mounted="this.updateDimensions"/>
  <LibraryWindow ref="library" :libraries="this.libraries" @mounted="this.updateDimensions"/>
  <Popup ref="popups" v-for="popup in this.popups" :key="popup.id" :popupData="popup"/>
</template>

<style scoped>

</style>
