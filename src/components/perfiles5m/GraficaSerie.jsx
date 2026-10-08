/**
 * GraficaSerie.jsx
 * ---------------------------------------------------------------------------
 * Gráfica de líneas (SVG, sin librerías) de una o varias series de
 * mediciones que comparten periodos (por ejemplo, las fases A, B y C).
 * La usa ConsultaPerfiles5M para dibujar el resultado de la consulta.
 *
 * - Eje X: un punto por periodo, en orden; se rotulan unas cuantas
 *   etiquetas para que no se encimen.
 * - Eje Y: escala con valores "redondos" calculada del mínimo y máximo de
 *   todas las series (una sola escala para poder compararlas).
 * - Los periodos sin valor cortan la línea (hueco sin datos).
 * - Con dos o más series se muestra una leyenda; al pasar el mouse, una
 *   línea guía y un globo con el valor de cada serie en ese periodo.
 */
import { useEffect, useRef, useState } from 'react'
import { formatoValor } from '../../services/medicion5MService'

const ALTO = 280
const MARGEN = { arriba: 16, derecha: 16, abajo: 32, izquierda: 64 }

/** Marcas "redondas" del eje Y entre min y max (aprox. `cuantas`). */
function marcasEje(min, max, cuantas = 5) {
  if (min === max) {
    const holgura = Math.abs(min) * 0.1 || 1
    min -= holgura
    max += holgura
  }
  const pasoBruto = (max - min) / cuantas
  const magnitud = 10 ** Math.floor(Math.log10(pasoBruto))
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * magnitud).find((p) => p >= pasoBruto)
  const inicio = Math.floor(min / paso) * paso
  const fin = Math.ceil(max / paso) * paso
  const marcas = []
  for (let v = inicio; v <= fin + paso / 2; v += paso) marcas.push(Number(v.toFixed(10)))
  return marcas
}

// Props:
// - periodos: arreglo ordenado de { clave, etiqueta } (eje X).
// - series: arreglo de { id, nombre, color, valores } donde `valores` es un
//   Map de clave de periodo -> valor (null o ausente = sin dato).
// - unidad: texto de la unidad para el globo de valor.
export default function GraficaSerie({ periodos, series, unidad }) {
  const contenedorRef = useRef(null)
  const [ancho, setAncho] = useState(0)
  const [activo, setActivo] = useState(null) // Índice del periodo bajo el mouse.

  // El SVG se dibuja con el ancho real del contenedor para que el texto no se deforme.
  useEffect(() => {
    const observador = new ResizeObserver(([entrada]) => setAncho(entrada.contentRect.width))
    observador.observe(contenedorRef.current)
    return () => observador.disconnect()
  }, [])

  const todos = series.flatMap((s) => [...s.valores.values()]).filter((v) => v != null)
  const marcas = todos.length ? marcasEje(Math.min(...todos), Math.max(...todos)) : [0, 1]
  const yMin = marcas[0]
  const yMax = marcas[marcas.length - 1]

  const anchoUtil = Math.max(ancho - MARGEN.izquierda - MARGEN.derecha, 1)
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo
  const x = (i) =>
    MARGEN.izquierda + (periodos.length > 1 ? (i / (periodos.length - 1)) * anchoUtil : anchoUtil / 2)
  const y = (v) => MARGEN.arriba + (1 - (v - yMin) / (yMax - yMin)) * altoUtil

  // Trazo de una serie: "M" al iniciar o después de un hueco (sin valor).
  const trazoDe = (valores) => {
    let trazo = ''
    let enHueco = true
    periodos.forEach((p, i) => {
      const v = valores.get(p.clave)
      if (v == null) {
        enHueco = true
        return
      }
      trazo += `${enHueco ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`
      enHueco = false
    })
    return trazo
  }

  // Etiquetas del eje X: como máximo una cada ~160 px (cada etiqueta mide unos 90 px).
  const cadaCuantas = Math.max(1, Math.ceil(periodos.length / Math.max(1, Math.floor(anchoUtil / 160))))
  const indicesX = periodos.map((_, i) => i).filter((i) => i % cadaCuantas === 0)

  // Convierte la posición del mouse en el índice del periodo más cercano.
  const alMover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const relativo = (e.clientX - rect.left - MARGEN.izquierda) / anchoUtil
    const i = Math.round(relativo * (periodos.length - 1))
    setActivo(Math.min(Math.max(i, 0), periodos.length - 1))
  }

  const periodoActivo = activo != null ? periodos[activo] : null

  return (
    <div>
      {/* Leyenda: solo con dos o más series (con una, el título ya la nombra). */}
      {series.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-4 text-xs text-slate-700">
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded" style={{ backgroundColor: s.color }} />
              {s.nombre}
            </li>
          ))}
        </ul>
      )}

      <div ref={contenedorRef} className="relative w-full">
        {ancho > 0 && (
          <svg
            width={ancho}
            height={ALTO}
            role="img"
            aria-label="Gráfica de las series consultadas"
            onMouseMove={alMover}
            onMouseLeave={() => setActivo(null)}
            className="block"
          >
            {/* Rejilla y etiquetas del eje Y (recesivas). */}
            {marcas.map((m) => (
              <g key={m}>
                <line
                  x1={MARGEN.izquierda}
                  x2={ancho - MARGEN.derecha}
                  y1={y(m)}
                  y2={y(m)}
                  className="stroke-slate-200"
                  strokeWidth="1"
                />
                <text
                  x={MARGEN.izquierda - 8}
                  y={y(m)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-slate-500 text-[11px]"
                >
                  {formatoValor(m)}
                </text>
              </g>
            ))}

            {/* Etiquetas del eje X. */}
            {indicesX.map((i) => (
              <text
                key={periodos[i].clave}
                x={x(i)}
                y={ALTO - 10}
                textAnchor={i === 0 ? 'start' : 'middle'}
                className="fill-slate-500 text-[11px]"
              >
                {periodos[i].etiqueta}
              </text>
            ))}

            {series.map((s) => (
              <path
                key={s.id}
                d={trazoDe(s.valores)}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            ))}

            {/* Línea guía y marcadores del periodo bajo el mouse. */}
            {periodoActivo && (
              <g pointerEvents="none">
                <line
                  x1={x(activo)}
                  x2={x(activo)}
                  y1={MARGEN.arriba}
                  y2={ALTO - MARGEN.abajo}
                  className="stroke-slate-400"
                  strokeWidth="1"
                />
                {series.map((s) => {
                  const v = s.valores.get(periodoActivo.clave)
                  return (
                    v != null && (
                      <circle
                        key={s.id}
                        cx={x(activo)}
                        cy={y(v)}
                        r="4"
                        fill={s.color}
                        className="stroke-white"
                        strokeWidth="2"
                      />
                    )
                  )
                })}
              </g>
            )}
          </svg>
        )}

        {/* Globo con el valor de cada serie; se voltea al lado izquierdo cerca del borde derecho. */}
        {periodoActivo && (
          <div
            className="pointer-events-none absolute top-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
            style={x(activo) > ancho - 200 ? { right: ancho - x(activo) + 12 } : { left: x(activo) + 12 }}
          >
            <div className="mb-1 text-slate-500">{periodoActivo.etiqueta}</div>
            {series.map((s) => (
              <div key={s.id} className="flex items-center gap-2 whitespace-nowrap">
                {series.length > 1 && (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-slate-600">{s.nombre}</span>
                  </>
                )}
                <span className="ml-auto font-mono font-semibold text-slate-900">
                  {formatoValor(s.valores.get(periodoActivo.clave))} {unidad}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
