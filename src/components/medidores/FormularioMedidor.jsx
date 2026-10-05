/**
 * FormularioMedidor.jsx
 * ---------------------------------------------------------------------------
 * Formulario de alta / edición de un medidor QP (solo Administrador).
 *
 * Rol en el sistema:
 * - Se abre con "+ Nuevo medidor" o "Editar" desde el detalle de un
 *   controlador (DetalleControlador).
 * - Envía POST /MedidoresQP (alta) o PUT /MedidoresQP/{id} (edición).
 * - Cada medidor pertenece a un controlador RF, que se elige de la lista de
 *   controladores existentes; el estado se elige del catálogo del backend.
 * - Valida con reglas propias (utils/validaciones.js) antes de enviar; los
 *   errores del backend (400) se muestran arriba del formulario.
 */
import { useState } from 'react'
import {
  LIMITES,
  ESTADOS_EQUIPO,
  crearMedidor,
  actualizarMedidor,
} from '../../services/medidoresService'
import { useValidacion } from '../../hooks/useValidacion'
import { validarTexto, validarIP, validarEntero } from '../../utils/validaciones'
import CampoFormulario from '../common/CampoFormulario'
import { claseControl } from '../common/clasesFormulario'

// Reglas de cada campo, en el orden en que aparecen en pantalla.
// Los valores numéricos se guardan como texto mientras se escribe (para
// distinguir "vacío" de 0) y se convierten a número al enviar.
const VALIDADORES = {
  idCtrlRF: (v) => (v === '' ? 'Elige el controlador RF al que pertenece el medidor.' : null),
  descripcion: (v) =>
    validarTexto(v, { nombre: 'La descripción', maximo: LIMITES.descripcion, femenino: true }),
  dirRed: (v) => validarEntero(v, { nombre: 'La dirección de red', minimo: 0 }),
  dirRF: (v) => validarTexto(v, { nombre: 'La dirección RF', maximo: LIMITES.dirRF, femenino: true }),
  dirIP: validarIP,
  edo: (v) => (v === '' ? 'Elige el estado del medidor.' : null),
}

// Props:
// - medidor: null para alta, u objeto medidor (de medidoresService) para editar.
// - controladores: lista [{ id, nombre }] para elegir el controlador RF.
// - idCtrlRFInicial: (opcional) controlador preseleccionado en el alta, p. ej. al
//   dar de alta desde el detalle de un controlador.
// - onGuardado: callback con el mensaje de éxito tras guardar.
// - onCancelar: callback para cerrar el formulario sin guardar.
// - claseFondo: (opcional) clases de fondo y borde, para distinguir de qué sección es el formulario.
export default function FormularioMedidor({
  medidor,
  controladores,
  idCtrlRFInicial,
  onGuardado,
  onCancelar,
  claseFondo = 'border-slate-200 bg-slate-50',
}) {
  const esEdicion = medidor !== null
  const [form, setForm] = useState(() =>
    esEdicion
      ? {
          idCtrlRF: String(medidor.idCtrlRF),
          descripcion: medidor.descripcion,
          dirRed: String(medidor.dirRed),
          dirRF: medidor.dirRF,
          dirIP: medidor.dirIP,
          edo: String(medidor.edo),
        }
      : {
          // Se preselecciona el controlador indicado o, si solo hay uno, ese;
          // si no, el usuario elige.
          idCtrlRF:
            idCtrlRFInicial !== undefined
              ? String(idCtrlRFInicial)
              : controladores.length === 1
                ? String(controladores[0].id)
                : '',
          descripcion: '',
          dirRed: '',
          dirRF: '',
          dirIP: '',
          edo: '10',
        },
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null) // Error devuelto por el WebService.
  const { errorDe, ariaDe, validarAlEnviar } = useValidacion(form, VALIDADORES, 'medidor')

  // Props comunes de cada control: valor, eventos, estilos y accesibilidad.
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
    const datos = {
      ...form,
      idCtrlRF: Number(form.idCtrlRF),
      dirRed: Number(form.dirRed),
      edo: Number(form.edo),
    }
    try {
      if (esEdicion) {
        await actualizarMedidor(medidor.id, datos)
        onGuardado('Medidor actualizado correctamente.')
      } else {
        await crearMedidor(datos)
        onGuardado('Medidor registrado correctamente.')
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
        {esEdicion ? `Editar medidor: ${medidor.descripcion}` : 'Nuevo medidor'}
      </h3>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* <fieldset disabled> bloquea todos los controles mientras se guarda. */}
      <fieldset disabled={guardando} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CampoFormulario id="medidor-idCtrlRF" etiqueta="Controlador RF" error={errorDe('idCtrlRF')}>
          <select {...propsDe('idCtrlRF')}>
            <option value="">Selecciona un controlador…</option>
            {controladores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </CampoFormulario>

        <CampoFormulario
          id="medidor-descripcion"
          etiqueta="Descripción"
          error={errorDe('descripcion')}
          ayuda={`Máximo ${LIMITES.descripcion} caracteres.`}
        >
          <input
            type="text"
            maxLength={LIMITES.descripcion}
            placeholder="Medidor de entrada"
            {...propsDe('descripcion')}
          />
        </CampoFormulario>

        {/* type="text" para que, si se escribe una letra, se vea el mensaje propio. */}
        <CampoFormulario
          id="medidor-dirRed"
          etiqueta="Dirección de red"
          error={errorDe('dirRed')}
          ayuda="Número entero."
        >
          <input type="text" inputMode="numeric" placeholder="25" {...propsDe('dirRed', 'font-mono')} />
        </CampoFormulario>

        <CampoFormulario
          id="medidor-dirRF"
          etiqueta="Dirección RF"
          error={errorDe('dirRF')}
          ayuda={`Máximo ${LIMITES.dirRF} caracteres.`}
        >
          <input
            type="text"
            maxLength={LIMITES.dirRF}
            placeholder="RF-A25"
            {...propsDe('dirRF', 'font-mono')}
          />
        </CampoFormulario>

        <CampoFormulario
          id="medidor-dirIP"
          etiqueta="Dirección IP"
          error={errorDe('dirIP')}
          ayuda="Formato IPv4: cuatro números de 0 a 255 separados por punto."
        >
          <input
            type="text"
            inputMode="decimal"
            maxLength={LIMITES.dirIP}
            placeholder="192.168.1.25"
            {...propsDe('dirIP', 'font-mono')}
          />
        </CampoFormulario>

        <CampoFormulario id="medidor-edo" etiqueta="Estado" error={errorDe('edo')}>
          <select {...propsDe('edo')}>
            {ESTADOS_EQUIPO.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.texto}
              </option>
            ))}
          </select>
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
