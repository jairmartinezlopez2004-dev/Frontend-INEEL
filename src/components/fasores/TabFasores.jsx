/**
 * TabFasores.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Fasores" del medidor: muestra por fase (A, B, C) el voltaje, la
 * corriente, el factor de potencia y el ángulo φ entre voltaje y corriente,
 * junto con el diagrama fasorial voltaje-corriente.
 *
 * Rol en el sistema:
 * Replica la pestaña Fasores del visor de escritorio anterior. El usuario
 * puede fijar un "Período de adquisición" en segundos: con 0 se hace una sola
 * lectura; con un valor mayor la lectura se repite cada ese número de
 * segundos hasta presionar "Detener". "Limpiar" regresa todo a cero.
 *
 * Convención del diagrama:
 * Igual que en el visor anterior, los ángulos crecen en sentido horario
 * (VA 0°, VB 120°, VC 240°) y cada corriente se dibuja atrasada φ grados
 * respecto a su voltaje. Sin lectura, los voltajes se dibujan a escala
 * completa en sus ángulos nominales como referencia.
 *
 * Integración con el WebService:
 * Pendiente. `lecturaSimulada` genera datos de ejemplo; al conectar el
 * backend se sustituirá por la llamada que lea los fasores del medidor.
 */
import { useEffect, useRef, useState } from 'react'

const FASES = ['A', 'B', 'C']

// Ángulos nominales de los voltajes de fase, en grados (sentido horario).
const ANGULOS_V = [0, 120, 240]

// Filas del panel de valores: clave en la lectura, etiqueta, decimales y unidad.
const FILAS = [
  { clave: 'v', etiqueta: 'V', decimales: 2, unidad: 'V' },
  { clave: 'i', etiqueta: 'I', decimales: 2, unidad: 'A' },
  { clave: 'fp', etiqueta: 'FP', decimales: 3, unidad: '' },
  { clave: 'phi', etiqueta: 'φ', decimales: 3, unidad: '°' },
]

const LECTURA_VACIA = { v: [0, 0, 0], i: [0, 0, 0], fp: [0, 0, 0], phi: [0, 0, 0] }

// Datos de ejemplo mientras no exista el método del WebService.
function lecturaSimulada() {
  const ruido = (base, amplitud) => base + (Math.random() - 0.5) * amplitud
  const v = [120.5, 119.8, 121.1].map((x) => ruido(x, 1))
  const i = [4.23, 4.185, 4.267].map((x) => ruido(x, 0.1))
  const phi = [13.3, 12.8, 13.6].map((x) => ruido(x, 1))
  const fp = phi.map((x) => Math.cos((x * Math.PI) / 180))
  return { v, i, fp, phi }
}

// Geometría del diagrama (coordenadas del viewBox).
const TAM = 400
const CENTRO = TAM / 2
const RADIO = 160

// Punto final de un vector de longitud `largo` y ángulo `grados` (horario).
// En SVG el eje Y crece hacia abajo, así que cos/sin directos dan giro horario.
function punta(largo, grados) {
  const rad = (grados * Math.PI) / 180
  return { x: CENTRO + largo * Math.cos(rad), y: CENTRO + largo * Math.sin(rad) }
}

