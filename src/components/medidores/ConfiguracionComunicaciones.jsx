/**
 * ConfiguracionComunicaciones.jsx
 * ---------------------------------------------------------------------------
 * Formulario de configuración de comunicaciones de un medidor.
 *
 * Rol en el sistema:
 * - Es el contenido de la pestaña "Coms" dentro de la vista de detalle
 *   (DetalleMedidor -> MainForm -> TabComunicaciones). Recibe el medidor
 *   seleccionado en el catálogo por props.
 * - Al montarse consulta al WebService la configuración actual del medidor
 *   (leerConfiguracionComs). Si el WebService no responde, muestra valores
 *   por defecto (tomando IP y puerto del propio medidor) y un aviso.
 * - Permisos por rol:
 *     · SuperAdministrador (rolId 1) y Administrador (rolId 2): pueden pulsar "Editar", modificar los campos
 *       y "Guardar" (guardarConfiguracionComs) o "Cancelar".
 *     · Usuario Normal (rolId 3): experiencia de solo lectura; todos los
 *       campos quedan deshabilitados y no se muestran botones de acción.
 *     · Con `soloLectura` ("Datos en línea") la vista es de solo lectura
 *       para todos, incluido el Administrador.
 *
 * NOTA: App.jsx monta DetalleMedidor con `key={medidor.id}`, de modo
 * que al cambiar de medidor el estado interno se reinicia por completo.
 */
import { useEffect, useState } from 'react'
import { leerConfiguracionComs, guardarConfiguracionComs } from '../../services/medidoresService'

// rolId del SuperAdministrador y del Administrador en la UI.
const ROLES_ADMINISTRADOR = [1, 2]

// Valores por defecto del formulario. También documentan la forma esperada
// del DTO de configuración que devuelve/recibe el WebService.
const CONFIG_COMS_DEFAULT = {
  transporte: 'TCP/IP', // 'SERIAL' | 'TCP/IP'
  usarRF: false,
  protocolo: 'ComsCECv25',
  dirIP: '',
  puerto: 502,
  com: 'COM1',
  baudRate: '9600',
  paridad: 'Ninguna',
  bitsDatos: '8',
  bitsParo: '1',
  timeout: 5000,
  empaquetado: 'LittleEndian',
  verMensajesRxTx: false,
}

// Catálogos de opciones de los <select>.
const OPCIONES = {
  transporte: ['SERIAL', 'TCP/IP'],
  protocolo: ['ComsCECv25', 'ComsCECv30', 'DLMS'],
  com: ['COM1', 'COM2', 'COM3', 'COM4', 'COM5'],
  baudRate: ['2400', '9600', '19200', '38400', '57600', '115200'],
  paridad: ['Ninguna', 'Par', 'Impar'],
  bitsDatos: ['7', '8'],
  bitsParo: ['1', '2'],
  empaquetado: ['LittleEndian', 'BigEndian'],
}

// Clases compartidas por inputs y selects. Las variantes `disabled:` dan el
// aspecto de "solo lectura" cuando el <fieldset> está deshabilitado.
const CLASES_CONTROL =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'

// ---------------------------------------------------------------------------
// Sub-componentes de formulario (controlados)
// ---------------------------------------------------------------------------

// Envoltorio genérico: etiqueta + control.
function Campo({ etiqueta, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-slate-900">{etiqueta}</span>
      {children}
    </label>
  )
}

