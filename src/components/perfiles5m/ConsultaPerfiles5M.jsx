/**
 * ConsultaPerfiles5M.jsx
 * ---------------------------------------------------------------------------
 * Vista de la opción "Perfiles 5 Minutales" de la pantalla principal:
 * consulta el perfil de cinco minutos guardado en la base de datos (tabla
 * Medicion5M y sus vistas de promedios) de cualquier medidor.
 *
 * Rol en el sistema:
 * - El usuario elige medidor (agrupado por controlador RF), variable, una o
 *   varias fases (A, B, C), rango de fechas y agrupación (cada 5 minutos, o
 *   promedio por hora, día, semana, mes o mensual del año) y pulsa "Consultar".
 * - El resultado se muestra como resumen (mínimo, promedio, máximo) por fase,
 *   una gráfica con una línea por fase y la tabla de valores con una columna
 *   por fase.
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
  consultarFases,
  formatoValor,
} from '../../services/medicion5MService'
import { listarControladoresRF } from '../../services/controladoresRFService'
import { claseControl } from '../common/clasesFormulario'
import GraficaSerie from './GraficaSerie'

// Rango máximo (en días) para la agrupación cada 5 minutos: 288 lecturas por
// día y fase, así que una semana con tres fases ya son más de 6,000 valores.
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
    fases: [1],
    fechaInicio: fechaISO(haceSeisDias),
    fechaFin: fechaISO(hoy),
    agrupacion: 'hora',
  }
}

/** Mensaje de error de los filtros, o null si son válidos. */
function validarFiltros({ idMedidor, fases, fechaInicio, fechaFin, agrupacion }) {
  if (!idMedidor) return 'Elige un medidor.'
  if (fases.length === 0) return 'Elige al menos una fase.'
  if (!fechaInicio || !fechaFin) return 'Indica la fecha inicial y la final.'
  if (fechaInicio > fechaFin) return 'La fecha inicial no puede ser posterior a la final.'
  if (agrupacion === 'crudo' && diasEnRango(fechaInicio, fechaFin) > MAX_DIAS_CRUDO) {
    return `Para lecturas cada 5 minutos el rango máximo es de ${MAX_DIAS_CRUDO} días.`
  }
  return null
}

/** Mínimo, promedio y máximo de una lista de valores (null si está vacía). */
function resumenDe(valores) {
  if (valores.length === 0) return { minimo: null, promedio: null, maximo: null }
  return {
    minimo: Math.min(...valores),
    promedio: valores.reduce((a, b) => a + b, 0) / valores.length,
    maximo: Math.max(...valores),
  }
}

// Tarjeta de resumen (mínimo, promedio, máximo) cuando se consulta una sola fase.
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

// Muestra del color de una fase (identifica su línea en la gráfica).
function MuestraFase({ color }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
}

const CLASE_TH =
  'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600'

