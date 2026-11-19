/**
 * TabEventosMedidor.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Eventos" del medidor (datos en línea): pide al medidor los
 * eventos que tiene en su memoria y los muestra en una tabla con número de
 * evento, descripción, consumo, unidad, fecha y hora de registro.
 *
 * Rol en el sistema:
 * Replica la pestaña Eventos del visor de escritorio anterior:
 * - "Solicitar" lee los eventos del medidor.
 * - La columna "Guardar" marca qué eventos se guardan; el botón "Guardar"
 *   los descarga en un archivo CSV.
 * - "Cargar" abre un CSV guardado antes para volver a verlo.
 * No confundir con "Eventos registrados" del menú principal, que es el
 * historial que el sistema guarda en la base de datos.
 *
 * Integración con el WebService:
 * - El catálogo de eventos (descripción y unidad) sale de GET /EventosConfig
 *   y GET /Unidades.
 * - La lectura del medidor está pendiente: `lecturaSimulada` genera eventos
 *   de ejemplo con el catálogo; al conectar el backend se sustituirá por la
 *   llamada que lea los eventos del medidor.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { listarEventos } from '../../services/eventosConfigService'
import { listarUnidades, SIN_UNIDAD, claseCeldaUnidad } from '../../services/unidadesService'
import { BellRing } from 'lucide-react'
import TituloSeccion from '../common/TituloSeccion'

// Columnas ordenables: clave del renglón, encabezado y alineación.
const COLUMNAS = [
  { clave: 'numEvento', titulo: 'Núm. evento', derecha: true },
  { clave: 'descripcion', titulo: 'Descripción del evento' },
  { clave: 'consumo', titulo: 'Consumo', derecha: true },
  { clave: 'unidad', titulo: 'Unidad' },
  { clave: 'fecha', titulo: 'Fecha reg.' },
  { clave: 'hora', titulo: 'Hora reg.' },
]

// Encabezados del CSV, en el mismo orden que COLUMNAS.
const ENCABEZADOS_CSV = ['NumEvento', 'Descripcion', 'Consumo', 'Unidad', 'FechaReg', 'HoraReg']

const dosDigitos = (n) => String(n).padStart(2, '0')

// Datos de ejemplo mientras no exista el método del WebService: entre 5 y 12
// eventos del catálogo en los últimos 30 días, con consumo acumulado creciente.
function lecturaSimulada(catalogo) {
  const disponibles = catalogo.filter((e) => e.descripcion !== 'Reservado')
  if (disponibles.length === 0) return []
  const cantidad = 5 + Math.floor(Math.random() * 8)
  const ahora = Date.now()
  const instantes = Array.from({ length: cantidad }, () => ahora - Math.random() * 30 * 24 * 3600 * 1000).sort()
  let consumo = 1000 + Math.random() * 500
  return instantes.map((t, k) => {
    const evento = disponibles[Math.floor(Math.random() * disponibles.length)]
    const d = new Date(t)
    consumo += Math.random() * 40
    return {
      clave: `${t}-${k}`,
      numEvento: evento.numEvento,
      descripcion: evento.descripcion,
      consumo: Math.round(consumo * 100) / 100,
      unidad: evento.unidad,
      fecha: `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`,
      hora: `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}:${dosDigitos(d.getSeconds())}`,
    }
  })
}

/** Escapa un campo para CSV (comillas si trae coma, comilla o salto de línea). */
function campoCsv(valor) {
  const texto = String(valor ?? '')
  return /[",\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

/** Separa un texto CSV en renglones de campos, respetando campos entre comillas. */
function leerCsv(texto) {
  const renglones = []
  let renglon = []
  let campo = ''
  let entreComillas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"'
        i++
      } else if (c === '"') {
        entreComillas = false
      } else {
        campo += c
      }
    } else if (c === '"') {
      entreComillas = true
    } else if (c === ',') {
      renglon.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      renglon.push(campo)
      renglones.push(renglon)
      renglon = []
      campo = ''
    } else {
      campo += c
    }
  }
  if (campo !== '' || renglon.length > 0) {
    renglon.push(campo)
    renglones.push(renglon)
  }
  return renglones.filter((r) => r.some((c) => c.trim() !== ''))
}

