/**
 * api.js
 * ---------------------------------------------------------------------------
 * Cliente HTTP base para comunicarse con el WebService/API RESTful de .NET
 * (MedicionPQ, INEEL).
 *
 * Rol en el sistema:
 * - Centraliza la URL base y la forma de hacer peticiones (fetch), para que
 *   los componentes de React nunca armen URLs ni lean respuestas "a mano".
 * - Adjunta el token JWT de la sesión en el encabezado Authorization.
 * - Normaliza los errores: la API responde JSON normal y usa códigos HTTP
 *   (400 validación, 401 sin sesión, 403 sin permiso, 404 no encontrado),
 *   con el detalle en `{ mensaje }` o `{ message }`. Ese mensaje se lanza
 *   como ApiError.
 * - El usuario final nunca ve rutas, parámetros ni códigos HTTP: si el
 *   backend no manda un mensaje, o si el error es del servidor (500, 502,
 *   504) o de red, se muestra un texto comprensible y el detalle técnico se
 *   deja en la consola del navegador para quien dé soporte.
 *
 * URL base:
 * En desarrollo se usa la ruta relativa "/api", que el proxy de Vite
 * (vite.config.js) redirige al backend. Así se evitan problemas de CORS.
 * Puede sobreescribirse con la variable de entorno VITE_API_URL (por ejemplo
 * en un archivo .env.production).
 */

// URL base de la API. Si no se define VITE_API_URL, se usa el proxy de Vite.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

// Clave de sessionStorage donde authService.js guarda el token JWT del login.
export const TOKEN_KEY = 'sismedia_token'

// Mensajes por defecto cuando el backend no envía `mensaje` / `message`.
const MENSAJES_HTTP = {
  400: 'Los datos enviados no son válidos. Revísalos e intenta de nuevo.',
  401: 'La sesión expiró o no es válida. Vuelve a iniciar sesión.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No se encontró la información solicitada.',
  503: 'El servicio no está disponible en este momento. Intenta de nuevo en unos minutos.',
}

// Errores internos del servidor o del proxy: aunque traigan texto, suele ser
// técnico (o la página de error de ASP.NET en desarrollo), así que siempre se
// muestra este mensaje.
const STATUS_ERROR_SERVIDOR = new Set([500, 502, 504])
const MENSAJE_ERROR_SERVIDOR =
  'No fue posible completar la operación porque el servidor no respondió correctamente. ' +
  'Intenta de nuevo en unos minutos; si el problema continúa, avisa al administrador del sistema.'

// Sin conexión con el servidor (red caída, API apagada, CORS).
const MENSAJE_SIN_CONEXION =
  'No fue posible conectar con el servidor. Verifica tu conexión e intenta de nuevo.'

// Último recurso para códigos que no tienen mensaje propio.
const MENSAJE_GENERICO =
  'Ocurrió un error inesperado. Intenta de nuevo; si el problema continúa, avisa al administrador del sistema.'

/**
 * Error propio de la API: permite distinguir en los componentes un error
 * reportado por el WebService de un error de red.
 */
export class ApiError extends Error {
  constructor(mensaje, { httpStatus = null, datos = null } = {}) {
    super(mensaje)
    this.name = 'ApiError'
    this.httpStatus = httpStatus // Código HTTP (400, 401, 404, ...), si aplica.
    // Cuerpo JSON de la respuesta de error, si lo hubo (p. ej. una lectura
    // parcial que el backend devuelve con 503).
    this.datos = datos
  }
}

/**
 * Petición genérica al WebService. Arma la URL, serializa el cuerpo a JSON,
 * adjunta el token y devuelve el JSON de la respuesta.
 *
 * @param {string} ruta - Ruta relativa, por ejemplo "/Medidores".
 * @param {object} [opciones]
 * @param {string} [opciones.method='GET'] - Verbo HTTP.
 * @param {object} [opciones.body] - Objeto que se enviará como JSON.
 * @param {AbortSignal} [opciones.signal] - Para cancelar la petición al desmontar el componente.
 * @returns {Promise<any>} Cuerpo JSON de la respuesta (null si viene vacío).
 */
export async function peticion(ruta, { method = 'GET', body, signal } = {}) {
  let res
  try {
    // Si hay sesión iniciada, se adjunta el token JWT para los endpoints protegidos.
    const token = sessionStorage.getItem(TOKEN_KEY)
    res = await fetch(`${API_BASE_URL}${ruta}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    // Si el componente canceló la petición, se propaga tal cual para que
    // el componente la ignore (no es un error real para el usuario).
    if (err.name === 'AbortError') throw err
    console.error(`[api] Sin conexión: ${method} ${API_BASE_URL}${ruta}`, err)
    throw new ApiError(MENSAJE_SIN_CONEXION)
  }

  // Algunas respuestas (p. ej. 401 de [Authorize]) llegan sin cuerpo.
  const texto = await res.text()
  let datos
  try {
    datos = texto ? JSON.parse(texto) : null
  } catch {
    datos = null
  }

  if (!res.ok) {
    // Detalle técnico solo para soporte (consola del navegador).
    const registrar = res.status >= 500 ? console.error : console.warn
    registrar(`[api] ${method} ${API_BASE_URL}${ruta} -> HTTP ${res.status}`, datos ?? texto)

    let mensaje
    if (STATUS_ERROR_SERVIDOR.has(res.status)) {
      mensaje = MENSAJE_ERROR_SERVIDOR
    } else {
      // Errores de validación automáticos de ASP.NET: { title, errors: { Campo: [msg] } }
      const erroresValidacion = datos?.errors && Object.values(datos.errors).flat().join(' ')
      // El backend manda el detalle en `mensaje` o en `message`.
      mensaje =
        datos?.mensaje ||
        datos?.message ||
        erroresValidacion ||
        MENSAJES_HTTP[res.status] ||
        MENSAJE_GENERICO
    }
    throw new ApiError(mensaje, { httpStatus: res.status, datos })
  }

  return datos
}

// Atajos de conveniencia para los verbos más usados.
export const apiGet = (ruta, opciones) => peticion(ruta, { ...opciones, method: 'GET' })
export const apiPost = (ruta, body, opciones) =>
  peticion(ruta, { ...opciones, method: 'POST', body })
export const apiPut = (ruta, body, opciones) =>
  peticion(ruta, { ...opciones, method: 'PUT', body })
