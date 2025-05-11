import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faMagnifyingGlassPlus, faMagnifyingGlassMinus, faRectangleXmark, faArrowPointer, faHandPointer, faNetworkWired} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faMagnifyingGlassPlus, faMagnifyingGlassMinus, faRectangleXmark, faArrowPointer, faHandPointer, faNetworkWired)

createApp(App)
    .component("font-awesome-icon", FontAwesomeIcon)
    .mount('#app');
