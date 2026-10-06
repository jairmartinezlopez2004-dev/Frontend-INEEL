/**
 * puntosIOService.js
 * ---------------------------------------------------------------------------
 * Funciones de acceso al WebService para los puntos de entrada/salida
 * (controlador PuntosIOController del backend) y para los catálogos de
 * grupos IO con los que se clasifican (IO_GrupoFuncional e IO_GrupoElectrico).
 *
 * Endpoints:
 *   GET /PuntosIO             -> lista de puntos IO (cualquier usuario con sesión)
 *   PUT /PuntosIO/{id}        -> edición (Administrador). El cuerpo lleva además
 *                                `contrasenaActual`: el backend vuelve a verificar
 *                                la contraseña del administrador y responde 401
 *                                si no coincide, 400 si un grupo o la unidad no
 *                                existe y 404 si el punto no existe.
 *   GET /IO_GrupoFuncional    -> grupos funcionales { idGF, nombre, edo }
 *   GET /IO_GrupoElectrico    -> grupos eléctricos  { idGE, nombre, edo }
 *
 * El backend no expone alta ni baja de puntos IO: solo consulta y edición.
 * `edo` es booleano (true activo, false inactivo).
 */
import { apiGet, apiPut } from './api'

// Ruta del WebService usada en este módulo (relativa a la URL base).
const RUTA = '/PuntosIO'

// Límites de longitud de la tabla PuntosIO (varchar en la base de datos).
export const LIMITES = { tag: 30, descripcion: 150, tipoDato: 20, tipoReg: 5 }

/** Normaliza un punto IO del backend a la forma que usa la UI. */
function parsearPunto(p) {
  return {
    id: p.idPunto,
    idGF: p.idGF,
    idGE: p.idGE,
    idUnidad: p.idUnidad,
    tag: p.tag,
    descripcion: p.descripcion ?? '',
    tipoDato: p.tipoDato,
    tipoReg: p.tipoReg,
    dirCCEC: p.dirCCEC,
    dirMB: p.dirMB,
    activo: p.edo,
    limMin: p.limMin,
    limMax: p.limMax,
  }
}

/** Normaliza un grupo IO (funcional o eléctrico) a { id, nombre, activo }. */
function parsearGrupo(id, g) {
  return { id, nombre: g.nombre ?? '', activo: g.edo }
}

/**
 * Lista todos los puntos IO, ordenados por ID.
 * @returns {Promise<Array<object>>}
 */
export async function listarPuntosIO({ signal } = {}) {
  const puntos = await apiGet(RUTA, { signal })
  return puntos.map(parsearPunto).sort((a, b) => a.id - b.id)
}

/**
 * Actualiza un punto IO (solo Administrador). Los números ya deben venir
 * convertidos a Number.
 * @param {number} id
 * @param {object} datos - Campos editables del punto (forma de parsearPunto, sin id).
 * @param {string} contrasenaActual - Contraseña del administrador con sesión.
 * @returns {Promise<object>} Punto actualizado.
 */
export async function actualizarPuntoIO(id, datos, contrasenaActual) {
  const cuerpo = {
    idGF: datos.idGF,
    idGE: datos.idGE,
    idUnidad: datos.idUnidad,
    tag: datos.tag.trim(),
    descripcion: datos.descripcion.trim(),
    tipoDato: datos.tipoDato.trim(),
    tipoReg: datos.tipoReg.trim(),
    dirCCEC: datos.dirCCEC,
    dirMB: datos.dirMB,
    edo: datos.activo,
    limMin: datos.limMin,
    limMax: datos.limMax,
    contrasenaActual,
  }
  return parsearPunto(await apiPut(`${RUTA}/${id}`, cuerpo))
}

/** Lista los grupos funcionales, ordenados por ID. */
export async function listarGruposFuncionales({ signal } = {}) {
  const grupos = await apiGet('/IO_GrupoFuncional', { signal })
  return grupos.map((g) => parsearGrupo(g.idGF, g)).sort((a, b) => a.id - b.id)
}

/** Lista los grupos eléctricos, ordenados por ID. */
export async function listarGruposElectricos({ signal } = {}) {
  const grupos = await apiGet('/IO_GrupoElectrico', { signal })
  return grupos.map((g) => parsearGrupo(g.idGE, g)).sort((a, b) => a.id - b.id)
}
