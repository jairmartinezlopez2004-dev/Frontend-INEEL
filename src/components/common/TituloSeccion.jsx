/**
 * TituloSeccion.jsx
 * ---------------------------------------------------------------------------
 * Título de una sección o tarjeta del sistema con su ícono a la izquierda
 * (círculo azul con el ícono en blanco), para que todas las vistas
 * (Controladores, Medidores, Unidades, Puntos IO…) se vean iguales.
 *
 * Ver la guía de estilo en .claude/skills/estilo-simecaps.
 */

// Props:
// - Icono: componente de lucide-react (p. ej. Radio).
// - titulo: texto del título (se muestra en mayúsculas).
// - subtitulo: (opcional) texto secundario debajo del título.
// - etiqueta: (opcional) texto pequeño ARRIBA del título (p. ej. "Controlador").
// - mayusculas: (opcional, true) false para nombres propios (p. ej. el de un controlador).
export default function TituloSeccion({ Icono, titulo, subtitulo, etiqueta, mayusculas = true }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {Icono && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm shadow-blue-200">
          <Icono className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 leading-tight">
        {etiqueta && (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{etiqueta}</p>
        )}
        <h2 className={`truncate text-lg font-bold text-slate-800 ${mayusculas ? 'uppercase tracking-wide' : ''}`}>{titulo}</h2>
        {subtitulo && <p className="mt-0.5 text-sm text-slate-500">{subtitulo}</p>}
      </div>
    </div>
  )
}
