/**
 * eventosConfigService.js
 * ---------------------------------------------------------------------------
 * Funciones de acceso al WebService para los eventos configurados
 * (controlador EventosConfigController del backend). Todos los endpoints
 * requieren sesión; el alta y la edición además requieren rol Administrador
 * (si no, el backend responde 403).
 *
 * Endpoints:
 *   GET    /EventosConfig       -> lista de eventos (cualquier usuario)
 *   GET    /EventosConfig/{id}  -> detalle (404 si no existe)
 *   POST   /EventosConfig       -> alta { descripcion, numEvento, edo, idUnidad }  (Administrador)
 *   PUT    /EventosConfig/{id}  -> edición, mismos campos                        (Administrador)
 *
 * No hay eliminación física: `edo` es booleano (true activo, false inactivo)
 * y la baja se hace editando el evento como inactivo. `idUnidad` debe existir
 * en el catálogo de unidades (ver unidadesService.js); si no, el backend
 * responde 400 "La unidad indicada no existe."
 */
import { apiGet, apiPost, apiPut } from './api'

// Ruta del WebService usada en este módulo (relativa a la URL base).
const RUTA = '/EventosConfig'

// Límite de longitud de la tabla EventosConfig (varchar en la base de datos).
export const LIMITES = { descripcion: 100 }

/** Normaliza un evento del backend a la forma que usa la UI. */
function parsearEvento(e) {
  return {
    id: e.idEvento,
    descripcion: e.descripcion,
    numEvento: e.numEvento,
    activo: e.edo,
    idUnidad: e.idUnidad,
  }
}

/** Cuerpo que esperan el POST y el PUT. */
function aCuerpo({ descripcion, numEvento, activo, idUnidad }) {
  return { descripcion: descripcion.trim(), numEvento, edo: activo, idUnidad }
}

/**
 * Lista todos los eventos configurados, ordenados por número de evento.
 * @returns {Promise<Array<{ id, descripcion, numEvento, activo, idUnidad }>>}
 */
export async function listarEventos({ signal } = {}) {
  const eventos = await apiGet(RUTA, { signal })
  return eventos.map(parsearEvento).sort((a, b) => a.numEvento - b.numEvento)
}

/**
 * Registra un evento (solo Administrador).
 * @param {{ descripcion: string, numEvento: number, activo: boolean, idUnidad: number }} datos
 * @returns {Promise<object>} Evento creado.
 */
export async function crearEvento(datos) {
  return parsearEvento(await apiPost(RUTA, aCuerpo(datos)))
}

/**
 * Actualiza un evento existente (solo Administrador).
 * @param {number} id
 * @param {{ descripcion: string, numEvento: number, activo: boolean, idUnidad: number }} datos
 * @returns {Promise<object>} Evento actualizado.
 */
export async function actualizarEvento(id, datos) {
  return parsearEvento(await apiPut(`${RUTA}/${id}`, aCuerpo(datos)))
}