/** Compara dos renglones por una columna (números como número, lo demás como texto). */
function comparar(a, b, clave) {
  const x = a[clave]
  const y = b[clave]
  if (typeof x === 'number' && typeof y === 'number') return x - y
  return String(x).localeCompare(String(y), 'es')
}

// Props:
// - medidor: medidor seleccionado en el catálogo (para el nombre del archivo).
function TabEventosMedidor({ medidor }) {
  // Catálogo de eventos con el símbolo de su unidad: [{ numEvento, descripcion, unidad }].
  const [catalogo, setCatalogo] = useState([])
  const [errorCatalogo, setErrorCatalogo] = useState('')
  const [eventos, setEventos] = useState([])
  // Claves de los renglones marcados en la columna "Guardar".
  const [marcados, setMarcados] = useState(() => new Set())
  // Orden de la tabla; por omisión, del más reciente al más antiguo.
  const [orden, setOrden] = useState({ clave: 'fecha', descendente: true })
  const [mensaje, setMensaje] = useState(null)
  const entradaArchivo = useRef(null)

  useEffect(() => {
    const controlador = new AbortController()
    const { signal } = controlador
    Promise.all([listarEventos({ signal }), listarUnidades({ signal })])
      .then(([listaEventos, listaUnidades]) => {
        const simbolos = new Map(listaUnidades.map((u) => [u.id, u.simbolo || SIN_UNIDAD]))
        setCatalogo(
          listaEventos
            .filter((e) => e.activo)
            .map((e) => ({ numEvento: e.numEvento, descripcion: e.descripcion, unidad: simbolos.get(e.idUnidad) ?? '' })),
        )
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setErrorCatalogo('No se pudo cargar el catálogo de eventos.')
      })
    return () => controlador.abort()
  }, [])

  const ordenados = useMemo(() => {
    const lista = [...eventos].sort((a, b) => {
      const resultado = comparar(a, b, orden.clave)
      // Fecha y hora juntas: a igual fecha decide la hora.
      return resultado !== 0 || orden.clave !== 'fecha' ? resultado : comparar(a, b, 'hora')
    })
    return orden.descendente ? lista.reverse() : lista
  }, [eventos, orden])

  const todosMarcados = eventos.length > 0 && eventos.every((e) => marcados.has(e.clave))

  const reemplazarEventos = (lista) => {
    setEventos(lista)
    setMarcados(new Set())
  }

  // Punto donde, al conectar el backend, se pedirán los eventos al medidor.
  const solicitar = () => {
    const lista = lecturaSimulada(catalogo)
    reemplazarEventos(lista)
    setMensaje({ tipo: 'ok', texto: `Se leyeron ${lista.length} eventos del medidor.` })
  }

  const ordenarPor = (clave) =>
    setOrden((prev) => ({ clave, descendente: prev.clave === clave ? !prev.descendente : false }))

  const alternarMarcado = (clave) => (e) =>
    setMarcados((prev) => {
      const siguiente = new Set(prev)
      if (e.target.checked) siguiente.add(clave)
      else siguiente.delete(clave)
      return siguiente
    })

  // Descarga en CSV los eventos marcados, en el orden en que se ven.
  const guardar = () => {
    const seleccion = ordenados.filter((e) => marcados.has(e.clave))
    const lineas = [
      ENCABEZADOS_CSV.join(','),
      ...seleccion.map((e) => COLUMNAS.map((c) => campoCsv(e[c.clave])).join(',')),
    ]
    // El BOM hace que Excel abra bien los acentos.
    const blob = new Blob(['\ufeff' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const hoy = new Date()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `eventos-medidor-${medidor?.id ?? 'sin-id'}-${hoy.getFullYear()}${dosDigitos(hoy.getMonth() + 1)}${dosDigitos(hoy.getDate())}.csv`
    a.click()
    // Se libera después, para no cortar la descarga en navegadores lentos.
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    setMensaje({ tipo: 'ok', texto: `Se guardaron ${seleccion.length} eventos en ${a.download}.` })
  }

  // Lee un CSV guardado con "Guardar" y lo muestra en la tabla.
  const cargar = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    const renglones = leerCsv((await archivo.text()).replace(/^\ufeff/, ''))
    const [encabezado, ...datos] = renglones
    if (!encabezado || encabezado.join(',') !== ENCABEZADOS_CSV.join(',')) {
      setMensaje({ tipo: 'error', texto: 'El archivo no tiene el formato de eventos guardado por el visor.' })
      return
    }
    reemplazarEventos(
      datos.map((r, k) => ({
        clave: `archivo-${k}`,
        numEvento: Number(r[0]),
        descripcion: r[1],
        consumo: Number(r[2]),
        unidad: r[3],
        fecha: r[4],
        hora: r[5],
      })),
    )
    setMensaje({ tipo: 'ok', texto: `Se cargaron ${datos.length} eventos de ${archivo.name}.` })
  }

  const claseBotonSecundario =
    'cursor-pointer rounded-lg bg-gray-100 px-6 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className="flex-1 overflow-auto pt-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <TituloSeccion Icono={BellRing} titulo="Eventos registrados en el medidor" />
          <span className="text-sm font-medium text-gray-600">
            {eventos.length} {eventos.length === 1 ? 'evento' : 'eventos'}
          </span>
        </div>

        {(errorCatalogo || mensaje) && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              errorCatalogo || mensaje?.tipo === 'error' ? 'bg-red-50 text-red-700' : 'bg-verde-50 text-verde-700'
            }`}
          >
            {errorCatalogo || mensaje.texto}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-azul-700 text-xs font-semibold text-white">
                <tr>
                  {COLUMNAS.map((c) => (
                    <th key={c.clave} className={`px-4 py-3 ${c.derecha ? 'text-right' : 'text-left'}`}>
                      <button
                        type="button"
                        onClick={() => ordenarPor(c.clave)}
                        className="inline-flex cursor-pointer items-center gap-1 hover:text-azul-700"
                      >
                        {c.titulo}
                        <span className="w-2 text-azul-700">
                          {orden.clave === c.clave ? (orden.descendente ? '▼' : '▲') : ''}
                        </span>
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      Guardar
                      <input
                        type="checkbox"
                        checked={todosMarcados}
                        disabled={eventos.length === 0}
                        onChange={(e) => setMarcados(e.target.checked ? new Set(eventos.map((ev) => ev.clave)) : new Set())}
                        aria-label="Marcar todos para guardar"
                        className="h-3.5 w-3.5 cursor-pointer rounded-sm border-gray-300 accent-azul-700"
                      />
                    </label>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordenados.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNAS.length + 1} className="px-4 py-12 text-center text-gray-400">
                      Presione "Solicitar" para leer los eventos del medidor, o "Cargar" para abrir un archivo guardado.
                    </td>
                  </tr>
                ) : (
                  ordenados.map((e) => (
                    <tr key={e.clave} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-gray-900">{e.numEvento}</td>
                      <td className="px-4 py-2.5 text-gray-900">{e.descripcion}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-gray-900">
                        {Number.isFinite(e.consumo) ? e.consumo.toFixed(2) : '—'}
                      </td>
                      <td className={`px-4 py-2.5 text-gray-700 ${claseCeldaUnidad(e.unidad)}`}>{e.unidad}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-gray-700">{e.fecha}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-gray-700">{e.hora}</td>
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={marcados.has(e.clave)}
                          onChange={alternarMarcado(e.clave)}
                          aria-label={`Guardar evento ${e.numEvento} del ${e.fecha} ${e.hora}`}
                          className="h-3.5 w-3.5 cursor-pointer rounded-sm border-gray-300 accent-azul-700"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 px-2">
          <button
            type="button"
            onClick={solicitar}
            disabled={catalogo.length === 0}
            title={catalogo.length === 0 ? 'Cargando catálogo de eventos…' : undefined}
            className="transform cursor-pointer rounded-lg bg-azul-700 px-8 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-azul-800 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Solicitar
          </button>
          <div className="flex gap-3">
            <input ref={entradaArchivo} type="file" accept=".csv,text/csv" onChange={cargar} className="hidden" />
            <button type="button" onClick={() => entradaArchivo.current.click()} className={claseBotonSecundario}>
              Cargar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={marcados.size === 0}
              title={marcados.size === 0 ? 'Marque en la columna "Guardar" los eventos a guardar' : undefined}
              className={claseBotonSecundario}
            >
              Guardar{marcados.size > 0 ? ` (${marcados.size})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TabEventosMedidor
