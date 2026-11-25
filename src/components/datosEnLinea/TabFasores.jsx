/**
 * TabFasores.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Fasores" del medidor: muestra por fase (A, B, C) las magnitudes,
 * potencias y ángulos que envía el backend, junto con el diagrama fasorial
 * voltaje-corriente, con presentación de instrumento de medición.
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
 * - P y PR llegan de la DLL sin escalar, en W y VAr (con 120 V y 2 A llegan
 *   ~240); la tabla los muestra en kW y kVAr, como pidió el usuario.
 *
 * Convención del diagrama (la del visor de escritorio anterior, acordada con
 * el backend):
 * Los ángulos se miden desde el eje horizontal positivo (VA en 0°) y crecen
 * en sentido horario, es decir, 90° queda hacia abajo: VA 0°, VB 120°,
 * VC 240°. El backend ya manda anguloVoltaje y anguloCorriente en esta
 * convención, así que se dibujan tal como llegan. Sin lectura, los voltajes
 * se dibujan tenues en sus ángulos nominales como referencia.
 *
 * Colores de fase: los mismos de Instantáneos y las gráficas (A azul,
 * B naranja, C verde). Voltaje = línea continua; corriente = línea punteada.
 */
import { useEffect, useRef, useState } from 'react'
import { Compass, Download } from 'lucide-react'
import TituloSeccion from '../common/TituloSeccion'
import { BotonPrimario } from '../common/Botones'
import { solicitarFasores } from '../../services/conexionMedidorService'
import { formatoDirRed } from '../../utils/direccionRed'

const FASES = ['A', 'B', 'C']

// Ángulos nominales de los voltajes de fase, en grados (sentido horario).
const ANGULOS_V = { A: 0, B: 120, C: 240 }

// Color de cada fase: trazo en el diagrama (tono 400, legible sobre fondo
// oscuro) y punto del encabezado de la tabla (tono 500, como Instantáneos).
const COLOR_FASE = {
  A: { trazo: '#60a5fa', punto: 'bg-blue-500' },
  B: { trazo: '#fb923c', punto: 'bg-orange-500' },
  C: { trazo: '#34d399', punto: 'bg-emerald-500' },
}

// Filas de la tabla, por grupo: campo de la respuesta, símbolo, descripción,
// unidad, decimales y, si aplica, factor para convertir la unidad.
const GRUPOS = [
  {
    titulo: 'Magnitudes',
    filas: [
      { campo: 'voltaje', simbolo: 'V', nombre: 'Voltaje', unidad: 'V', decimales: 2 },
      { campo: 'corriente', simbolo: 'I', nombre: 'Corriente', unidad: 'A', decimales: 3 },
    ],
  },
  {
    titulo: 'Potencia',
    filas: [
      { campo: 'potenciaActiva', simbolo: 'P', nombre: 'Potencia activa', unidad: 'kW', decimales: 3, factor: 1 / 1000 },
      { campo: 'potenciaReactiva', simbolo: 'Q', nombre: 'Potencia reactiva', unidad: 'kVAr', decimales: 3, factor: 1 / 1000 },
      { campo: 'factorPotencia', simbolo: 'FP', nombre: 'Factor de potencia', unidad: '', decimales: 5 },
    ],
  },
  {
    titulo: 'Ángulos',
    filas: [
      { campo: 'anguloFactorPotencia', simbolo: 'φ', nombre: 'Ángulo del FP', unidad: '°', decimales: 2 },
      { campo: 'anguloVoltaje', simbolo: 'θV', nombre: 'Ángulo del voltaje', unidad: '°', decimales: 1 },
      { campo: 'anguloCorriente', simbolo: 'θI', nombre: 'Ángulo de la corriente', unidad: '°', decimales: 1 },
    ],
  },
]

// Cuadrante que calcula el backend (1..4) en números romanos.
const ROMANOS = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' }

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
const TAM = 440
const CENTRO = TAM / 2
const RADIO = 170

// Punto a distancia `largo` del centro con ángulo `grados` (horario: 90° queda
// hacia abajo). En SVG el eje Y crece hacia abajo, así que sumar el seno da
// directamente el giro horario.
function punta(largo, grados) {
  const rad = (grados * Math.PI) / 180
  return { x: CENTRO + largo * Math.cos(rad), y: CENTRO + largo * Math.sin(rad) }
}

// Escala angular: una marca cada 10°, más larga y con número cada 30°.
const MARCAS = Array.from({ length: 36 }, (_, k) => k * 10)

