// app/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.lottie'],
  // allow Railway's *.up.railway.app host when serving the production preview
  preview: { host: true, allowedHosts: true },
  test: {
    environment: 'node',
  },
});
