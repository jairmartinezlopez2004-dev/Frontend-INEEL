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
import { listarEventos } from '../../../services/eventosConfigService'
import { listarUnidades, textoUnidad, claseCeldaUnidad } from '../../../services/unidadesService'
import FormularioEvento from './FormularioEvento'
import EstadoActivo from '../../common/EstadoActivo'
import { useFiltroTabla } from '../../../hooks/useFiltroTabla'
import BuscadorTabla from '../../common/BuscadorTabla'
import { TriangleAlert } from 'lucide-react'
import TituloSeccion from '../../common/TituloSeccion'
import { BotonEditar, BotonPrimario } from '../../common/Botones'

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

  // Buscador de la tabla: filtra por las columnas visibles (el estado por su texto).
  const filtro = useFiltroTabla(eventos, (e) => [
    e.numEvento,
    e.descripcion,
    unidadDe(e.idUnidad),
    e.activo ? 'Activo' : 'Inactivo',
  ])

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Encabezado de la tarjeta: título + alta de evento. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <TituloSeccion Icono={TriangleAlert} titulo="Eventos configurados" />
        {esAdmin && enEdicion === undefined && (
          <BotonPrimario onClick={() => abrirFormulario(null)}>Nuevo evento</BotonPrimario>
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
        <div className="mx-6 mt-4 rounded-md border border-verde-200 bg-verde-50 p-3 text-sm text-verde-700">
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

      {/* Buscador sobre la tabla (solo si hay registros que filtrar). */}
      {!error && eventos.length > 0 && (
        <BuscadorTabla
          valor={filtro.texto}
          onCambio={filtro.setTexto}
          total={eventos.length}
          visibles={filtro.filtradas.length}
          placeholder="Buscar por número, descripción, unidad o estado…"
        />
      )}

      {/* Contenedor con scroll horizontal para que la tabla no rompa el layout en pantallas angostas. */}
      {!error && eventos.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-azul-700">
              <tr>
                {COLUMNAS.map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtro.filtradas.map((evento) => (
                <tr key={evento.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-700">{evento.numEvento}</td>
                  <td className="px-4 py-3 text-slate-900">{evento.descripcion}</td>
                  <td className={`px-4 py-3 text-slate-700 ${claseCeldaUnidad(unidadDe(evento.idUnidad))}`}>
                    {unidadDe(evento.idUnidad)}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoActivo activo={evento.activo} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {esAdmin && (
                      <BotonEditar onClick={() => abrirFormulario(evento)} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtro.texto.trim() && filtro.filtradas.length === 0 && (
            <p className="px-6 py-4 text-sm text-slate-500">
              Ningún evento coincide con “{filtro.texto.trim()}”.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
