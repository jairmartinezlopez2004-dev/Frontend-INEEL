/**
 * clasesEncabezado.js
 * ---------------------------------------------------------------------------
 * Clases de Tailwind del encabezado azul (color sólido, letras blancas) de las
 * tarjetas principales: detalle de un controlador y de un medidor. Están aquí
 * para que todos usen exactamente el mismo color. Ver .claude/skills/estilo-simecaps.
 */

// Tarjeta completa del encabezado: azul sólido con texto blanco.
export const CLASE_TARJETA_AZUL = 'shrink-0 overflow-hidden rounded-xl bg-azul-800 text-white shadow-sm'

// Parte superior: regreso + ícono, etiqueta y nombre.
export const CLASE_ENCABEZADO_AZUL = 'px-4 pt-4 pb-4 md:px-6 md:pt-5'

// Enlace de regreso ("Volver a …") sobre el azul.
export const CLASE_VOLVER_AZUL =
  'mb-3 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-azul-100 hover:text-white hover:underline'

// Fila de datos (serie, IP, Dir. RF…) debajo, separada con una línea clara.
export const CLASE_DATOS_AZUL = 'grid grid-cols-2 gap-4 border-t border-white/20 px-4 py-4 sm:grid-cols-4 md:px-6'
export const CLASE_ETIQUETA_DATO_AZUL = 'text-xs font-medium uppercase tracking-wide text-azul-100'
export const CLASE_VALOR_DATO_AZUL = 'mt-0.5 font-mono text-sm text-white'