// Props:
// - lectura: { v, i, phi } con un valor por fase.
function DiagramaFasorial({ lectura }) {
  const maxV = Math.max(...lectura.v)
  const maxI = Math.max(...lectura.i)

  const voltajes = FASES.map((fase, k) => {
    const largo = maxV > 0 ? (0.85 * RADIO * lectura.v[k]) / maxV : 0.85 * RADIO
    return { fase, angulo: ANGULOS_V[k], ...punta(largo, ANGULOS_V[k]) }
  })
  const corrientes = FASES.map((fase, k) => {
    const angulo = ANGULOS_V[k] + lectura.phi[k]
    const largo = maxI > 0 ? (0.5 * RADIO * lectura.i[k]) / maxI : 0.12 * RADIO
    return { fase, ...punta(largo, angulo) }
  })

  // Posición de la etiqueta: un poco más allá de la punta del vector.
  const etiqueta = ({ x, y }, separacion) => {
    const dx = x - CENTRO
    const dy = y - CENTRO
    const largo = Math.hypot(dx, dy) || 1
    return { x: x + (dx / largo) * separacion, y: y + (dy / largo) * separacion }
  }

  return (
    <svg viewBox={`0 0 ${TAM} ${TAM}`} className="h-full w-full" role="img" aria-label="Diagrama fasorial voltaje-corriente">
      <defs>
        <marker id="flecha-v" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#22d3ee" />
        </marker>
        <marker id="flecha-i" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#ef4444" />
        </marker>
      </defs>

      {/* Rejilla de referencia: círculos concéntricos y ejes. */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <circle key={f} cx={CENTRO} cy={CENTRO} r={RADIO * f} fill="none" stroke="#334155" strokeWidth="0.75" />
      ))}
      <line x1={CENTRO - RADIO} y1={CENTRO} x2={CENTRO + RADIO} y2={CENTRO} stroke="#334155" strokeWidth="0.75" />
      <line x1={CENTRO} y1={CENTRO - RADIO} x2={CENTRO} y2={CENTRO + RADIO} stroke="#334155" strokeWidth="0.75" />

      {voltajes.map((p) => {
        const t = etiqueta(p, 22)
        return (
          <g key={`v${p.fase}`}>
            <line x1={CENTRO} y1={CENTRO} x2={p.x} y2={p.y} stroke="#22d3ee" strokeWidth="2" markerEnd="url(#flecha-v)" />
            <text x={t.x} y={t.y} fill="#e2e8f0" fontSize="12" textAnchor="middle" dominantBaseline="middle">
              V{p.fase}({p.angulo.toFixed(1)}°)
            </text>
          </g>
        )
      })}
      {corrientes.map((p) => {
        const t = etiqueta(p, 12)
        return (
          <g key={`i${p.fase}`}>
            <line x1={CENTRO} y1={CENTRO} x2={p.x} y2={p.y} stroke="#ef4444" strokeWidth="2" markerEnd="url(#flecha-i)" />
            <text x={t.x} y={t.y} fill="#e2e8f0" fontSize="11" textAnchor="middle" dominantBaseline="middle">
              I{p.fase}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function TabFasores() {
  const [lectura, setLectura] = useState(LECTURA_VACIA)
  // Período de adquisición en segundos (0 = una sola lectura).
  const [periodo, setPeriodo] = useState(0)
  // Identificador del setInterval activo; null si no hay adquisición continua.
  const temporizador = useRef(null)
  const [adquiriendo, setAdquiriendo] = useState(false)

  const detener = () => {
    clearInterval(temporizador.current)
    temporizador.current = null
    setAdquiriendo(false)
  }

  // Detiene la adquisición si se cambia de pestaña o de medidor.
  useEffect(() => () => clearInterval(temporizador.current), [])

  // Punto donde, al conectar el backend, se pedirán los fasores al medidor.
  const solicitar = () => {
    setLectura(lecturaSimulada())
    if (periodo > 0) {
      temporizador.current = setInterval(() => setLectura(lecturaSimulada()), periodo * 1000)
      setAdquiriendo(true)
    }
  }

  const limpiar = () => {
    detener()
    setLectura(LECTURA_VACIA)
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold uppercase tracking-wide text-slate-800">Fasores</h2>
          {adquiriendo && (
            <span className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Adquiriendo cada {periodo} s
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          {/* Panel de valores por fase y controles de adquisición. */}
          <section className="flex flex-col gap-6 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5">
            <table className="w-full border-separate border-spacing-x-2 border-spacing-y-3">
              <thead>
                <tr>
                  <th />
                  {FASES.map((fase) => (
                    <th key={fase} className="text-xs font-semibold uppercase tracking-widest text-gray-900">
                      Fase {fase}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {FILAS.map((fila) => (
                  <tr key={fila.clave}>
                    <th scope="row" className="text-right text-sm font-bold text-gray-900">
                      {fila.etiqueta}:
                    </th>
                    {lectura[fila.clave].map((valor, k) => (
                      <td key={k} className="rounded-md bg-gray-50 px-3 py-2 text-right">
                        <span className="font-mono text-lg font-semibold text-green-500 tabular-nums">
                          {valor.toFixed(fila.decimales)}
                        </span>
                      </td>
                    ))}
                    <td className="text-xs font-medium text-gray-900">{fila.unidad && `(${fila.unidad})`}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <label className="flex items-center gap-3 text-sm font-medium text-gray-900">
              Período de adquisición (s)
              <input
                type="number"
                min={0}
                value={periodo}
                disabled={adquiriendo}
                onChange={(e) => setPeriodo(Math.max(0, Number(e.target.value) || 0))}
                className="w-20 rounded-md border-0 bg-gray-100 px-3 py-1.5 text-center text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
              />
            </label>

            <div className="mt-auto flex flex-wrap gap-3">
              <button
                type="button"
                onClick={solicitar}
                disabled={adquiriendo}
                className="transform cursor-pointer rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Solicitar
              </button>
              <button
                type="button"
                onClick={detener}
                disabled={!adquiriendo}
                className="cursor-pointer rounded-lg bg-gray-100 px-6 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Detener
              </button>
              <button
                type="button"
                onClick={limpiar}
                className="cursor-pointer rounded-lg bg-gray-100 px-6 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Limpiar
              </button>
            </div>
          </section>

          {/* Diagrama fasorial. */}
          <section className="flex flex-col rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
            <h3 className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-gray-900">
              Diagrama fasorial voltaje - corriente
            </h3>
            <div className="mx-auto aspect-square w-full max-w-xl rounded-xl bg-slate-900 p-2">
              <DiagramaFasorial lectura={lectura} />
            </div>
            <div className="mt-3 flex justify-center gap-6 text-xs font-medium text-gray-700">
              <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-cyan-400" />Voltaje</span>
              <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-red-500" />Corriente</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default TabFasores
