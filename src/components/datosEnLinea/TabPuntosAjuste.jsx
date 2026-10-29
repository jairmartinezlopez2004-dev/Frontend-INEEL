/**
 * TabPuntosAjuste.jsx
 * ---------------------------------------------------------------------------
 * Vista "Puntos de ajuste" del medidor (ajustes internos): un menú lateral
 * con las secciones Multiplicadores, Límites de alarmas, Identificadores,
 * Fecha-Hora, Firmware y Reset de fábrica.
 *
 * Rol en el sistema:
 * Replica la pestaña Ajustes del visor de escritorio anterior. En cada
 * sección:
 * - "Solicitar" lee del medidor los valores de esa sección.
 * - La casilla "Modificar valores" habilita la edición y "Descargar" envía
 *   los valores al medidor (en el visor anterior, "descargar" = enviar del
 *   visor al medidor).
 * - Firmware solo se lee; Reset de fábrica pide confirmación.
 *
 * Permisos: MainForm.jsx solo muestra esta pestaña al SuperAdministrador y al
 * Administrador; `puedeModificar` se conserva como respaldo. A diferencia del resto de "Datos en
 * línea" (solo lectura), aquí los administradores sí modifican: enviar
 * ajustes al medidor es una operación en línea por naturaleza.
 *
 * Integración con el WebService:
 * Pendiente (comandos LeerSetPoint / EnviarSetPoint del sistema anterior).
 * `crearMedidorSimulado` imita al medidor; al conectar el backend se
 * sustituirán sus funciones `leer`, `escribir` y `resetFabrica`.
 */
import { useEffect, useState } from 'react'
import ConfirmDialog from '../common/ConfirmDialog'
import { claseControl } from '../common/clasesFormulario'

// rolId del SuperAdministrador y del Administrador en la UI.
const ROLES_ADMINISTRADOR = [1, 2]

const TIPOS_MEDICION = [
  'Monofásica 2 hilos',
  'Bifásica 3 hilos',
  'Trifásica 3 hilos (delta)',
  'Trifásica 4 hilos (estrella)',
]

const esPositivo = (v) => (Number.isFinite(v) && v > 0 ? null : 'Debe ser mayor que 0')

// Secciones con campos editables. `validar` revisa la sección completa y
// devuelve { campo: mensaje } con los errores.
const SECCIONES_CAMPOS = {
  multiplicadores: {
    titulo: "Multiplicadores (TP's y TC's)",
    columnas: 2,
    campos: [
      { id: 'va', etiqueta: 'Multiplicador VA', tipo: 'numero', decimales: 2 },
      { id: 'ia', etiqueta: 'Multiplicador IA', tipo: 'numero', decimales: 2 },
      { id: 'vb', etiqueta: 'Multiplicador VB', tipo: 'numero', decimales: 2 },
      { id: 'ib', etiqueta: 'Multiplicador IB', tipo: 'numero', decimales: 2 },
      { id: 'vc', etiqueta: 'Multiplicador VC', tipo: 'numero', decimales: 2 },
      { id: 'ic', etiqueta: 'Multiplicador IC', tipo: 'numero', decimales: 2 },
    ],
    validar: (v) =>
      Object.fromEntries(['va', 'vb', 'vc', 'ia', 'ib', 'ic'].map((k) => [k, esPositivo(v[k])]).filter(([, e]) => e)),
  },
  limites: {
    titulo: 'Límites de alarmas',
    columnas: 1,
    campos: [
      { id: 'vMax', etiqueta: 'Voltaje máximo', tipo: 'numero', decimales: 1, unidad: 'V' },
      { id: 'vMin', etiqueta: 'Voltaje mínimo', tipo: 'numero', decimales: 1, unidad: 'V' },
      { id: 'iMax', etiqueta: 'Corriente máxima', tipo: 'numero', decimales: 2, unidad: 'A' },
    ],
    validar: (v) => {
      const errores = {}
      for (const k of ['vMax', 'vMin', 'iMax']) {
        const e = esPositivo(v[k])
        if (e) errores[k] = e
      }
      if (!errores.vMax && !errores.vMin && v.vMin >= v.vMax) errores.vMin = 'Debe ser menor que el voltaje máximo'
      return errores
    },
  },
  identificadores: {
    titulo: 'Identificadores',
    columnas: 1,
    campos: [
      { id: 'dirRed', etiqueta: 'Dirección de red', tipo: 'numero', decimales: 0 },
      { id: 'numSerie', etiqueta: 'Número de serie', tipo: 'texto', maximo: 20 },
      { id: 'tipoMedicion', etiqueta: 'Tipo de medición', tipo: 'opciones', opciones: TIPOS_MEDICION },
    ],
    validar: (v) => {
      const errores = {}
      if (!Number.isInteger(v.dirRed) || v.dirRed < 0 || v.dirRed > 65535) errores.dirRed = 'Entero de 0 a 65535'
      if (!String(v.numSerie ?? '').trim()) errores.numSerie = 'Obligatorio'
      return errores
    },
  },
}

