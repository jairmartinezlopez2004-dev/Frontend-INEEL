/**
 * CuentasPendientes.jsx
 * ---------------------------------------------------------------------------
 * Aviso para el administrador en el módulo "Usuarios": recuadro debajo de la
 * tabla con las cuentas que todavía no pueden iniciar sesión, y un botón
 * "Activar" en cada una.
 *
 * Por qué existe: una cuenta recién registrada queda inactiva (edo = false)
 * hasta que un Administrador o SuperAdministrador la activa. Este recuadro
 * hace visible que hay cuentas esperando, sin tener que buscarlas en la tabla.
 *
 * Qué cuenta como pendiente: toda cuenta inactiva. El backend no distingue
 * entre una cuenta nueva sin aprobar y una que un administrador dio de baja
 * (las dos tienen edo = false), así que el recuadro muestra ambas.
 *
 * Activar usa el mismo PUT /Users/{id} del formulario de edición, con los
 * datos actuales de la cuenta y `edo: true`. Un Administrador no puede activar
 * una cuenta de SuperAdministrador (misma regla que "Editar").
 */
import { useState } from 'react'
import { BellRing, UserCheck } from 'lucide-react'
import { actualizarUsuario } from '../../../services/usuariosService'
import { BotonSecundario } from '../../common/Botones'

// Props:
// - usuarios: lista completa de usuarios (de usuariosService).
// - puedeEditar: función (usuario) => boolean; si es false no se ofrece "Activar".
// - onActivada: callback con el mensaje de éxito; la vista recarga la lista.
export default function CuentasPendientes({ usuarios, puedeEditar, onActivada }) {
  const [activandoId, setActivandoId] = useState(null) // Cuenta que se está activando.
  const [error, setError] = useState(null) // Error devuelto por el WebService.

  const pendientes = usuarios.filter((u) => !u.activo)
  if (pendientes.length === 0) return null

  const activar = async (usuario) => {
    setActivandoId(usuario.id)
    setError(null)
    try {
      await actualizarUsuario(usuario.id, { ...usuario, activo: true })
      onActivada(`Cuenta de ${usuario.nombreUsuario} activada. Ya puede iniciar sesión.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setActivandoId(null)
    }
  }

  const titulo =
    pendientes.length === 1
      ? 'Hay 1 cuenta pendiente por activar'
      : `Hay ${pendientes.length} cuentas pendientes por activar`

  return (
    <section
      aria-labelledby="cuentas-pendientes-titulo"
      className="m-6 rounded-lg border border-amber-200 bg-amber-50 p-4"
    >
      <div className="flex items-start gap-3">
        <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
        <div>
          <h3 id="cuentas-pendientes-titulo" className="text-sm font-semibold text-amber-900">
            {titulo}
          </h3>
          <p className="mt-0.5 text-xs text-amber-800">
            No pueden iniciar sesión hasta que las actives. Incluye registros nuevos y cuentas
            dadas de baja.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Con muchas cuentas la lista se desplaza en lugar de alargar la página. */}
      <ul className="mt-3 max-h-64 divide-y divide-amber-200/70 overflow-y-auto rounded-md border border-amber-200 bg-white">
        {pendientes.map((usuario) => (
          <li
            key={usuario.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{usuario.nombreUsuario}</p>
              <p className="truncate text-xs text-slate-600">
                {usuario.correo} · {usuario.rol}
              </p>
            </div>
            {puedeEditar(usuario) ? (
              <BotonSecundario
                Icono={UserCheck}
                onClick={() => activar(usuario)}
                disabled={activandoId !== null}
                aria-label={`Activar la cuenta de ${usuario.nombreUsuario}`}
              >
                {activandoId === usuario.id ? 'Activando…' : 'Activar'}
              </BotonSecundario>
            ) : (
              <span className="text-xs text-slate-500">Solo un SuperAdministrador puede activarla</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
