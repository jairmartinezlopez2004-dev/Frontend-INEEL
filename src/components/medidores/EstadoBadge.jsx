/**
 * EstadoBadge.jsx
 * ---------------------------------------------------------------------------
 * Badge (etiqueta de color) que representa el estado operativo (`edo`) de
 * un medidor. Se usa tanto en el catálogo (ListaMedidores) como en el
 * encabezado de la vista de detalle (ConfiguracionComunicaciones), para que
 * ambos muestren exactamente los mismos colores y textos.
 *
 * Estados:
 *   1 = ACTIVO             (verde)
 *   2 = MANTENIMIENTO      (ámbar)
 *   3 = FUERA DE OPERACIÓN (rojo)
 */

// Diccionario estado -> texto y clases de Tailwind.
const ESTADOS_MEDIDOR = {
  1: { texto: 'ACTIVO', clases: 'bg-green-100 text-green-800 ring-green-600/20' },
  2: { texto: 'MANTENIMIENTO', clases: 'bg-amber-100 text-amber-800 ring-amber-600/20' },
  3: { texto: 'FUERA DE OPERACIÓN', clases: 'bg-red-100 text-red-800 ring-red-600/20' },
}

// Props:
// - edo: número de estado (1, 2 o 3). Cualquier otro valor se muestra como "DESCONOCIDO".
export default function EstadoBadge({ edo }) {
  const estado = ESTADOS_MEDIDOR[edo] ?? {
    texto: 'DESCONOCIDO',
    clases: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap ${estado.clases}`}
    >
      {estado.texto}
    </span>
  )
}
