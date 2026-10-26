/**
 * validaciones.js
 * ---------------------------------------------------------------------------
 * Reglas de validación de formularios, compartidas por Login y los módulos
 * de gestión (Usuarios, Controladores RF, Eventos, Unidades, Puntos IO, Grupos IO).
 *
 * Los formularios usan `noValidate` para no mostrar los globos genéricos del
 * navegador; en su lugar validan con estas funciones y muestran el mensaje
 * debajo de cada campo (ver hooks/useValidacion.js y common/CampoFormulario.jsx).
 *
 * Cada validador recibe el valor del campo y devuelve el mensaje de error en
 * español, o null si el valor es válido.
 */

/**
 * Campo de texto obligatorio, con largo mínimo/máximo opcional.
 * `femenino` ajusta la concordancia ("La contraseña es obligatoria").
 * `recortar` = false cuenta los espacios (p. ej. en contraseñas).
 */
export function validarTexto(valor, { nombre, minimo, maximo, recortar = true, femenino = false }) {
  const texto = recortar ? String(valor).trim() : String(valor)
  if (!texto) return `${nombre} es ${femenino ? 'obligatoria' : 'obligatorio'}.`
  if (minimo && maximo && minimo === maximo && texto.length !== minimo) {
    return `${nombre} debe tener exactamente ${minimo} caracteres (llevas ${texto.length}).`
  }
  if (minimo && texto.length < minimo) {
    return `${nombre} debe tener al menos ${minimo} caracteres (llevas ${texto.length}).`
  }
  if (maximo && texto.length > maximo) return `${nombre} no puede tener más de ${maximo} caracteres.`
  return null
}

// Largo de las contraseñas en todo el sistema (alta y restablecimiento en
// Usuarios, registro y Login). El backend exige mínimo 8 y no fija máximo;
// el máximo de 16 es el que acepta el campo de contraseña del Login.
export const CONTRASENA_MIN = 8
export const CONTRASENA_MAX = 16

// Requisitos de una contraseña nueva (alta y restablecimiento en Usuarios, y
// registro). No se aplican al Login ni a la confirmación de Puntos IO, donde
// se escribe una contraseña que ya existe. `faltante` es el texto del error
// ("debe tener …"); el de espacios va aparte ("no debe tener espacios").
export const REQUISITOS_CONTRASENA = [
  {
    texto: `De ${CONTRASENA_MIN} a ${CONTRASENA_MAX} caracteres`,
    faltante: `de ${CONTRASENA_MIN} a ${CONTRASENA_MAX} caracteres`,
    cumple: (v) => v.length >= CONTRASENA_MIN && v.length <= CONTRASENA_MAX,
  },
  { texto: 'Una letra mayúscula', faltante: 'una mayúscula', cumple: (v) => /\p{Lu}/u.test(v) },
  { texto: 'Una letra minúscula', faltante: 'una minúscula', cumple: (v) => /\p{Ll}/u.test(v) },
  { texto: 'Un número', faltante: 'un número', cumple: (v) => /\d/.test(v) },
  {
    texto: 'Un carácter especial (por ejemplo ! @ # $ % & *)',
    faltante: 'un carácter especial',
    cumple: (v) => /[^\p{L}\p{N}\s]/u.test(v),
  },
  { texto: 'Sin espacios', faltante: null, cumple: (v) => !/\s/.test(v) },
]

/** Contraseña nueva obligatoria que cumple todos los REQUISITOS_CONTRASENA. */
export function validarContrasena(valor) {
  const contrasena = String(valor)
  if (!contrasena) return 'La contraseña es obligatoria.'
  const incumplidos = REQUISITOS_CONTRASENA.filter((r) => !r.cumple(contrasena))
  if (incumplidos.length === 0) return null
  const faltantes = incumplidos.filter((r) => r.faltante).map((r) => r.faltante)
  const partes = []
  if (faltantes.length > 0) {
    const lista =
      faltantes.length === 1 ? faltantes[0] : `${faltantes.slice(0, -1).join(', ')} y ${faltantes.at(-1)}`
    partes.push(`debe tener ${lista}`)
  }
  if (incumplidos.some((r) => !r.faltante)) partes.push('no debe tener espacios')
  return `La contraseña ${partes.join(', y ')}.`
}

/** Correo electrónico obligatorio con formato usuario@dominio.ext. */
export function validarCorreo(valor) {
  const correo = String(valor).trim()
  if (!correo) return 'El correo es obligatorio.'
  if (/\s/.test(correo)) return 'El correo no puede contener espacios.'
  if (!correo.includes('@')) return 'Al correo le falta la @, por ejemplo usuario@dominio.com.'
  if (!/^[^@]+@[^@]+\.[^@.]{2,}$/.test(correo)) {
    return 'Escribe un correo válido, por ejemplo usuario@dominio.com.'
  }
  return null
}

/** Dirección IPv4 obligatoria: cuatro números de 0 a 255 separados por punto. */
export function validarIP(valor) {
  const ip = String(valor).trim()
  if (!ip) return 'La dirección IP es obligatoria.'
  if (/[^\d.]/.test(ip)) return 'La dirección IP solo puede contener números y puntos (sin letras ni espacios).'

  const partes = ip.split('.')
  if (partes.length !== 4 || partes.some((p) => p === '')) {
    return 'La dirección IP debe tener 4 números separados por punto, por ejemplo 192.168.1.20.'
  }
  if (partes.some((p) => Number(p) > 255)) return 'Cada número de la dirección IP debe estar entre 0 y 255.'
  if (partes.some((p) => p.length > 1 && p.startsWith('0'))) {
    return 'Los números de la dirección IP no deben empezar con cero (escribe 1 en lugar de 01).'
  }
  return null
}

/** Número entero obligatorio, opcionalmente dentro de un rango. */
export function validarEntero(valor, { nombre, minimo, maximo }) {
  const texto = String(valor).trim()
  if (!texto) return `${nombre} es obligatorio.`
  if (!/^\d+$/.test(texto)) return `${nombre} debe ser un número entero, sin letras, decimales ni signos.`
  const numero = Number(texto)
  if (minimo !== undefined && maximo !== undefined && (numero < minimo || numero > maximo)) {
    return `${nombre} debe estar entre ${minimo} y ${maximo}.`
  }
  if (minimo !== undefined && numero < minimo) return `${nombre} debe ser como mínimo ${minimo}.`
  if (maximo !== undefined && numero > maximo) return `${nombre} debe ser como máximo ${maximo}.`
  return null
}

// Rango de un `int` de SQL Server / C#.
const INT_MIN = -2147483648
const INT_MAX = 2147483647

/** Número entero obligatorio que puede ser negativo (p. ej. límites de un punto IO). */
export function validarEnteroConSigno(valor, { nombre }) {
  const texto = String(valor).trim()
  if (!texto) return `${nombre} es obligatorio.`
  if (!/^-?\d+$/.test(texto)) return `${nombre} debe ser un número entero, sin letras ni decimales.`
  const numero = Number(texto)
  if (numero < INT_MIN || numero > INT_MAX) return `${nombre} debe estar entre ${INT_MIN} y ${INT_MAX}.`
  return null
}
