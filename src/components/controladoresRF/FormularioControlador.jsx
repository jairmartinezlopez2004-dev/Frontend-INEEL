/**
 * FormularioControlador.jsx
 * ---------------------------------------------------------------------------
 * Formulario de alta / edición de un controlador RF (solo Administrador).
 * Se usa desde la lista de Controladores RF (alta y edición) y desde el
 * detalle de un controlador (edición). Envía POST / PUT /ControladorRF.
 *
 * El estado (`edo`) es un número: el catálogo de significados (activo,
 * mantenimiento, inactivo) aún no lo define el backend, así que se captura
 * tal cual.
 */
import { useState } from 'react'
import {
  LIMITES,
  crearControladorRF,
  actualizarControladorRF,
} from '../../services/controladoresRFService'
import { useValidacion } from '../../hooks/useValidacion'
import { validarTexto, validarIP, validarEntero } from '../../utils/validaciones'
import CampoFormulario from '../common/CampoFormulario'
import { claseControl } from '../common/clasesFormulario'

// Valores iniciales del formulario de alta. `edo` se guarda como texto mientras
// se escribe (para distinguir "vacío" de 0) y se convierte a número al enviar.
const FORM_NUEVO = { numSerie: '', dirIP: '', nombre: '', edo: '1' }

// Reglas de cada campo, en el orden en que aparecen en pantalla.
const VALIDADORES = {
  nombre: (v) => validarTexto(v, { nombre: 'El nombre', maximo: LIMITES.nombre }),
  numSerie: (v) => validarTexto(v, { nombre: 'El número de serie', maximo: LIMITES.numSerie }),
  dirIP: validarIP,
  edo: (v) => validarEntero(v, { nombre: 'El estado' }),
}

// Props:
// - controlador: null para alta, u objeto controlador (de controladoresRFService) para editar.
// - onGuardado: callback con el mensaje de éxito tras guardar.
// - onCancelar: callback para cerrar el formulario sin guardar.
// - claseFondo: (opcional) clases de fondo y borde, para distinguir de qué sección es el formulario.
export default function FormularioControlador({
  controlador,
  onGuardado,
  onCancelar,
  claseFondo = 'border-slate-200 bg-slate-50',
}) {
  const esEdicion = controlador !== null
  const [form, setForm] = useState(
    esEdicion ? { ...controlador, edo: String(controlador.edo) } : FORM_NUEVO,
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null) // Error devuelto por el WebService.
  const { errorDe, ariaDe, validarAlEnviar } = useValidacion(form, VALIDADORES, 'ctrlrf')

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
    const datos = { ...form, edo: Number(form.edo) }
    try {
      if (esEdicion) {
        await actualizarControladorRF(controlador.id, datos)
        onGuardado('Controlador RF actualizado correctamente.')
      } else {
        await crearControladorRF(datos)
        onGuardado('Controlador RF registrado correctamente.')
      }
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    // noValidate desactiva los globos del navegador: se valida con VALIDADORES.
    <form noValidate onSubmit={guardar} className={`border-b px-6 py-5 ${claseFondo}`}>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-800">
        {esEdicion ? `Editar controlador: ${controlador.nombre}` : 'Nuevo controlador RF'}
      </h3>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* <fieldset disabled> bloquea todos los controles mientras se guarda. */}
      <fieldset disabled={guardando} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CampoFormulario
          id="ctrlrf-nombre"
          etiqueta="Nombre"
          error={errorDe('nombre')}
          ayuda={`Máximo ${LIMITES.nombre} caracteres.`}
        >
          <input type="text" maxLength={LIMITES.nombre} {...propsDe('nombre')} />
        </CampoFormulario>

        <CampoFormulario
          id="ctrlrf-numSerie"
          etiqueta="Número de serie"
          error={errorDe('numSerie')}
          ayuda={`Máximo ${LIMITES.numSerie} caracteres.`}
        >
          <input
            type="text"
            maxLength={LIMITES.numSerie}
            placeholder="RF-0001"
            {...propsDe('numSerie', 'font-mono')}
          />
        </CampoFormulario>

        <CampoFormulario
          id="ctrlrf-dirIP"
          etiqueta="Dirección IP"
          error={errorDe('dirIP')}
          ayuda="Formato IPv4: cuatro números de 0 a 255 separados por punto."
        >
          <input
            type="text"
            inputMode="decimal"
            maxLength={LIMITES.dirIP}
            placeholder="192.168.1.20"
            {...propsDe('dirIP', 'font-mono')}
          />
        </CampoFormulario>

        {/* El catálogo de estados aún no está definido en el backend: se captura el número.
            Es type="text" para que, si se escribe una letra, se vea el mensaje propio. */}
        <CampoFormulario
          id="ctrlrf-edo"
          etiqueta="Estado (número)"
          error={errorDe('edo')}
          ayuda="Número entero (0, 1, 2…)."
        >
          <input type="text" inputMode="numeric" {...propsDe('edo')} />
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
