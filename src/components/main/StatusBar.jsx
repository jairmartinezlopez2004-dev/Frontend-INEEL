/**
 * StatusBar.jsx
 * ---------------------------------------------------------------------------
 * Barra inferior de la aplicación.
 *
 * Rol en el sistema:
 * Muestra centrada la leyenda institucional (config.json → leyendaSistema).
 * Antes mostraba también medidor, RF, protocolo y transporte, pero eran
 * valores fijos de ejemplo y no los de la conexión real, así que se quitaron.
 */
import { obtenerConfiguracion } from '../../config/configuracion'

function StatusBar() {
  return (
    // Franja delgada fija en la parte inferior de la aplicación.
    <footer className="flex h-7 shrink-0 items-center justify-center overflow-hidden whitespace-nowrap border-t border-azul-900 bg-azul-950 px-6 text-[11px] font-medium tracking-wide text-azul-200">
      <span className="truncate">{obtenerConfiguracion().leyendaSistema}</span>
    </footer>
  )
}

export default StatusBar
