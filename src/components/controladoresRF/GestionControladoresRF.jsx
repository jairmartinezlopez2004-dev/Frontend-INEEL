/**
 * GestionControladoresRF.jsx
 * ---------------------------------------------------------------------------
 * Módulo "Controladores RF": catálogo de controladores de radiofrecuencia y,
 * dentro de cada uno, los medidores que tiene agrupados.
 *
 * Navegación en tres niveles, cada uno con su propia URL (ver App.jsx), de
 * modo que Atrás / Adelante del navegador y recargar la página funcionan:
 *   <rutaBase>                          Lista de controladores
 *   <rutaBase>/:idControlador           Detalle del controlador (sus medidores)
 *   <rutaBase>/:idControlador/medidores/:idMedidor
 *                                       Detalle del medidor (pestañas Coms, Instantáneos…)
 * El nivel se decide con los parámetros de la URL (useParams).
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
import { Navigate, useNavigate, useParams } from 'react-router'
import { listarControladoresRF } from '../../services/controladoresRFService'
import FormularioControlador from './FormularioControlador'
import DetalleControlador from './DetalleControlador'
import MedidorDeControlador from './MedidorDeControlador'
import EstadoBadge from '../medidores/EstadoBadge'

// Encabezados de la tabla. La última columna (acciones) no tiene título.
const COLUMNAS = ['Nombre', 'Número de serie', 'Dirección IP', 'Estado', 'Medidores', '']

// Props:
// - esAdmin: si es true se muestran el alta y la edición.
// - usuarioLogueado: usuario autenticado (lo necesitan las pestañas del medidor).
// - soloLectura: si es true nadie edita, ni el Administrador ("Datos en línea").
// - rutaBase: URL de la lista (p. ej. '/configuracion/controladores-rf').
export default function GestionControladoresRF({ esAdmin: esAdminRol, usuarioLogueado, soloLectura = false, rutaBase }) {
  // En modo solo lectura se ocultan el alta y la edición aunque el rol lo permita.
  const esAdmin = esAdminRol && !soloLectura
  const navigate = useNavigate()
  // Nivel de navegación según la URL: sin IDs = lista; con idControlador =
  // detalle del controlador; con ambos = detalle del medidor.
  const { idControlador: paramControlador, idMedidor: paramMedidor } = useParams()
  const idControlador = paramControlador === undefined ? null : Number(paramControlador)
  const idMedidor = paramMedidor === undefined ? null : Number(paramMedidor)
  const [controladores, setControladores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null) // Mensaje de éxito tras guardar.
  // Formulario abierto: undefined = cerrado, null = alta, objeto = edición.
  const [enEdicion, setEnEdicion] = useState(undefined)
  // Se incrementa para volver a pedir la lista después de guardar.
  const [recarga, setRecarga] = useState(0)

  // Carga (y recarga) de la lista. También se vuelve a pedir al cambiar de
  // controlador o al regresar a la lista, para que el conteo de medidores
  // esté al día. El AbortController cancela la petición si el usuario sale
  // de la vista antes de que responda el WebService.
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
  }, [recarga, idControlador])

  // Vuelve a pedir la lista después de guardar.
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

  // Abre un controlador: cambia la URL y React Router muestra el nivel 2.
  const abrirControlador = (id) => {
    setAviso(null)
    setEnEdicion(undefined)
    navigate(`${rutaBase}/${id}`)
  }

  // Un ID que no es número (URL escrita a mano) regresa a la lista.
  if (Number.isNaN(idControlador) || Number.isNaN(idMedidor)) {
    return <Navigate to={rutaBase} replace />
  }

  // ── Nivel 3: detalle de un medidor del controlador abierto ──
  if (idControlador !== null && idMedidor !== null) {
    return (
      <MedidorDeControlador
        key={`${idControlador}-${idMedidor}`}
        idControlador={idControlador}
        idMedidor={idMedidor}
        usuarioLogueado={usuarioLogueado}
        soloLectura={soloLectura}
        onVolver={() => navigate(`${rutaBase}/${idControlador}`)}
      />
    )
  }

  // ── Nivel 2: detalle del controlador con sus medidores ──
  if (idControlador !== null) {
    return (
      <DetalleControlador
        key={idControlador}
        idControlador={idControlador}
        controladores={controladores}
        esAdmin={esAdmin}
        onVolver={() => navigate(rutaBase)}
        // "Detalles" solo existe en "Datos en línea"; en configuración solo se edita.
        onVerMedidor={
          soloLectura
            ? (medidor) => navigate(`${rutaBase}/${idControlador}/medidores/${medidor.id}`)
            : undefined
        }
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
                      onClick={() => abrirControlador(controlador.id)}
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
