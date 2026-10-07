/**
 * FormularioGrupoIO.jsx
 * ---------------------------------------------------------------------------
 * Formulario de alta / edición de un grupo IO, funcional o eléctrico (solo
 * Administrador). Envía POST / PUT /IO_GrupoFuncional o /IO_GrupoElectrico.
 *
 * El estado se captura con la casilla "Activo" (edo: true activo, false
 * inactivo); no hay eliminación, la baja es desmarcarla.
 */
import { useState } from 'react'
import { LIMITES, TIPOS_GRUPO, crearGrupo, actualizarGrupo } from '../../services/gruposIOService'
import { useValidacion } from '../../hooks/useValidacion'
import { validarTexto } from '../../utils/validaciones'
import CampoFormulario from '../common/CampoFormulario'
import { claseControl } from '../common/clasesFormulario'

// Valores iniciales del formulario de alta.
const FORM_NUEVO = { nombre: '', activo: true }

// Reglas de cada campo.
const VALIDADORES = {
  nombre: (v) => validarTexto(v, { nombre: 'El nombre', maximo: LIMITES.nombre }),
}

// Props:
// - tipo: 'funcional' o 'electrico' (ver TIPOS_GRUPO).
// - grupo: null para alta, u objeto grupo (de gruposIOService) para editar.
// - onGuardado: callback con el mensaje de éxito tras guardar.
// - onCancelar: callback para cerrar el formulario sin guardar.
export default function FormularioGrupoIO({ tipo, grupo, onGuardado, onCancelar }) {
  const { singular, ejemplo } = TIPOS_GRUPO[tipo]
  const esEdicion = grupo !== null
  const [form, setForm] = useState(esEdicion ? grupo : FORM_NUEVO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null) // Error devuelto por el WebService.
  const { errorDe, ariaDe, validarAlEnviar } = useValidacion(form, VALIDADORES, `grupo-${tipo}`)

  const guardar = async (e) => {
    e.preventDefault()
    // Si hay errores, se muestran todos y se enfoca el primero; no se llama al WebService.
    if (!validarAlEnviar()) return

    setGuardando(true)
    setError(null)
    try {
      // Mensaje con la primera letra en mayúscula: "Grupo funcional actualizado…".
      const sujeto = singular.charAt(0).toUpperCase() + singular.slice(1)
      if (esEdicion) {
        await actualizarGrupo(tipo, grupo.id, form)
        onGuardado(`${sujeto} actualizado correctamente.`)
      } else {
        await crearGrupo(tipo, form)
        onGuardado(`${sujeto} registrado correctamente.`)
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
        {esEdicion ? `Editar ${singular}: ${grupo.nombre || `#${grupo.id}`}` : `Nuevo ${singular}`}
      </h3>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* <fieldset disabled> bloquea todos los controles mientras se guarda. */}
      <fieldset disabled={guardando} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CampoFormulario
          id={`grupo-${tipo}-nombre`}
          etiqueta="Nombre"
          error={errorDe('nombre')}
          ayuda={`Obligatorio, máximo ${LIMITES.nombre} caracteres.`}
        >
          <input
            type="text"
            maxLength={LIMITES.nombre}
            placeholder={ejemplo}
            {...ariaDe('nombre')}
            value={form.nombre}
            onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
            className={claseControl(Boolean(errorDe('nombre')))}
          />
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
