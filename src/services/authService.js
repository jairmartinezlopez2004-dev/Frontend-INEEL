/**
 * authService.js
 * ---------------------------------------------------------------------------
 * Autenticación contra el WebService (.NET) del visor.
 *
 * Rol en el sistema:
 * - Envía las credenciales a POST /Auth/login y guarda el token JWT en
 *   sessionStorage para que api.js lo adjunte en el encabezado Authorization.
 * - Arma el objeto de usuario que usa la UI ({ nombre, apellido, rolId, rol,
 *   iniciales }) a partir de los datos (claims) que viajan DENTRO del token.
 *   Así no depende de qué campos mande la respuesta del login, que cambió
 *   entre versiones del backend (main manda nombre y rol; la rama pruebas
 *   solo { mensaje, token, idUsuario }).
 * - Al recargar la página, recupera la sesión si el token sigue vigente.
 * - Extiende la sesión (POST /Auth/renew) y expone cuánto le queda
 *   al token, para el aviso de expiración (AvisoExpiracionSesion.jsx).
 */
import { apiGet, apiPost, ApiError, TOKEN_KEY } from './api'

// Equivalencia entre el nombre de rol del backend y el rolId que usa la UI.
const ROL_IDS = {
  SuperAdministrador: 1,
  Administrador: 2,
  Usuario: 3,
}

// Nombres de los claims estándar de .NET (ClaimTypes) dentro del JWT.
const CLAIMS = {
  id: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  correo: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  nombre: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  rol: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
}

/**
 * Lee el payload de un JWT (la parte central, en base64url). No verifica la
 * firma: eso lo hace el backend en cada petición.
 * @returns {object|null} Payload, o null si el token no tiene formato válido.
 */
function leerPayloadToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    // TextDecoder para respetar acentos y ñ en el nombre del usuario.
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

/** true si el token ya pasó su fecha de expiración (claim `exp`, en segundos). */
function tokenExpirado(payload) {
  return !payload?.exp || payload.exp * 1000 <= Date.now()
}

/** Iniciales para el avatar del Header, p. ej. "Admin Local" -> "AL". */
function obtenerIniciales(nombreCompleto) {
  return nombreCompleto
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join('')
}

/** Convierte el payload del JWT en el objeto de usuario que usa la UI. */
function aUsuarioUI(payload) {
  const correo = payload[CLAIMS.correo] ?? ''
  const nombreCompleto = payload[CLAIMS.nombre] || correo
  const [nombre = '', ...resto] = nombreCompleto.split(/\s+/)
  const rol = payload[CLAIMS.rol] ?? ''

  return {
    id: Number(payload[CLAIMS.id]),
    correo,
    nombre,
    apellido: resto.join(' '),
    rol,
    rolId: ROL_IDS[rol] ?? null,
    iniciales: obtenerIniciales(nombreCompleto || '?'),
  }
}

/**
 * Inicia sesión con el correo o el nombre de usuario, y la contraseña.
 * El backend decide cuál es: si lleva "@" busca por correo; si no, por nombre
 * de usuario (sin importar mayúsculas ni espacios de más).
 *
 * @param {string} cuenta - Correo o nombre de usuario.
 * @param {string} contrasena
 * @returns {Promise<object>} Usuario listo para guardarse en App.jsx.
 * @throws {ApiError} Si las credenciales son incorrectas o no hay conexión.
 */
export async function iniciarSesion(cuenta, contrasena) {
  const { token } = await apiPost('/Auth/login', { usuario: cuenta, contrasena })
  return guardarToken(token)
}

/**
 * Registra una cuenta nueva con POST /Auth/register. El backend siempre le
 * asigna el rol Usuario, la deja inactiva y no inicia sesión: la persona entra
 * con el Login cuando un Administrador o SuperAdministrador la activa.
 *
 * @param {{ nombreUsuario: string, correo: string, contrasena: string }} datos
 * @returns {Promise<object>} Respuesta del backend ({ mensaje, usuario }).
 * @throws {ApiError} Si el correo ya existe (409), los datos no son válidos (400) o no hay conexión.
 */
export function registrarCuenta({ nombreUsuario, correo, contrasena }) {
  return apiPost('/Auth/register', { nombreUsuario, correo, contrasena })
}

