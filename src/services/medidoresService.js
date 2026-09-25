/**
 * medidoresService.js
 * ---------------------------------------------------------------------------
 * Funciones de acceso al WebService relacionadas con los medidores
 * (controladores) y su configuración de comunicaciones.
 *
 * Rol en el sistema:
 * Los componentes de React llaman a estas funciones y reciben objetos JS
 * ya "limpios" (DTOs del lado del frontend). Toda la lógica de parseo de
 * cadenas separadas por pipes vive aquí, no en los componentes.
 *
 * NOTA: Las rutas de configuración son provisionales (asumidas). Cuando el
 * backend confirme si serán /Medidores/Configuracion o los métodos
 * LeerSetpoints / ProgramarsetPoints, solo hay que ajustar las constantes
 * RUTAS de este archivo.
 */
import { apiGet, apiPost } from './api'

// Rutas del WebService usadas en este módulo (relativas a la URL base).
const RUTAS = {
  leeControladores: '/Medidores/leeControladores',
  leerConfiguracion: '/Medidores/Configuracion', // Provisional (LeerSetpoints)
  guardarConfiguracion: '/Medidores/Configuracion', // Provisional (ProgramarsetPoints)
}

/**
 * Convierte un registro "ID|NUMERO_DE_SERIE|TIPO_COMUNICACION|DIRECCION_IP|
 * DESCRIPCION|FECHA_REGISTRO|FECHA_CORTE|FASES|CANALES|TIPO_DISPO|MEDICION"
 * en un objeto con nombres de propiedad legibles.
 */
function parsearControlador(registro) {
  const [
    id,
    numeroSerie,
    tipoComunicacion,
    direccionIP,
    descripcion,
    fechaRegistro,
    fechaCorte,
    fases,
    canales,
    tipoDispositivo,
    medicion,
  ] = registro.split('|').map((campo) => campo.trim())

  return {
    id,
    numeroSerie,
    tipoComunicacion,
    direccionIP,
    descripcion,
    fechaRegistro,
    fechaCorte,
    fases: Number(fases),
    canales: Number(canales),
    tipoDispositivo,
    medicion,
  }
}

/**
 * Obtiene el catálogo de controladores (medidores) desde el WebService.
 *
 * La posición 2 del DTO puede venir como:
 *  - un arreglo de cadenas (un registro por elemento), o
 *  - una sola cadena con uno o varios registros separados por salto de línea.
 * Se contemplan ambos casos para no depender del formato exacto.
 *
 * @returns {Promise<Array<object>>}
 */
export async function leeControladores({ signal } = {}) {
  const { datos } = await apiGet(RUTAS.leeControladores, { signal })

  const registros = Array.isArray(datos) ? datos : String(datos ?? '').split(/\r?\n/)

  return registros.filter((r) => r && r.trim() !== '').map(parsearControlador)
}

/**
 * Lee la configuración de comunicaciones actual de un medidor.
 * Se espera que la posición 2 del DTO traiga un objeto JSON con los campos
 * del formulario (ver CONFIG_COMS_DEFAULT en ConfiguracionComunicaciones.jsx).
 *
 * @param {string|number} idMedidor - Identificador del medidor (dirRed).
 */
export async function leerConfiguracionComs(idMedidor, { signal } = {}) {
  const { datos } = await apiGet(
    `${RUTAS.leerConfiguracion}?id=${encodeURIComponent(idMedidor)}`,
    { signal },
  )
  return datos
}

/**
 * Envía (programa) la configuración de comunicaciones de un medidor.
 * Solo debe invocarse desde la UI cuando el usuario es Administrador.
 *
 * @param {string|number} idMedidor - Identificador del medidor (dirRed).
 * @param {object} configuracion - Objeto con los valores del formulario.
 * @returns {Promise<string>} Mensaje de confirmación del WebService.
 */
export async function guardarConfiguracionComs(idMedidor, configuracion) {
  const { mensaje } = await apiPost(RUTAS.guardarConfiguracion, {
    id: idMedidor,
    ...configuracion,
  })
  return mensaje
}
