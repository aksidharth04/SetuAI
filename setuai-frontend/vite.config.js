// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // This plugin handles .jsx and .tsx files by default
import tailwindcss from '@tailwindcss/vite';
import path from 'path'; // Import 'path' module

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // This tells Vite how to resolve the '@/' alias
      '@': path.resolve(__dirname, './src'),
    },
  },
});