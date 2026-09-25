/**
 * Punto de entrada de la aplicación (SISMEDIA-RT).
 *
 * Este archivo es el primero que ejecuta el navegador: monta el árbol de
 * componentes de React (empezando por <App />) dentro del elemento
 * <div id="root"> que se encuentra en index.html.
 *
 * No contiene lógica de negocio ni de UI; su única responsabilidad es
 * inicializar React y activar el modo estricto para detectar problemas
 * comunes durante el desarrollo (efectos secundarios, APIs obsoletas, etc.).
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode ejecuta ciertas funciones dos veces en desarrollo (no en producción)
// para ayudar a detectar efectos secundarios impuros; no afecta el comportamiento final.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
