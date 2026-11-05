/**
 * conexionMedidorService.js
 * ---------------------------------------------------------------------------
 * Conexión con un medidor a través del backend (rama `Medidores`):
 *
 *   POST /ConexionMedidor/conectar  { dirRed, tipoTransporte }
 *     -> 200 { conectado: true,  mensaje }   conexión establecida
 *     -> 503 { conectado: false, mensaje }   el medidor no respondió
 *
 * Solo lo pueden usar el SuperAdministrador y el Administrador (el backend
 * responde 403 a los demás). Los parámetros de cada transporte (puerto COM,
 * baudios, IP, puerto, timeout) no se envían: el backend los lee de su
 * archivo Jsons/TransporteConfig.json.
 */
import { apiPost } from './api'

// Tipos de transporte que acepta el backend (campo `tipoTransporte`).
export const TIPOS_TRANSPORTE = [
  { valor: 1, texto: 'Serial' },
  { valor: 2, texto: 'Ethernet' },
]

/**
 * Pide al backend que conecte con el medidor por el transporte elegido.
 *
 * @param {number} dirRed - Dirección de red del medidor.
 * @param {number} tipoTransporte - 1 serial, 2 Ethernet.
 * @param {object} [opciones]
 * @param {AbortSignal} [opciones.signal] - Para cancelar si el usuario sale de la vista.
 * @returns {Promise<string>} Mensaje de confirmación del backend.
 * @throws {ApiError} Si no se pudo conectar (503) o la petición falló.
 */
export async function conectarMedidor(dirRed, tipoTransporte, { signal } = {}) {
  const respuesta = await apiPost(
    '/ConexionMedidor/conectar',
    { dirRed: Number(dirRed), tipoTransporte },
    { signal },
  )
  return respuesta?.mensaje ?? 'Conexión establecida.'
}
