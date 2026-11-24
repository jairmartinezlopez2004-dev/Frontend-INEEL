/**
 * TabFasores.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Fasores" del medidor: muestra por fase (A, B, C) el voltaje, la
 * corriente, el factor de potencia, el ángulo φ y el tipo de carga, junto con
 * el diagrama fasorial voltaje-corriente.
 *
 * Rol en el sistema:
 * - "Solicitar" (solo SuperAdministrador y Administrador, como las demás
 *   lecturas en línea) llama a POST /ConexionMedidor/fasores. Cada solicitud
 *   hace una sola lectura y reemplaza la anterior (no hay lectura periódica
 *   ni botón para limpiar).
 * - El backend calcula los ángulos con P, PR y FP; V e I solo se muestran y
 *   dan el largo de las flechas. Lo que no llegó viene en null y se muestra
 *   como «—». Si el backend responde 503 con algunos valores, se muestran y
 *   el mensaje indica qué falló.
 *
 * Convención del diagrama (la del backend):
 * Los ángulos se miden desde el eje horizontal positivo y crecen en sentido
 * antihorario: VA 0°, VB 240°, VC 120°; cada corriente va en su
 * anguloCorriente. Sin lectura, los voltajes se dibujan a escala completa en
 * sus ángulos nominales como referencia.
 */
import { useEffect, useRef, useState } from 'react'
import { Compass, Download } from 'lucide-react'
import TituloSeccion from '../common/TituloSeccion'
import { solicitarFasores } from '../../services/conexionMedidorService'
import { formatoDirRed } from '../../utils/direccionRed'

const FASES = ['A', 'B', 'C']

// Ángulos nominales de los voltajes de fase, en grados (sentido antihorario),
// los mismos que devuelve el backend en anguloVoltaje.
const ANGULOS_V = { A: 0, B: 240, C: 120 }

