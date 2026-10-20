/**
 * GraficaECharts.jsx
 * ---------------------------------------------------------------------------
 * Gráfica de Perfiles 5 Minutales hecha con Apache ECharts: una serie por
 * fase (líneas, o barras en variables de energía) sobre los periodos de la
 * consulta. La usa ConsultaPerfiles5M, que la carga bajo demanda.
 *
 * Qué trae de fábrica ECharts y aquí solo se configura:
 * - Zoom con la rueda del mouse o con dos dedos en el celular, y un
 *   minimapa (barra deslizante) con la serie completa debajo de la gráfica.
 * - Leyenda que oculta o muestra cada fase (y la capa de eventos).
 * - Bandas rojas de los eventos registrados (`markArea`).
 * - Barra de herramientas: acercar con recuadro, restaurar y guardar imagen.
 * - Reducción de puntos (`sampling: 'lttb'`) para dibujar miles de lecturas
 *   sin perder los picos.
 *
 * El zoom se sincroniza en ambos sentidos con el tramo visible de la vista
 * (`ventana`), para que el resumen, la tabla y los botones de navegación
 * coincidan con lo que muestra la gráfica.
 */
import { useEffect, useMemo, useRef } from 'react'
// Importación por partes: solo se agregan al paquete los tipos de gráfica y
// componentes que se usan (la librería completa pesa más del doble).
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { FASES, formatoValor } from '../../services/medicion5MService'

echarts.use([
  BarChart,
  LineChart,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  ToolboxComponent,
  TooltipComponent,
  CanvasRenderer,
])

// Colores de texto, rejilla y ejes (tonos slate de Tailwind), recesivos frente a los datos.
const TINTA = '#334155'
const TINTA_SUAVE = '#64748b'
const REJILLA = '#e2e8f0'

/**
 * Tramo { desde, hasta } (índices de periodo) del zoom actual de la gráfica.
 * ECharts siempre informa el zoom en porcentaje (`start`, `end`).
 */
function tramoDelZoom(grafica, totalPeriodos) {
  const zoom = grafica.getOption().dataZoom?.[0]
  if (!zoom) return null
  const ultimo = totalPeriodos - 1
  return { desde: Math.round((zoom.start / 100) * ultimo), hasta: Math.round((zoom.end / 100) * ultimo) }
}

/** Lleva el zoom de la gráfica al tramo dado (null = todo) si no está ya ahí. */
function aplicarVentana(grafica, tramo, totalPeriodos) {
  const actual = tramoDelZoom(grafica, totalPeriodos)
  if (!actual) return
  const desde = tramo?.desde ?? 0
  const hasta = tramo?.hasta ?? totalPeriodos - 1
  if (actual.desde === desde && actual.hasta === hasta) return
  grafica.dispatchAction({ type: 'dataZoom', startValue: desde, endValue: hasta })
}

/**
 * Crea la instancia de ECharts sobre un <div>, le aplica `opcion` cada vez que
 * cambia, la ajusta al ancho del contenedor y la libera al desmontar.
 * Devuelve la ref del <div> y la ref de la instancia (para eventos y acciones).
 */
