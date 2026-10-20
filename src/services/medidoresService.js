/**
 * medidoresService.js
 * ---------------------------------------------------------------------------
 * Funciones de acceso al WebService relacionadas con los medidores QP y su
 * configuración de comunicaciones.
 *
 * Rol en el sistema:
 * Los componentes de React llaman a estas funciones y reciben objetos JS
 * ya "limpios" (DTOs del lado del frontend).
 *
 * Endpoints de medidores (backend, rama pruebas):
 *   GET  /ControladorRF[/{id}] -> cada controlador trae su lista `medidores`
 *                                 (no existe un GET propio de medidores; ver
 *                                 controladoresRFService.js, que usa parsearMedidor)
 *   POST /MedidoresQP          -> alta   (Administrador)
 *   PUT  /MedidoresQP/{id}     -> edición (Administrador; 404 si no existe)
 * Cada medidor pertenece a un único controlador RF (`idCtrlRF`), que debe
 * existir; si no, o si el estado no está en el catálogo, el backend responde 400.
 *
 * NOTA: Las rutas de configuración de comunicaciones son provisionales
 * (asumidas). Cuando el backend confirme si serán /Medidores/Configuracion o
 * los métodos LeerSetpoints / ProgramarsetPoints, solo hay que ajustar las
 * constantes RUTAS de este archivo.
 */
import { apiGet, apiPost, apiPut } from './api'

// Rutas del WebService usadas en este módulo (relativas a la URL base).
const RUTAS = {
  medidores: '/MedidoresQP',
  leerConfiguracion: '/Medidores/Configuracion', // Provisional (LeerSetpoints)
  guardarConfiguracion: '/Medidores/Configuracion', // Provisional (ProgramarsetPoints)
}

// Límites de longitud de la tabla MedidorQP (varchar en la base de datos).
export const LIMITES = { dirRF: 20, descripcion: 80, dirIP: 20 }

// Catálogo de estados (`edo`) de medidores y controladores RF que acepta el
// backend; cualquier otro valor da 400. No hay eliminación física: para dar
// de baja un equipo se edita con estado 20 y para reactivarlo, con 10.
export const ESTADOS_EQUIPO = [
  { valor: 10, texto: 'Activo' },
  { valor: 11, texto: 'En uso' },
  { valor: 20, texto: 'Inactivo' },
]

/** Texto de un estado de equipo (`edo`); "Desconocido" si no está en el catálogo. */
export function textoEstadoEquipo(edo) {
  return ESTADOS_EQUIPO.find((e) => e.valor === edo)?.texto ?? 'Desconocido'
}

/**
 * Normaliza un medidor del backend a la forma que usa la UI.
 * `controlador` (opcional) es el controlador del backend que lo contiene.
 */
export function parsearMedidor(m, controlador) {
  return {
    id: m.idMedidor,
    idCtrlRF: m.idCtrlRF,
    nombreControlador: controlador?.nombre ?? '',
    dirRed: m.dirRed,
    dirRF: m.dirRF,
    descripcion: m.descripcion,
    edo: m.edo,
    dirIP: m.dirIP,
  }
}

/** Cuerpo que esperan el POST y el PUT. */
function aCuerpo({ idCtrlRF, dirRed, dirRF, descripcion, edo, dirIP }) {
  return {
    idCtrlRF,
    dirRed,
    dirRF: dirRF.trim(),
    descripcion: descripcion.trim(),
    edo,
    dirIP: dirIP.trim(),
  }
}

/**
 * Registra un medidor QP (solo Administrador).
 * @param {{ idCtrlRF: number, dirRed: number, dirRF: string, descripcion: string, edo: number, dirIP: string }} datos
 */
export async function crearMedidor(datos) {
  return parsearMedidor(await apiPost(RUTAS.medidores, aCuerpo(datos)))
}

/**
 * Actualiza todos los campos editables de un medidor QP (solo Administrador).
 * @param {number} id - idMedidor.
 * @param {object} datos - Mismos campos que crearMedidor.
 */
export async function actualizarMedidor(id, datos) {
  return parsearMedidor(await apiPut(`${RUTAS.medidores}/${id}`, aCuerpo(datos)))
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
