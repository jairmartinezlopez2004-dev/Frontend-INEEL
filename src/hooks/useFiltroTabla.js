/**
 * useFiltroTabla.js
 * ---------------------------------------------------------------------------
 * Hook que filtra en el navegador las filas de una tabla según el texto que
 * el usuario escribe en el buscador (ver components/common/BuscadorTabla.jsx).
 *
 * Reglas de la búsqueda:
 * - No distingue mayúsculas ni acentos ("medicion" encuentra "Medición").
 * - Busca el texto dentro de cualquiera de los campos que indique `camposDe`
 *   (no tiene que coincidir completo: "192.168" encuentra "192.168.1.20").
 * - Varias palabras separadas por espacio deben aparecer todas, aunque sea en
 *   columnas distintas ("norte activo" = controladores del norte y activos).
 *
 * No hace peticiones al WebService: filtra la lista que la vista ya cargó.
 *
 * @param {object[]} filas - Lista completa que muestra la tabla.
 * @param {(fila: object) => any[]} camposDe - Devuelve los valores buscables
 *   de una fila, tal como se ven en pantalla (p. ej. el texto del estado, no su código).
 * @returns {{ texto: string, setTexto: Function, filtradas: object[] }}
 */
import { useState } from 'react'

/** Minúsculas y sin acentos, para comparar sin importar cómo se escribió. */
function normalizar(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function useFiltroTabla(filas, camposDe) {
  const [texto, setTexto] = useState('')
  const palabras = normalizar(texto).split(/\s+/).filter(Boolean)

  const filtradas =
    palabras.length === 0
      ? filas
      : filas.filter((fila) => {
          const contenido = camposDe(fila).map(normalizar).join(' ')
          return palabras.every((palabra) => contenido.includes(palabra))
        })

  return { texto, setTexto, filtradas }
}
