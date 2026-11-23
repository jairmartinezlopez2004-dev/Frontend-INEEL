/**
 * exportarExcel5M.js
 * ---------------------------------------------------------------------------
 * Genera y descarga el reporte de Excel de una consulta de Perfiles 5
 * Minutales, con el formato de los reportes de submedición del INEEL.
 *
 * Rol en el sistema:
 * - Lo usa ConsultaPerfiles5M.jsx con el botón "Exportar a Excel". Exporta
 *   exactamente lo consultado: medidor, variable, fases, fechas y agrupación.
 * - Todo va en UNA sola hoja ("Reporte"), de arriba hacia abajo:
 *   1. Encabezado institucional (logo y nombre del sistema) e información del
 *      punto de medición.
 *   2. La gráfica de las fases (imagen).
 *   3. Un resumen por fase (mínimo, promedio y máximo; total en energía).
 *   4. La fecha y hora de elaboración.
 *   Al imprimir: página 1 = información y gráfica; después, resumen y tabla.
 *   5. La tabla con TODAS las fases juntas: Fecha | Hora | Fase A | Fase B |
 *      Fase C (| Total). A diferencia de los reportes anteriores (una hoja por
 *      fase), aquí las fases van en columnas, como se pidió.
 * - La columna Total (suma de las fases) solo aparece en potencia (kW, kVAR,
 *   kVA) con dos o más fases: en voltaje, corriente, factor de potencia o THD
 *   sumar fases no tiene sentido.
 * - Las celdas del resumen y del Total son fórmulas de Excel (con su valor ya
 *   calculado), para que se puedan revisar o reutilizar en el archivo.
 *
 * ExcelJS y ECharts se cargan bajo demanda (import dinámico): solo se
 * descargan la primera vez que alguien exporta.
 */
import { obtenerConfiguracion } from '../config/configuracion'

// Columnas que abarca el encabezado (A a M), igual que los reportes anteriores.
const COLUMNAS_ENCABEZADO = 13

// Colores del reporte (elegidos por el usuario sobre un archivo exportado):
// celeste del título del perfil, verde del encabezado del resumen y del
// título de la tabla, y azul con letra blanca del encabezado de la tabla.
const CELESTE = 'FFCFEFF3'
const VERDE = 'FF92D050'
const AZUL = 'FF0070C0'
const BLANCO = 'FFFFFFFF'
const BORDE_FINO = { style: 'thin', color: { argb: 'FF000000' } }
const BORDES = { top: BORDE_FINO, left: BORDE_FINO, bottom: BORDE_FINO, right: BORDE_FINO }

// Tamaño de la imagen de la gráfica (px) y su escala (nitidez al imprimir).
const ANCHO_GRAFICA = 1100
const ALTO_GRAFICA = 440

// Unidades en las que sí se pueden sumar las fases.
const UNIDADES_SUMABLES = ['kW', 'kVAR', 'kVA']

/** Fecha "yyyy-MM-dd" y hora "HH:mm" opcional de la etiqueta de un periodo. */
const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?$/

/** Fecha (Date en UTC, como la espera ExcelJS) y hora (fracción de día) de una etiqueta. */
function separarPeriodo(etiqueta) {
  const m = PATRON_FECHA.exec(etiqueta)
  if (!m) return { fecha: etiqueta, hora: null }
  const [, anio, mes, dia, hh, mm] = m
  return {
    fecha: new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia))),
    hora: hh === undefined ? null : (Number(hh) * 60 + Number(mm)) / 1440,
  }
}

/** Letra de una columna de Excel (1 = A). */
function letra(columna) {
  let texto = ''
  let n = columna
  while (n > 0) {
    const resto = (n - 1) % 26
    texto = String.fromCharCode(65 + resto) + texto
    n = Math.floor((n - 1) / 26)
  }
  return texto
}

