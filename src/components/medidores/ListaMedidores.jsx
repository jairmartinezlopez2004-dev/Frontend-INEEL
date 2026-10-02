/**
 * ListaMedidores.jsx
 * ---------------------------------------------------------------------------
 * Catálogo de Medidores: tabla con todos los medidores QP registrados.
 *
 * Rol en el sistema:
 * - Es la vista inicial del módulo "Medidores".
 * - Cada fila tiene un botón "Detalles" que NO navega por sí mismo: avisa a
 *   App.jsx mediante el callback `onVerDetalles(medidor)` (elevación de
 *   estado). App.jsx guarda el medidor seleccionado y monta DetalleMedidor.
 * - Aplica permisos por rol: solo el Administrador (rolId === 2) ve
 *   "+ Nuevo medidor" y "Editar" (POST / PUT /MedidoresQP); el backend además
 *   rechaza con 403 a quien no lo sea. El backend no permite eliminar medidores.
 *
 * Datos:
 * El backend no tiene un GET propio de medidores: vienen dentro de cada
 * controlador en GET /ControladorRF (ver listarMedidores en medidoresService.js).
 * Por eso un medidor solo se puede dar de alta si ya existe un controlador RF.
 */
import { useEffect, useState } from 'react'
import EstadoBadge from './EstadoBadge'
import FormularioMedidor from './FormularioMedidor'
import { listarMedidores } from '../../services/medidoresService'

// ID de rol del Administrador en la UI (ver ROL_IDS en services/authService.js).
const ROL_ADMINISTRADOR = 2

// Encabezados de la tabla (se mantienen en un arreglo para no repetir markup).
const COLUMNAS = ['Controlador RF', 'Dir. Red', 'Dir. RF', 'Descripción', 'Estado', 'Dirección IP', '']

// Props:
// - usuarioLogueado: objeto { nombre, apellido, rolId, ... } que viene de App.jsx.
// - onVerDetalles: callback que recibe el objeto medidor completo al pulsar "Detalles".
export default function ListaMedidores({ usuarioLogueado, onVerDetalles }) {
  // Bandera de permisos: define si se muestran las acciones de administración.
  const esAdmin = usuarioLogueado?.rolId === ROL_ADMINISTRADOR

  const [medidores, setMedidores] = useState([])
  const [controladores, setControladores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null) // Mensaje de éxito tras guardar.
  // Formulario abierto: undefined = cerrado, null = alta, objeto = edición.
  const [enEdicion, setEnEdicion] = useState(undefined)
  // Se incrementa para volver a pedir la lista después de guardar.
  const [recarga, setRecarga] = useState(0)

  // Carga (y recarga) de la lista. El AbortController cancela la petición si
  // el usuario sale de la vista antes de que responda el WebService.
  useEffect(() => {
    const controlador = new AbortController()

    listarMedidores({ signal: controlador.signal })
      .then((datos) => {
        setMedidores(datos.medidores)
        setControladores(datos.controladores)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [recarga])

  const abrirFormulario = (medidor) => {
    setAviso(null)
    setEnEdicion(medidor)
  }

  const alGuardar = (mensaje) => {
    setEnEdicion(undefined)
    setAviso(mensaje)
    setCargando(true)
    setError(null)
    setRecarga((n) => n + 1)
  }

  const sinControladores = !cargando && !error && controladores.length === 0

  return (
    <div className="rounded-xl bg-white shadow-md">
      {/* Encabezado de la tarjeta: título + acción exclusiva de Administrador. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">
          Catálogo de medidores
        </h2>
        {esAdmin && enEdicion === undefined && controladores.length > 0 && (
          <button
            type="button"
            onClick={() => abrirFormulario(null)}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95"
          >
            + Nuevo medidor
          </button>
        )}
      </div>

      {/* `key` reinicia el formulario al cambiar entre alta y distintos medidores. */}
      {esAdmin && enEdicion !== undefined && (
        <FormularioMedidor
          key={enEdicion?.id ?? 'nuevo'}
          medidor={enEdicion}
          controladores={controladores}
          onGuardado={alGuardar}
          onCancelar={() => setEnEdicion(undefined)}
        />
      )}

      {/* Mensajes de estado. */}
      {aviso && (
        <div className="mx-6 mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {aviso}
        </div>
      )}
      {cargando && <p className="px-6 py-4 text-sm text-slate-500">Cargando medidores…</p>}
      {error && (
        <div className="m-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {sinControladores && (
        <p className="px-6 py-4 text-sm text-slate-500">
          No hay controladores RF registrados. Cada medidor pertenece a un controlador, así que
          primero hay que dar de alta uno en el módulo Controladores RF.
        </p>
      )}
      {!cargando && !error && controladores.length > 0 && medidores.length === 0 && (
        <p className="px-6 py-4 text-sm text-slate-500">No hay medidores registrados.</p>
      )}

      {/* Contenedor con scroll horizontal para que la tabla no rompa el layout en pantallas angostas. */}
      {!error && medidores.length > 0 && (
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
              {medidores.map((medidor) => (
                <tr key={medidor.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{medidor.nombreControlador}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{medidor.dirRed}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{medidor.dirRF}</td>
                  <td className="px-4 py-3 text-slate-900">{medidor.descripcion}</td>
                  <td className="px-4 py-3">
                    <EstadoBadge edo={medidor.edo} />
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{medidor.dirIP}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {esAdmin && (
                      <button
                        type="button"
                        onClick={() => abrirFormulario(medidor)}
                        className="mr-2 cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        Editar
                      </button>
                    )}
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
      )}
    </div>
  )
}
