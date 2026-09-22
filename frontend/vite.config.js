import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/VeriFlow/',
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    port: 5173,
  },
})