const MENU = [
  { id: 'multiplicadores', texto: 'Multiplicadores' },
  { id: 'limites', texto: 'Límites alarmas' },
  { id: 'identificadores', texto: 'Identificadores' },
  { id: 'fecha', texto: 'Fecha-Hora' },
  { id: 'firmware', texto: 'Firmware' },
  { id: 'reset', texto: 'Reset fábrica' },
]

// Valores de fábrica del medidor simulado.
const FABRICA = {
  multiplicadores: { va: 1, vb: 1, vc: 1, ia: 1, ib: 1, ic: 1 },
  limites: { vMax: 138, vMin: 102, iMax: 100 },
  identificadores: { dirRed: 1, numSerie: 'QP000001', tipoMedicion: 'Trifásica 4 hilos (estrella)' },
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Medidor de ejemplo mientras no exista el método del WebService. Guarda sus
 * valores mientras la pestaña está abierta; el reloj lleva un desfase.
 */
function crearMedidorSimulado() {
  const m = {
    multiplicadores: { va: 60, vb: 60, vc: 60, ia: 40, ib: 40, ic: 40 },
    limites: { vMax: 132, vMin: 108, iMax: 50 },
    identificadores: { dirRed: 65535, numSerie: 'QP240517', tipoMedicion: 'Trifásica 4 hilos (estrella)' },
    // Diferencia del reloj del medidor contra el del equipo, en ms.
    desfaseReloj: Math.round((Math.random() - 0.5) * 180) * 1000,
    firmware: { version: 'QP-2.5.1', fecha: '2025-03-14', protocolo: 'ComsCEC v2.5' },
  }
  return {
    leer: async (seccion) => {
      await esperar(300)
      if (seccion === 'fecha') return { fechaHora: new Date(Date.now() + m.desfaseReloj) }
      return { ...m[seccion] }
    },
    escribir: async (seccion, valores) => {
      await esperar(300)
      if (seccion === 'fecha') m.desfaseReloj = valores.fechaHora.getTime() - Date.now()
      else m[seccion] = { ...valores }
    },
    resetFabrica: async () => {
      await esperar(500)
      Object.assign(m, structuredClone(FABRICA), { desfaseReloj: 0 })
    },
  }
}

// --------------------------------------------------------------------------
// Piezas visuales comunes
// --------------------------------------------------------------------------

const claseBotonPrimario =
  'transform cursor-pointer rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
const claseBotonSecundario =
  'cursor-pointer rounded-lg bg-gray-100 px-6 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50'
// Recuadro de solo lectura con el mismo estilo de valor que Instantáneos.
const claseDisplay =
  'w-full rounded-md bg-gray-50 px-3 py-2 text-right font-mono text-lg font-semibold tabular-nums text-green-500'

function Mensaje({ mensaje }) {
  if (!mensaje) return null
  return (
    <div
      className={`rounded-lg px-4 py-3 text-sm ${
        mensaje.tipo === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {mensaje.texto}
    </div>
  )
}

function CasillaModificar({ checked, onChange, disabled }) {
  return (
    <label className={`flex items-center gap-2 text-sm font-semibold text-gray-900 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-3.5 w-3.5 cursor-pointer rounded-sm border-gray-300 accent-emerald-500"
      />
      Modificar valores
    </label>
  )
}

// --------------------------------------------------------------------------
// Secciones
// --------------------------------------------------------------------------

/** Texto con el que se muestra un valor leído. */
function formatear(campo, valor) {
  if (valor === undefined || valor === null) return '—'
  return campo.tipo === 'numero' ? Number(valor).toFixed(campo.decimales) : valor
}

// Props:
// - id: clave en SECCIONES_CAMPOS.
// - medidor: medidor simulado (leer / escribir).
// - puedeModificar: si el usuario puede editar y descargar.
function SeccionCampos({ id, medidor, puedeModificar }) {
  const { titulo, columnas, campos, validar } = SECCIONES_CAMPOS[id]
  // Últimos valores leídos del medidor (null = aún no se solicitan).
  const [leidos, setLeidos] = useState(null)
  // Valores en edición, como texto de los inputs.
  const [borrador, setBorrador] = useState({})
  const [modificando, setModificando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  // Borrador convertido a valores (números donde corresponde) y sus errores.
  const valores = Object.fromEntries(
    campos.map((c) => [c.id, c.tipo === 'numero' ? (borrador[c.id] === '' ? NaN : Number(borrador[c.id])) : borrador[c.id]]),
  )
  const errores = modificando ? validar(valores) : {}
  const hayCambios = leidos !== null && campos.some((c) => valores[c.id] !== leidos[c.id])

  const alLeer = (datos) => {
    setLeidos(datos)
    setBorrador(Object.fromEntries(campos.map((c) => [c.id, String(datos[c.id])])))
  }

  const solicitar = async () => {
    setOcupado(true)
    setMensaje(null)
    try {
      alLeer(await medidor.leer(id))
    } finally {
      setOcupado(false)
    }
  }

  const descargar = async () => {
    setOcupado(true)
    try {
      await medidor.escribir(id, valores)
      alLeer(await medidor.leer(id))
      setModificando(false)
      setMensaje({ tipo: 'ok', texto: 'Valores enviados al medidor.' })
    } finally {
      setOcupado(false)
    }
  }

  const alternarModificar = (activo) => {
    setModificando(activo)
    setMensaje(null)
    // Al dejar de modificar se descartan los cambios no enviados.
    if (!activo && leidos) alLeer(leidos)
  }

  return (
    <>
      <h3 className="text-center text-base font-bold uppercase tracking-wide text-slate-800">{titulo}</h3>
      <div className={`grid gap-x-10 gap-y-5 ${columnas === 2 ? 'md:grid-cols-2' : 'mx-auto w-full max-w-md'}`}>
        {campos.map((c) => {
          const idInput = `ajuste-${id}-${c.id}`
          const error = errores[c.id]
          return (
            <div key={c.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <label htmlFor={idInput} className="w-44 shrink-0 text-sm font-semibold uppercase text-gray-900">
                  {c.etiqueta}:
                </label>
                {!modificando ? (
                  <output id={idInput} className={claseDisplay}>
                    {formatear(c, leidos?.[c.id])}
                  </output>
                ) : c.tipo === 'opciones' ? (
                  <select
                    id={idInput}
                    value={borrador[c.id]}
                    onChange={(e) => setBorrador((b) => ({ ...b, [c.id]: e.target.value }))}
                    className={claseControl(Boolean(error), 'w-full')}
                  >
                    {c.opciones.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={idInput}
                    type={c.tipo === 'numero' ? 'number' : 'text'}
                    step={c.tipo === 'numero' ? 1 / 10 ** c.decimales : undefined}
                    maxLength={c.maximo}
                    value={borrador[c.id]}
                    onChange={(e) => setBorrador((b) => ({ ...b, [c.id]: e.target.value }))}
                    aria-invalid={Boolean(error)}
                    className={claseControl(Boolean(error), 'w-full text-right font-mono')}
                  />
                )}
                <span className="w-4 shrink-0 text-xs font-medium text-gray-700">{c.unidad}</span>
              </div>
              {error && <p className="ml-[11.75rem] text-xs font-medium text-red-600">{error}</p>}
            </div>
          )
        })}
      </div>

      <Mensaje mensaje={mensaje} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
        <CasillaModificar
          checked={modificando}
          onChange={alternarModificar}
          disabled={!puedeModificar || leidos === null || ocupado}
        />
        <div className="flex gap-3">
          <button type="button" onClick={solicitar} disabled={ocupado || modificando} className={claseBotonSecundario}>
            {ocupado && !modificando ? 'Leyendo…' : 'Solicitar'}
          </button>
          {puedeModificar && (
            <button
              type="button"
              onClick={descargar}
              disabled={!modificando || !hayCambios || Object.keys(errores).length > 0 || ocupado}
              className={claseBotonPrimario}
            >
              {ocupado && modificando ? 'Enviando…' : 'Descargar'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

const dosDigitos = (n) => String(n).padStart(2, '0')
const textoFechaHora = (d) =>
  `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())} ${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}:${dosDigitos(d.getSeconds())}`
// Valor para <input type="datetime-local" step="1">.
const valorDatetimeLocal = (d) => textoFechaHora(d).replace(' ', 'T')

function SeccionFecha({ medidor, puedeModificar }) {
  // Diferencia del reloj del medidor contra el del equipo (null = sin leer).
  const [desfase, setDesfase] = useState(null)
  const [ahora, setAhora] = useState(() => new Date())
  const [modificando, setModificando] = useState(false)
  const [nueva, setNueva] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  // Los dos relojes avanzan cada segundo.
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const solicitar = async () => {
    setOcupado(true)
    setMensaje(null)
    try {
      const { fechaHora } = await medidor.leer('fecha')
      setDesfase(fechaHora.getTime() - Date.now())
    } finally {
      setOcupado(false)
    }
  }

  const descargar = async (fechaHora) => {
    setOcupado(true)
    try {
      await medidor.escribir('fecha', { fechaHora })
      const leida = await medidor.leer('fecha')
      setDesfase(leida.fechaHora.getTime() - Date.now())
      setModificando(false)
      setMensaje({ tipo: 'ok', texto: 'Fecha y hora enviadas al medidor.' })
    } finally {
      setOcupado(false)
    }
  }

  const relojMedidor = desfase === null ? null : new Date(ahora.getTime() + desfase)
  const segundos = desfase === null ? null : Math.round(desfase / 1000)

  return (
    <>
      <h3 className="text-center text-base font-bold uppercase tracking-wide text-slate-800">Fecha y hora</h3>
      <div className="mx-auto grid w-full max-w-md gap-5">
        <div className="flex items-center gap-3">
          <span className="w-44 shrink-0 text-sm font-semibold uppercase text-gray-900">Reloj del medidor:</span>
          <output className={claseDisplay}>{relojMedidor ? textoFechaHora(relojMedidor) : '—'}</output>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-44 shrink-0 text-sm font-semibold uppercase text-gray-900">Hora del equipo:</span>
          <output className={claseDisplay}>{textoFechaHora(ahora)}</output>
        </div>
        {segundos !== null && (
          <p className={`text-center text-sm font-medium ${Math.abs(segundos) > 5 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {segundos === 0
              ? 'El reloj del medidor está sincronizado.'
              : `El medidor va ${Math.abs(segundos)} s ${segundos > 0 ? 'adelantado' : 'atrasado'}.`}
          </p>
        )}
        {modificando && (
          <div className="flex flex-col gap-3 rounded-lg bg-gray-50 p-4">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-900">
              Nueva fecha y hora
              <input
                type="datetime-local"
                step="1"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                className={claseControl(false)}
              />
            </label>
            <button
              type="button"
              onClick={() => descargar(new Date())}
              disabled={ocupado}
              className={claseBotonSecundario}
            >
              Sincronizar con la hora del equipo
            </button>
          </div>
        )}
      </div>

      <Mensaje mensaje={mensaje} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
        <CasillaModificar
          checked={modificando}
          onChange={(activo) => {
            setModificando(activo)
            setMensaje(null)
            if (activo) setNueva(valorDatetimeLocal(new Date()))
          }}
          disabled={!puedeModificar || desfase === null || ocupado}
        />
        <div className="flex gap-3">
          <button type="button" onClick={solicitar} disabled={ocupado || modificando} className={claseBotonSecundario}>
            {ocupado && !modificando ? 'Leyendo…' : 'Solicitar'}
          </button>
          {puedeModificar && (
            <button
              type="button"
              onClick={() => descargar(new Date(nueva))}
              disabled={!modificando || !nueva || ocupado}
              className={claseBotonPrimario}
            >
              {ocupado && modificando ? 'Enviando…' : 'Descargar'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function SeccionFirmware({ medidor }) {
  const [firmware, setFirmware] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const solicitar = async () => {
    setOcupado(true)
    try {
      setFirmware(await medidor.leer('firmware'))
    } finally {
      setOcupado(false)
    }
  }

  const filas = [
    { id: 'version', etiqueta: 'Versión' },
    { id: 'fecha', etiqueta: 'Fecha de compilación' },
    { id: 'protocolo', etiqueta: 'Protocolo' },
  ]

  return (
    <>
      <h3 className="text-center text-base font-bold uppercase tracking-wide text-slate-800">Firmware</h3>
      <div className="mx-auto grid w-full max-w-md gap-5">
        {filas.map((f) => (
          <div key={f.id} className="flex items-center gap-3">
            <span className="w-44 shrink-0 text-sm font-semibold uppercase text-gray-900">{f.etiqueta}:</span>
            <output className={claseDisplay}>{firmware?.[f.id] ?? '—'}</output>
          </div>
        ))}
      </div>
      <div className="flex justify-end border-t border-gray-100 pt-5">
        <button type="button" onClick={solicitar} disabled={ocupado} className={claseBotonSecundario}>
          {ocupado ? 'Leyendo…' : 'Solicitar'}
        </button>
      </div>
    </>
  )
}

function SeccionReset({ medidor, puedeModificar }) {
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const restablecer = async () => {
    setOcupado(true)
    try {
      await medidor.resetFabrica()
      setMensaje({ tipo: 'ok', texto: 'El medidor se restableció a los valores de fábrica.' })
    } finally {
      setOcupado(false)
      setConfirmando(false)
    }
  }

  return (
    <>
      <h3 className="text-center text-base font-bold uppercase tracking-wide text-slate-800">Reset de fábrica</h3>
      <div className="mx-auto w-full max-w-lg rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Regresa el medidor a sus valores de fábrica: multiplicadores, límites de alarmas, identificadores y reloj.
        Los ajustes actuales se pierden y el medidor puede dejar de comunicarse si cambia su dirección de red.
      </div>

      <Mensaje mensaje={mensaje} />

      <div className="flex justify-center border-t border-gray-100 pt-5">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          disabled={!puedeModificar || ocupado}
          title={puedeModificar ? undefined : 'Solo el Administrador puede restablecer el medidor'}
          className="cursor-pointer rounded-lg bg-red-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Restablecer valores de fábrica
        </button>
      </div>

      <ConfirmDialog
        abierto={confirmando}
        titulo="¿Restablecer el medidor?"
        mensaje="Se borrarán todos los ajustes del medidor y quedarán los de fábrica. Esta acción no se puede deshacer."
        textoConfirmar={ocupado ? 'Restableciendo…' : 'Restablecer'}
        onConfirmar={restablecer}
        onCancelar={() => setConfirmando(false)}
        ocupado={ocupado}
      />
    </>
  )
}

// --------------------------------------------------------------------------
// Pestaña
// --------------------------------------------------------------------------

// Props:
// - usuarioLogueado: usuario autenticado (rolId para permisos).
function TabPuntosAjuste({ usuarioLogueado }) {
  const [seccion, setSeccion] = useState('multiplicadores')
  // Una instancia por pestaña abierta (el inicializador corre una sola vez).
  const [medidor] = useState(crearMedidorSimulado)
  const puedeModificar = ROLES_ADMINISTRADOR.includes(usuarioLogueado?.rolId)

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold uppercase tracking-wide text-slate-800">Ajustes internos del medidor</h2>
          {!puedeModificar && <span className="text-sm font-medium text-gray-500">Solo lectura</span>}
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Menú de secciones (mismo estilo que el de Coms). */}
          <nav className="flex w-full flex-row gap-2 overflow-x-auto lg:w-56 lg:flex-col">
            {MENU.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSeccion(m.id)}
                className={`cursor-pointer whitespace-nowrap rounded-md border-l-4 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                  seccion === m.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-transparent text-slate-900 hover:bg-slate-100'
                }`}
              >
                {m.texto}
              </button>
            ))}
          </nav>

          {/* `key` reinicia el estado de la sección al cambiar de opción. */}
          <section
            key={seccion}
            className="flex min-w-0 flex-1 flex-col gap-6 rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5"
          >
            {SECCIONES_CAMPOS[seccion] && <SeccionCampos id={seccion} medidor={medidor} puedeModificar={puedeModificar} />}
            {seccion === 'fecha' && <SeccionFecha medidor={medidor} puedeModificar={puedeModificar} />}
            {seccion === 'firmware' && <SeccionFirmware medidor={medidor} />}
            {seccion === 'reset' && <SeccionReset medidor={medidor} puedeModificar={puedeModificar} />}
          </section>
        </div>
      </div>
    </div>
  )
}

export default TabPuntosAjuste
