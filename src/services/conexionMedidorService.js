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
