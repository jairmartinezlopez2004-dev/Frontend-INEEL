/**
 * GestionControladoresRF.jsx
 * ---------------------------------------------------------------------------
 * Módulo "Controladores RF": catálogo de controladores de radiofrecuencia y,
 * dentro de cada uno, los medidores que tiene agrupados.
 *
 * Navegación en tres niveles (el estado vive aquí, no en App.jsx):
 *   Lista de controladores -> Detalle del controlador (sus medidores)
 *                          -> Detalle del medidor (pestañas Coms, Instantáneos…)
 * Al cambiar de módulo en el Sidebar este componente se desmonta, así que al
 * volver siempre se entra por la lista.
 *
 * Rol en el sistema:
 * - Cualquier usuario con sesión ve la lista (GET /ControladorRF) y el
 *   detalle de cada controlador.
 * - Solo el Administrador ve "+ Nuevo controlador" y "Editar"
 *   (POST / PUT /ControladorRF); el backend además rechaza con 403 a quien no lo sea.
 * - El backend no permite eliminar controladores: la baja se hace editando
 *   el estado a Inactivo (edo 20).
 * - El estado (`edo`) se muestra con EstadoBadge (10 activo, 11 en uso, 20 inactivo).
 */
import { useEffect, useState } from 'react'
import { listarControladoresRF } from '../../services/controladoresRFService'
import FormularioControlador from './FormularioControlador'
import DetalleControlador from './DetalleControlador'
import DetalleMedidor from '../medidores/DetalleMedidor'
import EstadoBadge from '../medidores/EstadoBadge'

// Encabezados de la tabla. La última columna (acciones) no tiene título.
const COLUMNAS = ['Nombre', 'Número de serie', 'Dirección IP', 'Estado', 'Medidores', '']

// Props:
// - esAdmin: si es true se muestran el alta y la edición.
// - usuarioLogueado: usuario autenticado (lo necesitan las pestañas del medidor).
// - soloLectura: si es true nadie edita, ni el Administrador ("Datos en línea").
export default function GestionControladoresRF({ esAdmin: esAdminRol, usuarioLogueado, soloLectura = false }) {
  // En modo solo lectura se ocultan el alta y la edición aunque el rol lo permita.
  const esAdmin = esAdminRol && !soloLectura
  const [controladores, setControladores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null) // Mensaje de éxito tras guardar.
  // Formulario abierto: undefined = cerrado, null = alta, objeto = edición.
  const [enEdicion, setEnEdicion] = useState(undefined)
  // Se incrementa para volver a pedir la lista después de guardar o al regresar del detalle.
  const [recarga, setRecarga] = useState(0)
  // Navegación: controlador abierto (null = lista) y medidor abierto dentro de él.
  const [controladorAbierto, setControladorAbierto] = useState(null)
  const [medidorAbierto, setMedidorAbierto] = useState(null)

  // Carga (y recarga) de la lista. El AbortController cancela la petición si
  // el usuario sale de la vista antes de que responda el WebService.
  useEffect(() => {
    const controlador = new AbortController()

    listarControladoresRF({ signal: controlador.signal })
      .then(setControladores)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [recarga])

  // Vuelve a pedir la lista (después de guardar o al regresar del detalle,
  // para que el conteo de medidores esté al día).
  const recargar = () => {
    setCargando(true)
    setError(null)
    setRecarga((n) => n + 1)
  }

  const abrirFormulario = (controlador) => {
    setAviso(null)
    setEnEdicion(controlador)
  }

  const alGuardar = (mensaje) => {
    setEnEdicion(undefined)
    setAviso(mensaje)
    recargar()
  }

  const volverALista = () => {
    setControladorAbierto(null)
    setAviso(null)
    recargar()
  }

  // ── Nivel 3: detalle de un medidor del controlador abierto ──
  if (controladorAbierto && medidorAbierto) {
    return (
      <DetalleMedidor
        key={medidorAbierto.id}
        medidor={medidorAbierto}
        usuarioLogueado={usuarioLogueado}
        soloLectura={soloLectura}
        textoVolver={`Volver a ${controladorAbierto.nombre}`}
        onVolver={() => setMedidorAbierto(null)}
      />
    )
  }

  // ── Nivel 2: detalle del controlador con sus medidores ──
  if (controladorAbierto) {
    return (
      <DetalleControlador
        key={controladorAbierto.id}
        idControlador={controladorAbierto.id}
        controladores={controladores}
        esAdmin={esAdmin}
        onVolver={volverALista}
        onVerMedidor={setMedidorAbierto}
        // Mantiene el nombre al día para el botón "Volver a …" si se edita el controlador.
        onCargado={setControladorAbierto}
      />
    )
  }

  // ── Nivel 1: lista de controladores ──
  return (
    <div className="rounded-xl bg-white shadow-md">
      {/* Encabezado de la tarjeta: título + alta de controlador. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">
          Controladores RF
        </h2>
        {esAdmin && enEdicion === undefined && (
          <button
            type="button"
            onClick={() => abrirFormulario(null)}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95"
          >
            + Nuevo controlador
          </button>
        )}
      </div>

      {/* `key` reinicia el formulario al cambiar entre alta y distintos controladores. */}
      {esAdmin && enEdicion !== undefined && (
        <FormularioControlador
          key={enEdicion?.id ?? 'nuevo'}
          controlador={enEdicion}
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
      {cargando && <p className="px-6 py-4 text-sm text-slate-500">Cargando controladores…</p>}
      {error && (
        <div className="m-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {!cargando && !error && controladores.length === 0 && (
        <p className="px-6 py-4 text-sm text-slate-500">
          No hay controladores RF registrados.
        </p>
      )}

      {/* Contenedor con scroll horizontal para que la tabla no rompa el layout en pantallas angostas. */}
      {!error && controladores.length > 0 && (
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
              {controladores.map((controlador) => (
                <tr key={controlador.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{controlador.nombre}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{controlador.numSerie}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{controlador.dirIP}</td>
                  <td className="px-4 py-3">
                    <EstadoBadge edo={controlador.edo} />
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{controlador.medidores.length}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {esAdmin && (
                      <button
                        type="button"
                        onClick={() => abrirFormulario(controlador)}
                        className="mr-2 cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        Editar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setControladorAbierto(controlador)}
                      className="cursor-pointer rounded-md border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                    >
                      Ver medidores
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
