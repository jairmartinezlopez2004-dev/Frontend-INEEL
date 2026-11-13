/**
 * conexionMedidorService.js
 * ---------------------------------------------------------------------------
 * Conexión con un medidor a través del backend:
 *
 *   POST /ConexionMedidor/conectar  { idMedidor }
 *     -> 200 { conectado: true,  mensaje }   conexión establecida
 *     -> 503 { conectado: false, mensaje }   el medidor no respondió
 *     -> 404 { mensaje }                     no existe el medidor
 *
 * Solo lo pueden usar el SuperAdministrador y el Administrador (el backend
 * responde 403 a los demás). La conexión es por puerto serial (con RF si así
 * está configurado); el puerto COM, los baudios y el timeout no se envían: el
 * backend los lee de Jsons/TransporteConfig.json y Jsons/ProtocoloConfig.json,
 * y toma dirRed y dirRF del medidor en la base de datos.
 */
import { apiPost } from './api'

/**
 * Pide al backend que conecte con el medidor.
 *
 * @param {number} idMedidor - Identificador del medidor (MedidorQP.idMedidor).
 * @param {object} [opciones]
 * @param {AbortSignal} [opciones.signal] - Para cancelar si el usuario sale de la vista.
 * @returns {Promise<string>} Mensaje de confirmación del backend.
 * @throws {ApiError} Si no se pudo conectar (503) o la petición falló.
 */
export async function conectarMedidor(idMedidor, { signal } = {}) {
  const respuesta = await apiPost(
    '/ConexionMedidor/conectar',
    { idMedidor: Number(idMedidor) },
    { signal },
  )
  return respuesta?.mensaje ?? 'Conexión establecida.'
}

/**
 * Pide al backend que envíe al medidor la trama de sincronización: conecta
 * y, si conectó, llama a Sincronizar de la DLL con el punto (PuntosIO)
 * configurado en el servidor (Sincronizacion:Punto:IdPunto).
 *
 *   POST /ConexionMedidor/sincronizar  { idMedidor }
 *     -> 200 { conectado: true,  sincronizado: true,  mensaje }
 *     -> 503 { conectado, sincronizado: false, mensaje }  no conectó o no sincronizó
 *     -> 404 { mensaje }                                   no existe el medidor
 *
 * @param {number} idMedidor - Identificador del medidor (MedidorQP.idMedidor).
 * @param {object} [opciones]
 * @param {AbortSignal} [opciones.signal] - Para cancelar si el usuario sale de la vista.
 * @returns {Promise<string>} Mensaje de confirmación del backend.
 * @throws {ApiError} Si no se pudo conectar o sincronizar (503) o la petición falló.
 */
export async function sincronizarMedidor(idMedidor, { signal } = {}) {
  const respuesta = await apiPost(
    '/ConexionMedidor/sincronizar',
    { idMedidor: Number(idMedidor) },
    { signal },
  )
  return respuesta?.mensaje || 'Medidor sincronizado.'
}

/**
 * Pide al backend los valores instantáneos del medidor: conecta y llama a
 * SolInstT de la DLL con todos los puntos de PuntosIO del grupo funcional 1
 * (IdGF = 1). El frontend no envía la lista de puntos.
 *
 *   POST /ConexionMedidor/instantaneos  { idMedidor }
 *     -> 200 { idMedidor, conectado: true, lecturaExitosa: true, mensaje,
 *              puntos: [{ idPunto, tag, dirCCEC, dirModbus, valor }] }
 *     -> 503 { idMedidor, conectado, lecturaExitosa: false, mensaje }
 *     -> 404 { mensaje }  no existe el medidor
 *
 * `valor` es null cuando la DLL no devolvió valor para ese punto.
 *
 * @param {number} idMedidor - Identificador del medidor (MedidorQP.idMedidor).
 * @param {object} [opciones]
 * @param {AbortSignal} [opciones.signal] - Para cancelar si el usuario sale de la vista.
 * @returns {Promise<{ mensaje: string, puntos: Array<{ idPunto: number, tag: string, dirCCEC: number, dirModbus: number, valor: number|null }> }>}
 * @throws {ApiError} Si no se pudo conectar o leer (503) o la petición falló.
 */
export async function solicitarInstantaneos(idMedidor, { signal } = {}) {
  const respuesta = await apiPost(
    '/ConexionMedidor/instantaneos',
    { idMedidor: Number(idMedidor) },
    { signal },
  )
  return {
    mensaje: respuesta?.mensaje || 'Lectura de instantáneos completada.',
    puntos: Array.isArray(respuesta?.puntos) ? respuesta.puntos : [],
  }
}
