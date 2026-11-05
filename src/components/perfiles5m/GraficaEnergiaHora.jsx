/**
 * GraficaEnergiaHora.jsx
 * ---------------------------------------------------------------------------
 * Gráfica de la vista "Energía por hora" (EnergiaPorHora.jsx), hecha con
 * Apache ECharts:
 * - Barras: total de energía de cada hora (eje izquierdo).
 * - Línea: acumulado del día hasta esa hora (eje derecho). El acumulado vuelve
 *   a cero cada día, así que se dibuja una línea por día (todas con el mismo
 *   nombre en la leyenda) para que no haya una diagonal entre la última hora
 *   de un día y la primera del siguiente.
 * Se carga bajo demanda, igual que GraficaECharts.
 */
import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { DataZoomComponent, GridComponent, LegendComponent, ToolboxComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { formatoValor } from '../../services/medicion5MService'

echarts.use([BarChart, LineChart, DataZoomComponent, GridComponent, LegendComponent, ToolboxComponent, TooltipComponent, CanvasRenderer])

// Colores (los dos primeros de la paleta categórica de Perfiles 5M) y tonos slate de Tailwind.
const AZUL = '#2a78d6'
const NARANJA = '#eb6834'
const TINTA = '#334155'
const TINTA_SUAVE = '#64748b'
const REJILLA = '#e2e8f0'

const NOMBRE_TOTAL = 'Total de la hora'
const NOMBRE_ACUMULADO = 'Acumulado del día'

// Props:
// - filas: filas del backend ordenadas por fecha y hora
//   ({ fecha, hora, horaTexto, totalHora, acumuladoDia, intervalos }).
// - unidad: unidad de la variable (kWh, kVARh).
export default function GraficaEnergiaHora({ filas, unidad }) {
  const contenedorRef = useRef(null)
  const graficaRef = useRef(null)

  const opcion = useMemo(() => {
    const variosDias = new Set(filas.map((f) => f.fecha)).size > 1
    // Etiqueta del eje: solo la hora si es un día; fecha y hora si son varios.
    const etiquetas = filas.map((f) => (variosDias ? `${f.fecha} ${String(f.hora).padStart(2, '0')}:00` : f.horaTexto))

    // Una línea de acumulado por día: valores solo en los índices de ese día.
    const dias = [...new Set(filas.map((f) => f.fecha))]
    const lineasAcumulado = dias.map((dia) => ({
      name: NOMBRE_ACUMULADO,
      type: 'line',
      yAxisIndex: 1,
      data: filas.map((f) => (f.fecha === dia ? f.acumuladoDia : null)),
      connectNulls: false,
      showSymbol: false,
      lineStyle: { width: 2.5, color: NARANJA },
      itemStyle: { color: NARANJA },
      z: 3,
    }))

    const ejeValor = (nombre, conRejilla) => ({
      type: 'value',
      name: `${nombre} (${unidad})`,
      nameTextStyle: { color: TINTA_SUAVE },
      axisLabel: { color: TINTA_SUAVE, formatter: (v) => formatoValor(v) },
      splitLine: { show: conRejilla, lineStyle: { color: REJILLA } },
    })

    return {
      animation: false,
      grid: { left: 72, right: 80, top: 72, bottom: 72 },
      legend: { top: 0, left: 0, textStyle: { color: TINTA }, data: [NOMBRE_TOTAL, NOMBRE_ACUMULADO] },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const f = filas[params[0]?.dataIndex]
          if (!f) return ''
          const fila = (color, texto, valor) =>
            `<div style="display:flex;justify-content:space-between;gap:16px">` +
            `<span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};margin-right:6px"></span>${texto}</span>` +
            `<b>${formatoValor(valor)} ${unidad}</b></div>`
          const incompleta =
            f.intervalos < 12
              ? `<div style="margin-top:4px;color:#b45309">Hora incompleta: ${f.intervalos} de 12 lecturas</div>`
              : ''
          return (
            `<div style="margin-bottom:4px;color:${TINTA}">${f.fecha} · ${f.horaTexto}</div>` +
            fila(AZUL, NOMBRE_TOTAL, f.totalHora) +
            fila(NARANJA, NOMBRE_ACUMULADO, f.acumuladoDia) +
            incompleta
          )
        },
      },
      toolbox: {
        right: 0,
        top: 0,
        itemSize: 20,
        itemGap: 14,
        padding: [8, 12],
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
        borderWidth: 1,
        borderRadius: 8,
        iconStyle: { borderColor: '#2563eb', borderWidth: 1.8 },
        feature: {
          dataZoom: { yAxisIndex: 'none', title: { zoom: 'Acercar con recuadro', back: 'Deshacer acercamiento' } },
          restore: { title: 'Ver todo' },
          saveAsImage: { title: 'Guardar imagen', name: 'energia-por-hora' },
        },
      },
      xAxis: {
        type: 'category',
        data: etiquetas,
        axisLine: { lineStyle: { color: REJILLA } },
        axisLabel: { color: TINTA_SUAVE },
      },
      // Izquierda: total de la hora (con rejilla). Derecha: acumulado del día.
      yAxis: [ejeValor('Hora', true), ejeValor('Acumulado', false)],
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 24, bottom: 16, borderColor: REJILLA }],
      series: [
        {
          name: NOMBRE_TOTAL,
          type: 'bar',
          yAxisIndex: 0,
          data: filas.map((f) => f.totalHora),
          itemStyle: { color: AZUL, borderRadius: [4, 4, 0, 0] },
        },
        ...lineasAcumulado,
      ],
    }
  }, [filas, unidad])

  // Una sola instancia por <div>; se ajusta al ancho del contenedor.
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
