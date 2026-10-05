/**
 * controladoresRFService.js
 * ---------------------------------------------------------------------------
 * Funciones de acceso al WebService para los controladores de radiofrecuencia
 * (controlador ControladorRFController del backend). Todos los endpoints
 * requieren sesión; el alta y la edición además requieren rol Administrador
 * (si no, el backend responde 403).
 *
 * Endpoints:
 *   GET  /ControladorRF       -> lista de controladores (cualquier usuario)
 *   GET  /ControladorRF/{id}  -> detalle (404 si no existe)
 *   POST /ControladorRF       -> alta { numSerie, dirIP, nombre, edo }   (Administrador)
 *   PUT  /ControladorRF/{id}  -> edición, mismos campos                  (Administrador)
 *
 * Los GET incluyen `medidores` (los medidores QP asociados), que se
 * normalizan con parsearMedidor de medidoresService.js. El backend no tiene
 * endpoint para eliminar controladores: la baja se hace editando con
 * `edo` = 20. `edo` usa el mismo catálogo que los medidores (ESTADOS_EQUIPO
 * en medidoresService.js: 10 activo, 11 en uso, 20 inactivo).
 */
import { apiGet, apiPost, apiPut } from './api'
import { parsearMedidor } from './medidoresService'

// Ruta del WebService usada en este módulo (relativa a la URL base).
const RUTA = '/ControladorRF'

// Límites de longitud de la tabla ControladorRF (varchar en la base de datos).
export const LIMITES = { numSerie: 20, dirIP: 20, nombre: 50 }

/** Normaliza un controlador del backend a la forma que usa la UI. */
function parsearControlador(c) {
  return {
    id: c.idCtrlRF,
    numSerie: c.numSerie,
    dirIP: c.dirIP,
    nombre: c.nombre,
    edo: c.edo,
    medidores: (c.medidores ?? [])
      .map((m) => parsearMedidor(m, c))
      .sort((a, b) => a.dirRed - b.dirRed),
  }
}

/** Cuerpo que esperan el POST y el PUT. */
function aCuerpo({ numSerie, dirIP, nombre, edo }) {
  return { numSerie: numSerie.trim(), dirIP: dirIP.trim(), nombre: nombre.trim(), edo }
}

/**
 * Lista todos los controladores RF.
 * @returns {Promise<Array<{ id, numSerie, dirIP, nombre, edo, medidores }>>}
 */
export async function listarControladoresRF({ signal } = {}) {
  const controladores = await apiGet(RUTA, { signal })
  return controladores.map(parsearControlador)
}

/**
 * Consulta el detalle de un controlador RF.
 * @param {number} id
 * @returns {Promise<object>} Misma forma que listarControladoresRF (incluye sus medidores).
 */
export async function obtenerControladorRF(id, { signal } = {}) {
  return parsearControlador(await apiGet(`${RUTA}/${id}`, { signal }))
}

/**
 * Registra un controlador RF (solo Administrador).
 * @param {{ numSerie: string, dirIP: string, nombre: string, edo: number }} datos
 * @returns {Promise<object>} Controlador creado.
 */
export async function crearControladorRF(datos) {
  return parsearControlador(await apiPost(RUTA, aCuerpo(datos)))
}

/**
 * Actualiza un controlador RF existente (solo Administrador).
 * @param {number} id
 * @param {{ numSerie: string, dirIP: string, nombre: string, edo: number }} datos
 * @returns {Promise<object>} Controlador actualizado.
 */
export async function actualizarControladorRF(id, datos) {
  return parsearControlador(await apiPut(`${RUTA}/${id}`, aCuerpo(datos)))
}
