/**
 * GestionUsuarios.jsx
 * ---------------------------------------------------------------------------
 * Módulo "Usuarios": catálogo de usuarios del sistema con edición.
 * No hay alta desde aquí: las cuentas nuevas se crean con el registro de la
 * pantalla de acceso (Registro.jsx, rol Usuario) y aquí solo se editan.
 *
 * Rol en el sistema:
 * - Solo se muestra al Administrador (App.jsx y Sidebar.jsx ocultan la opción
 *   al Usuario Normal; además el backend rechaza con 401/403 a quien no lo sea).
 * - Lista los usuarios (GET /Users) y permite:
 *     · "Editar": correo, nombre, rol, estado activo/inactivo y tiempo de
 *       sesión (PUT /Users/{id}). La contraseña no se modifica por aquí, y
 *       la "baja" de un usuario se hace desmarcando "Activo".
 * - Las cuentas de SuperAdministrador solo las edita otro SuperAdministrador
 *   (al Administrador no le aparece "Editar" en esas filas).
 * - Mientras el formulario está abierto se oculta la tabla, para que solo se
 *   vea la configuración del usuario que se edita.
 */
import { useEffect, useState } from 'react'
import { ROLES, listarUsuarios, actualizarUsuario } from '../../services/usuariosService'
import { useValidacion } from '../../hooks/useValidacion'
import { validarTexto, validarCorreo, validarEntero } from '../../utils/validaciones'
import CampoFormulario from '../common/CampoFormulario'
import { claseControl } from '../common/clasesFormulario'
import { useFiltroTabla } from '../../hooks/useFiltroTabla'
import BuscadorTabla from '../common/BuscadorTabla'

// Encabezados de la tabla (se mantienen en un arreglo para no repetir markup).
const COLUMNAS = ['Nombre', 'Correo', 'Rol', 'Estado', 'Sesión (min)', '']

// Rango de tiempo de sesión que acepta el backend (minutos).
const SESION_MIN = 1
const SESION_MAX = 1440

