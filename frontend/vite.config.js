import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [react()],
    define: {
      // Explicitly set MODE based on command
      'import.meta.env.MODE': JSON.stringify(command === 'serve' ? 'development' : 'production')
    },
    server: {
      proxy: {
        // Proxy API requests during development
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})