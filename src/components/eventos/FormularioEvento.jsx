/**
 * FormularioEvento.jsx
 * ---------------------------------------------------------------------------
 * Formulario de alta / edición de un evento configurado (solo Administrador).
 * Envía POST / PUT /EventosConfig.
 *
 * El estado se captura con la casilla "Activo" (edo: true activo, false
 * inactivo); no hay eliminación, la baja es desmarcarla. La unidad se elige
 * del catálogo de unidades que GestionEventos carga de GET /Unidades.
 */
import { useState } from 'react'
import { LIMITES, crearEvento, actualizarEvento } from '../../services/eventosConfigService'
import { textoUnidad } from '../../services/unidadesService'
import { useValidacion } from '../../hooks/useValidacion'
import { validarTexto, validarEntero } from '../../utils/validaciones'
import CampoFormulario from '../common/CampoFormulario'
import { claseControl } from '../common/clasesFormulario'

// Valores iniciales del formulario de alta. Los números se guardan como texto
// (lo que se escribe o el valor del <select>) y se convierten al enviar.
const FORM_NUEVO = { descripcion: '', numEvento: '', activo: true, idUnidad: '' }

// Reglas de cada campo, en el orden en que aparecen en pantalla.
const VALIDADORES = {
  descripcion: (v) =>
    validarTexto(v, { nombre: 'La descripción', maximo: LIMITES.descripcion, femenino: true }),
  numEvento: (v) => validarEntero(v, { nombre: 'El número de evento' }),
  idUnidad: (v) => (v === '' ? 'Elige la unidad del evento.' : null),
}

// Props:
// - evento: null para alta, u objeto evento (de eventosConfigService) para editar.
// - unidades: catálogo de unidades (de unidadesService) para el selector.
// - onGuardado: callback con el mensaje de éxito tras guardar.
// - onCancelar: callback para cerrar el formulario sin guardar.
export default function FormularioEvento({ evento, unidades, onGuardado, onCancelar }) {
  const esEdicion = evento !== null
  const [form, setForm] = useState(
    esEdicion
      ? { ...evento, numEvento: String(evento.numEvento), idUnidad: String(evento.idUnidad) }
      : FORM_NUEVO,
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null) // Error devuelto por el WebService.
  const { errorDe, ariaDe, validarAlEnviar } = useValidacion(form, VALIDADORES, 'evento')

  // Props comunes de cada input: valor, eventos, estilos y accesibilidad.
  const propsDe = (campo, claseExtra = '') => ({
    ...ariaDe(campo),
    value: form[campo],
    onChange: (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value })),
    className: claseControl(Boolean(errorDe(campo)), claseExtra),
  })

  const guardar = async (e) => {
    e.preventDefault()
    // Si hay errores, se muestran todos y se enfoca el primero; no se llama al WebService.
    if (!validarAlEnviar()) return

    setGuardando(true)
    setError(null)
    const datos = { ...form, numEvento: Number(form.numEvento), idUnidad: Number(form.idUnidad) }
    try {
      if (esEdicion) {
        await actualizarEvento(evento.id, datos)
        onGuardado('Evento actualizado correctamente.')
      } else {
        await crearEvento(datos)
        onGuardado('Evento registrado correctamente.')
      }
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    // noValidate desactiva los globos del navegador: se valida con VALIDADORES.
    <form noValidate onSubmit={guardar} className="border-b border-slate-200 bg-slate-50 px-6 py-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-800">
        {esEdicion ? `Editar evento: ${evento.descripcion}` : 'Nuevo evento'}
      </h3>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* <fieldset disabled> bloquea todos los controles mientras se guarda. */}
      <fieldset disabled={guardando} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <CampoFormulario
            id="evento-descripcion"
            etiqueta="Descripción"
            error={errorDe('descripcion')}
            ayuda={`Máximo ${LIMITES.descripcion} caracteres.`}
          >
            <input type="text" maxLength={LIMITES.descripcion} {...propsDe('descripcion')} />
          </CampoFormulario>
        </div>

        {/* Es type="text" para que, si se escribe una letra, se vea el mensaje propio. */}
        <CampoFormulario
          id="evento-numEvento"
          etiqueta="Número de evento"
          error={errorDe('numEvento')}
          ayuda="Número entero que identifica el tipo de evento."
        >
          <input type="text" inputMode="numeric" {...propsDe('numEvento', 'font-mono')} />
        </CampoFormulario>

        {/* Las unidades inactivas se listan marcadas, para no ocultar la que ya
            tenga asignada un evento existente. */}
        <CampoFormulario id="evento-idUnidad" etiqueta="Unidad" error={errorDe('idUnidad')}>
          <select {...propsDe('idUnidad')}>
            <option value="">Elige una unidad…</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {textoUnidad(u)}
                {u.activa ? '' : ' (inactiva)'}
              </option>
            ))}
          </select>
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
