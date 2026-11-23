/**
 * TabArmonicos.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Contenido armónico" del medidor: lee del medidor los armónicos de
 * voltaje y corriente de las tres fases y los muestra en una tabla (Datos) o
 * en una gráfica de barras (Gráfico).
 *
 * Rol en el sistema:
 * - "Solicitar" (solo SuperAdministrador y Administrador, como las demás
 *   lecturas en línea) llama a POST /ConexionMedidor/armonicos. Una sola
 *   lectura trae los 6 puntos del grupo funcional 6: ARM_VA, ARM_VB, ARM_VC
 *   (voltaje) y ARM_IA, ARM_IB, ARM_IC (corriente).
 * - Los selectores Variable (Voltaje o Corriente) y Fase solo eligen qué
 *   parte de esa lectura se muestra: cambiarlos no vuelve a leer el medidor.
 * - Cada "Solicitar" limpia la lectura anterior antes de pedir la nueva.
 * - Si el backend lee unos puntos y otros no (503 parcial), se muestran los
 *   que sí llegaron y el mensaje indica cuáles fallaron.
 * - La tabla muestra los valores tal como los entrega la DLL (A1 es el
 *   primero de la lista). El THD se calcula con A2..An respecto a A1, y la
 *   gráfica expresa cada armónico en % de A1, al estilo de un analizador de
 *   calidad de la potencia.
 */
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { FASES as FASES_5M } from '../../services/medicion5MService'
import { solicitarArmonicos } from '../../services/conexionMedidorService'
import { formatearValor } from '../../hooks/useLecturaMedidor'
import { formatoDirRed } from '../../utils/direccionRed'
import { AudioWaveform, Download } from 'lucide-react'
import TituloSeccion from '../common/TituloSeccion'

// Se carga bajo demanda: ECharts solo se descarga al abrir el Gráfico.
const GraficaArmonicos = lazy(() => import('./GraficaArmonicos'))

// Mismos colores por fase que en Perfiles 5 Minutales.
const FASES = FASES_5M.map(({ nombre, color }) => ({ id: nombre, color }))

// Variables de armónicos: el `tipo` es el que devuelve el backend por punto
// ("V" para ARM_V*, "I" para ARM_I*).
const VARIABLES = [
  { id: 'voltaje', nombre: 'Voltaje', tipo: 'V' },
  { id: 'corriente', nombre: 'Corriente', tipo: 'I' },
]

// rolId del SuperAdministrador y del Administrador en la UI (authService.js).
const ROLES_ADMINISTRADOR = [1, 2]

// Estilos del mensaje de resultado según el estado de la lectura.
const CLASES_ESTADO = {
  enCurso: 'border-azul-200 bg-azul-50 text-azul-800',
  exito: 'border-verde-200 bg-verde-50 text-verde-700',
  aviso: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-700',
}

/** Tipo del punto ("V" o "I"): el del backend o, si no viene, el de su tag. */
const tipoDe = (punto) => punto.tipo ?? (/^ARM_V/i.test(punto.tag) ? 'V' : /^ARM_I/i.test(punto.tag) ? 'I' : null)

/**
 * Distorsión armónica total (%) de una lectura: raíz de la suma de cuadrados
 * de A2..An entre la fundamental A1. null si no hay fundamental.
 */
function calcularThd(valores) {
  const [fundamental, ...resto] = valores
  if (!fundamental) return null
  return (Math.sqrt(resto.reduce((suma, v) => suma + v * v, 0)) / Math.abs(fundamental)) * 100
}

const claseSelect =
  'w-full rounded-md border-0 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-azul-200'
const claseBoton =
  'inline-flex transform cursor-pointer items-center justify-center gap-2 rounded-lg bg-azul-700 px-6 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-azul-800 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'