function useECharts(opcion, alAplicar) {
  const contenedorRef = useRef(null)
  const graficaRef = useRef(null)

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

  // `notMerge` reemplaza la configuración completa (p. ej. al cambiar de fases).
  useEffect(() => {
    graficaRef.current.setOption(opcion, { notMerge: true })
    alAplicar?.(graficaRef.current)
    // alAplicar se omite a propósito: solo se reaplica cuando cambia la configuración.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opcion])

  return { contenedorRef, graficaRef }
}

// Props:
// - periodos: arreglo ordenado de { clave, etiqueta } (todos los de la consulta).
// - seriesCrudas: `resultado.series` de la consulta: [{ fase, puntos }].
// - unidad: unidad de la variable.
// - comoBarras: true para variables de energía (cantidad por periodo -> barras).
// - marcadores: [{ inicio, fin, texto }] con índices de `periodos` (eventos).
// - ventana: tramo visible { desde, hasta } o null; se sincroniza con el zoom.
// - onCambiarVentana: callback con el tramo nuevo cuando el usuario hace zoom.
export default function GraficaECharts({
  periodos,
  seriesCrudas,
  unidad,
  comoBarras,
  marcadores,
  ventana,
  onCambiarVentana,
}) {
  // Los marcadores llegan como arreglo nuevo en cada render; su texto JSON
  // sirve de dependencia para no rehacer la gráfica si no cambiaron.
  const claveMarcadores = JSON.stringify(marcadores)

  const opcion = useMemo(() => {
    const etiquetas = periodos.map((p) => p.etiqueta)
    const series = seriesCrudas.map(({ fase, puntos }) => {
      const { nombre, color } = FASES.find((f) => f.id === fase)
      const valores = new Map(puntos.map((p) => [p.clave, p.valor]))
      return {
        name: `Fase ${nombre}`,
        type: comoBarras ? 'bar' : 'line',
        data: periodos.map((p) => valores.get(p.clave) ?? null),
        itemStyle: { color, borderRadius: comoBarras ? [4, 4, 0, 0] : 0 },
        lineStyle: { width: 2 },
        showSymbol: false,
        connectNulls: false,
        sampling: 'lttb',
        barGap: '10%',
      }
    })

    // Capa de eventos: una serie sin datos que solo lleva las bandas, para
    // que la leyenda también pueda ocultarlas.
    if (marcadores.length > 0) {
      series.push({
        name: 'Eventos',
        type: 'line',
        data: [],
        itemStyle: { color: '#dc2626' },
        markArea: {
          itemStyle: { color: 'rgba(220, 38, 38, 0.10)', borderColor: '#f87171', borderWidth: 1, borderType: 'dashed' },
          label: { color: '#b91c1c', fontSize: 11, position: 'insideTop' },
          data: marcadores.map((m) => [
            { name: m.texto, xAxis: etiquetas[m.inicio] },
            { xAxis: etiquetas[m.fin] },
          ]),
        },
      })
    }

    return {
      animation: false,
      // `top` deja lugar a la barra de herramientas (íconos de 20 px + relleno).
      grid: { left: 64, right: 24, top: 64, bottom: 72 },
      legend: { top: 0, left: 0, textStyle: { color: TINTA }, icon: 'roundRect' },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (v) => `${formatoValor(v)} ${unidad}`,
      },
      // Barra de herramientas: íconos grandes en azul dentro de un recuadro, para
      // que se distingan de la gráfica; al pasar el mouse se oscurecen y
      // muestran su nombre en una etiqueta oscura debajo.
      toolbox: {
        right: 0,
        top: 0,
        itemSize: 20,
        itemGap: 14,
        padding: [8, 12],
        backgroundColor: '#eff6ff', // blue-50
        borderColor: '#bfdbfe', // blue-200
        borderWidth: 1,
        borderRadius: 8,
        iconStyle: { borderColor: '#2563eb', borderWidth: 1.8 }, // blue-600
        emphasis: {
          iconStyle: {
            borderColor: '#1e3a8a', // blue-900
            textPosition: 'bottom',
            textFill: '#ffffff',
            textBackgroundColor: '#1e293b', // slate-800
            textPadding: [4, 8],
            textBorderRadius: 4,
            textFontSize: 12,
          },
        },
        feature: {
          dataZoom: { yAxisIndex: 'none', title: { zoom: 'Acercar con recuadro', back: 'Deshacer acercamiento' } },
          restore: { title: 'Ver todo' },
          saveAsImage: { title: 'Guardar imagen', name: 'perfil-5-minutal' },
        },
      },
      xAxis: {
        type: 'category',
        data: etiquetas,
        boundaryGap: comoBarras,
        axisLine: { lineStyle: { color: REJILLA } },
        axisLabel: { color: TINTA_SUAVE },
      },
      yAxis: {
        type: 'value',
        // En líneas la escala se ajusta a los datos; en barras arranca en cero.
        scale: !comoBarras,
        name: unidad,
        nameTextStyle: { color: TINTA_SUAVE },
        axisLabel: { color: TINTA_SUAVE, formatter: (v) => formatoValor(v) },
        splitLine: { lineStyle: { color: REJILLA } },
      },
      // "inside" = rueda del mouse y gestos; "slider" = minimapa inferior.
      dataZoom: [
        { type: 'inside' },
        { type: 'slider', height: 24, bottom: 16, borderColor: REJILLA },
      ],
      series,
    }
    // claveMarcadores representa a `marcadores`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodos, seriesCrudas, unidad, comoBarras, claveMarcadores])

  // La ventana más reciente, para reaplicarla después de rehacer la gráfica.
  // Se actualiza en un efecto declarado antes de useECharts, así que ya está
  // al día cuando este aplica la configuración.
  const ventanaRef = useRef(ventana)
  useEffect(() => {
    ventanaRef.current = ventana
  })

  const { contenedorRef, graficaRef } = useECharts(opcion, (grafica) =>
    aplicarVentana(grafica, ventanaRef.current, periodos.length),
  )

  // Zoom hecho en la gráfica -> tramo visible de la vista (resumen y tabla lo siguen).
  useEffect(() => {
    const grafica = graficaRef.current
    const alHacerZoom = () => {
      const tramo = tramoDelZoom(grafica, periodos.length)
      const esTodo = tramo.desde <= 0 && tramo.hasta >= periodos.length - 1
      onCambiarVentana(esTodo ? null : tramo)
    }
    grafica.on('datazoom', alHacerZoom)
    return () => grafica.off('datazoom', alHacerZoom)
  }, [graficaRef, periodos, onCambiarVentana])

  // Tramo cambiado fuera de la gráfica (botones de navegación o "Ver en la
  // gráfica") -> zoom.
  const desde = ventana?.desde
  const hasta = ventana?.hasta
  useEffect(() => {
    aplicarVentana(graficaRef.current, desde === undefined ? null : { desde, hasta }, periodos.length)
  }, [graficaRef, desde, hasta, periodos])

  return <div ref={contenedorRef} className="h-[360px] w-full" />
}
