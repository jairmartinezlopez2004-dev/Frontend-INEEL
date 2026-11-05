/**
 * EnergiaPorHora.jsx
 * ---------------------------------------------------------------------------
 * Vista "Energía por hora" de la opción Perfiles 5 Minutales: total de energía
 * de cada hora y su acumulado del día, para un medidor y una variable de
 * energía (GET /Medicion5M/energia-hora).
 *
 * Rol en el sistema:
 * - El usuario elige medidor, variable de energía (las de unidad kWh / kVARh)
 *   y rango de fechas, y pulsa "Consultar". La vista empieza vacía, igual que
 *   Mediciones 5 minutales.
 * - Muestra un resumen (total del rango, hora pico, promedio por hora, horas
 *   incompletas), los totales por día, la gráfica (GraficaEnergiaHora) y la
 *   tabla hora por hora.
 * - El backend solo trabaja en fase A para energía y suma los 12 intervalos
 *   de 5 minutos de cada hora; una hora con menos de 12 lecturas se marca
 *   como incompleta.
 * - Es de solo consulta para todos los roles.
 */
import { Suspense, lazy, useEffect, useState } from 'react'
import { VARIABLES_5M, consultarEnergiaHora, formatoValor, listarVariables5M } from '../../services/medicion5MService'
import { listarControladoresRF } from '../../services/controladoresRFService'
import { claseControl } from '../common/clasesFormulario'
import SelectorRangoFechas from '../common/SelectorRangoFechas'
// ECharts solo se descarga al mostrar la gráfica.
const GraficaEnergiaHora = lazy(() => import('./GraficaEnergiaHora'))

// Lecturas de 5 minutos de una hora completa.
const LECTURAS_POR_HORA = 12

// Variables de energía: las que se miden en kWh o kVARh (unidad terminada en "h"),
// igual que el total de energía de Mediciones 5 minutales.
const esEnergia = (v) => v.unidad?.endsWith('h')

