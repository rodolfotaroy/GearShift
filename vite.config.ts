import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/GearShift/',  // Replace with your repository name
  server: {
    host: true, // Listen on all network interfaces
    port: 5174, // Use your preferred port
  },
})
