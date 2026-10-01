/**
 * CampoFormulario.jsx
 * ---------------------------------------------------------------------------
 * Piezas visuales de los campos de formulario:
 * - MensajeCampo: el error en rojo debajo del campo o, si no hay error, un
 *   texto de ayuda en gris. Su id (`${id}-error`) es el que referencia el
 *   aria-describedby del input (ver hooks/useValidacion.js).
 * - CampoFormulario (default): etiqueta + control + MensajeCampo, con el estilo
 *   de los formularios de gestión (Usuarios, Controladores RF).
 */

export function MensajeCampo({ id, error, ayuda }) {
  if (error) {
    return (
      <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-600">
        {error}
      </p>
    )
  }
  return ayuda ? <p className="text-xs text-slate-500">{ayuda}</p> : null
}

// Props:
// - id: id del input (para el htmlFor de la etiqueta y el id del mensaje).
// - etiqueta: texto de la etiqueta.
// - error: mensaje de error a mostrar (o null).
// - ayuda: texto de ayuda opcional cuando no hay error.
export default function CampoFormulario({ id, etiqueta, error, ayuda, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-slate-900">
        {etiqueta}
      </label>
      {children}
      <MensajeCampo id={id} error={error} ayuda={ayuda} />
    </div>
  )
}
