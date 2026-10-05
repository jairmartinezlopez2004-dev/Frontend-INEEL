/**
 * FormularioUnidad.jsx
 * ---------------------------------------------------------------------------
 * Formulario de alta / edición de una unidad de medida (solo Administrador).
 * Envía POST / PUT /Unidades.
 *
 * El estado se captura con la casilla "Activa" (edo: true activa, false
 * inactiva); no hay eliminación, la baja es desmarcarla. El backend exige el
 * símbolo al guardar, aunque haya unidades antiguas sin él.
 */
import { useState } from 'react'
import { LIMITES, crearUnidad, actualizarUnidad } from '../../services/unidadesService'
import { useValidacion } from '../../hooks/useValidacion'
import { validarTexto } from '../../utils/validaciones'
import CampoFormulario from '../common/CampoFormulario'
import { claseControl } from '../common/clasesFormulario'

// Valores iniciales del formulario de alta.
const FORM_NUEVO = { simbolo: '', nombre: '', activa: true }

// Reglas de cada campo, en el orden en que aparecen en pantalla.
const VALIDADORES = {
  simbolo: (v) => validarTexto(v, { nombre: 'El símbolo', maximo: LIMITES.simbolo }),
  nombre: (v) => validarTexto(v, { nombre: 'El nombre', maximo: LIMITES.nombre }),
}

// Props:
// - unidad: null para alta, u objeto unidad (de unidadesService) para editar.
// - onGuardado: callback con el mensaje de éxito tras guardar.
// - onCancelar: callback para cerrar el formulario sin guardar.
export default function FormularioUnidad({ unidad, onGuardado, onCancelar }) {
  const esEdicion = unidad !== null
  const [form, setForm] = useState(esEdicion ? unidad : FORM_NUEVO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null) // Error devuelto por el WebService.
  const { errorDe, ariaDe, validarAlEnviar } = useValidacion(form, VALIDADORES, 'unidad')

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
    try {
      if (esEdicion) {
        await actualizarUnidad(unidad.id, form)
        onGuardado('Unidad actualizada correctamente.')
      } else {
        await crearUnidad(form)
        onGuardado('Unidad registrada correctamente.')
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
        {esEdicion ? `Editar unidad: ${unidad.nombre}` : 'Nueva unidad'}
      </h3>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* <fieldset disabled> bloquea todos los controles mientras se guarda. */}
      <fieldset disabled={guardando} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CampoFormulario
          id="unidad-simbolo"
          etiqueta="Símbolo"
          error={errorDe('simbolo')}
          ayuda={`Obligatorio, máximo ${LIMITES.simbolo} caracteres (por ejemplo kWh).`}
        >
          <input
            type="text"
            maxLength={LIMITES.simbolo}
            placeholder="kWh"
            {...propsDe('simbolo', 'font-mono')}
          />
        </CampoFormulario>

        <CampoFormulario
          id="unidad-nombre"
          etiqueta="Nombre"
          error={errorDe('nombre')}
          ayuda={`Máximo ${LIMITES.nombre} caracteres.`}
        >
          <input
            type="text"
            maxLength={LIMITES.nombre}
            placeholder="Energía"
            {...propsDe('nombre')}
          />
        </CampoFormulario>

        <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <input
            type="checkbox"
            checked={form.activa}
            onChange={(e) => setForm((prev) => ({ ...prev, activa: e.target.checked }))}
            className="h-4 w-4 cursor-pointer rounded border-slate-300"
          />
          Activa (desmarcar para dar de baja)
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
