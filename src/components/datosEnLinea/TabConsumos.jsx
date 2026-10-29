/**
 * TabConsumos.jsx
 * ---------------------------------------------------------------------------
 * Vista de "Consumos de energía" del medidor: muestra, por cada parámetro de
 * energía (Whe, Whr, VARh I-IV), los valores acumulados de las Fases A, B, C
 * y el Total.
 *
 * Rol en el sistema:
 * Igual que TabInstantaneos.jsx y TabValores5M.jsx, permite al usuario elegir
 * qué medidas de consumo desea incluir en la próxima solicitud al medidor
 * (individualmente o con el checkbox maestro "Seleccionar todos") y
 * dispararla con el botón "Solicitar".
 *
 * Integración con el WebService (lectura de Consumos):
 * PARAMETROS contiene datos de ejemplo (todos en "0.00"). En producción,
 * estos valores deberán poblarse con la respuesta del método del WebService
 * que consulta los consumos acumulados del medidor (por ejemplo,
 * LeerConsumos), y el botón "Solicitar" deberá enviar la petición usando las
 * medidas marcadas en el estado `seleccionados`.
 */
import { useState } from 'react'
import MonitorMedidaTile from '../common/MonitorMedidaTile'

// Catálogo de parámetros de consumo de energía. Cada parámetro comparte una
// unidad (kWh o kVARh) y expone sus medidas por Fase A/B/C y Total.
const PARAMETROS = [
  {
    id: 'whe',
    etiqueta: 'Whe',
    unidad: 'kWh',
    medidas: [
      { id: 'whe-a', titulo: 'Fase A', valor: '0.00' },
      { id: 'whe-b', titulo: 'Fase B', valor: '0.00' },
      { id: 'whe-c', titulo: 'Fase C', valor: '0.00' },
      { id: 'whe-total', titulo: 'Total', valor: '0.00' },
    ],
  },
  {
    id: 'whr',
    etiqueta: 'Whr',
    unidad: 'kWh',
    medidas: [
      { id: 'whr-a', titulo: 'Fase A', valor: '0.00' },
      { id: 'whr-b', titulo: 'Fase B', valor: '0.00' },
      { id: 'whr-c', titulo: 'Fase C', valor: '0.00' },
      { id: 'whr-total', titulo: 'Total', valor: '0.00' },
    ],
  },
  {
    id: 'var1',
    etiqueta: 'VARh I',
    unidad: 'kVARh',
    medidas: [
      { id: 'var1-a', titulo: 'Fase A', valor: '0.00' },
      { id: 'var1-b', titulo: 'Fase B', valor: '0.00' },
      { id: 'var1-c', titulo: 'Fase C', valor: '0.00' },
      { id: 'var1-total', titulo: 'Total', valor: '0.00' },
    ],
  },
  {
    id: 'var2',
    etiqueta: 'VARh II',
    unidad: 'kVARh',
    medidas: [
      { id: 'var2-a', titulo: 'Fase A', valor: '0.00' },
      { id: 'var2-b', titulo: 'Fase B', valor: '0.00' },
      { id: 'var2-c', titulo: 'Fase C', valor: '0.00' },
      { id: 'var2-total', titulo: 'Total', valor: '0.00' },
    ],
  },
  {
    id: 'var3',
    etiqueta: 'VARh III',
    unidad: 'kVARh',
    medidas: [
      { id: 'var3-a', titulo: 'Fase A', valor: '0.00' },
      { id: 'var3-b', titulo: 'Fase B', valor: '0.00' },
      { id: 'var3-c', titulo: 'Fase C', valor: '0.00' },
      { id: 'var3-total', titulo: 'Total', valor: '0.00' },
    ],
  },
  {
    id: 'var4',
    etiqueta: 'VARh IV',
    unidad: 'kVARh',
    medidas: [
      { id: 'var4-a', titulo: 'Fase A', valor: '0.00' },
      { id: 'var4-b', titulo: 'Fase B', valor: '0.00' },
      { id: 'var4-c', titulo: 'Fase C', valor: '0.00' },
      { id: 'var4-total', titulo: 'Total', valor: '0.00' },
    ],
  },
]

// Lista plana de todos los ids de medidas existentes en PARAMETROS.
// Se usa para saber si "todas" están seleccionadas y para poder
// seleccionarlas/deseleccionarlas de una sola vez.
const TODOS_LOS_IDS = PARAMETROS.flatMap((parametro) =>
  parametro.medidas.map((medida) => medida.id),
)

function TabConsumos() {
  // Conjunto (Set) con los ids de las medidas de consumo actualmente marcadas por el usuario.
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
    // Contenedor con scroll propio para acomodar todos los parámetros de consumo.
    <div className="flex-1 overflow-auto bg-gray-50 p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Encabezado de la vista: título a la izquierda, checkbox maestro a la derecha. */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">
            Consumos de energía
          </h2>

          {/* Checkbox maestro "Seleccionar todos": marca/desmarca todas las
              medidas de consumo visibles en esta pantalla de una sola vez. */}
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

        {/* Una sección (tarjeta) por cada parámetro de consumo (Whe, Whr, VARh I-IV). */}
        {PARAMETROS.map((parametro) => (
          <section
            key={parametro.id}
            className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5"
          >
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-widest text-gray-900">
              {parametro.etiqueta}
            </h3>
            {/* Grilla de tarjetas de medida (Fase A, B, C y Total). */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {parametro.medidas.map((medida) => (
                <MonitorMedidaTile
                  key={medida.id}
                  titulo={medida.titulo}
                  valor={medida.valor}
                  unidad={parametro.unidad}
                  // Checkbox controlado: su estado viene del Set `seleccionados`
                  // y sus cambios se notifican mediante `alternarMedida`.
                  checked={seleccionados.has(medida.id)}
                  onChange={alternarMedida(medida.id)}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Botón "Solicitar": estilo unificado con el resto de la aplicación.
            Pendiente de conectar con el WebService para enviar la solicitud
            de lectura de consumos usando las medidas en `seleccionados`. */}
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

export default TabConsumos
