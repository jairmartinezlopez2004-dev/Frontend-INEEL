/**
 * FormularioPuntoIO.jsx
 * ---------------------------------------------------------------------------
 * Formulario de edición de un punto IO (solo SuperAdministrador). Envía
 * PUT /PuntosIO/{id}.
 *
 * El backend exige que el administrador vuelva a escribir su contraseña en
 * cada edición (`contrasenaActual`); si no coincide responde 401 y el mensaje
 * se muestra aquí, sin cerrar la sesión. La contraseña solo viaja en esa
 * petición: no se guarda en el estado de la aplicación tras enviar.
 *
 * El backend no ofrece alta de puntos IO, por eso este formulario solo edita.
 * La baja se hace desmarcando "Activo" (edo = false).
 */
import { useState } from 'react'
import { LIMITES, actualizarPuntoIO } from '../../../services/puntosIOService'
import { textoUnidad } from '../../../services/unidadesService'
import { useValidacion } from '../../../hooks/useValidacion'
import { validarTexto, validarEntero, validarEnteroConSigno, CONTRASENA_MAX } from '../../../utils/validaciones'
import CampoFormulario from '../../common/CampoFormulario'
import { claseControl } from '../../common/clasesFormulario'

// Mayor valor de un `int` de SQL Server (direcciones CCEC y Modbus).
const INT_MAX = 2147483647

// Campos numéricos: en el formulario se guardan como texto (lo que se escribe
// o el valor del <select>) y se convierten a Number al enviar.
const CAMPOS_NUMERICOS = ['idGF', 'idGE', 'idUnidad', 'dirCCEC', 'dirMB', 'limMin', 'limMax']

/**
 * Reglas de cada campo, en el orden en que aparecen en pantalla. Se arman con
 * el formulario completo porque el límite máximo se compara con el mínimo.
 */
function crearValidadores(form) {
  return {
    tag: (v) => validarTexto(v, { nombre: 'El tag', maximo: LIMITES.tag }),
    descripcion: (v) =>
      validarTexto(v, { nombre: 'La descripción', maximo: LIMITES.descripcion, femenino: true }),
    idGF: (v) => (v === '' ? 'Elige el grupo funcional.' : null),
    idGE: (v) => (v === '' ? 'Elige el grupo eléctrico.' : null),
    idUnidad: (v) => (v === '' ? 'Elige la unidad.' : null),
    tipoDato: (v) => validarTexto(v, { nombre: 'El tipo de dato', maximo: LIMITES.tipoDato }),
    tipoReg: (v) => validarTexto(v, { nombre: 'El tipo de registro', maximo: LIMITES.tipoReg }),
    dirCCEC: (v) => validarEntero(v, { nombre: 'La dirección CCEC', maximo: INT_MAX }),
    dirMB: (v) => validarEntero(v, { nombre: 'La dirección Modbus', maximo: INT_MAX }),
    limMin: (v) => validarEnteroConSigno(v, { nombre: 'El límite mínimo' }),
    limMax: (v) => {
      const error = validarEnteroConSigno(v, { nombre: 'El límite máximo' })
      if (error) return error
      const minimoValido = !validarEnteroConSigno(form.limMin, { nombre: '' })
      if (minimoValido && Number(v) < Number(form.limMin)) {
        return 'El límite máximo no puede ser menor que el mínimo.'
      }
      return null
    },
    contrasena: (v) =>
      v === '' ? 'Escribe tu contraseña para confirmar el cambio.' : null,
  }
}

/** Opciones de un <select> de catálogo; las inactivas se listan marcadas. */
function OpcionesCatalogo({ elementos, texto = (e) => e.nombre }) {
  return elementos.map((e) => (
    <option key={e.id} value={e.id}>
      {texto(e).trim() || `#${e.id} (sin nombre)`}
      {e.activo ? '' : ' (inactivo)'}
    </option>
  ))
}

