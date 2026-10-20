/**
 * BuscadorTabla.jsx
 * ---------------------------------------------------------------------------
 * Caja de búsqueda que va sobre las tablas de gestión (Controladores RF,
 * medidores de un controlador, Usuarios, Unidades, etc.). Solo muestra el
 * input y el conteo de resultados; el filtrado lo hace el hook useFiltroTabla.
 */

// Props:
// - valor / onCambio: texto del buscador (viene de useFiltroTabla).
// - total: número de filas sin filtrar.
// - visibles: número de filas que pasan el filtro.
// - placeholder: texto de ayuda (p. ej. "Buscar por nombre, serie o IP…").
// - claseFoco: (opcional) color del anillo de foco, para las secciones en verde.
export default function BuscadorTabla({
  valor,
  onCambio,
  total,
  visibles,
  placeholder = 'Buscar…',
  claseFoco = 'focus:ring-blue-500',
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-3">
      <div className="relative w-full sm:max-w-sm">
        {/* Lupa dentro del input. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 3.47 9.77l3.13 3.13a.75.75 0 1 0 1.06-1.06l-3.13-3.13A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="search"
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onCambio('')}
          placeholder={placeholder}
          aria-label={placeholder}
          className={`w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 ${claseFoco}`}
        />
      </div>
      {/* El conteo solo aparece mientras hay un filtro escrito. */}
      {valor.trim() && (
        <p className="text-xs text-slate-500">
          {visibles} de {total} {total === 1 ? 'registro' : 'registros'}
        </p>
      )}
    </div>
  )
}
