/**
 * EstadoBadge.jsx
 * ---------------------------------------------------------------------------
 * Badge (etiqueta de color) que representa el estado operativo (`edo`) de
 * un medidor. Se usa tanto en la tabla de medidores de un controlador
 * (DetalleControlador) como en el encabezado de DetalleMedidor, para que ambos
 * muestren exactamente los mismos colores y textos.
 *
 * Estados (catálogo del backend, ver ESTADOS_MEDIDOR en medidoresService.js):
 *   10 = EN OPERACIÓN       (verde)
 *   11 = EN USO             (azul)
 *   20 = MANTENIMIENTO      (ámbar)
 *    0 = FUERA DE OPERACIÓN (rojo)
 */
import { ESTADOS_MEDIDOR } from '../../services/medidoresService'

// Clases de Tailwind por estado.
const CLASES_ESTADO = {
  10: 'bg-green-100 text-green-800 ring-green-600/20',
  11: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  20: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  0: 'bg-red-100 text-red-800 ring-red-600/20',
}

// Props:
// - edo: número de estado (10, 11, 20 o 0). Cualquier otro valor se muestra como "DESCONOCIDO".
export default function EstadoBadge({ edo }) {
  const texto = ESTADOS_MEDIDOR.find((e) => e.valor === edo)?.texto ?? 'Desconocido'
  const clases = CLASES_ESTADO[edo] ?? 'bg-slate-100 text-slate-700 ring-slate-500/20'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ring-1 ring-inset whitespace-nowrap ${clases}`}
    >
      {texto}
    </span>
  )
}