// Filas del panel de valores: campo de la respuesta, etiqueta, decimales y unidad.
const FILAS = [
  { campo: 'voltaje', etiqueta: 'V', decimales: 2, unidad: 'V' },
  { campo: 'corriente', etiqueta: 'I', decimales: 2, unidad: 'A' },
  { campo: 'factorPotencia', etiqueta: 'FP', decimales: 5, unidad: '' },
  { campo: 'anguloFactorPotencia', etiqueta: 'φ', decimales: 2, unidad: '°' },
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

const esNumero = (v) => typeof v === 'number' && Number.isFinite(v)

// Geometría del diagrama (coordenadas del viewBox).
const TAM = 400
const CENTRO = TAM / 2
const RADIO = 160

// Punto final de un vector de longitud `largo` y ángulo `grados` (antihorario).
// En SVG el eje Y crece hacia abajo, por eso se resta el seno.
function punta(largo, grados) {
  const rad = (grados * Math.PI) / 180
  return { x: CENTRO + largo * Math.cos(rad), y: CENTRO - largo * Math.sin(rad) }
}

// Props:
// - fases: { A, B, C } con los datos de cada fase de la última lectura, o null.
function DiagramaFasorial({ fases }) {
  const datos = FASES.map((f) => fases?.[f] ?? null)
  const maxV = Math.max(0, ...datos.map((d) => (esNumero(d?.voltaje) ? Math.abs(d.voltaje) : 0)))
  const maxI = Math.max(0, ...datos.map((d) => (esNumero(d?.corriente) ? Math.abs(d.corriente) : 0)))

  // Voltajes: con lectura, largo proporcional a V; sin ella, a escala completa.
  const voltajes = FASES.map((fase, k) => {
    const d = datos[k]
    const angulo = esNumero(d?.anguloVoltaje) ? d.anguloVoltaje : ANGULOS_V[fase]
    const largo = esNumero(d?.voltaje) && maxV > 0 ? (0.85 * RADIO * Math.abs(d.voltaje)) / maxV : 0.85 * RADIO
    return { fase, angulo, ...punta(largo, angulo) }
  })
  // Corrientes: solo las fases con ángulo calculado (no "Sin carga" ni "Sin lectura").
  const corrientes = FASES.flatMap((fase, k) => {
    const d = datos[k]
    if (!esNumero(d?.anguloCorriente)) return []
    const largo = esNumero(d.corriente) && maxI > 0 ? (0.5 * RADIO * Math.abs(d.corriente)) / maxI : 0.5 * RADIO
    return [{ fase, angulo: d.anguloCorriente, ...punta(largo, d.anguloCorriente) }]
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
        const t = etiqueta(p, 14)
        return (
          <g key={`i${p.fase}`}>
            <line x1={CENTRO} y1={CENTRO} x2={p.x} y2={p.y} stroke="#ef4444" strokeWidth="2" markerEnd="url(#flecha-i)" />
            <text x={t.x} y={t.y} fill="#e2e8f0" fontSize="11" textAnchor="middle" dominantBaseline="middle">
              I{p.fase}({p.angulo.toFixed(1)}°)
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// Props:
// - medidor: medidor seleccionado (se usan su id y su dirRed).
// - usuarioLogueado: solo los administradores pueden leer el medidor.
function TabFasores({ medidor, usuarioLogueado }) {
  const esAdmin = ROLES_ADMINISTRADOR.includes(usuarioLogueado?.rolId)
  // Última lectura: null | { hora: Date, fases: { A, B, C } } (se limpia en cada Solicitar).
  const [lectura, setLectura] = useState(null)
  // estado: null | { tipo: 'enCurso' | 'exito' | 'aviso' | 'error', texto }
  const [estado, setEstado] = useState(null)
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
    setEstado({ tipo: 'enCurso', texto: `Solicitando fasores al medidor ${formatoDirRed(medidor.dirRed)}…` })
    try {
      const { mensaje, completa, fases } = await solicitarFasores(medidor.id, { signal: controlador.signal })
      const porFase = Object.fromEntries(fases.map((f) => [f.nombreFase, f]))
      setLectura({ hora: new Date(), fases: porFase })
      setEstado({ tipo: completa ? 'exito' : 'aviso', texto: mensaje })
    } catch (err) {
      if (err.name === 'AbortError') return
      setEstado({ tipo: 'error', texto: err.message })
    }
  }

  // Valor de un campo de una fase con sus decimales, o «—» si no llegó.
  const mostrar = (fase, fila) => {
    const valor = lectura?.fases[fase]?.[fila.campo]
    return esNumero(valor) ? valor.toFixed(fila.decimales) : '—'
  }

  return (
    <div className="flex-1 overflow-auto pt-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <TituloSeccion
            Icono={Compass}
            titulo="Fasores"
            subtitulo={
              lectura
                ? `Última lectura: ${lectura.hora.toLocaleString('es-MX')}`
                : 'Sin lectura. Pulse «Solicitar» para leer los fasores del medidor.'
            }
          />
          {estado && (
            <div role="status" className={`rounded-md border p-3 text-sm ${CLASES_ESTADO[estado.tipo]}`}>
              {estado.texto}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,38rem)_minmax(0,1fr)]">
          {/* Panel de valores por fase y botón Solicitar. */}
          <section className="flex flex-col gap-6 self-start rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* Anchos fijos: etiqueta, tres fases iguales y unidad, para que los valores queden alineados. */}
            <table className="w-full table-fixed border-separate border-spacing-x-2 border-spacing-y-3">
              <colgroup>
                <col className="w-16" />
                <col />
                <col />
                <col />
                <col className="w-10" />
              </colgroup>
              <thead>
                <tr>
                  <th />
                  {FASES.map((fase) => (
                    <th key={fase} className="px-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-600">
                      Fase {fase}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {FILAS.map((fila) => (
                  <tr key={fila.campo}>
                    <th scope="row" className="text-right text-sm font-bold text-gray-900">
                      {fila.etiqueta}:
                    </th>
                    {FASES.map((fase) => (
                      <td key={fase} className="rounded-md bg-gray-50 px-3 py-2 text-right">
                        <span className="font-mono text-lg font-semibold text-verde-500 tabular-nums">
                          {mostrar(fase, fila)}
                        </span>
                      </td>
                    ))}
                    <td className="text-xs font-medium text-gray-900">{fila.unidad && `(${fila.unidad})`}</td>
                  </tr>
                ))}
                {/* Tipo de carga que calcula el backend (p. ej. «Consumo inductivo»). */}
                <tr>
                  <th scope="row" className="text-right text-sm font-bold text-gray-900">
                    Carga:
                  </th>
                  {FASES.map((fase) => (
                    <td key={fase} className="px-3 text-right text-xs font-medium leading-snug text-gray-700">
                      {lectura?.fases[fase]?.tipo || '—'}
                    </td>
                  ))}
                  <td />
                </tr>
              </tbody>
            </table>

            <div className="flex flex-wrap justify-center gap-3">
              {esAdmin ? (
                <button
                  type="button"
                  onClick={solicitar}
                  disabled={leyendo || !medidor}
                  className="inline-flex transform cursor-pointer items-center justify-center gap-2 rounded-lg bg-azul-700 px-6 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-azul-800 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className={`h-4 w-4 ${leyendo ? 'animate-pulse' : ''}`} aria-hidden="true" />
                  {leyendo ? 'Solicitando…' : 'Solicitar'}
                </button>
              ) : (
                <p className="text-sm text-slate-500">Solo el Administrador puede solicitar lecturas al medidor.</p>
              )}
            </div>
          </section>

          {/* Diagrama fasorial. */}
          <section className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-600">
              Diagrama fasorial voltaje - corriente
            </h3>
            <div className="mx-auto aspect-square w-full max-w-xl rounded-xl bg-azul-950 p-2">
              <DiagramaFasorial fases={lectura?.fases ?? null} />
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
