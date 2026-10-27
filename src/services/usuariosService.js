/**
 * usuariosService.js
 * ---------------------------------------------------------------------------
 * Funciones de acceso al WebService para la administración de usuarios
 * (controlador UsersController del backend). Todos los endpoints requieren
 * sesión de un usuario con rol Administrador; si no, el backend responde 401/403.
 *
 * Endpoints:
 *   GET  /Users         -> lista de todos los usuarios
 *   PUT  /Users/{id}    -> edición { correo, nombreUsuario, rol, edo, tiempoSesion }
 *                          (no cambia la contraseña; la baja es con edo = false)
 *
 * El backend maneja el rol como número (enum TipoRol: 1 = Administrador,
 * 2 = Usuario, 5 = SuperAdministrador). Aquí se traduce a texto para la UI y
 * de vuelta a número al enviarlo, para que los componentes solo trabajen con
 * 'SuperAdministrador' | 'Administrador' | 'Usuario'.
 */
import { apiGet, apiPut } from './api'

// Ruta del WebService usada en este módulo (relativa a la URL base).
const RUTA = '/Users'

// Enum TipoRol del backend.
const ROL_A_NUMERO = { SuperAdministrador: 5, Administrador: 1, Usuario: 2 }
const NUMERO_A_ROL = { 5: 'SuperAdministrador', 1: 'Administrador', 2: 'Usuario' }

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
 * Actualiza un usuario existente (no modifica la contraseña).
 * @param {number} id
 * @param {{ correo: string, nombreUsuario: string, rol: 'SuperAdministrador'|'Administrador'|'Usuario', activo: boolean, tiempoSesion: number }} datos
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
