/**
 * EstadoActivo.jsx
 * ---------------------------------------------------------------------------
 * Badge de estado activo / inactivo para los catálogos cuyo `edo` es
 * booleano (Eventos configurados, Unidades, Grupos IO).
 */

// Props:
// - activo: booleano del estado.
// - textoActivo / textoInactivo: (opcionales) etiquetas, p. ej. "Activa" para unidades.
export default function EstadoActivo({ activo, textoActivo = 'Activo', textoInactivo = 'Inactivo' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ring-1 ring-inset whitespace-nowrap ${
        activo
          ? 'bg-green-100 text-green-800 ring-green-600/20'
          : 'bg-red-100 text-red-800 ring-red-600/20'
      }`}
    >
      {activo ? textoActivo : textoInactivo}
    </span>
  )
}