// <select> controlado a partir de un catálogo de opciones.
function CampoSelect({ etiqueta, value, onChange, opciones }) {
  return (
    <Campo etiqueta={etiqueta}>
      <select value={value} onChange={onChange} className={CLASES_CONTROL}>
        {opciones.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
    </Campo>
  )
}

// Checkbox controlado con etiqueta a la derecha.
function CampoCheckbox({ etiqueta, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 pt-6">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
      />
      <span className="text-sm font-semibold text-slate-900">{etiqueta}</span>
    </label>
  )
}

// Caja con título para agrupar campos relacionados.
function Seccion({ titulo, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-800">
        {titulo}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vista principal
// ---------------------------------------------------------------------------

// Props:
// - medidor: objeto { id, dirRed, dirRF, descripcion, edo, dirIP } seleccionado en el catálogo
//   (el backend aún no guarda el puerto; se usa el de CONFIG_COMS_DEFAULT).
// - usuarioLogueado: objeto del usuario autenticado (se usa rolId para permisos).
// - soloLectura: si es true nadie edita, ni el Administrador ("Datos en línea").
export default function ConfiguracionComunicaciones({ medidor, usuarioLogueado, soloLectura: vistaSoloLectura = false }) {
  const esAdmin = ROLES_ADMINISTRADOR.includes(usuarioLogueado?.rolId) && !vistaSoloLectura

  // Valores iniciales: defaults + IP/puerto que ya conocemos por el catálogo.
  const configInicial = {
    ...CONFIG_COMS_DEFAULT,
    dirIP: medidor.dirIP ?? '',
    puerto: medidor.puerto ?? CONFIG_COMS_DEFAULT.puerto,
  }

  // Valores actuales del formulario (componentes controlados).
  const [config, setConfig] = useState(configInicial)
  // Copia de los últimos valores guardados/leídos, para poder "Cancelar".
  const [configGuardada, setConfigGuardada] = useState(configInicial)
  // Estados de la interfaz.
  const [cargando, setCargando] = useState(true) // Leyendo configuración del WebService.
  const [guardando, setGuardando] = useState(false) // Enviando configuración.
  const [editando, setEditando] = useState(false) // Modo edición (solo Administrador).
  const [aviso, setAviso] = useState(null) // { tipo: 'error' | 'exito' | 'info', texto }

  // Lectura inicial de la configuración del medidor. Se usa AbortController
  // para cancelar la petición si el usuario sale de la vista antes de que
  // responda el WebService (evita actualizar estado de un componente desmontado).
  useEffect(() => {
    const controlador = new AbortController()

    leerConfiguracionComs(medidor.dirRed, { signal: controlador.signal })
      .then((datos) => {
        // Se combinan con los valores iniciales por si el DTO omite algún campo.
        const leida = { ...CONFIG_COMS_DEFAULT, dirIP: medidor.dirIP, puerto: medidor.puerto ?? CONFIG_COMS_DEFAULT.puerto, ...datos }
        setConfig(leida)
        setConfigGuardada(leida)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setAviso({
          tipo: 'info',
          texto: `No se pudo leer la configuración del WebService (${err.message}). Se muestran valores por defecto.`,
        })
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [medidor.dirRed, medidor.dirIP, medidor.puerto])

  // Genera un manejador onChange para el campo indicado. Distingue
  // checkboxes (checked) de inputs/selects (value) y convierte a número
  // los campos numéricos.
  const actualizar = (campo) => (e) => {
    const { type, checked, value } = e.target
    const valor = type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    setConfig((prev) => ({ ...prev, [campo]: valor }))
  }

  // Descarta los cambios y sale del modo edición.
  const cancelarEdicion = () => {
    setConfig(configGuardada)
    setEditando(false)
    setAviso(null)
  }

  // Envía la configuración al WebService. Doble validación de rol: aunque el
  // botón no se renderiza para Usuario Normal, se protege también la acción.
  const guardar = async (e) => {
    e.preventDefault()
    if (!esAdmin) return

    setGuardando(true)
    setAviso(null)
    try {
      const mensaje = await guardarConfiguracionComs(medidor.dirRed, config)
      setConfigGuardada(config)
      setEditando(false)
      setAviso({ tipo: 'exito', texto: mensaje || 'Configuración guardada correctamente.' })
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  // El formulario solo es editable si es Administrador, está en modo
  // edición y no hay una petición en curso.
  const soloLectura = !esAdmin || !editando || guardando || cargando
  const esSerial = config.transporte === 'SERIAL'

  // Estilos de la caja de aviso según su tipo.
  const CLASES_AVISO = {
    error: 'border-red-200 bg-red-50 text-red-700',
    exito: 'border-green-200 bg-green-50 text-green-700',
    info: 'border-amber-200 bg-amber-50 text-amber-800',
  }

  return (
    <form onSubmit={guardar} className="w-full rounded-xl bg-white p-6 shadow-md">
      {/* Barra superior del formulario: indicador de modo + acciones de Administrador. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">
          Configuración de comunicaciones
        </h2>

        {/* Usuario Normal: solo se le indica que la vista es de consulta. */}
        {!esAdmin && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Solo lectura
          </span>
        )}

        {/* Administrador fuera de edición: botón para habilitar los campos. */}
        {esAdmin && !editando && (
          <button
            type="button"
            disabled={cargando}
            onClick={() => {
              setEditando(true)
              setAviso(null)
            }}
            className="cursor-pointer rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Editar
          </button>
        )}
      </div>

      {/* Mensajes de estado (carga, errores, confirmaciones). */}
      {cargando && <p className="mb-4 text-sm text-slate-500">Leyendo configuración del medidor…</p>}
      {aviso && (
        <div className={`mb-4 rounded-md border p-3 text-sm ${CLASES_AVISO[aviso.tipo]}`}>
          {aviso.texto}
        </div>
      )}

      {/* <fieldset disabled> deshabilita de una sola vez todos los controles
          internos: así se implementa la experiencia de solo lectura. */}
      <fieldset disabled={soloLectura} className="flex flex-col gap-6">
        {/* Parámetros generales */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CampoSelect
            etiqueta="Transporte"
            value={config.transporte}
            onChange={actualizar('transporte')}
            opciones={OPCIONES.transporte}
          />
          <CampoCheckbox etiqueta="Usar RF" checked={config.usarRF} onChange={actualizar('usarRF')} />
          <CampoSelect
            etiqueta="Protocolo"
            value={config.protocolo}
            onChange={actualizar('protocolo')}
            opciones={OPCIONES.protocolo}
          />
        </div>

        {/* Renderizado condicional según el transporte elegido:
            TCP/IP muestra IP y puerto; SERIAL muestra parámetros del puerto COM. */}
        {esSerial ? (
          <Seccion titulo="Parámetros serial">
            <CampoSelect etiqueta="Com" value={config.com} onChange={actualizar('com')} opciones={OPCIONES.com} />
            <CampoSelect
              etiqueta="Baud Rate"
              value={config.baudRate}
              onChange={actualizar('baudRate')}
              opciones={OPCIONES.baudRate}
            />
            <CampoSelect
              etiqueta="Paridad"
              value={config.paridad}
              onChange={actualizar('paridad')}
              opciones={OPCIONES.paridad}
            />
            <CampoSelect
              etiqueta="Bits de Datos"
              value={config.bitsDatos}
              onChange={actualizar('bitsDatos')}
              opciones={OPCIONES.bitsDatos}
            />
            <CampoSelect
              etiqueta="Bits de Paro"
              value={config.bitsParo}
              onChange={actualizar('bitsParo')}
              opciones={OPCIONES.bitsParo}
            />
          </Seccion>
        ) : (
          <Seccion titulo="Parámetros TCP/IP">
            <Campo etiqueta="Dirección IP">
              <input
                type="text"
                value={config.dirIP}
                onChange={actualizar('dirIP')}
                placeholder="192.168.0.1"
                className={CLASES_CONTROL}
              />
            </Campo>
            <Campo etiqueta="Puerto">
              <input
                type="number"
                min={1}
                max={65535}
                value={config.puerto}
                onChange={actualizar('puerto')}
                className={CLASES_CONTROL}
              />
            </Campo>
          </Seccion>
        )}

        {/* Parámetros comunes a ambos transportes */}
        <Seccion titulo="Parámetros">
          <Campo etiqueta="TimeOut (ms)">
            <input
              type="number"
              min={0}
              value={config.timeout}
              onChange={actualizar('timeout')}
              className={CLASES_CONTROL}
            />
          </Campo>
          <CampoSelect
            etiqueta="Empaquetado"
            value={config.empaquetado}
            onChange={actualizar('empaquetado')}
            opciones={OPCIONES.empaquetado}
          />
          <CampoCheckbox
            etiqueta="Ver mensajes RxTx"
            checked={config.verMensajesRxTx}
            onChange={actualizar('verMensajesRxTx')}
          />
        </Seccion>
      </fieldset>

      {/* Acciones de guardado: solo existen para el Administrador en modo edición. */}
      {esAdmin && editando && (
        <div className="mt-6 flex justify-center gap-3 border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={cancelarEdicion}
            disabled={guardando}
            className="cursor-pointer rounded-lg border border-slate-300 px-6 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="cursor-pointer rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      )}
    </form>
  )
}
