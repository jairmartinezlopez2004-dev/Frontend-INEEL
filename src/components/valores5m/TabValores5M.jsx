/**
 * TabValores5M.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Últimos valores 5 minutales" del medidor: muestra las medidas
 * acumuladas/promediadas cada 5 minutos, agrupadas por categoría (Energía,
 * Potencia, Tensión y corriente, Factor de potencia, Distorsión armónica).
 *
 * Rol en el sistema:
 * Análogo a TabInstantaneos.jsx pero para el intervalo de 5 minutos: permite
 * seleccionar qué medidas incluir (individualmente o con "Seleccionar
 * todos") y solicitarlas al medidor con el botón "Solicitar".
 *
 * Integración con el WebService (lectura de Valores 5 minutales):
 * FILAS contiene datos de ejemplo. En producción, estos valores deberán
 * llenarse con la respuesta del método del WebService que consulta el
 * histórico de 5 minutos del medidor (por ejemplo, LeerValores5Min), y el
 * botón "Solicitar" deberá enviar la petición usando las medidas marcadas
 * en el estado `seleccionados`.
 */
import { useState } from 'react'
import MonitorMedidaTile from '../common/MonitorMedidaTile'

// Catálogo de variables de 5 minutos, agrupadas por categoría.
// Cada `medida` tiene un id único (usado para el estado de selección),
// título, valor de ejemplo y unidad. Los `null` son espacios vacíos para
// mantener alineada la grilla cuando un grupo tiene menos elementos.
const FILAS = [
  {
    id: 'energia',
    etiqueta: 'Energía',
    medidas: [
      { id: 'whe', titulo: 'Whe', valor: '152340.500', unidad: 'kWh' },
      { id: 'whr', titulo: 'Whr', valor: '128.400', unidad: 'kWh' },
      { id: 'var1', titulo: 'VAR I', valor: '42310.200', unidad: 'kVARh' },
      { id: 'var2', titulo: 'VAR II', valor: '310.500', unidad: 'kVARh' },
      { id: 'var3', titulo: 'VAR III', valor: '512.700', unidad: 'kVARh' },
      { id: 'var4', titulo: 'VAR IV', valor: '98.300', unidad: 'kVARh' },
    ],
  },
  {
    id: 'potencia',
    etiqueta: 'Potencia',
    medidas: [
      { id: 'wa', titulo: 'WA', valor: '0.510', unidad: 'kW' },
      { id: 'wb', titulo: 'WB', valor: '0.501', unidad: 'kW' },
      { id: 'wc', titulo: 'WC', valor: '0.517', unidad: 'kW' },
      { id: 'vara', titulo: 'VARA', valor: '0.120', unidad: 'kVAR' },
      { id: 'varb', titulo: 'VARB', valor: '0.115', unidad: 'kVAR' },
      { id: 'varc', titulo: 'VARC', valor: '0.122', unidad: 'kVAR' },
    ],
  },
  {
    id: 'tension-corriente',
    etiqueta: 'Tensión y corriente',
    medidas: [
      { id: 'va', titulo: 'VA', valor: '120.5', unidad: 'V' },
      { id: 'vb', titulo: 'VB', valor: '119.8', unidad: 'V' },
      { id: 'vc', titulo: 'VC', valor: '121.1', unidad: 'V' },
      { id: 'ia', titulo: 'IA', valor: '4.230', unidad: 'A' },
      { id: 'ib', titulo: 'IB', valor: '4.185', unidad: 'A' },
      { id: 'ic', titulo: 'IC', valor: '4.267', unidad: 'A' },
    ],
  },
  {
    id: 'factor-potencia',
    etiqueta: 'Factor de potencia',
    medidas: [
      { id: 'fpa', titulo: 'FPA', valor: '0.973', unidad: '—' },
      { id: 'fpb', titulo: 'FPB', valor: '0.975', unidad: '—' },
      { id: 'fpc', titulo: 'FPC', valor: '0.972', unidad: '—' },
      null,
      null,
      null,
    ],
  },
  {
    id: 'thd',
    etiqueta: 'Distorsión armónica (THD)',
    medidas: [
      { id: 'thd-va', titulo: 'THD VA', valor: '2.4', unidad: '%' },
      { id: 'thd-vb', titulo: 'THD VB', valor: '2.1', unidad: '%' },
      { id: 'thd-vc', titulo: 'THD VC', valor: '2.6', unidad: '%' },
      { id: 'thd-ia', titulo: 'THD IA', valor: '3.8', unidad: '%' },
      { id: 'thd-ib', titulo: 'THD IB', valor: '3.5', unidad: '%' },
      { id: 'thd-ic', titulo: 'THD IC', valor: '4.0', unidad: '%' },
    ],
  },
]

// Lista plana de todos los ids de medidas existentes en FILAS (ignorando los
// espacios vacíos `null`). Se usa para saber si "todas" están seleccionadas
// y para poder seleccionarlas/deseleccionarlas de una sola vez.
const TODOS_LOS_IDS = FILAS.flatMap((fila) =>
  fila.medidas.filter(Boolean).map((medida) => medida.id),
)

function TabValores5M() {
  // Conjunto (Set) con los ids de las medidas actualmente marcadas por el usuario.
  const [seleccionados, setSeleccionados] = useState(() => new Set())

  // true si todas las medidas de la pantalla están seleccionadas; controla
  // el estado (checked) del checkbox maestro "Seleccionar todos".
  const todosSeleccionados = TODOS_LOS_IDS.every((id) => seleccionados.has(id))

  // Manejador del checkbox "Seleccionar todos": selecciona o limpia todas las
  // medidas de golpe según el nuevo estado del checkbox.
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
    // Contenedor con scroll propio para acomodar todas las categorías de medidas.
    <div className="h-full overflow-auto bg-gray-50 p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Encabezado de la vista: título a la izquierda, checkbox maestro a la derecha. */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold uppercase tracking-wide text-slate-800">
            Últimos valores 5 minutales
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

        {/* Una sección (tarjeta) por cada categoría de medidas. */}
        {FILAS.map((fila) => (
          <section
            key={fila.id}
            className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5"
          >
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-gray-900">
              {fila.etiqueta}
            </h3>
            {/* Grilla responsiva de tarjetas de medida (2 a 6 columnas según el ancho de pantalla). */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {fila.medidas.map((medida, index) =>
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
                  // Espacio invisible para mantener la alineación de la grilla.
                  <div key={`${fila.id}-vacio-${index}`} className="invisible" />
                ),
              )}
            </div>
          </section>
        ))}

        {/* Botón "Solicitar": estilo unificado con el resto de la aplicación.
            Pendiente de conectar con el WebService para enviar la solicitud
            de lectura de valores 5 minutales usando las medidas en `seleccionados`. */}
        <div className="flex justify-center pt-2">
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

export default TabValores5M
