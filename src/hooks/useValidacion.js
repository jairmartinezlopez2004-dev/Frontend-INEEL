/**
 * useValidacion.js
 * ---------------------------------------------------------------------------
 * Hook que valida un formulario con reglas propias (ver utils/validaciones.js)
 * y decide cuándo mostrar cada error:
 * - Un campo recién abierto no se marca en rojo.
 * - El error de un campo aparece cuando el usuario lo deja (onBlur) y se
 *   actualiza mientras escribe, así que desaparece en cuanto lo corrige.
 * - Al intentar enviar, se muestran todos los errores y se enfoca el primero.
 *
 * @param {object} form - Valores actuales del formulario.
 * @param {Record<string, (valor: any) => string|null>} validadores - Un validador
 *   por campo, en el orden en que aparecen los campos en pantalla.
 * @param {string} prefijoId - Prefijo de los `id` de los inputs (`${prefijoId}-${campo}`),
 *   usado para enfocar el primer campo con error.
 */
import { useState } from 'react'

export function useValidacion(form, validadores, prefijoId) {
  const [tocados, setTocados] = useState({})
  const campos = Object.keys(validadores)

  const errores = Object.fromEntries(
    campos.map((campo) => [campo, validadores[campo](form[campo])]).filter(([, msg]) => msg),
  )

  /** Mensaje a mostrar para el campo (null si no tiene error o aún no se visita). */
  const errorDe = (campo) => (tocados[campo] ? (errores[campo] ?? null) : null)

  /** Marca el campo como visitado (para usar en onBlur). */
  const marcarTocado = (campo) => setTocados((prev) => ({ ...prev, [campo]: true }))

  /**
   * Para el onSubmit: devuelve true si todo es válido. Si no, muestra todos los
   * errores, enfoca el primer campo con error y devuelve false.
   */
  const validarAlEnviar = () => {
    const primero = campos.find((campo) => errores[campo])
    if (!primero) return true
    setTocados(Object.fromEntries(campos.map((campo) => [campo, true])))
    document.getElementById(`${prefijoId}-${primero}`)?.focus()
    return false
  }

  /** Props de accesibilidad para el input del campo. */
  const ariaDe = (campo) => {
    const conError = Boolean(errorDe(campo))
    return {
      id: `${prefijoId}-${campo}`,
      'aria-invalid': conError,
      'aria-describedby': conError ? `${prefijoId}-${campo}-error` : undefined,
      onBlur: () => marcarTocado(campo),
    }
  }

  return { errores, errorDe, ariaDe, validarAlEnviar }
}
