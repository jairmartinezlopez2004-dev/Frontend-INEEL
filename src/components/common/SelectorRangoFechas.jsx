/**
 * SelectorRangoFechas.jsx
 * ---------------------------------------------------------------------------
 * Selector de un rango de fechas con un solo calendario (react-day-picker en
 * modo "range"). Sustituye a los dos campos "Desde" / "Hasta".
 *
 * Funcionamiento:
 * - Un botón muestra el rango elegido ("29 sep – 5 oct 2026"); al pulsarlo
 *   se abre un panel con un calendario de un mes. Para saltar rápido a otra
 *   fecha, el mes del encabezado abre una cuadrícula de 12 meses y el año una
 *   cuadrícula de años; al elegir un año se pasa a sus meses y al elegir un
 *   mes se regresa al calendario.
 * - En el calendario, el primer clic marca el inicio y el segundo el fin;
 *   mientras se mueve el mouse se ilumina el rango que quedaría. Un tercer
 *   clic empieza un rango nuevo. El rango se aplica con "Aplicar".
 * - Las fechas futuras no se pueden elegir. Con `maxDias`, después del primer
 *   clic se deshabilitan los días que excederían el límite.
 * - El panel se cierra con Esc, con "Cancelar" o con un clic fuera de él.
 *
 * Las fechas entran y salen como texto "yyyy-MM-dd" (el formato de la API),
 * así que quien lo usa no necesita manejar objetos Date.
 *
 * Estilos: no se importa el CSS de react-day-picker; cada parte del
 * calendario recibe clases de Tailwind mediante `classNames`.
 */
import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { es } from 'react-day-picker/locale'
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  isSameYear,
  min as minFecha,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns'

