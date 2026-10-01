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
import { useValidacion } from '../../hooks/useValidacion'
import { validarTexto, validarCorreo, validarEntero } from '../../utils/validaciones'
import CampoFormulario from '../common/CampoFormulario'
import { claseControl } from '../common/clasesFormulario'

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

// Largo exacto de la contraseña (el backend exige mínimo 8; el máximo lo fija el formulario).
const LARGO_CONTRASENA = 8

// Rango de tiempo de sesión que acepta el backend (minutos).
const SESION_MIN = 1
const SESION_MAX = 1440

// Reglas de cada campo, en el orden en que aparecen en pantalla. La contraseña
// solo se valida en el alta y el tiempo de sesión solo en la edición.
function validadoresPara(esEdicion) {
  return {
    nombreUsuario: (v) => validarTexto(v, { nombre: 'El nombre' }),
    correo: validarCorreo,
    ...(esEdicion
      ? {
          tiempoSesion: (v) =>
            validarEntero(v, { nombre: 'El tiempo de sesión', minimo: SESION_MIN, maximo: SESION_MAX }),
        }
      : {
          contrasena: (v) =>
            validarTexto(v, {
              nombre: 'La contraseña',
              minimo: LARGO_CONTRASENA,
              maximo: LARGO_CONTRASENA,
              recortar: false,
              femenino: true,
            }),
        }),
  }
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
  // `tiempoSesion` se guarda como texto mientras se escribe y se convierte a número al enviar.
  const [form, setForm] = useState(
    esEdicion
      ? { ...usuario, contrasena: '', tiempoSesion: String(usuario.tiempoSesion) }
      : FORM_NUEVO,
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null) // Error devuelto por el WebService.
  const { errorDe, ariaDe, validarAlEnviar } = useValidacion(
    form,
    validadoresPara(esEdicion),
    'usuario',
  )

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
    // noValidate desactiva los globos del navegador: se valida con validadoresPara().
    <form noValidate onSubmit={guardar} className="border-b border-slate-200 bg-slate-50 px-6 py-5">
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

        {/* La contraseña solo se captura en el alta: el PUT del backend no la modifica. */}
        {!esEdicion && (
          <CampoFormulario
            id="usuario-contrasena"
            etiqueta="Contraseña"
            error={errorDe('contrasena')}
            ayuda={`Exactamente ${LARGO_CONTRASENA} caracteres.`}
          >
            <input
              type="password"
              maxLength={LARGO_CONTRASENA}
              autoComplete="new-password"
              {...propsDe('contrasena')}
            />
          </CampoFormulario>
        )}

        <CampoFormulario id="usuario-rol" etiqueta="Rol">
          <select
            id="usuario-rol"
            value={form.rol}
            onChange={actualizar('rol')}
            className={claseControl()}
          >
            {ROLES.map((rol) => (
              <option key={rol} value={rol}>
                {rol}
              </option>
            ))}
          </select>
        </CampoFormulario>

        {/* Estado y tiempo de sesión solo se pueden cambiar al editar
            (el alta del backend los fija en activo y 60 minutos). */}
        {esEdicion && (
          <>
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
