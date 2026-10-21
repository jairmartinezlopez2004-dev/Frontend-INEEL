/**
 * usuariosService.js
 * ---------------------------------------------------------------------------
 * Funciones de acceso al WebService para la administración de usuarios
 * (controlador UsersController del backend). Todos los endpoints requieren
 * sesión de un usuario con rol Administrador; si no, el backend responde 401/403.
 *
 * Endpoints:
 *   GET  /Users         -> lista de todos los usuarios
 *   POST /Users         -> alta { correo, contrasena, nombreUsuario, rol }
 *   PUT  /Users/{id}    -> edición { correo, nombreUsuario, rol, edo, tiempoSesion }
 *                          (no cambia la contraseña; la baja es con edo = false)
 *   PUT  /Users/{id}/contrasena -> restablecimiento { nuevaContrasena }
 *
 * El backend maneja el rol como número (enum TipoRol: 1 = Administrador,
 * 2 = Usuario). Aquí se traduce a texto para la UI y de vuelta a número al
 * enviarlo, para que los componentes solo trabajen con 'Administrador' | 'Usuario'.
 */
import { apiGet, apiPost, apiPut } from './api'

// Ruta del WebService usada en este módulo (relativa a la URL base).
const RUTA = '/Users'

// Enum TipoRol del backend.
const ROL_A_NUMERO = { Administrador: 1, Usuario: 2 }
const NUMERO_A_ROL = { 1: 'Administrador', 2: 'Usuario' }

// Roles disponibles para los <select> de la UI.
export const ROLES = Object.keys(ROL_A_NUMERO)

/**
 * Normaliza un usuario del backend. `rol` puede llegar como número (1/2) o
 * como texto si el backend activa la serialización de enums como string.
 */
function parsearUsuario(u) {
  return {
    id: u.idUsuario,
    correo: u.correo,
    nombreUsuario: u.nombreUsuario,
    rol: NUMERO_A_ROL[u.rol] ?? u.rol,
    activo: u.edo,
    tiempoSesion: u.tiempoSesion,
  }
}

/**
 * Lista todos los usuarios del sistema (sin contraseñas).
 * @returns {Promise<Array<{ id, correo, nombreUsuario, rol, activo, tiempoSesion }>>}
 */
export async function listarUsuarios({ signal } = {}) {
  const usuarios = await apiGet(RUTA, { signal })
  return usuarios.map(parsearUsuario)
}

/**
 * Da de alta un usuario. La contraseña debe tener exactamente 8 caracteres
 * (el backend valida el mínimo de 8; el máximo de 8 lo limita el formulario).
 * @param {{ correo: string, contrasena: string, nombreUsuario: string, rol: 'Administrador'|'Usuario' }} datos
 * @returns {Promise<object>} Usuario creado (misma forma que listarUsuarios).
 */
export async function crearUsuario({ correo, contrasena, nombreUsuario, rol }) {
  const creado = await apiPost(RUTA, {
    correo,
    contrasena,
    nombreUsuario,
    rol: ROL_A_NUMERO[rol],
  })
  return parsearUsuario(creado)
}

/**
 * Actualiza un usuario existente (no modifica la contraseña).
 * @param {number} id
 * @param {{ correo: string, nombreUsuario: string, rol: 'Administrador'|'Usuario', activo: boolean, tiempoSesion: number }} datos
 * @returns {Promise<object>} Usuario actualizado (misma forma que listarUsuarios).
 */
export async function actualizarUsuario(id, { correo, nombreUsuario, rol, activo, tiempoSesion }) {
  const actualizado = await apiPut(`${RUTA}/${id}`, {
    correo,
    nombreUsuario,
    rol: ROL_A_NUMERO[rol],
    edo: activo,
    tiempoSesion,
  })
  return parsearUsuario(actualizado)
}

/**
 * Asigna una contraseña nueva a un usuario (por ejemplo, si olvidó la suya).
 * El administrador no ve la contraseña anterior: el backend solo guarda su hash.
 * @param {number} id
 * @param {string} nuevaContrasena - Exactamente 8 caracteres (mismo criterio que el alta).
 * @returns {Promise<{ mensaje: string }>} Mensaje de confirmación del backend.
 */
export async function restablecerContrasena(id, nuevaContrasena) {
  return apiPut(`${RUTA}/${id}/contrasena`, { nuevaContrasena })
}