/** "yyyy-MM-dd" -> Date local (sin pasar por UTC, para no desfasar el día). */
function aFecha(texto) {
  const [anio, mes, dia] = texto.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

/** Date -> "yyyy-MM-dd". */
const aTexto = (fecha) => format(fecha, 'yyyy-MM-dd')

/** Texto del botón: "29 sept – 5 oct 2026" (el año una sola vez si coincide). */
function textoRango(desde, hasta) {
  if (!desde) return 'Elige un rango de fechas'
  const fin = hasta ?? desde
  const inicio = format(desde, isSameYear(desde, fin) ? 'd MMM' : 'd MMM yyyy', { locale: es })
  return `${inicio} – ${format(fin, 'd MMM yyyy', { locale: es })}`
}

/** Mes con mayúscula inicial: "Octubre" (`patron` 'LLLL') u "Oct" ('LLL'). */
function nombreMes(fecha, patron = 'LLLL') {
  const nombre = format(fecha, patron, { locale: es }).replace('.', '')
  return nombre.charAt(0).toUpperCase() + nombre.slice(1)
}

// Años hacia atrás que se pueden elegir en la cuadrícula de años.
const ANIOS_ATRAS = 10

// Estilo de las celdas de las cuadrículas de meses y años.
const CLASE_CELDA =
  'h-12 cursor-pointer rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent'
const CLASE_CELDA_ACTIVA = 'bg-blue-600 font-semibold text-white hover:bg-blue-700'
const CLASE_CELDA_NORMAL = 'text-slate-700 hover:bg-slate-100'

// Flecha de navegación (‹ o ›) del encabezado del panel.
function BotonFlecha({ direccion, ...props }) {
  return (
    <button
      type="button"
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
      {...props}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d={
            direccion === 'anterior'
              ? 'M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z'
              : 'M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z'
          }
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
}

// Botón del encabezado que abre la cuadrícula de meses o de años.
function BotonEncabezado({ children, ...props }) {
  return (
    <button
      type="button"
      className="cursor-pointer rounded-md px-2 py-1 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      {...props}
    >
      {children}
    </button>
  )
}

/** Días del rango contando ambos extremos. */
const diasDe = (desde, hasta) => differenceInCalendarDays(hasta, desde) + 1

// Clases de Tailwind para cada parte del calendario. Los estados de un día
// (selected, range_start…) se aplican a la celda, así que el estilo del botón
// interno se da con el selector `[&>button]`.
const CLASES_CALENDARIO = {
  root: 'text-sm text-slate-700',
  months: 'relative',
  month: 'flex flex-col',
  // El encabezado (mes, año y flechas) lo dibuja este componente; el de
  // react-day-picker queda oculto a la vista pero disponible para lectores de pantalla.
  month_caption: 'sr-only',
  month_grid: 'w-full border-collapse',
  weekdays: '',
  weekday: 'pb-1 text-center text-xs font-medium uppercase text-slate-400',
  week: '',
  day: 'p-0 text-center',
  day_button:
    'mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:hover:bg-transparent',
  today: '[&>button]:font-bold [&>button]:text-blue-700',
  outside: '[&>button]:text-slate-300',
  disabled: '[&>button]:text-slate-300',
  selected: '',
  // Extremos en azul fuerte; los días intermedios forman una franja azul clara.
  range_start: 'rounded-l-md bg-blue-50 [&>button]:bg-blue-600 [&>button]:text-white [&>button]:hover:bg-blue-700',
  range_end: 'rounded-r-md bg-blue-50 [&>button]:bg-blue-600 [&>button]:text-white [&>button]:hover:bg-blue-700',
  range_middle: 'bg-blue-50 [&>button]:rounded-none [&>button]:text-blue-900 [&>button]:hover:bg-blue-100',
}

// Props:
// - desde / hasta: fechas "yyyy-MM-dd" del rango aplicado.
// - onCambiar: callback (desde, hasta) con el rango nuevo, en "yyyy-MM-dd".
// - maxDias: (opcional) días máximos del rango, contando ambos extremos.
// - etiqueta: (opcional) texto sobre el botón.
export default function SelectorRangoFechas({ desde, hasta, onCambiar, maxDias, etiqueta = 'Fechas' }) {
  const [abierto, setAbierto] = useState(false)
  // Rango en edición dentro del panel ({ from, to } de react-day-picker).
  const [borrador, setBorrador] = useState(undefined)
  // Mes visible del calendario y día bajo el mouse (para la vista previa).
  const [mes, setMes] = useState(() => aFecha(hasta))
  const [diaHover, setDiaHover] = useState(null)
  // Vista del panel: 'dias' (calendario), 'meses' (cuadrícula de 12 meses) o
  // 'anios' (cuadrícula de años). `anioMeses` es el año de la cuadrícula de meses.
  const [vista, setVista] = useState('dias')
  const [anioMeses, setAnioMeses] = useState(() => aFecha(hasta).getFullYear())
  const contenedorRef = useRef(null)

  const hoy = new Date()
  // Meses navegables: de enero de hace ANIOS_ATRAS años al mes actual.
  const primerMes = new Date(hoy.getFullYear() - ANIOS_ATRAS, 0)
  const ultimoMes = startOfMonth(hoy)
  const fueraDeRango = (fecha) => fecha < primerMes || fecha > ultimoMes
  const anios = Array.from({ length: ANIOS_ATRAS + 1 }, (_, i) => primerMes.getFullYear() + i)

  // Abre el panel partiendo del rango aplicado.
  const abrir = () => {
    setBorrador({ from: aFecha(desde), to: aFecha(hasta) })
    setMes(aFecha(hasta))
    setDiaHover(null)
    setVista('dias')
    setAbierto(true)
  }

  // Cuadrícula de meses o de años, partiendo del año del mes visible.
  const verMeses = () => {
    setAnioMeses(mes.getFullYear())
    setVista('meses')
  }
  const verAnios = () => {
    if (vista === 'dias') setAnioMeses(mes.getFullYear())
    setVista('anios')
  }
  // Mes elegido en la cuadrícula -> regresa al calendario en ese mes.
  const elegirMes = (numeroMes) => {
    setMes(new Date(anioMeses, numeroMes))
    setVista('dias')
  }
  // Año elegido en la cuadrícula -> muestra los meses de ese año.
  const elegirAnio = (anio) => {
    setAnioMeses(anio)
    setVista('meses')
  }
  const cerrar = () => setAbierto(false)

  // Cierre con Esc o con un clic fuera del panel.
  useEffect(() => {
    if (!abierto) return undefined
    const alTeclear = (e) => e.key === 'Escape' && setAbierto(false)
    const alClic = (e) => {
      if (!contenedorRef.current?.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('keydown', alTeclear)
    document.addEventListener('mousedown', alClic)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.removeEventListener('mousedown', alClic)
    }
  }, [abierto])

  const aplicar = (rango) => {
    onCambiar(aTexto(rango.from), aTexto(rango.to ?? rango.from))
    cerrar()
  }

  // Días deshabilitados: los futuros y, con un inicio elegido y límite de
  // días, los que harían el rango más largo que el límite.
  const eligiendoFin = borrador?.from && !borrador.to
  const deshabilitados = [{ after: hoy }]
  if (eligiendoFin && maxDias) {
    deshabilitados.push({ before: subDays(borrador.from, maxDias - 1) })
    deshabilitados.push({ after: minFecha([addDays(borrador.from, maxDias - 1), hoy]) })
  }

  // Vista previa: mientras se elige el fin, el rango hasta el día bajo el mouse.
  let vistaPrevia = false
  if (eligiendoFin && diaHover) {
    vistaPrevia =
      diaHover < borrador.from ? { from: diaHover, to: borrador.from } : { from: borrador.from, to: diaHover }
  }

  // Texto del pie: días elegidos, o qué falta por elegir.
  let pie = 'Elige la fecha inicial.'
  if (eligiendoFin) pie = 'Elige la fecha final.'
  else if (borrador?.from && borrador.to) {
    const dias = diasDe(borrador.from, borrador.to)
    pie = `${dias} ${dias === 1 ? 'día seleccionado' : 'días seleccionados'}`
  }

  return (
    <div ref={contenedorRef} className="relative flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{etiqueta}</span>
      <button
        type="button"
        onClick={() => (abierto ? cerrar() : abrir())}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        className={`flex h-[38px] cursor-pointer items-center gap-2 rounded-md border bg-white px-3 text-left text-sm text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          abierto ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {/* Ícono de calendario. */}
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-slate-400">
          <path
            fillRule="evenodd"
            d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="flex-1 truncate">{textoRango(aFecha(desde), aFecha(hasta))}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-slate-400">
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Elegir rango de fechas"
          className="absolute left-0 top-full z-30 mt-2 w-[calc(100vw-2rem)] max-w-[20rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="p-3">
            {/* Encabezado: flechas y el mes / año como botones (o el rango de años). */}
            <div className="mb-3 flex items-center justify-between">
              {vista === 'anios' ? (
                <span className="w-8" />
              ) : (
                <BotonFlecha
                  direccion="anterior"
                  aria-label={vista === 'dias' ? 'Mes anterior' : 'Año anterior'}
                  disabled={
                    vista === 'dias' ? subMonths(mes, 1) < primerMes : anioMeses <= primerMes.getFullYear()
                  }
                  onClick={() => (vista === 'dias' ? setMes(subMonths(mes, 1)) : setAnioMeses(anioMeses - 1))}
                />
              )}

              <div className="flex items-center">
                {vista === 'dias' && (
                  <>
                    <BotonEncabezado onClick={verMeses} aria-label="Elegir mes">
                      {nombreMes(mes)}
                    </BotonEncabezado>
                    <BotonEncabezado onClick={verAnios} aria-label="Elegir año">
                      {mes.getFullYear()}
                    </BotonEncabezado>
                  </>
                )}
                {vista === 'meses' && (
                  <BotonEncabezado onClick={verAnios} aria-label="Elegir año">
                    {anioMeses}
                  </BotonEncabezado>
                )}
                {vista === 'anios' && (
                  <span className="px-2 py-1 text-sm font-semibold text-slate-900">
                    {anios[0]} – {anios[anios.length - 1]}
                  </span>
                )}
              </div>

              {vista === 'anios' ? (
                <span className="w-8" />
              ) : (
                <BotonFlecha
                  direccion="siguiente"
                  aria-label={vista === 'dias' ? 'Mes siguiente' : 'Año siguiente'}
                  disabled={vista === 'dias' ? addMonths(mes, 1) > ultimoMes : anioMeses >= hoy.getFullYear()}
                  onClick={() => (vista === 'dias' ? setMes(addMonths(mes, 1)) : setAnioMeses(anioMeses + 1))}
                />
              )}
            </div>

            {/* Vista de días: el calendario de un mes. */}
            {vista === 'dias' && (
              <DayPicker
                mode="range"
                locale={es}
                weekStartsOn={1}
                hideNavigation
                showOutsideDays
                resetOnSelect
                selected={borrador}
                onSelect={setBorrador}
                month={mes}
                onMonthChange={setMes}
                startMonth={primerMes}
                endMonth={hoy}
                disabled={deshabilitados}
                max={maxDias ? maxDias - 1 : undefined}
                onDayMouseEnter={(dia) => setDiaHover(dia)}
                onDayMouseLeave={() => setDiaHover(null)}
                modifiers={{ vista_previa: vistaPrevia }}
                modifiersClassNames={{ vista_previa: 'bg-blue-50' }}
                classNames={CLASES_CALENDARIO}
              />
            )}

            {/* Vista de meses: cuadrícula de 3 × 4; el mes visible va resaltado. */}
            {vista === 'meses' && (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, m) => {
                  const fecha = new Date(anioMeses, m)
                  const activo = anioMeses === mes.getFullYear() && m === mes.getMonth()
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => elegirMes(m)}
                      disabled={fueraDeRango(fecha)}
                      aria-label={`${nombreMes(fecha)} ${anioMeses}`}
                      aria-pressed={activo}
                      className={`${CLASE_CELDA} ${activo ? CLASE_CELDA_ACTIVA : CLASE_CELDA_NORMAL}`}
                    >
                      {nombreMes(fecha, 'LLL')}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Vista de años: cuadrícula de 3 columnas; el año visible va resaltado. */}
            {vista === 'anios' && (
              <div className="grid grid-cols-3 gap-2">
                {anios.map((anio) => {
                  const activo = anio === anioMeses
                  return (
                    <button
                      key={anio}
                      type="button"
                      onClick={() => elegirAnio(anio)}
                      aria-pressed={activo}
                      className={`${CLASE_CELDA} ${activo ? CLASE_CELDA_ACTIVA : CLASE_CELDA_NORMAL}`}
                    >
                      {anio}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pie: resumen del rango y acciones. */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-xs text-slate-500">
              {pie}
              {maxDias && ` Máximo ${maxDias} días.`}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cerrar}
                className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => aplicar(borrador)}
                disabled={!borrador?.from || !borrador.to}
                className="cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
