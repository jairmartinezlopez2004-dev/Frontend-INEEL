/**
 * medicion5MService.js
 * ---------------------------------------------------------------------------
 * Funciones de acceso al WebService para las mediciones de cinco minutos
 * (perfil 5M) de un medidor (controlador Medicion5MController del backend).
 * Las usa la vista "Perfiles 5 Minutales" (perfiles5m/ConsultaPerfiles5M.jsx).
 *
 * Endpoints (cualquier usuario con sesión; todos de solo lectura):
 *   GET /Medicion5M/crudo           -> lecturas cada 5 min: { fecha, intervalo (0..287), valor }
 *   GET /Medicion5M/promedio-hora   -> { fecha, hora (0..23), valorPromedio }
 *   GET /Medicion5M/promedio-dia    -> { fecha, valorPromedio }
 *   GET /Medicion5M/promedio-semana -> filas DIARIAS con { anio, semana, fecha, valorPromedio }
 *   GET /Medicion5M/promedio-mes    -> filas DIARIAS con { anio, mes, fecha, valorPromedio }
 *   GET /Medicion5M/promedio-anio   -> promedio mensual { anio, mes, valorPromedio }
 *
 * El backend no permite modificar mediciones: solo se consultan las vistas.
 *
 * Todas las consultas reciben idMedidor, idVar5M, fechaInicio y fechaFin
 * (yyyy-MM-dd, ambos incluidos) y fase (1 A, 2 B, 3 C). Si no hay ninguna
 * fila el backend responde 404 con un mensaje; aquí se devuelve como lista
 * vacía junto con ese mensaje, porque no es un error sino "sin datos".
 *
 * Las vistas semanal y mensual devuelven un valor por día etiquetado con su
 * semana o mes; aquí se agrupan para obtener un solo promedio por semana o
 * por mes (promedio de los promedios diarios).
 */
import { ApiError, apiGet } from './api'

// Ruta del WebService usada en este módulo (relativa a la URL base).
const RUTA = '/Medicion5M'

// Catálogo de variables de 5 minutos (tabla Vars5M). El backend aún no expone
// una API de Vars5M, por eso se replica aquí; cuando exista, este arreglo
// deberá sustituirse por la consulta. Las unidades son las de cada magnitud.
export const VARIABLES_5M = [
  { id: 1, nombre: 'Energía entregada', unidad: 'kWh' },
  { id: 2, nombre: 'Energía recibida', unidad: 'kWh' },
  { id: 3, nombre: 'Energía reactiva I', unidad: 'kVARh' },
  { id: 4, nombre: 'Energía reactiva II', unidad: 'kVARh' },
  { id: 5, nombre: 'Energía reactiva III', unidad: 'kVARh' },
  { id: 6, nombre: 'Energía reactiva IV', unidad: 'kVARh' },
  { id: 7, nombre: 'Potencia activa', unidad: 'kW' },
  { id: 8, nombre: 'Potencia reactiva', unidad: 'kVAR' },
  { id: 9, nombre: 'Voltaje', unidad: 'V' },
  { id: 10, nombre: 'Corriente', unidad: 'A' },
  { id: 11, nombre: 'Factor de potencia', unidad: '' },
  { id: 12, nombre: 'THD voltaje', unidad: '%' },
  { id: 13, nombre: 'THD corriente', unidad: '%' },
]

// Fases que acepta el backend.
export const FASES = [
  { id: 1, nombre: 'A' },
  { id: 2, nombre: 'B' },
  { id: 3, nombre: 'C' },
]

const dosDigitos = (n) => String(n).padStart(2, '0')

/** "HH:MM" de un intervalo de 5 minutos (0 = 00:00, 287 = 23:55). */
export function horaDeIntervalo(intervalo) {
  const minutos = intervalo * 5
  return `${dosDigitos(Math.floor(minutos / 60))}:${dosDigitos(minutos % 60)}`
}

/** Formato numérico de la interfaz (hasta 3 decimales; "—" si no hay valor). */
export const formatoValor = (v) =>
  v == null ? '—' : v.toLocaleString('es-MX', { maximumFractionDigits: 3 })

