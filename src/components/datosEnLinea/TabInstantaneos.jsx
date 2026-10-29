/**
 * TabInstantaneos.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Valores instantáneos" del medidor: muestra, agrupadas por fase
 * (A, B, C, Promedios y Línea/Frecuencia), las mediciones eléctricas más
 * recientes (tensión, corriente, potencias, factor de potencia, etc.).
 *
 * Rol en el sistema:
 * Permite al usuario elegir qué variables desea solicitar al medidor
 * (mediante las casillas de cada tarjeta y el checkbox "Seleccionar todos"),
 * ajustar el número de fases a consultar, y disparar la solicitud con el
 * botón "Solicitar".
 *
 * Integración con el WebService (lectura de Instantáneos):
 * - FASES es el catálogo de variables a mostrar; hoy sus `valor` son datos de
 *   ejemplo. En producción, estos valores deberán actualizarse con la
 *   respuesta del método del WebService encargado de leer instantáneos del
 *   medidor (por ejemplo, LeerInstantaneos), probablemente refrescándose
 *   periódicamente.
 * - El estado `seleccionados` representa qué medidas (ids) el usuario marcó
 *   para incluir en la próxima solicitud; el botón "Solicitar" es el punto
 *   donde, al conectar el backend, se armaría y enviaría esa petición.
 */
import { useState } from 'react'
import MonitorMedidaTile from '../common/MonitorMedidaTile'

// Catálogo de variables eléctricas instantáneas, agrupadas por fase.
// Cada `medida` tiene un id único (usado para el estado de selección),
// un título, un valor de ejemplo y su unidad. Los `null` representan
// espacios vacíos en la grilla (para mantener alineadas las columnas).
const FASES = [
  {
    id: 'faseA',
    etiqueta: 'Fase A',
    medidas: [
      { id: 'va', titulo: 'VA (Fase A - RMS)', valor: '120.5', unidad: 'V' },
      { id: 'ia', titulo: 'IA (Fase A - RMS)', valor: '4.230', unidad: 'A' },
      { id: 'pa', titulo: 'Potencia activa A', valor: '0.510', unidad: 'kW' },
      { id: 'qa', titulo: 'Potencia reactiva A', valor: '0.120', unidad: 'kVAR' },
      { id: 'sa', titulo: 'Potencia aparente A', valor: '0.524', unidad: 'kVA' },
      { id: 'fpa', titulo: 'Factor de potencia A', valor: '0.973', unidad: '—' },
    ],
  },
  {
    id: 'faseB',
    etiqueta: 'Fase B',
    medidas: [
      { id: 'vb', titulo: 'VB (Fase B - RMS)', valor: '119.8', unidad: 'V' },
      { id: 'ib', titulo: 'IB (Fase B - RMS)', valor: '4.185', unidad: 'A' },
      { id: 'pb', titulo: 'Potencia activa B', valor: '0.501', unidad: 'kW' },
      { id: 'qb', titulo: 'Potencia reactiva B', valor: '0.115', unidad: 'kVAR' },
      { id: 'sb', titulo: 'Potencia aparente B', valor: '0.514', unidad: 'kVA' },
      { id: 'fpb', titulo: 'Factor de potencia B', valor: '0.975', unidad: '—' },
    ],
  },
  {
    id: 'faseC',
    etiqueta: 'Fase C',
    medidas: [
      { id: 'vc', titulo: 'VC (Fase C - RMS)', valor: '121.1', unidad: 'V' },
      { id: 'ic', titulo: 'IC (Fase C - RMS)', valor: '4.267', unidad: 'A' },
      { id: 'pc', titulo: 'Potencia activa C', valor: '0.517', unidad: 'kW' },
      { id: 'qc', titulo: 'Potencia reactiva C', valor: '0.122', unidad: 'kVAR' },
      { id: 'sc', titulo: 'Potencia aparente C', valor: '0.531', unidad: 'kVA' },
      { id: 'fpc', titulo: 'Factor de potencia C', valor: '0.972', unidad: '—' },
    ],
  },
  {
    id: 'promedios',
    etiqueta: 'Promedios',
    medidas: [
      { id: 'vprom', titulo: 'V Promedio', valor: '120.5', unidad: 'V' },
      { id: 'iprom', titulo: 'I Promedio', valor: '4.227', unidad: 'A' },
      { id: 'pprom', titulo: 'Potencia activa prom.', valor: '0.509', unidad: 'kW' },
      { id: 'qprom', titulo: 'Potencia reactiva prom.', valor: '0.119', unidad: 'kVAR' },
      { id: 'sprom', titulo: 'Potencia aparente prom.', valor: '0.523', unidad: 'kVA' },
      { id: 'fpprom', titulo: 'Factor de potencia prom.', valor: '0.973', unidad: '—' },
    ],
  },
  {
    id: 'linea',
    etiqueta: 'Línea y frecuencia',
    medidas: [
      { id: 'vab', titulo: 'Vab (Línea)', valor: '208.3', unidad: 'V' },
      { id: 'vbc', titulo: 'Vbc (Línea)', valor: '207.9', unidad: 'V' },
      { id: 'vca', titulo: 'Vca (Línea)', valor: '208.1', unidad: 'V' },
      { id: 'frec', titulo: 'Frecuencia', valor: '60.01', unidad: 'Hz' },
      null,
      null,
    ],
  },
]