export default function ConsultaPerfiles5M() {
  // Controladores RF con sus medidores, para el selector de medidor.
  const [controladores, setControladores] = useState([])
  // Filtros que se están editando en el formulario.
  const [filtros, setFiltros] = useState(() => filtrosIniciales())
  // Filtros de la consulta aplicada (null = todavía no se consulta); un
  // objeto nuevo vuelve a consultar.
  const [consulta, setConsulta] = useState(null)
  // Resultado de la última consulta: filtros usados, series por fase,
  // periodos y aviso de "sin datos".
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
  // AbortController cancela las peticiones anteriores si el usuario lanza
  // otra o sale de la vista antes de que respondan.
  useEffect(() => {
    if (!consulta) return undefined
    const controlador = new AbortController()
    const { signal } = controlador

    consultarFases(consulta, { signal })
      .then((datos) => setResultado({ filtros: consulta, ...datos }))
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

  // Marca o desmarca una fase; se guardan en orden A, B, C.
  const alternarFase = (id) => (e) => {
    setFiltros((prev) => ({
      ...prev,
      fases: FASES.map((f) => f.id).filter((f) => (f === id ? e.target.checked : prev.fases.includes(f))),
    }))
  }

  const alEnviar = (e) => {
    e.preventDefault()
    consultar(filtros)
  }

  // Datos de la consulta mostrada (no de los filtros que se estén editando).
  const variable = resultado && VARIABLES_5M.find((v) => v.id === resultado.filtros.idVar5M)
  const unidad = variable?.unidad ?? ''
  const periodos = resultado?.periodos ?? []
  const medidor =
    resultado && controladores.flatMap((c) => c.medidores).find((m) => m.id === resultado.filtros.idMedidor)
  const nombreAgrupacion = resultado && AGRUPACIONES.find((a) => a.id === resultado.filtros.agrupacion).nombre
  // Una serie por fase consultada: nombre, color, valores por periodo y resumen.
  const series = (resultado?.series ?? []).map(({ fase, puntos }) => {
    const { nombre, color } = FASES.find((f) => f.id === fase)
    return {
      id: fase,
      nombre: `Fase ${nombre}`,
      color,
      valores: new Map(puntos.map((p) => [p.clave, p.valor])),
      resumen: resumenDe(puntos.map((p) => p.valor).filter((v) => v != null)),
    }
  })
  const variasFases = series.length > 1

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
          {/* Fases: una, dos o las tres (casillas con el color de su línea). */}
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium text-slate-700">Fases</legend>
            <div className="flex h-[38px] items-center gap-2">
              {FASES.map((f) => (
                <label
                  key={f.id}
                  className="flex h-full flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white text-sm text-slate-700 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500"
                >
                  <input
                    type="checkbox"
                    checked={filtros.fases.includes(f.id)}
                    onChange={alternarFase(f.id)}
                    className="sr-only"
                  />
                  <MuestraFase color={f.color} />
                  {f.nombre}
                </label>
              ))}
            </div>
          </fieldset>
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
      {!error && periodos.length > 0 && (
        <>
          <section className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {medidor?.descripcion || `Medidor #${resultado.filtros.idMedidor}`} · {variable.nombre} ·{' '}
                {variasFases ? series.map((s) => s.nombre).join(', ') : series[0].nombre.toLowerCase()}
              </h3>
              <span className="text-xs text-slate-500">
                {nombreAgrupacion} · {resultado.filtros.fechaInicio} a {resultado.filtros.fechaFin} ·{' '}
                {periodos.length} {periodos.length === 1 ? 'periodo' : 'periodos'}
              </span>
            </div>

            {/* Resumen: tarjetas con una fase; tabla por fase con varias. */}
            {variasFases ? (
              <table className="mb-6 w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th scope="col" className={`${CLASE_TH} pl-0 text-left`}>
                      Fase
                    </th>
                    {['Mínimo', 'Promedio', 'Máximo'].map((titulo) => (
                      <th key={titulo} scope="col" className={`${CLASE_TH} text-right`}>
                        {titulo} {unidad && `(${unidad})`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {series.map((s) => (
                    <tr key={s.id}>
                      <th scope="row" className="py-2 pr-4 text-left font-medium text-slate-900">
                        <span className="flex items-center gap-2">
                          <MuestraFase color={s.color} />
                          {s.nombre}
                        </span>
                      </th>
                      {[s.resumen.minimo, s.resumen.promedio, s.resumen.maximo].map((v, i) => (
                        <td key={i} className="px-4 py-2 text-right font-mono text-slate-900">
                          {formatoValor(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <DatoResumen etiqueta="Mínimo" valor={series[0].resumen.minimo} unidad={unidad} />
                <DatoResumen etiqueta="Promedio" valor={series[0].resumen.promedio} unidad={unidad} />
                <DatoResumen etiqueta="Máximo" valor={series[0].resumen.maximo} unidad={unidad} />
              </div>
            )}

            <GraficaSerie periodos={periodos} series={series} unidad={unidad} />
          </section>

          {/* Tabla de valores con scroll propio (las lecturas crudas pueden ser miles). */}
          <section className="rounded-xl bg-white shadow-md">
            <div className="max-h-96 overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    <th scope="col" className={`${CLASE_TH} text-left`}>
                      Periodo
                    </th>
                    {series.map((s) => (
                      <th key={s.id} scope="col" className={`${CLASE_TH} text-right`}>
                        {variasFases ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MuestraFase color={s.color} />
                            {s.nombre} {unidad && `(${unidad})`}
                          </span>
                        ) : (
                          `Valor ${unidad && `(${unidad})`}`
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periodos.map((p) => (
                    <tr key={p.clave} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-slate-700">{p.etiqueta}</td>
                      {series.map((s) => (
                        <td key={s.id} className="whitespace-nowrap px-4 py-2 text-right font-mono text-slate-900">
                          {formatoValor(s.valores.get(p.clave))}
                        </td>
                      ))}
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