/**
 * Pide un código de verificación para cambiar la contraseña con
 * POST /Contrasena/solicitar-codigo. Es público (no requiere sesión).
 * El backend envía un código de 6 dígitos al correo si pertenece a una cuenta
 * activa, y siempre responde lo mismo para no revelar qué cuentas existen.
 * El código vence en 15 minutos; no se puede pedir otro antes de 60 segundos.
 *
 * @param {string} correo
 * @returns {Promise<object>} Respuesta del backend ({ mensaje }).
 * @throws {ApiError} Si el correo no es válido (400) o no hay conexión.
 */
export function solicitarCodigoContrasena(correo) {
  return apiPost('/Contrasena/solicitar-codigo', { correo })
}

/**
 * Comprueba el código de verificación sin gastarlo
 * (POST /Contrasena/verificar-codigo). Es público. Un código incorrecto cuenta
 * como intento fallido (a los 5 el backend lo invalida). El código se vuelve a
 * enviar después a /Contrasena/restablecer, que lo valida otra vez.
 *
 * @param {{ correo: string, codigo: string }} datos
 * @returns {Promise<object>} Respuesta del backend ({ mensaje }).
 * @throws {ApiError} 400 si el código es incorrecto o venció; 404 si el
 *   backend todavía no publica este servicio.
 */
export function verificarCodigoContrasena({ correo, codigo }) {
  return apiPost('/Contrasena/verificar-codigo', { correo, codigo })
}

/**
 * Cambia la contraseña con el código de verificación recibido por correo
 * (POST /Contrasena/restablecer). Es público (no requiere sesión) y aplica
 * igual a Usuario, Administrador y SuperAdministrador.
 *
 * @param {{ correo: string, codigo: string, nuevaContrasena: string }} datos
 * @returns {Promise<object>} Respuesta del backend ({ mensaje }).
 * @throws {ApiError} Si el código es incorrecto o venció, la contraseña no
 *   cumple la política o es igual a la actual (400), o no hay conexión.
 */
export function restablecerContrasena({ correo, codigo, nuevaContrasena }) {
  return apiPost('/Contrasena/restablecer', { correo, codigo, nuevaContrasena })
}

/**
 * Extiende la sesión: pide un token nuevo con POST /Auth/renew.
 * El backend lo genera con el `tiempoSesion` del usuario en la base de datos
 * (60 minutos por defecto). Solo funciona mientras el token actual siga vigente.
 *
 * @returns {Promise<object>} Usuario (con los datos del token nuevo).
 * @throws {ApiError} Si el backend no pudo renovar la sesión.
 */
export async function renovarSesion() {
  const { token } = await apiPost('/Auth/renew')
  return guardarToken(token)
}

/** Valida y guarda el token recibido; devuelve el usuario para la UI. */
function guardarToken(token) {
  const payload = token && leerPayloadToken(token)
  if (!payload) throw new ApiError('El WebService devolvió un token inválido.')

  sessionStorage.setItem(TOKEN_KEY, token)
  return aUsuarioUI(payload)
}

/**
 * Segundos que le quedan al token guardado antes de expirar (claim `exp`).
 * @returns {number} 0 si no hay token o ya expiró.
 */
export function segundosRestantesSesion() {
  const payload = leerPayloadToken(sessionStorage.getItem(TOKEN_KEY) ?? '')
  if (!payload?.exp) return 0
  return Math.max(0, Math.floor((payload.exp * 1000 - Date.now()) / 1000))
}

/**
 * Recupera la sesión al recargar la página. Si hay un token guardado y no ha
 * expirado, lo valida con GET /Auth/perfil. Si el backend ya no tiene ese
 * endpoint (404), se confía en el token: cualquier petición posterior con un
 * token inválido responderá 401.
 *
 * @returns {Promise<object|null>} Usuario de la sesión, o null si no hay sesión válida.
 */
export async function restaurarSesion() {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const payload = token && leerPayloadToken(token)

  if (!payload || tokenExpirado(payload)) {
    cerrarSesion()
    return null
  }

  try {
    await apiGet('/Auth/perfil')
  } catch (err) {
    if (err.httpStatus !== 404) {
      cerrarSesion()
      return null
    }
  }

  return aUsuarioUI(payload)
}

/** Elimina el token guardado de la sesión. */
export function cerrarSesion() {
  sessionStorage.removeItem(TOKEN_KEY)
}
