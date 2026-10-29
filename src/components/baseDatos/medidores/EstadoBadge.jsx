/**
 * EstadoBadge.jsx
 * ---------------------------------------------------------------------------
 * Badge (etiqueta de color) que representa el estado (`edo`) de un medidor
 * o de un controlador RF. Se usa en las listas de controladores y de
 * medidores y en los encabezados de sus detalles, para que todos muestren
 * exactamente los mismos colores y textos.
 *
 * Estados (catálogo del backend, ver ESTADOS_EQUIPO en medidoresService.js):
 *   10 = ACTIVO   (verde)
 *   11 = EN USO   (azul)
 *   20 = INACTIVO (rojo)
 */
import { textoEstadoEquipo } from '../../../services/medidoresService'

// Clases de Tailwind por estado.
const CLASES_ESTADO = {
  10: 'bg-green-100 text-green-800 ring-green-600/20',
  11: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  20: 'bg-red-100 text-red-800 ring-red-600/20',
}

// Props:
// - edo: número de estado (10, 11 o 20). Cualquier otro valor se muestra como "DESCONOCIDO".
export default function EstadoBadge({ edo }) {
  const texto = textoEstadoEquipo(edo)
  const clases = CLASES_ESTADO[edo] ?? 'bg-slate-100 text-slate-700 ring-slate-500/20'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ring-1 ring-inset whitespace-nowrap ${clases}`}
    >
      {texto}
    </span>
  )
}
