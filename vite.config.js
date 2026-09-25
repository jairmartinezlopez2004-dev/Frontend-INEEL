/**
 * Configuración de Vite para el Visor SISMEDIA-RT.
 *
 * Vite es el bundler/servidor de desarrollo del proyecto. Aquí se define:
 * - El plugin de React (soporte JSX, Fast Refresh, etc.).
 * - Un proxy de desarrollo que redirige las peticiones "/api" hacia el
 *   backend .NET (WebService) para evitar problemas de CORS mientras se
 *   trabaja en local, ya que el frontend (Vite) y el backend corren en
 *   puertos/orígenes distintos.
 */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redirige /api al backend .NET en desarrollo para evitar CORS.
      // Ej.: /api/Auth/login -> https://localhost:7090/api/Auth/login
      // Se apunta directo al puerto HTTPS: el puerto HTTP (5201) responde con
      // un 307 hacia HTTPS, y el navegador seguiría ese redirect fuera del
      // proxy (error de CORS). `secure: false` acepta el certificado de
      // desarrollo autofirmado de .NET.
      '/api': {
        target: 'https://localhost:7090',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
