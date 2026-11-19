/**
 * SeleccionConsulta.jsx
 * ---------------------------------------------------------------------------
 * Vista principal que aparece después del inicio de sesión: fondo claro (mismo
 * estilo que el resto del sistema: barra blanca, tarjetas blancas), la pregunta "¿Consultar datos por medio
 * de?:" y cuatro tarjetas grandes para elegir el tipo de consulta.
 *
 * Rol en el sistema:
 * - "Base de Datos (configuración)" abre todo lo construido hasta ahora
 *   (Controladores RF, Eventos configurados, Unidades, Puntos IO, Grupos IO,
 *   Usuarios);
 *   App.jsx decide qué renderizar a partir de la opción elegida.
 * - "Datos en línea" abre solo el flujo de Controladores RF (controlador ->
 *   sus medidores -> detalle del medidor).
 * - "Perfiles 5 Minutales" abre la consulta de mediciones de cinco minutos
 *   de cualquier medidor (ConsultaPerfiles5M).
 * - "Eventos registrados" abre el historial de eventos ocurridos en los
 *   medidores (GestionEventosRegistrados).
 * - Incluye una barra superior con el usuario y el botón de cerrar sesión,
 *   porque en esta vista todavía no se monta el Header del sistema.
 */
import { useState } from 'react'
import ConfirmDialog from '../common/ConfirmDialog'
import { obtenerConfiguracion } from '../../config/configuracion'
import LogosInstitucionales from '../common/LogosInstitucionales'

// Íconos provisionales (SVG de trazo). Se pueden reemplazar por los definitivos
// cambiando solo estos componentes.
function IconoBaseDatos() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12" aria-hidden="true">
      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.75" />
      <path d="M4.5 5.5v6.5c0 1.52 3.36 2.75 7.5 2.75s7.5-1.23 7.5-2.75V5.5" />
      <path d="M4.5 12v6.5c0 1.52 3.36 2.75 7.5 2.75s7.5-1.23 7.5-2.75V12" />
    </svg>
  )
}

function IconoPerfiles() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12" aria-hidden="true">
      <path d="M3.5 20.5h17" />
      <path d="M6 17v-4M10 17V8M14 17v-6M18 17V5" strokeLinecap="round" />
    </svg>
  )
}

function IconoEnLinea() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12" aria-hidden="true">
      <path d="M2.5 12h4l2.5-6 4 12 2.5-6h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconoEventos() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12" aria-hidden="true">
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 2 6 2 6H4s2-1.5 2-6Z" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  )
}

// Opciones de consulta. `ruta` = dirección a la que lleva la tarjeta (ver App.jsx);
// `disponible: false` = aún sin vista (tarjeta deshabilitada).
const OPCIONES = [
  { id: 'baseDatos', ruta: '/configuracion', titulo: 'Base de Datos', detalle: '(Configuración)', Icono: IconoBaseDatos, disponible: true },
  { id: 'perfiles5M', ruta: '/perfiles-5m', titulo: 'Perfiles 5 Minutales', Icono: IconoPerfiles, disponible: true },
  { id: 'enLinea', ruta: '/en-linea', titulo: 'Datos en línea', Icono: IconoEnLinea, disponible: true },
  { id: 'eventos', ruta: '/eventos', titulo: 'Eventos registrados', Icono: IconoEventos, disponible: true },
]

// Props:
// - currentUser: usuario autenticado (nombre, apellido, rol, iniciales).
// - onSeleccionar: callback con la ruta de la opción elegida ('/configuracion', '/perfiles-5m', '/en-linea' o '/eventos').
// - onLogout: callback para cerrar la sesión y volver al Login.
export default function SeleccionConsulta({ currentUser, onSeleccionar, onLogout }) {
  // Pie de página (config.json); los logos los pone LogosInstitucionales.
  const { piePagina, tituloSistema } = obtenerConfiguracion()
  // true mientras se muestra la confirmación de "¿Cerrar sesión?".
  const [confirmandoSalida, setConfirmandoSalida] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      {/* Barra superior blanca, igual que el Header del sistema: logotipos,
          título, usuario y cerrar sesión. */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <LogosInstitucionales clasePrincipal="h-14" claseAdicional="hidden h-7 md:block" />
          <div className="hidden min-w-0 border-l border-gray-200 pl-4 leading-tight lg:block">
            <p className="truncate text-sm font-bold uppercase tracking-wide text-slate-800 sm:text-base">
              {tituloSistema}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium text-gray-800">
              {currentUser.nombre} {currentUser.apellido}
            </p>
            <p className="text-xs text-gray-500">{currentUser.rol}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {currentUser.iniciales}
          </div>
          <button
            type="button"
            onClick={() => setConfirmandoSalida(true)}
            className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Pregunta y tarjetas de opciones. */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <h1 className="mb-10 text-center text-2xl font-bold tracking-wide text-slate-800 sm:text-3xl">
          Datos a Consultar:
        </h1>

        <div className="grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {OPCIONES.map(({ id, ruta, titulo, detalle, Icono, disponible }) => (
            <button
              key={id}
              type="button"
              disabled={!disponible}
              onClick={() => onSeleccionar(ruta)}
              className="group relative flex min-h-56 cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border border-blue-400 bg-white p-8 text-center shadow-lg shadow-blue-100 transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {/* Espacio del ícono (provisional). Colores fijos; al pasar el
                  cursor la tarjeta solo se eleva. */}
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-white">
                <Icono />
              </span>
              <span className="leading-snug">
                <span className="block text-lg font-semibold text-slate-800">{titulo}</span>
                {detalle && <span className="block text-sm text-slate-500">{detalle}</span>}
              </span>
              {!disponible && (
                <span className="absolute right-3 top-3 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Próximamente
                </span>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* Pie oscuro, igual que el del resto del sistema (LayoutSistema). */}
      <footer className="border-t border-slate-800 bg-slate-900 py-2 text-center text-[11px] font-medium tracking-wide text-slate-400">
        {piePagina}
      </footer>

      <ConfirmDialog
        abierto={confirmandoSalida}
        titulo="¿Cerrar sesión?"
        mensaje="Tendrás que volver a ingresar tu correo y contraseña para entrar."
        textoConfirmar="Cerrar sesión"
        onConfirmar={onLogout}
        onCancelar={() => setConfirmandoSalida(false)}
      />
    </div>
  )
}