/** Nombre de archivo sin caracteres que Windows no permite. */
const nombreSeguro = (texto) => texto.replace(/[\\/:*?"<>|]+/g, '-').trim()

/** Fecha "yyyy-MM-dd" como "dd/MM/yyyy". */
const fechaCorta = (iso) => iso.split('-').reverse().join('/')

/** Descarga la imagen del logo como ArrayBuffer con su tamaño, o null si no se puede usar. */
async function cargarLogo(ruta) {
  const extension = ruta?.split('.').pop()?.toLowerCase()
  // ExcelJS solo admite PNG, JPEG y GIF (no SVG).
  if (!['png', 'jpg', 'jpeg', 'gif'].includes(extension)) return null
  try {
    const respuesta = await fetch(ruta)
    if (!respuesta.ok) return null
    const blob = await respuesta.blob()
    const bitmap = await createImageBitmap(blob)
    const tamano = { ancho: bitmap.width, alto: bitmap.height }
    bitmap.close()
    return { buffer: await blob.arrayBuffer(), extension: extension === 'jpg' ? 'jpeg' : extension, ...tamano }
  } catch {
    return null
  }
}

/**
 * Dibuja la gráfica fuera de pantalla con ECharts y la devuelve como PNG en
 * base64. Se dibuja completa (todos los periodos), sin el zoom de la vista.
 */
async function dibujarGrafica({ periodos, series, unidad, comoBarras }) {
  const echarts = await import('echarts/core')
  const [{ LineChart, BarChart }, { GridComponent, LegendComponent }, { CanvasRenderer }] = await Promise.all([
    import('echarts/charts'),
    import('echarts/components'),
    import('echarts/renderers'),
  ])
  echarts.use([LineChart, BarChart, GridComponent, LegendComponent, CanvasRenderer])

  const contenedor = document.createElement('div')
  contenedor.style.cssText = `position:fixed;left:-10000px;top:0;width:${ANCHO_GRAFICA}px;height:${ALTO_GRAFICA}px`
  document.body.appendChild(contenedor)
  const grafica = echarts.init(contenedor, null, { renderer: 'canvas', devicePixelRatio: 2 })
  try {
    grafica.setOption({
      animation: false,
      backgroundColor: '#ffffff',
      textStyle: { fontFamily: 'Calibri, Arial, sans-serif' },
      legend: { top: 4, icon: 'roundRect' },
      grid: { left: 70, right: 24, top: 40, bottom: 50 },
      xAxis: {
        type: 'category',
        data: periodos.map((p) => p.etiqueta),
        boundaryGap: comoBarras,
        axisLabel: { color: '#475569', hideOverlap: true },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
      },
      yAxis: {
        type: 'value',
        name: unidad,
        nameTextStyle: { color: '#475569' },
        axisLabel: { color: '#475569' },
        splitLine: { lineStyle: { color: '#e2e8f0' } },
      },
      series: series.map((s) => ({
        name: s.nombre,
        type: comoBarras ? 'bar' : 'line',
        data: periodos.map((p) => s.valores.get(p.clave) ?? null),
        showSymbol: false,
        sampling: comoBarras ? undefined : 'lttb',
        lineStyle: { width: 1.5 },
        itemStyle: { color: s.color },
      })),
    })
    return grafica.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' })
  } finally {
    grafica.dispose()
    contenedor.remove()
  }
}

/**
 * Encabezado institucional común a las dos hojas. Devuelve la siguiente fila libre.
 * @param {import('exceljs').Worksheet} hoja
 */
function escribirEncabezado(hoja, { idLogo, logo, config, info, titulo, columnasTitulo = COLUMNAS_ENCABEZADO }) {
  const ultima = letra(COLUMNAS_ENCABEZADO)

  // Logo (A1:B5), conservando su proporción.
  if (idLogo !== null) {
    const alto = 80
    hoja.addImage(idLogo, {
      tl: { col: 0.15, row: 0.2 },
      ext: { width: Math.round((logo.ancho / logo.alto) * alto), height: alto },
    })
  }

  // Siglas y nombre del sistema (C2:M2 y C3:M3), como "Sismedia-RT" en los reportes anteriores.
  const titulos = [
    [2, config.siglasSistema || 'SIMECAPS'],
    [3, (config.tituloSistema || '').toUpperCase()],
  ]
  for (const [fila, texto] of titulos) {
    hoja.mergeCells(`C${fila}:${ultima}${fila}`)
    const celda = hoja.getCell(`C${fila}`)
    celda.value = texto
    celda.font = { bold: true, size: 13 }
    celda.alignment = { horizontal: 'center', vertical: 'middle' }
    hoja.getRow(fila).height = 18
  }
  // Línea bajo el encabezado (fila 6).
  for (let c = 1; c <= COLUMNAS_ENCABEZADO; c += 1) {
    hoja.getCell(6, c).border = { top: { style: 'medium', color: { argb: 'FF2B4A80' } } }
  }

  // Información del punto de medición.
  hoja.mergeCells(`A7:${ultima}7`)
  const tituloInfo = hoja.getCell('A7')
  tituloInfo.value = 'INFORMACIÓN DEL PUNTO DE MEDICIÓN'
  tituloInfo.font = { bold: true, size: 16 }
  tituloInfo.alignment = { horizontal: 'center' }
  hoja.getRow(7).height = 21

  let fila = 9
  for (const [etiqueta, valor] of info) {
    const celdaEtiqueta = hoja.getCell(`B${fila}`)
    celdaEtiqueta.value = etiqueta
    celdaEtiqueta.font = { bold: true }
    celdaEtiqueta.alignment = { horizontal: 'right' }
    hoja.getCell(`C${fila}`).value = valor
    fila += 1
  }

  // Título del perfil con fondo celeste (en Datos, del ancho de la tabla).
  fila += 1
  hoja.mergeCells(`A${fila}:${letra(columnasTitulo)}${fila}`)
  const celdaTitulo = hoja.getCell(`A${fila}`)
  celdaTitulo.value = titulo
  celdaTitulo.font = { bold: true, size: 16 }
  celdaTitulo.alignment = { horizontal: 'center' }
  celdaTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CELESTE } }
  hoja.getRow(fila).height = 21

  return fila + 1
}