// Props:
// - punto: objeto punto IO (de puntosIOService) a editar.
// - gruposFuncionales / gruposElectricos / unidades: catálogos para los selectores.
// - onGuardado: callback con el mensaje de éxito tras guardar.
// - onCancelar: callback para cerrar el formulario sin guardar.
export default function FormularioPuntoIO({
  punto,
  gruposFuncionales,
  gruposElectricos,
  unidades,
  onGuardado,
  onCancelar,
}) {
  const [form, setForm] = useState(() => ({
    ...punto,
    ...Object.fromEntries(CAMPOS_NUMERICOS.map((c) => [c, String(punto[c] ?? '')])),
    contrasena: '',
  }))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null) // Error devuelto por el WebService.
  const { errorDe, ariaDe, validarAlEnviar } = useValidacion(form, crearValidadores(form), 'puntoIO')

  // Props comunes de cada input: valor, eventos, estilos y accesibilidad.
  const propsDe = (campo, claseExtra = '') => ({
    ...ariaDe(campo),
    value: form[campo],
    onChange: (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value })),
    className: claseControl(Boolean(errorDe(campo)), claseExtra),
  })

  // Las unidades usan `activa`; se adaptan a la forma { id, nombre, activo } de los grupos.
  const opcionesUnidad = unidades.map((u) => ({ id: u.id, nombre: textoUnidad(u), activo: u.activa }))

  const guardar = async (e) => {
    e.preventDefault()
    // Si hay errores, se muestran todos y se enfoca el primero; no se llama al WebService.
    if (!validarAlEnviar()) return

    setGuardando(true)
    setError(null)
    const { contrasena, ...campos } = form
    const datos = {
      ...campos,
      ...Object.fromEntries(CAMPOS_NUMERICOS.map((c) => [c, Number(form[c])])),
    }
    try {
      await actualizarPuntoIO(punto.id, datos, contrasena)
      onGuardado(`Punto IO ${punto.tag} actualizado correctamente.`)
    } catch (err) {
      setError(err.message)
      // Se borra la contraseña para que se vuelva a escribir (por ejemplo, tras un 401).
      setForm((prev) => ({ ...prev, contrasena: '' }))
      setGuardando(false)
    }
  }

  return (
    // noValidate desactiva los globos del navegador: se valida con crearValidadores.
    <form noValidate onSubmit={guardar} className="border-b border-slate-200 bg-slate-50 px-6 py-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-800">
        Editar punto IO: {punto.tag}
      </h3>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* <fieldset disabled> bloquea todos los controles mientras se guarda. */}
      <fieldset disabled={guardando} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CampoFormulario
          id="puntoIO-tag"
          etiqueta="Tag"
          error={errorDe('tag')}
          ayuda={`Máximo ${LIMITES.tag} caracteres.`}
        >
          <input type="text" maxLength={LIMITES.tag} {...propsDe('tag', 'font-mono')} />
        </CampoFormulario>

        <div className="md:col-span-1 lg:col-span-2">
          <CampoFormulario
            id="puntoIO-descripcion"
            etiqueta="Descripción"
            error={errorDe('descripcion')}
            ayuda={`Máximo ${LIMITES.descripcion} caracteres.`}
          >
            <input type="text" maxLength={LIMITES.descripcion} {...propsDe('descripcion')} />
          </CampoFormulario>
        </div>

        <CampoFormulario id="puntoIO-idGF" etiqueta="Grupo funcional" error={errorDe('idGF')}>
          <select {...propsDe('idGF')}>
            <option value="">Elige un grupo…</option>
            <OpcionesCatalogo elementos={gruposFuncionales} />
          </select>
        </CampoFormulario>

        <CampoFormulario id="puntoIO-idGE" etiqueta="Grupo eléctrico" error={errorDe('idGE')}>
          <select {...propsDe('idGE')}>
            <option value="">Elige un grupo…</option>
            <OpcionesCatalogo elementos={gruposElectricos} />
          </select>
        </CampoFormulario>

        <CampoFormulario id="puntoIO-idUnidad" etiqueta="Unidad" error={errorDe('idUnidad')}>
          <select {...propsDe('idUnidad')}>
            <option value="">Elige una unidad…</option>
            <OpcionesCatalogo elementos={opcionesUnidad} />
          </select>
        </CampoFormulario>

        <CampoFormulario
          id="puntoIO-tipoDato"
          etiqueta="Tipo de dato"
          error={errorDe('tipoDato')}
          ayuda={`Máximo ${LIMITES.tipoDato} caracteres (por ejemplo int).`}
        >
          <input type="text" maxLength={LIMITES.tipoDato} {...propsDe('tipoDato', 'font-mono')} />
        </CampoFormulario>

        <CampoFormulario
          id="puntoIO-tipoReg"
          etiqueta="Tipo de registro"
          error={errorDe('tipoReg')}
          ayuda={`Máximo ${LIMITES.tipoReg} caracteres (por ejemplo HR).`}
        >
          <input type="text" maxLength={LIMITES.tipoReg} {...propsDe('tipoReg', 'font-mono')} />
        </CampoFormulario>

        {/* Los números son type="text" para que, si se escribe una letra, se vea el mensaje propio. */}
        <CampoFormulario id="puntoIO-dirCCEC" etiqueta="Dirección CCEC" error={errorDe('dirCCEC')}>
          <input type="text" inputMode="numeric" {...propsDe('dirCCEC', 'font-mono')} />
        </CampoFormulario>

        <CampoFormulario id="puntoIO-dirMB" etiqueta="Dirección Modbus" error={errorDe('dirMB')}>
          <input type="text" inputMode="numeric" {...propsDe('dirMB', 'font-mono')} />
        </CampoFormulario>

        <CampoFormulario id="puntoIO-limMin" etiqueta="Límite mínimo" error={errorDe('limMin')}>
          <input type="text" inputMode="numeric" {...propsDe('limMin', 'font-mono')} />
        </CampoFormulario>

        <CampoFormulario id="puntoIO-limMax" etiqueta="Límite máximo" error={errorDe('limMax')}>
          <input type="text" inputMode="numeric" {...propsDe('limMax', 'font-mono')} />
        </CampoFormulario>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
            className="h-4 w-4 cursor-pointer rounded border-slate-300"
          />
          Activo (desmarcar para dar de baja)
        </label>
      </fieldset>

      {/* Confirmación con contraseña que exige el backend para editar puntos IO. */}
      <fieldset disabled={guardando} className="mt-5 border-t border-slate-200 pt-4 md:max-w-sm">
        <CampoFormulario
          id="puntoIO-contrasena"
          etiqueta="Tu contraseña de administrador"
          error={errorDe('contrasena')}
          ayuda="Por seguridad, cada cambio a un punto IO se confirma con tu contraseña."
        >
          <input type="password" maxLength={CONTRASENA_MAX} autoComplete="current-password" {...propsDe('contrasena')} />
        </CampoFormulario>
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
