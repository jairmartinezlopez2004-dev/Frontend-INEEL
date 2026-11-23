/**
 * useLecturaMedidor.js
 * ---------------------------------------------------------------------------
 * Lógica común de las pestañas que leen un grupo de puntos del medidor
 * (Instantáneos, Valores 5M, Consumos y Calidad): pide la lectura al
 * backend, guarda los valores por `tag` y el estado del último intento.
 *
 * El backend lee todos los puntos activos del grupo funcional (no recibe una
 * selección), así que cada pestaña solo decide dónde pinta cada `tag`. Los
 * puntos que llegan y no están en el catálogo de la pestaña se devuelven en
 * `otrosPuntos` para no perderlos.
 *
 * Cada "Solicitar" limpia primero los valores de la lectura anterior: la
 * pantalla queda en blanco ("—") mientras se espera y, si la lectura falla,
 * no quedan a la vista valores viejos que parezcan actuales.
 */
import { useEffect, useRef, useState } from 'react'
import { solicitarLecturaGrupo } from '../services/conexionMedidorService'
import { formatoDirRed } from '../utils/direccionRed'

// rolId del SuperAdministrador y del Administrador en la UI (authService.js).
const ROLES_ADMINISTRADOR = [1, 2]

/** Da formato al valor recibido: números con hasta 3 decimales; sin valor -> "—". */
export function formatearValor(valor) {
  if (valor === null || valor === undefined || valor === '') return '—'
  const numero = Number(valor)
  if (Number.isNaN(numero)) return String(valor)
  return numero.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}

/**
 * @param {object} opciones
 * @param {object} opciones.medidor - Medidor seleccionado (se usan id y dirRed).
 * @param {object} opciones.usuarioLogueado - Solo los administradores pueden leer.
 * @param {string} opciones.grupo - Clave de GRUPOS_LECTURA ('instantaneos', 'variables5min', 'consumos', 'calidadpotencia').
 * @param {string[]} opciones.tagsCatalogo - Tags que la pestaña ya sabe dónde pintar.
 */
export function useLecturaMedidor({ medidor, usuarioLogueado, grupo, tagsCatalogo }) {
  const esAdmin = ROLES_ADMINISTRADOR.includes(usuarioLogueado?.rolId)

  // Valores de la última lectura exitosa, indexados por tag en minúsculas.
  const [valoresPorTag, setValoresPorTag] = useState(() => new Map())
  // Puntos devueltos que no aparecen en el catálogo de la pestaña.
  const [otrosPuntos, setOtrosPuntos] = useState([])
  // Hora de la última lectura exitosa.
  const [ultimaLectura, setUltimaLectura] = useState(null)
  // estado: null | { tipo: 'enCurso' | 'exito' | 'error', texto }
  const [estado, setEstado] = useState(null)
  const controladorRef = useRef(null)

  // Si el usuario sale de la pestaña con una lectura en curso, se cancela.
  useEffect(() => () => controladorRef.current?.abort(), [])

  const solicitar = async () => {
    controladorRef.current?.abort()
    const controlador = new AbortController()
    controladorRef.current = controlador

    const catalogo = new Set(tagsCatalogo.map((tag) => tag.toLowerCase()))
    // Limpia la lectura anterior antes de pedir la nueva.
    setValoresPorTag(new Map())
    setOtrosPuntos([])
    setUltimaLectura(null)
    setEstado({ tipo: 'enCurso', texto: `Solicitando lectura al medidor ${formatoDirRed(medidor.dirRed)}…` })
    try {
      const { mensaje, puntos } = await solicitarLecturaGrupo(grupo, medidor.id, { signal: controlador.signal })
      setValoresPorTag(new Map(puntos.map((punto) => [String(punto.tag).toLowerCase(), punto.valor])))
      setOtrosPuntos(puntos.filter((punto) => !catalogo.has(String(punto.tag).toLowerCase())))
      setUltimaLectura(new Date())
      setEstado({ tipo: 'exito', texto: mensaje })
    } catch (err) {
      if (err.name === 'AbortError') return
      setEstado({ tipo: 'error', texto: err.message })
    }
  }

  return {
    esAdmin,
    estado,
    leyendo: estado?.tipo === 'enCurso',
    ultimaLectura,
    otrosPuntos,
    solicitar,
    /** Valor ya formateado del punto con ese tag ("—" si no llegó). */
    valor: (tag) => formatearValor(valoresPorTag.get(tag.toLowerCase())),
  }
}
