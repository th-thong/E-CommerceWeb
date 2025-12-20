import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), 
    },
  },
  
  server: {
    proxy: {
      // Forward any call starting with /api to Django backend
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // Forward admin API calls
      '/shopadmin': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
