import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const fullReloadAlways = {
  handleHotUpdate({ server }) {
    server.ws.send({ type: "full-reload" });
    return [];
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), fullReloadAlways],
})
