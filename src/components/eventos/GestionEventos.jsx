/**
 * GestionEventos.jsx
 * ---------------------------------------------------------------------------
 * Módulo "Eventos configurados": catálogo de los eventos que el sistema
 * reconoce (tabla EventosConfig del backend).
 *
 * Rol en el sistema:
 * - Cualquier usuario con sesión ve la lista (GET /EventosConfig) junto con
 *   la unidad de cada evento (GET /Unidades).
 * - Solo el Administrador ve "+ Nuevo evento" y "Editar" (POST / PUT
 *   /EventosConfig); el backend además rechaza con 403 a quien no lo sea.
 * - No hay eliminación física: la baja de un evento se hace editándolo como
 *   inactivo (edo = false).
 */
import { useEffect, useState } from 'react'
import { listarEventos } from '../../services/eventosConfigService'
import { listarUnidades, textoUnidad } from '../../services/unidadesService'
import FormularioEvento from './FormularioEvento'
import EstadoActivo from '../common/EstadoActivo'

// Encabezados de la tabla. La última columna (acciones) no tiene título.
const COLUMNAS = ['Núm. evento', 'Descripción', 'Unidad', 'Estado', '']

// Props:
// - esAdmin: si es true se muestran el alta y la edición.
export default function GestionEventos({ esAdmin }) {
  const [eventos, setEventos] = useState([])
  const [unidades, setUnidades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null) // Mensaje de éxito tras guardar.
  // Formulario abierto: undefined = cerrado, null = alta, objeto = edición.
  const [enEdicion, setEnEdicion] = useState(undefined)
  // Se incrementa para volver a pedir la lista después de guardar.
  const [recarga, setRecarga] = useState(0)

  // Carga (y recarga) de eventos y unidades en paralelo. El AbortController
  // cancela las peticiones si el usuario sale de la vista antes de que
  // responda el WebService.
  useEffect(() => {
    const controlador = new AbortController()
    const { signal } = controlador

    Promise.all([listarEventos({ signal }), listarUnidades({ signal })])
      .then(([listaEventos, listaUnidades]) => {
        setEventos(listaEventos)
        setUnidades(listaUnidades)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [recarga])

  const recargar = () => {
    setCargando(true)
    setError(null)
    setRecarga((n) => n + 1)
  }

  const abrirFormulario = (evento) => {
    setAviso(null)
    setEnEdicion(evento)
  }

  const alGuardar = (mensaje) => {
    setEnEdicion(undefined)
    setAviso(mensaje)
    recargar()
  }

  // Texto de la unidad de un evento; si el ID no está en el catálogo, se muestra el número.
  const unidadDe = (idUnidad) => {
    const unidad = unidades.find((u) => u.id === idUnidad)
    return unidad ? textoUnidad(unidad) : `ID ${idUnidad}`
  }

  return (
    <div className="rounded-xl bg-white shadow-md">
      {/* Encabezado de la tarjeta: título + alta de evento. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">
          Eventos configurados
        </h2>
        {esAdmin && enEdicion === undefined && (
          <button
            type="button"
            onClick={() => abrirFormulario(null)}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95"
          >
            + Nuevo evento
          </button>
        )}
      </div>

      {/* `key` reinicia el formulario al cambiar entre alta y distintos eventos. */}
      {esAdmin && enEdicion !== undefined && (
        <FormularioEvento
          key={enEdicion?.id ?? 'nuevo'}
          evento={enEdicion}
          unidades={unidades}
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
      {cargando && <p className="px-6 py-4 text-sm text-slate-500">Cargando eventos…</p>}
      {error && (
        <div className="m-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {!cargando && !error && eventos.length === 0 && (
        <p className="px-6 py-4 text-sm text-slate-500">No hay eventos configurados.</p>
      )}

      {/* Contenedor con scroll horizontal para que la tabla no rompa el layout en pantallas angostas. */}
      {!error && eventos.length > 0 && (
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
              {eventos.map((evento) => (
                <tr key={evento.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-700">{evento.numEvento}</td>
                  <td className="px-4 py-3 text-slate-900">{evento.descripcion}</td>
                  <td className="px-4 py-3 text-slate-700">{unidadDe(evento.idUnidad)}</td>
                  <td className="px-4 py-3">
                    <EstadoActivo activo={evento.activo} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {esAdmin && (
                      <button
                        type="button"
                        onClick={() => abrirFormulario(evento)}
                        className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        Editar
                      </button>
                    )}
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