// Props:
// - fases: { A, B, C } con los datos de cada fase de la última lectura, o null.
function DiagramaFasorial({ fases }) {
  const datos = FASES.map((f) => fases?.[f] ?? null)
  const hayLectura = datos.some(Boolean)
  const maxV = Math.max(0, ...datos.map((d) => (esNumero(d?.voltaje) ? Math.abs(d.voltaje) : 0)))
  const maxI = Math.max(0, ...datos.map((d) => (esNumero(d?.corriente) ? Math.abs(d.corriente) : 0)))

  // Voltajes: con lectura, largo proporcional a V; sin ella, a escala completa.
  const voltajes = FASES.map((fase, k) => {
    const d = datos[k]
    const angulo = esNumero(d?.anguloVoltaje) ? d.anguloVoltaje : ANGULOS_V[fase]
    const largo = esNumero(d?.voltaje) && maxV > 0 ? (0.82 * RADIO * Math.abs(d.voltaje)) / maxV : 0.82 * RADIO
    return { fase, angulo, largo }
  })
  // Corrientes: solo las fases con ángulo calculado (no "Sin carga" ni "Sin lectura").
  const corrientes = FASES.flatMap((fase, k) => {
    const d = datos[k]
    if (!esNumero(d?.anguloCorriente)) return []
    const largo = esNumero(d.corriente) && maxI > 0 ? (0.55 * RADIO * Math.abs(d.corriente)) / maxI : 0.55 * RADIO
    return [{ fase, angulo: d.anguloCorriente, largo }]
  })

  // Etiqueta de un vector: más allá de la punta y, para la corriente, corrida
  // a un lado para no encimarse con el voltaje cuando van casi juntos.
  const etiqueta = ({ largo, angulo }, separacion, lateral = 0) => {
    const p = punta(largo + separacion, angulo)
    const rad = (angulo * Math.PI) / 180
    return { x: p.x - lateral * Math.sin(rad), y: p.y + lateral * Math.cos(rad) }
  }

  return (
    <svg
      viewBox={`0 0 ${TAM} ${TAM}`}
      className="h-full w-full font-mono"
      role="img"
      aria-label="Diagrama fasorial voltaje-corriente"
    >
      <defs>
        {FASES.map((fase) => (
          <marker
            key={fase}
            id={`flecha-${fase}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={COLOR_FASE[fase].trazo} />
          </marker>
        ))}
      </defs>

      {/* Rejilla: círculos concéntricos y radiales cada 30°. */}
      {[0.25, 0.5, 0.75].map((f) => (
        <circle key={f} cx={CENTRO} cy={CENTRO} r={RADIO * f} fill="none" stroke="#334155" strokeWidth="0.75" strokeDasharray="2 3" />
      ))}
      <circle cx={CENTRO} cy={CENTRO} r={RADIO} fill="none" stroke="#64748b" strokeWidth="1" />
      {MARCAS.filter((g) => g % 30 === 0).map((g) => {
        const p = punta(RADIO, g)
        const ejePrincipal = g % 90 === 0
        return (
          <line
            key={`r${g}`}
            x1={CENTRO}
            y1={CENTRO}
            x2={p.x}
            y2={p.y}
            stroke={ejePrincipal ? '#475569' : '#1e293b'}
            strokeWidth={ejePrincipal ? 1 : 0.75}
          />
        )
      })}

      {/* Escala de grados alrededor del círculo (sentido horario). */}
      {MARCAS.map((g) => {
        const mayor = g % 30 === 0
        const a = punta(RADIO, g)
        const b = punta(RADIO + (mayor ? 8 : 4), g)
        return <line key={`m${g}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#64748b" strokeWidth="1" />
      })}
      {MARCAS.filter((g) => g % 30 === 0).map((g) => {
        const p = punta(RADIO + 22, g)
        return (
          <text key={`t${g}`} x={p.x} y={p.y} fill="#94a3b8" fontSize="11" textAnchor="middle" dominantBaseline="middle">
            {g}°
          </text>
        )
      })}

      {/* Voltajes: línea continua; tenues mientras no hay lectura. */}
      {voltajes.map((v) => {
        const p = punta(v.largo, v.angulo)
        const t = etiqueta(v, 14)
        return (
          <g key={`v${v.fase}`} opacity={hayLectura ? 1 : 0.35}>
            <line
              x1={CENTRO}
              y1={CENTRO}
              x2={p.x}
              y2={p.y}
              stroke={COLOR_FASE[v.fase].trazo}
              strokeWidth="2.5"
              markerEnd={`url(#flecha-${v.fase})`}
            />
            <text x={t.x} y={t.y} fill={COLOR_FASE[v.fase].trazo} fontSize="13" fontWeight="700" textAnchor="middle" dominantBaseline="middle">
              V{v.fase}
            </text>
          </g>
        )
      })}

      {/* Corrientes: línea punteada del color de su fase. */}
      {corrientes.map((c) => {
        const p = punta(c.largo, c.angulo)
        const t = etiqueta(c, 10, 12)
        return (
          <g key={`i${c.fase}`}>
            <line
              x1={CENTRO}
              y1={CENTRO}
              x2={p.x}
              y2={p.y}
              stroke={COLOR_FASE[c.fase].trazo}
              strokeWidth="2"
              strokeDasharray="6 3"
              markerEnd={`url(#flecha-${c.fase})`}
            />
            <text x={t.x} y={t.y} fill={COLOR_FASE[c.fase].trazo} fontSize="12" fontWeight="600" textAnchor="middle" dominantBaseline="middle">
              I{c.fase}
            </text>
          </g>
        )
      })}

      <circle cx={CENTRO} cy={CENTRO} r="3" fill="#cbd5e1" />
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

  // Valor de un campo de una fase, convertido y con sus decimales, o «—» si no llegó.
  const mostrar = (fase, fila) => {
    const valor = lectura?.fases[fase]?.[fila.campo]
    return esNumero(valor) ? (valor * (fila.factor ?? 1)).toFixed(fila.decimales) : '—'
  }

  return (
    <div className="flex-1 overflow-auto pt-4">
      <div className="flex flex-col gap-4">
        {/* Encabezado: título, hora de la lectura y botón Solicitar. */}
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TituloSeccion
              Icono={Compass}
              titulo="Fasores"
              subtitulo={
                lectura
                  ? `Última lectura: ${lectura.hora.toLocaleString('es-MX')}`
                  : 'Sin lectura. Pulse «Solicitar» para leer los fasores del medidor.'
              }
            />
            {esAdmin ? (
              <BotonPrimario Icono={Download} onClick={solicitar} disabled={leyendo || !medidor} className="px-6">
                {leyendo ? 'Solicitando…' : 'Solicitar'}
              </BotonPrimario>
            ) : (
              <p className="text-sm text-slate-500">Solo el Administrador puede solicitar lecturas al medidor.</p>
            )}
          </div>
          {estado && (
            <div role="status" className={`rounded-md border p-3 text-sm ${CLASES_ESTADO[estado.tipo]}`}>
              {estado.texto}
            </div>
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Tabla de valores por fase, agrupada como en un instrumento. */}
          <section className="self-start overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-verde-500 bg-verde-50 text-xs font-semibold uppercase tracking-wide text-verde-900">
                  <th scope="col" className="px-4 py-3 text-left">Parámetro</th>
                  <th scope="col" className="px-2 py-3 text-left">Unidad</th>
                  {FASES.map((fase) => (
                    <th key={fase} scope="col" className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${COLOR_FASE[fase].punto}`} aria-hidden="true" />
                        Fase {fase}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              {GRUPOS.map((grupo) => (
                <tbody key={grupo.titulo} className="divide-y divide-gray-100">
                  <tr className="bg-slate-50">
                    <th
                      scope="colgroup"
                      colSpan={2 + FASES.length}
                      className="px-4 py-1.5 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-500"
                    >
                      {grupo.titulo}
                    </th>
                  </tr>
                  {grupo.filas.map((fila) => (
                    <tr key={fila.campo} className="hover:bg-slate-50">
                      <th scope="row" className="px-4 py-2 text-left font-normal">
                        <span className="inline-block w-8 font-mono font-bold text-slate-800">{fila.simbolo}</span>
                        <span className="text-slate-600">{fila.nombre}</span>
                      </th>
                      <td className="px-2 py-2 font-mono text-xs text-slate-500">{fila.unidad}</td>
                      {FASES.map((fase) => (
                        <td key={fase} className="px-4 py-2 text-right font-mono text-base font-semibold tabular-nums text-verde-600">
                          {mostrar(fase, fila)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
              {/* Cuadrante y tipo de carga que calcula el backend. */}
              <tbody>
                <tr className="border-t-2 border-gray-200 bg-slate-50/60">
                  <th scope="row" colSpan={2} className="px-4 py-3 text-left font-normal">
                    <span className="inline-block w-8" aria-hidden="true" />
                    <span className="text-slate-600">Cuadrante y carga</span>
                  </th>
                  {FASES.map((fase) => {
                    const d = lectura?.fases[fase]
                    return (
                      <td key={fase} className="px-4 py-3 text-right align-top">
                        <span className="block font-mono text-base font-bold text-slate-800">
                          {ROMANOS[d?.cuadrante] ?? '—'}
                        </span>
                        <span className="block text-xs leading-snug text-slate-500">{d?.tipo || ''}</span>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </section>

          {/* Diagrama fasorial. */}
          <section className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-600">
              Diagrama fasorial voltaje - corriente
            </h3>
            <div className="mx-auto aspect-square w-full max-w-lg rounded-lg bg-azul-950 p-1">
              <DiagramaFasorial fases={lectura?.fases ?? null} />
            </div>
            {/* Leyenda: color por fase y tipo de línea por magnitud. */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
              {FASES.map((fase) => (
                <span key={fase} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${COLOR_FASE[fase].punto}`} aria-hidden="true" />
                  Fase {fase}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-6 bg-slate-500" aria-hidden="true" />
                Voltaje
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 border-t-2 border-dashed border-slate-500" aria-hidden="true" />
                Corriente
              </span>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Ángulos en sentido horario desde VA (0°). Largo de las flechas proporcional a la magnitud de cada fase.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default TabFasores
