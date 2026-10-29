/**
 * GestionPuntosIO.jsx
 * ---------------------------------------------------------------------------
 * Módulo "Puntos IO": puntos de entrada/salida configurados (tabla PuntosIO
 * del backend), con su grupo funcional, grupo eléctrico y unidad.
 *
 * Rol en el sistema:
 * - Cualquier usuario con sesión ve la lista (GET /PuntosIO) junto con los
 *   catálogos para mostrar nombres en lugar de IDs (GET /IO_GrupoFuncional,
 *   /IO_GrupoElectrico y /Unidades).
 * - Solo el SuperAdministrador ve "Editar" (PUT /PuntosIO/{id}), y cada edición
 *   pide su contraseña otra vez (ver FormularioPuntoIO.jsx).
 * - El backend no ofrece alta ni eliminación de puntos IO; la baja se hace
 *   editando el punto como inactivo (edo = false).
 */
import { useEffect, useState } from 'react'
import { listarPuntosIO } from '../../../services/puntosIOService'
import { listarGrupos } from '../../../services/gruposIOService'
import { listarUnidades, textoUnidad } from '../../../services/unidadesService'
import FormularioPuntoIO from './FormularioPuntoIO'
import EstadoActivo from '../../common/EstadoActivo'
import { useFiltroTabla } from '../../../hooks/useFiltroTabla'
import BuscadorTabla from '../../common/BuscadorTabla'

// Encabezados de la tabla. La última columna (acciones) no tiene título.
const COLUMNAS = [
  'ID',
  'Tag',
  'Descripción',
  'Grupo funcional',
  'Grupo eléctrico',
  'Unidad',
  'Tipo dato',
  'Tipo reg.',
  'Dir. CCEC',
  'Dir. Modbus',
  'Límites',
  'Estado',
  '',
]

/** Nombre del elemento del catálogo con ese id, o "#id" si no está o no tiene nombre. */
function nombreEn(catalogo, id, texto = (e) => e.nombre) {
  const elemento = catalogo.find((e) => e.id === id)
  return (elemento && texto(elemento).trim()) || `#${id}`
}

// Props:
// - esSuperAdmin: si es true se muestra la edición (el backend solo la
//   permite al SuperAdministrador).
export default function GestionPuntosIO({ esSuperAdmin }) {
  const [puntos, setPuntos] = useState([])
  const [catalogos, setCatalogos] = useState({ funcionales: [], electricos: [], unidades: [] })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null) // Mensaje de éxito tras guardar.
  // Punto en edición: null = formulario cerrado.
  const [enEdicion, setEnEdicion] = useState(null)
  // Se incrementa para volver a pedir la lista después de guardar.
  const [recarga, setRecarga] = useState(0)

  // Buscador de la tabla: filtra por las columnas visibles (el estado por su texto).
  const filtro = useFiltroTabla(puntos, (p) => [
    p.id,
    p.tag,
    p.descripcion,
    nombreEn(catalogos.funcionales, p.idGF),
    nombreEn(catalogos.electricos, p.idGE),
    nombreEn(catalogos.unidades, p.idUnidad, textoUnidad),
    p.tipoDato,
    p.tipoReg,
    p.dirCCEC,
    p.dirMB,
    p.activo ? 'Activo' : 'Inactivo',
  ])

  // Carga (y recarga) de los puntos y sus catálogos en paralelo. El
  // AbortController cancela las peticiones si el usuario sale de la vista
  // antes de que responda el WebService.
  useEffect(() => {
    const controlador = new AbortController()
    const { signal } = controlador

    Promise.all([
      listarPuntosIO({ signal }),
      listarGrupos('funcional', { signal }),
      listarGrupos('electrico', { signal }),
      listarUnidades({ signal }),
    ])
      .then(([listaPuntos, funcionales, electricos, unidades]) => {
        setPuntos(listaPuntos)
        setCatalogos({ funcionales, electricos, unidades })
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

  const abrirFormulario = (punto) => {
    setAviso(null)
    setEnEdicion(punto)
  }

  const alGuardar = (mensaje) => {
    setEnEdicion(null)
    setAviso(mensaje)
    recargar()
  }

  return (
    <div className="rounded-xl bg-white shadow-md">
      {/* Encabezado de la tarjeta. No hay botón de alta: el backend no la ofrece. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">Puntos IO</h2>
      </div>

      {/* `key` reinicia el formulario al cambiar de punto. */}
      {esSuperAdmin && enEdicion && (
        <FormularioPuntoIO
          key={enEdicion.id}
          punto={enEdicion}
          gruposFuncionales={catalogos.funcionales}
          gruposElectricos={catalogos.electricos}
          unidades={catalogos.unidades}
          onGuardado={alGuardar}
          onCancelar={() => setEnEdicion(null)}
        />
      )}

      {/* Mensajes de estado. */}
      {aviso && (
        <div className="mx-6 mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {aviso}
        </div>
      )}
      {cargando && <p className="px-6 py-4 text-sm text-slate-500">Cargando puntos IO…</p>}
      {error && (
        <div className="m-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {!cargando && !error && puntos.length === 0 && (
        <p className="px-6 py-4 text-sm text-slate-500">No hay puntos IO registrados.</p>
      )}

      {/* Buscador sobre la tabla (solo si hay registros que filtrar). */}
      {!error && puntos.length > 0 && (
        <BuscadorTabla
          valor={filtro.texto}
          onCambio={filtro.setTexto}
          total={puntos.length}
          visibles={filtro.filtradas.length}
          placeholder="Buscar por tag, descripción, grupo, unidad o dirección…"
        />
      )}

      {/* Contenedor con scroll horizontal para que la tabla no rompa el layout en pantallas angostas. */}
      {!error && puntos.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {COLUMNAS.map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtro.filtradas.map((punto) => (
                <tr key={punto.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-700">{punto.id}</td>
                  <td className="px-4 py-3 font-mono text-slate-900">{punto.tag}</td>
                  <td className="px-4 py-3 text-slate-900">
                    {punto.descripcion || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{nombreEn(catalogos.funcionales, punto.idGF)}</td>
                  <td className="px-4 py-3 text-slate-700">{nombreEn(catalogos.electricos, punto.idGE)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {nombreEn(catalogos.unidades, punto.idUnidad, textoUnidad)}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{punto.tipoDato}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{punto.tipoReg}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{punto.dirCCEC}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{punto.dirMB}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">
                    {punto.limMin} – {punto.limMax}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoActivo activo={punto.activo} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {esSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => abrirFormulario(punto)}
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
              Ningún punto IO coincide con “{filtro.texto.trim()}”.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
