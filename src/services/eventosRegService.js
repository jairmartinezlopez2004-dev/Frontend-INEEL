/**
 * eventosRegService.js
 * ---------------------------------------------------------------------------
 * Funciones de acceso al WebService para los registros de eventos
 * (controlador EventosRegController del backend): el historial de los
 * eventos configurados que han ocurrido, con el medidor y controlador RF
 * donde sucedieron, la fecha y el consumo.
 *
 * Endpoints usados:
 *   GET /EventosReg -> lista (cualquier usuario con sesión)
 *
 * Los registros los genera el sistema cuando ocurre un evento, así que la UI
 * solo los consulta (el backend también expone POST y PUT para el rol
 * Administrador, pero no se usan aquí). `fecha` llega como texto ISO
 * "yyyy-MM-dd".
 */
import { apiGet } from './api'

// Ruta del WebService usada en este módulo (relativa a la URL base).
const RUTA = '/EventosReg'

/** Normaliza un registro del backend a la forma que usa la UI. */
function parsearRegistro(r) {
  return {
    idMedidor: r.idMedidor,
    idCtrlRF: r.idCtrlRF,
    idEvento: r.idEvento,
    fecha: r.fecha,
    consumo: r.consumo,
  }
}

/**
 * Identificador único del registro en la UI (para `key` de React): los tres
 * IDs más la fecha forman su clave en la base de datos.
 */
export function claveRegistro(registro) {
  return `${registro.idMedidor}-${registro.idCtrlRF}-${registro.idEvento}-${registro.fecha}`
}

/**
 * Lista todos los registros, del más reciente al más antiguo.
 * @returns {Promise<Array<{ idMedidor, idCtrlRF, idEvento, fecha, consumo }>>}
 */
export async function listarRegistros({ signal } = {}) {
  const registros = await apiGet(RUTA, { signal })
  // Las fechas ISO "yyyy-MM-dd" se ordenan bien como texto.
  return registros.map(parsearRegistro).sort((a, b) => b.fecha.localeCompare(a.fecha))
}
