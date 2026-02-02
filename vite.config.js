import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/campus': {
        target: 'http://192.168.1.4:9191',
        changeOrigin: true,
        secure: false,
      },
      '/hostel': {
        target: 'http://192.168.1.4:9191',
        changeOrigin: true,
        secure: false,
      },
      '/hostels': {
        target: 'http://192.168.1.4:9191',
        changeOrigin: true,
        secure: false,
      },
      '/room': {
        target: 'http://192.168.1.4:9191',
        changeOrigin: true,
        secure: false,
      },
      '/rooms': {
        target: 'http://192.168.1.4:9191',
        changeOrigin: true,
        secure: false,
      },
      '/attendance': {
        target: 'http://192.168.1.4:9191',
        changeOrigin: true,
        secure: false,
      },
      '/attendances': {
        target: 'http://192.168.1.4:9191',
        changeOrigin: true,
        secure: false,
      },
      '/mess-menu': {
        target: 'http://192.168.1.4:9191',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://192.168.1.4:9191',
        changeOrigin: true,
        secure: false,
      },
      '/allocations': {
        target: 'http://192.168.1.4:9191',
        changeOrigin: true,
        secure: false,
      },
      '/visits': {
        target: 'http://192.168.1.4:9191',
        changeOrigin: true,
        secure: false,
      },
      '/complaint': {
        target: 'http://192.168.1.4:9191',
        changeOrigin: true,
        secure: false,
      },
      '/complaints': {
        target: 'http://192.168.1.4:9191',
        changeOrigin: true,
        secure: false,
      },
      '/admin': {
        target: 'http://192.168.1.17:8081',
        changeOrigin: true,
        secure: false,
      },
      '/students': {
        target: 'http://192.168.1.17:8081',
        changeOrigin: true,
        secure: false,
      },
      '/student': {
        target: 'http://192.168.1.17:8081',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://192.168.1.17:8081',
        changeOrigin: true,
        secure: false,
      }
    }
  },

})
