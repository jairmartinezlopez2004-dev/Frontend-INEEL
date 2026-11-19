/**
 * Punto de entrada de la aplicación.
 *
 * Este archivo es el primero que ejecuta el navegador: monta el árbol de
 * componentes de React (empezando por <App />) dentro del elemento
 * <div id="root"> que se encuentra en index.html. <BrowserRouter> conecta
 * la app con la URL del navegador (rutas definidas en App.jsx).
 *
 * No contiene lógica de negocio ni de UI; su única responsabilidad es
 * inicializar React y activar el modo estricto para detectar problemas
 * comunes durante el desarrollo (efectos secundarios, APIs obsoletas, etc.).
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
// Fuente Inter (variable), servida desde el propio sistema.
import '@fontsource-variable/inter'
import './index.css'
import App from './App.jsx'
import { cargarConfiguracion } from './config/configuracion'

// StrictMode ejecuta ciertas funciones dos veces en desarrollo (no en producción)
// para ayudar a detectar efectos secundarios impuros; no afecta el comportamiento final.
// Primero se lee /config.json (logo, textos e ícono de la empresa) y luego se
// dibuja la app; cargarConfiguracion() nunca falla (usa valores por defecto).
cargarConfiguracion().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
})
