/**
 * unidadesService.js
 * ---------------------------------------------------------------------------
 * Funciones de acceso al WebService para el catálogo de unidades de medida
 * (controlador UnidadesController del backend). Lo usan el módulo Unidades
 * y el selector de unidad de los eventos configurados.
 *
 * Endpoints:
 *   GET  /Unidades       -> lista de unidades (cualquier usuario con sesión)
 *   POST /Unidades       -> alta { simbolo, nombre, edo }  (Administrador)
 *   PUT  /Unidades/{id}  -> edición, mismos campos         (Administrador; 404 si no existe)
 *
 * No hay eliminación física: `edo` es booleano (true activo, false inactivo)
 * y la baja se hace editando la unidad como inactiva. `simbolo` puede venir
 * null en registros ya guardados (por ejemplo, "Sin Unidad (FP)"), pero el
 * backend lo exige en altas y ediciones.
 */
import { apiGet, apiPost, apiPut } from './api'

// Ruta del WebService usada en este módulo (relativa a la URL base).
const RUTA = '/Unidades'

// Límites de longitud de la tabla Unidades (varchar en la base de datos).
export const LIMITES = { simbolo: 10, nombre: 50 }

/** Normaliza una unidad del backend a la forma que usa la UI. */
function parsearUnidad(u) {
  return {
    id: u.idUnidad,
    simbolo: u.simbolo ?? '',
    nombre: u.nombre,
    activa: u.edo,
  }
}

/** Cuerpo que esperan el POST y el PUT. */
function aCuerpo({ simbolo, nombre, activa }) {
  return { simbolo: simbolo.trim(), nombre: nombre.trim(), edo: activa }
}

/**
 * Texto con el que se muestra una unidad: "V – Voltaje", o solo el nombre si
 * no tiene símbolo.
 */
export function textoUnidad(unidad) {
  return unidad.simbolo ? `${unidad.simbolo} – ${unidad.nombre}` : unidad.nombre
}

/**
 * Lista todas las unidades, ordenadas por ID.
 * @returns {Promise<Array<{ id, simbolo, nombre, activa }>>}
 */
export async function listarUnidades({ signal } = {}) {
  const unidades = await apiGet(RUTA, { signal })
  return unidades.map(parsearUnidad).sort((a, b) => a.id - b.id)
}

/**
 * Registra una unidad (solo Administrador).
 * @param {{ simbolo: string, nombre: string, activa: boolean }} datos
 * @returns {Promise<object>} Unidad creada.
 */
export async function crearUnidad(datos) {
  return parsearUnidad(await apiPost(RUTA, aCuerpo(datos)))
}

/**
 * Actualiza una unidad existente (solo Administrador).
 * @param {number} id
 * @param {{ simbolo: string, nombre: string, activa: boolean }} datos
 * @returns {Promise<object>} Unidad actualizada.
 */
export async function actualizarUnidad(id, datos) {
  return parsearUnidad(await apiPut(`${RUTA}/${id}`, aCuerpo(datos)))
}
