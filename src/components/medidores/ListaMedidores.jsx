/**
 * ListaMedidores.jsx
 * ---------------------------------------------------------------------------
 * Catálogo de Medidores: tabla con todos los equipos registrados.
 *
 * Rol en el sistema:
 * - Es la vista inicial del módulo "Medidores".
 * - Cada fila tiene un botón "Detalles" que NO navega por sí mismo: avisa a
 *   App.jsx mediante el callback `onVerDetalles(medidor)` (elevación de
 *   estado). App.jsx guarda el medidor seleccionado y monta la vista
 *   ConfiguracionComunicaciones.
 * - Aplica permisos por rol: solo el Administrador (rolId === 2) ve el botón
 *   "Nuevo medidor". El Usuario Normal (rolId === 3) solo consulta.
 *
 * Datos:
 * Por ahora consume un arreglo simulado (MEDIDORES_MOCK). Para conectarlo al
 * WebService, sustituir el mock por `leeControladores()` de
 * services/medidoresService.js dentro de un useEffect.
 */

import EstadoBadge from './EstadoBadge'

// ID de rol del Administrador según el WebService (posición RolID del login).
const ROL_ADMINISTRADOR = 2

// Datos simulados mientras se conecta leeControladores.
const MEDIDORES_MOCK = [
  { dirRed: 1, dirRF: 101, descripcion: 'Subestación Norte - Alimentador 1', edo: 1, dirIP: '192.168.1.10', puerto: 502 },
  { dirRed: 2, dirRF: 102, descripcion: 'Subestación Norte - Alimentador 2', edo: 2, dirIP: '192.168.1.11', puerto: 502 },
  { dirRed: 3, dirRF: 103, descripcion: 'Laboratorio de Calidad de la Energía', edo: 1, dirIP: '192.168.1.12', puerto: 4001 },
  { dirRed: 4, dirRF: 104, descripcion: 'Edificio Administrativo - Tablero General', edo: 3, dirIP: '192.168.1.13', puerto: 502 },
]

// Encabezados de la tabla (se mantienen en un arreglo para no repetir markup).
const COLUMNAS = ['Dir. Red', 'Dir. RF', 'Descripción', 'Estado', 'Dirección IP', 'Puerto', '']

// Props:
// - usuarioLogueado: objeto { nombre, apellido, rolId, ... } que viene de App.jsx.
// - onVerDetalles: callback que recibe el objeto medidor completo al pulsar "Detalles".
export default function ListaMedidores({ usuarioLogueado, onVerDetalles }) {
  // Bandera de permisos: define si se muestran las acciones de administración.
  const esAdmin = usuarioLogueado?.rolId === ROL_ADMINISTRADOR

  return (
    <div className="rounded-xl bg-white shadow-md">
      {/* Encabezado de la tarjeta: título + acción exclusiva de Administrador. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">
          Catálogo de medidores
        </h2>
        {esAdmin && (
          <button
            type="button"
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95"
          >
            + Nuevo medidor
          </button>
        )}
      </div>

      {/* Contenedor con scroll horizontal para que la tabla no rompa el layout en pantallas angostas. */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {COLUMNAS.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MEDIDORES_MOCK.map((medidor) => (
              <tr key={medidor.dirRed} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-slate-700">{medidor.dirRed}</td>
                <td className="px-4 py-3 font-mono text-slate-700">{medidor.dirRF}</td>
                <td className="px-4 py-3 text-slate-900">{medidor.descripcion}</td>
                <td className="px-4 py-3">
                  <EstadoBadge edo={medidor.edo} />
                </td>
                <td className="px-4 py-3 font-mono text-slate-700">{medidor.dirIP}</td>
                <td className="px-4 py-3 font-mono text-slate-700">{medidor.puerto}</td>
                <td className="px-4 py-3 text-right">
                  {/* Navegación hacia la vista de detalle: se entrega el medidor
                      completo para que la siguiente vista no tenga que volver
                      a buscarlo en el catálogo. */}
                  <button
                    type="button"
                    onClick={() => onVerDetalles(medidor)}
                    className="cursor-pointer rounded-md border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                  >
                    Detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
