/**
 * StatusBar.jsx
 * ---------------------------------------------------------------------------
 * Barra de estado inferior de la aplicación (estilo terminal/consola).
 *
 * Rol en el sistema:
 * Muestra de forma compacta el estado de la conexión con el medidor/RTU:
 * identificador del medidor, tiempo de respuesta (RF), protocolo de
 * comunicación y medio de transporte físico (serial/TCP).
 *
 * Integración con el WebService:
 * Actualmente los valores son estáticos (placeholders). Cuando se conecte
 * la comunicación real con el medidor, estos textos deberán reemplazarse por
 * datos dinámicos obtenidos del backend (por ejemplo, vía polling o WebSocket)
 * en lugar de la constante STATUS_ITEMS.
 */

// Lista de textos a mostrar en la barra de estado, separados visualmente por un punto ("•").
const STATUS_ITEMS = [
  'MedidorQP: 0000',
  'RF: 00:00:00',
  'Protocolo: ComsCEC',
  'Transporte: SERIAL-COM3',
]

function StatusBar() {
  return (
    // Franja delgada tipo consola, fija en la parte inferior de la aplicación.
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-slate-700/60 bg-slate-900 px-6 text-[11px] font-medium tracking-wide text-slate-400">
      {STATUS_ITEMS.map((item, index) => (
        <span key={item} className="flex items-center gap-4">
          {/* Separador visual "•" entre cada item, excepto antes del primero. */}
          {index > 0 && <span className="text-slate-600">•</span>}
          {item}
        </span>
      ))}
    </footer>
  )
}

export default StatusBar
