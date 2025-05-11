import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faMagnifyingGlassPlus, faMagnifyingGlassMinus, faRectangleXmark} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faMagnifyingGlassPlus, faMagnifyingGlassMinus, faRectangleXmark)

createApp(App)
    .component("font-awesome-icon", FontAwesomeIcon)
    .mount('#app');
