/**
 * GraficaSerie.jsx
 * ---------------------------------------------------------------------------
 * Gráfica de línea (SVG, sin librerías) de una sola serie de mediciones.
 * La usa TabValores5M para dibujar el resultado de la consulta.
 *
 * - Eje X: un punto por fila, en el orden que entrega el WebService; se
 *   rotulan unas cuantas etiquetas para que no se encimen.
 * - Eje Y: escala con valores "redondos" calculada del mínimo y máximo.
 * - Los valores null cortan la línea (hueco sin datos).
 * - Al pasar el mouse se muestra una línea guía y un globo con el valor.
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
// - puntos: arreglo de { clave, etiqueta, valor } (valor puede ser null).
// - unidad: texto de la unidad para el globo de valor.
export default function GraficaSerie({ puntos, unidad }) {
  const contenedorRef = useRef(null)
  const [ancho, setAncho] = useState(0)
  const [activo, setActivo] = useState(null) // Índice bajo el mouse.

  // El SVG se dibuja con el ancho real del contenedor para que el texto no se deforme.
  useEffect(() => {
    const observador = new ResizeObserver(([entrada]) => setAncho(entrada.contentRect.width))
    observador.observe(contenedorRef.current)
    return () => observador.disconnect()
  }, [])

  const valores = puntos.map((p) => p.valor).filter((v) => v != null)
  const marcas = valores.length ? marcasEje(Math.min(...valores), Math.max(...valores)) : [0, 1]
  const yMin = marcas[0]
  const yMax = marcas[marcas.length - 1]

  const anchoUtil = Math.max(ancho - MARGEN.izquierda - MARGEN.derecha, 1)
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo
  const x = (i) => MARGEN.izquierda + (puntos.length > 1 ? (i / (puntos.length - 1)) * anchoUtil : anchoUtil / 2)
  const y = (v) => MARGEN.arriba + (1 - (v - yMin) / (yMax - yMin)) * altoUtil

  // Trazo de la línea: "M" al iniciar o después de un hueco (valor null).
  let trazo = ''
  let enHueco = true
  puntos.forEach((p, i) => {
    if (p.valor == null) {
      enHueco = true
      return
    }
    trazo += `${enHueco ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`
    enHueco = false
  })

  // Etiquetas del eje X: como máximo una cada ~160 px (cada etiqueta mide unos 90 px).
  const cadaCuantas = Math.max(1, Math.ceil(puntos.length / Math.max(1, Math.floor(anchoUtil / 160))))
  const indicesX = puntos.map((_, i) => i).filter((i) => i % cadaCuantas === 0)

  // Convierte la posición del mouse en el índice del punto más cercano.
  const alMover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const relativo = (e.clientX - rect.left - MARGEN.izquierda) / anchoUtil
    const i = Math.round(relativo * (puntos.length - 1))
    setActivo(Math.min(Math.max(i, 0), puntos.length - 1))
  }

  const puntoActivo = activo != null ? puntos[activo] : null

  return (
    <div ref={contenedorRef} className="relative w-full">
      {ancho > 0 && (
        <svg
          width={ancho}
          height={ALTO}
          role="img"
          aria-label="Gráfica de la serie consultada"
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
              key={puntos[i].clave}
              x={x(i)}
              y={ALTO - 10}
              textAnchor={i === 0 ? 'start' : 'middle'}
              className="fill-slate-500 text-[11px]"
            >
              {puntos[i].etiqueta}
            </text>
          ))}

          <path d={trazo} fill="none" className="stroke-blue-600" strokeWidth="2" strokeLinejoin="round" />

          {/* Línea guía y marcador del punto bajo el mouse. */}
          {puntoActivo && (
            <g pointerEvents="none">
              <line
                x1={x(activo)}
                x2={x(activo)}
                y1={MARGEN.arriba}
                y2={ALTO - MARGEN.abajo}
                className="stroke-slate-400"
                strokeWidth="1"
              />
              {puntoActivo.valor != null && (
                <circle
                  cx={x(activo)}
                  cy={y(puntoActivo.valor)}
                  r="4"
                  className="fill-blue-600 stroke-white"
                  strokeWidth="2"
                />
              )}
            </g>
          )}
        </svg>
      )}

      {/* Globo con el valor; se voltea al lado izquierdo cerca del borde derecho. */}
      {puntoActivo && (
        <div
          className="pointer-events-none absolute top-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
          style={
            x(activo) > ancho - 180
              ? { right: ancho - x(activo) + 12 }
              : { left: x(activo) + 12 }
          }
        >
          <div className="text-slate-500">{puntoActivo.etiqueta}</div>
          <div className="font-mono font-semibold text-slate-900">
            {formatoValor(puntoActivo.valor)} {unidad}
          </div>
        </div>
      )}
    </div>
  )
}