/** Mínimo, promedio, máximo y suma (null si no hay valores). */
function estadisticas(valores) {
  if (valores.length === 0) return { minimo: null, promedio: null, maximo: null, suma: null }
  const suma = valores.reduce((a, b) => a + b, 0)
  return { minimo: Math.min(...valores), promedio: suma / valores.length, maximo: Math.max(...valores), suma }
}

/**
 * Arma el libro de Excel y lo descarga.
 * @param {object} datos
 * @param {string} datos.medidor - Descripción del medidor.
 * @param {string} datos.controlador - Nombre del controlador RF.
 * @param {{ nombre: string, unidad: string }} datos.variable
 * @param {{ fechaInicio: string, fechaFin: string }} datos.filtros
 * @param {string} datos.agrupacion - Nombre de la agrupación (p. ej. "Promedio por hora").
 * @param {boolean} datos.esTotal - true si cada periodo es un total de energía (se suma, no se promedia).
 * @param {Array<{ clave: string, etiqueta: string }>} datos.periodos
 * @param {Array<{ id: number, nombre: string, color: string, valores: Map }>} datos.series
 */
export async function exportarExcel5M({ medidor, controlador, variable, filtros, agrupacion, esTotal, periodos, series }) {
  const [{ default: ExcelJS }, imagenGrafica, config] = await Promise.all([
    import('exceljs'),
    dibujarGrafica({ periodos, series, unidad: variable.unidad, comoBarras: esTotal }),
    Promise.resolve(obtenerConfiguracion()),
  ])
  const logo = await cargarLogo(config.empresa?.logo)

  const unidad = variable.unidad ? ` (${variable.unidad})` : ''
  const nombresFases = series.map((s) => s.nombre.replace('Fase ', '')).join(', ')
  const info = [
    ['Medidor:', medidor],
    ['Controlador:', controlador],
    ['Variable:', `${variable.nombre}${unidad}`],
    ['Fases:', series.length === 3 ? 'A, B, C (trifásico)' : nombresFases],
    ['Agrupación:', agrupacion],
    ['Fecha inicio:', fechaCorta(filtros.fechaInicio)],
    ['Fecha término:', fechaCorta(filtros.fechaFin)],
  ]
  const titulo = `PERFIL DE ${variable.nombre.toUpperCase()}${unidad}`

  const libro = new ExcelJS.Workbook()
  libro.creator = config.siglasSistema || 'SIMECAPS'
  libro.created = new Date()
  const idLogo = logo ? libro.addImage({ buffer: logo.buffer, extension: logo.extension }) : null
  // Una sola hoja; al imprimir se ajusta al ancho y la tabla empieza en otra página.
  const hoja = libro.addWorksheet('Reporte', {
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    },
  })

  // Columnas de la tabla de datos: Fecha | Hora | Fase A | Fase B | Fase C (| Total).
  const filas = periodos.map((p) => ({ ...separarPeriodo(p.etiqueta), clave: p.clave }))
  const conHora = filas.some((f) => f.hora !== null)
  const todasFechas = filas.every((f) => f.fecha instanceof Date)
  const sumable = UNIDADES_SUMABLES.includes(variable.unidad) && series.length > 1
  // Las columnas de valores llevan la unidad: "Fase A (kW)", "Total (kW)".
  const encabezados = [
    todasFechas ? 'Fecha' : 'Periodo',
    ...(conHora ? ['Hora'] : []),
    ...series.map((s) => `${s.nombre}${unidad}`),
    ...(sumable ? [`Total${unidad}`] : []),
  ]
  const colPrimeraFase = conHora ? 3 : 2
  const colUltimaFase = colPrimeraFase + series.length - 1
  const colTotal = colUltimaFase + 1

  // Resumen por fase (y del total en potencia).
  const columnasResumen = esTotal
    ? [['Total', 'SUM', 'suma']]
    : [
        ['Mínimo', 'MIN', 'minimo'],
        ['Promedio', 'AVERAGE', 'promedio'],
        ['Máximo', 'MAX', 'maximo'],
      ]
  const filasResumen = series.map((s, j) => ({
    nombre: s.nombre,
    columna: colPrimeraFase + j,
    stats: estadisticas(periodos.map((p) => s.valores.get(p.clave)).filter((v) => v != null)),
  }))
  if (sumable) {
    filasResumen.push({
      nombre: 'Total',
      columna: colTotal,
      stats: estadisticas(
        periodos
          .map((p) => series.map((s) => s.valores.get(p.clave)).filter((v) => v != null))
          .filter((vs) => vs.length > 0)
          .map((vs) => vs.reduce((a, b) => a + b, 0)),
      ),
    })
  }

  // ── 1. Encabezado, información y título del perfil ──
  const filaImagen = escribirEncabezado(hoja, { idLogo, logo, config, info, titulo })

  // ── 2. Gráfica (imagen) ──
  const idGrafica = libro.addImage({ base64: imagenGrafica, extension: 'png' })
  hoja.addImage(idGrafica, {
    tl: { col: 0.2, row: filaImagen },
    ext: { width: ANCHO_GRAFICA * 0.85, height: ALTO_GRAFICA * 0.85 },
  })
  // Filas que ocupa la imagen (20 px por fila aprox.).
  const filaTituloResumen = filaImagen + Math.ceil((ALTO_GRAFICA * 0.85) / 20) + 2

  // Ubicación de todo lo que sigue, para que las fórmulas del resumen
  // apunten a la tabla de datos que va más abajo.
  const filaEncabezadoResumen = filaTituloResumen + 1
  const filaPie = filaEncabezadoResumen + filasResumen.length + 2
  const filaTituloDatos = filaPie + 2
  const filaEncabezadoDatos = filaTituloDatos + 1
  const primeraFilaDatos = filaEncabezadoDatos + 1
  const ultimaFilaDatos = primeraFilaDatos + filas.length - 1
  const rangoDe = (columna) => `${letra(columna)}${primeraFilaDatos}:${letra(columna)}${ultimaFilaDatos}`

  /** Encabezado de tabla con fondo de color y borde. */
  const encabezadoTabla = (fila, textos, { fondo, letra: colorLetra }) => {
    textos.forEach((texto, i) => {
      const celda = hoja.getCell(fila, i + 1)
      celda.value = texto
      celda.font = { bold: true, ...(colorLetra ? { color: { argb: colorLetra } } : {}) }
      celda.alignment = { horizontal: 'center' }
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fondo } }
      celda.border = BORDES
    })
  }

  // ── 3. Resumen con fórmulas sobre la tabla de datos ──
  // Al imprimir, la página 1 lleva la información y la gráfica; el resumen
  // empieza en la página 2 (así no se parte) y la tabla lo sigue.
  hoja.getRow(filaTituloResumen - 1).addPageBreak()
  const tituloResumen = hoja.getCell(filaTituloResumen, 1)
  tituloResumen.value = `Resumen${unidad}`
  tituloResumen.font = { bold: true, size: 12 }
  encabezadoTabla(filaEncabezadoResumen, ['Fase', ...columnasResumen.map(([t]) => t)], { fondo: VERDE })
  filasResumen.forEach((r, k) => {
    const fila = filaEncabezadoResumen + 1 + k
    const celdaNombre = hoja.getCell(fila, 1)
    celdaNombre.value = r.nombre
    celdaNombre.font = { bold: true }
    celdaNombre.border = BORDES
    columnasResumen.forEach(([, funcion, campo], i) => {
      const celda = hoja.getCell(fila, i + 2)
      // Una fase sin lecturas en el periodo no lleva fórmula (daría 0 o #¡DIV/0!).
      if (r.stats[campo] === null) {
        celda.value = 'Sin datos'
        celda.alignment = { horizontal: 'center' }
        celda.font = { italic: true, color: { argb: 'FF64748B' } }
      } else {
        celda.value = { formula: `${funcion}(${rangoDe(r.columna)})`, result: r.stats[campo] }
        celda.numFmt = '#,##0.0000'
      }
      celda.border = BORDES
    })
  })

  // ── 4. Pie: fecha y hora de elaboración, como en los reportes anteriores ──
  const ahora = new Date()
  const pie = hoja.getCell(filaPie, 1)
  pie.value =
    `Reporte elaborado el día ${ahora.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}` +
    ` a las ${ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
  pie.font = { italic: true, color: { argb: 'FF475569' } }

  // ── 5. Tabla de datos: todas las fases en la misma tabla ──
  hoja.mergeCells(filaTituloDatos, 1, filaTituloDatos, encabezados.length)
  const tituloDatos = hoja.getCell(filaTituloDatos, 1)
  tituloDatos.value = `VALORES POR PERIODO${unidad}`
  tituloDatos.font = { bold: true, size: 14 }
  tituloDatos.alignment = { horizontal: 'center' }
  tituloDatos.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } }
  encabezadoTabla(filaEncabezadoDatos, encabezados, { fondo: AZUL, letra: BLANCO })

  filas.forEach((f, i) => {
    const numFila = primeraFilaDatos + i
    const fila = hoja.getRow(numFila)
    fila.getCell(1).value = f.fecha
    if (todasFechas) fila.getCell(1).numFmt = 'dd/mmm/yyyy'
    if (conHora) {
      fila.getCell(2).value = f.hora
      // [hh] muestra 24:00 (fin del día) en vez de volver a 00:00, igual que el visor.
      fila.getCell(2).numFmt = '[hh]:mm'
    }
    series.forEach((s, j) => {
      fila.getCell(colPrimeraFase + j).value = s.valores.get(f.clave) ?? null
    })
    if (sumable) {
      const valores = series.map((s) => s.valores.get(f.clave)).filter((v) => v != null)
      fila.getCell(colTotal).value = {
        formula: `SUM(${letra(colPrimeraFase)}${numFila}:${letra(colUltimaFase)}${numFila})`,
        result: valores.length > 0 ? valores.reduce((a, b) => a + b, 0) : 0,
      }
    }
    for (let c = 1; c <= encabezados.length; c += 1) {
      fila.getCell(c).border = BORDES
      if (c >= colPrimeraFase) fila.getCell(c).numFmt = '#,##0.0000'
    }
  })

  // Anchos: la columna A también lleva las etiquetas del resumen y de la información.
  hoja.getColumn(1).width = todasFechas ? 16 : 22
  hoja.getColumn(2).width = 16
  for (let c = 3; c <= Math.max(encabezados.length, 5); c += 1) hoja.getColumn(c).width = 18

  const buffer = await libro.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(blob)
  enlace.download = nombreSeguro(
    `${medidor} ${variable.nombre} - ${filtros.fechaInicio} a ${filtros.fechaFin}.xlsx`,
  )
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000)
}
