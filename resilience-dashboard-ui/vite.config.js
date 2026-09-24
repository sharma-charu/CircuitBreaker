import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const gatewayTarget = process.env.VITE_API_GATEWAY_URL || process.env.GATEWAY_URL || `http://127.0.0.1:${process.env.GATEWAY_PORT || '8090'}`

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/actuator': gatewayTarget,
      '/products': gatewayTarget,
      '/inventory': gatewayTarget,
      '/api': gatewayTarget,
      '/fallback': gatewayTarget
    }
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
    allowedHosts: true,
    proxy: {
      '/actuator': gatewayTarget,
      '/products': gatewayTarget,
      '/inventory': gatewayTarget,
      '/api': gatewayTarget,
      '/fallback': gatewayTarget
    }
  }
})
