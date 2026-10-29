/**
 * TabArmonicos.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Contenido armónico" del medidor: el usuario elige la variable
 * (del catálogo Vars5M) y la fase, solicita la lectura y ve los armónicos
 * A1 a A10 de cada fase en tablas (Datos) o en una gráfica de barras
 * (Gráfico).
 *
 * Rol en el sistema:
 * Replica la pestaña Armónicos del visor de escritorio anterior. Cada
 * "Solicitar" agrega un renglón con la hora de la lectura a la tabla de cada
 * fase consultada; "Graficar" muestra la última lectura de cada fase. La
 * gráfica sigue el estilo de un analizador de calidad de la potencia: barra
 * de THD seguida de cada armónico en % de la fundamental.
 *
 * Integración con el WebService:
 * Pendiente. `lecturaSimulada` genera datos de ejemplo (porcentaje respecto a
 * la fundamental); al conectar el backend se sustituirá por la llamada que
 * lea los armónicos del medidor.
 */
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { FASES as FASES_5M, VARIABLES_5M, listarVariables5M } from '../../services/medicion5MService'

// Se carga bajo demanda: ECharts solo se descarga al abrir el Gráfico.
const GraficaArmonicos = lazy(() => import('./GraficaArmonicos'))

// Mismos colores por fase que en Perfiles 5 Minutales.
const FASES = FASES_5M.map(({ nombre, color }) => ({ id: nombre, color }))

const ORDENES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
// % respecto a la fundamental, como lo muestran los analizadores.
const UNIDAD = '%f'

// Porcentaje típico de cada armónico (A1..A10) respecto a la fundamental.
const BASE_SIMULADA = {
  voltaje: [100, 0.2, 2.5, 0.1, 3.0, 0.1, 1.5, 0.1, 0.6, 0.05],
  corriente: [100, 1.0, 25, 0.8, 15, 0.5, 8, 0.4, 4, 0.3],
}

// Datos de ejemplo mientras no exista el método del WebService: las variables
// de voltaje usan el perfil de voltaje y las demás el de corriente.
function lecturaSimulada(variable) {
  const perfil = /volt/i.test(variable.nombre) ? 'voltaje' : 'corriente'
  return BASE_SIMULADA[perfil].map((x, k) => (k === 0 ? x : Math.max(0, x * (1 + (Math.random() - 0.5) * 0.3))))
}

/**
 * Distorsión armónica total (%) de una lectura: raíz de la suma de cuadrados
 * de A2..An entre la fundamental A1.
 */
function calcularThd(valores) {
  const [fundamental, ...resto] = valores
  if (!fundamental) return 0
  return (Math.sqrt(resto.reduce((suma, v) => suma + v * v, 0)) / fundamental) * 100
}

const horaActual = () => new Date().toLocaleTimeString('es-MX', { hour12: false })

const claseSelect =
  'w-full rounded-md border-0 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200'

