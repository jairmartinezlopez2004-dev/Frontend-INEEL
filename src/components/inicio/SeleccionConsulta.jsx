/**
 * SeleccionConsulta.jsx
 * ---------------------------------------------------------------------------
 * Vista principal que aparece después del inicio de sesión: fondo oscuro, la pregunta "¿Consultar datos por medio
 * de?:" y tres tarjetas grandes para elegir el tipo de consulta.
 *
 * Rol en el sistema:
 * - "Base de Datos (configuración)" abre todo lo construido hasta ahora
 *   (Controladores RF, Eventos, Unidades, Puntos IO, Grupos IO, Usuarios);
 *   App.jsx decide qué renderizar a partir de la opción elegida.
 * - "Datos en línea" abre solo el flujo de Controladores RF (controlador ->
 *   sus medidores -> detalle del medidor).
 * - "Perfiles 5 Minutales" aún no tiene vista: se muestra deshabilitada con
 *   la etiqueta "Próximamente".
 * - Incluye una barra superior con el usuario y el botón de cerrar sesión,
 *   porque en esta vista todavía no se monta el Header del sistema.
 */
import { useState } from 'react'
import ConfirmDialog from '../common/ConfirmDialog'

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

// Opciones de consulta. `ruta` = dirección a la que lleva la tarjeta (ver App.jsx);
// `disponible: false` = aún sin vista (tarjeta deshabilitada).
const OPCIONES = [
  { id: 'baseDatos', ruta: '/configuracion', titulo: 'Base de Datos', detalle: '(configuración)', Icono: IconoBaseDatos, disponible: true },
  { id: 'perfiles5M', titulo: 'Perfiles 5 Minutales', Icono: IconoPerfiles, disponible: false },
  { id: 'enLinea', ruta: '/en-linea', titulo: 'Datos en línea', Icono: IconoEnLinea, disponible: true },
]

// Props:
// - currentUser: usuario autenticado (nombre, apellido, rol, iniciales).
// - onSeleccionar: callback con la ruta de la opción elegida ('/configuracion' o '/en-linea').
// - onLogout: callback para cerrar la sesión y volver al Login.
export default function SeleccionConsulta({ currentUser, onSeleccionar, onLogout }) {
  // true mientras se muestra la confirmación de "¿Cerrar sesión?".
  const [confirmandoSalida, setConfirmandoSalida] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      {/* Barra superior: logotipo, usuario y cerrar sesión. El logo trae fondo
          blanco, por eso va sobre una placa blanca. */}
      <header className="flex items-center justify-between gap-4 border-b border-slate-800 px-4 py-3 sm:px-8">
        <div className="rounded-md bg-white px-2 py-1">
          <img src="/logo-ineel-texto.png" alt="INEEL" className="h-10 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-medium text-white">
              {currentUser.nombre} {currentUser.apellido}
            </p>
            <p className="text-xs text-slate-400">{currentUser.rol}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {currentUser.iniciales}
          </div>
          <button
            type="button"
            onClick={() => setConfirmandoSalida(true)}
            className="cursor-pointer rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:border-red-500 hover:text-red-400"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Pregunta y tarjetas de opciones. */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <h1 className="mb-10 text-center text-2xl font-bold tracking-wide text-white sm:text-3xl">
          ¿Consultar datos por medio de?:
        </h1>

        <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {OPCIONES.map(({ id, ruta, titulo, detalle, Icono, disponible }) => (
            <button
              key={id}
              type="button"
              disabled={!disponible}
              onClick={() => onSeleccionar(ruta)}
              className="group relative flex min-h-56 cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center shadow-lg transition-all hover:-translate-y-1 hover:border-blue-500 hover:bg-slate-800/80 hover:shadow-blue-900/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-slate-700"
            >
              {/* Espacio del ícono (provisional). */}
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-700/60 text-blue-400 transition-colors group-enabled:group-hover:bg-blue-600 group-enabled:group-hover:text-white">
                <Icono />
              </span>
              <span className="leading-snug">
                <span className="block text-lg font-semibold text-white">{titulo}</span>
                {detalle && <span className="block text-sm text-slate-400">{detalle}</span>}
              </span>
              {!disponible && (
                <span className="absolute right-3 top-3 rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Próximamente
                </span>
              )}
            </button>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-800 py-2 text-center text-[11px] font-medium tracking-wide text-slate-500">
        © 2026 Instituto Nacional de Electricidad y Energías Limpias (INEEL). Visor de Calidad de la Potencia v1.0.1.
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
