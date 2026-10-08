/**
 * ConsultaPerfiles5M.jsx
 * ---------------------------------------------------------------------------
 * Vista de la opción "Perfiles 5 Minutales" de la pantalla principal:
 * consulta el perfil de cinco minutos guardado en la base de datos (tabla
 * Medicion5M y sus vistas de promedios) de cualquier medidor.
 *
 * Rol en el sistema:
 * - El usuario elige medidor (agrupado por controlador RF), variable, fase,
 *   rango de fechas y agrupación (cada 5 minutos, o promedio por hora, día,
 *   semana, mes o mensual del año) y pulsa "Consultar".
 * - El resultado se muestra como resumen (mínimo, promedio, máximo), una
 *   gráfica de línea y la tabla de valores.
 * - Es de solo consulta para todos los roles: el backend solo expone las
 *   vistas de lectura, no la edición de mediciones.
 *
 * Se comunica con el WebService a través de services/medicion5MService.js
 * (mediciones) y services/controladoresRFService.js (lista de medidores).
 */
import { useEffect, useState } from 'react'
import {
  AGRUPACIONES,
  FASES,
  VARIABLES_5M,
  consultarMedicion5M,
  formatoValor,
} from '../../services/medicion5MService'
import { listarControladoresRF } from '../../services/controladoresRFService'
import { claseControl } from '../common/clasesFormulario'
import GraficaSerie from './GraficaSerie'

// Rango máximo (en días) para la agrupación cada 5 minutos: 288 lecturas por
// día, así que una semana ya son más de 2,000 filas.
const MAX_DIAS_CRUDO = 7