/** Promedia las filas diarias que comparten la misma clave (semana o mes). */
function agruparPromedio(filas, claveDe, etiquetaDe) {
  const grupos = new Map()
  for (const f of filas) {
    const clave = claveDe(f)
    if (!grupos.has(clave)) grupos.set(clave, { fila: f, suma: 0, n: 0 })
    if (f.valorPromedio != null) {
      grupos.get(clave).suma += f.valorPromedio
      grupos.get(clave).n += 1
    }
  }
  return [...grupos.entries()].map(([clave, { fila, suma, n }]) => ({
    clave,
    etiqueta: etiquetaDe(fila),
    valor: n > 0 ? suma / n : null,
  }))
}

// Agrupaciones disponibles: ruta del endpoint y cómo normalizar sus filas a
// { clave, etiqueta, valor }.
export const AGRUPACIONES = [
  {
    id: 'crudo',
    nombre: 'Cada 5 minutos',
    ruta: 'crudo',
    normalizar: (filas) =>
      filas.map((f) => ({
        clave: `${f.fecha}-${f.intervalo}`,
        etiqueta: `${f.fecha} ${horaDeIntervalo(f.intervalo)}`,
        valor: f.valor,
      })),
  },
  {
    id: 'hora',
    nombre: 'Promedio por hora',
    ruta: 'promedio-hora',
    normalizar: (filas) =>
      filas.map((f) => ({
        clave: `${f.fecha}-${f.hora}`,
        etiqueta: `${f.fecha} ${dosDigitos(f.hora)}:00`,
        valor: f.valorPromedio,
      })),
  },
  {
    id: 'dia',
    nombre: 'Promedio por día',
    ruta: 'promedio-dia',
    normalizar: (filas) =>
      filas.map((f) => ({ clave: f.fecha, etiqueta: f.fecha, valor: f.valorPromedio })),
  },
  {
    id: 'semana',
    nombre: 'Promedio por semana',
    ruta: 'promedio-semana',
    normalizar: (filas) =>
      agruparPromedio(
        filas,
        (f) => `${f.anio}-${f.semana}`,
        (f) => `${f.anio} · semana ${f.semana}`,
      ),
  },
  {
    id: 'mes',
    nombre: 'Promedio por mes',
    ruta: 'promedio-mes',
    normalizar: (filas) =>
      agruparPromedio(
        filas,
        (f) => `${f.anio}-${f.mes}`,
        (f) => `${f.anio}-${dosDigitos(f.mes)}`,
      ),
  },
  {
    id: 'anio',
    nombre: 'Promedio mensual del año',
    ruta: 'promedio-anio',
    normalizar: (filas) =>
      filas.map((f) => ({
        clave: `${f.anio}-${f.mes}`,
        etiqueta: `${f.anio}-${dosDigitos(f.mes)}`,
        valor: f.valorPromedio,
      })),
  },
]

/**
 * Consulta una serie de mediciones de 5 minutos.
 * @param {object} filtros
 * @param {number} filtros.idMedidor
 * @param {number} filtros.idVar5M
 * @param {number} filtros.fase - 1, 2 o 3.
 * @param {string} filtros.fechaInicio - yyyy-MM-dd.
 * @param {string} filtros.fechaFin - yyyy-MM-dd.
 * @param {string} filtros.agrupacion - id de AGRUPACIONES.
 * @returns {Promise<{ puntos: Array<object>, mensaje: string|null }>}
 *   `mensaje` trae el aviso del backend cuando no hay datos.
 */
export async function consultarMedicion5M(
  { idMedidor, idVar5M, fase, fechaInicio, fechaFin, agrupacion },
  { signal } = {},
) {
  const { ruta, normalizar } = AGRUPACIONES.find((a) => a.id === agrupacion)
  const query = new URLSearchParams({ idMedidor, idVar5M, fechaInicio, fechaFin, fase })
  try {
    const filas = await apiGet(`${RUTA}/${ruta}?${query}`, { signal })
    return { puntos: normalizar(filas ?? []), mensaje: null }
  } catch (err) {
    if (err instanceof ApiError && err.httpStatus === 404) {
      return { puntos: [], mensaje: err.message }
    }
    throw err
  }
}