function TabArmonicos() {
  // Catálogo de variables: el de respaldo hasta que responda el WebService.
  const [variables, setVariables] = useState(VARIABLES_5M)
  // id (texto) de la variable elegida en el selector.
  const [variable, setVariable] = useState('')
  const [fase, setFase] = useState('todas')
  // Lecturas acumuladas por fase: { A: [{ hora, valores }], B: [...], C: [...] }.
  const [lecturas, setLecturas] = useState({ A: [], B: [], C: [] })
  // Variable de las lecturas mostradas; al cambiar de variable se reinician.
  const [variableLeida, setVariableLeida] = useState('')
  const [vista, setVista] = useState('datos')
  // Si la gráfica incluye la fundamental (A1 = 100 %); sin ella se aprecian
  // mejor los armónicos pequeños.
  const [conFundamental, setConFundamental] = useState(true)

  // Mismo catálogo que Perfiles 5 Minutales (GET /Vars5M); si falla se
  // queda el de respaldo.
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

  const variableElegida = variables.find((v) => String(v.id) === variable)
  // Las variables de una sola fase solo se miden en la fase A.
  const esMonofasica = variableElegida?.fases === 1

  const elegirVariable = (id) => {
    setVariable(id)
    if (variables.find((v) => String(v.id) === id)?.fases === 1 && fase !== 'todas') setFase('A')
  }

  const hayDatos = FASES.some((f) => lecturas[f.id].length > 0)

  // Punto donde, al conectar el backend, se pedirán los armónicos al medidor.
  const solicitar = () => {
    const hora = horaActual()
    const fasesALeer = esMonofasica ? ['A'] : fase === 'todas' ? FASES.map((f) => f.id) : [fase]
    const base = variable === variableLeida ? lecturas : { A: [], B: [], C: [] }
    const siguiente = { ...base }
    for (const id of fasesALeer) {
      siguiente[id] = [...base[id], { hora, valores: lecturaSimulada(variableElegida) }]
    }
    setLecturas(siguiente)
    setVariableLeida(variable)
  }

  // Última lectura de cada fase: THD seguido de los armónicos.
  const seriesGrafica = useMemo(
    () =>
      FASES.filter((f) => lecturas[f.id].length > 0).map((f) => {
        const { valores } = lecturas[f.id].at(-1)
        const thd = calcularThd(valores)
        return {
          nombre: `Fase ${f.id}`,
          color: f.color,
          thd,
          valores: [thd, ...(conFundamental ? valores : valores.slice(1))],
        }
      }),
    [lecturas, conFundamental],
  )
  const categorias = useMemo(
    () => ['THD', ...(conFundamental ? ORDENES : ORDENES.slice(1)).map((n) => `A${n}`)],
    [conFundamental],
  )

  const textoVariable = variables.find((v) => String(v.id) === variableLeida)?.nombre

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold uppercase tracking-wide text-slate-800">Contenido armónico</h2>
          {textoVariable && (
            <span className="text-sm font-medium text-gray-600">
              Variable: <span className="font-semibold text-gray-900">{textoVariable}</span>
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          {/* Selección de variable y fase, y acciones. */}
          <section className="flex flex-col gap-5 self-start rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-gray-900">
              Variable
              <select value={variable} onChange={(e) => elegirVariable(e.target.value)} className={claseSelect}>
                <option value="">Seleccione…</option>
                {variables.map((v) => (
                  <option key={v.id} value={String(v.id)}>
                    {v.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-gray-900">
              Fase
              <select value={fase} onChange={(e) => setFase(e.target.value)} className={claseSelect}>
                <option value="todas">Todas</option>
                {FASES.map((f) => (
                  <option key={f.id} value={f.id} disabled={esMonofasica && f.id !== 'A'}>
                    Fase {f.id}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={solicitar}
                disabled={!variable}
                title={variable ? undefined : 'Seleccione una variable'}
                className="transform cursor-pointer rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Solicitar
              </button>
              <button
                type="button"
                onClick={() => setVista('grafico')}
                disabled={!hayDatos}
                className="transform cursor-pointer rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Graficar
              </button>
            </div>
          </section>

          {/* Resultados: subpestañas Datos / Gráfico. */}
          <section className="flex min-w-0 flex-col rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
            <nav className="flex gap-1 border-b border-gray-200 px-4 pt-2">
              {[
                { id: 'datos', texto: 'Datos' },
                { id: 'grafico', texto: 'Gráfico' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setVista(t.id)}
                  className={`rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                    vista === t.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {t.texto}
                </button>
              ))}
            </nav>

            {vista === 'datos' ? (
              <div className="flex flex-col gap-6 p-6">
                {FASES.map((f) => (
                  <div key={f.id}>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-900">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: f.color }} />
                      Fase {f.id}
                    </h3>
                    <div className="overflow-x-auto rounded-lg ring-1 ring-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs font-semibold text-gray-700">
                          <tr>
                            <th className="px-3 py-2 text-left">#</th>
                            <th className="px-3 py-2 text-left">Hora</th>
                            {ORDENES.map((n) => (
                              <th key={n} className="px-3 py-2 text-right">
                                A{n}
                              </th>
                            ))}
                            <th className="px-3 py-2 text-right">THD</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {lecturas[f.id].length === 0 ? (
                            <tr>
                              <td colSpan={ORDENES.length + 3} className="px-3 py-4 text-center text-gray-400">
                                Sin lecturas
                              </td>
                            </tr>
                          ) : (
                            lecturas[f.id].map((l, k) => (
                              <tr key={k} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-500">{k + 1}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{l.hora}</td>
                                {l.valores.map((v, n) => (
                                  <td key={n} className="px-3 py-2 text-right font-mono tabular-nums text-gray-900">
                                    {v.toFixed(2)}
                                  </td>
                                ))}
                                <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-gray-900">
                                  {calcularThd(l.valores).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-500">Valores en % respecto a la fundamental (A1).</p>
              </div>
            ) : (
              <div className="p-6">
                {hayDatos ? (
                  <>
                    {/* Resumen arriba de la gráfica: THD de cada fase y opción de la fundamental. */}
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                        {seriesGrafica.map((s) => (
                          <span key={s.nombre} className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                            {s.nombre}: THD{' '}
                            <span className="font-mono font-semibold tabular-nums text-gray-900">
                              {s.thd.toFixed(2)} %f
                            </span>
                          </span>
                        ))}
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-900">
                        <input
                          type="checkbox"
                          checked={conFundamental}
                          onChange={(e) => setConFundamental(e.target.checked)}
                          className="h-3.5 w-3.5 cursor-pointer rounded-sm border-gray-300 accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        />
                        Mostrar fundamental (A1)
                      </label>
                    </div>
                    <Suspense fallback={<div className="h-[380px] animate-pulse rounded-lg bg-gray-50" />}>
                      <GraficaArmonicos categorias={categorias} series={seriesGrafica} unidad={UNIDAD} />
                    </Suspense>
                    <p className="mt-2 text-xs text-gray-500">
                      Última lectura de cada fase, en % respecto a la fundamental (%f).
                    </p>
                  </>
                ) : (
                  <div className="flex h-[380px] items-center justify-center text-gray-400">
                    Solicite una lectura para graficar
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default TabArmonicos
