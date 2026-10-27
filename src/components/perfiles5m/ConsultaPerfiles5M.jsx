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
 * - El resultado se muestra como resumen (mínimo, promedio, máximo y, en
 *   variables de energía, total) por fase, una gráfica de ECharts con una
 *   serie por fase (GraficaECharts.jsx) y la tabla de valores con una columna
 *   por fase.
 * - Navegación: la gráfica se acerca y recorre con la rueda del mouse, el
 *   minimapa inferior o su barra de herramientas (que también tiene "Ver
 *   todo"). El resumen y la tabla siguen al tramo visible.
 * - Las fases se ocultan o muestran desde la leyenda de la gráfica, sin
 *   volver a consultar.
 * - Eventos registrados: lista los eventos del medidor dentro del rango
 *   consultado y los marca en la gráfica, para ver qué pasó en una subida o
 *   bajada. El backend guarda solo la fecha del evento (sin hora), así que se
 *   marca el día completo.
 * - Es de solo consulta para todos los roles: el backend solo expone las
 *   vistas de lectura, no la edición de mediciones.
 *
 * Se comunica con el WebService a través de services/medicion5MService.js
 * (mediciones), services/controladoresRFService.js (lista de medidores),
 * services/eventosRegService.js y services/eventosConfigService.js (eventos).
 */
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import {
  AGRUPACIONES,
  FASES,
  VARIABLES_5M,
  consultarFases,
  formatoValor,
  listarVariables5M,
} from '../../services/medicion5MService'
import { listarControladoresRF } from '../../services/controladoresRFService'
import { listarRegistros } from '../../services/eventosRegService'
import { listarEventos } from '../../services/eventosConfigService'
import { claseControl } from '../common/clasesFormulario'
import SelectorRangoFechas from '../common/SelectorRangoFechas'
// La gráfica se carga bajo demanda: ECharts (~600 KB) solo se descarga al
// abrir esta vista, no al entrar al sistema.
const GraficaECharts = lazy(() => import('./GraficaECharts'))

// Rango máximo (en días) para la agrupación cada 5 minutos: un mes (31 días
// para cubrir cualquier mes). Son 288 lecturas por día y fase, así que un mes
// con tres fases llega a unos 26,800 valores.
const MAX_DIAS_CRUDO = 31

// Periodos mínimos que se muestran al acercarse a la gráfica.
const MIN_PERIODOS_VENTANA = 4

// Caracteres de la clave del periodo que corresponden a la fecha del evento:
// 10 = "yyyy-MM-dd", 7 = "yyyy-MM". Por semana no se puede ubicar un evento
// porque la clave es "año-semana".
const PREFIJO_FECHA = { crudo: 10, hora: 10, dia: 10, mes: 7, anio: 7 }

// Lecturas de 5 minutos que resume cada periodo, para obtener el total de
// energía a partir de los promedios (promedio × lecturas). Por semana o mes no
// se calcula porque el backend no indica cuántos días con datos tiene cada uno.
const LECTURAS_POR_PERIODO = { crudo: 1, hora: 12, dia: 288 }

/** Índices de los periodos que caen en la fecha yyyy-MM-dd (vacío si no se puede ubicar). */
function indicesDeFecha(fecha, agrupacion, periodos) {
  const largo = PREFIJO_FECHA[agrupacion]
  if (!largo) return []
  const prefijo = fecha.slice(0, largo)
  return periodos.flatMap((p, i) => (p.clave.startsWith(prefijo) ? [i] : []))
}

/** Fecha local en formato yyyy-MM-dd (el que usan <input type="date"> y la API). */
function fechaISO(fecha) {
  const d = (n) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${d(fecha.getMonth() + 1)}-${d(fecha.getDate())}`
}

/** Días entre dos fechas yyyy-MM-dd, contando ambos extremos. */
function diasEnRango(inicio, fin) {
  return Math.round((new Date(fin) - new Date(inicio)) / 86_400_000) + 1
}

/** Filtros iniciales: sin medidor elegido; voltaje, fase A, promedio por hora de los últimos 7 días. */
function filtrosIniciales() {
  const hoy = new Date()
  const haceSeisDias = new Date(hoy)
  haceSeisDias.setDate(hoy.getDate() - 6)
  return {
    idMedidor: null,
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

/** Mínimo, promedio, máximo y suma de una lista de valores (null si está vacía). */
function resumenDe(valores) {
  if (valores.length === 0) return { minimo: null, promedio: null, maximo: null, suma: null }
  const suma = valores.reduce((a, b) => a + b, 0)
  return {
    minimo: Math.min(...valores),
    promedio: suma / valores.length,
    maximo: Math.max(...valores),
    suma,
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
  // Catálogo de variables: el de respaldo hasta que responda GET /Vars5M.
  const [variables, setVariables] = useState(VARIABLES_5M)
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
  // Tramo visible de la gráfica: { desde, hasta } (índices de periodos) o null = todo.
  const [ventana, setVentana] = useState(null)
  // Eventos registrados (todos) y catálogo de eventos para su descripción.
  const [registros, setRegistros] = useState([])
  const [catalogoEventos, setCatalogoEventos] = useState([])
  const [errorEventos, setErrorEventos] = useState(null)

  // Carga de los medidores. La vista empieza vacía (sin medidor elegido ni
  // consulta), para que al volver a iniciar sesión no aparezcan datos de una
  // consulta anterior; no se consulta hasta que el usuario presiona Consultar.
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

  // Catálogo de variables desde el WebService. Si falla (p. ej. la base de
  // datos aún no tiene la columna `fases`), se queda el de respaldo.
  useEffect(() => {
    const controlador = new AbortController()

    listarVariables5M({ signal: controlador.signal })
      .then((lista) => {
        if (lista.length > 0) setVariables(lista)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.warn('Vars5M no disponible; se usa el catálogo de respaldo.', err)
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
      .then((datos) => {
        setResultado({ filtros: consulta, ...datos })
        // Cada consulta nueva empieza mostrando todos los periodos.
        setVentana(null)
      })
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

  // Eventos registrados: se vuelven a pedir con cada consulta para incluir los
  // recientes. Van aparte de las mediciones para que un fallo aquí no impida
  // ver la gráfica.
  useEffect(() => {
    if (!consulta) return undefined
    const controlador = new AbortController()
    const { signal } = controlador

    Promise.all([listarRegistros({ signal }), listarEventos({ signal })])
      .then(([listaRegistros, listaEventos]) => {
        setRegistros(listaRegistros)
        setCatalogoEventos(listaEventos)
        setErrorEventos(null)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setErrorEventos(err.message)
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

  // Fases en que se mide la variable elegida (1 = solo A).
  const fasesVariable = variables.find((v) => v.id === filtros.idVar5M)?.fases ?? FASES.length

  // Al elegir una variable de una sola fase, solo queda marcada la A.
  const cambiarVariable = (e) => {
    const idVar5M = Number(e.target.value)
    const fases = variables.find((v) => v.id === idVar5M)?.fases ?? FASES.length
    setFiltros((prev) => ({ ...prev, idVar5M, fases: fases === 1 ? [1] : prev.fases }))
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
  const variable = resultado && variables.find((v) => v.id === resultado.filtros.idVar5M)
  const unidad = variable?.unidad ?? ''
  const periodos = resultado?.periodos ?? []
  const medidor =
    resultado && controladores.flatMap((c) => c.medidores).find((m) => m.id === resultado.filtros.idMedidor)
  const agrupacion = resultado?.filtros.agrupacion
  const nombreAgrupacion = resultado && AGRUPACIONES.find((a) => a.id === agrupacion).nombre

  // Tramo visible (la ventana de navegación, o todos los periodos).
  const desde = ventana?.desde ?? 0
  const hasta = ventana?.hasta ?? periodos.length - 1
  const tamVentana = hasta - desde + 1
  const periodosVisibles = periodos.slice(desde, hasta + 1)
  const clavesVisibles = new Set(periodosVisibles.map((p) => p.clave))

  // Total solo en variables de energía (kWh, kVARh), donde sumar tiene sentido;
  // con promedios se multiplica por las lecturas de 5 minutos de cada periodo.
  const esEnergia = unidad.endsWith('h')
  const lecturasPorPeriodo = esEnergia ? LECTURAS_POR_PERIODO[agrupacion] : undefined
  const totalDe = (resumen) => (lecturasPorPeriodo && resumen.suma != null ? resumen.suma * lecturasPorPeriodo : null)

  // Una serie por fase consultada: nombre, color, valores por periodo y
  // resumen del tramo visible.
  const series = (resultado?.series ?? []).map(({ fase, puntos }) => {
    const { nombre, color } = FASES.find((f) => f.id === fase)
    const resumen = resumenDe(
      puntos.filter((p) => p.valor != null && clavesVisibles.has(p.clave)).map((p) => p.valor),
    )
    return {
      id: fase,
      nombre: `Fase ${nombre}`,
      color,
      valores: new Map(puntos.map((p) => [p.clave, p.valor])),
      resumen: { ...resumen, total: totalDe(resumen) },
    }
  })
  const variasFases = series.length > 1
  const totalFases = lecturasPorPeriodo ? series.reduce((suma, s) => suma + (s.resumen.total ?? 0), 0) : null

  // Eventos registrados del medidor consultado dentro del rango de fechas, con
  // los periodos de la gráfica que abarca su día (vacío si no se puede ubicar).
  const textoEvento = (idEvento) => {
    const evento = catalogoEventos.find((e) => e.id === idEvento)
    return evento ? `${evento.numEvento} – ${evento.descripcion}` : `Evento ID ${idEvento}`
  }
  const eventosDelRango =
    resultado && medidor
      ? registros
          .filter(
            (r) =>
              r.idMedidor === medidor.id &&
              r.idCtrlRF === medidor.idCtrlRF &&
              r.fecha >= resultado.filtros.fechaInicio &&
              r.fecha <= resultado.filtros.fechaFin,
          )
          .map((r) => ({ ...r, texto: textoEvento(r.idEvento), indices: indicesDeFecha(r.fecha, agrupacion, periodos) }))
      : []
  // Bandas de la gráfica: los periodos que abarca cada evento (sobre todos
  // los periodos, porque ECharts maneja su propio zoom).
  const marcadores = eventosDelRango
    .filter((e) => e.indices.length > 0)
    .map((e) => ({ inicio: e.indices[0], fin: e.indices[e.indices.length - 1], texto: `${e.texto} (${e.fecha})` }))

  // ── Navegación de la gráfica ──
  // Fija el tramo visible ajustándolo a los límites; si abarca todo, se quita.
  const fijarVentana = (inicio, tam) => {
    const total = periodos.length
    const tamano = Math.min(Math.max(Math.round(tam), Math.min(MIN_PERIODOS_VENTANA, total)), total)
    if (tamano >= total) {
      setVentana(null)
      return
    }
    const d = Math.min(Math.max(Math.round(inicio), 0), total - tamano)
    setVentana({ desde: d, hasta: d + tamano - 1 })
  }
  // Contenedor de la gráfica, para desplazar la vista hasta ella desde la tabla de eventos.
  const graficaRef = useRef(null)
  // Acerca la gráfica al día de un evento, con un margen a cada lado para ver
  // el contexto, y sube la vista hasta la gráfica (la tabla queda debajo).
  const verEvento = (e) => {
    graficaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const inicio = e.indices[0]
    const tam = e.indices[e.indices.length - 1] - inicio + 1
    const margen = Math.max(2, Math.round(tam / 2))
    fijarVentana(inicio - margen, tam + 2 * margen)
  }

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
              {controladores.length === 0 ? (
                <option value="">Cargando medidores…</option>
              ) : (
                <option value="" disabled>
                  Elige un medidor
                </option>
              )}
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
            <select value={filtros.idVar5M} onChange={cambiarVariable} className={claseControl()}>
              {variables.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre}
                  {v.unidad && ` (${v.unidad})`}
                </option>
              ))}
            </select>
          </label>
          {/* Fases: una, dos o las tres (casillas con el color de su línea).
              En variables de una sola fase, B y C quedan deshabilitadas. */}
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium text-slate-700">Fases</legend>
            <div className="flex h-[38px] items-center gap-2">
              {FASES.map((f) => (
                <label
                  key={f.id}
                  title={f.id > fasesVariable ? 'Esta variable se mide solo en la fase A.' : undefined}
                  className="flex h-full flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white text-sm text-slate-700 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-40"
                >
                  <input
                    type="checkbox"
                    checked={filtros.fases.includes(f.id)}
                    onChange={alternarFase(f.id)}
                    disabled={f.id > fasesVariable}
                    className="sr-only"
                  />
                  <MuestraFase color={f.color} />
                  {f.nombre}
                </label>
              ))}
            </div>
          </fieldset>
          {/* Rango de fechas con un solo calendario; ocupa dos columnas en pantallas anchas. */}
          <div className="xl:col-span-2">
            <SelectorRangoFechas
              desde={filtros.fechaInicio}
              hasta={filtros.fechaFin}
              onCambiar={(fechaInicio, fechaFin) => setFiltros((prev) => ({ ...prev, fechaInicio, fechaFin }))}
              maxDias={filtros.agrupacion === 'crudo' ? MAX_DIAS_CRUDO : undefined}
            />
          </div>
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
      {/* Aviso de "sin datos" del backend: en ámbar para que se note, sin
          confundirse con los errores (rojo). */}
      {!error && resultado?.mensaje && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
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

            {/* Aviso de que el resumen y la tabla corresponden al tramo acercado. */}
            {ventana && (
              <p className="mb-3 text-xs text-slate-500">
                Resumen del tramo visible: {periodosVisibles[0].etiqueta} a{' '}
                {periodosVisibles[periodosVisibles.length - 1].etiqueta} ({tamVentana} de {periodos.length}{' '}
                periodos).
              </p>
            )}

            {/* Resumen: tarjetas con una fase; tabla por fase con varias. */}
            {variasFases ? (
              <table className="mb-6 w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th scope="col" className={`${CLASE_TH} pl-0 text-left`}>
                      Fase
                    </th>
                    {['Mínimo', 'Promedio', 'Máximo', ...(lecturasPorPeriodo ? ['Total'] : [])].map((titulo) => (
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
                      {[
                        s.resumen.minimo,
                        s.resumen.promedio,
                        s.resumen.maximo,
                        ...(lecturasPorPeriodo ? [s.resumen.total] : []),
                      ].map((v, i) => (
                        <td key={i} className="px-4 py-2 text-right font-mono text-slate-900">
                          {formatoValor(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {/* Total de las fases juntas (solo energía). */}
                {lecturasPorPeriodo && (
                  <tfoot>
                    <tr className="border-t border-slate-300">
                      <th scope="row" colSpan={4} className="py-2 pr-4 text-left font-semibold text-slate-900">
                        Total de las fases
                      </th>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-slate-900">
                        {formatoValor(totalFases)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            ) : (
              <div
                className={`mb-6 grid grid-cols-1 gap-3 ${lecturasPorPeriodo ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}
              >
                <DatoResumen etiqueta="Mínimo" valor={series[0].resumen.minimo} unidad={unidad} />
                <DatoResumen etiqueta="Promedio" valor={series[0].resumen.promedio} unidad={unidad} />
                <DatoResumen etiqueta="Máximo" valor={series[0].resumen.maximo} unidad={unidad} />
                {lecturasPorPeriodo && <DatoResumen etiqueta="Total" valor={series[0].resumen.total} unidad={unidad} />}
              </div>
            )}
            {/* Por qué no hay total en energía agrupada por semana, mes o año. */}
            {esEnergia && !lecturasPorPeriodo && (
              <p className="-mt-4 mb-6 text-xs text-slate-500">
                El total de energía se muestra al agrupar cada 5 minutos, por hora o por día.
              </p>
            )}

            {/* Tramo visible o, sin zoom, cómo acercarse (el zoom se maneja en la gráfica). */}
            <p className="mb-3 text-xs text-slate-500">
              {ventana
                ? `Periodos ${desde + 1}–${hasta + 1} de ${periodos.length}`
                : 'Usa la rueda del mouse o el minimapa inferior para acercarte.'}
            </p>

            {/* Suspense muestra el aviso mientras se descarga ECharts (solo la primera vez). */}
            {/* Destino del desplazamiento de "Ver en la gráfica". */}
            <div ref={graficaRef}>
              <Suspense fallback={<p className="py-10 text-center text-sm text-slate-500">Cargando gráfica…</p>}>
                <GraficaECharts
                  periodos={periodos}
                  seriesCrudas={resultado.series}
                  unidad={unidad}
                  comoBarras={esEnergia}
                  marcadores={marcadores}
                  ventana={ventana}
                  onCambiarVentana={setVentana}
                />
              </Suspense>
            </div>
          </section>

          {/* Eventos registrados del medidor en el rango consultado. */}
          <section className="rounded-xl bg-white shadow-md">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                Eventos registrados
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Eventos del medidor entre {resultado.filtros.fechaInicio} y {resultado.filtros.fechaFin}. Se
                registran por día (sin hora), por eso en la gráfica se marca el día completo en rojo.
              </p>
            </div>
            {errorEventos && (
              <div className="m-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                No se pudieron cargar los eventos: {errorEventos}
              </div>
            )}
            {!errorEventos && eventosDelRango.length === 0 && (
              <p className="px-6 py-4 text-sm text-slate-500">
                No hay eventos registrados para este medidor en el rango consultado.
              </p>
            )}
            {!errorEventos && eventosDelRango.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Fecha', 'Evento', 'Consumo', ''].map((titulo) => (
                        <th key={titulo} scope="col" className={`${CLASE_TH} text-left`}>
                          {titulo}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eventosDelRango.map((e) => (
                      <tr key={`${e.idEvento}-${e.fecha}`} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-2 font-mono text-slate-700">{e.fecha}</td>
                        <td className="px-4 py-2 text-slate-900">{e.texto}</td>
                        <td className="px-4 py-2 font-mono text-slate-700">{formatoValor(e.consumo)}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-right">
                          {e.indices.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => verEvento(e)}
                              className="cursor-pointer rounded-md border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                            >
                              Ver en la gráfica
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {agrupacion === 'semana' ? 'No se ubica por semana' : 'Sin mediciones ese día'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Tabla de valores con scroll propio (las lecturas crudas pueden ser miles). */}
          <section className="rounded-xl bg-white shadow-md">
            {/* La unidad va aquí y no en cada columna: "Fase A (A)" se confundía
                con la fase A cuando la variable se mide en amperes. */}
            <div className="border-b border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900">
              {variable.nombre}
              {unidad && <span className="font-normal text-slate-500"> ({unidad})</span>}
            </div>
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
                            {s.nombre}
                          </span>
                        ) : (
                          'Valor'
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periodosVisibles.map((p) => (
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
