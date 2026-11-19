/**
 * Botones.jsx
 * ---------------------------------------------------------------------------
 * Botones comunes del sistema, con su ícono de lucide-react, para que las
 * acciones se vean iguales en todas las vistas:
 * - BotonPrimario: acción principal de una sección (p. ej. "Nuevo medidor").
 * - BotonSecundario: acción con borde gris (p. ej. "Editar controlador").
 * - BotonEditar / BotonVer: acciones pequeñas dentro de las filas de una tabla.
 *
 * Todos aceptan las props normales de <button> (onClick, disabled, title…).
 * Ver la guía de estilo en .claude/skills/estilo-simecaps.
 */
import { ChevronRight, Pencil, Plus } from 'lucide-react'

const BASE =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

/** Acción principal (azul). Por defecto con el ícono "+". */
export function BotonPrimario({ Icono = Plus, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`${BASE} rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 active:scale-95 ${className}`}
      {...props}
    >
      {Icono && <Icono className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  )
}

/** Acción secundaria (borde gris, fondo blanco). */
export function BotonSecundario({ Icono, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`${BASE} rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 ${className}`}
      {...props}
    >
      {Icono && <Icono className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </button>
  )
}

/** "Editar" en una fila de tabla. */
export function BotonEditar({ children = 'Editar', ...props }) {
  return (
    <BotonSecundario Icono={Pencil} {...props}>
      {children}
    </BotonSecundario>
  )
}

/** "Ver …" en una fila de tabla: abre el detalle (borde azul, flecha). */
export function BotonVer({ children = 'Ver', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`${BASE} rounded-md border border-blue-600 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-600 hover:text-white ${className}`}
      {...props}
    >
      {children}
      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  )
}