// Reglas de cada campo del formulario de edición, en el orden en que aparecen en pantalla.
const VALIDADORES_USUARIO = {
  nombreUsuario: (v) => validarTexto(v, { nombre: 'El nombre' }),
  correo: validarCorreo,
  tiempoSesion: (v) =>
    validarEntero(v, { nombre: 'El tiempo de sesión', minimo: SESION_MIN, maximo: SESION_MAX }),
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
// Formulario de edición
// ---------------------------------------------------------------------------

// Props:
// - usuario: objeto usuario (de usuariosService) que se edita.
// - onGuardado: callback con el mensaje de éxito tras guardar.
// - onCancelar: callback para cerrar el formulario sin guardar.
// - esSuperAdmin: si es true se puede asignar el rol SuperAdministrador.
function FormularioUsuario({ usuario, onGuardado, onCancelar, esSuperAdmin }) {
  // Solo un SuperAdministrador asigna ese rol (un Administrador tampoco puede
  // abrir la edición de un SuperAdministrador; ver puedeEditar).
  const rolesDisponibles = ROLES.filter((rol) => rol !== 'SuperAdministrador' || esSuperAdmin)
  // `tiempoSesion` se guarda como texto mientras se escribe y se convierte a número al enviar.
  const [form, setForm] = useState({ ...usuario, tiempoSesion: String(usuario.tiempoSesion) })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null) // Error devuelto por el WebService.
  const { errorDe, ariaDe, validarAlEnviar } = useValidacion(form, VALIDADORES_USUARIO, 'usuario')

  // Genera un manejador onChange para el campo indicado (texto, select o checkbox).
  const actualizar = (campo) => (e) => {
    const { type, checked, value } = e.target
    setForm((prev) => ({ ...prev, [campo]: type === 'checkbox' ? checked : value }))
  }

  // Props comunes de los inputs validados: valor, eventos, estilos y accesibilidad.
  const propsDe = (campo) => ({
    ...ariaDe(campo),
    value: form[campo],
    onChange: actualizar(campo),
    className: claseControl(Boolean(errorDe(campo))),
  })

  const guardar = async (e) => {
    e.preventDefault()
    // Si hay errores, se muestran todos y se enfoca el primero; no se llama al WebService.
    if (!validarAlEnviar()) return

    setGuardando(true)
    setError(null)
    try {
      const datos = {
        ...form,
        correo: form.correo.trim(),
        nombreUsuario: form.nombreUsuario.trim(),
        tiempoSesion: Number(form.tiempoSesion),
      }
      await actualizarUsuario(usuario.id, datos)
      onGuardado('Usuario actualizado correctamente.')
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    // noValidate desactiva los globos del navegador: se valida con VALIDADORES_USUARIO.
    <form noValidate onSubmit={guardar} className="bg-slate-50 px-6 py-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-800">
        Editar usuario: {usuario.nombreUsuario}
      </h3>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* <fieldset disabled> bloquea todos los controles mientras se guarda. */}
      <fieldset disabled={guardando} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CampoFormulario id="usuario-nombreUsuario" etiqueta="Nombre" error={errorDe('nombreUsuario')}>
          <input type="text" {...propsDe('nombreUsuario')} />
        </CampoFormulario>

        <CampoFormulario id="usuario-correo" etiqueta="Correo" error={errorDe('correo')}>
          <input
            type="email"
            autoComplete="off"
            placeholder="usuario@dominio.com"
            {...propsDe('correo')}
          />
        </CampoFormulario>

        <CampoFormulario id="usuario-rol" etiqueta="Rol">
          <select
            id="usuario-rol"
            value={form.rol}
            onChange={actualizar('rol')}
            className={claseControl()}
          >
            {rolesDisponibles.map((rol) => (
              <option key={rol} value={rol}>
                {rol}
              </option>
            ))}
          </select>
        </CampoFormulario>

        {/* El backend acepta entre 1 y 1440 minutos (24 h). Es type="text" para
            que, si se escribe una letra, se vea el mensaje propio. */}
        <CampoFormulario
          id="usuario-tiempoSesion"
          etiqueta="Tiempo de sesión (minutos)"
          error={errorDe('tiempoSesion')}
          ayuda={`Entre ${SESION_MIN} y ${SESION_MAX} minutos (24 horas).`}
        >
          <input type="text" inputMode="numeric" {...propsDe('tiempoSesion')} />
        </CampoFormulario>

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

// Props:
// - esSuperAdmin: si es true el formulario ofrece el rol SuperAdministrador.
export default function GestionUsuarios({ esSuperAdmin }) {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null) // Mensaje de éxito tras guardar.
  // Usuario que se edita (null = formulario cerrado).
  const [enEdicion, setEnEdicion] = useState(null)
  // Se incrementa para volver a pedir la lista después de guardar.
  const [recarga, setRecarga] = useState(0)

  // Buscador de la tabla: filtra por las columnas visibles (el estado por su texto).
  const filtro = useFiltroTabla(usuarios, (u) => [
    u.nombreUsuario,
    u.correo,
    u.rol,
    u.activo ? 'Activo' : 'Inactivo',
  ])

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

  // Un Administrador no edita cuentas de SuperAdministrador: podría quitarle
  // el rol, desactivarlo o cambiarle el correo y dejarlo fuera del sistema.
  const puedeEditar = (usuario) => esSuperAdmin || usuario.rol !== 'SuperAdministrador'

  const abrirFormulario = (usuario) => {
    setAviso(null)
    setEnEdicion(usuario)
  }

  // Con un formulario abierto la tabla se oculta y solo queda la configuración.
  const formularioAbierto = enEdicion !== null

  const alGuardar = (mensaje) => {
    setEnEdicion(null)
    setAviso(mensaje)
    setCargando(true)
    setError(null)
    setRecarga((n) => n + 1)
  }

  return (
    <div className="rounded-xl bg-white shadow-md">
      {/* Encabezado de la tarjeta. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">Usuarios</h2>
      </div>

      {/* `key` reinicia el formulario al cambiar de usuario. */}
      {formularioAbierto && (
        <FormularioUsuario
          key={enEdicion.id}
          usuario={enEdicion}
          onGuardado={alGuardar}
          onCancelar={() => setEnEdicion(null)}
          esSuperAdmin={esSuperAdmin}
        />
      )}

      {/* Mensajes de estado. */}
      {aviso && (
        <div className="mx-6 mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {aviso}
        </div>
      )}
      {!formularioAbierto && cargando && <p className="px-6 py-4 text-sm text-slate-500">Cargando usuarios…</p>}
      {error && (
        <div className="m-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Buscador sobre la tabla (solo si hay registros que filtrar). */}
      {!formularioAbierto && !error && usuarios.length > 0 && (
        <BuscadorTabla
          valor={filtro.texto}
          onCambio={filtro.setTexto}
          total={usuarios.length}
          visibles={filtro.filtradas.length}
          placeholder="Buscar por nombre, correo, rol o estado…"
        />
      )}

      {/* Contenedor con scroll horizontal para que la tabla no rompa el layout en pantallas angostas. */}
      {!formularioAbierto && !error && (
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
              {filtro.filtradas.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{usuario.nombreUsuario}</td>
                  <td className="px-4 py-3 text-slate-700">{usuario.correo}</td>
                  <td className="px-4 py-3 text-slate-700">{usuario.rol}</td>
                  <td className="px-4 py-3">
                    <EstadoUsuario activo={usuario.activo} />
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{usuario.tiempoSesion}</td>
                  <td className="px-4 py-3 text-right">
                    {puedeEditar(usuario) && (
                      <button
                        type="button"
                        onClick={() => abrirFormulario(usuario)}
                        className="cursor-pointer rounded-md border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
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
              Ningún usuario coincide con “{filtro.texto.trim()}”.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
