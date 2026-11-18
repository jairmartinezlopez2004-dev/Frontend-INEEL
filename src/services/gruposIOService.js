/**
 * gruposIOService.js
 * ---------------------------------------------------------------------------
 * Funciones de acceso al WebService para los dos catálogos de grupos con los
 * que se clasifican los puntos IO: grupos funcionales (IO_GrupoFuncional) y
 * grupos eléctricos (IO_GrupoElectrico). Lo usan el módulo Grupos IO y el
 * módulo Puntos IO (para mostrar los nombres en lugar de los IDs).
 *
 * Endpoints (iguales para ambos catálogos, cambia la ruta y el nombre del ID):
 *   GET  /IO_GrupoFuncional          -> lista { idGF, nombre, edo } (cualquier usuario con sesión)
 *   POST /IO_GrupoFuncional          -> alta { nombre, edo }         (Administrador)
 *   PUT  /IO_GrupoFuncional/{idGF}   -> edición, mismos campos       (Administrador; 404 si no existe)
 *   GET  /IO_GrupoElectrico          -> lista { idGE, nombre, edo }
 *   POST /IO_GrupoElectrico          -> alta
 *   PUT  /IO_GrupoElectrico/{idGE}   -> edición
 *
 * No hay eliminación física: `edo` es booleano (true activo, false inactivo)
 * y la baja se hace editando el grupo como inactivo.
 */
import { apiGet, apiPost, apiPut } from './api'

// Configuración de cada catálogo: ruta del WebService, campo del ID y textos de la UI.
export const TIPOS_GRUPO = {
  funcional: {
    ruta: '/IO_GrupoFuncional',
    campoId: 'idGF',
    titulo: 'Grupos funcionales IO',
    singular: 'grupo funcional',
    ejemplo: 'Instantáneos',
  },
  electrico: {
    ruta: '/IO_GrupoElectrico',
    campoId: 'idGE',
    titulo: 'Grupos eléctricos IO',
    singular: 'grupo eléctrico',
    ejemplo: 'FASE A',
  },
}

// Límite de longitud del nombre (varchar(50) en ambas tablas).
export const LIMITES = { nombre: 50 }

// Nombres de grupos funcionales que en la base de datos están sin acento y
// cómo se muestran en pantalla (clave en minúsculas). Solo cambia lo que se
// ve: `nombre` conserva el valor real, que es el que se edita y se guarda.
const NOMBRES_CON_ACENTO = {
  instantaneos: 'Instantáneos',
  armonicos: 'Armónicos',
  calibracion: 'Calibración',
}

/**
 * Normaliza un grupo del backend a { id, nombre, nombreVisible, activo }.
 * `nombreVisible` es el texto para tablas y selectores (con acentos en los
 * grupos funcionales); `nombre` es el dato tal como está en la base.
 */
function parsearGrupo(campoId, g) {
  const nombre = g.nombre ?? ''
  const nombreVisible =
    campoId === TIPOS_GRUPO.funcional.campoId ? (NOMBRES_CON_ACENTO[nombre.trim().toLowerCase()] ?? nombre) : nombre
  return { id: g[campoId], nombre, nombreVisible, activo: g.edo }
}

/** Cuerpo que esperan el POST y el PUT. */
function aCuerpo({ nombre, activo }) {
  return { nombre: nombre.trim(), edo: activo }
}

/**
 * Lista los grupos de un catálogo, ordenados por ID.
 * @param {'funcional' | 'electrico'} tipo
 * @returns {Promise<Array<{ id, nombre, activo }>>}
 */
export async function listarGrupos(tipo, { signal } = {}) {
  const { ruta, campoId } = TIPOS_GRUPO[tipo]
  const grupos = await apiGet(ruta, { signal })
  return grupos.map((g) => parsearGrupo(campoId, g)).sort((a, b) => a.id - b.id)
}

/**
 * Registra un grupo (solo Administrador).
 * @param {'funcional' | 'electrico'} tipo
 * @param {{ nombre: string, activo: boolean }} datos
 * @returns {Promise<object>} Grupo creado.
 */
export async function crearGrupo(tipo, datos) {
  const { ruta, campoId } = TIPOS_GRUPO[tipo]
  return parsearGrupo(campoId, await apiPost(ruta, aCuerpo(datos)))
}

/**
 * Actualiza un grupo existente (solo Administrador).
 * @param {'funcional' | 'electrico'} tipo
 * @param {number} id
 * @param {{ nombre: string, activo: boolean }} datos
 * @returns {Promise<object>} Grupo actualizado.
 */
export async function actualizarGrupo(tipo, id, datos) {
  const { ruta, campoId } = TIPOS_GRUPO[tipo]
  return parsearGrupo(campoId, await apiPut(`${ruta}/${id}`, aCuerpo(datos)))
}
