import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import svgr from 'vite-plugin-svgr';
import svgr from '@svgr/rollup';

// https://vite.dev/config/
export default defineConfig({
  base: "/Photobooth/",
  plugins: [
    react(),
    svgr({
          dimensions: false, // This disables the width and height attributes
        }),],
})
