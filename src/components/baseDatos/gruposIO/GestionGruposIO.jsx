/**
 * GestionGruposIO.jsx
 * ---------------------------------------------------------------------------
 * Módulos "Grupos funcionales IO" y "Grupos eléctricos IO": catálogos con los
 * que se clasifican los puntos IO. Ambos tienen la misma forma (ID, nombre y
 * estado), así que un solo componente sirve para los dos según la prop `tipo`.
 *
 * Rol en el sistema:
 * - Cualquier usuario con sesión ve la lista (GET).
 * - Solo el Administrador ve "+ Nuevo grupo" y "Editar" (POST / PUT); el
 *   backend además rechaza con 403 a quien no lo sea.
 * - No hay eliminación física: la baja se hace editando el grupo como
 *   inactivo (edo = false).
 */
import { useEffect, useState } from 'react'
import { TIPOS_GRUPO, listarGrupos } from '../../../services/gruposIOService'
import FormularioGrupoIO from './FormularioGrupoIO'
import EstadoActivo from '../../common/EstadoActivo'
import { useFiltroTabla } from '../../../hooks/useFiltroTabla'
import BuscadorTabla from '../../common/BuscadorTabla'

// Encabezados de la tabla. La última columna (acciones) no tiene título.
const COLUMNAS = ['ID', 'Nombre', 'Estado', '']

// Props:
// - tipo: 'funcional' o 'electrico' (ver TIPOS_GRUPO).
// - esAdmin: si es true se muestran el alta y la edición.
export default function GestionGruposIO({ tipo, esAdmin }) {
  const { titulo, singular } = TIPOS_GRUPO[tipo]
  const [grupos, setGrupos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null) // Mensaje de éxito tras guardar.
  // Formulario abierto: undefined = cerrado, null = alta, objeto = edición.
  const [enEdicion, setEnEdicion] = useState(undefined)
  // Se incrementa para volver a pedir la lista después de guardar.
  const [recarga, setRecarga] = useState(0)

  // Buscador de la tabla: filtra por las columnas visibles (el estado por su texto).
  const filtro = useFiltroTabla(grupos, (g) => [
    g.id,
    g.nombre,
    g.activo ? 'Activo' : 'Inactivo',
  ])

  // Carga (y recarga) de la lista. El AbortController cancela la petición si
  // el usuario sale de la vista antes de que responda el WebService.
  useEffect(() => {
    const controlador = new AbortController()

    listarGrupos(tipo, { signal: controlador.signal })
      .then(setGrupos)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [tipo, recarga])

  const recargar = () => {
    setCargando(true)
    setError(null)
    setRecarga((n) => n + 1)
  }

  const abrirFormulario = (grupo) => {
    setAviso(null)
    setEnEdicion(grupo)
  }

  const alGuardar = (mensaje) => {
    setEnEdicion(undefined)
    setAviso(mensaje)
    recargar()
  }

  return (
    <div className="rounded-xl bg-white shadow-md">
      {/* Encabezado de la tarjeta: título + alta de grupo. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">{titulo}</h2>
        {esAdmin && enEdicion === undefined && (
          <button
            type="button"
            onClick={() => abrirFormulario(null)}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95"
          >
            + Nuevo {singular}
          </button>
        )}
      </div>

      {/* `key` reinicia el formulario al cambiar entre alta y distintos grupos. */}
      {esAdmin && enEdicion !== undefined && (
        <FormularioGrupoIO
          key={enEdicion?.id ?? 'nuevo'}
          tipo={tipo}
          grupo={enEdicion}
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
      {cargando && <p className="px-6 py-4 text-sm text-slate-500">Cargando grupos…</p>}
      {error && (
        <div className="m-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {!cargando && !error && grupos.length === 0 && (
        <p className="px-6 py-4 text-sm text-slate-500">No hay grupos registrados.</p>
      )}

      {/* Buscador sobre la tabla (solo si hay registros que filtrar). */}
      {!error && grupos.length > 0 && (
        <BuscadorTabla
          valor={filtro.texto}
          onCambio={filtro.setTexto}
          total={grupos.length}
          visibles={filtro.filtradas.length}
          placeholder="Buscar por ID, nombre o estado…"
        />
      )}

      {/* Contenedor con scroll horizontal para que la tabla no rompa el layout en pantallas angostas. */}
      {!error && grupos.length > 0 && (
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
              {filtro.filtradas.map((grupo) => (
                <tr key={grupo.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-700">{grupo.id}</td>
                  {/* Hay registros con nombre vacío en la base de datos; se marcan con un guion. */}
                  <td className="px-4 py-3 text-slate-900">
                    {grupo.nombre.trim() || <span className="text-slate-400">— (sin nombre)</span>}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoActivo activo={grupo.activo} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {esAdmin && (
                      <button
                        type="button"
                        onClick={() => abrirFormulario(grupo)}
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
          {filtro.texto.trim() && filtro.filtradas.length === 0 && (
            <p className="px-6 py-4 text-sm text-slate-500">
              Ningún grupo coincide con “{filtro.texto.trim()}”.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
