/**
 * direccionRed.js
 * ---------------------------------------------------------------------------
 * La dirección de red del medidor se muestra y se captura en hexadecimal,
 * con el formato 0xFFFF (prefijo 0x, 4 dígitos, mayúsculas).
 *
 * Rol en el sistema:
 * - La base de datos y la API la siguen manejando como número entero (la DLL
 *   la recibe como ushort, 0 a 65535); solo cambia cómo se ve y se escribe
 *   en el visor.
 * - Al capturar se acepta con o sin "0x" y en mayúsculas o minúsculas
 *   ("0x00ff", "FF" y "ff" son la misma dirección: 255).
 */

// Mayor dirección posible: la DLL la recibe como ushort.
export const DIR_RED_MAX = 0xffff

/** Número -> "0x00FF". Si no hay valor numérico, devuelve el valor tal cual (o "—"). */
export function formatoDirRed(valor) {
  if (valor === null || valor === undefined || valor === '') return '—'
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero < 0) return String(valor)
  return `0x${numero.toString(16).toUpperCase().padStart(4, '0')}`
}

/** Texto capturado ("0x00FF", "ff"...) -> número, o NaN si no es hexadecimal válido. */
export function leerDirRed(texto) {
  const limpio = String(texto).trim().replace(/^0x/i, '')
  if (!/^[0-9a-f]{1,4}$/i.test(limpio)) return NaN
  return parseInt(limpio, 16)
}

/** Mensaje de error de la dirección capturada, o null si es válida. */
export function validarDirRed(texto) {
  const limpio = String(texto).trim()
  if (!limpio) return 'La dirección de red es obligatoria.'
  if (!/^(0x)?[0-9a-f]+$/i.test(limpio)) {
    return 'La dirección de red debe ser hexadecimal: dígitos 0-9 y letras A-F (por ejemplo, 0x00FF).'
  }
  const numero = leerDirRed(limpio)
  if (Number.isNaN(numero) || numero > DIR_RED_MAX) return 'La dirección de red debe estar entre 0x0000 y 0xFFFF.'
  return null
}