/** Fecha local en formato yyyy-MM-dd (el que usan <input type="date"> y la API). */
function fechaISO(fecha) {
  const d = (n) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${d(fecha.getMonth() + 1)}-${d(fecha.getDate())}`
}

/** Días entre dos fechas yyyy-MM-dd, contando ambos extremos. */
function diasEnRango(inicio, fin) {
  return Math.round((new Date(fin) - new Date(inicio)) / 86_400_000) + 1
}

/** Filtros iniciales del medidor dado: voltaje, fase A, promedio por hora de los últimos 7 días. */
function filtrosIniciales(idMedidor = null) {
  const hoy = new Date()
  const haceSeisDias = new Date(hoy)
  haceSeisDias.setDate(hoy.getDate() - 6)
  return {
    idMedidor,
    idVar5M: 9,
    fase: 1,
    fechaInicio: fechaISO(haceSeisDias),
    fechaFin: fechaISO(hoy),
    agrupacion: 'hora',
  }
}

/** Mensaje de error de los filtros, o null si son válidos. */
function validarFiltros({ idMedidor, fechaInicio, fechaFin, agrupacion }) {
  if (!idMedidor) return 'Elige un medidor.'
  if (!fechaInicio || !fechaFin) return 'Indica la fecha inicial y la final.'
  if (fechaInicio > fechaFin) return 'La fecha inicial no puede ser posterior a la final.'
  if (agrupacion === 'crudo' && diasEnRango(fechaInicio, fechaFin) > MAX_DIAS_CRUDO) {
    return `Para lecturas cada 5 minutos el rango máximo es de ${MAX_DIAS_CRUDO} días.`
  }
  return null
}

// Tarjeta de resumen (mínimo, promedio, máximo).
function DatoResumen({ etiqueta, valor, unidad }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{etiqueta}</div>
      <div className="mt-1 font-mono text-lg font-semibold text-slate-900">
        {formatoValor(valor)} <span className="text-sm font-normal text-slate-500">{unidad}</span>
      </div>
    </div>
  )
}

export default function ConsultaPerfiles5M() {
  // Controladores RF con sus medidores, para el selector de medidor.
  const [controladores, setControladores] = useState([])
  // Filtros que se están editando en el formulario.
  const [filtros, setFiltros] = useState(() => filtrosIniciales())
  // Filtros de la consulta aplicada (null = todavía no se consulta); un
  // objeto nuevo vuelve a consultar.
  const [consulta, setConsulta] = useState(null)
  // Resultado de la última consulta: filtros usados, puntos y aviso de "sin datos".
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Carga de los medidores. Al llegar se elige el primero y se lanza la
  // primera consulta, para que la vista no aparezca vacía.
  useEffect(() => {
    const controlador = new AbortController()

    listarControladoresRF({ signal: controlador.signal })
      .then((lista) => {
        setControladores(lista)
        const primero = lista.flatMap((c) => c.medidores)[0]
        if (!primero) {
          setError('No hay medidores registrados.')
          setCargando(false)
          return
        }
        const iniciales = filtrosIniciales(primero.id)
        setFiltros(iniciales)
        setConsulta(iniciales)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err.message)
        setCargando(false)
      })

    return () => controlador.abort()
  }, [])

  // Consulta al WebService cada vez que cambia la consulta aplicada. El
  // AbortController cancela la petición anterior si el usuario lanza otra o
  // sale de la vista antes de que responda.
  useEffect(() => {
    if (!consulta) return undefined
    const controlador = new AbortController()
    const { signal } = controlador

    consultarMedicion5M(consulta, { signal })
      .then(({ puntos, mensaje }) => setResultado({ filtros: consulta, puntos, mensaje }))
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err.message)
        setResultado(null)
      })
      .finally(() => {
        if (!signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [consulta])

  // Aplica unos filtros (nuevo objeto, para repetir la consulta aunque sean iguales).
  const consultar = (filtrosConsulta) => {
    const errorFiltros = validarFiltros(filtrosConsulta)
    if (errorFiltros) {
      setError(errorFiltros)
      return
    }
    setCargando(true)
    setError(null)
    setConsulta({ ...filtrosConsulta })
  }

  const cambiar = (campo, convertir = (v) => v) => (e) => {
    setFiltros((prev) => ({ ...prev, [campo]: convertir(e.target.value) }))
  }

  const alEnviar = (e) => {
    e.preventDefault()
    consultar(filtros)
  }

  // Datos de la consulta mostrada (no de los filtros que se estén editando).
  const variable = resultado && VARIABLES_5M.find((v) => v.id === resultado.filtros.idVar5M)
  const unidad = variable?.unidad ?? ''
  const puntos = resultado?.puntos ?? []
  const valores = puntos.map((p) => p.valor).filter((v) => v != null)
  const medidor =
    resultado && controladores.flatMap((c) => c.medidores).find((m) => m.id === resultado.filtros.idMedidor)
  const nombreAgrupacion = resultado && AGRUPACIONES.find((a) => a.id === resultado.filtros.agrupacion).nombre
  const nombreFase = resultado && FASES.find((f) => f.id === resultado.filtros.fase).nombre

  return (
    // El scroll lo da el área de contenido del LayoutSistema.
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* ── Filtros de la consulta ── */}
      <form
        noValidate
        onSubmit={alEnviar}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-slate-800">
          Perfiles 5 minutales
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Medidor
            <select
              value={filtros.idMedidor ?? ''}
              onChange={cambiar('idMedidor', Number)}
              disabled={controladores.length === 0}
              className={claseControl()}
            >
              {controladores.length === 0 && <option value="">Cargando medidores…</option>}
              {/* Medidores agrupados por su controlador RF. */}
              {controladores
                .filter((c) => c.medidores.length > 0)
                .map((c) => (
                  <optgroup key={c.id} label={c.nombre || `Controlador #${c.id}`}>
                    {c.medidores.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.descripcion || `Medidor #${m.id}`}
                      </option>
                    ))}
                  </optgroup>
                ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Variable
            <select value={filtros.idVar5M} onChange={cambiar('idVar5M', Number)} className={claseControl()}>
              {VARIABLES_5M.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre}
                  {v.unidad && ` (${v.unidad})`}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Fase
            <select value={filtros.fase} onChange={cambiar('fase', Number)} className={claseControl()}>
              {FASES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Desde
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={cambiar('fechaInicio')}
              className={claseControl()}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Hasta
            <input type="date" value={filtros.fechaFin} onChange={cambiar('fechaFin')} className={claseControl()} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Agrupación
            <select value={filtros.agrupacion} onChange={cambiar('agrupacion')} className={claseControl()}>
              {AGRUPACIONES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={cargando}
            className="cursor-pointer rounded-lg bg-blue-600 px-8 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? 'Consultando…' : 'Consultar'}
          </button>
        </div>
      </form>

      {/* ── Mensajes de estado ── */}
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {!error && resultado?.mensaje && (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
          {resultado.mensaje}
        </div>
      )}

      {/* ── Resultado ── */}
      {!error && puntos.length > 0 && (
        <>
          <section className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {medidor?.descripcion || `Medidor #${resultado.filtros.idMedidor}`} · {variable.nombre} · fase{' '}
                {nombreFase}
              </h3>
              <span className="text-xs text-slate-500">
                {nombreAgrupacion} · {resultado.filtros.fechaInicio} a {resultado.filtros.fechaFin} ·{' '}
                {puntos.length} {puntos.length === 1 ? 'valor' : 'valores'}
              </span>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <DatoResumen etiqueta="Mínimo" valor={valores.length ? Math.min(...valores) : null} unidad={unidad} />
              <DatoResumen
                etiqueta="Promedio"
                valor={valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null}
                unidad={unidad}
              />
              <DatoResumen etiqueta="Máximo" valor={valores.length ? Math.max(...valores) : null} unidad={unidad} />
            </div>

            <GraficaSerie puntos={puntos} unidad={unidad} />
          </section>


          {/* Tabla de valores con scroll propio (las lecturas crudas pueden ser miles). */}
          <section className="rounded-xl bg-white shadow-md">
            <div className="max-h-96 overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Periodo
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Valor {unidad && `(${unidad})`}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {puntos.map((p) => (
                    <tr key={p.clave} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-slate-700">{p.etiqueta}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right font-mono text-slate-900">
                        {formatoValor(p.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
