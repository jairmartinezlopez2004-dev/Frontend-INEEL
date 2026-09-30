/**
 * GestionUsuarios.jsx
 * ---------------------------------------------------------------------------
 * Módulo "Usuarios": catálogo de usuarios del sistema con alta y edición.
 *
 * Rol en el sistema:
 * - Solo se muestra al Administrador (App.jsx y Sidebar.jsx ocultan la opción
 *   al Usuario Normal; además el backend rechaza con 401/403 a quien no lo sea).
 * - Lista los usuarios (GET /Users) y permite:
 *     · "+ Nuevo usuario": correo, nombre, contraseña y rol (POST /Users).
 *     · "Editar": correo, nombre, rol, estado activo/inactivo y tiempo de
 *       sesión (PUT /Users/{id}). La contraseña no se modifica por aquí, y
 *       la "baja" de un usuario se hace desmarcando "Activo".
 */
import { useEffect, useState } from 'react'
import {
  ROLES,
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
} from '../../services/usuariosService'

// Encabezados de la tabla (se mantienen en un arreglo para no repetir markup).
const COLUMNAS = ['Nombre', 'Correo', 'Rol', 'Estado', 'Sesión (min)', '']

// Valores iniciales del formulario de alta.
const FORM_NUEVO = {
  correo: '',
  nombreUsuario: '',
  contrasena: '',
  rol: 'Usuario',
  activo: true,
  tiempoSesion: 60,
}

// Clases compartidas por inputs y selects.
const CLASES_CONTROL =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500'

// Etiqueta + control.
function Campo({ etiqueta, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-slate-900">{etiqueta}</span>
      {children}
    </label>
  )
}

// Badge de estado activo/inactivo.
function EstadoUsuario({ activo }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap ${
        activo
          ? 'bg-green-100 text-green-800 ring-green-600/20'
          : 'bg-slate-100 text-slate-600 ring-slate-500/20'
      }`}
    >
      {activo ? 'ACTIVO' : 'INACTIVO'}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Formulario de alta / edición
// ---------------------------------------------------------------------------

// Props:
// - usuario: null para alta, u objeto usuario (de usuariosService) para editar.
// - onGuardado: callback con el mensaje de éxito tras guardar.
// - onCancelar: callback para cerrar el formulario sin guardar.
function FormularioUsuario({ usuario, onGuardado, onCancelar }) {
  const esEdicion = usuario !== null
  const [form, setForm] = useState(esEdicion ? { ...usuario, contrasena: '' } : FORM_NUEVO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  // Genera un manejador onChange para el campo indicado.
  const actualizar = (campo) => (e) => {
    const { type, checked, value } = e.target
    const valor = type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      const datos = { ...form, correo: form.correo.trim(), nombreUsuario: form.nombreUsuario.trim() }
      if (esEdicion) {
        await actualizarUsuario(usuario.id, datos)
        onGuardado('Usuario actualizado correctamente.')
      } else {
        await crearUsuario(datos)
        onGuardado('Usuario creado correctamente.')
      }
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="border-b border-slate-200 bg-slate-50 px-6 py-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-800">
        {esEdicion ? `Editar usuario: ${usuario.nombreUsuario}` : 'Nuevo usuario'}
      </h3>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* <fieldset disabled> bloquea todos los controles mientras se guarda. */}
      <fieldset disabled={guardando} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Campo etiqueta="Nombre">
          <input
            type="text"
            required
            value={form.nombreUsuario}
            onChange={actualizar('nombreUsuario')}
            className={CLASES_CONTROL}
          />
        </Campo>

        <Campo etiqueta="Correo">
          <input
            type="email"
            required
            value={form.correo}
            onChange={actualizar('correo')}
            className={CLASES_CONTROL}
          />
        </Campo>

        {/* La contraseña solo se captura en el alta: el PUT del backend no la modifica. */}
        {!esEdicion && (
          <Campo etiqueta="Contraseña (mínimo 8 caracteres)">
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.contrasena}
              onChange={actualizar('contrasena')}
              className={CLASES_CONTROL}
            />
          </Campo>
        )}

        <Campo etiqueta="Rol">
          <select value={form.rol} onChange={actualizar('rol')} className={CLASES_CONTROL}>
            {ROLES.map((rol) => (
              <option key={rol} value={rol}>
                {rol}
              </option>
            ))}
          </select>
        </Campo>

        {/* Estado y tiempo de sesión solo se pueden cambiar al editar
            (el alta del backend los fija en activo y 60 minutos). */}
        {esEdicion && (
          <>
            {/* El backend acepta entre 1 y 1440 minutos (24 h). */}
            <Campo etiqueta="Tiempo de sesión (1 a 1440 minutos)">
              <input
                type="number"
                required
                min={1}
                max={1440}
                value={form.tiempoSesion}
                onChange={actualizar('tiempoSesion')}
                className={CLASES_CONTROL}
              />
            </Campo>

            <label className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={actualizar('activo')}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-slate-900">
                Activo (desmarcar para dar de baja)
              </span>
            </label>
          </>
        )}
      </fieldset>

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancelar}
          disabled={guardando}
          className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Vista principal
// ---------------------------------------------------------------------------

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([])
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

    listarUsuarios({ signal: controlador.signal })
      .then(setUsuarios)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [recarga])

  const abrirFormulario = (usuario) => {
    setAviso(null)
    setEnEdicion(usuario)
  }

  const alGuardar = (mensaje) => {
    setEnEdicion(undefined)
    setAviso(mensaje)
    setCargando(true)
    setError(null)
    setRecarga((n) => n + 1)
  }

  return (
    <div className="rounded-xl bg-white shadow-md">
      {/* Encabezado de la tarjeta: título + alta de usuario. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">Usuarios</h2>
        {enEdicion === undefined && (
          <button
            type="button"
            onClick={() => abrirFormulario(null)}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95"
          >
            + Nuevo usuario
          </button>
        )}
      </div>

      {/* `key` reinicia el formulario al cambiar entre alta y distintos usuarios. */}
      {enEdicion !== undefined && (
        <FormularioUsuario
          key={enEdicion?.id ?? 'nuevo'}
          usuario={enEdicion}
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
      {cargando && <p className="px-6 py-4 text-sm text-slate-500">Cargando usuarios…</p>}
      {error && (
        <div className="m-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Contenedor con scroll horizontal para que la tabla no rompa el layout en pantallas angostas. */}
      {!error && (
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
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{usuario.nombreUsuario}</td>
                  <td className="px-4 py-3 text-slate-700">{usuario.correo}</td>
                  <td className="px-4 py-3 text-slate-700">{usuario.rol}</td>
                  <td className="px-4 py-3">
                    <EstadoUsuario activo={usuario.activo} />
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{usuario.tiempoSesion}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => abrirFormulario(usuario)}
                      className="cursor-pointer rounded-md border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                    >
                      Editar
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
