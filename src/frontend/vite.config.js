import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Get backend URL from env or use default
  const backendUrl = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'
  const apiBase = env.VITE_API_BASE_URL || '/api'
  const adminBase = env.VITE_ADMIN_BASE_URL || '/shopadmin'

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'), 
      },
      // Forward admin API calls
      '/shopadmin': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
    
    server: {
      proxy: {
        // Forward any call starting with API_BASE to Django backend
        [apiBase]: {
          target: backendUrl,
          changeOrigin: true,
        },
        // Forward admin API calls
        [adminBase]: {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
