/**
 * clasesFormulario.js
 * ---------------------------------------------------------------------------
 * Clases de Tailwind compartidas por los inputs y selects de los formularios
 * de gestión (Usuarios, Controladores RF), en estado normal y con error.
 */

const BASE =
  'rounded-md border bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2'
const NORMAL = 'border-slate-300 focus:ring-blue-500'
const CON_ERROR = 'border-red-500 bg-red-50 focus:ring-red-500'

/** Clases de un control según tenga o no error; `extra` se agrega al final. */
export function claseControl(conError = false, extra = '') {
  return `${BASE} ${conError ? CON_ERROR : NORMAL} ${extra}`.trim()
}
