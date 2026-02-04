import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Helper to bypass proxy for browser requests (SPA navigation)
const bypassProxy = (req, res, options) => {
  const accept = req.headers && req.headers.accept;
  if (accept && accept.includes('text/html')) {
    return req.url;
  }
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/campus': {
        target: 'http://192.168.1.25:9191',
        changeOrigin: true,
        secure: false,
        bypass: bypassProxy,
      },
      '/hostel': { // Note: Singular /hostel matches API, but route is /hostels. Good.
        target: 'http://192.168.1.25:9191',
        changeOrigin: true,
        secure: false,
      },
      '/hostels': { // Matches route /hostels
        target: 'http://192.168.1.25:9191',
        changeOrigin: true,
        secure: false,
        bypass: bypassProxy,
      },
      '/room': {
        target: 'http://192.168.1.25:9191',
        changeOrigin: true,
        secure: false,
      },
      '/rooms': { // Matches route /rooms
        target: 'http://192.168.1.25:9191',
        changeOrigin: true,
        secure: false,
        bypass: bypassProxy,
      },
      '/attendance': { // Matches route /attendance - Collision! But API is /attendance (singular)? Context says route is /attendance.
        // Wait, API usage is /attendance (POST), /attendances (GET). Route is /attendance.
        // This /attendance proxy will catch route /attendance.
        target: 'http://192.168.1.25:9191',
        changeOrigin: true,
        secure: false,
        bypass: bypassProxy,
      },
      '/attendances': {
        target: 'http://192.168.1.25:9191',
        changeOrigin: true,
        secure: false,
      },
      '/mess-menu': {
        target: 'http://192.168.1.25:9191',
        changeOrigin: true,
        secure: false,
      },
      '/health': { // Matches route /health
        target: 'http://192.168.1.25:9191',
        changeOrigin: true,
        secure: false,
        bypass: bypassProxy,
      },
      '/allocations': {
        target: 'http://192.168.1.25:9191',
        changeOrigin: true,
        secure: false,
      },
      '/visits': {
        target: 'http://192.168.1.25:9191',
        changeOrigin: true,
        secure: false,
      },
      '/complaint': {
        target: 'http://192.168.1.25:9191',
        changeOrigin: true,
        secure: false,
      },
      '/complaints': { // Matches route /complaints
        target: 'http://192.168.1.25:9191',
        changeOrigin: true,
        secure: false,

      },
      '/admin': {
        target: 'http://192.168.1.34:8081',
        changeOrigin: true,
        secure: false,
        bypass: (req, res, options) => {
          const accept = req.headers && req.headers.accept;
          if ((accept && accept.includes('text/html')) || req.url.includes('.jsx') || req.url.includes('.js')) {
            return req.url;
          }
        },
      },
      '/students': { // Matches route /students
        target: 'http://192.168.1.34:8081',
        changeOrigin: true,
        secure: false,

      },
      '/student': {
        target: 'http://192.168.1.34:8081',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://192.168.1.34:8081',
        changeOrigin: true,
        secure: false,
      }
    }
  },

})