/** Fecha local en formato yyyy-MM-dd. */
function fechaISO(fecha) {
  const d = (n) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${d(fecha.getMonth() + 1)}-${d(fecha.getDate())}`
}

/** Filtros iniciales: sin medidor, primera variable de energía, últimos 7 días. */
function filtrosIniciales(variables) {
  const hoy = new Date()
  const haceSeisDias = new Date(hoy)
  haceSeisDias.setDate(hoy.getDate() - 6)
  return {
    idMedidor: null,
    idVar5M: variables.find(esEnergia)?.id ?? 1,
    fechaInicio: fechaISO(haceSeisDias),
    fechaFin: fechaISO(hoy),
  }
}

function validarFiltros({ idMedidor, fechaInicio, fechaFin }) {
  if (!idMedidor) return 'Elige un medidor.'
  if (!fechaInicio || !fechaFin) return 'Indica la fecha inicial y la final.'
  if (fechaInicio > fechaFin) return 'La fecha inicial no puede ser posterior a la final.'
  return null
}

// Tarjeta del resumen.
function DatoResumen({ etiqueta, valor, unidad, detalle }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{etiqueta}</div>
      <div className="mt-1 font-mono text-lg font-semibold text-slate-900">
        {valor} {unidad && <span className="text-sm font-normal text-slate-500">{unidad}</span>}
      </div>
      {detalle && <div className="mt-0.5 text-xs text-slate-500">{detalle}</div>}
    </div>
  )
}

const CLASE_TH = 'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600'

export default function EnergiaPorHora() {
  const [controladores, setControladores] = useState([])
  const [variables, setVariables] = useState(VARIABLES_5M)
  const [filtros, setFiltros] = useState(() => filtrosIniciales(VARIABLES_5M))
  // Filtros aplicados (null = sin consulta); un objeto nuevo vuelve a consultar.
  const [consulta, setConsulta] = useState(null)
  const [resultado, setResultado] = useState(null) // { filtros, filas, mensaje }
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Medidores (agrupados por controlador RF).
  useEffect(() => {
    const controlador = new AbortController()
    listarControladoresRF({ signal: controlador.signal })
      .then((lista) => {
        setControladores(lista)
        if (!lista.some((c) => c.medidores.length > 0)) setError('No hay medidores registrados.')
        setCargando(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err.message)
        setCargando(false)
      })
    return () => controlador.abort()
  }, [])

  // Catálogo de variables del WebService (si falla, queda el de respaldo).
  useEffect(() => {
    const controlador = new AbortController()
    listarVariables5M({ signal: controlador.signal })
      .then((lista) => {
        if (lista.length === 0) return
        setVariables(lista)
        // Si la variable elegida no es de energía en el catálogo real, se toma la primera que sí lo sea.
        setFiltros((prev) =>
          lista.some((v) => v.id === prev.idVar5M && esEnergia(v))
            ? prev
            : { ...prev, idVar5M: lista.find(esEnergia)?.id ?? prev.idVar5M },
        )
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.warn('Vars5M no disponible; se usa el catálogo de respaldo.', err)
      })
    return () => controlador.abort()
  }, [])

  // Consulta al WebService cuando cambia la consulta aplicada.
  useEffect(() => {
    if (!consulta) return undefined
    const controlador = new AbortController()
    const { signal } = controlador
    consultarEnergiaHora(consulta, { signal })
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

  const alEnviar = (e) => {
    e.preventDefault()
    const errorFiltros = validarFiltros(filtros)
    if (errorFiltros) {
      setError(errorFiltros)
      return
    }
    setCargando(true)
    setError(null)
    setConsulta({ ...filtros })
  }

  const variablesEnergia = variables.filter(esEnergia)

  // ── Datos de la consulta mostrada ──
  const filas = resultado?.filas ?? []
  const variable = resultado && variables.find((v) => v.id === resultado.filtros.idVar5M)
  const unidad = variable?.unidad ?? ''
  const medidor =
    resultado && controladores.flatMap((c) => c.medidores).find((m) => m.id === resultado.filtros.idMedidor)

  const totalRango = filas.reduce((suma, f) => suma + f.totalHora, 0)
  const pico = filas.reduce((max, f) => (max == null || f.totalHora > max.totalHora ? f : max), null)
  const horasIncompletas = filas.filter((f) => f.intervalos < LECTURAS_POR_HORA).length
  // Total de cada día = acumulado de su última hora (las filas vienen ordenadas por fecha y hora).
  const totalesPorDia = [...filas.reduce((mapa, f) => mapa.set(f.fecha, f), new Map()).values()].map((f) => ({
    fecha: f.fecha,
    total: f.acumuladoDia,
  }))

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* ── Filtros ── */}
      <form noValidate onSubmit={alEnviar} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-bold uppercase tracking-wide text-slate-800">Energía por hora</h2>
        <p className="mb-4 text-sm text-slate-500">
          Total de energía de cada hora y acumulado del día, en fase A.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Medidor
            <select
              value={filtros.idMedidor ?? ''}
              onChange={(e) => setFiltros((prev) => ({ ...prev, idMedidor: Number(e.target.value) }))}
              disabled={controladores.length === 0}
              className={claseControl()}
            >
              {controladores.length === 0 ? (
                <option value="">Cargando medidores…</option>
              ) : (
                <option value="" disabled>
                  Elige un medidor
                </option>
              )}
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
            Variable de energía
            <select
              value={filtros.idVar5M}
              onChange={(e) => setFiltros((prev) => ({ ...prev, idVar5M: Number(e.target.value) }))}
              className={claseControl()}
            >
              {variablesEnergia.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre} ({v.unidad})
                </option>
              ))}
            </select>
          </label>
          <div className="lg:col-span-2">
            <SelectorRangoFechas
              desde={filtros.fechaInicio}
              hasta={filtros.fechaFin}
              onCambiar={(fechaInicio, fechaFin) => setFiltros((prev) => ({ ...prev, fechaInicio, fechaFin }))}
            />
          </div>
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

      {/* ── Mensajes ── */}
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {!error && resultado?.mensaje && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          {resultado.mensaje}
        </div>
      )}

      {/* ── Resultado ── */}
      {!error && filas.length > 0 && (
        <>
          <section className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {medidor?.descripcion || `Medidor #${resultado.filtros.idMedidor}`} · {variable?.nombre} · fase A
              </h3>
              <span className="text-xs text-slate-500">
                {resultado.filtros.fechaInicio} a {resultado.filtros.fechaFin} · {filas.length}{' '}
                {filas.length === 1 ? 'hora' : 'horas'}
              </span>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DatoResumen etiqueta="Total del rango" valor={formatoValor(totalRango)} unidad={unidad} />
              <DatoResumen
                etiqueta="Hora pico"
                valor={formatoValor(pico.totalHora)}
                unidad={unidad}
                detalle={`${pico.fecha} · ${pico.horaTexto}`}
              />
              <DatoResumen etiqueta="Promedio por hora" valor={formatoValor(totalRango / filas.length)} unidad={unidad} />
              <DatoResumen
                etiqueta="Horas incompletas"
                valor={horasIncompletas}
                detalle={`Con menos de ${LECTURAS_POR_HORA} lecturas de 5 minutos`}
              />
            </div>

            <Suspense fallback={<div className="h-[380px] animate-pulse rounded-lg bg-slate-100" />}>
              <GraficaEnergiaHora filas={filas} unidad={unidad} />
            </Suspense>
          </section>

          {/* Totales por día (solo si hay más de un día). */}
          {totalesPorDia.length > 1 && (
            <section className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
              <h3 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">Total por día</h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className={CLASE_TH}>Fecha</th>
                    <th className={`${CLASE_TH} text-right`}>Total ({unidad})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {totalesPorDia.map((d) => (
                    <tr key={d.fecha}>
                      <td className="px-4 py-2 text-slate-700">{d.fecha}</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-900">{formatoValor(d.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Tabla hora por hora. */}
          <section className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
            <div className="max-h-[480px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left">
                  <tr>
                    <th className={CLASE_TH}>Fecha</th>
                    <th className={CLASE_TH}>Hora</th>
                    <th className={`${CLASE_TH} text-right`}>Total de la hora ({unidad})</th>
                    <th className={`${CLASE_TH} text-right`}>Acumulado del día ({unidad})</th>
                    <th className={`${CLASE_TH} text-right`}>Lecturas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filas.map((f) => (
                    <tr key={`${f.fecha}-${f.hora}`} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-700">{f.fecha}</td>
                      <td className="px-4 py-2 text-slate-700">{f.horaTexto}</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-900">{formatoValor(f.totalHora)}</td>
                      <td className="px-4 py-2 text-right font-mono text-slate-900">{formatoValor(f.acumuladoDia)}</td>
                      <td
                        className={`px-4 py-2 text-right font-mono ${f.intervalos < LECTURAS_POR_HORA ? 'font-semibold text-amber-700' : 'text-slate-500'}`}
                        title={f.intervalos < LECTURAS_POR_HORA ? 'Hora incompleta' : undefined}
                      >
                        {f.intervalos}/{LECTURAS_POR_HORA}
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