// Lista plana de todos los ids de medidas existentes en FASES (ignorando los
// espacios vacíos `null`). Se usa para saber si "todas" están seleccionadas
// y para poder seleccionarlas/deseleccionarlas de una sola vez.
const TODOS_LOS_IDS = FASES.flatMap((fase) =>
  fase.medidas.filter(Boolean).map((medida) => medida.id),
)

function TabInstantaneos() {
  // Conjunto (Set) con los ids de las medidas actualmente marcadas por el usuario.
  // Se usa Set en lugar de un array para verificar pertenencia (has) de forma eficiente.
  const [seleccionados, setSeleccionados] = useState(() => new Set())

  // true si absolutamente todas las medidas de la pantalla están seleccionadas;
  // controla el estado (checked) del checkbox maestro "Seleccionar todos".
  const todosSeleccionados = TODOS_LOS_IDS.every((id) => seleccionados.has(id))

  // Manejador del checkbox "Seleccionar todos": si se marca, selecciona todas
  // las medidas de golpe; si se desmarca, limpia la selección completa.
  const alternarTodos = (event) => {
    setSeleccionados(event.target.checked ? new Set(TODOS_LOS_IDS) : new Set())
  }

  // Fábrica de manejadores para cada checkbox individual de MonitorMedidaTile:
  // agrega o quita el id correspondiente del conjunto de seleccionados.
  const alternarMedida = (id) => (event) => {
    setSeleccionados((prev) => {
      const siguiente = new Set(prev)
      if (event.target.checked) {
        siguiente.add(id)
      } else {
        siguiente.delete(id)
      }
      return siguiente
    })
  }

  return (
    // Contenedor con scroll propio para acomodar todas las secciones de fases.
    <div className="flex-1 overflow-auto bg-gray-50 p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Encabezado de la vista: título a la izquierda, checkbox maestro a la derecha. */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold uppercase tracking-wide text-slate-800">
            Valores instantáneos
          </h2>

          {/* Checkbox maestro "Seleccionar todos": marca/desmarca todas las
              medidas visibles en esta pantalla de una sola vez. */}
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-900">
            <input
              type="checkbox"
              checked={todosSeleccionados}
              onChange={alternarTodos}
              className="h-3.5 w-3.5 cursor-pointer rounded-sm border-gray-300 accent-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            Seleccionar todos
          </label>
        </div>

        {/* Una sección (tarjeta) por cada fase/grupo de medidas. */}
        {FASES.map((fase) => (
          <section
            key={fase.id}
            className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5"
          >
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-gray-900">
              {fase.etiqueta}
            </h3>
            {/* Grilla responsiva de tarjetas de medida (2 a 6 columnas según el ancho de pantalla). */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {fase.medidas.map((medida, index) =>
                medida ? (
                  <MonitorMedidaTile
                    key={medida.id}
                    titulo={medida.titulo}
                    valor={medida.valor}
                    unidad={medida.unidad}
                    // Checkbox controlado: su estado viene del Set `seleccionados`
                    // y sus cambios se notifican mediante `alternarMedida`.
                    checked={seleccionados.has(medida.id)}
                    onChange={alternarMedida(medida.id)}
                  />
                ) : (
                  // Espacio invisible para mantener la alineación de la grilla
                  // cuando un grupo tiene menos medidas que columnas.
                  <div key={`${fase.id}-vacio-${index}`} className="invisible" />
                ),
              )}
            </div>
          </section>
        ))}

        {/* Pie de la vista: selector de número de fases + botón de solicitud al medidor. */}
        <div className="flex items-center justify-end gap-3 px-2 pt-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
            Fases
            <input
              type="number"
              defaultValue={0}
              className="w-16 rounded-md border-0 bg-gray-100 px-3 py-1.5 text-center text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          {/* Botón "Solicitar": estilo unificado con el resto de la aplicación.
              Pendiente de conectar con el WebService para enviar la solicitud
              de lectura de instantáneos usando las medidas en `seleccionados`. */}
          <button
            type="button"
            className="transform cursor-pointer rounded-lg bg-blue-600 px-8 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-95"
          >
            Solicitar
          </button>
        </div>
      </div>
    </div>
  )
}

export default TabInstantaneos
