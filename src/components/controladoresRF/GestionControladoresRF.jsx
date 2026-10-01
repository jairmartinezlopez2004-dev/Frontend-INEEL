/**
 * GestionControladoresRF.jsx
 * ---------------------------------------------------------------------------
 * Módulo "Controladores RF": catálogo de controladores de radiofrecuencia con
 * alta y edición.
 *
 * Rol en el sistema:
 * - Cualquier usuario con sesión ve la lista (GET /ControladorRF).
 * - Solo el Administrador ve los botones "+ Nuevo controlador" y "Editar"
 *   (POST / PUT /ControladorRF); el backend además rechaza con 403 a quien no lo sea.
 * - El backend no permite eliminar controladores.
 * - El estado (`edo`) es un número: el catálogo de significados (activo,
 *   mantenimiento, inactivo) aún no lo define el backend, así que se captura
 *   y se muestra tal cual.
 */
import { useEffect, useState } from 'react'
import {
  LIMITES,
  listarControladoresRF,
  crearControladorRF,
  actualizarControladorRF,
} from '../../services/controladoresRFService'
import { useValidacion } from '../../hooks/useValidacion'
import { validarTexto, validarIP, validarEntero } from '../../utils/validaciones'
import CampoFormulario from '../common/CampoFormulario'
import { claseControl } from '../common/clasesFormulario'

// Encabezados de la tabla. La última columna (acciones) solo aplica al Administrador.
const COLUMNAS = ['Nombre', 'Número de serie', 'Dirección IP', 'Estado']

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

// ---------------------------------------------------------------------------
// Formulario de alta / edición
// ---------------------------------------------------------------------------

// Props:
// - controlador: null para alta, u objeto controlador (de controladoresRFService) para editar.
// - onGuardado: callback con el mensaje de éxito tras guardar.
// - onCancelar: callback para cerrar el formulario sin guardar.
function FormularioControlador({ controlador, onGuardado, onCancelar }) {
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
    <form noValidate onSubmit={guardar} className="border-b border-slate-200 bg-slate-50 px-6 py-5">
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

// ---------------------------------------------------------------------------
// Vista principal
// ---------------------------------------------------------------------------

// Props:
// - esAdmin: si es true se muestran el alta y la edición.
export default function GestionControladoresRF({ esAdmin }) {
  const [controladores, setControladores] = useState([])
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

    listarControladoresRF({ signal: controlador.signal })
      .then(setControladores)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [recarga])

  const abrirFormulario = (controlador) => {
    setAviso(null)
    setEnEdicion(controlador)
  }

  const alGuardar = (mensaje) => {
    setEnEdicion(undefined)
    setAviso(mensaje)
    setCargando(true)
    setError(null)
    setRecarga((n) => n + 1)
  }

  const columnas = esAdmin ? [...COLUMNAS, ''] : COLUMNAS

  return (
    <div className="rounded-xl bg-white shadow-md">
      {/* Encabezado de la tarjeta: título + alta de controlador. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">
          Controladores RF
        </h2>
        {esAdmin && enEdicion === undefined && (
          <button
            type="button"
            onClick={() => abrirFormulario(null)}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95"
          >
            + Nuevo controlador
          </button>
        )}
      </div>

      {/* `key` reinicia el formulario al cambiar entre alta y distintos controladores. */}
      {esAdmin && enEdicion !== undefined && (
        <FormularioControlador
          key={enEdicion?.id ?? 'nuevo'}
          controlador={enEdicion}
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
      {cargando && <p className="px-6 py-4 text-sm text-slate-500">Cargando controladores…</p>}
      {error && (
        <div className="m-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {!cargando && !error && controladores.length === 0 && (
        <p className="px-6 py-4 text-sm text-slate-500">
          No hay controladores RF registrados.
        </p>
      )}

      {/* Contenedor con scroll horizontal para que la tabla no rompa el layout en pantallas angostas. */}
      {!error && controladores.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {columnas.map((col) => (
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
              {controladores.map((controlador) => (
                <tr key={controlador.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{controlador.nombre}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{controlador.numSerie}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{controlador.dirIP}</td>
                  <td className="px-4 py-3 font-mono text-slate-700">{controlador.edo}</td>
                  {esAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => abrirFormulario(controlador)}
                        className="cursor-pointer rounded-md border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                      >
                        Editar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
