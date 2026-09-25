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

// Mensajes por defecto cuando el backend no envía `message`.
const MENSAJES_HTTP = {
  401: 'La sesión expiró o no es válida. Vuelve a iniciar sesión.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
}

/**
 * Error propio de la API: permite distinguir en los componentes un error
 * reportado por el WebService de un error de red.
 */
export class ApiError extends Error {
  constructor(mensaje, { httpStatus = null } = {}) {
    super(mensaje)
    this.name = 'ApiError'
    this.httpStatus = httpStatus // Código HTTP (400, 401, 404, ...), si aplica.
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
    throw new ApiError('No fue posible conectar con el WebService.')
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
    // Errores de validación automáticos de ASP.NET: { title, errors: { Campo: [msg] } }
    const erroresValidacion = datos?.errors && Object.values(datos.errors).flat().join(' ')
    // El backend manda el detalle en `message` (main) o en `mensaje` (rama pruebas).
    const mensaje =
      datos?.mensaje ||
      datos?.message ||
      erroresValidacion ||
      MENSAJES_HTTP[res.status] ||
      `Error HTTP ${res.status} al consultar ${ruta}.`
    throw new ApiError(mensaje, { httpStatus: res.status })
  }

  return datos
}

// Atajos de conveniencia para los verbos más usados.
export const apiGet = (ruta, opciones) => peticion(ruta, { ...opciones, method: 'GET' })
export const apiPost = (ruta, body, opciones) =>
  peticion(ruta, { ...opciones, method: 'POST', body })
export const apiPut = (ruta, body, opciones) =>
  peticion(ruta, { ...opciones, method: 'PUT', body })