// Props:
// - medidor: medidor seleccionado (se usan su id y su dirRed).
// - usuarioLogueado: solo los administradores pueden leer el medidor.
function TabArmonicos({ medidor, usuarioLogueado }) {
  const esAdmin = ROLES_ADMINISTRADOR.includes(usuarioLogueado?.rolId)
  const [variable, setVariable] = useState('voltaje')
  const [fase, setFase] = useState('todas')
  // Última lectura: null | { hora: Date, puntos: [...] } (se limpia en cada Solicitar).
  const [lectura, setLectura] = useState(null)
  // estado: null | { tipo: 'enCurso' | 'exito' | 'aviso' | 'error', texto }
  const [estado, setEstado] = useState(null)
  const [vista, setVista] = useState('datos')
  // Si la gráfica incluye la fundamental (A1 = 100 %); sin ella se aprecian
  // mejor los armónicos pequeños.
  const [conFundamental, setConFundamental] = useState(true)
  const controladorRef = useRef(null)

  // Si el usuario sale de la pestaña con una lectura en curso, se cancela.
  useEffect(() => () => controladorRef.current?.abort(), [])

  const leyendo = estado?.tipo === 'enCurso'

  const solicitar = async () => {
    controladorRef.current?.abort()
    const controlador = new AbortController()
    controladorRef.current = controlador

    // Limpia la lectura anterior antes de pedir la nueva.
    setLectura(null)
    setEstado({ tipo: 'enCurso', texto: `Solicitando armónicos al medidor ${formatoDirRed(medidor.dirRed)}…` })
    try {
      const { mensaje, completa, puntos } = await solicitarArmonicos(medidor.id, { signal: controlador.signal })
      setLectura({ hora: new Date(), puntos })
      setEstado({ tipo: completa ? 'exito' : 'aviso', texto: mensaje })
    } catch (err) {
      if (err.name === 'AbortError') return
      setEstado({ tipo: 'error', texto: err.message })
    }
  }

  const variableElegida = VARIABLES.find((v) => v.id === variable)
  const fasesMostradas = fase === 'todas' ? FASES : FASES.filter((f) => f.id === fase)

  // Punto de la variable elegida en cada fase mostrada (valores null si no llegó o falló).
  const columnas = fasesMostradas.map((f) => {
    const punto = lectura?.puntos.find((p) => p.nombreFase === f.id && tipoDe(p) === variableElegida.tipo)
    const valores = punto?.exitosa && punto.valores?.length ? punto.valores : null
    return { ...f, punto, valores, thd: valores ? calcularThd(valores) : null }
  })
  const conValores = columnas.filter((c) => c.valores)
  const hayDatos = conValores.length > 0
  // Número de armónicos: el mayor que entregó la DLL entre las fases mostradas.
  const numOrdenes = Math.max(0, ...conValores.map((c) => c.valores.length))
  const ordenes = Array.from({ length: numOrdenes }, (_, k) => k + 1)

  // Gráfica: THD y cada armónico en % de la fundamental (A1).
  const seriesGrafica = conValores.map((c) => {
    const fundamental = Math.abs(c.valores[0]) || null
    const porcentajes = c.valores.map((v) => (fundamental ? (v / fundamental) * 100 : 0))
    return {
      nombre: `Fase ${c.id}`,
      color: c.color,
      thd: c.thd ?? 0,
      valores: [c.thd ?? 0, ...(conFundamental ? porcentajes : porcentajes.slice(1))],
    }
  })
  const categorias = ['THD', ...(conFundamental ? ordenes : ordenes.slice(1)).map((n) => `A${n}`)]

  return (
    <div className="flex-1 overflow-auto pt-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <TituloSeccion
            Icono={AudioWaveform}
            titulo="Contenido armónico"
            subtitulo={
              lectura
                ? `Última lectura: ${lectura.hora.toLocaleString('es-MX')}`
                : 'Sin lectura. Pulse «Solicitar» para leer los armónicos del medidor.'
            }
          />
          {estado && (
            <div role="status" className={`rounded-md border p-3 text-sm ${CLASES_ESTADO[estado.tipo]}`}>
              {estado.texto}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          {/* Lectura y qué parte de ella se muestra. */}
          <section className="flex flex-col gap-5 self-start rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
              Variable
              <select value={variable} onChange={(e) => setVariable(e.target.value)} className={claseSelect}>
                {VARIABLES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
              Fase
              <select value={fase} onChange={(e) => setFase(e.target.value)} className={claseSelect}>
                <option value="todas">Todas</option>
                {FASES.map((f) => (
                  <option key={f.id} value={f.id}>
                    Fase {f.id}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-3 pt-2">
              {esAdmin ? (
                <button type="button" onClick={solicitar} disabled={leyendo || !medidor} className={claseBoton}>
                  <Download className={`h-4 w-4 ${leyendo ? 'animate-pulse' : ''}`} aria-hidden="true" />
                  {leyendo ? 'Solicitando…' : 'Solicitar'}
                </button>
              ) : (
                <p className="text-sm text-slate-500">Solo el Administrador puede solicitar lecturas al medidor.</p>
              )}
              <button type="button" onClick={() => setVista('grafico')} disabled={!hayDatos} className={claseBoton}>
                Graficar
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Una lectura trae voltaje y corriente de las tres fases; Variable y Fase solo eligen qué se muestra.
            </p>
          </section>

          {/* Resultados: subpestañas Datos / Gráfico. */}
          <section className="flex min-w-0 flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
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
                      ? 'border-azul-700 text-azul-700'
                      : 'border-transparent text-gray-700 hover:bg-azul-50 hover:text-azul-700'
                  }`}
                >
                  {t.texto}
                </button>
              ))}
            </nav>

            {vista === 'datos' ? (
              <div className="flex flex-col gap-3 p-6">
                {!lectura ? (
                  <p className="py-10 text-center text-sm text-gray-400">
                    {leyendo ? 'Leyendo armónicos…' : 'Sin lectura.'}
                  </p>
                ) : (
                  <>
                    {/* Un renglón por armónico y una columna por fase de la variable elegida. */}
                    <div className="max-h-[32rem] overflow-auto rounded-lg ring-1 ring-gray-200">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 border-b-2 border-verde-500 bg-verde-50 text-xs font-semibold text-verde-900">
                          <tr>
                            <th className="px-3 py-2 text-left">Armónico</th>
                            {columnas.map((c) => (
                              <th key={c.id} className="px-3 py-2 text-right">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                                  Fase {c.id}
                                  {c.punto && <span className="font-normal text-verde-800">({c.punto.tag})</span>}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {hayDatos ? (
                            <>
                              <tr className="bg-slate-50 font-semibold">
                                <td className="px-3 py-2 text-left text-gray-700">THD (%)</td>
                                {columnas.map((c) => (
                                  <td key={c.id} className="px-3 py-2 text-right font-mono tabular-nums text-gray-900">
                                    {c.thd === null ? '—' : formatearValor(c.thd)}
                                  </td>
                                ))}
                              </tr>
                              {ordenes.map((n) => (
                                <tr key={n} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-left text-gray-700">A{n}</td>
                                  {columnas.map((c) => (
                                    <td key={c.id} className="px-3 py-2 text-right font-mono tabular-nums text-gray-900">
                                      {c.valores ? formatearValor(c.valores[n - 1]) : '—'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </>
                          ) : (
                            <tr>
                              <td colSpan={columnas.length + 1} className="px-3 py-4 text-center text-gray-400">
                                El medidor no devolvió armónicos de {variableElegida.nombre.toLowerCase()}{' '}
                                {fase === 'todas' ? 'en ninguna fase' : `en la fase ${fase}`}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500">
                      Valores tal como los entrega el medidor; A1 es la fundamental. El THD se calcula con los demás
                      armónicos respecto a A1. «—» indica un punto que no se pudo leer.
                    </p>
                  </>
                )}
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
                              {s.thd.toFixed(2)} %
                            </span>
                          </span>
                        ))}
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-900">
                        <input
                          type="checkbox"
                          checked={conFundamental}
                          onChange={(e) => setConFundamental(e.target.checked)}
                          className="h-3.5 w-3.5 cursor-pointer rounded-sm border-gray-300 accent-azul-700 focus:outline-none focus:ring-2 focus:ring-azul-200"
                        />
                        Mostrar fundamental (A1)
                      </label>
                    </div>
                    <Suspense fallback={<div className="h-[380px] animate-pulse rounded-lg bg-gray-50" />}>
                      <GraficaArmonicos categorias={categorias} series={seriesGrafica} unidad="%f" />
                    </Suspense>
                    <p className="mt-2 text-xs text-gray-500">
                      {variableElegida.nombre}: cada armónico en % respecto a la fundamental (%f).
                    </p>
                  </>
                ) : (
                  <div className="flex h-[380px] items-center justify-center text-gray-400">
                    {leyendo ? 'Leyendo armónicos…' : 'Solicite una lectura para graficar'}
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
