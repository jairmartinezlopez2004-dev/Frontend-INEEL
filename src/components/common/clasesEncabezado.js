/**
 * clasesEncabezado.js
 * ---------------------------------------------------------------------------
 * Clases de Tailwind del encabezado en degradado azul de las tarjetas
 * principales (detalle de un controlador y de un medidor), para que todos
 * usen exactamente el mismo color. Ver .claude/skills/estilo-simecaps.
 */

// Franja superior de la tarjeta: degradado azul de izquierda a derecha.
export const CLASE_ENCABEZADO_DEGRADADO =
  'bg-gradient-to-r from-blue-800 via-blue-700 to-blue-500 px-4 py-4 text-white md:px-6 md:py-5'

// Enlace de regreso ("Volver a …") sobre el degradado.
export const CLASE_VOLVER_DEGRADADO =
  'mb-3 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-blue-100 hover:text-white hover:underline'
