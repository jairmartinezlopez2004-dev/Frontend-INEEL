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
import { ApiError, apiPost } from './api'

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
 * Rutas de lectura por grupo funcional (PuntosIO.IdGF) y el método de la DLL
 * que usa el backend en cada una. Todas reciben { idMedidor } y leen todos
 * los puntos activos (Edo = 1) del grupo; el frontend no envía la lista.
 */
export const GRUPOS_LECTURA = {
  instantaneos: { idGF: 1, descripcion: 'instantáneos' }, // SolInstT
  variables5min: { idGF: 2, descripcion: 'variables 5 minutales' }, // SolUV5M
  consumos: { idGF: 3, descripcion: 'consumos' }, // SolConsumos
  calidadpotencia: { idGF: 5, descripcion: 'calidad de la potencia' }, // SolCalPot
}

/**
 * Pide al backend la lectura en línea de un grupo de puntos del medidor:
 * conecta y llama al método de la DLL que corresponde al grupo.
 *
 *   POST /ConexionMedidor/<grupo>  { idMedidor }
 *     -> 200 { idMedidor, idGF, conectado: true, lecturaExitosa: true, mensaje,
 *              puntos: [{ idPunto, tag, dirCCEC, dirModbus, valor }] }
 *     -> 503 { idMedidor, idGF, conectado, lecturaExitosa: false, mensaje }
 *            no conectó, no leyó, no hay puntos activos o el puerto estuvo
 *            ocupado más de 30 s (conviene reintentar)
 *     -> 404 { mensaje }  no existe el medidor
 *
 * `valor` es null cuando la DLL no devolvió valor para ese punto.
 *
 * @param {keyof GRUPOS_LECTURA} grupo - 'instantaneos', 'variables5min', 'consumos' o 'calidadpotencia'.
 * @param {number} idMedidor - Identificador del medidor (MedidorQP.idMedidor).
 * @param {object} [opciones]
 * @param {AbortSignal} [opciones.signal] - Para cancelar si el usuario sale de la vista.
 * @returns {Promise<{ mensaje: string, puntos: Array<{ idPunto: number, tag: string, dirCCEC: number, dirModbus: number, valor: number|null }> }>}
 * @throws {ApiError} Si no se pudo conectar o leer (503) o la petición falló.
 */
export async function solicitarLecturaGrupo(grupo, idMedidor, { signal } = {}) {
  if (!GRUPOS_LECTURA[grupo]) throw new Error(`Grupo de lectura desconocido: ${grupo}`)
  const respuesta = await apiPost(
    `/ConexionMedidor/${grupo}`,
    { idMedidor: Number(idMedidor) },
    { signal },
  )
  return {
    mensaje: respuesta?.mensaje || `Lectura de ${GRUPOS_LECTURA[grupo].descripcion} completada.`,
    puntos: Array.isArray(respuesta?.puntos) ? respuesta.puntos : [],
  }
}

/**
 * Pide al backend los armónicos del medidor: conecta y llama a SolArmonicos
 * de la DLL una vez por cada punto activo del grupo funcional 6 (ARM_VA,
 * ARM_VB, ARM_VC de voltaje y ARM_IA, ARM_IB, ARM_IC de corriente). Una sola
 * solicitud trae voltaje y corriente de las tres fases.
 *
 *   POST /ConexionMedidor/armonicos  { idMedidor }
 *     -> 200 { idMedidor, idGF: 6, conectado: true, lecturaExitosa: true, mensaje,
 *              puntos: [{ fase, nombreFase, tipo: 'V'|'I', idPunto, tag,
 *                         dirCCEC, dirModbus, exitosa, valores: number[] }] }
 *     -> 503 lo mismo con lecturaExitosa: false: no conectó, no hay puntos, el
 *            puerto estuvo ocupado o algún punto falló (ese punto llega con
 *            exitosa: false y valores: [], los demás sí traen sus valores)
 *     -> 404 { mensaje }  no existe el medidor
 *
 * `puntos` llega ordenado por fase (A, B, C) y, en cada fase, voltaje antes
 * que corriente; `valores` conserva el orden en que la DLL los entrega.
 *
 * @param {number} idMedidor - Identificador del medidor (MedidorQP.idMedidor).
 * @param {object} [opciones]
 * @param {AbortSignal} [opciones.signal] - Para cancelar si el usuario sale de la vista.
 * @returns {Promise<{ mensaje: string, completa: boolean, puntos: Array<object> }>}
 *   `completa` es false cuando el backend respondió 503 pero algún punto sí se
 *   leyó: se devuelven esos puntos junto con el mensaje de lo que falló.
 * @throws {ApiError} Si no se leyó ningún punto o la petición falló.
 */
export async function solicitarArmonicos(idMedidor, { signal } = {}) {
  try {
    const respuesta = await apiPost('/ConexionMedidor/armonicos', { idMedidor: Number(idMedidor) }, { signal })
    return {
      mensaje: respuesta?.mensaje || 'Lectura de armónicos completada.',
      completa: true,
      puntos: Array.isArray(respuesta?.puntos) ? respuesta.puntos : [],
    }
  } catch (err) {
    // Lectura parcial: 503 con algunos puntos leídos. Se conservan esos puntos.
    const puntos = err instanceof ApiError && Array.isArray(err.datos?.puntos) ? err.datos.puntos : []
    if (err.httpStatus === 503 && puntos.some((p) => p.exitosa)) {
      return { mensaje: err.datos?.mensaje || err.message, completa: false, puntos }
    }
    throw err
  }
}

/**
 * Lee los fasores del medidor: POST /ConexionMedidor/fasores { idMedidor }.
 * El backend lee en una sola conexión VA..VC, IA..IC, FPA..FPC, PA..PC y
 * PRA..PRC, y devuelve por fase (A, B, C) el voltaje (V), la corriente (A),
 * el factor de potencia (ya entre -1 y 1), φ (anguloFactorPotencia), el
 * cuadrante, el tipo de carga y los ángulos del diagrama (anguloVoltaje y
 * anguloCorriente, en grados, de 0 a 360, crecen en sentido horario con 0° a
 * la derecha: VA 0°, VB 120°, VC 240°), además de potenciaActiva y
 * potenciaReactiva tal como las entrega la DLL, sin escalar. Lo que no
 * llegó viene en null.
 *
 * @returns {Promise<{ mensaje: string, completa: boolean, fases: object[] }>}
 *   completa = false si fue un 503 que aun así trae algún valor.
 * @throws {ApiError} Si no se leyó nada o la petición falló.
 */
export async function solicitarFasores(idMedidor, { signal } = {}) {
  try {
    const respuesta = await apiPost('/ConexionMedidor/fasores', { idMedidor: Number(idMedidor) }, { signal })
    return {
      mensaje: respuesta?.mensaje || 'Lectura de fasores completada.',
      completa: true,
      fases: Array.isArray(respuesta?.fases) ? respuesta.fases : [],
    }
  } catch (err) {
    // Lectura parcial: 503 con algunas fases o valores leídos. Se conservan.
    const fases = err instanceof ApiError && Array.isArray(err.datos?.fases) ? err.datos.fases : []
    const algunValor = fases.some((f) => [f.voltaje, f.corriente, f.factorPotencia].some((v) => v != null))
    if (err.httpStatus === 503 && algunValor) {
      return { mensaje: err.datos?.mensaje || err.message, completa: false, fases }
    }
    throw err
  }
}
