/**
 * GraficaArmonicos.jsx
 * ---------------------------------------------------------------------------
 * Gráfica de barras del contenido armónico hecha con Apache ECharts, al
 * estilo de un analizador de calidad de la potencia: primero la barra de THD
 * y luego cada armónico, todo en % de la fundamental. Una serie por fase con
 * su última lectura. La usa TabArmonicos, que la carga bajo demanda.
 */
import { useEffect, useMemo, useRef } from 'react'
// Importación por partes: solo se agregan al paquete las piezas que se usan.
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, LegendComponent, ToolboxComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([BarChart, GridComponent, LegendComponent, ToolboxComponent, TooltipComponent, CanvasRenderer])

// Colores de texto, rejilla y ejes (tonos slate de Tailwind), recesivos frente a los datos.
const TINTA = '#334155'
const TINTA_SUAVE = '#64748b'
const REJILLA = '#e2e8f0'

// Props:
// - categorias: etiquetas del eje X (p. ej. ['THD', 'A1', …, 'A10']).
// - series: [{ nombre, color, valores }] con `valores` alineado a `categorias`.
// - unidad: unidad del eje Y.
export default function GraficaArmonicos({ categorias, series, unidad }) {
  const contenedorRef = useRef(null)
  const graficaRef = useRef(null)

  const opcion = useMemo(
    () => ({
      animation: false,
      grid: { left: 56, right: 24, top: 56, bottom: 40 },
      legend: { top: 0, left: 0, textStyle: { color: TINTA }, icon: 'roundRect' },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v) => `${v.toFixed(2)} ${unidad}`,
      },
      toolbox: {
        right: 0,
        top: 0,
        feature: { saveAsImage: { title: 'Guardar imagen', name: 'contenido-armonico' } },
      },
      xAxis: {
        type: 'category',
        data: categorias,
        axisLine: { lineStyle: { color: REJILLA } },
        axisLabel: { color: TINTA_SUAVE },
      },
      yAxis: {
        type: 'value',
        name: unidad,
        nameTextStyle: { color: TINTA_SUAVE },
        axisLabel: { color: TINTA_SUAVE },
        splitLine: { lineStyle: { color: REJILLA } },
      },
      series: series.map(({ nombre, color, valores }) => ({
        name: nombre,
        type: 'bar',
        data: valores,
        itemStyle: { color, borderRadius: [4, 4, 0, 0] },
        barGap: '10%',
        barMaxWidth: 16,
      })),
    }),
    [categorias, series, unidad],
  )

  // Montaje: una sola instancia por <div>; ResizeObserver la redimensiona.
  useEffect(() => {
    const grafica = echarts.init(contenedorRef.current)
    graficaRef.current = grafica
    const observador = new ResizeObserver(() => grafica.resize())
    observador.observe(contenedorRef.current)
    return () => {
      observador.disconnect()
      grafica.dispose()
    }
  }, [])

  useEffect(() => {
    graficaRef.current.setOption(opcion, { notMerge: true })
  }, [opcion])

  return <div ref={contenedorRef} className="h-[380px] w-full" />
}
